import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button className="btn btn-ghost !px-2.5" onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
      <span className="tag !text-ink">{dark ? 'Dark' : 'Light'}</span>
      <span className="inline-block h-3.5 w-3.5 rounded-full border border-ink" style={{ background: dark ? 'var(--accent)' : 'transparent' }} />
    </button>
  )
}
