import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            // Whether to polyfill `node:` protocol imports.
            protocolImports: true,
        }),
    ],
    envDir: '../',
    server: {
        port: 5173,
        open: true
    },
    build: {
        target: 'esnext',
        outDir: 'dist'
    },
    optimizeDeps: {
        exclude: ['snarkjs'],
        esbuildOptions: {
            target: 'esnext'
        }
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    }
});
