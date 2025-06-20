import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/index.js',
      },
    },
  },
});
