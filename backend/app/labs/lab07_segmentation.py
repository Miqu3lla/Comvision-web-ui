"""Lab 7 - Segmentation: thresholding, region growing, watershed, edges, DeepLabV3."""
import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..utils import read_image, to_b64, to_gray

router = APIRouter()


@router.post("/threshold")
async def threshold(file: UploadFile = File(...), t: int = Form(127)):
    g = cv2.GaussianBlur(to_gray(await read_image(file)), (5, 5), 0)
    _, glob = cv2.threshold(g, t, 255, cv2.THRESH_BINARY)
    otsu_t, otsu = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return {"gray": to_b64(g), "global": to_b64(glob), "otsu": to_b64(otsu), "otsu_value": float(otsu_t)}


@router.post("/adaptive")
async def adaptive(file: UploadFile = File(...), block: int = Form(11), c: int = Form(2)):
    g = to_gray(await read_image(file))
    block = max(3, block + 1 - block % 2)  # must be odd and >= 3
    mean = cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, block, c)
    gauss = cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block, c)
    return {"mean": to_b64(mean), "gaussian": to_b64(gauss), "block": block}


def grow(gray: np.ndarray, seed: tuple[int, int], tol: int) -> np.ndarray:
    """Breadth-first region growing: add 4-neighbours within `tol` of the seed intensity."""
    h, w = gray.shape
    sx, sy = seed
    ref = int(gray[sy, sx])
    mask = np.zeros((h, w), np.uint8)
    stack = [(sx, sy)]
    mask[sy, sx] = 255
    while stack:
        x, y = stack.pop()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny, nx] and abs(int(gray[ny, nx]) - ref) <= tol:
                mask[ny, nx] = 255
                stack.append((nx, ny))
    return mask


@router.post("/region")
async def region(file: UploadFile = File(...), x: int = Form(...), y: int = Form(...), tol: int = Form(15)):
    img = await read_image(file)
    g = cv2.GaussianBlur(to_gray(img), (5, 5), 0)
    h, w = g.shape
    x, y = max(0, min(x, w - 1)), max(0, min(y, h - 1))
    mask = grow(g, (x, y), tol)
    over = img.copy()
    over[mask > 0] = (0.5 * over[mask > 0] + 0.5 * np.array([255, 80, 0])).astype(np.uint8)
    cv2.circle(over, (x, y), 5, (0, 255, 255), -1)
    return {"mask": to_b64(mask), "overlay": to_b64(over), "area": int(np.count_nonzero(mask)),
            "ratio": float(np.count_nonzero(mask) / mask.size)}


@router.post("/watershed")
async def watershed(file: UploadFile = File(...), fg: float = Form(0.5)):
    img = await read_image(file)
    g = to_gray(img)
    _, bw = cv2.threshold(cv2.GaussianBlur(g, (5, 5), 0), 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    if bw.mean() > 127:  # make sure objects are white and the background is black
        bw = cv2.bitwise_not(bw)
    bw = cv2.morphologyEx(bw, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=2)
    cnts, _ = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    bw = np.zeros_like(bw)
    cv2.drawContours(bw, cnts, -1, 255, -1)                                 # fill holes inside objects
    bg = cv2.dilate(bw, np.ones((3, 3), np.uint8), iterations=3)           # sure background
    dist = cv2.distanceTransform(bw, cv2.DIST_L2, 5)
    # Normalize each blob by its own maximum so small and large objects both get markers.
    ncc, cc = cv2.connectedComponents(bw)
    local = np.zeros_like(dist)
    for i in range(1, ncc):
        m = cc == i
        local[m] = dist[m] / max(dist[m].max(), 1e-6)
    sure_fg = (local > fg).astype(np.uint8) * 255                           # sure foreground
    unknown = cv2.subtract(bg, sure_fg)
    n, markers = cv2.connectedComponents(sure_fg)
    markers += 1
    markers[unknown == 255] = 0
    markers = cv2.watershed(img, markers)
    out = img.copy()
    out[markers == -1] = (0, 0, 255)                                        # boundaries in red
    mk = cv2.applyColorMap(cv2.normalize(markers.clip(0), None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8),
                           cv2.COLORMAP_JET)
    return {"binary": to_b64(bw), "distance": to_b64(cv2.normalize(dist, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)),
            "markers": to_b64(mk), "result": to_b64(out), "objects": int(n - 1)}


@router.post("/edges")
async def edges(file: UploadFile = File(...), low: int = Form(80), high: int = Form(160)):
    img = await read_image(file)
    g = cv2.GaussianBlur(to_gray(img), (5, 5), 0)
    e = cv2.Canny(g, low, high)
    closed = cv2.morphologyEx(e, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = [c for c in cnts if cv2.contourArea(c) > 100]
    filled = np.zeros_like(g)
    cv2.drawContours(filled, cnts, -1, 255, -1)
    drawn = img.copy()
    cv2.drawContours(drawn, cnts, -1, (0, 255, 0), 2)
    return {"canny": to_b64(e), "closed": to_b64(closed), "contours": to_b64(drawn),
            "filled": to_b64(filled), "count": len(cnts)}


# ---- DeepLabV3 (PASCAL VOC classes) -------------------------------------------------------
VOC = ["background", "aeroplane", "bicycle", "bird", "boat", "bottle", "bus", "car", "cat", "chair", "cow",
       "dining table", "dog", "horse", "motorbike", "person", "potted plant", "sheep", "sofa", "train", "tv monitor"]
_dl = {}


def voc_palette() -> np.ndarray:
    """Standard PASCAL VOC colour map (RGB)."""
    pal = np.zeros((256, 3), np.uint8)
    for i in range(256):
        c, r, g, b = i, 0, 0, 0
        for j in range(8):
            r |= ((c >> 0) & 1) << (7 - j)
            g |= ((c >> 1) & 1) << (7 - j)
            b |= ((c >> 2) & 1) << (7 - j)
            c >>= 3
        pal[i] = (r, g, b)
    return pal


def deeplab_mask(img: np.ndarray) -> np.ndarray:
    import torch
    from torchvision.models.segmentation import (DeepLabV3_MobileNet_V3_Large_Weights,
                                                 deeplabv3_mobilenet_v3_large)
    if "m" not in _dl:
        w = DeepLabV3_MobileNet_V3_Large_Weights.DEFAULT
        _dl["m"], _dl["tf"] = deeplabv3_mobilenet_v3_large(weights=w).eval(), w.transforms()
    from PIL import Image
    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    with torch.no_grad():
        out = _dl["m"](_dl["tf"](pil).unsqueeze(0))["out"][0]
    labels = out.argmax(0).byte().cpu().numpy()
    return cv2.resize(labels, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_NEAREST)


@router.post("/deeplab")
async def deeplab(file: UploadFile = File(...), opacity: float = Form(0.5)):
    img = await read_image(file, max_dim=640)
    labels = deeplab_mask(img)
    color = voc_palette()[labels][..., ::-1]  # RGB palette -> BGR
    over = cv2.addWeighted(img, 1 - opacity, color.astype(np.uint8), opacity, 0)
    present = [{"id": int(i), "name": VOC[i], "color": [int(v) for v in voc_palette()[i]],
                "pixels": int((labels == i).sum())} for i in np.unique(labels)]
    return {"mask": to_b64(color.astype(np.uint8)), "overlay": to_b64(over), "classes": present}


@router.post("/compare")
async def compare(file: UploadFile = File(...), gt: UploadFile | None = File(None),
                  tol: int = Form(15), run_deeplab: bool = Form(False)):
    """Run the classical methods on one image and score each against an optional ground-truth mask."""
    img = await read_image(file)
    g = cv2.GaussianBlur(to_gray(img), (5, 5), 0)
    h, w = g.shape
    results = {
        "otsu": cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
        "adaptive": cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2),
        "region": grow(g, (w // 2, h // 2), tol),
    }
    e = cv2.morphologyEx(cv2.Canny(g, 80, 160), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    cnts, _ = cv2.findContours(e, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(g)
    cv2.drawContours(filled, [c for c in cnts if cv2.contourArea(c) > 100], -1, 255, -1)
    results["edges"] = filled
    if run_deeplab:
        results["deeplab"] = ((deeplab_mask(cv2.resize(img, (w, h))) > 0) * 255).astype(np.uint8)

    iou = {}
    if gt is not None and gt.filename:
        truth = await read_image(gt, cv2.IMREAD_GRAYSCALE)
        truth = cv2.resize(truth, (w, h), interpolation=cv2.INTER_NEAREST) > 127
        for k, m in results.items():
            for cand in (m > 127, m <= 127):  # Otsu polarity is arbitrary: keep the better of the two
                u = np.logical_or(cand, truth).sum()
                s = float(np.logical_and(cand, truth).sum() / u) if u else 0.0
                iou[k] = max(iou.get(k, 0.0), s)
    return {"original": to_b64(img), "results": {k: to_b64(v) for k, v in results.items()}, "iou": iou}
