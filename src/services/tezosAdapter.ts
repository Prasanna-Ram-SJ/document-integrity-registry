import '../polyfills/buffer';
import { TezosToolkit } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { NetworkType } from '@airgap/beacon-dapp';
import { TempleWallet } from '@temple-wallet/dapp';
import { TEZOS_CONFIG, isContractConfigured } from '../config/tezos';
import {
  DocumentRecord,
  RegisterParams,
  VerificationResult,
  RegistrationOutcome,
} from '../types/registry';
import { isValidSha256 } from './crypto';

// Singleton instance of TezosToolkit for read-only RPC queries and contract operations
let tezosInstance: TezosToolkit | null = null;
let walletInstance: BeaconWallet | null = null;
let templeInstance: TempleWallet | null = null;
let activeWalletType: 'temple' | 'beacon' | null = null;

export function getTezosToolkit(): TezosToolkit {
  if (!tezosInstance) {
    tezosInstance = new TezosToolkit(TEZOS_CONFIG.rpcUrl);
  }
  return tezosInstance;
}

export function getBeaconWallet(): BeaconWallet {
  if (!walletInstance) {
    const networkType =
      'SHADOWNET' in NetworkType
        ? (NetworkType as unknown as Record<string, NetworkType>)['SHADOWNET']
        : NetworkType.CUSTOM;

    walletInstance = new BeaconWallet({
      name: 'D.A.R.T',
      preferredNetwork: networkType,
      network: {
        type: networkType,
        name: 'Tezos Shadownet',
        rpcUrl: TEZOS_CONFIG.rpcUrl,
      },
    });
    getTezosToolkit().setWalletProvider(walletInstance);
  }
  return walletInstance;
}

/**
 * Normalizes the SmartPy option result for get_record.
 * In SmartPy/Michelson, an option returns either None (null / undefined / { None: [] })
 * or Some with { label, sha256, registrar, registered_at }.
 */
export function normalizeRecordOption(raw: unknown, recordId: string): DocumentRecord | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  let val: unknown = raw;

  // Unwrap Michelson option representation if present
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    // Check for explicit Michelson None
    if ('None' in obj && Object.keys(obj).length === 1) {
      return null;
    }
    // Check for explicit Michelson Some wrapper
    if ('Some' in obj) {
      val = obj.Some;
      if (val === null || val === undefined) {
        return null;
      }
    }
  }

  if (typeof val !== 'object' || val === null) {
    return null;
  }

  const r = val as Record<string, unknown>;

  // SmartPy contract field names: label, sha256, registrar, registered_at
  const label = typeof r.label === 'string' ? r.label : String(r.label ?? '');
  const sha256 =
    typeof r.sha256 === 'string'
      ? r.sha256.toLowerCase().trim()
      : String(r.sha256 ?? '').toLowerCase().trim();
  const registrar = typeof r.registrar === 'string' ? r.registrar : String(r.registrar ?? '');

  let registered_at = '';
  if (typeof r.registered_at === 'string') {
    registered_at = r.registered_at;
  } else if (typeof r.registeredAt === 'string') {
    registered_at = r.registeredAt;
  } else if (r.registered_at) {
    registered_at = String(r.registered_at);
  }

  // A valid record must contain a 64-character SHA-256 fingerprint
  if (!sha256 || !isValidSha256(sha256)) {
    return null;
  }

  return {
    record_id: recordId,
    label,
    sha256,
    registrar,
    registered_at,
  };
}

/**
 * Compares computed fingerprint with stored record to produce exactly one of:
 * - MATCH: record exists and fingerprints are equal.
 * - MISMATCH: record exists and fingerprints differ.
 * - RECORD NOT FOUND: no record exists for the ID.
 */
export function evaluateVerification(
  recordId: string,
  computedSha256: string,
  storedRecord: DocumentRecord | null
): VerificationResult {
  const normalizedComputed = computedSha256.toLowerCase().trim();

  if (!storedRecord) {
    return {
      outcome: 'RECORD NOT FOUND',
      recordId,
      computedSha256: normalizedComputed,
      storedRecord: null,
      message: `No record was found for Record ID "${recordId}". Please check the ID and try again.`,
    };
  }

  const storedSha256 = storedRecord.sha256.toLowerCase().trim();

  if (normalizedComputed === storedSha256) {
    return {
      outcome: 'MATCH',
      recordId,
      computedSha256: normalizedComputed,
      storedRecord,
      message: 'The selected file matches the fingerprint registered under this record ID.',
    };
  } else {
    return {
      outcome: 'MISMATCH',
      recordId,
      computedSha256: normalizedComputed,
      storedRecord,
      message: 'The selected file differs from the registered version associated with this record ID.',
    };
  }
}

/**
 * Read-only on-chain view query.
 * Calls get_record(record_id).
 * Does not require a wallet connection, signature, or tez.
 */
export async function fetchRecordFromChain(recordId: string): Promise<DocumentRecord | null> {
  if (!isContractConfigured()) {
    throw new Error('Contract not configured. Please specify a valid Shadownet KT1 address.');
  }

  const tezos = getTezosToolkit();
  const contract = await tezos.contract.at(TEZOS_CONFIG.contractAddress);

  try {
    let rawResult: unknown = null;
    if (contract.contractViews && typeof contract.contractViews.get_record === 'function') {
      rawResult = await contract.contractViews.get_record(recordId).executeView({
        viewCaller: contract.address,
      });
    } else if (contract.views && typeof contract.views.get_record === 'function') {
      rawResult = await contract.views.get_record(recordId).read();
    } else {
      throw new Error(
        `Contract at ${TEZOS_CONFIG.contractAddress} does not expose the required 'get_record' on-chain view.`
      );
    }
    return normalizeRecordOption(rawResult, recordId);
  } catch (err: unknown) {
    // If the contract view reverts because the record does not exist or view fails
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('None') ||
      errorMessage.includes('NO_RECORD')
    ) {
      return null;
    }
    // Re-throw RPC / network connectivity errors
    throw err;
  }
}

export const EXPLICIT_DISCONNECT_STORAGE_KEY = 'dart_wallet_explicitly_disconnected';

export function isWalletExplicitlyDisconnected(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(EXPLICIT_DISCONNECT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setWalletExplicitlyDisconnected(disconnected: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (disconnected) {
      window.localStorage.setItem(EXPLICIT_DISCONNECT_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(EXPLICIT_DISCONNECT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or security errors in sandboxed contexts
  }
}

/**
 * Connect to wallet using Beacon wallet selection modal.
 * Always opens Beacon so the user can choose their wallet.
 * Intercepts and fixes the "Use Extension" action when Temple Wallet is selected,
 * requesting permission on Shadownet and updating connected state.
 */
export async function connectWallet(): Promise<{ address: string; isAdmin: boolean }> {
  // Clear any remembered disconnected state when the user explicitly clicks Connect Wallet
  setWalletExplicitlyDisconnected(false);
  const wallet = getBeaconWallet();

  let cleanupListeners: (() => void) | undefined;
  let isSettled = false;

  return new Promise<{ address: string; isAdmin: boolean }>((resolve, reject) => {
    const safeResolve = (res: { address: string; isAdmin: boolean }) => {
      if (isSettled) return;
      isSettled = true;
      if (cleanupListeners) cleanupListeners();
      resolve(res);
    };

    const safeReject = (err: unknown) => {
      if (isSettled) return;
      isSettled = true;
      if (cleanupListeners) cleanupListeners();
      reject(err);
    };

    // Handler when user selects Temple Wallet in Beacon and clicks "Use Extension"
    const handleTempleExtensionConnect = async () => {
      try {
        const isTempleAvailable = await TempleWallet.isAvailable().catch(() => false);
        if (!isTempleAvailable) {
          throw new Error(
            'Temple Wallet extension was not detected in this browser. Please ensure it is installed and unlocked.'
          );
        }

        const temple = new TempleWallet('D.A.R.T');
        await temple.connect(
          {
            name: 'shadownet',
            rpc: TEZOS_CONFIG.rpcUrl,
          },
          { forcePermission: true }
        );

        const address = await temple.getPKH();
        getTezosToolkit().setWalletProvider(temple as any);
        templeInstance = temple;
        activeWalletType = 'temple';

        // Close Beacon modal from the DOM
        if (typeof document !== 'undefined') {
          document.querySelectorAll('beacon-alert').forEach((el) => el.remove());
        }

        const isAdmin = TEZOS_CONFIG.adminAddress
          ? address.toLowerCase() === TEZOS_CONFIG.adminAddress.toLowerCase()
          : true;

        safeResolve({ address, isAdmin });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('NotGranted') ||
          msg.includes('Permission not granted') ||
          msg.includes('declined') ||
          msg.includes('cancelled') ||
          msg.includes('User rejected')
        ) {
          safeReject(new Error('Connection request was declined in Temple wallet.'));
        } else {
          safeReject(err);
        }
      }
    };

    // Attach click interceptor and UI observer for Beacon modal
    if (typeof window !== 'undefined') {
      const clickHandler = async (event: MouseEvent) => {
        const path = event.composedPath ? event.composedPath() : [];
        for (const el of path) {
          if (el instanceof HTMLElement) {
            const text = el.textContent?.trim().toLowerCase();
            if (
              text === 'use extension' ||
              (el.tagName === 'BUTTON' && text?.includes('use extension'))
            ) {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              await handleTempleExtensionConnect();
              return;
            }
          }
        }
      };

      const patchBeaconUI = async () => {
        const beaconAlert = document.querySelector('beacon-alert');
        if (!beaconAlert || !beaconAlert.shadowRoot) return;

        const shadow = beaconAlert.shadowRoot;
        const isTemple = await TempleWallet.isAvailable().catch(() => false);
        if (!isTemple) return;

        const wrappers = shadow.querySelectorAll('.info-wrapper');
        wrappers.forEach((wrapper) => {
          const title = wrapper.querySelector('.info-title')?.textContent?.toLowerCase() || '';
          if (title.includes('temple')) {
            const btn = wrapper.querySelector('button');
            if (btn && btn.textContent?.toLowerCase().includes('install')) {
              btn.textContent = 'Use Extension';
            }
            const desc = wrapper.querySelector('.info-description');
            if (desc && desc.textContent?.toLowerCase().includes('install')) {
              desc.textContent = 'Please connect below to use your Temple Wallet browser extension.';
            }
            const titleEl = wrapper.querySelector('.info-title');
            if (titleEl && titleEl.textContent?.toLowerCase().includes('install')) {
              titleEl.textContent = 'Connect with Temple Browser Extension';
            }
          }
        });
      };

      window.addEventListener('click', clickHandler, true);

      const observer = new MutationObserver(() => {
        patchBeaconUI();
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
      patchBeaconUI();

      cleanupListeners = () => {
        window.removeEventListener('click', clickHandler, true);
        observer.disconnect();
      };
    }

    // Set timeout to prevent hanging forever
    const timeoutHandle = setTimeout(() => {
      safeReject(
        new Error(
          'Wallet connection request timed out. Please ensure your wallet extension is installed, unlocked, and connected to Tezos Shadownet.'
        )
      );
    }, 60000);

    // Call Beacon's standard requestPermissions() to show the Beacon selection modal
    wallet
      .requestPermissions()
      .then(async () => {
        clearTimeout(timeoutHandle);
        const address = await wallet.getPKH();
        getTezosToolkit().setWalletProvider(wallet);
        activeWalletType = 'beacon';
        const isAdmin = TEZOS_CONFIG.adminAddress
          ? address.toLowerCase() === TEZOS_CONFIG.adminAddress.toLowerCase()
          : true;
        safeResolve({ address, isAdmin });
      })
      .catch((err: unknown) => {
        clearTimeout(timeoutHandle);
        // If Temple was connected via "Use Extension", safeResolve was already called so this is ignored
        if (!isSettled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (
            msg.includes('Declined') ||
            msg.includes('ABORTED') ||
            msg.includes('User rejected') ||
            msg.includes('cancelled')
          ) {
            safeReject(new Error('Wallet connection was declined or cancelled.'));
          } else {
            safeReject(err);
          }
        }
      });
  });
}

// Keep connectTempleWallet as alias for backward compatibility
export const connectTempleWallet = connectWallet;

/**
 * Disconnect active wallet session.
 */
export async function disconnectWallet(): Promise<void> {
  // Remember that the user explicitly chose to disconnect across reloads
  setWalletExplicitlyDisconnected(true);

  if (activeWalletType === 'temple') {
    templeInstance = null;
    activeWalletType = null;
  }
  if (walletInstance) {
    await walletInstance.clearActiveAccount();
    walletInstance = null;
    activeWalletType = null;
  }
}

export const disconnectTempleWallet = disconnectWallet;

/**
 * Check existing active account without triggering permissions popup.
 */
export async function checkActiveWalletAccount(): Promise<{
  address: string | null;
  isAdmin: boolean;
}> {
  // If the user explicitly disconnected, do not automatically restore the previous session
  if (isWalletExplicitlyDisconnected()) {
    return { address: null, isAdmin: false };
  }

  try {
    const isTempleAvailable = await TempleWallet.isAvailable();
    if (isTempleAvailable) {
      const currentPerm = await TempleWallet.getCurrentPermission();
      if (currentPerm && currentPerm.pkh) {
        const temple = new TempleWallet('D.A.R.T', currentPerm);
        getTezosToolkit().setWalletProvider(temple as any);
        templeInstance = temple;
        activeWalletType = 'temple';
        const address = currentPerm.pkh;
        const isAdmin = TEZOS_CONFIG.adminAddress
          ? address.toLowerCase() === TEZOS_CONFIG.adminAddress.toLowerCase()
          : true;
        return { address, isAdmin };
      }
    }
  } catch {
    // Ignore error checking Temple
  }

  try {
    const wallet = getBeaconWallet();
    const activeAccount = await wallet.client.getActiveAccount();
    if (activeAccount && activeAccount.address) {
      const address = activeAccount.address;
      activeWalletType = 'beacon';
      const isAdmin = TEZOS_CONFIG.adminAddress
        ? address.toLowerCase() === TEZOS_CONFIG.adminAddress.toLowerCase()
        : true;
      return { address, isAdmin };
    }
  } catch {
    // Beacon client may not be initialized yet
  }
  return { address: null, isAdmin: false };
}

/**
 * Registers a document on the Shadownet contract.
 * Write entrypoint: register
 * Parameters: record_id, label, sha256 (all strings)
 * Enforces admin requirement on chain.
 */
export async function registerDocumentOnChain(
  params: RegisterParams
): Promise<RegistrationOutcome> {
  if (!isContractConfigured()) {
    return {
      step: 'FAILED',
      errorMessage:
        'Contract not configured. Live-chain registration requires a deployed Shadownet KT1 address.',
    };
  }

  let activeAddress: string | null = null;
  if (activeWalletType === 'temple' && templeInstance) {
    activeAddress = await templeInstance.getPKH();
  } else {
    const wallet = getBeaconWallet();
    const activeAccount = await wallet.client.getActiveAccount();
    activeAddress = activeAccount?.address ?? null;
  }

  if (!activeAddress) {
    return {
      step: 'FAILED',
      errorMessage: 'Wallet not connected. Please connect your wallet on Tezos Shadownet.',
    };
  }

  // Pre-check admin address if configured in environment
  if (
    TEZOS_CONFIG.adminAddress &&
    activeAddress.toLowerCase() !== TEZOS_CONFIG.adminAddress.toLowerCase()
  ) {
    return {
      step: 'UNAUTHORIZED',
      registrar: activeAddress,
      errorMessage: 'This wallet is not authorized to register documents. Please connect an authorized registrar wallet.',
    };
  }

  const tezos = getTezosToolkit();

  try {
    const contract = await tezos.wallet.at(TEZOS_CONFIG.contractAddress);

    // Call entrypoint: register with exact named fields: record_id, label, sha256
    let op;
    if (contract.methodsObject && typeof contract.methodsObject.register === 'function') {
      op = await contract.methodsObject
        .register({
          record_id: params.record_id,
          label: params.label,
          sha256: params.sha256,
        })
        .send();
    } else if (contract.methodsObject && typeof contract.methodsObject.default === 'function') {
      op = await contract.methodsObject
        .default({
          record_id: params.record_id,
          label: params.label,
          sha256: params.sha256,
        })
        .send();
    } else if (contract.methods && typeof contract.methods.register === 'function') {
      op = await contract.methods.register(params.label, params.record_id, params.sha256).send();
    } else if (contract.methods && typeof contract.methods.default === 'function') {
      op = await contract.methods.default(params.label, params.record_id, params.sha256).send();
    } else {
      return {
        step: 'FAILED',
        errorMessage: `Contract at ${TEZOS_CONFIG.contractAddress} does not expose the required 'register' entrypoint.`,
      };
    }

    const txHash = op.opHash;

    // Await on-chain confirmation (1 block)
    const confirmation = await op.confirmation(1);

    if (confirmation !== undefined && confirmation !== null) {
      return {
        step: 'CONFIRMED',
        recordId: params.record_id,
        label: params.label,
        sha256: params.sha256,
        registrar: activeAddress,
        timestamp: new Date().toISOString(),
        txHash,
      };
    } else {
      return {
        step: 'FAILED',
        errorMessage: 'Transaction failed to confirm on Tezos Shadownet.',
        txHash,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // User rejected the signature request in wallet
    if (
      message.includes('Declined') ||
      message.includes('ABORTED') ||
      message.includes('User rejected') ||
      message.includes('NOT_GRANTED')
    ) {
      return {
        step: 'REJECTED',
        errorMessage: 'Transaction was declined in wallet.',
      };
    }

    // Contract authorization failure on chain
    if (
      message.includes('UNAUTHORIZED') ||
      message.includes('NOT_ADMIN') ||
      message.includes('admin')
    ) {
      return {
        step: 'UNAUTHORIZED',
        registrar: activeAddress,
        errorMessage: 'This wallet is not authorized to register documents. Please connect an authorized registrar wallet.',
      };
    }

    // Duplicate record ID error
    if (
      message.includes('RECORD_EXISTS') ||
      message.includes('DUPLICATE') ||
      message.includes('already exists')
    ) {
      return {
        step: 'DUPLICATE_ID',
        errorMessage: 'A document with this Record ID is already registered.',
      };
    }

    return {
      step: 'FAILED',
      errorMessage: `Registration failed: ${message}`,
    };
  }
}
