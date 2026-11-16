import { NavLink } from 'react-router-dom'
import { LABS } from '../../data/labs'
import { useLabProgress } from '../../hooks/useLabProgress'

const dot: Record<string, string> = {
  'not-started': 'border-line text-muted',
  'in-progress': 'border-accent text-accent',
  done: 'border-accent bg-accent text-[#04120f]',
}

/** Compact list of the 7 labs, shown beside every lab page. */
export default function LabSidebar() {
  const { status, doneCount } = useLabProgress()
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-20 card p-2">
        <p className="tag px-2 pb-2 pt-1">Labs</p>
        {LABS.map((l) => (
          <NavLink key={l.n} to={`/lab/${l.n}`}
            className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-2 py-2 text-sm ${isActive ? 'bg-accent-soft' : 'hover:bg-panel2'}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full border font-mono text-xs ${dot[status(l.n)]}`}>{l.n}</span>
            <span className="flex-1 leading-tight">{l.title}</span>
            <span className="font-mono text-[10px] text-muted">{doneCount(l.n)}/{l.steps.length}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
