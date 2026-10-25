/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Tezos Beacon and Taquito require global / process definitions in browser
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      crypto: path.resolve(__dirname, 'src/polyfills/crypto.ts'),
    },
  },
  test: {
    environment: 'jsdom',
  },
});
