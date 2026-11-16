import { useLabProgress } from '../../hooks/useLabProgress'

export default function ProgressSummary() {
  const { labsDone, totalDone, totalSteps, reset } = useLabProgress()
  const pct = Math.round((totalDone / totalSteps) * 100)
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="tag">Progress</p>
        <span className="font-mono text-xl font-semibold">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-panel2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted">{labsDone} of 7 labs · {totalDone} of {totalSteps} steps</p>
      {totalDone > 0 && (
        <button className="mt-3 text-xs text-muted underline-offset-2 hover:text-hot hover:underline"
          onClick={() => confirm('Reset all progress, observations and conclusions?') && reset()}>
          Reset progress
        </button>
      )}
    </section>
  )
}
