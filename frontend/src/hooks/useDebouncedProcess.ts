import { useEffect, useRef, useState } from 'react'

/**
 * Re-runs `fn` whenever `deps` change (after `delay` ms), cancelling stale requests.
 * Returns the latest result plus loading/error flags.
 */
export function useDebouncedProcess<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
  delay = 250,
  enabled = true,
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await fnRef.current(ctrl.signal)
        if (!ctrl.signal.aborted) { setData(r); setError(null) }
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, delay)
    return () => { clearTimeout(t); ctrl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled])

  return { data, loading, error }
}
