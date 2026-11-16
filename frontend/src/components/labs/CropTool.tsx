import { useRef, useState } from 'react'
import { lab1, type Shape } from '../../api/labs'
import { dataUrlToFile } from '../../api/client'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import DownloadButton from '../lab/DownloadButton'
import Status from '../lab/Status'
import { toImageXY } from './coords'

interface Rect { x0: number; y0: number; x1: number; y1: number }

/** Drag a rectangle over the image; on release the backend slices the array. */
export default function CropTool({ file, onResult }: { file: File; onResult?: (f: File) => void }) {
  const url = useObjectUrl(file)
  const img = useRef<HTMLImageElement>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [drag, setDrag] = useState(false)
  const [out, setOut] = useState<{ image: string; shape: Shape; box: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pt = (e: React.MouseEvent) => { const p = toImageXY(e, img.current!); return { x: Math.max(0, Math.min(img.current!.naturalWidth - 1, p.x)), y: Math.max(0, Math.min(img.current!.naturalHeight - 1, p.y)) } }
  const finish = async (r: Rect) => {
    const x = Math.min(r.x0, r.x1), y = Math.min(r.y0, r.y1), w = Math.abs(r.x1 - r.x0), h = Math.abs(r.y1 - r.y0)
    if (w < 2 || h < 2) return
    setBusy(true)
    try {
      const res = await lab1.crop(file, x, y, w, h)
      setOut({ image: res.image, shape: res.shape, box: `img[${y}:${y + h}, ${x}:${x + w}]` }); setError(null)
      onResult?.(await dataUrlToFile(res.image, 'cropped.png'))
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  // Convert the image-space rect to CSS % of the displayed (contained) image for the overlay.
  const overlay = () => {
    const im = img.current
    if (!rect || !im) return null
    const b = im.getBoundingClientRect(), s = Math.min(b.width / im.naturalWidth, b.height / im.naturalHeight)
    const ox = (b.width - im.naturalWidth * s) / 2, oy = (b.height - im.naturalHeight * s) / 2
    return { left: ox + Math.min(rect.x0, rect.x1) * s, top: oy + Math.min(rect.y0, rect.y1) * s,
      width: Math.abs(rect.x1 - rect.x0) * s, height: Math.abs(rect.y1 - rect.y0) * s }
  }
  const ov = overlay()

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="card img-frame relative select-none overflow-hidden">
        {url && <img ref={img} src={url} alt="Crop source" draggable={false} className="max-h-96 w-full cursor-crosshair object-contain"
          onMouseDown={(e) => { const p = pt(e); setRect({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); setDrag(true) }}
          onMouseMove={(e) => { if (drag && rect) { const p = pt(e); setRect({ ...rect, x1: p.x, y1: p.y }) } }}
          onMouseUp={() => { setDrag(false); if (rect) finish(rect) }}
          onMouseLeave={() => { if (drag) { setDrag(false); if (rect) finish(rect) } }} />}
        {ov && <div className="pointer-events-none absolute border-2 border-dashed border-hot bg-hot/10" style={ov} />}
      </div>
      <div className="space-y-2">
        <Status loading={busy} error={error} />
        {out ? (
          <div className="card overflow-hidden">
            <div className="img-frame flex justify-center p-2"><img src={out.image} alt="Cropped" className="max-h-72 object-contain" /></div>
            <div className="flex items-center justify-between border-t border-line px-3 py-1.5 font-mono text-xs">
              <span>{out.shape.width} × {out.shape.height} px · {out.box}</span>
              <DownloadButton src={out.image} name="cropped" />
            </div>
          </div>
        ) : <p className="tag p-4">Drag on the image to select a region.</p>}
      </div>
    </div>
  )
}
