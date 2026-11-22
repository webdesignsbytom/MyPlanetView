# A cartoon Mohenjo-daro for the country maps, built in the set's shared look (../toon.py) on a tile
# of dry ground: the great mound of the citadel with the Buddhist stupa on top, the Great Bath with
# its brick steps going down into the pool, and the low brick walls of the lower town's houses laid
# out along straight streets, with a round well among them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mohenjo-daro.py -- mohenjo-daro-1024.png 1024 mohenjo-daro.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e2c99a', shadow_mul=(0.84, 0.74, 0.62), lift=0.25),
    'mound': toon('mound', '#c9a27a', shadow_mul=(0.84, 0.74, 0.66)),
    'brick': toon('brick', '#b8714a'),
    'brickDark': toon('brickDark', '#9a5a3a'),
    'water': toon('water', '#5fb0c8', shadow_mul=(0.75, 0.84, 0.88), lift=0.3),
    'shrub': toon('shrub', '#8a9a5a', shadow_mul=(0.76, 0.8, 0.82)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(263)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the citadel mound and the stupa on top ----------
SX, SY = -0.35, 0.62
mound = loft('mound', M['mound'], [ring(SX, SY, 0.65, 0.45, -0.01, 0.04), ring(SX, SY, 0.5, 0.34, 0.2, 0.05), ring(SX, SY, 0.36, 0.25, 0.3, 0.04)],
             outline=0.03)
mound.visible_shadow = False
T = G + 0.3
box('stupabase', M['brick'], SX, SY, T - 0.01, 0.42, 0.36, 0.1, outline=0.02, bevel=0)
for k in range(4):
    box(f'stupacourse{k}', M['brickDark'], SX, SY - 0.183, T + 0.01 + k * 0.022, 0.42, 0.006, 0.004, outline=0, bevel=0)
lathe('stupa', M['brick'], ((0.16, 0), (0.16, 0.12), (0.14, 0.2), (0.09, 0.26), (0.03, 0.29)), T + 0.09, SX, SY, segs=24, outline=0.02)
for k in range(6):
    a = 2 * math.pi * k / 6
    box(f'stupabreak{k}', M['brickDark'], SX + 0.145 * math.cos(a), SY + 0.145 * math.sin(a), T + 0.12, 0.04, 0.03, 0.06, rot_z=a, outline=0.006, bevel=0)

# ---------- the Great Bath ----------
BX, BY, BW, BD = 0.45, 0.35, 0.62, 0.46
for k, (x, y, w, d) in enumerate(((BX, BY - BD / 2, BW, 0.05), (BX, BY + BD / 2, BW, 0.05), (BX - BW / 2, BY, 0.05, BD), (BX + BW / 2, BY, 0.05, BD))):
    box(f'bathwall{k}', M['brick'], x, y, G - 0.005, w + 0.05, d, 0.12, outline=0.016, bevel=0)
box('bathfloor', M['brickDark'], BX, BY, G - 0.005, BW - 0.05, BD - 0.05, 0.02, outline=0, bevel=0)
box('pool', M['water'], BX, BY, G + 0.01, 0.34, 0.2, 0.012, outline=0.008, bevel=0)
for k in range(3):
    for side in (-1, 1):
        box(f'bathstep{side}{k}', M['brick'], BX, BY + side * (0.12 + k * 0.03), G - 0.005, 0.12, 0.03, 0.03 + k * 0.03, outline=0.006, bevel=0)
# the cells round it
for k in range(4):
    box(f'cell{k}', M['brickDark'], BX - 0.24 + k * 0.16, BY + BD / 2 + 0.1, G - 0.005, 0.12, 0.12, 0.08, outline=0.012, bevel=0)


# ---------- the lower town: house walls along straight streets ----------
def house(name, x, y, w, d, h):
    """The low walls of a ruined house: four walls and one across the middle."""
    for k, (cx, cy, sx, sy) in enumerate(((x, y - d / 2, w, 0.035), (x, y + d / 2, w, 0.035), (x - w / 2, y, 0.035, d), (x + w / 2, y, 0.035, d),
                                          (x, y, w, 0.03))):
        box(f'{name}{k}', M['brick'], cx, cy, G - 0.005, sx + 0.035, sy, h * (0.6 if k == 4 else 1.0), outline=0.01, bevel=0)


for i in range(4):
    for j in range(3):
        if (i, j) in ((3, 2),):
            continue
        x = -0.85 + i * 0.34
        y = -0.75 + j * 0.28
        house(f'house{i}{j}', x + rng.uniform(-0.02, 0.02), y + rng.uniform(-0.02, 0.02), rng.uniform(0.22, 0.28), rng.uniform(0.18, 0.22),
              rng.uniform(0.06, 0.12))
# a round brick well, standing above the dug-out street
lathe('well', M['brick'], ((0.06, 0), (0.06, 0.22)), G - 0.005, 0.18 + 0.18, -0.25, segs=16, outline=0.014)
cyl('wellhole', M['brickDark'], 0.04, 0.005, segs=16, outline=0, matrix=Matrix.Translation((0.36, -0.25, G + 0.218)))
for k, (x, y) in enumerate(((1.0, -0.4), (1.05, 0.1), (-1.15, 0.25), (0.7, -0.95))):
    ball(f'shrub{k}', M['shrub'], x, y, G + 0.04, 0.06, outline=0.01)

turn(before, -20)
render(G)
