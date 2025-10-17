import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
    headers: {
      // Enhanced COOP headers for Google OAuth compatibility
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept, X-Client-Version, X-Client-Name',
      'X-Frame-Options': 'SAMEORIGIN',
      'Permissions-Policy': 'interest-cohort=(), camera=(), microphone=(), geolocation=()',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'oauth': ['@react-oauth/google', 'jwt-decode'],
        },
      },
    },
  },
  define: {
    // Define API base URL for production
    __API_BASE_URL__: JSON.stringify(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
  },
})