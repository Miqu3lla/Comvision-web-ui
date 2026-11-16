// One typed client per lab. Each function maps 1:1 to a FastAPI endpoint.
import { get, post } from './client'

export interface Shape { height: number; width: number; channels: number }
type Img = { image: string }

// ---- Lab 1 -------------------------------------------------------------------------
export const lab1 = {
  info: (file: File) => post<Img & { shape: Shape; name: string; dtype: string; pixels: number }>('/api/lab1/info', { file }),
  channels: (file: File) => post<Record<'blue' | 'green' | 'red' | 'blue_gray' | 'green_gray' | 'red_gray' | 'misread', string> & { mean: number[] }>('/api/lab1/channels', { file }),
  gray: (file: File) => post<{ gray: string; shape: Shape }>('/api/lab1/grayscale', { file }),
  paint: (file: File, x: number, y: number, rgb: [number, number, number], size: number) =>
    post<Img>('/api/lab1/paint', { file, x, y, r: rgb[0], g: rgb[1], b: rgb[2], size }),
  crop: (file: File, x: number, y: number, w: number, h: number) => post<Img & { shape: Shape }>('/api/lab1/crop', { file, x, y, w, h }),
  resize: (file: File, scale: number) => post<Img & { shape: Shape }>('/api/lab1/resize', { file, scale }),
  rotate: (file: File, angle: number) => post<Img & { shape: Shape }>('/api/lab1/rotate', { file, angle }),
}

// ---- Lab 2 -------------------------------------------------------------------------
export interface EdgeResult {
  gray: string; blurred: string; sobel_x: string; sobel_y: string; magnitude: string; canny: string
  edge_pixels: number; edge_ratio: number
}
export const lab2 = {
  run: (file: File, blur: number, sobel_k: number, low: number, high: number, signal?: AbortSignal) =>
    post<EdgeResult>('/api/lab2/run', { file, blur, sobel_k, low, high }, signal),
}

// ---- Lab 3 -------------------------------------------------------------------------
export interface Stats { mean: number; std: number; min: number; max: number }
export interface HistResult {
  images: Record<'original' | 'gray' | 'global' | 'color_eq' | 'stretched' | 'clahe', string>
  hist: Record<'gray' | 'global' | 'stretched' | 'clahe' | 'color_before' | 'color_after', number[]>
  stats: Record<'gray' | 'global' | 'stretched' | 'clahe' | 'color_before' | 'color_after', Stats>
}
export const lab3 = {
  run: (file: File, p: { color_mode: string; alpha: number; beta: number; clip: number; tile: number }, signal?: AbortSignal) =>
    post<HistResult>('/api/lab3/run', { file, ...p }, signal),
}

// ---- Lab 4 -------------------------------------------------------------------------
export interface DetectResult { plain: string; rich: string; count: number; ms: number; algorithm: string; fallback: boolean; descriptor_dim: number }
export interface MatchResult { image: string; kp1: number; kp2: number; matches: number; algorithm: string; fallback: boolean }
export interface CompareRow { algorithm: string; available: boolean; keypoints: number; matches: number; ms: number }
export interface RotationResult { image: string; matches: number; correct: number; precision: number; algorithm: string; fallback: boolean }
export const lab4 = {
  detect: (file: File, hessian: number, upright: boolean, signal?: AbortSignal) => post<DetectResult>('/api/lab4/detect', { file, hessian, upright }, signal),
  match: (file: File, file2: File, hessian: number, ratio: number, matcher: string, signal?: AbortSignal) =>
    post<MatchResult>('/api/lab4/match', { file, file2, hessian, ratio, matcher }, signal),
  compare: (file: File, file2: File, hessian: number, ratio: number) => post<{ rows: CompareRow[] }>('/api/lab4/compare', { file, file2, hessian, ratio }),
  rotation: (file: File, hessian: number, angle: number, upright: boolean) => post<RotationResult>('/api/lab4/rotation', { file, hessian, angle, upright }),
}

// ---- Lab 5 -------------------------------------------------------------------------
export interface Face { image: string; name: string }
export const lab5 = {
  dataset: () => get<{ n_samples: number; n_features: number; height: number; width: number; n_classes: number; names: string[]; n_train: number; n_test: number; samples: Face[] }>('/api/lab5/dataset'),
  fit: () => get<{ fit_time: number; n_components: number; explained: number }>('/api/lab5/fit'),
  eigenfaces: () => get<{ first: string[]; last: string[] }>('/api/lab5/eigenfaces'),
  variance: () => get<{ cumulative: number[]; k90: number }>('/api/lab5/variance'),
  reconstruct: (idx: number, k: number) => get<{ original: string; reconstructed: string; mse: number; name: string; n_test: number }>(`/api/lab5/reconstruct/${idx}/${k}`),
  train: () => get<{ rows: { name: string; precision: number; recall: number; 'f1-score': number; support: number }[]; accuracy: number; train_time: number }>('/api/lab5/train'),
  predict: (idx: number) => get<{ image: string; predicted: string; actual: string; correct: boolean; n_test: number }>(`/api/lab5/predict/${idx}`),
  failures: () => get<{ total: number; wrong: number; items: { image: string; predicted: string; actual: string }[] }>('/api/lab5/failures'),
}

// ---- Lab 6 -------------------------------------------------------------------------
export interface Box { x1: number; y1: number; x2: number; y2: number; conf: number; label: string }
export interface YoloResult { image: string; boxes: Box[]; count: number; width: number; height: number; classes?: string[] }
export const lab6 = {
  detect: (file: File, conf: number, model: string, signal?: AbortSignal) => post<YoloResult>('/api/lab6/detect', { file, conf, model }, signal),
  frame: (file: Blob, conf: number, model: string) => post<Omit<YoloResult, 'image'>>('/api/lab6/frame', { file, conf, model }),
  labels: (file: File, labels: File) => post<{ image: string; count: number }>('/api/lab6/labels', { file, labels }),
  custom: (file: File, weights: File, conf: number) => post<YoloResult>('/api/lab6/custom', { file, weights, conf }),
}

// ---- Lab 7 -------------------------------------------------------------------------
export const lab7 = {
  threshold: (file: File, t: number, signal?: AbortSignal) => post<{ gray: string; global: string; otsu: string; otsu_value: number }>('/api/lab7/threshold', { file, t }, signal),
  adaptive: (file: File, block: number, c: number, signal?: AbortSignal) => post<{ mean: string; gaussian: string; block: number }>('/api/lab7/adaptive', { file, block, c }, signal),
  region: (file: File, x: number, y: number, tol: number) => post<{ mask: string; overlay: string; area: number; ratio: number }>('/api/lab7/region', { file, x, y, tol }),
  watershed: (file: File, fg: number, signal?: AbortSignal) => post<{ binary: string; distance: string; markers: string; result: string; objects: number }>('/api/lab7/watershed', { file, fg }, signal),
  edges: (file: File, low: number, high: number, signal?: AbortSignal) => post<{ canny: string; closed: string; contours: string; filled: string; count: number }>('/api/lab7/edges', { file, low, high }, signal),
  deeplab: (file: File, opacity: number) => post<{ mask: string; overlay: string; classes: { id: number; name: string; color: number[]; pixels: number }[] }>('/api/lab7/deeplab', { file, opacity }),
  compare: (file: File, gt: File | undefined, tol: number, run_deeplab: boolean) =>
    post<{ original: string; results: Record<string, string>; iou: Record<string, number> }>('/api/lab7/compare', { file, gt, tol, run_deeplab }),
}
