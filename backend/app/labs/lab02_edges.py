"""Lab 2 - Edge detection: Gaussian blur, Sobel X/Y, magnitude, Canny."""
import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile

from ..utils import read_image, to_b64, to_gray

router = APIRouter()


def _u8(a: np.ndarray) -> np.ndarray:
    """Scale a float array (abs value) to 0-255 for display."""
    return cv2.normalize(np.abs(a), None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)


@router.post("/run")
async def run(file: UploadFile = File(...), blur: int = Form(3), sobel_k: int = Form(3),
              low: int = Form(100), high: int = Form(200)):
    gray = to_gray(await read_image(file))
    blur += 1 - blur % 2          # kernel sizes must be odd
    sobel_k = min(7, sobel_k + 1 - sobel_k % 2)
    blurred = cv2.GaussianBlur(gray, (blur, blur), 0)
    sx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=sobel_k)
    sy = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=sobel_k)
    mag = cv2.magnitude(sx, sy)
    canny = cv2.Canny(blurred, low, high)
    n = int(np.count_nonzero(canny))
    return {
        "gray": to_b64(gray), "blurred": to_b64(blurred),
        "sobel_x": to_b64(_u8(sx)), "sobel_y": to_b64(_u8(sy)),
        "magnitude": to_b64(_u8(mag)), "canny": to_b64(canny),
        "params": {"blur": blur, "sobel_k": sobel_k, "low": low, "high": high},
        "edge_pixels": n, "edge_ratio": n / canny.size,
    }
