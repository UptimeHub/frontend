import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/gateway': {
        target: 'http://84.247.166.242:8899',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/gateway/, ''),
      },
      '/keycloak': {
        target: 'http://84.247.166.242:8080',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/keycloak/, ''),
      },
    },
  },
})
