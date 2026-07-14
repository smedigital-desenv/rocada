import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // base padrão = produção (/rocada/). A homologação (/teste) sobrescreve com
  // VITE_BASE=/rocada/teste/ no workflow, para o build da develop.
  base: process.env.VITE_BASE || '/rocada/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
});
