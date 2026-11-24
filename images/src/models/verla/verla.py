# A cartoon Verla for the country maps, built in the set's shared look (../toon.py): the groundwood
# and board mill in the forests of southern Finland, its red brick buildings with round-arched
# windows and white trim, the drying loft, the tall brick chimney, the rapids rushing past
# under the bridge, and the pine forest. Turned a little towards the camera.
# Run: blender -b --factory-startup -P verla.py -- verla-1024.png 1024 verla.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'brick': toon('brick', '#b8583e', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'white': toon('white', '#f2eee4', lift=0.22),
    'roof': toon('roof', '#4a4a52'),
    'water': toon('water', '#4a8ac0', lift=0.3),
    'foam': toon('foam', '#e8f2f6', lift=0.3),
    'rock': toon('rock', '#9a948a'),
    'wood': toon('wood', '#6a4a30'),
    'pine': toon('pine', '#2e5e36', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
    'dark': flat('dark', '#2e2622'),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the rapids ----------
for k in range(5):
    x = 0.55 + 0.05 * math.sin(k)
    y = -1.05 + k * 0.4
    bar(f'rapids{k}', M['water'], (x, y, G - 0.07), (x + 0.04, y + 0.4, G - 0.07), 0.16, outline=0)
for k in range(8):
    ball(f'foam{k}', M['foam'], 0.52 + 0.1 * ((k * 7) % 3) / 2, -0.8 + k * 0.22, G + 0.008, 0.03, outline=0)
for k in range(5):
    ball(f'rock{k}', M['rock'], 0.62 - 0.08 * (k % 2), -0.6 + k * 0.3, G + 0.01, 0.035, outline=0.002)
bar('bridge', M['wood'], (0.35, -0.35, G + 0.06), (0.8, -0.35, G + 0.06), 0.06, outline=0.002)

# ---------- the board mill ----------
MX, MY = -0.15, 0.1
box('mill', M['brick'], MX, MY, G - 0.005, 0.6, 0.32, 0.24, outline=0.007, bevel=0)
gable('millroof', M['roof'], MX, MY, G + 0.235, 0.6, 0.32, 0.1, ridge_x=True, over=0.015)
for j in range(6):
    x = MX - 0.25 + j * 0.1
    arch(f'millwin{j}', M['white'], x, MY - 0.163, G + 0.04, 0.05, 0.08)
    arch(f'millwinglass{j}', M['dark'], x, MY - 0.166, G + 0.05, 0.035, 0.065)
    arch(f'millwinup{j}', M['white'], x, MY - 0.163, G + 0.14, 0.05, 0.07)
    arch(f'millwinupglass{j}', M['dark'], x, MY - 0.166, G + 0.15, 0.035, 0.055)
box('drying', M['brick'], MX + 0.15, MY + 0.3, G - 0.005, 0.4, 0.2, 0.32, outline=0.006, bevel=0)
gable('dryingroof', M['roof'], MX + 0.15, MY + 0.3, G + 0.315, 0.4, 0.2, 0.08, ridge_x=True, over=0.012)
for j in range(4):
    box(f'dryingslat{j}', M['wood'], MX + 0.15 - 0.15 + j * 0.1, MY + 0.197, G + 0.2, 0.06, 0.006, 0.08, outline=0, bevel=0)
lathe('chimney', M['brick'], ((0.05, 0), (0.035, 0.62), (0.045, 0.64), (0.045, 0.66)), G - 0.005, MX - 0.4, MY + 0.15, segs=16, outline=0.005)
box('groundwood', M['brick'], MX + 0.45, MY - 0.15, G - 0.005, 0.22, 0.2, 0.15, outline=0.005, bevel=0)
gable('groundwoodroof', M['roof'], MX + 0.45, MY - 0.15, G + 0.145, 0.22, 0.2, 0.07, ridge_x=True, over=0.012)

for k in range(12):
    a = 2 * math.pi * k / 12 + 0.15
    x, y = 1.1 * math.cos(a), 1.05 * math.sin(a)
    if 0.25 < x < 0.95:
        continue
    lathe(f'pine{k}', M['pine'], ((0.07, 0), (0.0, 0.3)), G + 0.04, x, y, segs=10, outline=0.005, smooth=False)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.012, segs=6, outline=0.001)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
