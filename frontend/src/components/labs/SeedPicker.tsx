import { useRef } from 'react'
import { toImageXY } from './coords'

/** Click anywhere on the image to choose a seed point. */
export default function SeedPicker({ src, seed, onPick }: { src: string; seed: { x: number; y: number } | null; onPick: (x: number, y: number) => void }) {
  const img = useRef<HTMLImageElement>(null)
  return (
    <div className="card img-frame relative overflow-hidden">
      <img ref={img} src={src} alt="Pick a seed" className="max-h-80 w-full cursor-crosshair object-contain"
        onClick={(e) => { const p = toImageXY(e, img.current!); if (p.inside) onPick(p.x, p.y) }} />
      {seed && img.current && (() => {
        const im = img.current, b = im.getBoundingClientRect(), s = Math.min(b.width / im.naturalWidth, b.height / im.naturalHeight)
        const l = (b.width - im.naturalWidth * s) / 2 + seed.x * s, t = (b.height - im.naturalHeight * s) / 2 + seed.y * s
        return <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-hot" style={{ left: l, top: t }} />
      })()}
    </div>
  )
}
