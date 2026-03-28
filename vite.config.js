import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    'process.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://dealer-sourcing-backend.onrender.com')
    ),
  }
})
