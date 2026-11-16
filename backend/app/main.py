"""CV Lab Workbench - FastAPI entry point.  Run: uvicorn app.main:app --reload"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .labs import (lab01_images, lab02_edges, lab03_histogram, lab04_surf,
                   lab05_pca, lab06_yolo, lab07_segmentation)

app = FastAPI(title="CV Lab Workbench", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

for n, mod in enumerate([lab01_images, lab02_edges, lab03_histogram, lab04_surf,
                         lab05_pca, lab06_yolo, lab07_segmentation], start=1):
    app.include_router(mod.router, prefix=f"/api/lab{n}", tags=[f"lab{n}"])

SAMPLES = Path(__file__).resolve().parent.parent / "samples"
SAMPLES.mkdir(exist_ok=True)
app.mount("/samples", StaticFiles(directory=SAMPLES), name="samples")


@app.get("/api/health")
def health():
    import cv2
    try:
        cv2.xfeatures2d.SURF_create()
        surf = True
    except Exception:
        surf = False
    return {"ok": True, "opencv": cv2.__version__, "surf": surf,
            "samples": sorted(p.name for p in SAMPLES.glob("*.png"))}
