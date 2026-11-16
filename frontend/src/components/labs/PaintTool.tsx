import { useRef, useState } from 'react'
import { lab1 } from '../../api/labs'
import { dataUrlToFile } from '../../api/client'
import { useObjectUrl } from '../../hooks/useObjectUrl'
import ParameterSlider from '../lab/ParameterSlider'
import Status from '../lab/Status'
import DownloadButton from '../lab/DownloadButton'
import { toImageXY } from './coords'

const hex = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]

/** Click the image to paint. Every click is a real cv2 call on the backend. */
export default function PaintTool({ file, onResult }: { file: File; onResult?: (f: File) => void }) {
  const [cur, setCur] = useState<File>(file)
  const [color, setColor] = useState('#ff0055')
  const [size, setSize] = useState(8)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState<string | null>(null)
  const img = useRef<HTMLImageElement>(null)
  const url = useObjectUrl(cur)

  const click = async (e: React.MouseEvent) => {
    const { x, y, inside } = toImageXY(e, img.current!)
    if (!inside || busy) return
    setBusy(true)
    try {
      const r = await lab1.paint(cur, x, y, hex(color), size)
      const f = await dataUrlToFile(r.image, 'painted.png')
      setCur(f); setLast(r.image); onResult?.(f); setError(null)
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">Color<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="ml-2 h-8 w-12 cursor-pointer align-middle" /></label>
        <ParameterSlider label="Brush size (1 = single pixel)" value={size} min={1} max={40} onChange={setSize} />
        <button className="btn" onClick={() => { setCur(file); setLast(null) }}>Reset image</button>
        <DownloadButton src={last} name="painted" />
      </div>
      <div className="card img-frame overflow-hidden">
        {url && <img ref={img} src={url} alt="Paint" onClick={click} className="max-h-96 w-full cursor-crosshair object-contain" />}
      </div>
      <Status loading={busy} error={error} />
    </div>
  )
}
