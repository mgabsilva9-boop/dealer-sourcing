import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  // CRÍTICO: Injetar variáveis no client-side
  define: {
    __API_URL__: JSON.stringify(apiUrl)
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiUrl,
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
