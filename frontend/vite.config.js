import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
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
