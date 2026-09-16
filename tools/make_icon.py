# Generates the PNG icons (192/512/maskable/apple-touch/favicon) — a mini
# chord diagram on the warm-dark background, matching icon.svg.
# Run: python tools/make_icon.py   (needs Pillow)

import os
from PIL import Image, ImageDraw

BG_TOP = (43, 39, 32)      # #2B2720
BG_BOT = (35, 32, 26)      # #23201A
STRING = (168, 155, 132)   # #A89B84
FRET = (106, 95, 76)       # #6A5F4C
NUT = (236, 228, 212)      # #ECE4D4
DOT = (232, 163, 61)       # #E8A33D
DOT_RIM = (29, 26, 20)     # #1D1A14

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def bg(size):
    """Vertical warm-dark gradient, matching icon.svg."""
    img = Image.new('RGB', (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / max(1, size - 1)
        d.line([(0, y), (size, y)], fill=tuple(
            round(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * t) for i in range(3)))
    return img


def draw(size, pad_frac=0.18):
    img = bg(size)
    d = ImageDraw.Draw(img)
    pad = size * pad_frac
    x0, y0 = pad, size * 0.30
    x1, y1 = size - pad, size * 0.80
    sw = (x1 - x0) / 5            # string spacing
    fh = (y1 - y0) / 3            # fret spacing
    lw = max(2, size // 70)
    for i in range(6):            # strings
        x = x0 + i * sw
        d.line([(x, y0), (x, y1)], fill=STRING, width=lw)
    for i in range(1, 4):         # frets (top line is drawn as the nut below)
        y = y0 + i * fh
        d.line([(x0, y), (x1, y)], fill=FRET, width=lw)
    # solid nut bar across the top
    nw = lw + 2
    nut = [x0 - nw / 2, y0 - nw * 1.4, x1 + nw / 2, y0 + nw * 0.6]
    try:
        d.rounded_rectangle(nut, radius=nw / 2, fill=NUT)
    except AttributeError:            # Pillow < 8.2
        d.rectangle(nut, fill=NUT)
    r = size * 0.062
    rim = max(1, size // 160)
    for i, f in [(1, 1.5), (2, 1.5), (3, 0.5)]:   # E-shape dots
        cx = x0 + i * sw
        cy = y0 + f * fh
        d.ellipse([cx - r - rim, cy - r - rim, cx + r + rim, cy + r + rim],
                  fill=DOT_RIM)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=DOT)
    return img


def main():
    os.makedirs(os.path.join(ROOT, 'icons'), exist_ok=True)
    icons_dir = os.path.join(ROOT, 'icons')
    for n, size, pad, dest in [
        ('icon-192.png', 192, 0.18, icons_dir),
        ('icon-512.png', 512, 0.18, icons_dir),
        ('icon-512-maskable.png', 512, 0.30, icons_dir),   # safe zone
        ('apple-touch-icon.png', 180, 0.18, ROOT),
    ]:
        draw(size, pad).save(os.path.join(dest, n))
    # favicon: multi-size .ico
    draw(64, 0.14).save(os.path.join(ROOT, 'favicon.ico'),
                        sizes=[(16, 16), (32, 32), (48, 48)])
    print('icons written')


if __name__ == '__main__':
    main()
