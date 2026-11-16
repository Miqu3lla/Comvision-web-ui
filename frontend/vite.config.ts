import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The FastAPI backend runs on :8000; in dev, proxy API calls to it.
// For GitHub Pages the workflow sets VITE_BASE=/<repo-name>/ and VITE_API_BASE=<backend url>.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
})
