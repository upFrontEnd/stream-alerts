import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    open: true,
  },
  css: {
    devSourcemap: true,
  },
  build: {
    outDir: 'dist',
  },
});
