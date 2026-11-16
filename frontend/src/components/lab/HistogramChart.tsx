import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/** 256-bin intensity histogram. */
export default function HistogramChart({ data, title, color = 'var(--accent)' }: { data: number[]; title: string; color?: string }) {
  const rows = data.map((count, v) => ({ v, count }))
  return (
    <div className="card p-3">
      <p className="tag mb-1">{title}</p>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="v" ticks={[0, 64, 128, 192, 255]} tick={{ fontSize: 10, fill: 'var(--muted)' }} stroke="var(--line)" />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} stroke="var(--line)" />
            <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', fontSize: 12 }} labelFormatter={(v) => `intensity ${v}`} />
            <Area type="monotone" dataKey="count" stroke={color} fill={color} fillOpacity={0.35} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
