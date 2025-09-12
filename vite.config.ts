import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          // Create a vendor chunk for node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('@react-oauth') || id.includes('jwt-decode')) {
              return 'oauth';
            }
            // Put other node_modules in a separate chunk
            return 'deps';
          }
        },
      },
    },
  },
  define: {
    // Define API base URL for production
    __API_BASE_URL__: JSON.stringify(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
  },
})