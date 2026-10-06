import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.join(path.dirname(fileURLToPath(import.meta.url)), 'src') } },
  server: { host: '127.0.0.1', port: 3000 },
  build: { rolldownOptions: { output: { manualChunks: id => {
    if (id.includes('/node_modules/recharts/')) return 'charts';
    if (/\/node_modules\/jspdf(?:-autotable)?\//.test(id)) return 'pdf';
  } } } },
});
