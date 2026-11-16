import type { MouseEvent } from 'react'

/** Map a mouse event over an <img> (object-contain) to pixel coordinates of the real image. */
export function toImageXY(e: MouseEvent, img: HTMLImageElement) {
  const r = img.getBoundingClientRect()
  const scale = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight)
  const w = img.naturalWidth * scale, h = img.naturalHeight * scale
  const x = Math.floor((e.clientX - r.left - (r.width - w) / 2) / scale)
  const y = Math.floor((e.clientY - r.top - (r.height - h) / 2) / scale)
  const inside = x >= 0 && y >= 0 && x < img.naturalWidth && y < img.naturalHeight
  return { x, y, inside, scale, offX: (r.width - w) / 2, offY: (r.height - h) / 2 }
}
