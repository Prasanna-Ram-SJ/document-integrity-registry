import { Buffer as BrowserBuffer } from 'buffer';

// Ensure Buffer is available in browser environments without overwriting Node.js native Buffer in test environments
if (typeof window !== 'undefined') {
  if (!(window as any).Buffer) {
    (window as any).Buffer = BrowserBuffer;
  }
  if (!(window as any).global) {
    (window as any).global = window;
  }
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

if (typeof globalThis !== 'undefined') {
  if (!globalThis.Buffer) {
    (globalThis as any).Buffer = BrowserBuffer;
  }
  if (!(globalThis as any).process) {
    (globalThis as any).process = { env: {} };
  }
}

export const Buffer = typeof globalThis !== 'undefined' && globalThis.Buffer ? globalThis.Buffer : BrowserBuffer;

