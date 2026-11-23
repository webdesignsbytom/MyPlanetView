# A cartoon Giralda for the country maps, built in the set's shared look (../toon.py): Seville's
# cathedral bell tower, the old minaret of brick with its raised lattice panels, the Renaissance
# belfry and lantern on top with the Giraldillo weathervane, the Gothic cathedral's buttresses and
# pinnacles beside it, and the orange trees of the Patio de los Naranjos. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P seville-giralda.py -- seville-giralda-1024.png 1024 seville-giralda.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d4bc', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'brick': toon('brick', '#d8a070', shadow_mul=(0.86, 0.78, 0.72), lift=0.1),
    'brickDark': toon('brickDark', '#b07a50', shadow_mul=(0.86, 0.78, 0.72)),
    'stone': toon('stone', '#e2d2ae', shadow_mul=(0.86, 0.8, 0.78), lift=0.15),
    'white': toon('white', '#f8f4ea', lift=0.2),
    'bronze': toon('bronze', '#6a5a44'),
    'window': flat('window', '#3a2a24'),
    'orange': toon('orangeFruit', '#f08a2a', lift=0.3),
    'tree': toon('tree', '#3f8a46', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1487)

# ---------- the cathedral: a Gothic mass with buttresses and pinnacles ----------
CX, CY = 0.3, 0.35
box('cathedral', M['stone'], CX, CY, G - 0.005, 0.85, 0.5, 0.22, outline=0.014, bevel=0)
box('cathedralnave', M['stone'], CX, CY, G + 0.21, 0.7, 0.2, 0.1, outline=0.01, bevel=0)
for j in range(7):
    x = CX - 0.38 + j * 0.125
    box(f'buttress{j}', M['stone'], x, CY - 0.27, G - 0.005, 0.03, 0.05, 0.24, outline=0.004, bevel=0)
    lathe(f'pinnacle{j}', M['stone'], ((0.016, 0), (0.004, 0.08)), G + 0.235, x, CY - 0.27, segs=4, outline=0.003, smooth=False)
    if j < 6:
        box(f'cathwin{j}', M['window'], x + 0.062, CY - 0.253, G + 0.08, 0.03, 0.006, 0.1, outline=0, bevel=0)
lathe('cathdome', M['stone'], ((0.08, 0), (0.06, 0.05), (0.004, 0.09)), G + 0.31, CX + 0.1, CY, segs=8, outline=0.008)

# ---------- the Giralda ----------
TX, TY = -0.3, 0.3
box('giralda', M['brick'], TX, TY, G - 0.005, 0.18, 0.18, 0.6, outline=0.014, bevel=0)
for k in range(4):
    z = G + 0.12 + k * 0.12
    box(f'panel{k}', M['brickDark'], TX, TY - 0.093, z, 0.1, 0.008, 0.08, outline=0, bevel=0)
    box(f'panelwin{k}', M['window'], TX, TY - 0.096, z + 0.02, 0.03, 0.006, 0.04, outline=0, bevel=0)
box('belfry', M['white'], TX, TY, G + 0.595, 0.16, 0.16, 0.11, outline=0.01, bevel=0)
for j in range(2):
    box(f'belfryarch{j}', M['window'], TX - 0.035 + j * 0.07, TY - 0.083, G + 0.62, 0.035, 0.006, 0.06, outline=0, bevel=0)
box('clocklevel', M['brick'], TX, TY, G + 0.7, 0.12, 0.12, 0.07, outline=0.008, bevel=0)
box('stars', M['white'], TX, TY, G + 0.765, 0.09, 0.09, 0.05, outline=0.006, bevel=0)
lathe('lantern', M['white'], ((0.04, 0), (0.035, 0.04), (0.02, 0.07), (0.004, 0.09)), G + 0.81, TX, TY, segs=8, outline=0.006)
rod('giraldillo', M['bronze'], (TX, TY, G + 0.89), (TX, TY, G + 0.95), 0.008, segs=6, outline=0.002)
bar('giraldilloshield', M['bronze'], (TX - 0.02, TY, G + 0.935), (TX + 0.025, TY, G + 0.945), 0.02, outline=0.002)

# ---------- the Patio de los Naranjos ----------
for k in range(8):
    x = -0.75 + (k % 4) * 0.25
    y = -0.35 - (k // 4) * 0.28
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.06), 0.012, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.08, outline=0.011)
    for j in range(4):
        a = 2 * math.pi * j / 4 + k
        ball(f'orange{k}{j}', M['orange'], x + 0.065 * math.cos(a), y + 0.065 * math.sin(a), G + 0.12 + 0.03 * math.sin(a * 2), 0.014, outline=0.002)
lathe('fountain', M['white'], ((0.08, 0), (0.08, 0.04), (0.03, 0.05), (0.02, 0.1)), G - 0.005, 0.35, -0.5, segs=12, outline=0.006)

turn(before, -20)
render(G)
