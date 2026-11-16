// Tiny fetch helpers shared by the per-lab API files.
import { API_BASE } from './base'
export type Params = Record<string, string | number | boolean | Blob | undefined>

/** POST multipart/form-data and parse the JSON response (throws a readable Error). */
export async function post<T>(path: string, fields: Params, signal?: AbortSignal): Promise<T> {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue
    if (v instanceof Blob) form.append(k, v, (v as File).name || `${k}.png`)
    else form.append(k, String(v))
  }
  return handle<T>(await fetch(API_BASE + path, { method: 'POST', body: form, signal }))
}

export async function get<T>(path: string): Promise<T> {
  return handle<T>(await fetch(API_BASE + path))
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      const j = await res.json()
      if (j.detail) msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
    } catch { /* body was not JSON */ }
    throw new Error(msg)
  }
  return res.json()
}

/** Convert a data URL (from the API) back into a File so it can be re-uploaded. */
export async function dataUrlToFile(url: string, name = 'image.png'): Promise<File> {
  const blob = await (await fetch(url)).blob()
  return new File([blob], name, { type: blob.type })
}

export async function urlToFile(url: string, name: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Could not load sample image. Is the backend running?')
  return new File([await res.blob()], name, { type: 'image/png' })
}

export function downloadDataUrl(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
}
