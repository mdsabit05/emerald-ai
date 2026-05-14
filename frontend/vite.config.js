import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor';
          }
          if (id.includes('@clerk')) return 'clerk';
          if (id.includes('recharts')) return 'charts';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 34521,
    allowedHosts: ['emerald-fr-tn.groo.bot'],
    proxy: {
      '/api': 'http://localhost:47832',
    },
  },
})
