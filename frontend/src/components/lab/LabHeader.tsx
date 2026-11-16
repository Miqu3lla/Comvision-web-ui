import type { LabMeta } from '../../data/labs'

export default function LabHeader({ lab }: { lab: LabMeta }) {
  return (
    <header className="card p-6">
      <div className="flex items-start gap-4">
        <span className="font-mono text-5xl font-semibold leading-none text-accent">{String(lab.n).padStart(2, '0')}</span>
        <div>
          <p className="tag">{lab.week}</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{lab.title}</h1>
        </div>
      </div>
      <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
        <div><dt className="tag mb-1">Objective</dt><dd>{lab.objective}</dd></div>
        <div><dt className="tag mb-1">Algorithm used</dt><dd className="font-mono text-xs leading-relaxed text-muted">{lab.algorithm}</dd></div>
      </dl>
      <p className="mt-4 border-t border-dashed border-line pt-3 text-sm text-muted">
        <span className="tag mr-2">Procedure</span>Work through the steps below in order. Run each one, observe the output, then mark it done.
      </p>
    </header>
  )
}
