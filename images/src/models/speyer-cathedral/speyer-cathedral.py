# A cartoon Speyer Cathedral for the country maps, built in the set's shared look (../toon.py): the
# vast Romanesque imperial cathedral of red sandstone, its long nave with the dwarf gallery under
# the eaves, the west block's dome between two square towers, the octagonal crossing dome and the
# two east towers with their pointed roofs over the round apse, and the great stone Domnapf bowl on
# the square in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P speyer-cathedral.py -- speyer-cathedral-1024.png 1024 speyer-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'sandstone': toon('sandstone', '#c8806a', shadow_mul=(0.86, 0.8, 0.78), lift=0.06),
    'sandDark': toon('sandDark', '#a8604a'),
    'copper': toon('copper', '#5a8a7a'),
    'window': flat('window', '#3a3030'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
box('lawn', M['lawn'], 0.2, 0.75, G - 0.003, 1.2, 0.3, 0.008, outline=0, bevel=0)

Y, W = 0.18, 0.22
X0, X1 = -0.45, 0.42
box('nave', M['sandstone'], (X0 + X1) / 2, Y, G - 0.005, X1 - X0, W, 0.25, outline=0.009, bevel=0)
loft('naveroof', M['copper'], [[(X0, Y - W / 2, G + 0.245), (X1, Y - W / 2, G + 0.245), (X1, Y + W / 2, G + 0.245), (X0, Y + W / 2, G + 0.245)],
                               [(X0, Y - 0.004, G + 0.34), (X1, Y - 0.004, G + 0.34), (X1, Y + 0.004, G + 0.34), (X0, Y + 0.004, G + 0.34)]], outline=0.005)
box('aisle', M['sandstone'], (X0 + X1) / 2, Y - W / 2 - 0.05, G - 0.005, X1 - X0, 0.1, 0.13, outline=0.006, bevel=0)
for j in range(9):
    x = X0 + 0.05 + j * (X1 - X0 - 0.1) / 8
    box(f'navewin{j}', M['window'], x, Y - W / 2 - 0.003, G + 0.15, 0.025, 0.006, 0.06, outline=0, bevel=0)
    box(f'aislewin{j}', M['window'], x, Y - W / 2 - 0.103, G + 0.04, 0.022, 0.006, 0.05, outline=0, bevel=0)
    for g in range(3):
        box(f'gallery{j}{g}', M['window'], x - 0.03 + g * 0.03, Y - W / 2 - 0.003, G + 0.225, 0.012, 0.006, 0.02, outline=0, bevel=0)


def tower(name, x, y, h):
    box(name, M['sandstone'], x, y, G - 0.005, 0.09, 0.09, h, outline=0.006, bevel=0)
    for k in range(3):
        box(f'{name}win{k}', M['window'], x, y - 0.048, G + h * 0.4 + k * h * 0.17, 0.025, 0.006, h * 0.08, outline=0, bevel=0)
    pyramid(f'{name}roof', M['copper'], x, y, G + h - 0.005, 0.1, 0.16, outline=0.004)


# ---------- the west block ----------
box('westblock', M['sandstone'], X0 - 0.07, Y, G - 0.005, 0.16, W + 0.12, 0.34, outline=0.008, bevel=0)
box('westportal', M['window'], X0 - 0.153, Y, G - 0.005, 0.006, 0.07, 0.12, outline=0, bevel=0)
lathe('westdrum', M['sandstone'], ((0.08, 0), (0.08, 0.08)), G + 0.335, X0 - 0.07, Y, segs=8, outline=0.004, smooth=False)
lathe('westdome', M['copper'], ((0.085, 0), (0.06, 0.06), (0.004, 0.11)), G + 0.41, X0 - 0.07, Y, segs=8, outline=0.004, smooth=False)
for s in (-1, 1):
    tower(f'westtower{s}', X0 - 0.07, Y + s * 0.15, 0.48)

# ---------- the crossing, east towers and apse ----------
CX = X1 - 0.12
box('transept', M['sandstone'], CX, Y, G - 0.005, 0.16, W + 0.26, 0.25, outline=0.008, bevel=0)
lathe('crossingdrum', M['sandstone'], ((0.09, 0), (0.09, 0.12)), G + 0.245, CX, Y, segs=8, outline=0.005, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    if math.sin(a) > 0.3:
        continue
    box(f'crossingwin{k}', M['window'], CX + 0.084 * math.cos(a), Y + 0.084 * math.sin(a), G + 0.28, 0.02, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('crossingdome', M['copper'], ((0.095, 0), (0.06, 0.07), (0.004, 0.13)), G + 0.36, CX, Y, segs=8, outline=0.004, smooth=False)
for s in (-1, 1):
    tower(f'easttower{s}', X1 + 0.03, Y + s * 0.13, 0.46)
lathe('apse', M['sandstone'], ((0.1, 0), (0.1, 0.22)), G - 0.005, X1 + 0.06, Y, segs=14, outline=0.006)
lathe('apseroof', M['copper'], ((0.105, 0), (0.004, 0.08)), G + 0.215, X1 + 0.06, Y, segs=14, outline=0.004)

# ---------- the Domnapf ----------
lathe('domnapfbase', M['sandDark'], ((0.06, 0), (0.05, 0.04)), G - 0.005, -0.25, -0.45, segs=12, outline=0.003)
lathe('domnapf', M['sandstone'], ((0.05, 0), (0.12, 0.05), (0.13, 0.07)), G + 0.035, -0.25, -0.45, segs=16, outline=0.004)
for k, (x, y, r) in enumerate(((0.7, -0.4, 0.12), (-0.8, -0.35, 0.11), (0.35, -0.7, 0.1), (-0.85, 0.45, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
