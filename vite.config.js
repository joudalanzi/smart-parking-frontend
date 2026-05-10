import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** عنوان الباك أثناء التطوير — 127.0.0.1 يقلّل مشاكل IPv6 مع localhost على ويندوز */
const API_DEV_TARGET = 'http://127.0.0.1:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: API_DEV_TARGET, changeOrigin: true },
      '/uploads': { target: API_DEV_TARGET, changeOrigin: true },
      '/health': { target: API_DEV_TARGET, changeOrigin: true },
      '/docs': { target: API_DEV_TARGET, changeOrigin: true },
      '/openapi.json': { target: API_DEV_TARGET, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: API_DEV_TARGET, changeOrigin: true },
      '/uploads': { target: API_DEV_TARGET, changeOrigin: true },
      '/health': { target: API_DEV_TARGET, changeOrigin: true },
      '/docs': { target: API_DEV_TARGET, changeOrigin: true },
      '/openapi.json': { target: API_DEV_TARGET, changeOrigin: true },
    },
  },
});
