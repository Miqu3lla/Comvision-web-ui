import { SAMPLES } from '../../data/labs'
import { sampleUrl } from '../../api/base'

/** Preview of the built-in sample images shipped in public/samples. */
export default function SampleGalleryStrip() {
  return (
    <section className="card p-5">
      <p className="tag mb-3">Built-in samples</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SAMPLES.map((s) => (
          <figure key={s.file} className="w-24 shrink-0">
            <img src={sampleUrl(s.file)} alt={s.label} loading="lazy"
              className="img-frame h-20 w-24 rounded-md border border-line object-cover" />
            <figcaption className="mt-1 truncate text-center font-mono text-[10px] text-muted">{s.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
