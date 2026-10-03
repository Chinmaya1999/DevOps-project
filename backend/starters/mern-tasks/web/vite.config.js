import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// While developing (npm run dev), forward /api calls to the API running on your computer.
// In production, Nginx does the same job (see nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
  },
});
