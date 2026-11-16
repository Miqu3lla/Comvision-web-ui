import { useState } from 'react'

/** Drag the divider: left shows `before`, right shows `after`. Both images must share an aspect ratio. */
export default function BeforeAfterSlider({ before, after, labels = ['Before', 'After'] }:
  { before: string; after: string; labels?: [string, string] }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="card overflow-hidden">
      <div className="img-frame relative select-none">
        <img src={after} alt={labels[1]} className="mx-auto block max-h-96 w-full object-contain" />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={before} alt={labels[0]} className="mx-auto block max-h-96 w-full object-contain" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-hot" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-hot bg-panel" />
        </div>
        <span className="tag absolute left-2 top-2 rounded bg-panel/80 px-1.5">{labels[0]}</span>
        <span className="tag absolute right-2 top-2 rounded bg-panel/80 px-1.5">{labels[1]}</span>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare" className="block px-3 py-2" />
    </div>
  )
}
