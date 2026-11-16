"""Lab 4 - SURF feature detection, matching, and SURF/ORB/SIFT comparison.

SURF is patented and only exists in opencv-contrib builds with OPENCV_ENABLE_NONFREE.
When it is unavailable every endpoint falls back to ORB and reports `fallback: true`.
"""
import time

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, UploadFile

from ..utils import read_image, to_b64, to_gray

router = APIRouter()


def make_detector(name: str, hessian: float = 400, upright: bool = False):
    """Return (detector, actual_name, is_binary). Falls back to ORB if SURF is missing."""
    if name == "SURF":
        try:
            return cv2.xfeatures2d.SURF_create(hessianThreshold=hessian, upright=upright), "SURF", False
        except Exception:
            name = "ORB"
    if name == "SIFT":
        return cv2.SIFT_create(), "SIFT", False
    return cv2.ORB_create(nfeatures=1500), "ORB", True


def surf_available() -> bool:
    try:
        cv2.xfeatures2d.SURF_create()
        return True
    except Exception:
        return False


def match(d1, d2, binary: bool, ratio: float, matcher: str):
    """Lowe ratio-test matching with BFMatcher or FLANN."""
    if d1 is None or d2 is None or len(d1) < 2 or len(d2) < 2:
        return []
    if matcher == "flann" and not binary:
        m = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=50))
    else:
        m = cv2.BFMatcher(cv2.NORM_HAMMING if binary else cv2.NORM_L2)
    good = []
    for pair in m.knnMatch(d1, d2, k=2):
        if len(pair) == 2 and pair[0].distance < ratio * pair[1].distance:
            good.append(pair[0])
    return good


@router.get("/status")
def status():
    return {"surf": surf_available()}


@router.post("/detect")
async def detect(file: UploadFile = File(...), hessian: float = Form(400), upright: bool = Form(False)):
    gray = to_gray(await read_image(file))
    det, used, _ = make_detector("SURF", hessian, upright)
    t = time.perf_counter()
    kps, desc = det.detectAndCompute(gray, None)
    ms = (time.perf_counter() - t) * 1000
    plain = cv2.drawKeypoints(gray, kps, None, color=(0, 255, 0))
    rich = cv2.drawKeypoints(gray, kps, None, color=(255, 80, 0),
                             flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
    return {"plain": to_b64(plain), "rich": to_b64(rich), "count": len(kps), "ms": ms,
            "algorithm": used, "fallback": used != "SURF", "upright": upright,
            "descriptor_dim": int(desc.shape[1]) if desc is not None else 0}


@router.post("/match")
async def match_images(file: UploadFile = File(...), file2: UploadFile = File(...),
                       hessian: float = Form(400), ratio: float = Form(0.75),
                       matcher: str = Form("bf")):
    a, b = to_gray(await read_image(file)), to_gray(await read_image(file2))
    det, used, binary = make_detector("SURF", hessian)
    k1, d1 = det.detectAndCompute(a, None)
    k2, d2 = det.detectAndCompute(b, None)
    good = match(d1, d2, binary, ratio, matcher)
    vis = cv2.drawMatches(a, k1, b, k2, sorted(good, key=lambda m: m.distance)[:100], None,
                          flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
    return {"image": to_b64(vis), "kp1": len(k1), "kp2": len(k2), "matches": len(good),
            "algorithm": used, "fallback": used != "SURF", "matcher": matcher}


@router.post("/compare")
async def compare(file: UploadFile = File(...), file2: UploadFile = File(...),
                  hessian: float = Form(400), ratio: float = Form(0.75)):
    a, b = to_gray(await read_image(file)), to_gray(await read_image(file2))
    rows = []
    for name in ("SURF", "ORB", "SIFT"):
        det, used, binary = make_detector(name, hessian)
        if name == "SURF" and used != "SURF":
            rows.append({"algorithm": "SURF", "available": False, "keypoints": 0, "matches": 0, "ms": 0})
            continue
        t = time.perf_counter()
        k1, d1 = det.detectAndCompute(a, None)
        k2, d2 = det.detectAndCompute(b, None)
        good = match(d1, d2, binary, ratio, "bf")
        rows.append({"algorithm": name, "available": True, "keypoints": len(k1) + len(k2),
                     "matches": len(good), "ms": (time.perf_counter() - t) * 1000})
    return {"rows": rows}


@router.post("/rotation")
async def rotation_test(file: UploadFile = File(...), hessian: float = Form(400),
                        angle: float = Form(45), upright: bool = Form(False),
                        ratio: float = Form(0.75)):
    """Match an image against a rotated copy of itself, with SURF or U-SURF."""
    a = to_gray(await read_image(file))
    h, w = a.shape
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    b = cv2.warpAffine(a, M, (w, h))
    det, used, binary = make_detector("SURF", hessian, upright)
    k1, d1 = det.detectAndCompute(a, None)
    k2, d2 = det.detectAndCompute(b, None)
    good = match(d1, d2, binary, ratio, "bf")
    # A match is correct if the matched point lands near where the rotation maps it.
    correct = 0
    for m in good:
        p = M @ np.array([*k1[m.queryIdx].pt, 1.0])
        if np.linalg.norm(p - np.array(k2[m.trainIdx].pt)) < 5:
            correct += 1
    vis = cv2.drawMatches(a, k1, b, k2, sorted(good, key=lambda m: m.distance)[:80], None,
                          flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
    return {"image": to_b64(vis), "matches": len(good), "correct": correct,
            "precision": correct / len(good) if good else 0.0, "algorithm": used,
            "fallback": used != "SURF", "upright": upright, "angle": angle}
