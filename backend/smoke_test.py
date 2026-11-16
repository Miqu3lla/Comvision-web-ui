"""Smoke test: calls every lab endpoint that does not need a big download.

Run:  python smoke_test.py          (add --heavy for LFW, YOLO and DeepLab)
"""
import sys
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)
S = Path(__file__).parent / "samples"
heavy = "--heavy" in sys.argv
fails = []


def img(name="astronaut.png"):
    return open(S / name, "rb")


def check(label, resp, keys=()):
    ok = resp.status_code == 200 and all(k in resp.json() for k in keys)
    print(("PASS " if ok else "FAIL ") + label, "" if ok else f"{resp.status_code} {resp.text[:200]}")
    if not ok:
        fails.append(label)
    return resp.json() if resp.status_code == 200 else {}


def post(path, files=None, data=None):
    return c.post(path, files=files, data=data or {})


print(c.get("/api/health").json())
f = lambda n="astronaut.png": {"file": img(n)}
check("lab1 info", post("/api/lab1/info", f()), ["shape"])
check("lab1 channels", post("/api/lab1/channels", f()), ["blue", "misread"])
check("lab1 gray", post("/api/lab1/grayscale", f()), ["gray"])
check("lab1 paint", post("/api/lab1/paint", f(), dict(x=10, y=10, r=255, g=0, b=0, size=5)), ["image"])
check("lab1 crop", post("/api/lab1/crop", f(), dict(x=10, y=10, w=50, h=40)), ["image"])
check("lab1 resize", post("/api/lab1/resize", f(), dict(scale=0.5)), ["image"])
check("lab1 rotate", post("/api/lab1/rotate", f(), dict(angle=90)), ["image"])
check("lab2 run", post("/api/lab2/run", f(), dict(blur=3, sobel_k=3, low=100, high=200)), ["canny", "magnitude"])
check("lab3 run", post("/api/lab3/run", f(), dict(color_mode="hsv")), ["images", "hist"])
check("lab3 run yuv", post("/api/lab3/run", f(), dict(color_mode="yuv")), ["images", "hist"])
d = check("lab4 detect", post("/api/lab4/detect", f(), dict(hessian=400)), ["count"])
print("   algorithm:", d.get("algorithm"), "keypoints:", d.get("count"))
two = lambda: {"file": img(), "file2": img()}
check("lab4 match", post("/api/lab4/match", two(), dict(hessian=400, ratio=0.75, matcher="bf")), ["matches"])
check("lab4 match flann", post("/api/lab4/match", two(), dict(hessian=400, ratio=0.75, matcher="flann")), ["matches"])
r = check("lab4 compare", post("/api/lab4/compare", two(), dict(hessian=400, ratio=0.75)), ["rows"])
print("   ", r.get("rows"))
r = check("lab4 rotation", post("/api/lab4/rotation", f(), dict(hessian=400, angle=45, upright=True)), ["precision"])
print("   precision:", r.get("precision"))
check("lab6 labels", post("/api/lab6/labels", {"file": img(), "labels": ("l.txt", b"0 0.5 0.5 0.3 0.4\n")}), ["count"])
check("lab6 labels bad", c.post("/api/lab6/labels", files={"file": img(), "labels": ("l.txt", b"junk")}).status_code == 400 and c.get("/api/health"), [])
g = f("coins.png")
check("lab7 threshold", post("/api/lab7/threshold", g, dict(t=127)), ["otsu_value"])
check("lab7 adaptive", post("/api/lab7/adaptive", f("coins.png"), dict(block=11, c=2)), ["mean"])
check("lab7 region", post("/api/lab7/region", f("coins.png"), dict(x=100, y=100, tol=15)), ["area"])
r = check("lab7 watershed", post("/api/lab7/watershed", f("coins.png"), dict(fg=0.5)), ["objects"])
print("   objects:", r.get("objects"))
r = check("lab7 edges", post("/api/lab7/edges", f("coins.png"), dict(low=80, high=160)), ["count"])
print("   contours:", r.get("count"))
check("lab7 compare", post("/api/lab7/compare", {"file": img("coins.png"), "gt": img("coins.png")}, dict(tol=15, run_deeplab="false")), ["iou"])
check("bad upload", c.post("/api/lab1/info", files={"file": ("x.png", b"not an image")}).status_code == 400 and c.get("/api/health"), [])

if heavy:
    check("lab5 dataset", c.get("/api/lab5/dataset"), ["n_samples"])
    check("lab5 fit", c.get("/api/lab5/fit"), ["fit_time"])
    check("lab5 eigen", c.get("/api/lab5/eigenfaces"), ["first"])
    check("lab5 variance", c.get("/api/lab5/variance"), ["k90"])
    check("lab5 recon", c.get("/api/lab5/reconstruct/0/50"), ["reconstructed"])
    check("lab5 train", c.get("/api/lab5/train"), ["accuracy"])
    check("lab5 predict", c.get("/api/lab5/predict/0"), ["predicted"])
    check("lab5 failures", c.get("/api/lab5/failures"), ["items"])
    r = check("lab6 detect", post("/api/lab6/detect", {"file": img("astronaut.png")}, dict(conf=0.25, model="yolo11n.pt")), ["boxes"])
    print("   boxes:", [b["label"] for b in r.get("boxes", [])])
    r = check("lab7 deeplab", post("/api/lab7/deeplab", {"file": img("astronaut.png")}, dict(opacity=0.5)), ["classes"])
    print("   classes:", [x["name"] for x in r.get("classes", [])])

print("\nFAILED:" if fails else "\nALL PASSED", fails or "")
sys.exit(1 if fails else 0)
