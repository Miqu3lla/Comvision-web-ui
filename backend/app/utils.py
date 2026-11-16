"""Shared helpers: upload validation, image decoding, PNG/base64 encoding."""
import base64

import cv2
import numpy as np
from fastapi import HTTPException, UploadFile

MAX_BYTES = 15 * 1024 * 1024  # reject uploads bigger than 15 MB
MAX_DIM = 1024                # larger images are downscaled for speed


def downscale(img: np.ndarray, max_dim: int = MAX_DIM) -> np.ndarray:
    h, w = img.shape[:2]
    s = max_dim / max(h, w)
    if s >= 1:
        return img
    return cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)


async def read_image(file: UploadFile, flags=cv2.IMREAD_COLOR, max_dim: int = MAX_DIM) -> np.ndarray:
    """Decode an uploaded image into a BGR (or gray) ndarray, with validation."""
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty upload.")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image is larger than 15 MB.")
    img = cv2.imdecode(np.frombuffer(data, np.uint8), flags)
    if img is None:
        raise HTTPException(400, "File is not a readable image.")
    return downscale(img, max_dim)


def to_gray(img: np.ndarray) -> np.ndarray:
    return img if img.ndim == 2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def to_b64(img: np.ndarray) -> str:
    """Encode an ndarray as a PNG data URL."""
    ok, buf = cv2.imencode(".png", img)
    if not ok:
        raise HTTPException(500, "Could not encode image.")
    return "data:image/png;base64," + base64.b64encode(buf).decode()


def size_of(img: np.ndarray) -> dict:
    h, w = img.shape[:2]
    return {"height": h, "width": w, "channels": 1 if img.ndim == 2 else img.shape[2]}
