/**
 * Browser crypto polyfill for ESM packages (such as @airgap/beacon-ui)
 * that contain side-effect imports of Node's built-in 'crypto' module.
 */
const browserCrypto = typeof window !== 'undefined' ? window.crypto : undefined;

export default browserCrypto;
export const webcrypto = typeof window !== 'undefined' ? window.crypto : undefined;

export function getRandomValues<T extends ArrayBufferView | null>(array: T): T {
  if (typeof window !== 'undefined' && window.crypto && array) {
    return window.crypto.getRandomValues(array as any);
  }
  return array;
}

export function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  }
  return bytes;
}
