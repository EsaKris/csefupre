import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Local only: forward /api to scripts/dev-api.ts. On Vercel, /api is served by serverless functions. */
const devApiProxy = {
  '/api': { target: 'http://localhost:3001', changeOrigin: false, xfwd: true },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: devApiProxy },
  preview: { proxy: devApiProxy },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
