"""Lab 5 - PCA / Eigenfaces on the LFW dataset (model is trained once, then cached)."""
import threading
import time

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from sklearn.datasets import fetch_lfw_people
from sklearn.decomposition import PCA
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC

from ..utils import to_b64

router = APIRouter()
_lock = threading.Lock()
_S: dict = {}  # cached state: dataset, PCA, classifier


def _img(vec: np.ndarray, h: int, w: int, scale: int = 3) -> str:
    """Render a flat vector as a normalized grayscale PNG."""
    a = cv2.normalize(vec.reshape(h, w), None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return to_b64(cv2.resize(a, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC))


def dataset():
    with _lock:
        if "X" not in _S:
            try:
                lfw = fetch_lfw_people(min_faces_per_person=70, resize=0.4)
            except Exception as e:  # first run needs internet for the ~200 MB download
                raise HTTPException(503, f"Could not download the LFW dataset: {e}")
            n, h, w = lfw.images.shape
            Xtr, Xte, ytr, yte = train_test_split(lfw.data, lfw.target, test_size=0.2, random_state=42)
            _S.update(X=lfw.data, y=lfw.target, names=lfw.target_names, h=h, w=w,
                      Xtr=Xtr, Xte=Xte, ytr=ytr, yte=yte)
    return _S


def fitted():
    d = dataset()
    with _lock:
        if "pca" not in d:
            t = time.perf_counter()
            pca = PCA(n_components=150, svd_solver="randomized", whiten=True, random_state=42)
            pca.fit(d["Xtr"])                      # fit on training data ONLY
            d["fit_time"] = time.perf_counter() - t
            d["pca"] = pca
            d["Ptr"], d["Pte"] = pca.transform(d["Xtr"]), pca.transform(d["Xte"])
    return d


def trained():
    d = fitted()
    with _lock:
        if "clf" not in d:
            t = time.perf_counter()
            clf = SVC(kernel="rbf", class_weight="balanced", C=1000, gamma=0.005)
            clf.fit(d["Ptr"], d["ytr"])
            d["train_time"] = time.perf_counter() - t
            d["clf"] = clf
            d["pred"] = clf.predict(d["Pte"])
    return d


@router.get("/dataset")
def get_dataset():
    d = dataset()
    h, w = d["h"], d["w"]
    idx = np.random.RandomState(0).choice(len(d["X"]), 12, replace=False)
    return {"n_samples": len(d["X"]), "n_features": h * w, "height": h, "width": w,
            "n_classes": len(d["names"]), "names": d["names"].tolist(),
            "n_train": len(d["Xtr"]), "n_test": len(d["Xte"]),
            "samples": [{"image": _img(d["X"][i], h, w), "name": str(d["names"][d["y"][i]])} for i in idx]}


@router.get("/fit")
def fit():
    d = fitted()
    return {"fit_time": d["fit_time"], "n_components": 150,
            "explained": float(d["pca"].explained_variance_ratio_.sum())}


@router.get("/eigenfaces")
def eigenfaces():
    d = fitted()
    comps, h, w = d["pca"].components_, d["h"], d["w"]
    return {"first": [_img(c, h, w) for c in comps[:12]], "last": [_img(c, h, w) for c in comps[-3:]]}


@router.get("/variance")
def variance():
    d = fitted()
    cum = np.cumsum(d["pca"].explained_variance_ratio_)
    return {"cumulative": cum.tolist(), "k90": int(np.searchsorted(cum, 0.90) + 1)}


@router.get("/reconstruct/{idx}/{k}")
def reconstruct(idx: int, k: int):
    d = fitted()
    idx, k = idx % len(d["Xte"]), max(1, min(k, 150))
    p = d["Pte"][idx].copy()
    p[k:] = 0                                            # keep only the first k components
    rec = d["pca"].inverse_transform(p.reshape(1, -1))[0]
    mse = float(np.mean((rec - d["Xte"][idx]) ** 2))
    return {"original": _img(d["Xte"][idx], d["h"], d["w"]), "reconstructed": _img(rec, d["h"], d["w"]),
            "k": k, "mse": mse, "name": str(d["names"][d["yte"][idx]]), "n_test": len(d["Xte"])}


@router.get("/train")
def train():
    d = trained()
    rep = classification_report(d["yte"], d["pred"], target_names=d["names"], output_dict=True, zero_division=0)
    rows = [{"name": n, **{k: float(v) for k, v in rep[n].items()}} for n in d["names"]]
    return {"rows": rows, "accuracy": float(rep["accuracy"]), "train_time": d["train_time"],
            "macro": {k: float(v) for k, v in rep["macro avg"].items()}}


@router.get("/predict/{idx}")
def predict(idx: int):
    d = trained()
    idx %= len(d["Xte"])
    pred, true = int(d["pred"][idx]), int(d["yte"][idx])
    return {"image": _img(d["Xte"][idx], d["h"], d["w"]), "predicted": str(d["names"][pred]),
            "actual": str(d["names"][true]), "correct": pred == true, "n_test": len(d["Xte"])}


@router.get("/failures")
def failures():
    d = trained()
    bad = np.where(d["pred"] != d["yte"])[0]
    return {"total": len(d["yte"]), "wrong": int(len(bad)),
            "items": [{"image": _img(d["Xte"][i], d["h"], d["w"]), "predicted": str(d["names"][d["pred"][i]]),
                       "actual": str(d["names"][d["yte"][i]])} for i in bad[:12]]}
