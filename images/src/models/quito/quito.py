# A cartoon Quito for the country maps, built in the set's shared look (../toon.py): the Basílica
# del Voto Nacional's grey neo-Gothic towers over the old town's white houses and red roofs, the
# winged Virgin on El Panecillo's hill, and the green flank of the Pichincha volcano behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P quito.py -- quito-1024.png 1024 quito.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#8ab060', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'volcano': toon('volcano', '#6a8a58', shadow_mul=(0.72, 0.8, 0.76)),
    'rock': toon('rock', '#8a8478', shadow_mul=(0.84, 0.84, 0.9)),
    'stone': toon('stone', '#9a9690', shadow_mul=(0.84, 0.84, 0.9)),
    'stoneDark': toon('stoneDark', '#7a7672', shadow_mul=(0.84, 0.84, 0.9)),
    'white': toon('white', '#f6f3ea', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#2e3a54'),
    'virgin': toon('virgin', '#dcdee2', shadow_mul=(0.8, 0.82, 0.9), lift=0.25),
    'hill': toon('hill', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1471)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Pichincha behind ----------
v = loft('pichincha', M['volcano'], [segment(0.45, 1.38, -0.01), segment(0.65, 1.22, 0.4), segment(0.85, 0.98, 0.62), segment(0.92, 0.94, 0.66)], outline=0.018, smooth=True)
v.visible_shadow = False

# ---------- El Panecillo and its winged Virgin ----------
PX, PY = 0.85, -0.1
lathe('panecillo', M['hill'], ((0.32, 0), (0.26, 0.08), (0.14, 0.17), (0.004, 0.2)), G - 0.01, PX, PY, segs=20, outline=0.014)
VZ = G + 0.18
lathe('virginbase', M['white'], ((0.05, 0), (0.04, 0.05)), VZ, PX, PY, segs=10, outline=0.005)
lathe('virgin', M['virgin'], ((0.035, 0), (0.025, 0.1), (0.015, 0.14)), VZ + 0.05, PX, PY, segs=10, outline=0.005)
ball('virginhead', M['virgin'], PX, PY, VZ + 0.205, 0.014, outline=0.003)
for s in (-1, 1):
    bar(f'virginwing{s}', M['virgin'], (PX + s * 0.015, PY + 0.01, VZ + 0.17), (PX + s * 0.08, PY + 0.01, VZ + 0.2), 0.025, outline=0.003)

# ---------- the old town: white houses, red roofs ----------
for k in range(16):
    x = rng.uniform(-1.05, 0.55)
    y = rng.uniform(-0.75, 0.3)
    if math.hypot(x, y) > 1.2 or (abs(x + 0.15) < 0.3 and -0.1 < y < 0.45):
        continue
    w = rng.uniform(0.1, 0.14)
    box(f'house{k}', M['white'], x, y, G - 0.005, w, 0.1, 0.07, outline=0.007, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.065, w + 0.02, 0.05, outline=0.005)

# ---------- the Basílica del Voto Nacional ----------
BX, BY = -0.15, 0.2
box('nave', M['stone'], BX + 0.12, BY + 0.05, G - 0.005, 0.44, 0.2, 0.2, outline=0.012, bevel=0)
loft('naveroof', M['stoneDark'], [[(BX - 0.1, BY - 0.06, G + 0.195), (BX + 0.34, BY - 0.06, G + 0.195), (BX + 0.34, BY + 0.16, G + 0.195), (BX - 0.1, BY + 0.16, G + 0.195)],
                                  [(BX - 0.1, BY + 0.046, G + 0.28), (BX + 0.34, BY + 0.046, G + 0.28), (BX + 0.34, BY + 0.054, G + 0.28), (BX - 0.1, BY + 0.054, G + 0.28)]],
     outline=0.01)
for s in (-1, 1):
    tx, ty = BX - 0.12, BY + s * 0.085
    box(f'tower{s}', M['stone'], tx, ty, G - 0.005, 0.11, 0.11, 0.48, outline=0.012, bevel=0)
    for k in range(3):
        box(f'towerwin{s}{k}', M['window'], tx - 0.057, ty, G + 0.1 + k * 0.12, 0.006, 0.035, 0.08, outline=0, bevel=0)
    lathe(f'spire{s}', M['stoneDark'], ((0.06, 0), (0.004, 0.18)), G + 0.475, tx, ty, segs=8, outline=0.008, smooth=False)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        lathe(f'pinnacle{s}{k}', M['stone'], ((0.014, 0), (0.004, 0.07)), G + 0.475, tx + 0.05 * math.cos(a), ty + 0.05 * math.sin(a), segs=4, outline=0.002, smooth=False)
box('rose', M['window'], BX - 0.18, BY, G + 0.13, 0.006, 0.06, 0.06, outline=0, bevel=0)
box('crossingtower', M['stone'], BX + 0.26, BY + 0.05, G + 0.19, 0.1, 0.1, 0.16, outline=0.008, bevel=0)
lathe('crossingspire', M['stoneDark'], ((0.055, 0), (0.004, 0.14)), G + 0.345, BX + 0.26, BY + 0.05, segs=8, outline=0.006, smooth=False)
for k, (x, y) in enumerate(((-1.0, 0.2), (0.4, 0.55), (-0.6, 0.55))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.07, 0.07, outline=0.01)

turn(before, -20)
render(G)
