import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://ReiKama414.github.io/japanese-shrine-island/
export default defineConfig({
  base: '/japanese-shrine-island/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    target: 'esnext',
    sourcemap: false
  }
});
