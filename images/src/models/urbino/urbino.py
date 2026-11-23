# A cartoon Urbino for the country maps, built in the set's shared look (../toon.py): the Ducal
# Palace's famous Façade of the Torricini high on its hill, two slender round towers with pointed
# roofs framing three stacked loggias, the long palace wings, the cathedral's dome beside it, and
# the brick town with its terracotta roofs on the slopes below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P urbino.py -- urbino-1024.png 1024 urbino.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'brick': toon('brick', '#d8a070', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'stone': toon('stone', '#ece0c4', lift=0.12),
    'roof': toon('roof', '#c06a46'),
    'lead': toon('lead', '#8a8e96'),
    'dark': flat('dark', '#2e2a28'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2507)

HX, HY = 0.05, 0.2
hl = lathe('hill', M['hill'], ((0.9, 0), (0.7, 0.12), (0.45, 0.22), (0.32, 0.24)), G - 0.01, HX, HY, segs=32, outline=0.01)
hl.visible_shadow = False


def ground(r):
    if r >= 0.9:
        return G - 0.01
    if r >= 0.7:
        return G - 0.01 + 0.12 * (0.9 - r) / 0.2
    if r >= 0.45:
        return G - 0.01 + 0.12 + 0.1 * (0.7 - r) / 0.25
    return G + 0.23


T = G + 0.23
# ---------- the palace ----------
PX, PY = -0.05, 0.22
box('wing', M['brick'], PX + 0.2, PY + 0.05, T - 0.005, 0.36, 0.2, 0.2, outline=0.007, bevel=0)
loft('wingroof', M['roof'], [[(PX + 0.02, PY - 0.05, T + 0.195), (PX + 0.38, PY - 0.05, T + 0.195), (PX + 0.38, PY + 0.15, T + 0.195), (PX + 0.02, PY + 0.15, T + 0.195)],
                             [(PX + 0.02, PY + 0.046, T + 0.26), (PX + 0.38, PY + 0.046, T + 0.26), (PX + 0.38, PY + 0.054, T + 0.26), (PX + 0.02, PY + 0.054, T + 0.26)]], outline=0.004)
for j in range(5):
    box(f'wingwin{j}', M['dark'], PX + 0.06 + j * 0.065, PY - 0.053, T + 0.1, 0.022, 0.006, 0.04, outline=0, bevel=0)
# the façade of the Torricini
box('facade', M['stone'], PX - 0.06, PY - 0.04, T - 0.005, 0.12, 0.1, 0.3, outline=0.006, bevel=0)
for k in range(3):
    z = T + 0.04 + k * 0.085
    box(f'loggia{k}', M['dark'], PX - 0.06, PY - 0.093, z, 0.06, 0.006, 0.055, outline=0, bevel=0)
    cyl(f'loggiatop{k}', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((PX - 0.06, PY - 0.093, z + 0.055)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'balcony{k}', M['stone'], PX - 0.06, PY - 0.1, z - 0.005, 0.08, 0.02, 0.012, outline=0.001, bevel=0)
for s in (-1, 1):
    tx = PX - 0.06 + s * 0.09
    lathe(f'torricino{s}', M['brick'], ((0.04, 0), (0.04, 0.4)), T - 0.005, tx, PY - 0.05, segs=14, outline=0.004)
    lathe(f'torricinoring{s}', M['stone'], ((0.045, 0), (0.045, 0.015)), T + 0.36, tx, PY - 0.05, segs=14, outline=0.001)
    lathe(f'torricinoroof{s}', M['lead'], ((0.046, 0), (0.004, 0.16)), T + 0.395, tx, PY - 0.05, segs=14, outline=0.003)
    for k in range(3):
        box(f'torricinowin{s}{k}', M['dark'], tx, PY - 0.091, T + 0.08 + k * 0.1, 0.012, 0.006, 0.03, outline=0, bevel=0)
# the cathedral
CX, CY = 0.35, 0.42
box('cathedral', M['stone'], CX, CY, T - 0.005, 0.2, 0.28, 0.18, outline=0.006, bevel=0)
lathe('drum', M['stone'], ((0.08, 0), (0.08, 0.08)), T + 0.175, CX, CY + 0.04, segs=16, outline=0.004)
lathe('dome', M['lead'], ((0.085, 0), (0.07, 0.05), (0.04, 0.09), (0.004, 0.11)), T + 0.25, CX, CY + 0.04, segs=16, outline=0.004)
lathe('lantern', M['stone'], ((0.02, 0), (0.02, 0.03), (0.004, 0.06)), T + 0.355, CX, CY + 0.04, segs=8, outline=0.002)

# ---------- the town on the slopes ----------
spots = []
for k in range(120):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.32, 0.82)
    x, y = HX + r * math.cos(a), HY + r * math.sin(a)
    if math.hypot(x, y) > 1.05 or any(math.hypot(x - px, y - py) < 0.15 for px, py in spots) or (y > 0.05 and -0.25 < x < 0.5 and r < 0.45):
        continue
    spots.append((x, y))
    zb = ground(r + 0.06)
    h = 0.07 + (ground(r) - zb)
    box(f'house{k}', M['brick'], x, y, zb - 0.005, 0.13, 0.11, h, outline=0.004, bevel=0)
    box(f'housewin{k}', M['dark'], x, y - 0.058, zb + h * 0.5, 0.03, 0.006, 0.025, outline=0, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, zb + h - 0.01, 0.14, 0.05, outline=0.003)
    if len(spots) >= 18:
        break

turn(before, -20)
render(G)
