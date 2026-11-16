import { useEffect, useRef } from 'react'
import type { Box } from '../../api/labs'

/** Draws YOLO boxes (in source-pixel coordinates) over a video element or image. */
export default function DetectionCanvas({ boxes, width, height }: { boxes: Box[]; width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')!
    g.clearRect(0, 0, c.width, c.height)
    g.lineWidth = 3; g.font = '600 14px "IBM Plex Mono", monospace'
    for (const b of boxes) {
      g.strokeStyle = '#2dd4bf'; g.strokeRect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1)
      const t = `${b.label} ${(b.conf * 100).toFixed(0)}%`, w = g.measureText(t).width + 8
      g.fillStyle = '#2dd4bf'; g.fillRect(b.x1, Math.max(0, b.y1 - 20), w, 20)
      g.fillStyle = '#04120f'; g.fillText(t, b.x1 + 4, Math.max(14, b.y1 - 5))
    }
  }, [boxes, width, height])
  return <canvas ref={ref} width={width} height={height} className="pointer-events-none absolute inset-0 h-full w-full" />
}
