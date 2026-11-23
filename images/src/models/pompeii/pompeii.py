# A cartoon Pompeii for the country maps, built in the set's shared look (../toon.py): the Forum's
# broken colonnades and the Temple of Jupiter's podium among the ruined walls of the Roman town, the
# paved streets and their stepping stones, a cypress or two, and Vesuvius looming behind with a
# wisp of smoke. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pompeii.py -- pompeii-1024.png 1024 pompeii.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b890', shadow_mul=(0.86, 0.8, 0.76), lift=0.2),
    'volcano': toon('volcano', '#6a7a58', shadow_mul=(0.74, 0.8, 0.76)),
    'ash': toon('ash', '#8a8278', shadow_mul=(0.84, 0.84, 0.9)),
    'smoke': toon('smoke', '#e8e6e2', shadow_mul=(0.86, 0.88, 0.94), lift=0.1),
    'stone': toon('stone', '#e2d6bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'brick': toon('brick', '#b8805a', shadow_mul=(0.86, 0.78, 0.74)),
    'paving': toon('paving', '#8a8680', shadow_mul=(0.84, 0.84, 0.9)),
    'cypress': toon('cypress', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1627)

# ---------- Vesuvius behind ----------
lathe('vesuvius', M['volcano'], ((0.85, 0), (0.6, 0.22), (0.35, 0.48), (0.2, 0.58)), G - 0.01, 0.15, 1.0, segs=24, outline=0.018)
lathe('vesuviustop', M['ash'], ((0.205, 0), (0.17, 0.05), (0.13, 0.06)), G + 0.57, 0.15, 1.0, segs=24, outline=0.01)
for k, (dx, dz, r) in enumerate(((0.0, 0.0, 0.06), (0.06, 0.06, 0.05), (0.12, 0.12, 0.045))):
    b = ball(f'smoke{k}', M['smoke'], 0, 0, 0, r, outline=0.008)
    b.scale = (1.3, 1.0, 0.9)
    b.location = (0.15 + dx, 1.0, G + 0.66 + dz)

# ---------- the streets ----------
box('street0', M['paving'], 0.0, -0.45, G - 0.004, 2.4, 0.1, 0.008, outline=0.003, bevel=0)
box('street1', M['paving'], 0.65, 0.0, G - 0.004, 0.1, 1.4, 0.008, outline=0.003, bevel=0)
for j in range(3):
    box(f'steppingstone{j}', M['stone'], -0.3, -0.48 + j * 0.035, G + 0.004, 0.04, 0.025, 0.02, outline=0.002, bevel=0)

# ---------- the Forum's colonnades and the Temple of Jupiter ----------
FX, FY = -0.15, 0.1
box('forumfloor', M['stone'], FX, FY, G - 0.005, 0.7, 0.6, 0.012, outline=0.004, bevel=0)
for s in (-1, 1):
    for j in range(8):
        x = FX - 0.3 + j * 0.085
        h = 0.2 if (j + (s > 0)) % 3 else 0.08
        rod(f'column{s}{j}', M['stone'], (x, FY + s * 0.26, G), (x, FY + s * 0.26, G + h), 0.016, segs=10, outline=0.004)
box('architrave', M['stone'], FX - 0.17, FY - 0.26, G + 0.2, 0.3, 0.04, 0.03, outline=0.004, bevel=0)
box('podium', M['stone'], FX, FY + 0.38, G - 0.005, 0.26, 0.2, 0.1, outline=0.008, bevel=0)
box('podiumsteps', M['stone'], FX, FY + 0.26, G - 0.005, 0.16, 0.06, 0.06, outline=0.005, bevel=0)
for j in range(4):
    rod(f'templecolumn{j}', M['stone'], (FX - 0.09 + j * 0.06, FY + 0.31, G + 0.095), (FX - 0.09 + j * 0.06, FY + 0.31, G + 0.095 + (0.18 if j in (0, 3) else 0.1)), 0.016,
        segs=10, outline=0.004)

# ---------- ruined walls of houses ----------
for k in range(12):
    x = rng.uniform(-1.05, 1.05)
    y = rng.uniform(-0.85, 0.55)
    if math.hypot(x, y) > 1.2 or (abs(x - FX) < 0.42 and abs(y - FY) < 0.45) or abs(y + 0.45) < 0.08 or abs(x - 0.65) < 0.08:
        continue
    w = rng.uniform(0.12, 0.22)
    box(f'ruinA{k}', M['brick'], x, y, G - 0.005, w, 0.03, rng.uniform(0.06, 0.12), outline=0.004, bevel=0)
    box(f'ruinB{k}', M['brick'], x - w / 2, y + 0.06, G - 0.005, 0.03, 0.12, rng.uniform(0.05, 0.1), outline=0.004, bevel=0)
for k, (x, y) in enumerate(((0.9, 0.35), (-0.95, 0.3), (0.95, -0.25))):
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.045, 0.05), (0.03, 0.16), (0.004, 0.24)), G, x, y, segs=10, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
