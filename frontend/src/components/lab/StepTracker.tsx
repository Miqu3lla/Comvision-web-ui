import type { Step } from '../../data/labs'

interface Props { steps: Step[]; isDone: (id: string) => boolean; current: string; onPick: (id: string) => void }

/** Horizontal 1 → 2 → 3 tracker; done steps are filled, the current step is ringed. */
export default function StepTracker({ steps, isDone, current, onPick }: Props) {
  return (
    <nav className="card sticky top-14 z-20 overflow-x-auto p-3" aria-label="Steps">
      <ol className="flex min-w-max items-center gap-1">
        {steps.map((s, i) => {
          const done = isDone(s.id), cur = s.id === current
          return (
            <li key={s.id} className="flex items-center gap-1">
              <button onClick={() => onPick(s.id)} title={s.title}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-panel2 ${cur ? 'bg-accent-soft' : ''}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-full border font-mono text-[10px]
                  ${done ? 'border-accent bg-accent text-[#04120f]' : cur ? 'border-accent text-accent' : 'border-line text-muted'}`}>
                  {done ? '✓' : i + 1}
                </span>
                <span className={cur ? 'font-medium' : 'text-muted'}>{s.title}</span>
              </button>
              {i < steps.length - 1 && <span className="h-px w-3 bg-line" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
