# A cartoon Babylon for the country maps, built in the set's shared look (../toon.py): the Ishtar
# Gate in its deep blue glazed bricks, the tall middle gate with its arch between lower towers, all
# crowned with stepped battlements and paraded with rows of yellow bulls and dragons, the
# Processional Way's blue walls running out in front with their striding lions, the mud-brick ruins
# behind and date palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P babylon.py -- babylon-1024.png 1024 babylon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#dcc898', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'blue': toon('blue', '#2a5aa8', shadow_mul=(0.8, 0.84, 0.94), lift=0.12),
    'blueDark': toon('blueDark', '#1e4080'),
    'yellow': toon('yellow', '#f0c040', lift=0.25),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'dark': flat('dark', '#2a2420'),
    'mud': toon('mud', '#c8a878', shadow_mul=(0.86, 0.82, 0.76)),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)


def battlements(name, x, y, w, z, d):
    n = max(2, int(w / 0.05))
    for j in range(n):
        bx = x - w / 2 + (j + 0.5) * w / n
        box(f'{name}{j}', M['blueDark'], bx, y, z - 0.005, w / n * 0.6, d, 0.03, outline=0.001, bevel=0)
        box(f'{name}step{j}', M['blueDark'], bx, y, z + 0.024, w / n * 0.3, d, 0.02, outline=0.001, bevel=0)


def bull(name, x, y, z, s=1.0, dragon=False):
    b = ball(f'{name}body', M['yellow'], 0, 0, 0, 0.5, outline=0.001)
    b.scale = (0.05 * s, 0.006, 0.022 * s)
    b.location = (x, y - 0.004, z)
    if dragon:
        bar(f'{name}neck', M['yellow'], (x + 0.018 * s, y - 0.004, z + 0.005), (x + 0.03 * s, y - 0.004, z + 0.035 * s), 0.008 * s, outline=0)
        ball(f'{name}head', M['yellow'], x + 0.033 * s, y - 0.004, z + 0.038 * s, 0.008 * s, outline=0)
    else:
        ball(f'{name}head', M['yellow'], x + 0.028 * s, y - 0.004, z + 0.008 * s, 0.01 * s, outline=0)
    for dx in (-0.016, 0.016):
        bar(f'{name}leg{dx}', M['yellow'], (x + dx * s, y - 0.004, z - 0.006), (x + dx * s, y - 0.004, z - 0.022 * s), 0.006 * s, outline=0)


# ---------- the gate ----------
GY = 0.12
box('gate', M['blue'], 0.0, GY, G - 0.005, 0.3, 0.16, 0.46, outline=0.009, bevel=0)
box('gatearch', M['dark'], 0.0, GY - 0.083, G - 0.005, 0.11, 0.006, 0.2, outline=0, bevel=0)
cyl('gatearchtop', M['dark'], 0.055, 0.006, segs=18, outline=0, matrix=Matrix.Translation((0.0, GY - 0.083, G + 0.195)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
battlements('gatebatt', 0.0, GY - 0.06, 0.3, G + 0.455, 0.03)
for r, z in enumerate((0.31, 0.39)):
    for j in range(3):
        bull(f'gatedragon{r}{j}', -0.09 + j * 0.09, GY - 0.08, G + z, 0.9, dragon=True)
for s in (-1, 1):
    tx = s * 0.25
    box(f'tower{s}', M['blue'], tx, GY + 0.02, G - 0.005, 0.18, 0.2, 0.36, outline=0.008, bevel=0)
    battlements(f'towerbatt{s}', tx, GY - 0.06, 0.18, G + 0.355, 0.03)
    for r, z in enumerate((0.08, 0.17, 0.26)):
        for j in range(2):
            bull(f'towerbull{s}{r}{j}', tx - 0.04 + j * 0.08, GY - 0.08, G + z, 0.9, dragon=(r == 1))
    box(f'rosettes{s}', M['white'], tx, GY - 0.082, G + 0.02, 0.17, 0.004, 0.015, outline=0, bevel=0)
box('gaterosettes', M['white'], 0.0, GY - 0.087, G + 0.24, 0.28, 0.004, 0.015, outline=0, bevel=0)

# ---------- the Processional Way ----------
for s in (-1, 1):
    wx = s * 0.22
    box(f'procwall{s}', M['blue'], wx, -0.42, G - 0.005, 0.06, 0.7, 0.15, outline=0.006, bevel=0)
    battlements(f'procbatt{s}', wx, -0.42, 0.06, G + 0.145, 0.7)
    for j in range(4):
        y = -0.7 + j * 0.16
        b = ball(f'lion{s}{j}', M['yellow'], 0, 0, 0, 0.5, outline=0.001)
        b.scale = (0.006, 0.06, 0.025)
        b.location = (wx - s * 0.033, y, G + 0.08)
        ball(f'lionhead{s}{j}', M['yellow'], wx - s * 0.033, y - 0.03, G + 0.09, 0.011, outline=0)
box('way', M['white'], 0.0, -0.42, G - 0.003, 0.36, 0.7, 0.008, outline=0, bevel=0)

# ---------- ruins and palms ----------
for k, (x, y, w, h) in enumerate(((-0.55, 0.55, 0.3, 0.1), (0.5, 0.6, 0.35, 0.12), (-0.7, 0.15, 0.2, 0.07), (0.72, 0.15, 0.18, 0.08))):
    box(f'ruin{k}', M['mud'], x, y, G - 0.005, w, 0.14, h, outline=0.005, bevel=0)
for k, (x, y) in enumerate(((-0.75, -0.4), (0.75, -0.45), (-0.25, 0.75), (0.3, 0.85))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.32), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.32), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.26), 0.025, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
