# A cartoon Fagus Factory for the country maps, built in the set's shared look (../toon.py): Walter
# Gropius's shoe-last factory at Alfeld, the main building's curtain walls of glass wrapping round its
# corners with no pillar, the thin dark steel frames, the yellow brick base and bands, the taller
# production hall and warehouse behind, the tall brick chimney with FAGUS down it, and the lawns.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P fagus-factory.py -- fagus-factory-1024.png 1024 fagus-factory.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'brick': toon('brick', '#e0c890', shadow_mul=(0.86, 0.82, 0.76), lift=0.12),
    'brickDark': toon('brickDark', '#3a3a40'),
    'glass': toon('glass', '#6a9ab8', shadow_mul=(0.8, 0.88, 0.94), lift=0.3),
    'frame': flat('frame', '#2a2e34'),
    'roof': toon('roof', '#5a5e66'),
    'white': toon('white', '#f6f4ee'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the main building with its glass corners ----------
MX, MY = -0.15, -0.15
W, D, H = 0.8, 0.22, 0.34
box('base', M['brickDark'], MX, MY, G - 0.005, W + 0.01, D + 0.01, 0.05, outline=0.004, bevel=0)
box('glassbody', M['glass'], MX, MY, G + 0.045, W, D, H - 0.07, outline=0.008, bevel=0)
box('topband', M['brick'], MX, MY, G + H - 0.03, W + 0.01, D + 0.01, 0.05, outline=0.005, bevel=0)
box('roof', M['roof'], MX, MY, G + H + 0.015, W + 0.02, D + 0.02, 0.012, outline=0.002, bevel=0)
# brick piers between the glass bays on the long side (but none at the corners)
for j in range(1, 8):
    x = MX - W / 2 + j * W / 8
    box(f'pier{j}', M['brick'], x, MY - D / 2 - 0.004, G + 0.045, 0.03, 0.012, H - 0.07, outline=0.001, bevel=0)
# the thin steel frames: transoms all round the visible faces, mullions on the glass
for k in range(4):
    z = G + 0.045 + (k + 1) * (H - 0.07) / 5
    bar(f'transomfront{k}', M['frame'], (MX - W / 2, MY - D / 2 - 0.004, z), (MX + W / 2, MY - D / 2 - 0.004, z), 0.006, outline=0)
    bar(f'transomside{k}', M['frame'], (MX - W / 2 - 0.004, MY - D / 2, z), (MX - W / 2 - 0.004, MY + D / 2, z), 0.006, outline=0)
for j in range(5):
    y = MY - D / 2 + j * D / 4
    bar(f'mullionside{j}', M['frame'], (MX - W / 2 - 0.004, y, G + 0.045), (MX - W / 2 - 0.004, y, G + H - 0.03), 0.005, outline=0)
for j in range(17):
    x = MX - W / 2 + j * W / 16
    bar(f'mullionfront{j}', M['frame'], (x, MY - D / 2 - 0.004, G + 0.045), (x, MY - D / 2 - 0.004, G + H - 0.03), 0.004, outline=0)
box('entrance', M['brickDark'], MX + 0.1, MY - D / 2 - 0.02, G - 0.005, 0.1, 0.04, 0.12, outline=0.003, bevel=0)

# ---------- the production hall and warehouse behind ----------
box('hall', M['brick'], MX + 0.05, MY + 0.42, G - 0.005, 0.9, 0.5, 0.26, outline=0.007, bevel=0)
for j in range(7):
    box(f'hallwin{j}', M['glass'], MX - 0.32 + j * 0.12, MY + 0.17 - 0.003, G + 0.06, 0.08, 0.006, 0.14, outline=0, bevel=0)
box('warehouse', M['brick'], MX + 0.6, MY + 0.3, G - 0.005, 0.24, 0.3, 0.42, outline=0.007, bevel=0)
for row in range(3):
    box(f'warewin{row}', M['glass'], MX + 0.6, MY + 0.147, G + 0.08 + row * 0.11, 0.14, 0.006, 0.07, outline=0, bevel=0)

# ---------- the chimney ----------
CX, CY = MX + 0.65, MY + 0.65
lathe('chimney', M['brick'], ((0.06, 0), (0.045, 0.85)), G - 0.005, CX, CY, segs=16, outline=0.006)
lathe('chimneycap', M['brickDark'], ((0.05, 0), (0.05, 0.03)), G + 0.84, CX, CY, segs=16, outline=0.002)
for k in range(5):
    box(f'fagusletter{k}', M['white'], CX - 0.02, CY - 0.055, G + 0.35 + k * 0.07, 0.035, 0.006, 0.05, rot_z=-0.35, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.8, -0.55), (0.5, -0.65), (-0.85, 0.4), (-0.25, -0.75))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
