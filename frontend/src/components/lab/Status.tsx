/** Loading / error line for any API-backed output. */
export default function Status({ loading, error }: { loading?: boolean; error?: string | null }) {
  if (error) return <p role="alert" className="rounded-md border border-hot/40 bg-hot/10 px-3 py-2 text-sm text-hot">⚠ {error}</p>
  if (loading) return <p className="tag animate-pulse">Processing…</p>
  return null
}
