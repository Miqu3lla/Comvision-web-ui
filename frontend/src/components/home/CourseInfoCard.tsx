const rows: [string, string][] = [
  ['Course', 'CSST106 – Perception and Computer Vision'],
  ['Section', 'BSCS 4A'],
  ['Term', '1st Semester, A.Y. 2026–2027'],
  ['Instructor', 'Jeremy C. Reyes'],
]

export default function CourseInfoCard() {
  return (
    <section className="card p-5">
      <p className="tag mb-3">Course</p>
      <dl className="space-y-2.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-3 border-b border-dashed border-line pb-2 last:border-0 last:pb-0">
            <dt className="w-20 shrink-0 font-mono text-xs text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
