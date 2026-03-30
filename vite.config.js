import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Em produção, URL do backend Railway
// Em dev, localhost
const apiUrl = process.env.VITE_API_URL || 'https://dealer-sourcing-api-production.up.railway.app'

export default defineConfig({
  plugins: [react()],
  // Injetar URL da API como variável global em tempo de build
  define: {
    __API_URL__: JSON.stringify(apiUrl),
    'process.env.VITE_API_URL': JSON.stringify(apiUrl)
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
