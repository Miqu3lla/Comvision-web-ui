// Backend URL. Empty in dev (Vite proxies /api). On GitHub Pages set VITE_API_BASE to the hosted backend.
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

/** Sample images ship with the frontend (public/samples), so they work without a backend. */
export const sampleUrl = (file: string) => `${import.meta.env.BASE_URL}samples/${file}`
