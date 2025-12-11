import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ADDED CONFIGURATION ---
  server: {
    port: 5173, // Default Vite port
    proxy: {
      // Redirects all requests starting with /api to the Docker backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  // -------------------------
})