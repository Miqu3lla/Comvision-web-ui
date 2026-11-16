import { useState } from 'react'
import { getLab } from '../data/labs'
import { lab3 } from '../api/labs'
import { useDebouncedProcess } from '../hooks/useDebouncedProcess'
import LabLayout from '../components/lab/LabLayout'
import ResultGrid from '../components/lab/ResultGrid'
import ParameterSlider from '../components/lab/ParameterSlider'
import HistogramChart from '../components/lab/HistogramChart'
import ObservationBox from '../components/lab/ObservationBox'
import Status from '../components/lab/Status'

const lab = getLab(3)
interface P { color_mode: string; alpha: number; beta: number; clip: number; tile: number }
type Kind = 'load' | 'global' | 'color' | 'stretch' | 'clahe' | 'compare'

function Stat({ s }: { s?: { mean: number; std: number } }) {
  return s ? <span>mean {s.mean.toFixed(0)} · σ {s.std.toFixed(0)}</span> : null
}

function HistStep({ file, kind, p, setP }: { file: File; kind: Kind; p: P; setP: (p: P) => void }) {
  const { data: d, loading, error } = useDebouncedProcess((s) => lab3.run(file, p, s), [file, p.color_mode, p.alpha, p.beta, p.clip, p.tile])
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        {kind === 'color' && (
          <label className="text-sm">Channel
            <select className="ml-2" value={p.color_mode} onChange={(e) => setP({ ...p, color_mode: e.target.value })}>
              <option value="yuv">Y of YUV</option><option value="hsv">V of HSV</option>
            </select>
          </label>
        )}
        {kind === 'stretch' && <>
          <ParameterSlider label="Alpha (gain)" value={p.alpha} min={0.2} max={3} step={0.1} onChange={(v) => setP({ ...p, alpha: v })} format={(v) => v.toFixed(1)} />
          <ParameterSlider label="Beta (bias)" value={p.beta} min={-100} max={100} onChange={(v) => setP({ ...p, beta: v })} />
        </>}
        {kind === 'clahe' && <>
          <ParameterSlider label="Clip limit" value={p.clip} min={1} max={10} step={0.5} onChange={(v) => setP({ ...p, clip: v })} format={(v) => v.toFixed(1)} />
          <ParameterSlider label="Tile grid size" value={p.tile} min={2} max={16} onChange={(v) => setP({ ...p, tile: v })} format={(v) => `${v}×${v}`} />
        </>}
      </div>
      <Status loading={loading} error={error} />
      {d && kind === 'load' && <div className="grid gap-3 md:grid-cols-2">
        <ResultGrid cols={2} items={[{ label: 'Grayscale', src: d.images.gray, file: 'lab3_gray', note: <Stat s={d.stats.gray} /> }]} />
        <HistogramChart data={d.hist.gray} title="Histogram · original" />
      </div>}
      {d && kind === 'global' && <div className="grid gap-3 md:grid-cols-2">
        <ResultGrid cols={2} items={[{ label: 'Before', src: d.images.gray, file: 'lab3_before' }, { label: 'After equalizeHist', src: d.images.global, file: 'lab3_global_he', note: <Stat s={d.stats.global} /> }]} />
        <div className="space-y-3"><HistogramChart data={d.hist.gray} title="Before" /><HistogramChart data={d.hist.global} title="After" color="var(--hot)" /></div>
      </div>}
      {d && kind === 'color' && <div className="grid gap-3 md:grid-cols-2">
        <ResultGrid cols={2} items={[{ label: 'Original', src: d.images.original, file: 'lab3_color_original' }, { label: `Equalized ${p.color_mode === 'yuv' ? 'Y' : 'V'}`, src: d.images.color_eq, file: 'lab3_color_eq' }]} />
        <div className="space-y-3"><HistogramChart data={d.hist.color_before} title="Brightness · before" /><HistogramChart data={d.hist.color_after} title="Brightness · after" color="var(--hot)" /></div>
      </div>}
      {d && kind === 'stretch' && <div className="grid gap-3 md:grid-cols-2">
        <ResultGrid cols={2} items={[{ label: 'Original', src: d.images.gray, file: 'lab3_orig' }, { label: `g = ${p.alpha.toFixed(1)}·f + ${p.beta}`, src: d.images.stretched, file: 'lab3_stretched', note: <Stat s={d.stats.stretched} /> }]} />
        <HistogramChart data={d.hist.stretched} title="Histogram · stretched" color="var(--hot)" />
      </div>}
      {d && kind === 'clahe' && <div className="grid gap-3 md:grid-cols-2">
        <ResultGrid cols={2} items={[{ label: 'Original', src: d.images.gray, file: 'lab3_orig' }, { label: `CLAHE clip ${p.clip}`, src: d.images.clahe, file: 'lab3_clahe', note: <Stat s={d.stats.clahe} /> }]} />
        <HistogramChart data={d.hist.clahe} title="Histogram · CLAHE" color="var(--hot)" />
      </div>}
      {d && kind === 'compare' && <>
        <ResultGrid cols={4} items={[
          { label: 'Original', src: d.images.gray, file: 'lab3_cmp_original' }, { label: 'Global HE', src: d.images.global, file: 'lab3_cmp_global' },
          { label: 'CLAHE', src: d.images.clahe, file: 'lab3_cmp_clahe' }, { label: 'Stretched', src: d.images.stretched, file: 'lab3_cmp_stretched' }]} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HistogramChart data={d.hist.gray} title="Original" /><HistogramChart data={d.hist.global} title="Global HE" />
          <HistogramChart data={d.hist.clahe} title="CLAHE" /><HistogramChart data={d.hist.stretched} title="Stretched" />
        </div>
        <ObservationBox noteKey="3:compare" placeholder="Which method shows the most detail? Which amplifies noise?" />
      </>}
    </div>
  )
}

export default function Lab03Histogram() {
  const [p, setP] = useState<P>({ color_mode: 'yuv', alpha: 1.5, beta: 0, clip: 2, tile: 8 })
  const step = (k: Kind) => (f: File) => <HistStep file={f} kind={k} p={p} setP={setP} />
  return <LabLayout lab={lab} render={{ load: step('load'), global: step('global'), color: step('color'), stretch: step('stretch'), clahe: step('clahe'), compare: step('compare') }} />
}
