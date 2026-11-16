import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getLab } from '../data/labs'
import { lab4, type CompareRow, type RotationResult } from '../api/labs'
import { useDebouncedProcess } from '../hooks/useDebouncedProcess'
import { useObjectUrl } from '../hooks/useObjectUrl'
import LabLayout from '../components/lab/LabLayout'
import ResultGrid from '../components/lab/ResultGrid'
import ParameterSlider from '../components/lab/ParameterSlider'
import ImageInput from '../components/lab/ImageInput'
import Status from '../components/lab/Status'
import ObservationBox from '../components/lab/ObservationBox'

const lab = getLab(4)

function Fallback({ show }: { show?: boolean }) {
  return show ? <p className="rounded-md border border-hot/40 bg-hot/10 px-3 py-2 text-sm">SURF is not available in this OpenCV build (it is patented and needs the contrib non-free build). Showing <b>ORB</b> instead.</p> : null
}

function GrayLoad({ file }: { file: File }) {
  const url = useObjectUrl(file)
  return <ResultGrid cols={2} items={[{ label: 'Input image', src: url, file: 'lab4_input' }]} />
}

function DetectStep({ file, rich, hessian, setHessian }: { file: File; rich?: boolean; hessian: number; setHessian: (n: number) => void }) {
  const { data, loading, error } = useDebouncedProcess((s) => lab4.detect(file, hessian, false, s), [file, hessian])
  return (
    <div className="space-y-3">
      <ParameterSlider label="Hessian threshold" value={hessian} min={50} max={3000} step={50} onChange={setHessian} hint="Higher threshold = fewer, stronger keypoints." />
      <Status loading={loading} error={error} />
      <Fallback show={data?.fallback} />
      {data && <>
        <p className="font-mono text-lg"><span className="text-accent">{data.count}</span> keypoints <span className="text-sm text-muted">· {data.algorithm} · {data.ms.toFixed(0)} ms · descriptor dim {data.descriptor_dim}</span></p>
        <ResultGrid cols={2} items={[rich ? { label: 'Rich keypoints (size + orientation)', src: data.rich, file: 'lab4_rich' } : { label: 'Keypoints', src: data.plain, file: 'lab4_keypoints' }]} />
      </>}
    </div>
  )
}

function MatchStep({ file, second, setSecond, hessian }: { file: File; second: File | null; setSecond: (f: File) => void; hessian: number }) {
  const [ratio, setRatio] = useState(0.75)
  const [matcher, setMatcher] = useState('bf')
  const { data, loading, error } = useDebouncedProcess((s) => lab4.match(file, second!, hessian, ratio, matcher, s), [file, second, hessian, ratio, matcher], 300, !!second)
  return (
    <div className="space-y-3">
      <ImageInput file={second} onChange={setSecond} label="Second image" compact />
      <div className="flex flex-wrap items-end gap-4">
        <ParameterSlider label="Lowe ratio" value={ratio} min={0.3} max={0.95} step={0.05} onChange={setRatio} format={(v) => v.toFixed(2)} hint="Lower = stricter matching." />
        <label className="text-sm">Matcher <select className="ml-2" value={matcher} onChange={(e) => setMatcher(e.target.value)}><option value="bf">BFMatcher</option><option value="flann">FLANN</option></select></label>
      </div>
      {!second && <p className="tag">Pick a second image (try the same sample for a self-match, or a different view).</p>}
      <Status loading={loading} error={error} />
      <Fallback show={data?.fallback} />
      {data && <>
        <p className="font-mono text-sm text-muted">{data.kp1} / {data.kp2} keypoints · <span className="text-accent">{data.matches}</span> good matches ({data.algorithm}, {matcher.toUpperCase()})</p>
        <ResultGrid cols={2} items={[{ label: 'Matches', src: data.image, file: 'lab4_matches' }]} />
      </>}
    </div>
  )
}

function CompareStep({ file, second, hessian }: { file: File; second: File | null; hessian: number }) {
  const [rows, setRows] = useState<CompareRow[] | null>(null)
  const [state, setState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })
  const run = async () => {
    setState({ loading: true, error: null })
    try { setRows((await lab4.compare(file, second ?? file, hessian, 0.75)).rows); setState({ loading: false, error: null }) }
    catch (e) { setState({ loading: false, error: (e as Error).message }) }
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Uses the second image from the matching step{second ? '' : ' (none chosen, so the image is matched with itself)'}.</p>
      <button className="btn btn-primary" onClick={run}>Compare detectors</button>
      <Status {...state} />
      {rows && <div className="grid gap-4 lg:grid-cols-2">
        <table className="card w-full text-sm">
          <thead><tr className="tag border-b border-line text-left"><th className="p-2">Algorithm</th><th>Keypoints</th><th>Matches</th><th>Time (ms)</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.algorithm} className="border-b border-line/60 font-mono last:border-0">
              <td className="p-2 font-sans font-medium">{r.algorithm}</td>
              {r.available ? <><td>{r.keypoints}</td><td>{r.matches}</td><td>{r.ms.toFixed(0)}</td></> : <td colSpan={3} className="text-muted">not available</td>}
            </tr>))}</tbody>
        </table>
        <div className="card h-56 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows.filter((r) => r.available)} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="algorithm" tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--line)" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--line)" />
              <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="keypoints" fill="var(--accent)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="matches" fill="var(--hot)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ms" name="time (ms)" fill="var(--muted)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>}
    </div>
  )
}

function UprightStep({ file, hessian }: { file: File; hessian: number }) {
  const [angle, setAngle] = useState(45)
  const [upright, setUpright] = useState(false)
  const [data, setData] = useState<RotationResult | null>(null)
  const [state, setState] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null })
  const run = async () => {
    setState({ loading: true, error: null })
    try { setData(await lab4.rotation(file, hessian, angle, upright)); setState({ loading: false, error: null }) }
    catch (e) { setState({ loading: false, error: (e as Error).message }) }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <ParameterSlider label="Rotation of the copy" value={angle} min={0} max={180} step={5} onChange={setAngle} format={(v) => `${v}°`} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={upright} onChange={(e) => setUpright(e.target.checked)} /> U-SURF (upright=True)</label>
        <button className="btn btn-primary" onClick={run}>Match with rotated copy</button>
      </div>
      <Status {...state} />
      <Fallback show={data?.fallback} />
      {data && <>
        <p className="font-mono text-sm text-muted">{data.algorithm}{data.fallback ? '' : upright ? ' (upright)' : ''} · {data.matches} matches · <span className="text-accent">{data.correct}</span> geometrically correct ({(data.precision * 100).toFixed(0)}%)</p>
        <ResultGrid cols={2} items={[{ label: `Original vs rotated ${angle}°`, src: data.image, file: 'lab4_rotation' }]} />
        <p className="text-xs text-muted">Try the same angle with U-SURF on and off. U-SURF skips orientation, so precision should drop as the angle grows.</p>
        <ObservationBox noteKey="4:upright" />
      </>}
    </div>
  )
}

export default function Lab04SurfFeatures() {
  const [hessian, setHessian] = useState(400)
  const [second, setSecond] = useState<File | null>(null)
  return (
    <LabLayout lab={lab} render={{
      load: (f) => <GrayLoad file={f} />,
      detect: (f) => <DetectStep file={f} hessian={hessian} setHessian={setHessian} />,
      rich: (f) => <DetectStep file={f} rich hessian={hessian} setHessian={setHessian} />,
      match: (f) => <MatchStep file={f} second={second} setSecond={setSecond} hessian={hessian} />,
      compare: (f) => <CompareStep file={f} second={second} hessian={hessian} />,
      upright: (f) => <UprightStep file={f} hessian={hessian} />,
    }} />
  )
}
