# A cartoon Pamukkale for the country maps, built in the set's shared look (../toon.py): the
# "cotton castle", white travertine terraces stepping down the hillside, each holding scalloped
# turquoise pools whose overflow hangs in white drips down the terrace walls, with the columns of
# Hierapolis on the top. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pamukkale.py -- pamukkale-1024.png 1024 pamukkale.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'travertine': toon('travertine', '#f8f8f4', shadow_mul=(0.8, 0.86, 0.94), lift=0.12),
    'pool': toon('pool', '#5ad0e0', shadow_mul=(0.78, 0.88, 0.94), lift=0.3),
    'stone': toon('stone', '#e0d4bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.1),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def segment(c, r, z, n=30):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the terraces, their pools and drips ----------
R = 1.36
TER = ((0.55, 0.6), (0.3, 0.48), (0.05, 0.36), (-0.2, 0.24), (-0.45, 0.12))
for i, (c, h) in enumerate(TER):
    t = loft(f'terrace{i}', M['travertine'], [segment(c, R, -0.01), segment(c, R, h)], outline=0.01)
    t.visible_shadow = False
    half = math.sqrt(R * R - c * c) * 0.75
    n = 3 if i == 0 else 4
    for j in range(n):
        x = -half + (j + 0.5) * 2 * half / n
        y = c + 0.12
        rr = 0.12 + 0.02 * ((i + j) % 2)
        lathe(f'rim{i}{j}', M['travertine'], ((rr + 0.025, 0), (rr + 0.025, 0.02)), G + h - 0.005, x, y, segs=22, outline=0.004)
        lathe(f'pool{i}{j}', M['pool'], ((rr, 0), (rr, 0.024)), G + h - 0.005, x, y, segs=22, outline=0.002)
        for d in range(3):
            dx = x - 0.09 + d * 0.09
            rod(f'drip{i}{j}{d}', M['travertine'], (dx, c - 0.014, G + h - 0.004), (dx, c - 0.014, G + h - 0.05 - 0.025 * (d % 2)), 0.022, r2=0.012, segs=8, outline=0.003)

# ---------- Hierapolis on the top ----------
TOP = G + 0.6
for k, x in enumerate((-0.45, -0.3, -0.15, 0.15, 0.3, 0.45)):
    h = 0.24 if k % 3 != 2 else 0.14
    rod(f'column{k}', M['stone'], (x, 0.98, TOP), (x, 0.98, TOP + h), 0.022, segs=10, outline=0.004)
box('lintelL', M['stone'], -0.375, 0.98, TOP + 0.24, 0.2, 0.06, 0.035, outline=0.004, bevel=0)
box('lintelR', M['stone'], 0.225, 0.98, TOP + 0.24, 0.2, 0.06, 0.035, outline=0.004, bevel=0)
box('ruinbase', M['stone'], 0.0, 0.98, TOP - 0.005, 1.05, 0.1, 0.02, outline=0.004, bevel=0)
for k, (x, y) in enumerate(((-0.85, 0.85), (0.85, 0.85), (-0.6, 1.15), (0.6, 1.15))):
    rod(f'trunk{k}', M['trunk'], (x, y, TOP), (x, y, TOP + 0.08), 0.012, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, TOP + 0.14, 0.08, outline=0.01)

turn(before, -20)
render(G)
