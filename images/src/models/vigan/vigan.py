# A cartoon Vigan for the country maps, built in the set's shared look (../toon.py): Calle Crisologo,
# the cobbled street of the Spanish colonial town, lined with its old houses (stone below, wooden
# upper floors with sliding capiz-shell windows, red tile roofs), iron street lamps, and a calesa
# with its horse. Turned a little towards the camera.
# Run: blender -b --factory-startup -P vigan.py -- vigan-1024.png 1024 vigan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8aa94', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'cobbles': toon('cobbles', '#8a7a6a', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'stone': toon('stone', '#e2d6bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'wood': toon('wood', '#7a4a2e'),
    'capiz': toon('capiz', '#f4ecd8', lift=0.25),
    'roof': toon('roof', '#b8503a'),
    'lamp': toon('lamp', '#2e2a30'),
    'glow': flat('glow', '#f8e080'),
    'calesa': toon('calesa', '#c8302a'),
    'horse': toon('horse', '#8a5a3a'),
    'tyre': toon('tyre', '#3a2c26'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1933)

box('street', M['cobbles'], 0.0, 0.0, G - 0.004, 0.32, 2.6, 0.008, outline=0.004, bevel=0)


def house(name, x, y, s):
    box(name, M['stone'], x, y, G - 0.005, 0.3, 0.26, 0.1, outline=0.009, bevel=0)
    box(f'{name}upper', M['wood'], x - s * 0.02, y, G + 0.095, 0.34, 0.28, 0.1, outline=0.009, bevel=0)
    for j in range(3):
        box(f'{name}capiz{j}', M['capiz'], x - s * 0.19 - s * 0.002, y - 0.09 + j * 0.09, G + 0.115, 0.006, 0.07, 0.06, outline=0, bevel=0)
    box(f'{name}door', M['wood'], x - s * 0.152, y, G, 0.006, 0.07, 0.08, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - 0.2, y - 0.16, G + 0.19), (x + 0.2, y - 0.16, G + 0.19), (x + 0.2, y + 0.16, G + 0.19), (x - 0.2, y + 0.16, G + 0.19)],
                                    [(x - 0.004, y - 0.12, G + 0.27), (x + 0.004, y - 0.12, G + 0.27), (x + 0.004, y + 0.12, G + 0.27), (x - 0.004, y + 0.12, G + 0.27)]],
         outline=0.008)


for k in range(5):
    y = -0.75 + k * 0.34
    for s in (-1, 1):
        x = s * 0.36
        if math.hypot(x + s * 0.2, y) > 1.2:
            continue
        house(f'house{s}{k}', x, y, s)
for k in range(4):
    y = -0.6 + k * 0.4
    for s in (-1, 1):
        x = s * 0.18
        rod(f'lamppost{s}{k}', M['lamp'], (x, y, G), (x, y, G + 0.2), 0.006, segs=6, outline=0.002)
        box(f'lamphead{s}{k}', M['lamp'], x, y, G + 0.2, 0.03, 0.03, 0.04, outline=0.002, bevel=0)
        box(f'lampglow{s}{k}', M['glow'], x, y, G + 0.205, 0.02, 0.032, 0.025, outline=0, bevel=0)

# ---------- the calesa ----------
CX, CY = 0.0, -0.25
box('calesa', M['calesa'], CX, CY, G + 0.06, 0.1, 0.12, 0.08, outline=0.006, bevel=0)
box('calesaroof', M['calesa'], CX, CY, G + 0.15, 0.12, 0.14, 0.012, outline=0.004, bevel=0)
for s in (-1, 1):
    cyl(f'calesawheel{s}', M['tyre'], 0.055, 0.012, segs=16, outline=0.003, matrix=Matrix.Translation((CX + s * 0.065, CY, G + 0.055)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
HY = CY - 0.16
for fy in (-0.03, 0.03):
    for s in (-1, 1):
        rod(f'horseleg{fy}{s}', M['horse'], (CX + s * 0.018, HY + fy, G), (CX + s * 0.018, HY + fy, G + 0.06), 0.008, segs=5, outline=0.002)
b = ball('horsebody', M['horse'], 0, 0, 0, 0.035, outline=0.005)
b.scale = (0.8, 1.6, 0.85)
b.location = (CX, HY, G + 0.08)
rod('horseneck', M['horse'], (CX, HY - 0.05, G + 0.09), (CX, HY - 0.08, G + 0.14), 0.014, segs=6, outline=0.003)
ball('horsehead', M['horse'], CX, HY - 0.095, G + 0.145, 0.018, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
