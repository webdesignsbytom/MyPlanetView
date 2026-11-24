# A cartoon Arequipa for the country maps, built in the set's shared look (../toon.py): the "White City"
# of southern Peru, built of pale volcanic sillar, its cathedral stretching the whole side of the
# Plaza de Armas with its long front of columns and its two towers at the ends, the plaza's palms
# and fountain in front, and behind it all the perfect cone of El Misti with its cap of snow.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P arequipa.py -- arequipa-1024.png 1024 arequipa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'sillar': toon('sillar', '#f4f0e8', shadow_mul=(0.8, 0.82, 0.9), lift=0.22),
    'sillarDark': toon('sillarDark', '#d4ccbc'),
    'volcano': toon('volcano', '#8a7a6a', shadow_mul=(0.8, 0.78, 0.84)),
    'snow': toon('snow', '#f8f8f6', lift=0.3),
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#2e2a2a'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- El Misti ----------
VX, VY = 0.0, 0.88
volcano = lathe('misti', M['volcano'], ((0.44, 0), (0.29, 0.36), (0.12, 0.64), (0.06, 0.7), (0.0, 0.71)), G - 0.01, VX, VY, segs=32, outline=0.008)
volcano.visible_shadow = False
snow = lathe('snow', M['snow'], ((0.2, 0), (0.125, 0.14), (0.065, 0.19), (0.0, 0.2)), G + 0.51, VX, VY, segs=32, outline=0.004)
snow.visible_shadow = False

# ---------- the cathedral along the plaza ----------
CY = 0.2
W, D, H = 1.0, 0.2, 0.24
box('cathedral', M['sillar'], 0.0, CY, G - 0.005, W, D, H, outline=0.008, bevel=0)
for j in range(14):
    x = -0.42 + j * 0.84 / 13
    rod(f'col{j}', M['sillar'], (x, CY - D / 2 - 0.012, G), (x, CY - D / 2 - 0.012, G + H - 0.02), 0.01, segs=8, outline=0.002)
    if j < 13 and j % 3 == 1:
        box(f'portal{j}', M['dark'], x + 0.84 / 26, CY - D / 2 - 0.004, G - 0.005, 0.04, 0.006, 0.1, outline=0, bevel=0)
box('cornice', M['sillarDark'], 0.0, CY, G + H - 0.02, W + 0.02, D + 0.04, 0.025, outline=0.003, bevel=0)
box('centre', M['sillar'], 0.0, CY - 0.02, G + H, 0.22, 0.08, 0.08, outline=0.004, bevel=0)
loft('pediment', M['sillar'], [[(-0.11, CY - 0.06, G + H + 0.075), (0.11, CY - 0.06, G + H + 0.075), (0.11, CY + 0.02, G + H + 0.075), (-0.11, CY + 0.02, G + H + 0.075)],
                               [(-0.004, CY - 0.06, G + H + 0.13), (0.004, CY - 0.06, G + H + 0.13), (0.004, CY + 0.02, G + H + 0.13), (-0.004, CY + 0.02, G + H + 0.13)]], outline=0.003)
lathe('dome', M['sillar'], ((0.08, 0), (0.07, 0.04), (0.04, 0.075), (0.0, 0.085)), G + H, 0.0, CY + 0.05, segs=20, outline=0.004)
for s in (-1, 1):
    x = s * 0.5
    box(f'tower{s}', M['sillar'], x, CY - 0.02, G - 0.005, 0.15, 0.15, 0.36, outline=0.006, bevel=0)
    box(f'belfry{s}', M['sillar'], x, CY - 0.02, G + 0.355, 0.12, 0.12, 0.12, outline=0.005, bevel=0)
    for f in (-1, 1):
        box(f'belfryopen{s}{f}', M['dark'], x + f * 0.028, CY - 0.083, G + 0.375, 0.03, 0.006, 0.06, outline=0, bevel=0)
        cyl(f'belfryarch{s}{f}', M['dark'], 0.015, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x + f * 0.028, CY - 0.083, G + 0.435)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    lathe(f'towerdome{s}', M['sillar'], ((0.055, 0), (0.05, 0.03), (0.03, 0.06), (0.0, 0.07)), G + 0.47, x, CY - 0.02, segs=16, outline=0.003)
    lathe(f'towerlantern{s}', M['sillar'], ((0.015, 0), (0.015, 0.04), (0.003, 0.07)), G + 0.535, x, CY - 0.02, segs=8, outline=0.002, smooth=False)

# ---------- the plaza ----------
box('lawn', M['lawn'], 0.0, -0.45, G - 0.004, 0.9, 0.5, 0.01, outline=0.001, bevel=0)
lathe('fountain', M['sillarDark'], ((0.09, 0), (0.09, 0.03), (0.075, 0.03)), G - 0.005, 0.0, -0.45, segs=16, outline=0.003)
lathe('fountainwater', M['water'], ((0.078, 0), (0.078, 0.027)), G - 0.003, 0.0, -0.45, segs=16, outline=0)
lathe('fountaintier', M['sillarDark'], ((0.015, 0), (0.015, 0.08), (0.04, 0.09), (0.004, 0.12)), G + 0.02, 0.0, -0.45, segs=12, outline=0.002)
for k, (x, y) in enumerate(((-0.35, -0.3), (0.35, -0.3), (-0.35, -0.65), (0.35, -0.65), (-0.75, -0.2), (0.75, -0.2))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.02 + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.29)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
