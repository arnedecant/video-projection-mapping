#!/usr/bin/env python3
# root/scripts/generate_masks.py
# Convert /src/assets/icons/*.svg to 1080x1080 JPGs in /src/assets/masks with white background.

import io
import sys
from pathlib import Path
from PIL import Image

try:
    import cairosvg  # required for SVG -> PNG rasterization
except Exception:
    raise SystemExit("cairosvg is required. Install with: pip install cairosvg pillow")

SIZE = 1080
BG = (255, 255, 255)

# Resolve project root assuming this file lives at /root/scripts/generate_masks.py
PROJECT_ROOT = Path(__file__).resolve().parents[1]
INPUT_DIR = PROJECT_ROOT / "src" / "assets" / "icons"
OUTPUT_DIR = PROJECT_ROOT / "src" / "assets" / "masks"

def load_svg_as_rgba(path: Path) -> Image.Image:
    png_bytes = cairosvg.svg2png(url=str(path))
    im = Image.open(io.BytesIO(png_bytes))
    im.load()
    return im.convert("RGBA")

def to_square_jpg(im: Image.Image, size: int = SIZE, bg=BG) -> Image.Image:
    if im.mode in ("P", "LA", "L"):
        im = im.convert("RGBA")
    elif im.mode == "RGB":
        im.putalpha(Image.new("L", im.size, 255))

    w, h = im.size
    scale = min(size / w, size / h)
    nw, nh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    im_resized = im.resize((nw, nh), Image.LANCZOS)

    tmp = Image.new("RGB", (nw, nh), bg)
    if "A" in im_resized.getbands():
        tmp.paste(im_resized, mask=im_resized.split()[-1])
    else:
        tmp.paste(im_resized)

    canvas = Image.new("RGB", (size, size), bg)
    canvas.paste(tmp, ((size - nw) // 2, (size - nh) // 2))
    return canvas

def process_dir(inp: Path, out: Path, size: int):
    if not inp.exists():
        raise FileNotFoundError(f"Input directory not found: {inp}")
    out.mkdir(parents=True, exist_ok=True)

    count = 0
    for p in sorted(inp.rglob("*.svg")):
        if not p.is_file() or p.name.startswith("."):
            continue
        try:
            im = load_svg_as_rgba(p)
            jpg = to_square_jpg(im, size=size)
            rel = p.relative_to(inp).with_suffix(".jpg")
            dest = out / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            jpg.save(dest, format="JPEG", quality=95, subsampling=0, optimize=True, progressive=True)
            count += 1
        except Exception as e:
            print(f"[skip] {p}: {e}", file=sys.stderr)

    print(f"Exported {count} file(s) to {out}")

def main():
    process_dir(INPUT_DIR, OUTPUT_DIR, SIZE)

if __name__ == "__main__":
    main()
