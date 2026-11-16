"""Lab 3 - Histogram equalization and contrast adjustment."""
import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile

from ..utils import read_image, to_b64, to_gray

router = APIRouter()


def hist(gray: np.ndarray) -> list[int]:
    return cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten().astype(int).tolist()


def stats(gray: np.ndarray) -> dict:
    return {"mean": float(gray.mean()), "std": float(gray.std()),
            "min": int(gray.min()), "max": int(gray.max())}


@router.post("/run")
async def run(file: UploadFile = File(...), color_mode: str = Form("yuv"),
              alpha: float = Form(1.5), beta: int = Form(0),
              clip: float = Form(2.0), tile: int = Form(8)):
    img = await read_image(file)
    gray = to_gray(img)
    ge = cv2.equalizeHist(gray)  # global histogram equalization

    if color_mode == "hsv":      # equalize only the V channel
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hsv[..., 2] = cv2.equalizeHist(hsv[..., 2])
        color = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    else:                        # equalize only the luma (Y) channel
        yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
        yuv[..., 0] = cv2.equalizeHist(yuv[..., 0])
        color = cv2.cvtColor(yuv, cv2.COLOR_YUV2BGR)

    stretched = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)  # g = alpha*f + beta
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(tile, tile)).apply(gray)

    images = {"original": img, "gray": gray, "global": ge, "color_eq": color,
              "stretched": stretched, "clahe": clahe}
    measured = {"gray": gray, "global": ge, "stretched": stretched, "clahe": clahe,
                "color_before": gray, "color_after": to_gray(color)}
    return {
        "images": {k: to_b64(v) for k, v in images.items()},
        "hist": {k: hist(v) for k, v in measured.items()},
        "stats": {k: stats(v) for k, v in measured.items()},
    }
