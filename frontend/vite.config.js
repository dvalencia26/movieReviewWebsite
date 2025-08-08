import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "https://wagwebsite-backend.onrender.com",
      "uploads/": "https://wagwebsite-backend.onrender.com",
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'flowbite']
        }
      }
    }
  },
  define: {
    // Replace process.env with import.meta.env for Vite
    'process.env': 'import.meta.env'
  }
})
