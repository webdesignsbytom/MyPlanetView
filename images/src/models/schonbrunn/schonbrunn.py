# A cartoon Schönbrunn Palace for the country maps, built in the set's shared look (../toon.py):
# the long Baroque palace in its "Schönbrunn yellow" under grey-green roofs, the middle block
# standing forward with its terrace and the stairs up either side, rows of white-framed windows,
# the formal parterre in front with its flower beds, clipped hedges and fountain, and the
# Gloriette's white colonnade on the hill behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P schonbrunn.py -- schonbrunn-1024.png 1024 schonbrunn.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'yellow': toon('yellow', '#f2c64e', shadow_mul=(0.84, 0.74, 0.62)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'roof': toon('roof', '#6f7f7c', shadow_mul=(0.75, 0.78, 0.86)),
    'window': flat('window', '#3f4a5a'),
    'hedge': toon('hedge', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'lawn': toon('lawn', '#86c464', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'gravel': toon('gravel', '#ebe2cb', lift=0.25),
    'flowerRed': flat('flowerRed', '#e0453a'),
    'flowerPink': flat('flowerPink', '#ef8fb6'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'hill': toon('hill', '#6faa55', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)


def hip_roof(name, x, y, z, w, d, h, mat='roof'):
    ridge = max(0.02, w - d)
    loft(name, M[mat], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                        [(x - ridge / 2, y - 0.006, z + h), (x + ridge / 2, y - 0.006, z + h), (x + ridge / 2, y + 0.006, z + h),
                         (x - ridge / 2, y + 0.006, z + h)]], outline=0.022)


# ---------- the Gloriette's colonnade on the hill behind ----------
hill = loft('hill', M['hill'], [[(0.85 * math.cos(t), 1.0 + 0.3 * math.sin(t), G - 0.01) for t in (2 * math.pi * k / 24 for k in range(24))],
                                [(0.55 * math.cos(t), 1.02 + 0.18 * math.sin(t), G + 0.36) for t in (2 * math.pi * k / 24 for k in range(24))],
                                [(0.45 * math.cos(t), 1.04 + 0.12 * math.sin(t), G + 0.42) for t in (2 * math.pi * k / 24 for k in range(24))]],
            outline=0.03)
hill.visible_shadow = False
GZ, GY = G + 0.42, 1.04
box('gloriettebase', M['white'], 0, GY, GZ - 0.01, 0.78, 0.1, 0.04, outline=0.016, bevel=0)
box('gloriette', M['white'], 0, GY + 0.015, GZ + 0.03, 0.74, 0.06, 0.15, outline=0.018, bevel=0.003)
for k in range(11):
    x = -0.33 + k * 0.066
    rod(f'gloriettecol{k}', M['white'], (x, GY - 0.035, GZ + 0.03), (x, GY - 0.035, GZ + 0.18), 0.009, segs=8, outline=0.005)
    if k < 10:
        box(f'gloriettearch{k}', M['window'], x + 0.033, GY - 0.017, GZ + 0.05, 0.035, 0.01, 0.1, outline=0, bevel=0)
box('glorietteattic', M['white'], 0, GY, GZ + 0.18, 0.78, 0.1, 0.035, outline=0.016, bevel=0)
box('gloriettecentre', M['white'], 0, GY, GZ + 0.215, 0.18, 0.08, 0.05, outline=0.012, bevel=0)
ball('glorietteeagle', M['gold'], 0, GY, GZ + 0.29, 0.025, outline=0.006)

# ---------- the palace ----------
PY, W, D, H = 0.3, 1.82, 0.32, 0.34
box('palace', M['yellow'], 0, PY, G - 0.005, W, D, H, outline=0.03, bevel=0.004)
hip_roof('palaceroof', 0, PY, G + H, W + 0.04, D + 0.04, 0.12)
# the middle block standing forward, a little higher, with its attic and ornaments
CW, CD, CH = 0.48, D + 0.12, H + 0.06
box('centre', M['yellow'], 0, PY - 0.06, G - 0.005, CW, CD, CH, outline=0.03, bevel=0.004)
box('centreattic', M['white'], 0, PY - 0.06, G + CH, CW + 0.02, CD + 0.02, 0.035, outline=0.016, bevel=0)
hip_roof('centreroof', 0, PY - 0.06, G + CH + 0.035, CW - 0.04, CD - 0.04, 0.1)
for k in range(5):
    ball(f'ornament{k}', M['gold'], -0.2 + k * 0.1, PY - 0.06 - CD / 2, G + CH + 0.06, 0.014, outline=0.004)
# the end wings
for side in (-1, 1):
    box(f'wing{side}', M['yellow'], side * (W / 2 - 0.12), PY - 0.02, G - 0.005, 0.26, D + 0.04, H + 0.02, outline=0.028, bevel=0.004)
    hip_roof(f'wingroof{side}', side * (W / 2 - 0.12), PY - 0.02, G + H + 0.02, 0.3, D + 0.08, 0.13)


def front_y(x):
    if abs(x) < CW / 2:
        return PY - 0.06 - CD / 2
    if abs(x) > W / 2 - 0.25:
        return PY - 0.02 - (D + 0.04) / 2
    return PY - D / 2


# rows of white-framed windows
for row, z in enumerate((0.07, 0.21)):
    for k in range(24):
        x = -0.86 + k * 0.0748
        if abs(x) < 0.05 and row == 0:
            continue
        y = front_y(x)
        box(f'frame{row}_{k}', M['white'], x, y - 0.004, G + z, 0.046, 0.01, 0.088, outline=0, bevel=0)
        box(f'pane{row}_{k}', M['window'], x, y - 0.009, G + z + 0.01, 0.03, 0.01, 0.066, outline=0, bevel=0)
# the door, the terrace in front of the middle block and its stairs either side
fy = front_y(0)
box('door', M['window'], 0, fy - 0.004, G, 0.08, 0.01, 0.12, outline=0, bevel=0)
box('terrace', M['white'], 0, fy - 0.07, G - 0.005, 0.34, 0.14, 0.1, outline=0.016, bevel=0)
box('terracerail', M['white'], 0, fy - 0.135, G + 0.095, 0.34, 0.012, 0.035, outline=0.008, bevel=0)
for side in (-1, 1):
    for k in range(5):
        box(f'stair{side}{k}', M['white'], side * (0.19 + 0.035 * k), fy - 0.07, G - 0.005, 0.036, 0.12, 0.1 - 0.02 * k, outline=0.006, bevel=0)

# ---------- the parterre: gravel, flower beds edged in box hedges, the fountain ----------
box('gravel', M['gravel'], 0, -0.52, G - 0.005, 1.62, 0.96, 0.012, outline=0.012, bevel=0)
for i, x in enumerate((-0.48, 0.48)):
    for j, y in enumerate((-0.25, -0.75)):
        box(f'bedhedge{i}{j}', M['hedge'], x, y, G, 0.56, 0.34, 0.035, outline=0.012, bevel=0)
        box(f'bed{i}{j}', M['lawn'], x, y, G + 0.02, 0.5, 0.28, 0.02, outline=0, bevel=0)
        for a in range(10):
            t = 2 * math.pi * a / 10
            ball(f'flower{i}{j}{a}', M['flowerRed' if a % 2 else 'flowerPink'], x + 0.17 * math.cos(t), y + 0.08 * math.sin(t), G + 0.045, 0.022,
                 outline=0)
        cyl(f'bedcentre{i}{j}', M['flowerRed'], 0.045, 0.02, segs=16, outline=0, matrix=Matrix.Translation((x, y, G + 0.045)))
lathe('fountain', M['white'], ((0.16, 0), (0.16, 0.05), (0.14, 0.05), (0.14, 0.02)), G, 0, -0.5, segs=28, outline=0.014, smooth=False)
cyl('fountainwater', M['water'], 0.142, 0.03, segs=28, outline=0, matrix=Matrix.Translation((0, -0.5, G + 0.025)))
lathe('jet', M['foam'], ((0.04, 0), (0.025, 0.12), (0.06, 0.16), (0.004, 0.2)), G + 0.03, 0, -0.5, segs=12, outline=0.01)
# clipped hedges and trees down the sides
for side in (-1, 1):
    box(f'sidehedge{side}', M['hedge'], side * 0.95, -0.5, G, 0.1, 0.9, 0.12, outline=0.016, bevel=0.01)
    for k, y in enumerate((-0.1, 0.12)):
        ball(f'sidetree{side}{k}', M['forest'], side * 1.12, y, G + 0.2, 0.13, outline=0.02)

turn(before, -20)
render(G)
