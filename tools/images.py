"""Erzeugt responsive Bildvarianten (AVIF, WebP, JPG) unter assets/img/r/ und assets/plaene/r/.

Aufruf im Projektordner: python3 tools/images.py
Quellen bleiben unverändert; Varianten werden nur neu gebaut, wenn sie fehlen oder älter sind.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PHOTO_WIDTHS = (480, 800, 1200, 1680)
PLAN_WIDTHS = (800, 1400, 2400)


def build(src: Path, out_dir: Path, widths, photo=True):
    out_dir.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGB")
    done = []
    for w in widths:
        if w > im.width:
            w = im.width
        if w in done:
            continue
        done.append(w)
        h = round(im.height * w / im.width)
        res = im if w == im.width else im.resize((w, h), Image.LANCZOS)
        stem = out_dir / f"{src.stem}-{w}"
        if photo:
            res.save(f"{stem}.avif", quality=52, speed=4)
            res.save(f"{stem}.webp", quality=76, method=6)
            res.save(f"{stem}.jpg", quality=78, optimize=True, progressive=True)
        else:
            res.save(f"{stem}.webp", quality=88, method=6)
            res.save(f"{stem}.jpg", quality=86, optimize=True)
        if w == im.width:
            break
    return im.width, im.height, done


if __name__ == "__main__":
    for src in sorted(p for p in (ROOT / "assets/img").glob("*.jpg") if p.name != "og-image.jpg"):
        print("foto", src.name, build(src, ROOT / "assets/img/r", PHOTO_WIDTHS))
    for src in sorted((ROOT / "assets/plaene").glob("haus-*.jpg")):
        print("plan", src.name, build(src, ROOT / "assets/plaene/r", PLAN_WIDTHS, photo=False))
