# A cartoon Sukur Cultural Landscape for the country maps, built in the set's shared look
# (../toon.py): Nigeria's hill in the Mandara Mountains, terraced fields ringing its slopes, the
# Hidi's palace on the top inside its dry-stone walls with round thatched huts, stone-paved paths
# climbing to it, and trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sukur.py -- sukur-1024.png 1024 sukur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'field': toon('field', '#9ac065', shadow_mul=(0.72, 0.78, 0.78), lift=0.25),
    'terraceWall': toon('terraceWall', '#a89478', shadow_mul=(0.82, 0.8, 0.84)),
    'stone': toon('stone', '#9a8e80', shadow_mul=(0.8, 0.8, 0.88)),
    'mud': toon('mud', '#b8875a'),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'path': toon('pathStone', '#c8bcaa', lift=0.2),
    'window': flat('window', '#3a3640'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'rock': toon('rock', '#8a8078', shadow_mul=(0.8, 0.8, 0.88)),
})

G = tile(M['field'])
before = set(bpy.data.objects)
rng = random.Random(863)

# ---------- the hill, in terraced rings ----------
HX, HY = 0.0, 0.2
RINGS = [(0.95, 0.75, 0.0), (0.78, 0.6, 0.08), (0.62, 0.48, 0.16), (0.46, 0.36, 0.24), (0.32, 0.26, 0.32)]
for k, (rx, ry, z) in enumerate(RINGS):
    pts = [(HX + rx * math.cos(t) * (1 + 0.04 * math.sin(3 * t + k)), HY + ry * math.sin(t)) for t in (2 * math.pi * j / 24 for j in range(24))]
    wall = loft(f'terracewall{k}', M['terraceWall'], [[(x, y, G - 0.01 + z) for x, y in pts], [(x, y, G + z + 0.075) for x, y in pts]], outline=0.012)
    wall.visible_shadow = False
    top = loft(f'terracefield{k}', M['field'], [[(HX + (x - HX) * 0.985, HY + (y - HY) * 0.985, G + z + 0.07) for x, y in pts], [(HX + (x - HX) * 0.97, HY + (y - HY) * 0.97, G + z + 0.085) for x, y in pts]],
               outline=0.004)
    top.visible_shadow = False
TOP = G + 0.32 + 0.085

# ---------- the stone path up the front ----------
for k in range(5):
    rx, ry, z = RINGS[k]
    y = HY - ry * 0.98
    box(f'pathstep{k}', M['path'], HX + 0.05, y + 0.02, G + z + 0.07, 0.08, 0.17, 0.02, outline=0.004, bevel=0)

# ---------- the Hidi's palace: a dry-stone enclosure with round thatched huts ----------
for k in range(16):
    t0, t1 = 2 * math.pi * k / 16, 2 * math.pi * (k + 1) / 16
    if 4.5 < (t0 + t1) / 2 < 4.95:
        continue
    x0, y0 = HX + 0.24 * math.cos(t0), HY + 0.19 * math.sin(t0)
    x1, y1 = HX + 0.24 * math.cos(t1), HY + 0.19 * math.sin(t1)
    box(f'palacewall{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, TOP - 0.005, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.035, 0.07, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.006, bevel=0)
for k, (x, y, r) in enumerate(((HX - 0.08, HY + 0.05, 0.065), (HX + 0.09, HY + 0.07, 0.06), (HX, HY - 0.06, 0.055), (HX + 0.12, HY - 0.07, 0.045))):
    lathe(f'hutwall{k}', M['mud'], ((r, 0), (r, 0.06)), TOP - 0.005, x, y, segs=14, outline=0.008)
    lathe(f'hutroof{k}', M['thatch'], ((r + 0.03, 0), (r * 0.5, 0.05), (0.004, 0.12)), TOP + 0.055, x, y, segs=14, outline=0.008)
    box(f'hutdoor{k}', M['window'], x, y - r - 0.002, TOP, 0.025, 0.01, 0.04, outline=0, bevel=0)

# ---------- trees and boulders on the terraces ----------
for k in range(12):
    ring_k = k % 4
    rx, ry, z = RINGS[ring_k]
    nrx, nry, _ = RINGS[ring_k + 1]
    a = rng.uniform(0, 2 * math.pi)
    if 4.4 < a < 5.0:
        continue
    s = (rx + nrx) / 2
    x, y = HX + s * math.cos(a), HY + (ry + nry) / 2 * math.sin(a)
    if k % 3 == 0:
        ball(f'boulder{k}', M['rock'], x, y, G + z + 0.09, 0.035, outline=0.006)
        continue
    rod(f'trunk{k}', M['trunk'], (x, y, G + z + 0.08), (x, y, G + z + 0.15), 0.012, segs=6, outline=0.004)
    ball(f'tree{k}', M['tree'], x, y, G + z + 0.19, rng.uniform(0.05, 0.07), outline=0.01)

turn(before, -20)
render(G)
