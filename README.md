# CV Lab Workbench

One web app that compiles all 7 laboratory activities for **CSST106 – Perception and Computer Vision**
(BSCS 4A, 1st Semester, A.Y. 2026–2027, instructor Jeremy C. Reyes).

You work through the labs in order. Inside each lab you run every experiment step on a real image, a
slider, or your webcam, and look at the output. There are no quizzes. Every output can be downloaded as a
PNG for your lab report.

## The 7 labs

| # | Lab | Weeks | What you run |
|---|-----|-------|--------------|
| 1 | Image Manipulation | 1–2 | shape, BGR channels, grayscale, pixel inspect/paint, crop, resize, rotate |
| 2 | Edge Detection | 3–4 | Gaussian blur, Sobel X/Y, magnitude, Canny |
| 3 | Histogram Equalization | 4–5 | global HE, YUV/HSV equalization, contrast stretch, CLAHE |
| 4 | SURF Feature Detection | 6 | keypoints, matching, SURF vs ORB vs SIFT, U-SURF |
| 5 | PCA / Eigenfaces | 7–8 | LFW, PCA, eigenfaces, reconstruction, SVM recognition |
| 6 | YOLO Object Detection | 8–9 | image and webcam detection, label viewer, custom `best.pt` |
| 7 | Segmentation | 13 | Otsu, adaptive, region growing, watershed, contours, DeepLabV3 |

Each lab page shows the objective, algorithm, ordered steps, results, and a conclusion box. Steps unlock one
after another; labs are recommended in order but never hard-locked. Progress, observations and conclusions
are saved in your browser (`localStorage`), with a reset option on the home page.

## Setup

Requires Python 3.10+ and Node 18+.

```bash
# 1. backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python make_samples.py          # creates backend/samples (already committed)
uvicorn app.main:app --reload   # http://127.0.0.1:8000  (API docs at /docs)

# 2. frontend (new terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

The Vite dev server proxies `/api` and `/samples` to the backend on port 8000.

## Deploying the frontend to GitHub Pages

GitHub Pages only hosts static files, so only the React frontend goes there. The FastAPI backend must run
somewhere else (for example a Hugging Face Space with Docker, Render or Railway).

1. Push to `main` and enable **Settings > Pages > Source: GitHub Actions**.
2. Add a repository **variable** `VITE_API_BASE` (Settings > Secrets and variables > Actions > Variables)
   with your backend URL, e.g. `https://your-space.hf.space`.
3. `.github/workflows/pages.yml` builds `frontend/` and publishes it. The site uses hash routes
   (`/#/lab/3`) and ships the sample images itself, so only the lab processing needs the backend.

## Project layout

```
backend/
  app/main.py                    FastAPI app, one router per lab
  app/labs/lab01_images.py ... lab07_segmentation.py
  app/utils.py                   upload validation, downscaling, PNG/base64
  samples/                       built-in sample images
  smoke_test.py                  calls every endpoint (add --heavy for LFW/YOLO/DeepLab)
frontend/src/
  pages/                         Home, About, Lab01 … Lab07
  components/{home,layout,lab,labs}/
  hooks/                         useLabProgress, useDebouncedProcess, useWebcam
  api/                           typed client for every endpoint
  data/labs.ts                   lab metadata, objectives, steps
```

## Notes

- **SURF / contrib:** SURF is patented and only exists in OpenCV *contrib* builds compiled with
  `OPENCV_ENABLE_NONFREE`. The pip wheels do not include it, so Lab 4 shows a notice and falls back to
  **ORB**. SIFT and ORB always work. To use real SURF, install an OpenCV build with non-free enabled.
- **First Lab 5 run** downloads the LFW dataset (~200 MB, needs internet) and trains PCA + SVC once. The
  fitted model is then cached in memory for every later step.
- **YOLO and DeepLabV3** weights (`yolo11n.pt`, `yolov8n.pt`, DeepLabV3-MobileNetV3) download automatically on
  first use. Lab 6 training is shown as copyable commands; it is not run inside the app.
- Webcam features need a browser that allows camera access (localhost is fine).
- Large images are downscaled on the backend (1024 px max, 960 px for YOLO) and uploads over 15 MB are rejected.

## Screenshots

Add your own report screenshots here, e.g. `docs/lab1.png`. Every output has a **↓ PNG** button.

## Tests

```bash
cd backend && python smoke_test.py            # fast endpoints
cd backend && python smoke_test.py --heavy    # also LFW, YOLO and DeepLab (downloads required)
cd frontend && npm run build                  # type-check + production build
```
