import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 34521,
    allowedHosts: ['emerald-fr-tn.groo.bot'],
    proxy: {
      '/api': 'http://localhost:47832',
    },
  },
})
