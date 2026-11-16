import { useEffect, useRef, useState } from 'react'
import { getLab } from '../data/labs'
import { lab6, type Box } from '../api/labs'
import { useDebouncedProcess } from '../hooks/useDebouncedProcess'
import { useWebcam } from '../hooks/useWebcam'
import LabLayout from '../components/lab/LabLayout'
import ResultGrid from '../components/lab/ResultGrid'
import ParameterSlider from '../components/lab/ParameterSlider'
import ObservationBox from '../components/lab/ObservationBox'
import Status from '../components/lab/Status'
import DetectionCanvas from '../components/labs/DetectionCanvas'

const lab = getLab(6)

function BoxTable({ boxes }: { boxes: Box[] }) {
  if (!boxes.length) return <p className="tag">No objects found at this confidence.</p>
  return (
    <ul className="grid gap-1 font-mono text-xs sm:grid-cols-2 lg:grid-cols-3">
      {boxes.map((b, i) => <li key={i} className="card flex justify-between px-2 py-1"><span>{b.label}</span><span className="text-accent">{(b.conf * 100).toFixed(0)}%</span></li>)}
    </ul>
  )
}

function ImageStep({ file }: { file: File }) {
  const [conf, setConf] = useState(0.25)
  const [model, setModel] = useState('yolo11n.pt')
  const { data, loading, error } = useDebouncedProcess((s) => lab6.detect(file, conf, model, s), [file, conf, model], 400)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <ParameterSlider label="Confidence threshold" value={conf} min={0.05} max={0.95} step={0.05} onChange={setConf} format={(v) => v.toFixed(2)} />
        <label className="text-sm">Model <select className="ml-2" value={model} onChange={(e) => setModel(e.target.value)}><option value="yolo11n.pt">YOLO11n</option><option value="yolov8n.pt">YOLOv8n</option></select></label>
      </div>
      <Status loading={loading} error={error} />
      {loading && !data && <p className="text-sm text-muted">The first run downloads the model weights.</p>}
      {data && <>
        <p className="font-mono text-sm"><span className="text-accent">{data.count}</span> objects detected</p>
        <ResultGrid cols={2} items={[{ label: 'Detections', src: data.image, file: 'lab6_detections' }]} />
        <BoxTable boxes={data.boxes} />
      </>}
    </div>
  )
}

function WebcamStep() {
  const cam = useWebcam()
  const [boxes, setBoxes] = useState<Box[]>([])
  const [dim, setDim] = useState({ w: 480, h: 360 })
  const [fps, setFps] = useState(0)
  const [conf, setConf] = useState(0.35)
  const [err, setErr] = useState<string | null>(null)
  const confRef = useRef(conf); confRef.current = conf

  // Throttled loop: send one frame, wait for the answer, then send the next (never piles up).
  useEffect(() => {
    if (!cam.active) return
    let live = true, frames = 0, t0 = performance.now()
    const loop = async () => {
      while (live) {
        const blob = await cam.grab('image/jpeg', 0.6, 480)
        if (!blob) { await new Promise((r) => setTimeout(r, 100)); continue }
        try {
          const r = await lab6.frame(blob, confRef.current, 'yolo11n.pt')
          if (!live) break
          setBoxes(r.boxes); setDim({ w: r.width, h: r.height }); setErr(null); frames++
          const now = performance.now()
          if (now - t0 > 1000) { setFps(Math.round((frames * 1000) / (now - t0))); frames = 0; t0 = now }
        } catch (e) { setErr((e as Error).message); await new Promise((r) => setTimeout(r, 1000)) }
        await new Promise((r) => setTimeout(r, 60))
      }
    }
    loop()
    return () => { live = false }
  }, [cam.active, cam.grab])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        {cam.active ? <button className="btn" onClick={cam.stop}>Stop camera</button> : <button className="btn btn-primary" onClick={cam.start}>Start camera</button>}
        <ParameterSlider label="Confidence" value={conf} min={0.1} max={0.9} step={0.05} onChange={setConf} format={(v) => v.toFixed(2)} />
        <span className="font-mono text-2xl text-accent">{cam.active ? fps : 0}<span className="ml-1 text-xs text-muted">FPS</span></span>
      </div>
      <Status error={cam.error || err} />
      <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-line bg-black">
        <video ref={cam.videoRef} muted playsInline className="block max-h-96 max-w-full" />
        <DetectionCanvas boxes={boxes} width={dim.w} height={dim.h} />
      </div>
      <BoxTable boxes={boxes} />
    </div>
  )
}

function DatasetStep({ file }: { file: File }) {
  const [labels, setLabels] = useState<File | null>(null)
  const [out, setOut] = useState<{ image: string; count: number } | null>(null)
  const [state, setState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })
  const run = async (l: File) => {
    setLabels(l); setState({ loading: true, error: null })
    try { setOut(await lab6.labels(file, l)); setState({ loading: false, error: null }) } catch (e) { setState({ loading: false, error: (e as Error).message }) }
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">The lab image above is the image. Upload its YOLO label file (<span className="font-mono">class cx cy w h</span> per line, values normalized 0–1).</p>
      <input type="file" accept=".txt" onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} className="text-sm" />
      {labels && <p className="font-mono text-xs text-muted">{labels.name}</p>}
      <Status {...state} />
      {out && <ResultGrid cols={2} items={[{ label: `${out.count} labelled boxes`, src: out.image, file: 'lab6_labels' }]} />}
      <div className="grid gap-3 md:grid-cols-2">
        <pre className="card overflow-x-auto p-3 font-mono text-xs leading-relaxed">{`dataset/
├── images/
│   ├── train/  img001.jpg ...
│   └── val/    img101.jpg ...
├── labels/
│   ├── train/  img001.txt ...
│   └── val/    img101.txt ...
└── data.yaml`}</pre>
        <pre className="card overflow-x-auto p-3 font-mono text-xs leading-relaxed">{`path: ./dataset
train: images/train
val: images/val

nc: 3
names: ['cat', 'dog', 'bird']`}</pre>
      </div>
    </div>
  )
}

const COMMANDS = [
  { label: 'Install', cmd: 'pip install ultralytics' },
  { label: 'Train', cmd: 'yolo detect train data=dataset/data.yaml model=yolo11n.pt epochs=50 imgsz=640 batch=16' },
  { label: 'Validate', cmd: 'yolo detect val model=runs/detect/train/weights/best.pt data=dataset/data.yaml' },
  { label: 'Predict', cmd: 'yolo detect predict model=runs/detect/train/weights/best.pt source=test.jpg' },
]

function TrainStep() {
  const [copied, setCopied] = useState('')
  const copy = async (c: string) => { try { await navigator.clipboard.writeText(c); setCopied(c); setTimeout(() => setCopied(''), 1200) } catch { /* clipboard blocked */ } }
  return (
    <div className="space-y-2">
      {COMMANDS.map((c) => (
        <div key={c.label} className="card flex items-center gap-3 p-3">
          <span className="tag w-16 shrink-0">{c.label}</span>
          <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">{c.cmd}</code>
          <button className="btn !px-2 !py-1 text-xs" onClick={() => copy(c.cmd)}>{copied === c.cmd ? 'Copied ✓' : 'Copy'}</button>
        </div>
      ))}
      <p className="text-xs text-muted">Run these in a terminal, ideally on a GPU (Colab works). Training is not run inside this app.</p>
    </div>
  )
}

function CustomStep({ file }: { file: File }) {
  const [w, setW] = useState<File | null>(null)
  const [conf, setConf] = useState(0.25)
  const { data, loading, error } = useDebouncedProcess(() => lab6.custom(file, w!, conf), [file, w, conf], 500, !!w)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">best.pt <input type="file" accept=".pt" className="ml-2" onChange={(e) => setW(e.target.files?.[0] ?? null)} /></label>
        <ParameterSlider label="Confidence" value={conf} min={0.05} max={0.95} step={0.05} onChange={setConf} format={(v) => v.toFixed(2)} />
      </div>
      {!w && <p className="tag">Upload your trained weights to detect with them.</p>}
      <Status loading={loading} error={error} />
      {data && <>
        {data.classes && <p className="font-mono text-xs text-muted">classes: {data.classes.join(', ')}</p>}
        <ResultGrid cols={2} items={[{ label: `${data.count} detections (custom model)`, src: data.image, file: 'lab6_custom' }]} />
        <BoxTable boxes={data.boxes} />
      </>}
    </div>
  )
}

export default function Lab06YoloDetection() {
  return (
    <LabLayout lab={lab} noImageSteps={['webcam', 'train', 'reflect']}
      render={{
        image: (f) => <ImageStep file={f} />, webcam: () => <WebcamStep />, dataset: (f) => <DatasetStep file={f} />,
        train: () => <TrainStep />, custom: (f) => <CustomStep file={f} />,
        reflect: () => <ObservationBox noteKey="6:reflect" title="Detection vs classification" placeholder="Classification answers 'what is in this image?'. Detection answers 'what and where?'. Give a real-world example where you need detection." />,
      }} />
  )
}
