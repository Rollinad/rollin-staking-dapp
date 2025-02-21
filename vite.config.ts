// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Remove proxy configuration as it's not needed for client-side routing
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})