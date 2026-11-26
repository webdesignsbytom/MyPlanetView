# A cartoon Nalanda for the country maps, built in the set's shared look (../toon.py): the ruins of
# the great Buddhist university in Bihar, India: the brick temple of Sariputta rising in terraces
# with its corner towers, the steep stair up its front and the little votive stupas round it,
# and the long rows of the monasteries' cells round their courtyards, on green lawns. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P nalanda.py -- nalanda-1024.png 1024 nalanda.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'brick': toon('brick', '#b8664a', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'brickLight': toon('brickLight', '#cc7c5c', lift=0.15),
    'path': toon('path2', '#e2d4b4', lift=0.18),
    'dark': flat('dark', '#3a2420'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the temple of Sariputta ----------
TX, TY = -0.25, 0.15
TIERS = ((0.56, 0.12), (0.44, 0.12), (0.32, 0.12), (0.2, 0.1))
z = G - 0.005
for k, (w, h) in enumerate(TIERS):
    box(f'tier{k}', M['brick'] if k % 2 == 0 else M['brickLight'], TX, TY, z, w, w, h, outline=0.006, bevel=0)
    for c, (dx, dy) in enumerate(((-1, -1), (1, -1), (1, 1), (-1, 1))):
        if k < 3:
            box(f'corner{k}{c}', M['brickLight'], TX + dx * (w / 2 - 0.02), TY + dy * (w / 2 - 0.02), z, 0.07, 0.07, h + 0.05, outline=0.003, bevel=0)
    for j in range(5):
        box(f'niche{k}{j}', M['dark'], TX - w / 2 + 0.08 + j * (w - 0.16) / 4, TY - w / 2 - 0.003, z + h * 0.3, 0.025, 0.006, h * 0.45, outline=0, bevel=0)
    z += h
lathe('shrine', M['brickLight'], ((0.06, 0), (0.06, 0.05), (0.035, 0.08), (0.0, 0.1)), z - 0.005, TX, TY, segs=12, outline=0.003)
# the stair up the front
for k in range(12):
    box(f'step{k}', M['brickLight'], TX, TY - 0.28 - 0.2 + k * 0.016, G - 0.005, 0.1, 0.04, 0.03 * (k + 1), outline=0.001, bevel=0)
for s in (-1, 1):
    bar(f'stairwall{s}', M['brick'], (TX + s * 0.06, TY - 0.5, G + 0.02), (TX + s * 0.06, TY - 0.28, G + 0.38), 0.025, outline=0.002)
for k in range(8):
    x = -0.85 + k * 0.1 if k < 4 else 0.15 + (k - 4) * 0.1
    lathe(f'votive{k}', M['brickLight'], ((0.035, 0), (0.035, 0.03), (0.028, 0.034), (0.016, 0.06), (0.0, 0.064)), G - 0.005, x, -0.45 + 0.05 * (k % 2), segs=10, outline=0.002)

# ---------- the monasteries' rows of cells ----------
for m, (MX, MY) in enumerate(((0.55, 0.3), (0.55, -0.35))):
    W, D = 0.5, 0.42
    for k, (x, y, sx, sy) in enumerate(((MX, MY - D / 2, W, 0.04), (MX, MY + D / 2, W, 0.04), (MX - W / 2, MY, 0.04, D), (MX + W / 2, MY, 0.04, D))):
        box(f'mon{m}wall{k}', M['brick'], x, y, G - 0.005, sx, sy, 0.1, outline=0.003, bevel=0)
    for k in range(5):
        t = -W / 2 + 0.05 + k * (W - 0.1) / 4
        box(f'mon{m}cellf{k}', M['brick'], MX + t, MY - D / 2 + 0.06, G - 0.005, 0.025, 0.12, 0.08, outline=0.001, bevel=0)
        box(f'mon{m}cellb{k}', M['brick'], MX + t, MY + D / 2 - 0.06, G - 0.005, 0.025, 0.12, 0.08, outline=0.001, bevel=0)
    box(f'mon{m}court', M['path'], MX, MY, G - 0.004, W - 0.06, D - 0.26, 0.008, outline=0.001, bevel=0)
    lathe(f'mon{m}well', M['brickLight'], ((0.03, 0), (0.03, 0.025)), G - 0.004, MX + 0.1, MY, segs=12, outline=0.001)

for k, (x, y) in enumerate(((-0.9, -0.2), (-0.8, 0.55), (0.05, 0.8), (-0.4, -0.85))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.012, segs=6, outline=0.002)
    b = ball(f'tree{k}', M['tree'], 0, 0, 0, 0.09, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + 0.19)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
