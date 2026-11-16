import { useCallback, useEffect, useRef, useState } from 'react'

/** Webcam access: attach `videoRef` to a <video>, call start()/stop()/grab(). */
export function useWebcam() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true); setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera unavailable')
    }
  }, [])

  /** Capture the current frame as a JPEG/PNG Blob. */
  const grab = useCallback((type = 'image/jpeg', quality = 0.7, maxW = 480): Promise<Blob | null> => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return Promise.resolve(null)
    const s = Math.min(1, maxW / v.videoWidth)
    const c = document.createElement('canvas')
    c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s)
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
    return new Promise((res) => c.toBlob(res, type, quality))
  }, [])

  useEffect(() => stop, [stop])
  return { videoRef, active, error, start, stop, grab }
}
