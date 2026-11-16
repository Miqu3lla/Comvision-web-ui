import { Link } from 'react-router-dom'
import type { LabMeta } from '../../data/labs'
import type { LabStatus } from '../../hooks/useLabProgress'

const label: Record<LabStatus, string> = { 'not-started': 'Not started', 'in-progress': 'In progress', done: 'Done' }
const ring: Record<LabStatus, string> = {
  'not-started': 'border-line text-muted bg-panel',
  'in-progress': 'border-accent text-accent bg-panel',
  done: 'border-accent bg-accent text-[#04120f]',
}

export default function LabRoadmapNode({ lab, status, done }: { lab: LabMeta; status: LabStatus; done: number }) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      <span className="absolute left-[17px] top-9 h-[calc(100%-2rem)] w-px bg-line last:hidden" aria-hidden />
      <span className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 font-mono text-sm font-semibold ${ring[status]}`}>{lab.n}</span>
      <Link to={`/lab/${lab.n}`} className="group card flex-1 p-4 transition-colors hover:border-accent">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold group-hover:text-accent">{lab.title}</h3>
          <span className="tag">{lab.week}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{lab.objective}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel2">
            <div className="h-full bg-accent" style={{ width: `${(done / lab.steps.length) * 100}%` }} />
          </div>
          <span className="font-mono text-[11px] text-muted">{label[status]} · {done}/{lab.steps.length}</span>
        </div>
      </Link>
    </li>
  )
}
