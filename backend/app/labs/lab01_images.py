"""Lab 1 - Image manipulation: shape, channels, grayscale, pixels, crop, resize, rotate."""
import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile

from ..utils import read_image, size_of, to_b64, to_gray

router = APIRouter()


@router.post("/info")
async def info(file: UploadFile = File(...)):
    img = await read_image(file)
    return {"image": to_b64(img), "shape": size_of(img), "name": file.filename,
            "dtype": str(img.dtype), "pixels": int(img.shape[0] * img.shape[1])}


@router.post("/channels")
async def channels(file: UploadFile = File(...)):
    """Split B, G, R. Each channel is returned tinted and as raw gray."""
    img = await read_image(file)
    b, g, r = cv2.split(img)
    z = np.zeros_like(b)
    return {
        "blue": to_b64(cv2.merge([b, z, z])),
        "green": to_b64(cv2.merge([z, g, z])),
        "red": to_b64(cv2.merge([z, z, r])),
        "blue_gray": to_b64(b), "green_gray": to_b64(g), "red_gray": to_b64(r),
        # Misreading: treat the BGR array as RGB (red and blue swap on display)
        "misread": to_b64(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)),
        "mean": [float(b.mean()), float(g.mean()), float(r.mean())],
    }


@router.post("/grayscale")
async def grayscale(file: UploadFile = File(...)):
    g = to_gray(await read_image(file))
    return {"gray": to_b64(g), "shape": size_of(g)}


@router.post("/paint")
async def paint(file: UploadFile = File(...), x: int = Form(...), y: int = Form(...),
                r: int = Form(...), g: int = Form(...), b: int = Form(...), size: int = Form(5)):
    """Paint at (x, y). size=1 changes exactly one pixel; otherwise a filled circle."""
    img = await read_image(file)
    if size <= 1:
        if 0 <= y < img.shape[0] and 0 <= x < img.shape[1]:
            img[y, x] = (b, g, r)
    else:
        cv2.circle(img, (x, y), size, (b, g, r), -1)
    return {"image": to_b64(img)}


@router.post("/crop")
async def crop(file: UploadFile = File(...), x: int = Form(...), y: int = Form(...),
               w: int = Form(...), h: int = Form(...)):
    img = await read_image(file)
    H, W = img.shape[:2]
    x, y = max(0, min(x, W - 1)), max(0, min(y, H - 1))
    out = img[y:y + max(1, h), x:x + max(1, w)]  # numpy slicing: rows (y) first
    return {"image": to_b64(out), "shape": size_of(out)}


@router.post("/resize")
async def resize(file: UploadFile = File(...), scale: float = Form(1.0)):
    img = await read_image(file)
    scale = max(0.05, min(scale, 4.0))
    out = cv2.resize(img, None, fx=scale, fy=scale,
                     interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC)
    return {"image": to_b64(out), "shape": size_of(out)}


@router.post("/rotate")
async def rotate(file: UploadFile = File(...), angle: int = Form(90)):
    img = await read_image(file)
    code = {90: cv2.ROTATE_90_CLOCKWISE, 180: cv2.ROTATE_180,
            270: cv2.ROTATE_90_COUNTERCLOCKWISE}.get(angle)
    out = cv2.rotate(img, code) if code is not None else img
    return {"image": to_b64(out), "shape": size_of(out)}
