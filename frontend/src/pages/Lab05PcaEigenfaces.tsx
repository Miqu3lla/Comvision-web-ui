import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getLab } from '../data/labs'
import { lab5 } from '../api/labs'
import { useAsync } from '../hooks/useObjectUrl'
import { useDebouncedProcess } from '../hooks/useDebouncedProcess'
import LabLayout from '../components/lab/LabLayout'
import ParameterSlider from '../components/lab/ParameterSlider'
import ObservationBox from '../components/lab/ObservationBox'
import Status from '../components/lab/Status'
import DownloadButton from '../components/lab/DownloadButton'
import EigenfaceGallery from '../components/labs/EigenfaceGallery'

const lab = getLab(5)
const WAIT = 'First run downloads the LFW dataset (~200 MB) and trains the model, so this can take a few minutes.'

function Stat({ k, v }: { k: string; v: string | number }) {
  return <div className="card p-3"><p className="tag">{k}</p><p className="font-mono text-xl">{v}</p></div>
}

function DataStep() {
  const { data, loading, error } = useAsync(() => lab5.dataset(), [])
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} />
      {loading && <p className="text-sm text-muted">{WAIT}</p>}
      {data && <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat k="n_samples" v={data.n_samples} /><Stat k="n_features (h×w)" v={`${data.n_features} (${data.height}×${data.width})`} />
          <Stat k="n_classes" v={data.n_classes} /><Stat k="train / test (80/20)" v={`${data.n_train} / ${data.n_test}`} />
        </div>
        <p className="text-sm text-muted">People: {data.names.join(', ')}. Split with random_state=42.</p>
        <EigenfaceGallery items={data.samples.map((s) => ({ src: s.image, caption: s.name }))} />
      </>}
    </div>
  )
}

function FitStep() {
  const { data, loading, error } = useAsync(() => lab5.fit(), [])
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} />
      <p className="font-mono text-sm text-muted">PCA(n_components=150, svd_solver='randomized', whiten=True) · fitted on X_train only</p>
      {data && <div className="grid grid-cols-3 gap-3"><Stat k="fit time" v={`${data.fit_time.toFixed(2)} s`} /><Stat k="components" v={data.n_components} /><Stat k="variance kept" v={`${(data.explained * 100).toFixed(1)}%`} /></div>}
    </div>
  )
}

function EigenStep() {
  const [showLast, setShowLast] = useState(false)
  const { data, loading, error } = useAsync(() => lab5.eigenfaces(), [])
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} />
      {data && <>
        <EigenfaceGallery items={data.first.map((src, i) => ({ src, caption: `eigenface ${i + 1}` }))} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showLast} onChange={(e) => setShowLast(e.target.checked)} /> Also show the last 3 (noise-like) components</label>
        {showLast && <EigenfaceGallery cols={3} items={data.last.map((src, i) => ({ src, caption: `eigenface ${148 + i}` }))} />}
      </>}
    </div>
  )
}

function VarianceStep() {
  const { data, loading, error } = useAsync(() => lab5.variance(), [])
  const rows = data?.cumulative.map((c, i) => ({ k: i + 1, pct: +(c * 100).toFixed(2) })) ?? []
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} />
      {data && <>
        <p className="font-mono text-sm"><span className="text-accent">{data.k90}</span> components capture 90% of the variance.</p>
        <div className="card h-64 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, left: -10, bottom: 14 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="k" tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--line)" label={{ value: 'components', position: 'insideBottom', offset: -8, fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--line)" />
              <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', fontSize: 12 }} />
              <ReferenceLine y={90} stroke="var(--hot)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <ReferenceDot x={data.k90} y={90} r={5} fill="var(--hot)" stroke="none" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>}
    </div>
  )
}

function FacePicker({ idx, setIdx, max }: { idx: number; setIdx: (n: number) => void; max: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button className="btn" onClick={() => setIdx((idx - 1 + max) % max)}>←</button>
      <span className="font-mono">test face {idx + 1} / {max}</span>
      <button className="btn" onClick={() => setIdx((idx + 1) % max)}>→</button>
      <button className="btn" onClick={() => setIdx(Math.floor(Math.random() * max))}>Random</button>
    </div>
  )
}

function ReconStep() {
  const [idx, setIdx] = useState(0)
  const [k, setK] = useState(50)
  const { data, loading, error } = useDebouncedProcess(() => lab5.reconstruct(idx, k), [idx, k], 200)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <FacePicker idx={idx} setIdx={setIdx} max={data?.n_test ?? 1} />
        <ParameterSlider label="Components k" value={k} min={1} max={150} onChange={setK} />
      </div>
      <Status loading={loading} error={error} />
      {data && <div className="grid max-w-md grid-cols-2 gap-3">
        <figure className="card overflow-hidden"><img src={data.original} className="block w-full" alt="Original" /><figcaption className="tag p-1.5 text-center">original · {data.name}</figcaption></figure>
        <figure className="card overflow-hidden"><img src={data.reconstructed} className="block w-full" alt="Reconstruction" />
          <figcaption className="flex items-center justify-between p-1.5"><span className="tag">k = {k} · MSE {data.mse.toFixed(0)}</span><DownloadButton src={data.reconstructed} name={`recon_k${k}`} label="" /></figcaption></figure>
      </div>}
    </div>
  )
}

function TrainStep() {
  const { data, loading, error } = useAsync(() => lab5.train(), [])
  return (
    <div className="space-y-3">
      <p className="font-mono text-sm text-muted">SVC(kernel='rbf', class_weight='balanced') on the PCA features</p>
      <Status loading={loading} error={error} />
      {data && <>
        <p className="font-mono text-lg">accuracy <span className="text-accent">{(data.accuracy * 100).toFixed(1)}%</span> <span className="text-sm text-muted">· trained in {data.train_time.toFixed(1)} s</span></p>
        <div className="overflow-x-auto"><table className="card w-full text-sm">
          <thead><tr className="tag border-b border-line text-left"><th className="p-2">Person</th><th>Precision</th><th>Recall</th><th>F1</th><th>Support</th></tr></thead>
          <tbody>{data.rows.map((r) => <tr key={r.name} className="border-b border-line/60 font-mono last:border-0"><td className="p-2 font-sans">{r.name}</td><td>{r.precision.toFixed(2)}</td><td>{r.recall.toFixed(2)}</td><td>{r['f1-score'].toFixed(2)}</td><td>{r.support}</td></tr>)}</tbody>
        </table></div>
      </>}
    </div>
  )
}

function RecognizeStep() {
  const [idx, setIdx] = useState(0)
  const { data, loading, error } = useDebouncedProcess(() => lab5.predict(idx), [idx], 100)
  return (
    <div className="space-y-3">
      <FacePicker idx={idx} setIdx={setIdx} max={data?.n_test ?? 1} />
      <Status loading={loading} error={error} />
      {data && <div className="flex items-center gap-4">
        <img src={data.image} alt="Test face" className="card w-32" />
        <div className="font-mono text-sm">
          <p>predicted: <b>{data.predicted}</b></p><p>actual: <b>{data.actual}</b></p>
          <p className={data.correct ? 'text-accent' : 'text-hot'}>{data.correct ? '✓ correct' : '✗ misclassified'}</p>
        </div>
      </div>}
    </div>
  )
}

function FailStep() {
  const { data, loading, error } = useAsync(() => lab5.failures(), [])
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} />
      {data && <>
        <p className="font-mono text-sm">{data.wrong} of {data.total} test faces were misclassified.</p>
        <EigenfaceGallery cols={6} items={data.items.map((f) => ({ src: f.image, caption: `${f.actual} → ${f.predicted}`, tone: 'bad' }))} />
        <ObservationBox noteKey="5:fail" placeholder="Why might these faces be confused? Think about pose, lighting, expression and class imbalance." />
      </>}
    </div>
  )
}

export default function Lab05PcaEigenfaces() {
  return (
    <LabLayout lab={lab} sharedImage={false}
      runLabels={{ data: 'Load LFW dataset', fit: 'Fit PCA', train: 'Train SVC' }}
      render={{ data: () => <DataStep />, fit: () => <FitStep />, eigen: () => <EigenStep />, variance: () => <VarianceStep />,
        recon: () => <ReconStep />, train: () => <TrainStep />, recognize: () => <RecognizeStep />, fail: () => <FailStep /> }} />
  )
}
