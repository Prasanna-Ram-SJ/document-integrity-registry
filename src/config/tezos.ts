import { NetworkConfig } from '../types/registry';

export const TEZOS_CONFIG: NetworkConfig = {
  network: import.meta.env.VITE_TEZOS_NETWORK || 'shadownet',
  rpcUrl: import.meta.env.VITE_TEZOS_RPC_URL || 'https://rpc.shadownet.teztnets.com',
  contractAddress: (import.meta.env.VITE_DOCUMENT_REGISTRY_ADDRESS || '').trim(),
  adminAddress: (import.meta.env.VITE_DOCUMENT_REGISTRY_ADMIN_ADDRESS || '').trim(),
};

/**
 * Checks if the contract address is configured.
 * Does not accept mock or simulated KT1 addresses.
 */
export function isContractConfigured(): boolean {
  return (
    typeof TEZOS_CONFIG.contractAddress === 'string' &&
    TEZOS_CONFIG.contractAddress.length > 0 &&
    TEZOS_CONFIG.contractAddress.startsWith('KT1')
  );
}

/**
 * Checks if the admin address is configured.
 */
export function isAdminConfigured(): boolean {
  return (
    typeof TEZOS_CONFIG.adminAddress === 'string' &&
    TEZOS_CONFIG.adminAddress.length > 0 &&
    (TEZOS_CONFIG.adminAddress.startsWith('tz1') ||
      TEZOS_CONFIG.adminAddress.startsWith('tz2') ||
      TEZOS_CONFIG.adminAddress.startsWith('tz3'))
  );
}
