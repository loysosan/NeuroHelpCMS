import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Проксіруємо всі виклики, що починаються з /api, на Go-API-сервіс (ім'я сервісу "api" у docker-compose)
      '/api': {
        target: 'http://api:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});