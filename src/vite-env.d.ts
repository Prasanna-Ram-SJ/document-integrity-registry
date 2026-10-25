/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEZOS_NETWORK: string;
  readonly VITE_TEZOS_RPC_URL: string;
  readonly VITE_DOCUMENT_REGISTRY_ADDRESS: string;
  readonly VITE_DOCUMENT_REGISTRY_ADMIN_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
