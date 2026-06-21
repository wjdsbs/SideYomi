import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import manifest from './manifest.json';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [nodePolyfills(), react(), crx({ manifest })],
  resolve: {
    alias: {
      'zlibjs/bin/gunzip.min.js': resolve(__dirname, 'src/lib/gunzip-shim.ts'),
    },
  },
  optimizeDeps: {
    include: ['kuromoji'],
  },
});
