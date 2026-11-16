import { useState } from 'react'
import { getLab } from '../data/labs'
import { lab7 } from '../api/labs'
import { useDebouncedProcess } from '../hooks/useDebouncedProcess'
import { useAsync, useObjectUrl } from '../hooks/useObjectUrl'
import LabLayout from '../components/lab/LabLayout'
import ResultGrid from '../components/lab/ResultGrid'
import ParameterSlider from '../components/lab/ParameterSlider'
import ObservationBox from '../components/lab/ObservationBox'
import Status from '../components/lab/Status'
import SeedPicker from '../components/labs/SeedPicker'
import MaskOverlay from '../components/labs/MaskOverlay'

const lab = getLab(7)

function ThresholdStep({ file }: { file: File }) {
  const [t, setT] = useState(127)
  const { data, loading, error } = useDebouncedProcess((s) => lab7.threshold(file, t, s), [file, t])
  return (
    <div className="space-y-3">
      <ParameterSlider label="Global threshold" value={t} min={0} max={255} onChange={setT} />
      <Status loading={loading} error={error} />
      {data && <>
        <ResultGrid cols={3} items={[
          { label: 'Grayscale (blurred)', src: data.gray, file: 'lab7_gray' },
          { label: `Global T=${t}`, src: data.global, file: 'lab7_global' },
          { label: 'Otsu', src: data.otsu, file: 'lab7_otsu', note: `T=${data.otsu_value.toFixed(0)}` }]} />
        <p className="font-mono text-sm text-muted">Otsu chose <span className="text-accent">{data.otsu_value.toFixed(0)}</span> automatically by minimizing within-class variance.</p>
      </>}
    </div>
  )
}

function AdaptiveStep({ file }: { file: File }) {
  const [block, setBlock] = useState(11)
  const [c, setC] = useState(2)
  const { data, loading, error } = useDebouncedProcess((s) => lab7.adaptive(file, block, c, s), [file, block, c])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        <ParameterSlider label="Block size" value={block} min={3} max={101} step={2} onChange={setBlock} />
        <ParameterSlider label="Constant C" value={c} min={-10} max={20} onChange={setC} />
      </div>
      <Status loading={loading} error={error} />
      {data && <ResultGrid cols={2} items={[{ label: 'Adaptive mean', src: data.mean, file: 'lab7_adaptive_mean' }, { label: 'Adaptive Gaussian', src: data.gaussian, file: 'lab7_adaptive_gauss' }]} />}
    </div>
  )
}

function RegionStep({ file }: { file: File }) {
  const url = useObjectUrl(file)
  const [seed, setSeed] = useState<{ x: number; y: number } | null>(null)
  const [tol, setTol] = useState(15)
  const { data, loading, error } = useDebouncedProcess(() => lab7.region(file, seed!.x, seed!.y, tol), [file, seed, tol], 300, !!seed)
  return (
    <div className="space-y-3">
      <ParameterSlider label="Tolerance" value={tol} min={1} max={80} onChange={setTol} hint="Neighbours within this intensity distance of the seed join the region." />
      {url && <SeedPicker src={url} seed={seed} onPick={(x, y) => setSeed({ x, y })} />}
      {!seed && <p className="tag">Click the image to place a seed point.</p>}
      <Status loading={loading} error={error} />
      {data && <>
        <p className="font-mono text-sm text-muted">seed ({seed!.x}, {seed!.y}) · region = {data.area.toLocaleString()} px ({(data.ratio * 100).toFixed(1)}%)</p>
        <ResultGrid cols={2} items={[{ label: 'Overlay', src: data.overlay, file: 'lab7_region_overlay' }, { label: 'Mask', src: data.mask, file: 'lab7_region_mask' }]} />
      </>}
    </div>
  )
}

function WatershedStep({ file }: { file: File }) {
  const [fg, setFg] = useState(0.6)
  const { data, loading, error } = useDebouncedProcess((s) => lab7.watershed(file, fg, s), [file, fg], 400)
  return (
    <div className="space-y-3">
      <ParameterSlider label="Sure-foreground threshold" value={fg} min={0.1} max={0.9} step={0.05} onChange={setFg} format={(v) => v.toFixed(2)} hint="Fraction of the max distance-transform value. Higher splits touching objects more aggressively." />
      <Status loading={loading} error={error} />
      {data && <>
        <p className="font-mono text-sm text-muted"><span className="text-accent">{data.objects}</span> object markers · boundaries in red</p>
        <ResultGrid cols={4} items={[
          { label: 'Binary', src: data.binary, file: 'lab7_ws_binary' }, { label: 'Distance transform', src: data.distance, file: 'lab7_ws_distance' },
          { label: 'Markers', src: data.markers, file: 'lab7_ws_markers' }, { label: 'Watershed result', src: data.result, file: 'lab7_ws_result' }]} />
      </>}
    </div>
  )
}

function EdgeStep({ file }: { file: File }) {
  const [low, setLow] = useState(80)
  const [high, setHigh] = useState(160)
  const { data, loading, error } = useDebouncedProcess((s) => lab7.edges(file, low, high, s), [file, low, high])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        <ParameterSlider label="Canny low" value={low} min={0} max={254} onChange={(v) => setLow(Math.min(v, high - 1))} />
        <ParameterSlider label="Canny high" value={high} min={1} max={255} onChange={(v) => setHigh(Math.max(v, low + 1))} />
      </div>
      <Status loading={loading} error={error} />
      {data && <>
        <p className="font-mono text-sm text-muted"><span className="text-accent">{data.count}</span> closed contours</p>
        <ResultGrid cols={4} items={[
          { label: 'Canny', src: data.canny, file: 'lab7_edges_canny' }, { label: 'Closed', src: data.closed, file: 'lab7_edges_closed' },
          { label: 'Contours', src: data.contours, file: 'lab7_edges_contours' }, { label: 'Filled regions', src: data.filled, file: 'lab7_edges_filled' }]} />
      </>}
    </div>
  )
}

function DeepLabStep({ file }: { file: File }) {
  const [opacity, setOpacity] = useState(0.5)
  const { data, loading, error } = useDebouncedProcess(() => lab7.deeplab(file, opacity), [file, opacity], 400)
  return (
    <div className="space-y-3">
      <ParameterSlider label="Mask opacity" value={opacity} min={0} max={1} step={0.05} onChange={setOpacity} format={(v) => v.toFixed(2)} />
      <Status loading={loading} error={error} />
      {loading && !data && <p className="text-sm text-muted">The first run downloads the DeepLabV3 weights.</p>}
      {data && <>
        <MaskOverlay src={data.overlay} classes={data.classes} />
        <ResultGrid cols={2} items={[{ label: 'Class mask', src: data.mask, file: 'lab7_deeplab_mask' }, { label: 'Overlay', src: data.overlay, file: 'lab7_deeplab_overlay' }]} />
      </>}
    </div>
  )
}

function CompareStep({ file }: { file: File }) {
  const [gt, setGt] = useState<File | undefined>()
  const [withDl, setWithDl] = useState(false)
  const { data, loading, error } = useAsync(() => lab7.compare(file, gt, 15, withDl), [file, gt, withDl])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label>Ground-truth mask (optional) <input type="file" accept="image/*" className="ml-2" onChange={(e) => setGt(e.target.files?.[0])} /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={withDl} onChange={(e) => setWithDl(e.target.checked)} /> Include DeepLabV3 (foreground vs background)</label>
      </div>
      <Status loading={loading} error={error} />
      {data && <>
        <ResultGrid cols={3} items={[{ label: 'Original', src: data.original, file: 'lab7_cmp_original' },
          ...Object.entries(data.results).map(([k, v]) => ({ label: k, src: v, file: `lab7_cmp_${k}`, note: k in data.iou ? `IoU ${data.iou[k].toFixed(2)}` : undefined }))]} />
        {!gt && <p className="tag">Upload a ground-truth mask (white = object) to score each method with IoU.</p>}
        <ObservationBox noteKey="7:compare" placeholder="Which method suits this image best and why?" />
      </>}
    </div>
  )
}

export default function Lab07Segmentation() {
  return (
    <LabLayout lab={lab} render={{
      thresh: (f) => <ThresholdStep file={f} />, adaptive: (f) => <AdaptiveStep file={f} />, region: (f) => <RegionStep file={f} />,
      watershed: (f) => <WatershedStep file={f} />, edge: (f) => <EdgeStep file={f} />, deeplab: (f) => <DeepLabStep file={f} />,
      compare: (f) => <CompareStep file={f} />,
    }} />
  )
}
