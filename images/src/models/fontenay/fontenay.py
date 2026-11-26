# A cartoon Fontenay Abbey for the country maps, built in the set's shared look (../toon.py): the
# Cistercian abbey in its quiet valley in Burgundy, France, as plain as Saint Bernard wanted: the
# long church with its stepped west front and seven windows, the cloister's round arches on
# their paired columns, the dormitory, the forge by the stream with its water wheel, the
# formal gardens, and the woods on the slopes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P fontenay.py -- fontenay-1024.png 1024 fontenay.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#e4d6b8', shadow_mul=(0.8, 0.8, 0.86), lift=0.18),
    'roof': toon('roof', '#a06a4a'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'hedge': toon('hedge', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'wood': toon('wood', '#6a4a30'),
    'path': toon('path2', '#e2d6bc', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the stream ----------
for k in range(6):
    x = -1.08 + k * 0.36
    bar(f'stream{k}', M['water'], (x, -0.62 + 0.04 * math.sin(k), G - 0.045), (x + 0.36, -0.62 + 0.04 * math.sin(k + 1), G - 0.045), 0.1, outline=0)

# ---------- the church ----------
CX, CY = -0.25, 0.2
box('nave', M['stone'], CX, CY, G - 0.005, 0.24, 0.6, 0.24, outline=0.007, bevel=0)
gable('naveroof', M['roof'], CX, CY, G + 0.235, 0.24, 0.6, 0.12, over=0.015)
for s in (-1, 1):
    box(f'aisle{s}', M['stone'], CX + s * 0.17, CY, G - 0.005, 0.1, 0.56, 0.13, outline=0.005, bevel=0)
    xi, xo = CX + s * 0.12, CX + s * 0.23
    lo, hi = min(xi, xo), max(xi, xo)
    top = [(xi - 0.003, CY - 0.29), (xi + 0.003, CY - 0.29), (xi + 0.003, CY + 0.29), (xi - 0.003, CY + 0.29)]
    loft(f'aisleroof{s}', M['roof'], [[(lo, CY - 0.29, G + 0.125), (hi, CY - 0.29, G + 0.125), (hi, CY + 0.29, G + 0.125), (lo, CY + 0.29, G + 0.125)],
                                       [(x, y, G + 0.18) for x, y in top]], outline=0.003)
FY = CY - 0.3 - 0.004
for j in range(3):
    arch(f'frontwin{j}', M['dark'], CX - 0.05 + j * 0.05, FY, G + 0.15, 0.025, 0.06)
arch('frontdoor', M['dark'], CX, FY, G - 0.005, 0.06, 0.1)
box('porchbase', M['stone'], CX, FY - 0.03, G - 0.005, 0.26, 0.05, 0.04, outline=0.002, bevel=0)

# ---------- the cloister and the dormitory ----------
QX, QY = 0.2, 0.25
for k, (x, y, sx, sy) in enumerate(((QX, QY - 0.2, 0.4, 0.06), (QX + 0.2, QY, 0.06, 0.4))):
    box(f'cloister{k}', M['stone'], x, y, G - 0.005, sx, sy, 0.1, outline=0.004, bevel=0)
    gable(f'cloisterroof{k}', M['roof'], x, y, G + 0.095, sx, sy, 0.05, ridge_x=sx > sy, over=0.012)
for j in range(5):
    arch(f'cloisterarch{j}', M['dark'], QX - 0.16 + j * 0.08, QY - 0.233, G + 0.01, 0.045, 0.07)
box('dormitory', M['stone'], QX, QY + 0.3, G - 0.005, 0.5, 0.18, 0.2, outline=0.006, bevel=0)
gable('dormroof', M['roof'], QX, QY + 0.3, G + 0.195, 0.5, 0.18, 0.12, ridge_x=True, over=0.015)
for j in range(6):
    box(f'dormwin{j}', M['dark'], QX - 0.2 + j * 0.08, QY + 0.207, G + 0.1, 0.02, 0.006, 0.05, outline=0, bevel=0)

# ---------- the forge by the stream ----------
FX, FY2 = 0.55, -0.42
box('forge', M['stone'], FX, FY2, G - 0.005, 0.34, 0.16, 0.14, outline=0.005, bevel=0)
gable('forgeroof', M['roof'], FX, FY2, G + 0.135, 0.34, 0.16, 0.09, ridge_x=True, over=0.012)
for j in range(4):
    arch(f'forgewin{j}', M['dark'], FX - 0.12 + j * 0.08, FY2 - 0.083, G + 0.03, 0.035, 0.07)
cyl('wheel', M['wood'], 0.07, 0.025, segs=16, outline=0.002, matrix=Matrix.Translation((FX + 0.2, FY2 - 0.1, G + 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))

# ---------- the gardens ----------
box('gardenpath', M['path'], -0.25, -0.35, G - 0.004, 0.08, 0.2, 0.008, outline=0.001, bevel=0)
for k in range(3):
    for s in (-1, 1):
        box(f'hedge{k}{s}', M['hedge'], -0.25 + s * 0.15, -0.25 - k * 0.1, G - 0.005, 0.16, 0.06, 0.05, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.85, 0.35), (-0.7, 0.75), (0.0, 0.95), (0.7, 0.65), (0.95, 0.15), (-0.95, -0.2))):
    tree(f'tree{k}', x, y, r=0.1, h=0.14)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
