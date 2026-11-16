import { useState } from 'react'
import { getLab } from '../data/labs'
import { lab1 } from '../api/labs'
import { dataUrlToFile } from '../api/client'
import { useAsync, useObjectUrl } from '../hooks/useObjectUrl'
import LabLayout from '../components/lab/LabLayout'
import ResultGrid from '../components/lab/ResultGrid'
import BeforeAfterSlider from '../components/lab/BeforeAfterSlider'
import ParameterSlider from '../components/lab/ParameterSlider'
import ObservationBox from '../components/lab/ObservationBox'
import Status from '../components/lab/Status'
import PixelInspector from '../components/labs/PixelInspector'
import PaintTool from '../components/labs/PaintTool'
import CropTool from '../components/labs/CropTool'

const lab = getLab(1)

function LoadStep({ file }: { file: File }) {
  const { data, error, loading } = useAsync(() => lab1.info(file), [file])
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} />
      {data && (
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <ResultGrid cols={2} items={[{ label: 'Original', src: data.image, file: 'original' }]} />
          <div className="card p-4 font-mono text-sm">
            <p className="tag mb-2">img.shape</p>
            <p className="text-lg">({data.shape.height}, {data.shape.width}, {data.shape.channels})</p>
            <dl className="mt-3 space-y-1 text-xs text-muted">
              <div>height = {data.shape.height} px</div><div>width = {data.shape.width} px</div>
              <div>channels = {data.shape.channels} (B, G, R)</div><div>dtype = {data.dtype}</div>
              <div>pixels = {data.pixels.toLocaleString()}</div><div>file = {data.name}</div>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}

function BgrStep({ file }: { file: File }) {
  const [misread, setMisread] = useState(false)
  const { data, error, loading } = useAsync(() => lab1.channels(file), [file])
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} />
      {data && (
        <>
          <ResultGrid cols={3} items={[
            { label: 'Blue channel', src: data.blue, file: 'channel_b', note: `mean ${data.mean[0].toFixed(0)}` },
            { label: 'Green channel', src: data.green, file: 'channel_g', note: `mean ${data.mean[1].toFixed(0)}` },
            { label: 'Red channel', src: data.red, file: 'channel_r', note: `mean ${data.mean[2].toFixed(0)}` },
          ]} />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={misread} onChange={(e) => setMisread(e.target.checked)} />
            Show the image misread as RGB (red and blue swapped)
          </label>
          {misread && <ResultGrid cols={2} items={[{ label: 'BGR array read as RGB', src: data.misread, file: 'misread_rgb' }]} />}
        </>
      )}
    </div>
  )
}

function GrayStep({ file }: { file: File }) {
  const url = useObjectUrl(file)
  const { data, error, loading } = useAsync(() => lab1.gray(file), [file])
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} />
      {data && url && <BeforeAfterSlider before={url} after={data.gray} labels={['Color', 'Grayscale']} />}
      {data && <ResultGrid cols={2} items={[{ label: `Grayscale (${data.shape.height}×${data.shape.width}, ${data.shape.channels} channel)`, src: data.gray, file: 'grayscale' }]} />}
    </div>
  )
}

function InspectStep({ file }: { file: File }) {
  const url = useObjectUrl(file)
  return url ? <PixelInspector src={url} /> : null
}

function ResizeStep({ file, onResult }: { file: File; onResult: (f: File) => void }) {
  const [scale, setScale] = useState(0.5)
  const [data, setData] = useState<Awaited<ReturnType<typeof lab1.resize>> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const run = async (s: number) => {
    setScale(s)
    try { const r = await lab1.resize(file, s); setData(r); setErr(null); onResult(await dataUrlToFile(r.image, 'resized.png')) }
    catch (e) { setErr((e as Error).message) }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <ParameterSlider label="Scale" value={scale} min={0.1} max={2} step={0.1} onChange={setScale} format={(v) => `${v.toFixed(1)}×`} />
        <button className="btn btn-primary" onClick={() => run(scale)}>Resize</button>
      </div>
      <Status error={err} />
      {data && <ResultGrid cols={2} items={[{ label: `Resized · ${data.shape.width} × ${data.shape.height}`, src: data.image, file: 'resized' }]} />}
    </div>
  )
}

function RotateStep({ file, onResult }: { file: File; onResult: (f: File) => void }) {
  const [data, setData] = useState<{ image: string; angle: number; w: number; h: number } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const rot = async (angle: number) => {
    try {
      const r = await lab1.rotate(file, angle)
      setData({ image: r.image, angle, w: r.shape.width, h: r.shape.height }); setErr(null)
      onResult(await dataUrlToFile(r.image, 'rotated.png'))
    } catch (e) { setErr((e as Error).message) }
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-2">{[90, 180, 270].map((a) => <button key={a} className="btn" onClick={() => rot(a)}>{a}°</button>)}</div>
      <Status error={err} />
      {data && <ResultGrid cols={2} items={[{ label: `Rotated ${data.angle}° · ${data.w} × ${data.h}`, src: data.image, file: `rotated_${data.angle}` }]} />}
    </div>
  )
}

function SummaryStep({ file, manipulated }: { file: File; manipulated: File | null }) {
  const orig = useObjectUrl(file), man = useObjectUrl(manipulated)
  const { data } = useAsync(() => lab1.gray(file), [file])
  return (
    <div className="space-y-3">
      <ResultGrid cols={3} items={[
        { label: 'Original', src: orig, file: 'lab1_original' },
        { label: 'Grayscale', src: data?.gray, file: 'lab1_grayscale' },
        { label: 'Manipulated (latest crop / paint / resize / rotate)', src: man, file: 'lab1_manipulated' },
      ]} />
      <ObservationBox noteKey="1:summary" />
    </div>
  )
}

export default function Lab01ImageManipulation() {
  // The most recent manipulated result is carried to the Summary step for download.
  const [manip, setManip] = useState<File | null>(null)
  return (
    <LabLayout lab={lab} render={{
      load: (f) => <LoadStep file={f} />,
      bgr: (f) => <BgrStep file={f} />,
      gray: (f) => <GrayStep file={f} />,
      inspect: (f) => <InspectStep file={f} />,
      paint: (f) => <PaintTool file={f} onResult={setManip} />,
      crop: (f) => <CropTool file={f} onResult={setManip} />,
      resize: (f) => <ResizeStep file={f} onResult={setManip} />,
      rotate: (f) => <RotateStep file={f} onResult={setManip} />,
      summary: (f) => <SummaryStep file={f} manipulated={manip} />,
    }} />
  )
}
