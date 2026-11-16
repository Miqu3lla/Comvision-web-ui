/** Segmentation overlay image plus a class colour legend. */
export default function MaskOverlay({ src, classes }: { src: string; classes: { id: number; name: string; color: number[]; pixels: number }[] }) {
  const total = classes.reduce((a, c) => a + c.pixels, 0) || 1
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_220px]">
      <div className="card img-frame overflow-hidden"><img src={src} alt="Segmentation overlay" className="max-h-96 w-full object-contain" /></div>
      <ul className="card space-y-1.5 p-3 text-sm">
        <li className="tag">Classes found</li>
        {classes.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-sm border border-line" style={{ background: `rgb(${c.color.join(',')})` }} />
            <span className="flex-1">{c.name}</span>
            <span className="font-mono text-xs text-muted">{((c.pixels / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
