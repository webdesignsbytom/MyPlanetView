# A cartoon Hiroshima Peace Memorial for the country maps, built in the set's shared look
# (../toon.py): the A-Bomb Dome, the ruined shell of the old exhibition hall kept as it was left, its
# broken brick walls and empty windows, the bare steel frame of its dome over the stair tower, by
# the Motoyasu River, with the park's trees and a string of paper cranes. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P hiroshima-peace-memorial.py -- hiroshima-peace-memorial-1024.png 1024 hiroshima-peace-memorial.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'embank': toon('embank', '#a8a098'),
    'brick': toon('brick', '#c8a888', shadow_mul=(0.86, 0.82, 0.8)),
    'brickDark': toon('brickDark', '#9a8070', shadow_mul=(0.86, 0.82, 0.8)),
    'steel': toon('steel', '#4a4a50'),
    'window': flat('window', '#3a3230'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4a40'),
    'c0': toon('c0', '#e8402c'), 'c1': toon('c1', '#f0c030', lift=0.2), 'c2': toon('c2', '#2f8ad8'), 'c3': toon('c3', '#3f9a4a'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2231)

box('river', M['river'], 0.0, -0.65, G - 0.004, 2.6, 0.42, 0.01, outline=0.004, bevel=0)
box('embankment', M['embank'], 0.0, -0.43, G - 0.005, 2.6, 0.04, 0.03, outline=0.003, bevel=0)

# ---------- the ruined hall ----------
HX, HY = 0.0, 0.1


def ruined(name, x, y, w, d, h, mat, rows, cols, rot=0.0):
    box(name, M[mat], x, y, G - 0.005, w, d, h, rot_z=rot, outline=0.009, bevel=0)
    for r in range(rows):
        for c in range(cols):
            if (r * 7 + c * 3) % 5 == 0 and r == rows - 1:
                continue
            box(f'{name}win{r}{c}', M['window'], x - w / 2 + (c + 0.5) * w / cols, y - d / 2 - 0.004, G + 0.04 + r * (h - 0.06) / rows, w / cols * 0.45, 0.006, (h - 0.06) / rows * 0.55, outline=0, bevel=0)
    # the broken top: a few chunks standing up, gaps between
    for c in range(cols):
        if c % 3 != 1:
            box(f'{name}chunk{c}', M[mat], x - w / 2 + (c + 0.5) * w / cols, y - d / 2 + 0.02, G + h - 0.005, w / cols, 0.04, rng.uniform(0.02, 0.07), outline=0.004, bevel=0)


ruined('wingleft', HX - 0.38, HY, 0.5, 0.3, 0.26, 'brick', 3, 6)
ruined('wingright', HX + 0.36, HY + 0.02, 0.44, 0.3, 0.2, 'brickDark', 2, 5)
lathe('stairtower', M['brick'], ((0.15, 0), (0.15, 0.38)), G - 0.005, HX, HY - 0.02, segs=8, outline=0.01, smooth=False)
for j in range(8):
    a = 2 * math.pi * j / 8 + math.pi / 8
    box(f'towerwin{j}', M['window'], HX + 0.142 * math.cos(a), HY - 0.02 + 0.142 * math.sin(a), G + 0.22, 0.04, 0.006, 0.09, rot_z=a + math.pi / 2, outline=0, bevel=0)
# the bare dome frame: a ring and its ribs
Z = G + 0.375
lathe('domering', M['steel'], ((0.13, 0), (0.13, 0.02)), Z, HX, HY - 0.02, segs=16, outline=0.003)
for j in range(10):
    a = 2 * math.pi * j / 10
    pts = [(HX + 0.12 * math.cos(t) * math.cos(a), HY - 0.02 + 0.12 * math.cos(t) * math.sin(a), Z + 0.02 + 0.15 * math.sin(t)) for t in (math.pi / 2 * i / 5 for i in range(6))]
    for i in range(5):
        rod(f'rib{j}{i}', M['steel'], pts[i], pts[i + 1], 0.006, segs=5, outline=0)
for z in (0.06, 0.11):
    rr = 0.12 * math.cos(math.asin(z / 0.15))
    lathe(f'hoop{z}', M['steel'], ((rr, 0), (rr, 0.008)), Z + 0.02 + z, HX, HY - 0.02, segs=16, outline=0)

# ---------- the park's trees and the paper cranes ----------
for k, (x, y) in enumerate(((-0.95, -0.15), (0.95, -0.2), (-0.8, 0.55), (0.75, 0.6), (-0.3, 0.75), (0.3, 0.8))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.012, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.09, outline=0.009)
for k in range(9):
    x = -0.4 + k * 0.1
    lathe(f'crane{k}', M[f'c{k % 4}'], ((0.022, 0), (0.004, 0.03)), G + 0.005, x, -0.3, segs=3, outline=0.002, smooth=False)

turn(before, -20)
render(G)
