import { downloadDataUrl } from '../../api/client'

export default function DownloadButton({ src, name, label = 'PNG' }: { src?: string | null; name: string; label?: string }) {
  return (
    <button className="btn btn-ghost !px-2 !py-1 text-xs" disabled={!src}
      onClick={() => src && downloadDataUrl(src, name.endsWith('.png') ? name : `${name}.png`)}
      title="Download as PNG">
      ↓ {label}
    </button>
  )
}
