export interface DocumentRecord {
  record_id?: string;
  label: string;
  sha256: string;
  registrar: string;
  registered_at: string;
}

export interface RegisterParams {
  record_id: string;
  label: string;
  sha256: string;
}

export type VerificationOutcomeType = 'MATCH' | 'MISMATCH' | 'RECORD NOT FOUND';

export interface VerificationResult {
  outcome: VerificationOutcomeType;
  computedSha256: string;
  recordId: string;
  storedRecord?: DocumentRecord | null;
  message: string;
  fileName?: string;
  fileSize?: number;
}

export type RegistrationStep =
  | 'IDLE'
  | 'COMPUTING_HASH'
  | 'READY_TO_REGISTER'
  | 'AWAITING_APPROVAL'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'UNAUTHORIZED'
  | 'REJECTED'
  | 'DUPLICATE_ID'
  | 'FAILED';

export interface RegistrationOutcome {
  step: RegistrationStep;
  recordId?: string;
  label?: string;
  sha256?: string;
  registrar?: string;
  timestamp?: string;
  txHash?: string;
  errorMessage?: string;
}

export interface NetworkConfig {
  network: string;
  rpcUrl: string;
  contractAddress: string;
  adminAddress: string;
}

export interface DocumentCatalogEntry {
  record_id: string;
  label: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  isAdmin: boolean;
}
