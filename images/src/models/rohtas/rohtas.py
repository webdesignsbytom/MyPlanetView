# A cartoon Rohtas Fort for the country maps, built in the set's shared look (../toon.py): Sher Shah
# Suri's great sixteenth-century fort in Punjab, the massive Sohail Gate with its tall pointed arch
# set deep in its face, the round bastions on either side, the little domed balconies over the arch
# and the battlements along its top, and the long walls running away from it with their round
# bastions over the dry hills. Turned a little towards the camera.
# Run: blender -b --factory-startup -P rohtas.py -- rohtas-1024.png 1024 rohtas.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b07a', shadow_mul=(0.78, 0.78, 0.82), lift=0.18),
    'stone': toon('stone', '#c8a878', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'stoneDark': toon('stoneDark', '#a8885a'),
    'dark': flat('dark', '#2e2620'),
    'shrub': toon('shrub', '#7a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def merlons(name, x0, x1, y, z, n):
    for k in range(n):
        x = x0 + (k + 0.5) * (x1 - x0) / n
        box(f'{name}{k}', M['stone'], x, y, z, (x1 - x0) / n * 0.55, 0.035, 0.03, outline=0.001, bevel=0)


def pointed_opening(name, x, y, z, w, h):
    box(name, M['dark'], x, y, z, w, 0.006, h, outline=0, bevel=0)
    loft(f'{name}point', M['dark'], [[(x - w / 2, y - 0.003, z + h), (x + w / 2, y - 0.003, z + h), (x + 0.001, y - 0.003, z + h + w * 0.7), (x - 0.001, y - 0.003, z + h + w * 0.7)],
                                     [(x - w / 2, y + 0.003, z + h), (x + w / 2, y + 0.003, z + h), (x + 0.001, y + 0.003, z + h + w * 0.7), (x - 0.001, y + 0.003, z + h + w * 0.7)]], outline=0)


# ---------- the walls running away from the gate ----------
WY = 0.0
for s in (-1, 1):
    x0, x1 = s * 0.28, s * 1.08
    xa, xb = sorted((x0, x1))
    box(f'wall{s}', M['stone'], (xa + xb) / 2, WY + 0.05, G - 0.005, xb - xa, 0.07, 0.26, outline=0.006, bevel=0)
    merlons(f'wallmerlon{s}', xa, xb, WY + 0.03, G + 0.255, 14)
    for k, bx in enumerate((s * 0.62, s * 0.98)):
        lathe(f'bastion{s}{k}', M['stone'], ((0.09, 0), (0.08, 0.28)), G - 0.005, bx, WY + 0.02, segs=16, outline=0.005)
        lathe(f'bastiontop{s}{k}', M['stoneDark'], ((0.088, 0), (0.088, 0.02)), G + 0.27, bx, WY + 0.02, segs=16, outline=0.002)

# ---------- the Sohail Gate ----------
GW, GD, GH = 0.38, 0.22, 0.44
box('gate', M['stone'], 0.0, WY, G - 0.005, GW, GD, GH, outline=0.008, bevel=0)
FY = WY - GD / 2
box('archframe', M['stoneDark'], 0.0, FY - 0.004, G - 0.005, 0.2, 0.008, 0.34, outline=0.002, bevel=0)
pointed_opening('archrecess', 0.0, FY - 0.009, G - 0.005, 0.15, 0.2)
pointed_opening('doorway', 0.0, FY - 0.013, G - 0.005, 0.06, 0.1)
# the domed balconies over the arch
for s in (-1, 1):
    bx = s * 0.13
    box(f'balcony{s}', M['stone'], bx, FY - 0.03, G + 0.27, 0.07, 0.06, 0.07, outline=0.003, bevel=0)
    box(f'balconywin{s}', M['dark'], bx, FY - 0.061, G + 0.285, 0.035, 0.006, 0.04, outline=0, bevel=0)
    lathe(f'balconydome{s}', M['stone'], ((0.04, 0), (0.035, 0.02), (0.015, 0.04), (0.0, 0.05)), G + 0.335, bx, FY - 0.03, segs=12, outline=0.002)
merlons('gatemerlon', -GW / 2, GW / 2, FY + 0.015, G + GH - 0.005, 8)
# the round bastions on either side of the gate
for s in (-1, 1):
    lathe(f'gatebastion{s}', M['stone'], ((0.11, 0), (0.1, 0.38)), G - 0.005, s * (GW / 2 + 0.06), FY + 0.05, segs=18, outline=0.006)
    lathe(f'gatebastiontop{s}', M['stoneDark'], ((0.108, 0), (0.108, 0.025)), G + 0.37, s * (GW / 2 + 0.06), FY + 0.05, segs=18, outline=0.002)
    for k in range(2):
        a = -math.pi / 2 + s * 0.4
        box(f'gatebastionslit{s}{k}', M['dark'], s * (GW / 2 + 0.06) + 0.102 * math.cos(a), FY + 0.05 + 0.102 * math.sin(a), G + 0.12 + k * 0.12, 0.012, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)

# ---------- the dry hills' shrubs ----------
rng = random.Random(1541)
for k in range(10):
    x = -1.0 + k * 0.22 + 0.05 * rng.random()
    y = -0.45 - 0.4 * rng.random()
    if math.hypot(x, y) > 1.15:
        continue
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.005)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
