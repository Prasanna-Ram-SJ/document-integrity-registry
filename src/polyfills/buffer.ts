import { Buffer as BrowserBuffer } from 'buffer';

// Ensure Buffer, global, and process are available in browser environments without overwriting Node.js native Buffer in test environments
if (typeof window !== 'undefined') {
  if (!(window as any).Buffer) {
    (window as any).Buffer = BrowserBuffer;
  }
  if (!(window as any).global) {
    (window as any).global = window;
  }
  if (!(window as any).process) {
    (window as any).process = { env: {}, browser: true, version: '' };
  } else {
    if (!(window as any).process.env) (window as any).process.env = {};
    (window as any).process.browser = true;
    if (typeof (window as any).process.version !== 'string') {
      (window as any).process.version = '';
    }
  }
}

if (typeof globalThis !== 'undefined') {
  if (!globalThis.Buffer) {
    globalThis.Buffer = BrowserBuffer;
  }
  if (!(globalThis as any).global) {
    (globalThis as any).global = globalThis;
  }
  if (!(globalThis as any).process) {
    (globalThis as any).process = { env: {}, browser: true, version: '' };
  } else {
    if (!(globalThis as any).process.env) (globalThis as any).process.env = {};
    (globalThis as any).process.browser = true;
    if (typeof (globalThis as any).process.version !== 'string') {
      (globalThis as any).process.version = '';
    }
  }
}

export const Buffer = typeof globalThis !== 'undefined' && globalThis.Buffer ? globalThis.Buffer : BrowserBuffer;
