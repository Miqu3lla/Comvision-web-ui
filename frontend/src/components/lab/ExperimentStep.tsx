import type { ReactNode } from 'react'
import { useLabProgress } from '../../hooks/useLabProgress'

interface Props {
  lab: number; id: string; index: number; title: string; instruction: string
  locked: boolean; current: boolean; children: ReactNode; runLabel?: string
}

/**
 * One experiment step. The output stays hidden until the user clicks "Run step";
 * "Mark step done" then unlocks the next step.
 */
export default function ExperimentStep({ lab, id, index, title, instruction, locked, current, children, runLabel = 'Run step' }: Props) {
  const { isDone, hasRun, markRan, markDone, unmark } = useLabProgress()
  const done = isDone(lab, id), ran = hasRun(lab, id) || done

  if (locked) {
    return (
      <section id={id} className="card scroll-mt-32 border-dashed p-4 opacity-60">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-line font-mono text-xs text-muted">{index}</span>
          <div><h2 className="font-medium">{title}</h2><p className="tag">Locked · mark the previous step done first</p></div>
        </div>
      </section>
    )
  }
  return (
    <section id={id} className={`card scroll-mt-32 p-5 ${current ? 'ring-1 ring-accent' : ''}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-xs
          ${done ? 'border-accent bg-accent text-[#04120f]' : 'border-accent text-accent'}`}>{done ? '✓' : index}</span>
        <div className="flex-1">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted">{instruction}</p>
        </div>
        {done && <button className="tag hover:text-hot" onClick={() => unmark(lab, id)}>undo</button>}
      </div>
      <div className="mt-4">
        {ran ? children : <button className="btn btn-primary" onClick={() => markRan(lab, id)}>▶ {runLabel}</button>}
      </div>
      {ran && !done && (
        <div className="mt-5 flex justify-end border-t border-dashed border-line pt-4">
          <button className="btn btn-primary" onClick={() => markDone(lab, id)}>Mark step done ✓</button>
        </div>
      )}
    </section>
  )
}
