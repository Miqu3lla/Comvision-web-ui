import { useEffect, useState } from 'react'

/** Turn a File into an object URL, revoking it when the file changes or unmounts. */
export function useObjectUrl(file: File | null | undefined) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) { setUrl(null); return }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

/** Run an async call once per dependency change with loading/error state (no debounce). */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, set] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true })
  useEffect(() => {
    let live = true
    set((s) => ({ ...s, loading: true, error: null }))
    fn().then((data) => live && set({ data, error: null, loading: false }))
      .catch((e) => live && set({ data: null, error: e instanceof Error ? e.message : String(e), loading: false }))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
