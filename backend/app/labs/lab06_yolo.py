"""Lab 6 - YOLO object detection (default yolo11n, optional yolov8n or custom best.pt)."""
import tempfile
from pathlib import Path

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..utils import read_image, to_b64

router = APIRouter()
_models: dict = {}
ALLOWED = {"yolo11n.pt", "yolov8n.pt"}


def get_model(name: str):
    """Load (and cache) a YOLO model; Ultralytics downloads stock weights on first use."""
    if name not in _models:
        from ultralytics import YOLO
        _models[name] = YOLO(name)
    return _models[name]


def run_model(model, img: np.ndarray, conf: float) -> dict:
    res = model.predict(img, conf=conf, verbose=False)[0]
    boxes = []
    for b in res.boxes:
        x1, y1, x2, y2 = (float(v) for v in b.xyxy[0])
        boxes.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "conf": float(b.conf[0]),
                      "label": res.names[int(b.cls[0])]})
    return {"image": to_b64(res.plot()), "boxes": boxes, "count": len(boxes),
            "width": img.shape[1], "height": img.shape[0]}


@router.post("/detect")
async def detect(file: UploadFile = File(...), conf: float = Form(0.25), model: str = Form("yolo11n.pt")):
    if model not in ALLOWED:
        raise HTTPException(400, "Unknown model.")
    img = await read_image(file, max_dim=960)
    return run_model(get_model(model), img, conf)


@router.post("/frame")
async def frame(file: UploadFile = File(...), conf: float = Form(0.35), model: str = Form("yolo11n.pt")):
    """Webcam frames: return only boxes (the browser draws them) to keep payloads small."""
    if model not in ALLOWED:
        raise HTTPException(400, "Unknown model.")
    img = await read_image(file, max_dim=480)
    out = run_model(get_model(model), img, conf)
    out.pop("image")
    return out


@router.post("/labels")
async def draw_labels(file: UploadFile = File(...), labels: UploadFile = File(...)):
    """Draw YOLO-format boxes (class cx cy w h, all normalized) on the image."""
    img = await read_image(file)
    h, w = img.shape[:2]
    text = (await labels.read()).decode("utf-8", errors="ignore")
    drawn = []
    for line in text.splitlines():
        p = line.split()
        if len(p) < 5:
            continue
        try:
            c, cx, cy, bw, bh = int(float(p[0])), *map(float, p[1:5])
        except ValueError:
            continue
        x1, y1 = int((cx - bw / 2) * w), int((cy - bh / 2) * h)
        x2, y2 = int((cx + bw / 2) * w), int((cy + bh / 2) * h)
        cv2.rectangle(img, (x1, y1), (x2, y2), (255, 120, 0), 2)
        cv2.putText(img, f"class {c}", (x1, max(14, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 120, 0), 2)
        drawn.append({"class": c, "x1": x1, "y1": y1, "x2": x2, "y2": y2})
    if not drawn:
        raise HTTPException(400, "No valid YOLO label lines found (expected: class cx cy w h).")
    return {"image": to_b64(img), "boxes": drawn, "count": len(drawn)}


@router.post("/custom")
async def custom(file: UploadFile = File(...), weights: UploadFile = File(...), conf: float = Form(0.25)):
    """Run detection with an uploaded best.pt (saved to a temp file, then loaded)."""
    if not weights.filename or not weights.filename.endswith(".pt"):
        raise HTTPException(400, "Weights must be a .pt file.")
    img = await read_image(file, max_dim=960)
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "best.pt"
        path.write_bytes(await weights.read())
        try:
            from ultralytics import YOLO
            model = YOLO(str(path))
            return run_model(model, img, conf) | {"classes": list(model.names.values())}
        except Exception as e:
            raise HTTPException(400, f"Could not load weights: {e}")
