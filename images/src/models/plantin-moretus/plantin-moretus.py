# A cartoon Plantin-Moretus House for the country maps, built in the set's shared look (../toon.py):
# the great printing house of Christophe Plantin and the Moretus family in Antwerp, Belgium,
# the oldest printing works in the world, its Renaissance courtyard ringed by brick wings with
# stone-framed windows and steep roofs with dormers, the vines on the walls, the garden in the
# middle, the classical front on the Vrijdagmarkt, and two of its wooden presses. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P plantin-moretus.py -- plantin-moretus-1024.png 1024 plantin-moretus.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8bca4', shadow_mul=(0.82, 0.8, 0.84), lift=0.16),
    'brick': toon('brick', '#b8664a', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'stone': toon('stone', '#ece2cc', lift=0.2),
    'roof': toon('roof', '#4a4a52'),
    'grass': toon('grass2', '#8cc05a', lift=0.22),
    'vine': toon('vine', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'wood': toon('wood', '#6a4428'),
    'dark': flat('dark', '#2e2622'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the wings round the courtyard ----------
W, D, T = 0.9, 0.8, 0.2
CY = 0.05
for k, (x, y, sx, sy, rx) in enumerate(((0.0, CY + D / 2 - T / 2, W, T, True), (-W / 2 + T / 2, CY, T, D, False), (W / 2 - T / 2, CY, T, D, False))):
    box(f'wing{k}', M['brick'], x, y, G - 0.005, sx, sy, 0.24, outline=0.006, bevel=0)
    gable(f'wingroof{k}', M['roof'], x, y, G + 0.235, sx, sy, 0.14, ridge_x=rx, over=0.012)
# the low front wing on the market square
box('frontwing', M['stone'], 0.0, CY - D / 2 + 0.06, G - 0.005, W, 0.12, 0.16, outline=0.006, bevel=0)
box('frontcornice', M['stone'], 0.0, CY - D / 2 + 0.06, G + 0.155, W + 0.02, 0.14, 0.02, outline=0.002, bevel=0)
for j in range(9):
    x = -0.4 + j * 0.1
    box(f'frontwin{j}', M['dark'], x, CY - D / 2 - 0.003, G + 0.05, 0.04, 0.006, 0.07, outline=0, bevel=0)
box('frontdoor', M['wood'], 0.0, CY - D / 2 - 0.004, G - 0.005, 0.08, 0.008, 0.12, outline=0, bevel=0)
gable('frontpediment', M['stone'], 0.0, CY - D / 2 + 0.02, G + 0.17, 0.16, 0.04, 0.06)
# the courtyard's windows, dormers and vines
for j in range(6):
    x = -0.25 + j * 0.1
    box(f'yardwin{j}', M['stone'], x, CY + D / 2 - T - 0.003, G + 0.06, 0.05, 0.006, 0.08, outline=0, bevel=0)
    box(f'yardwinglass{j}', M['dark'], x, CY + D / 2 - T - 0.006, G + 0.07, 0.035, 0.004, 0.06, outline=0, bevel=0)
    box(f'yardwinup{j}', M['stone'], x, CY + D / 2 - T - 0.003, G + 0.16, 0.05, 0.006, 0.06, outline=0, bevel=0)
for j in range(3):
    x = -0.2 + j * 0.2
    box(f'dormer{j}', M['stone'], x, CY + D / 2 - T + 0.02, G + 0.25, 0.06, 0.04, 0.06, outline=0.002, bevel=0)
    gable(f'dormerroof{j}', M['roof'], x, CY + D / 2 - T + 0.02, G + 0.305, 0.06, 0.04, 0.03)
for k in range(5):
    b = ball(f'vine{k}', M['vine'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (0.4, 1.3, 1.6)
    b.location = (-W / 2 + T + 0.01, CY - 0.25 + k * 0.12, G + 0.1)
box('garden', M['grass'], 0.05, CY - 0.02, G - 0.004, 0.4, 0.32, 0.01, outline=0.001, bevel=0)
# two wooden presses in the courtyard
for k, x in enumerate((-0.1, 0.18)):
    for s in (-1, 1):
        rod(f'presspost{k}{s}', M['wood'], (x + s * 0.04, CY - 0.05, G), (x + s * 0.04, CY - 0.05, G + 0.16), 0.008, segs=6, outline=0.001)
    box(f'presstop{k}', M['wood'], x, CY - 0.05, G + 0.15, 0.11, 0.03, 0.02, outline=0.001, bevel=0)
    box(f'pressbed{k}', M['wood'], x, CY - 0.07, G + 0.05, 0.08, 0.12, 0.02, outline=0.001, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
