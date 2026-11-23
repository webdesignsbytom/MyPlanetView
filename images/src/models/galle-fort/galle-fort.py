# A cartoon Galle Fort for the country maps, built in the set's shared look (../toon.py): the old
# Dutch fort's grassy ramparts and bastions on the Indian Ocean, the white lighthouse on the point,
# the Meeran mosque's white domes beside it, the town's red roofs inside the walls, old cannons, and
# stilt fishermen perched on their poles in the surf. Turned a little towards the camera.
# Run: blender -b --factory-startup -P galle-fort.py -- galle-fort-1024.png 1024 galle-fort.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'rampart': toon('rampart', '#a89a86', shadow_mul=(0.84, 0.82, 0.86)),
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'house': toon('house', '#f0dcb0'),
    'roof': toon('roof', '#c4573a'),
    'cannon': toon('cannon', '#34323a'),
    'pole': toon('pole', '#6a4a36'),
    'fisher': toon('fisher', '#2f6fc0'),
    'skin': toon('skin', '#9a6a4a'),
    'window': flat('window', '#3a3640'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1759)

# ---------- the fort: ramparts round the town, bastions at the corners ----------
FOOT = [(-0.95, -0.35), (-0.2, -0.55), (0.55, -0.4), (0.85, 0.15), (0.45, 0.75), (-0.5, 0.8), (-1.05, 0.3)]
CEN = (-0.1, 0.15)


def shrink(f, z):
    return [(CEN[0] + (x - CEN[0]) * f, CEN[1] + (y - CEN[1]) * f, G + z) for x, y in FOOT]


ram = loft('rampart', M['rampart'], [shrink(1.0, -0.01), shrink(0.95, 0.12)], outline=0.016)
ram.visible_shadow = False
top = loft('rampartgrass', M['grass'], [shrink(0.95, 0.115), shrink(0.93, 0.13)], outline=0.006)
top.visible_shadow = False
T = G + 0.13
for k, (x, y) in enumerate(FOOT):
    lathe(f'bastion{k}', M['rampart'], ((0.13, 0), (0.12, 0.14)), G - 0.01, x, y, segs=5, outline=0.01, smooth=False)
    lathe(f'bastiongrass{k}', M['grass'], ((0.12, 0), (0.11, 0.015)), G + 0.13, x, y, segs=5, outline=0.003, smooth=False)
for k, (x, y, a) in enumerate(((-0.2, -0.5, -1.6), (0.5, -0.35, -1.2), (-0.9, -0.3, -2.0))):
    rod(f'cannon{k}', M['cannon'], (x, y + 0.05, T + 0.03), (x + 0.1 * math.cos(a), y + 0.1 * math.sin(a), T + 0.035), 0.014, r2=0.01, segs=8, outline=0.003)

# ---------- the town's red roofs, the mosque, the lighthouse ----------
for k in range(10):
    x = rng.uniform(-0.7, 0.45)
    y = rng.uniform(-0.1, 0.6)
    if (x - 0.3) ** 2 + (y - 0.05) ** 2 < 0.05:
        continue
    box(f'house{k}', M['house'], x, y, T - 0.005, 0.12, 0.1, 0.07, outline=0.006, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, T + 0.065, 0.14, 0.05, outline=0.005)
MX, MY = 0.3, 0.05
box('mosque', M['white'], MX, MY, T - 0.005, 0.2, 0.14, 0.12, outline=0.009, bevel=0)
lathe('mosquedome', M['white'], ((0.06, 0), (0.05, 0.04), (0.004, 0.08)), T + 0.115, MX, MY, segs=12, outline=0.005)
for s in (-1, 1):
    lathe(f'mosqueminaret{s}', M['white'], ((0.02, 0), (0.018, 0.2), (0.004, 0.25)), T - 0.005, MX + s * 0.11, MY - 0.06, segs=8, outline=0.003)
LX, LY = 0.62, -0.25
lathe('lighthouse', M['white'], ((0.06, 0), (0.045, 0.38)), T - 0.005, LX, LY, segs=14, outline=0.01)
lathe('lighthouselantern', M['window'], ((0.04, 0), (0.04, 0.05)), T + 0.375, LX, LY, segs=10, outline=0.004)
lathe('lighthousecap', M['white'], ((0.05, 0), (0.004, 0.06)), T + 0.425, LX, LY, segs=10, outline=0.004)

# ---------- stilt fishermen in the surf ----------
for k, (x, y) in enumerate(((-0.55, -0.85), (-0.3, -0.92), (-0.05, -0.88))):
    rod(f'stilt{k}', M['pole'], (x, y, G - 0.01), (x + 0.02, y, G + 0.22), 0.007, segs=5, outline=0.002)
    bar(f'crossbar{k}', M['pole'], (x - 0.02, y, G + 0.14), (x + 0.05, y, G + 0.15), 0.008, outline=0)
    rod(f'fisher{k}', M['fisher'], (x + 0.01, y, G + 0.15), (x + 0.01, y, G + 0.22), 0.016, segs=6, outline=0.003)
    ball(f'fisherhead{k}', M['skin'], x + 0.01, y, G + 0.235, 0.014, outline=0.002)
    rod(f'rod{k}', M['pole'], (x + 0.02, y, G + 0.2), (x + 0.12, y - 0.05, G + 0.25), 0.003, segs=4, outline=0)
for k in range(16):
    a = 2 * math.pi * k / 16
    ball(f'surf{k}', M['surf'], CEN[0] + 1.02 * (FOOT[k % 7][0] - CEN[0]) * 1.03, CEN[1] + 1.02 * (FOOT[k % 7][1] - CEN[1]) * 1.03, G + 0.005, 0.03, outline=0.003)

turn(before, -20)
render(G)
