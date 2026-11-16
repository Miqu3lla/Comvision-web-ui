import { useRef, useState } from 'react'
import { SAMPLES } from '../../data/labs'
import { urlToFile } from '../../api/client'
import { useWebcam } from '../../hooks/useWebcam'

interface Props { file: File | null; onChange: (f: File) => void; label?: string; compact?: boolean }

/** Sample picker + drag-and-drop upload + webcam capture. */
export default function ImageInput({ file, onChange, label = 'Image', compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [cam, setCam] = useState(false)
  const webcam = useWebcam()

  const take = (f?: File | null) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return setErr('Please choose an image file.')
    if (f.size > 15 * 1024 * 1024) return setErr('Image is larger than 15 MB.')
    setErr(null); onChange(f)
  }
  const sample = async (name: string) => {
    try { setErr(null); onChange(await urlToFile(`/samples/${name}`, name)) } catch (e) { setErr((e as Error).message) }
  }
  const capture = async () => {
    const blob = await webcam.grab('image/png', 1, 800)
    if (blob) { take(new File([blob], 'webcam.png', { type: 'image/png' })); webcam.stop(); setCam(false) }
  }

  return (
    <div className={`card p-4 ${compact ? '' : 'border-dashed'}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]) }}
      style={drag ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="tag mr-1">{label}</span>
        <select aria-label="Sample image" value="" onChange={(e) => e.target.value && sample(e.target.value)}>
          <option value="">Sample…</option>
          {SAMPLES.map((s) => <option key={s.file} value={s.file}>{s.label}</option>)}
        </select>
        <button className="btn" onClick={() => inputRef.current?.click()}>Upload</button>
        <button className="btn" onClick={async () => { setCam(true); await webcam.start() }}>Webcam</button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
        <span className="ml-auto truncate font-mono text-xs text-muted">{file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : 'or drop an image here'}</span>
      </div>
      {cam && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <video ref={webcam.videoRef} muted playsInline className="h-40 rounded-md border border-line bg-black" />
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={!webcam.active} onClick={capture}>Capture</button>
            <button className="btn" onClick={() => { webcam.stop(); setCam(false) }}>Cancel</button>
          </div>
          {webcam.error && <span className="text-sm text-hot">{webcam.error}</span>}
        </div>
      )}
      {err && <p className="mt-2 text-sm text-hot" role="alert">{err}</p>}
    </div>
  )
}
