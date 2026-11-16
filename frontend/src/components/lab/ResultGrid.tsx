import type { ReactNode } from 'react'
import DownloadButton from './DownloadButton'

export interface ResultItem { label: string; src?: string | null; file?: string; note?: ReactNode }

/** Grid of labelled output images, each with its own PNG download. */
export default function ResultGrid({ items, cols = 3 }: { items: ResultItem[]; cols?: 2 | 3 | 4 }) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[cols]
  return (
    <div className={`grid grid-cols-1 gap-3 ${grid}`}>
      {items.map((it) => (
        <figure key={it.label} className="card overflow-hidden">
          <div className="img-frame flex min-h-32 items-center justify-center">
            {it.src ? <img src={it.src} alt={it.label} className="max-h-72 w-full object-contain" />
              : <span className="tag p-6">…</span>}
          </div>
          <figcaption className="flex items-center justify-between gap-2 border-t border-line px-3 py-1.5">
            <span className="min-w-0 truncate text-sm">{it.label}{it.note && <span className="ml-2 font-mono text-xs text-muted">{it.note}</span>}</span>
            <DownloadButton src={it.src} name={it.file ?? it.label.toLowerCase().replace(/\W+/g, '_')} />
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
