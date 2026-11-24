# A cartoon Avdat for the country maps, built in the set's shared look (../toon.py): the Nabataean
# city on the Incense Route in the Negev desert of Israel, on its long hilltop: the acropolis's
# walls, the two Byzantine churches with their apses and the columns of the atrium raised
# again, the Roman watchtower, the stair up the slope, and the bare desert hills round it.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P avdat.py -- avdat-1024.png 1024 avdat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#dcc39a', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'hill': toon('hill', '#c8ac80', shadow_mul=(0.8, 0.76, 0.8)),
    'stone': toon('stone', '#e2d0aa', shadow_mul=(0.8, 0.78, 0.84), lift=0.18),
    'stoneDark': toon('stoneDark', '#bca880'),
    'dark': flat('dark', '#3a322a'),
    'shrub': toon('shrub', '#9aa860', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(477578)

# ---------- the long hilltop ----------
HZ = G + 0.2
hill = loft('hill', M['hill'], [[(-1.05, -0.45, G - 0.01), (1.0, -0.55, G - 0.01), (1.05, 0.5, G - 0.01), (-1.0, 0.6, G - 0.01)],
                                [(-0.8, -0.3, HZ), (0.78, -0.38, HZ), (0.82, 0.35, HZ), (-0.78, 0.42, HZ)]], outline=0.007)
hill.visible_shadow = False

# ---------- the acropolis walls ----------
for k, (x, y, sx, sy) in enumerate(((0.0, -0.28, 1.2, 0.05), (0.0, 0.36, 1.2, 0.05), (-0.62, 0.04, 0.05, 0.64), (0.62, 0.0, 0.05, 0.64))):
    box(f'wall{k}', M['stoneDark'], x, y, HZ - 0.01, sx, sy, 0.07 + 0.02 * (k % 2), outline=0.004, bevel=0)

# ---------- the two churches ----------
for c, (cx, cy) in enumerate(((-0.25, 0.08), (0.25, 0.08))):
    for s in (-1, 1):
        box(f'church{c}wall{s}', M['stone'], cx, cy + s * 0.11, HZ - 0.01, 0.34, 0.03, 0.09, outline=0.003, bevel=0)
    lathe(f'church{c}apse', M['stone'], ((0.1, 0), (0.1, 0.13)), HZ - 0.01, cx + 0.17, cy, segs=16, outline=0.004)
    for j in range(4):
        lathe(f'church{c}col{j}', M['stone'], ((0.014, 0), (0.014, 0.12 + 0.04 * (j % 2))), HZ - 0.01, cx - 0.12 + j * 0.08, cy, segs=10, outline=0.001, smooth=False)
# the atrium's columns
for j in range(6):
    lathe(f'atriumcol{j}', M['stone'], ((0.014, 0), (0.014, 0.18)), HZ - 0.01, -0.35 + j * 0.14, -0.15, segs=10, outline=0.001, smooth=False)
    box(f'atriumcap{j}', M['stone'], -0.35 + j * 0.14, -0.15, HZ + 0.17, 0.035, 0.035, 0.015, outline=0.001, bevel=0)

# ---------- the Roman watchtower ----------
TX, TY = -0.5, -0.05
box('tower', M['stone'], TX, TY, HZ - 0.01, 0.14, 0.14, 0.3, outline=0.006, bevel=0)
arch('towerdoor', M['dark'], TX, TY - 0.073, HZ - 0.01, 0.04, 0.08)
box('towerwin', M['dark'], TX, TY - 0.073, HZ + 0.18, 0.02, 0.006, 0.04, outline=0, bevel=0)

# ---------- the stair up the slope ----------
for k in range(10):
    box(f'stair{k}', M['stoneDark'], 0.5, -0.6 + k * 0.03, G - 0.005, 0.1, 0.04, 0.02 * (k + 1), outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.9, -0.65), (0.9, -0.65), (-0.2, -0.9), (0.95, 0.65))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
