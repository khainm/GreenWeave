import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sitemap from 'vite-plugin-sitemap';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sitemap({
      hostname: 'https://greenweave.vn',
      dynamicRoutes: [
        '/',
        '/about',
        '/products',
        '/contact',
        '/cart',
        '/checkout',
      ],
      changefreq: 'daily',
      priority: 0.8,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7146',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['@heroicons/react'],
          canvas: ['konva', 'react-konva', 'use-image'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
