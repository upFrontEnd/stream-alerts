import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    open: true,
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
