import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    lib: {
      entry: 'src/croissant-island.jsx',
      formats: ['es'],
      fileName: () => 'croissant-island.js',
    },
  },
});
