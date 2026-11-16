/** Grid of small face-like images (eigenfaces, samples, failures). */
export default function EigenfaceGallery({ items, cols = 6 }: { items: { src: string; caption?: string; tone?: 'ok' | 'bad' }[]; cols?: 3 | 4 | 6 }) {
  const c = { 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4', 6: 'grid-cols-3 sm:grid-cols-6' }[cols]
  return (
    <div className={`grid gap-2 ${c}`}>
      {items.map((it, i) => (
        <figure key={i} className={`card overflow-hidden ${it.tone === 'bad' ? '!border-hot' : ''}`}>
          <img src={it.src} alt={it.caption ?? `face ${i + 1}`} className="img-frame block w-full" />
          {it.caption && <figcaption className="truncate px-1.5 py-1 text-center font-mono text-[10px] text-muted">{it.caption}</figcaption>}
        </figure>
      ))}
    </div>
  )
}
