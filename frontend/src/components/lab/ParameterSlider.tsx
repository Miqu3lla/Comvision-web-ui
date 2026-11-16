interface Props {
  label: string; value: number; min: number; max: number; step?: number
  onChange: (v: number) => void; format?: (v: number) => string; hint?: string
}

export default function ParameterSlider({ label, value, min, max, step = 1, onChange, format, hint }: Props) {
  return (
    <label className="block min-w-44 flex-1">
      <span className="flex items-baseline justify-between">
        <span className="text-sm">{label}</span>
        <span className="font-mono text-sm text-accent">{format ? format(value) : value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}
