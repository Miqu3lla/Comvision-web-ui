import { useEffect, useRef, useState } from 'react'
import { toImageXY } from './coords'

/** Hover over the image to read (x, y) and the B, G, R values (OpenCV order). */
export default function PixelInspector({ src }: { src: string }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const ctx = useRef<CanvasRenderingContext2D | null>(null)
  const [px, setPx] = useState<{ x: number; y: number; r: number; g: number; b: number } | null>(null)

  // Draw the image once onto an offscreen canvas so we can call getImageData.
  useEffect(() => {
    const im = new Image()
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight
      const g = c.getContext('2d', { willReadFrequently: true })!; g.drawImage(im, 0, 0); ctx.current = g
    }
    im.src = src
  }, [src])

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_220px]">
      <div className="card img-frame overflow-hidden">
        <img ref={imgRef} src={src} alt="Inspect" className="max-h-96 w-full cursor-crosshair object-contain"
          onMouseLeave={() => setPx(null)}
          onMouseMove={(e) => {
            const { x, y, inside } = toImageXY(e, imgRef.current!)
            if (!inside || !ctx.current) return setPx(null)
            const [r, g, b] = ctx.current.getImageData(x, y, 1, 1).data
            setPx({ x, y, r, g, b })
          }} />
      </div>
      <div className="card p-4 font-mono text-sm">
        <p className="tag mb-2">Pixel</p>
        {px ? (
          <>
            <p>(x, y) = ({px.x}, {px.y})</p>
            <p className="mt-2 text-[#3b82f6]">B = {px.b}</p>
            <p className="text-[#22a559]">G = {px.g}</p>
            <p className="text-[#e5484d]">R = {px.r}</p>
            <p className="mt-2 text-xs text-muted">img[{px.y}, {px.x}] = [{px.b}, {px.g}, {px.r}]</p>
            <span className="mt-3 block h-8 rounded border border-line" style={{ background: `rgb(${px.r},${px.g},${px.b})` }} />
          </>
        ) : <p className="text-muted">Move the mouse over the image.</p>}
      </div>
    </div>
  )
}
