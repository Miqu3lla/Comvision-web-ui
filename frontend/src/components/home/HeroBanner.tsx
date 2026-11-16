import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ContinueButton from './ContinueButton'

/** Decorative: a tiny pixel grid with an "edge" running through it. */
function PixelArt() {
  const cells = Array.from({ length: 64 }, (_, i) => {
    const x = i % 8, y = Math.floor(i / 8)
    const edge = Math.abs(x - y) <= 0
    const v = x + y > 7 ? 0.85 : 0.2
    return { edge, v }
  })
  return (
    <div className="grid w-40 shrink-0 grid-cols-8 gap-[3px] rounded-lg border border-line bg-panel p-2" aria-hidden>
      {cells.map((c, i) => (
        <span key={i} className="aspect-square rounded-[2px]"
          style={{ background: c.edge ? 'var(--hot)' : `color-mix(in srgb, var(--accent) ${Math.round(c.v * 70)}%, var(--panel-2))` }} />
      ))}
    </div>
  )
}

export default function HeroBanner() {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="card flex flex-col items-start justify-between gap-6 p-7 md:flex-row md:items-center">
      <div className="max-w-xl">
        <p className="tag mb-3">CSST106 · 7 labs · hands-on</p>
        <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
          Run the experiment.<br /><span className="text-accent">See the pixels.</span>
        </h1>
        <p className="mt-4 text-muted">Work through each laboratory step by step with real OpenCV, PCA and YOLO output. No quizzes, only experiments.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/lab/1" className="btn btn-primary">Start Lab 1</Link>
          <ContinueButton />
        </div>
      </div>
      <PixelArt />
    </motion.section>
  )
}
