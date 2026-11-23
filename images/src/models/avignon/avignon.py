# A cartoon Avignon for the country maps, built in the set's shared look (../toon.py): the Palais
# des Papes, the popes' great Gothic fortress-palace with its tall square towers and battlements and
# its tall pointed arcades, the cathedral's gilded Virgin beside it, and the Pont Saint-Bénézet's
# four surviving arches stopping halfway across the Rhône, its little chapel on top. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P avignon.py -- avignon-1024.png 1024 avignon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8ccb0', shadow_mul=(0.86, 0.82, 0.8), lift=0.2),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'stone': toon('stone', '#e0d0b0', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'stoneDark': toon('stoneDark', '#c0aa86', shadow_mul=(0.84, 0.82, 0.86)),
    'roof': toon('roof', '#c4573a'),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#2e2a28'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def front(c, r, z, n=26):
    a0 = math.asin(c / r)
    pts = [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]
    return [(x, -y, zz) for x, y, zz in reversed(pts)]


loft('rhone', M['river'], [front(0.35, 1.4, -0.004), front(0.35, 1.4, 0.006)], outline=0.004)


def crenels(name, x, y, z, w):
    n = max(2, int(w / 0.05))
    for j in range(n):
        box(f'{name}c{j}', M['stone'], x - w / 2 + (j + 0.5) * w / n, y, z, w / n * 0.55, 0.03, 0.03, outline=0.002, bevel=0)


# ---------- the Palais des Papes ----------
PX, PY = -0.1, 0.4
box('palace', M['stone'], PX, PY, G - 0.005, 1.0, 0.4, 0.38, outline=0.012, bevel=0)
for j in range(7):
    x = PX - 0.42 + j * 0.14
    box(f'arcade{j}', M['stoneDark'], x, PY - 0.202, G + 0.03, 0.07, 0.006, 0.3, outline=0, bevel=0)
    lathe(f'arcadetop{j}', M['stoneDark'], ((0.035, 0), (0.004, 0.05)), G + 0.33, x, PY - 0.202, segs=4, outline=0, smooth=False)
    box(f'palacewin{j}', M['window'], x, PY - 0.205, G + 0.2, 0.025, 0.006, 0.06, outline=0, bevel=0)
crenels('palace', PX, PY - 0.19, G + 0.375, 1.0)
box('gate', M['window'], PX + 0.05, PY - 0.204, G - 0.005, 0.08, 0.006, 0.13, outline=0, bevel=0)
for s, (x, h) in enumerate(((-0.42, 0.62), (0.0, 0.52), (0.38, 0.58))):
    box(f'palacetower{s}', M['stone'], PX + x, PY - 0.05, G - 0.005, 0.16, 0.16, h, outline=0.009, bevel=0)
    crenels(f'palacetower{s}', PX + x, PY - 0.13, G + h - 0.005, 0.16)
    for j in range(3):
        box(f'towerslit{s}{j}', M['window'], PX + x, PY - 0.132, G + 0.15 + j * 0.13, 0.02, 0.006, 0.06, outline=0, bevel=0)
# Notre-Dame des Doms beside it, its tower crowned with the gilded Virgin
DX, DY = 0.6, 0.6
box('cathedral', M['stoneDark'], DX, DY, G - 0.005, 0.2, 0.3, 0.2, outline=0.007, bevel=0)
pyramid('cathedralroof', M['roof'], DX, DY, G + 0.195, 0.22, 0.08, outline=0.005)
box('cathedraltower', M['stoneDark'], DX, DY - 0.18, G - 0.005, 0.1, 0.1, 0.42, outline=0.007, bevel=0)
lathe('virginbase', M['stoneDark'], ((0.04, 0), (0.03, 0.06)), G + 0.415, DX, DY - 0.18, segs=8, outline=0.003)
lathe('virgin', M['gold'], ((0.025, 0), (0.02, 0.06), (0.012, 0.09)), G + 0.475, DX, DY - 0.18, segs=10, outline=0.003)
ball('virginhead', M['gold'], DX, DY - 0.18, G + 0.575, 0.014, outline=0.002)

# ---------- the Pont Saint-Bénézet ----------
B0X, B0Y = 0.35, -0.3
ANG = -0.55
L = 0.95
ca, sa = math.cos(ANG), math.sin(ANG)
for j in range(4):
    t0, t1 = j / 4.0 * L, (j + 1) / 4.0 * L
    xa, ya = B0X + t0 * ca, B0Y + t0 * sa
    xb, yb = B0X + t1 * ca, B0Y + t1 * sa
    box(f'pier{j}', M['stone'], xb, yb, G - 0.005, 0.07, 0.09, 0.08, rot_z=ANG, outline=0.004, bevel=0)
    pts = [(xa + (xb - xa) * (0.5 - 0.5 * math.cos(math.pi * i / 6)), ya + (yb - ya) * (0.5 - 0.5 * math.cos(math.pi * i / 6)), G + 0.03 + 0.07 * math.sin(math.pi * i / 6)) for i in range(7)]
    for i in range(6):
        bar(f'arch{j}{i}', M['stone'], pts[i], pts[i + 1], 0.07, outline=0.004)
    bar(f'deck{j}', M['stoneDark'], (xa, ya, G + 0.115), (xb, yb, G + 0.115), 0.05, outline=0.003)
CX, CY = B0X + 0.12 * ca, B0Y + 0.12 * sa
box('chapel', M['stoneDark'], CX, CY, G + 0.13, 0.09, 0.07, 0.07, rot_z=ANG, outline=0.004, bevel=0)
pyramid('chapelroof', M['roof'], CX, CY, G + 0.195, 0.1, 0.05, outline=0.003)

for k, (x, y) in enumerate(((-0.9, -0.1), (-0.65, -0.2), (1.0, 0.25), (-0.95, 0.5))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.009)

turn(before, -20)
render(G)
