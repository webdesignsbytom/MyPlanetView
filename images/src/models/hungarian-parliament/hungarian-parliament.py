# A cartoon Hungarian Parliament for the country maps, built in the set's shared look (../toon.py):
# the Gothic Revival parliament on the Danube in Budapest, its long white façade with pinnacles and
# spires under a red roof, the great ribbed dome in the middle, and the Chain Bridge's stone towers
# and chains across the river. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hungarian-parliament.py -- hungarian-parliament-1024.png 1024 hungarian-parliament.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('danube', '#4a8aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'bank': toon('bank', '#c8c0b0', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'white': toon('parliamentWhite', '#f4efe4', shadow_mul=(0.82, 0.82, 0.9), lift=0.15),
    'roof': toon('roof', '#b8503a'),
    'dome': toon('dome', '#b8503a', shadow_mul=(0.86, 0.76, 0.72)),
    'window': flat('window', '#3a4a64'),
    'bridge': toon('bridge', '#d8ccb0', shadow_mul=(0.82, 0.8, 0.86)),
    'chain': toon('chain', '#5a6a5a'),
})

G = tile(M['river'])
before = set(bpy.data.objects)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


bank = loft('bank', M['bank'], [segment(0.0, 1.41, -0.01), segment(0.03, 1.4, 0.05)], outline=0.012)
bank.visible_shadow = False
T = G + 0.05

# ---------- the parliament ----------
PX, PY = 0.0, 0.4
box('facade', M['white'], PX, PY, T - 0.005, 1.7, 0.3, 0.18, outline=0.014, bevel=0)
loft('roof', M['roof'], [[(PX - 0.85, PY - 0.15, T + 0.175), (PX + 0.85, PY - 0.15, T + 0.175), (PX + 0.85, PY + 0.15, T + 0.175), (PX - 0.85, PY + 0.15, T + 0.175)],
                         [(PX - 0.85, PY - 0.005, T + 0.27), (PX + 0.85, PY - 0.005, T + 0.27), (PX + 0.85, PY + 0.005, T + 0.27), (PX - 0.85, PY + 0.005, T + 0.27)]],
     outline=0.01)
for row in range(2):
    for j in range(24):
        box(f'win{row}{j}', M['window'], PX - 0.8 + j * 0.07, PY - 0.154, T + 0.04 + row * 0.07, 0.025, 0.006, 0.045, outline=0, bevel=0)
for j in range(13):
    x = PX - 0.84 + j * 0.14
    lathe(f'pinnacle{j}', M['white'], ((0.014, 0), (0.004, 0.08)), T + 0.17, x, PY - 0.15, segs=6, outline=0.002, smooth=False)
for s in (-1, 1):
    for k, dx in enumerate((0.3, 0.6)):
        x = PX + s * dx
        box(f'pavilion{s}{k}', M['white'], x, PY - 0.03, T - 0.005, 0.12, 0.36, 0.24, outline=0.01, bevel=0)
        for j in range(2):
            lathe(f'spire{s}{k}{j}', M['white'], ((0.02, 0), (0.02, 0.06), (0.004, 0.18)), T + 0.235, x - 0.04 + j * 0.08, PY - 0.2, segs=8, outline=0.004, smooth=False)
# the dome on its drum, and its spire
lathe('drum', M['white'], ((0.16, 0), (0.16, 0.14)), T + 0.17, PX, PY, segs=16, outline=0.012)
for j in range(16):
    a = 2 * math.pi * j / 16
    box(f'drumwin{j}', M['window'], PX + 0.162 * math.cos(a), PY + 0.162 * math.sin(a), T + 0.2, 0.025, 0.006, 0.07, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('dome', M['dome'], ((0.17, 0), (0.16, 0.08), (0.12, 0.16), (0.06, 0.21), (0.004, 0.23)), T + 0.31, PX, PY, segs=16, outline=0.012)
for j in range(8):
    a = 2 * math.pi * j / 8
    lathe(f'domepinnacle{j}', M['white'], ((0.012, 0), (0.004, 0.07)), T + 0.31, PX + 0.16 * math.cos(a), PY + 0.16 * math.sin(a), segs=6, outline=0.002, smooth=False)
lathe('domespire', M['white'], ((0.025, 0), (0.025, 0.05), (0.004, 0.16)), T + 0.53, PX, PY, segs=8, outline=0.004, smooth=False)

# ---------- the Chain Bridge ----------
BY = -0.55
box('bridgedeck', M['bridge'], 0.0, BY, G + 0.08, 2.6, 0.12, 0.025, outline=0.006, bevel=0)
for s in (-1, 1):
    x = s * 0.42
    box(f'bridgetower{s}', M['bridge'], x, BY, G - 0.01, 0.14, 0.18, 0.32, outline=0.01, bevel=0)
    box(f'bridgearch{s}', M['window'], x, BY - 0.092, G + 0.1, 0.06, 0.006, 0.12, outline=0, bevel=0)
for side in (-0.065, 0.065):
    pts = [(-1.25 + 2.5 * t, BY + side, G + 0.3 - 0.2 * (1 - (abs(2.5 * t - 1.25) / 0.42 if abs(2.5 * t - 1.25) < 0.42 else 1)) - 0.2 * (
        (abs(2.5 * t - 1.25) - 0.42) / 0.83 if abs(2.5 * t - 1.25) > 0.42 else 0)) for t in (j / 20 for j in range(21))]
    for j in range(20):
        bar(f'chain{side}{j}', M['chain'], pts[j], pts[j + 1], 0.014, outline=0.002)

turn(before, -20)
render(G)
