# A cartoon Gebel Barkal for the country maps, built in the set's shared look (../toon.py): the
# sacred flat-topped sandstone mountain of Kush with its free-standing pinnacle, the steep Nubian
# pyramids of Napata at its foot, the ruined columns of the Temple of Amun, the desert sand, and the
# Nile's palms in the distance. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gebel-barkal.py -- gebel-barkal-1024.png 1024 gebel-barkal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8c48a', shadow_mul=(0.86, 0.78, 0.72), lift=0.25),
    'rock': toon('rock', '#b8805a', shadow_mul=(0.86, 0.76, 0.72)),
    'rockDark': toon('rockDark', '#9a6a4a', shadow_mul=(0.86, 0.76, 0.72)),
    'pyramid': toon('pyramid', '#c89a6a', shadow_mul=(0.86, 0.78, 0.74)),
    'stone': toon('stone', '#d8b888', shadow_mul=(0.86, 0.8, 0.76)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)

# ---------- Gebel Barkal: a flat-topped mesa, its pinnacle ----------
FOOT = [(-0.95, 0.35), (-0.3, 0.25), (0.6, 0.3), (0.95, 0.6), (0.6, 1.0), (-0.5, 1.05), (-1.05, 0.7)]
CEN = (-0.1, 0.62)


def shrink(f, z):
    return [(CEN[0] + (x - CEN[0]) * f, CEN[1] + (y - CEN[1]) * f, G + z) for x, y in FOOT]


mesa = loft('mesa', M['rock'], [shrink(1.0, -0.01), shrink(0.95, 0.3), shrink(0.88, 0.44)], outline=0.018)
mesa.visible_shadow = False
for k in range(6):
    x = -0.75 + k * 0.28
    bar(f'mesagully{k}', M['rockDark'], (x, 0.28, G + 0.02), (x * 0.92, 0.33, G + 0.42), 0.05, outline=0)
lathe('pinnacle', M['rock'], ((0.09, 0), (0.08, 0.2), (0.06, 0.38), (0.03, 0.46)), G - 0.01, 0.72, 0.22, segs=7, outline=0.012, smooth=False)

# ---------- the pyramids of Napata ----------
for k, (x, y, w, h) in enumerate(((-0.8, -0.1, 0.18, 0.32), (-0.55, -0.25, 0.16, 0.28), (-0.3, -0.1, 0.2, 0.36), (-0.05, -0.3, 0.14, 0.24), (-0.95, -0.4, 0.14, 0.24))):
    pyramid(f'pyramid{k}', M['pyramid'], x, y, G - 0.005, w, h, outline=0.01)
    box(f'chapel{k}', M['stone'], x, y - w / 2 - 0.03, G - 0.005, w * 0.6, 0.06, 0.06, outline=0.005, bevel=0)

# ---------- the Temple of Amun's ruined columns ----------
for i in range(2):
    for j in range(5):
        x, y = 0.25 + j * 0.1, -0.05 - i * 0.14
        h = 0.18 if (i + j) % 3 else 0.08
        rod(f'column{i}{j}', M['stone'], (x, y, G), (x, y, G + h), 0.022, segs=10, outline=0.004)
box('templeplatform', M['stone'], 0.45, -0.12, G - 0.005, 0.6, 0.36, 0.02, outline=0.005, bevel=0)

# ---------- the Nile's palms ----------
for k, (x, y) in enumerate(((0.6, -0.75), (0.85, -0.55), (0.35, -0.9), (1.05, -0.3))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

turn(before, -20)
render(G)
