import { useState } from 'react'
import { getLab } from '../data/labs'
import { lab2 } from '../api/labs'
import { useDebouncedProcess } from '../hooks/useDebouncedProcess'
import LabLayout from '../components/lab/LabLayout'
import ResultGrid from '../components/lab/ResultGrid'
import ParameterSlider from '../components/lab/ParameterSlider'
import BeforeAfterSlider from '../components/lab/BeforeAfterSlider'
import ObservationBox from '../components/lab/ObservationBox'
import Status from '../components/lab/Status'

const lab = getLab(2)
interface P { blur: number; sobel_k: number; low: number; high: number }
type Kind = 'load' | 'blur' | 'sobel' | 'magnitude' | 'canny' | 'compare'

/** One step: shares the lab's parameters, re-runs the real OpenCV pipeline when they change. */
function EdgeStep({ file, kind, p, setP }: { file: File; kind: Kind; p: P; setP: (p: P) => void }) {
  const { data, loading, error } = useDebouncedProcess((s) => lab2.run(file, p.blur, p.sobel_k, p.low, p.high, s), [file, p.blur, p.sobel_k, p.low, p.high])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        {kind === 'blur' && <ParameterSlider label="Gaussian kernel size" value={p.blur} min={1} max={25} step={2} onChange={(v) => setP({ ...p, blur: v })} format={(v) => `${v}×${v}`} hint="Larger kernel = smoother image, fewer noisy edges." />}
        {(kind === 'sobel' || kind === 'magnitude') && <ParameterSlider label="Sobel ksize" value={p.sobel_k} min={1} max={7} step={2} onChange={(v) => setP({ ...p, sobel_k: v })} />}
        {kind === 'canny' && <>
          <ParameterSlider label="Low threshold" value={p.low} min={0} max={254} onChange={(v) => setP({ ...p, low: Math.min(v, p.high - 1) })} />
          <ParameterSlider label="High threshold" value={p.high} min={1} max={255} onChange={(v) => setP({ ...p, high: Math.max(v, p.low + 1) })} />
        </>}
      </div>
      <Status loading={loading} error={error} />
      {data && kind === 'load' && <ResultGrid cols={2} items={[{ label: 'Grayscale', src: data.gray, file: 'lab2_gray' }]} />}
      {data && kind === 'blur' && <BeforeAfterSlider before={data.gray} after={data.blurred} labels={['Original', `Blur ${p.blur}×${p.blur}`]} />}
      {data && kind === 'sobel' && <ResultGrid cols={2} items={[
        { label: 'Sobel X (vertical edges)', src: data.sobel_x, file: 'lab2_sobel_x' },
        { label: 'Sobel Y (horizontal edges)', src: data.sobel_y, file: 'lab2_sobel_y' }]} />}
      {data && kind === 'magnitude' && <ResultGrid cols={2} items={[{ label: 'Sobel magnitude', src: data.magnitude, file: 'lab2_magnitude' }]} />}
      {data && kind === 'canny' && <>
        <ResultGrid cols={2} items={[{ label: `Canny ${p.low}/${p.high}`, src: data.canny, file: 'lab2_canny' }]} />
        <p className="font-mono text-sm text-muted">{data.edge_pixels.toLocaleString()} edge pixels · {(data.edge_ratio * 100).toFixed(1)}% of the image</p>
      </>}
      {data && kind === 'compare' && <>
        <ResultGrid cols={3} items={[
          { label: 'Original', src: data.gray, file: 'lab2_original' },
          { label: 'Sobel', src: data.magnitude, file: 'lab2_sobel' },
          { label: 'Canny', src: data.canny, file: 'lab2_canny' }]} />
        <ObservationBox noteKey="2:compare" placeholder="How do Sobel and Canny differ? Think about edge thickness, noise and continuity." />
      </>}
    </div>
  )
}

export default function Lab02EdgeDetection() {
  const [p, setP] = useState<P>({ blur: 3, sobel_k: 3, low: 100, high: 200 })
  const step = (kind: Kind) => (f: File) => <EdgeStep file={f} kind={kind} p={p} setP={setP} />
  return (
    <LabLayout lab={lab} render={{
      load: step('load'), blur: step('blur'), sobel: step('sobel'),
      magnitude: step('magnitude'), canny: step('canny'), compare: step('compare'),
    }} />
  )
}
