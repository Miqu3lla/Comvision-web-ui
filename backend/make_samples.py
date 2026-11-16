"""Generate the sample images in backend/samples from scikit-image's bundled data.

Run once:  python make_samples.py
"""
from pathlib import Path

import cv2
import numpy as np
from skimage import data

OUT = Path(__file__).parent / "samples"
OUT.mkdir(exist_ok=True)


def save(name: str, img: np.ndarray, max_dim: int = 640):
    if img.ndim == 3 and img.shape[2] == 4:
        img = img[..., :3]
    if img.ndim == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    h, w = img.shape[:2]
    s = max_dim / max(h, w)
    if s < 1:
        img = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(OUT / name), img)
    print("wrote", name, img.shape)


save("astronaut.png", data.astronaut())
save("coins.png", data.coins())
save("camera.png", data.camera())
save("chelsea.png", data.chelsea())
save("coffee.png", data.coffee())
save("page.png", data.page())
save("street.png", data.rocket())
