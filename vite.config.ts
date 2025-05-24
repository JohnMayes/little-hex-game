import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@littlejs': '/src/lib/littlejs.esm.js',
    },
  },
});
