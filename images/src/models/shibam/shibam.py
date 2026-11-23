# A cartoon Shibam for the country maps, built in the set's shared look (../toon.py): "the
# Manhattan of the desert", the walled town's tight cluster of mud-brick tower houses five to eight
# storeys tall, their tops whitewashed, their tiny windows in rows, standing on the floor of Wadi
# Hadramaut with its palms and the cliffs behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P shibam.py -- shibam-1024.png 1024 shibam.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'wadi': toon('wadi', '#d8b888', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'mud': toon('mud', '#b8865a', shadow_mul=(0.86, 0.78, 0.74)),
    'mudLight': toon('mudLight', '#c89a6a', shadow_mul=(0.86, 0.78, 0.74)),
    'lime': toon('lime', '#f6f2e8', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'window': flat('window', '#3a2a24'),
    'cliff': toon('cliff', '#c49a6a', shadow_mul=(0.86, 0.78, 0.74)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['wadi'])
before = set(bpy.data.objects)
rng = random.Random(2089)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


cl = loft('cliff', M['cliff'], [segment(0.8, 1.38, -0.01), segment(0.85, 1.33, 0.32), segment(0.92, 1.25, 0.36)], outline=0.012)
cl.visible_shadow = False

# ---------- the town wall ----------
for k in range(4):
    a = k * math.pi / 2
    cx, cy = 0.62 * math.cos(a), 0.15 + 0.55 * math.sin(a)
    if k % 2 == 0:
        box(f'townwall{k}', M['mud'], cx, cy, G - 0.005, 0.04, 1.1, 0.1, outline=0.005, bevel=0)
    else:
        box(f'townwall{k}', M['mud'], cx, cy, G - 0.005, 1.24, 0.04, 0.1, outline=0.005, bevel=0)
box('gate', M['mudLight'], 0.0, -0.4, G - 0.005, 0.18, 0.08, 0.16, outline=0.006, bevel=0)
box('gatedoor', M['window'], 0.0, -0.442, G - 0.005, 0.07, 0.006, 0.1, outline=0, bevel=0)

# ---------- the tower houses ----------
for i in range(4):
    for j in range(4):
        x = -0.45 + j * 0.3 + rng.uniform(-0.02, 0.02)
        y = -0.2 + i * 0.25 + rng.uniform(-0.02, 0.02)
        h = rng.uniform(0.4, 0.72) + 0.06 * i
        w = rng.uniform(0.2, 0.25)
        mat = 'mud' if (i + j) % 2 else 'mudLight'
        box(f'tower{i}{j}', M[mat], x, y, G - 0.005, w, 0.2, h, outline=0.008, bevel=0)
        box(f'towertop{i}{j}', M['lime'], x, y, G + h - 0.1, w + 0.006, 0.206, 0.1, outline=0.005, bevel=0)
        for r in range(int(h / 0.1) - 1):
            for c in (-1, 1):
                box(f'win{i}{j}{r}{c}', M['window'], x + c * w * 0.22, y - 0.102, G + 0.06 + r * 0.09, 0.025, 0.006, 0.035, outline=0, bevel=0)

# ---------- palms on the wadi floor ----------
for k, (x, y) in enumerate(((-0.95, -0.4), (-0.8, -0.75), (0.9, -0.45), (0.65, -0.85), (-0.3, -0.85), (1.05, 0.0))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

turn(before, -20)
render(G)
