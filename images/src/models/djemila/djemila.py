# A cartoon Djémila for the country maps, built in the set's shared look (../toon.py): the Roman town
# of Cuicul in the mountains of Algeria, laid along its narrow ridge between two ravines: the
# Arch of Caracalla with its single great arch and its paired columns, the Septimian temple on its
# high podium behind with its stair and columns, the colonnaded street and the low walls of the
# town, and the green hills falling away on both sides. Turned a little towards the camera.
# Run: blender -b --factory-startup -P djemila.py -- djemila-1024.png 1024 djemila.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8ab862', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'ridge': toon('ridge', '#9ac06a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#e2d0aa', shadow_mul=(0.8, 0.78, 0.84), lift=0.18),
    'stoneDark': toon('stoneDark', '#bca880'),
    'paving': toon('paving', '#d8ccb0', lift=0.18),
    'dark': flat('dark', '#3a322a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(216)

# ---------- the ridge ----------
RZ = G + 0.14
ridge = loft('ridge', M['ridge'], [[(-0.5, -1.05, G - 0.01), (0.5, -1.05, G - 0.01), (0.55, 1.05, G - 0.01), (-0.55, 1.05, G - 0.01)],
                                   [(-0.32, -0.95, RZ), (0.32, -0.95, RZ), (0.36, 0.95, RZ), (-0.36, 0.95, RZ)]], outline=0.006)
ridge.visible_shadow = False
box('street', M['paving'], 0.0, 0.0, RZ - 0.004, 0.16, 1.8, 0.01, outline=0.001, bevel=0)

# ---------- the Arch of Caracalla ----------
AY = -0.3
for s in (-1, 1):
    box(f'archpier{s}', M['stone'], s * 0.12, AY, RZ - 0.005, 0.09, 0.1, 0.36, outline=0.006, bevel=0)
    for c in (-1, 1):
        lathe(f'archcolbase{s}{c}', M['stoneDark'], ((0.016, 0), (0.016, 0.02)), RZ - 0.005, s * 0.12 + c * 0.03, AY - 0.065, segs=8, outline=0.001, smooth=False)
        rod(f'archcol{s}{c}', M['stone'], (s * 0.12 + c * 0.03, AY - 0.065, RZ + 0.015), (s * 0.12 + c * 0.03, AY - 0.065, RZ + 0.26), 0.011, segs=8, outline=0.001)
    box(f'archcolcap{s}', M['stone'], s * 0.12, AY - 0.06, RZ + 0.26, 0.1, 0.03, 0.025, outline=0.002, bevel=0)
SPAN = 0.15
for j in range(8):
    um = (j + 0.5) / 8
    z = RZ + 0.22 + 0.075 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
    box(f'archslice{j}', M['stone'], -SPAN / 2 + SPAN * um, AY, z, SPAN / 8 + 0.002, 0.1, RZ + 0.355 - z, outline=0.002, bevel=0)
box('archattic', M['stone'], 0.0, AY, RZ + 0.35, 0.36, 0.12, 0.07, outline=0.005, bevel=0)
box('archcornice', M['stoneDark'], 0.0, AY, RZ + 0.345, 0.38, 0.13, 0.015, outline=0.002, bevel=0)

# ---------- the Septimian temple on its podium ----------
TY = 0.42
box('podium', M['stoneDark'], 0.0, TY, RZ - 0.005, 0.3, 0.32, 0.12, outline=0.005, bevel=0)
for i in range(6):
    box(f'templestep{i}', M['stone'], 0.0, TY - 0.16 - 0.012 - i * 0.025, RZ - 0.005, 0.2, 0.025, 0.12 - i * 0.02, outline=0.001, bevel=0)
PZ = RZ + 0.115
box('cella', M['stone'], 0.0, TY + 0.06, PZ, 0.24, 0.18, 0.18, outline=0.005, bevel=0)
for k in range(4):
    rod(f'templecol{k}', M['stone'], (-0.1 + k * 0.0667, TY - 0.1, PZ), (-0.1 + k * 0.0667, TY - 0.1, PZ + 0.18), 0.012, segs=8, outline=0.001)
box('templeentablature', M['stone'], 0.0, TY - 0.02, PZ + 0.18, 0.26, 0.2, 0.03, outline=0.003, bevel=0)
loft('templepediment', M['stone'], [[(-0.13, TY - 0.12, PZ + 0.21), (0.13, TY - 0.12, PZ + 0.21), (0.13, TY + 0.08, PZ + 0.21), (-0.13, TY + 0.08, PZ + 0.21)],
                                    [(-0.004, TY - 0.12, PZ + 0.27), (0.004, TY - 0.12, PZ + 0.27), (0.004, TY + 0.08, PZ + 0.27), (-0.004, TY + 0.08, PZ + 0.27)]], outline=0.003)

# ---------- the colonnaded street and the town's low walls ----------
for s in (-1, 1):
    for k in range(6):
        y = -0.85 + k * 0.1 if k < 3 else 0.0 + (k - 3) * 0.08
        h = 0.08 + 0.12 * rng.random()
        rod(f'streetcol{s}{k}', M['stone'], (s * 0.1, y, RZ - 0.005), (s * 0.1, y, RZ + h), 0.01, segs=8, outline=0.001)
    for k in range(5):
        y = -0.8 + k * 0.38
        box(f'wall{s}{k}', M['stone'], s * 0.24, y, RZ - 0.005, 0.12, 0.02, 0.03 + 0.03 * rng.random(), outline=0.001, bevel=0)
        box(f'wallb{s}{k}', M['stone'], s * 0.18, y + 0.06, RZ - 0.005, 0.02, 0.12, 0.03 + 0.03 * rng.random(), outline=0.001, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
