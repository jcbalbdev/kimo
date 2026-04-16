"""
compress_assets.py — Convierte los avatares PNG a WebP optimizado.
Los archivos originales NO se eliminan. Los .webp se guardan en la misma carpeta.
"""
from pathlib import Path
from PIL import Image

ASSETS = Path("src/assets")
QUALITY = 85          # 85 es un buen balance calidad/tamaño
MAX_SIZE = (512, 512) # Los avatares no necesitan más de 512px

skip = {"gato.png", "hero.png", "icono.png", "react.svg", "vite.svg"}

for png in sorted(ASSETS.glob("*.png")):
    if png.name in skip:
        print(f"  skip  {png.name}")
        continue

    webp = png.with_suffix(".webp")
    img = Image.open(png)

    # Reducir tamaño si es más grande que MAX_SIZE (mantiene proporción)
    img.thumbnail(MAX_SIZE, Image.LANCZOS)

    img.save(webp, "WEBP", quality=QUALITY, method=6)

    orig_kb = png.stat().st_size / 1024
    new_kb  = webp.stat().st_size / 1024
    pct = (1 - new_kb / orig_kb) * 100
    print(f"  {png.name:30s}  {orig_kb:7.0f} KB  ->  {new_kb:6.0f} KB  ({pct:.0f}% menos)")

print("\n✅ Listo.")
