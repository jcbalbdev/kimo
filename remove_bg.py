from PIL import Image
import os
import sys

# Fix encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ASSETS = r"c:\Users\joseb\Desktop\Proyectos 2026\MiKimo\src\assets"

FILES = [
    "conejo-naranja.png",
    "shihtzu.png",
]

THRESHOLD = 235  # pixels mas brillantes que esto = fondo blanco

def remove_white_bg(path):
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            min_ch = min(r, g, b)
            max_ch = max(r, g, b)
            colorfulness = max_ch - min_ch  # 0 = gris puro, alto = color
            brightness = (r + g + b) / 3

            if brightness >= THRESHOLD and colorfulness <= 30:
                alpha_factor = (brightness - THRESHOLD) / (255 - THRESHOLD)
                new_alpha = int(a * (1.0 - alpha_factor))
                pixels[x, y] = (r, g, b, new_alpha)

    img.save(path, "PNG")
    print(f"  OK: {os.path.basename(path)}")

print("Quitando fondos blancos...")
for fname in FILES:
    fpath = os.path.join(ASSETS, fname)
    if os.path.exists(fpath):
        remove_white_bg(fpath)
    else:
        print(f"  NO ENCONTRADO: {fname}")

print("Listo!")
