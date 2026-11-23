# A cartoon Würzburg Residence for the country maps, built in the set's shared look (../toon.py):
# the prince-bishops' baroque palace, its long front of cream stone and pale yellow round the
# great forecourt, the columned middle pavilion with its pediment and attic statues, the wings
# reaching forward, the Franconia Fountain in the square, and the court garden's cone-clipped yews.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P wurzburg.py -- wurzburg-1024.png 1024 wurzburg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'square': toon('square', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'yellow': toon('yellow', '#f0dca0', shadow_mul=(0.86, 0.84, 0.78), lift=0.12),
    'stone': toon('stone', '#f4ecd8', lift=0.15),
    'roof': toon('roof', '#5a5a62'),
    'window': flat('window', '#3a4050'),
    'bronze': toon('bronze', '#4a6a5a'),
    'yew': toon('yew', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['square'])
before = set(bpy.data.objects)

PX, PY = 0.0, 0.5


def block(name, x, y, w, d, h, rows, cols, face):
    box(name, M['yellow'], x, y, G - 0.005, w, d, h, outline=0.009, bevel=0)
    for r in range(rows):
        for c in range(cols):
            if face == 'front':
                box(f'{name}win{r}{c}', M['window'], x - w / 2 + (c + 0.5) * w / cols, y - d / 2 - 0.003, G + 0.05 + r * 0.09, w / cols * 0.4, 0.006, 0.055, outline=0, bevel=0)
            else:
                box(f'{name}win{r}{c}', M['window'], x + face * (w / 2 + 0.003), y - d / 2 + (c + 0.5) * d / cols, G + 0.05 + r * 0.09, 0.006, d / cols * 0.4, 0.055, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2, y - d / 2, G + h - 0.005), (x + w / 2, y - d / 2, G + h - 0.005), (x + w / 2, y + d / 2, G + h - 0.005), (x - w / 2, y + d / 2, G + h - 0.005)],
                                    [(x - w / 2 + 0.05, y - d / 2 + 0.05, G + h + 0.07), (x + w / 2 - 0.05, y - d / 2 + 0.05, G + h + 0.07), (x + w / 2 - 0.05, y + d / 2 - 0.05, G + h + 0.07), (x - w / 2 + 0.05, y + d / 2 - 0.05, G + h + 0.07)]], outline=0.006)


block('main', PX, PY, 1.0, 0.22, 0.26, 3, 11, 'front')
for s in (-1, 1):
    block(f'wing{s}', PX + s * 0.6, PY - 0.3, 0.2, 0.62, 0.24, 3, 5, -s)
# the middle pavilion
box('pavilion', M['stone'], PX, PY - 0.13, G - 0.005, 0.28, 0.06, 0.3, outline=0.007, bevel=0)
for j in range(4):
    rod(f'pavcol{j}', M['stone'], (PX - 0.1 + j * 0.067, PY - 0.17, G + 0.08), (PX - 0.1 + j * 0.067, PY - 0.17, G + 0.27), 0.01, segs=8, outline=0.002)
box('pavdoor', M['window'], PX, PY - 0.163, G - 0.005, 0.06, 0.006, 0.09, outline=0, bevel=0)
loft('pavpediment', M['stone'], [[(PX - 0.15, PY - 0.17, G + 0.29), (PX + 0.15, PY - 0.17, G + 0.29), (PX + 0.15, PY - 0.1, G + 0.29), (PX - 0.15, PY - 0.1, G + 0.29)],
                                 [(PX - 0.004, PY - 0.17, G + 0.37), (PX + 0.004, PY - 0.17, G + 0.37), (PX + 0.004, PY - 0.1, G + 0.37), (PX - 0.004, PY - 0.1, G + 0.37)]], outline=0.004)
for j in range(5):
    lathe(f'atticstatue{j}', M['stone'], ((0.014, 0), (0.01, 0.06)), G + 0.25, PX - 0.4 + j * 0.2, PY - 0.105, segs=6, outline=0.001)

# ---------- the Franconia Fountain ----------
FX, FY = 0.0, -0.45
lathe('fountainbasin', M['stone'], ((0.16, 0), (0.16, 0.04)), G - 0.005, FX, FY, segs=16, outline=0.004)
lathe('fountainpillar', M['stone'], ((0.035, 0), (0.025, 0.2)), G + 0.035, FX, FY, segs=8, outline=0.003)
lathe('fountainfigure', M['bronze'], ((0.025, 0), (0.018, 0.08)), G + 0.235, FX, FY, segs=8, outline=0.002)
for j in range(3):
    a = 2 * math.pi * j / 3
    lathe(f'fountainsitter{j}', M['bronze'], ((0.02, 0), (0.015, 0.06)), G + 0.035, FX + 0.11 * math.cos(a), FY + 0.11 * math.sin(a), segs=8, outline=0.002)

# ---------- the clipped yews ----------
for s in (-1, 1):
    box(f'parterre{s}', M['lawn'], s * 0.75, -0.55, G - 0.003, 0.35, 0.3, 0.008, outline=0.002, bevel=0)
    for j in range(4):
        x = s * (0.62 + (j % 2) * 0.24)
        y = -0.45 - (j // 2) * 0.2
        lathe(f'yew{s}{j}', M['yew'], ((0.045, 0), (0.004, 0.16)), G - 0.005, x, y, segs=10, outline=0.004)

turn(before, -20)
render(G)
