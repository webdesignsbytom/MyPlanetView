# A cartoon Venice for the country maps, built in the set's shared look (../toon.py): St Mark's
# Campanile in red brick with its white belfry and green spire, St Mark's Basilica's domes and
# golden arches, the Doge's Palace's pink-patterned walls on their white arcades, the two columns of
# the Piazzetta, and gondolas on the lagoon among the mooring posts. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P venice.py -- venice-1024.png 1024 venice.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#3a8a9a', shadow_mul=(0.74, 0.84, 0.86), lift=0.3),
    'paving': toon('paving', '#e2d8c2', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'brick': toon('brick', '#c0603e', shadow_mul=(0.86, 0.76, 0.72)),
    'white': toon('white', '#f6f3ea', lift=0.2),
    'copper': toon('copper', '#5aa08a', shadow_mul=(0.78, 0.86, 0.84), lift=0.15),
    'pink': toon('pink', '#f0c8b8', shadow_mul=(0.86, 0.78, 0.8), lift=0.15),
    'dome': toon('dome', '#8a8e96', shadow_mul=(0.8, 0.82, 0.9)),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#3a3640'),
    'gondola': toon('gondola', '#1e1c22'),
    'post': toon('post', '#e8e2d4'),
    'stripe': toon('poststripe', '#2f5aa0'),
})

G = tile(M['lagoon'])
before = set(bpy.data.objects)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


quay = loft('quay', M['paving'], [segment(-0.15, 1.41, -0.01), segment(-0.13, 1.4, 0.04)], outline=0.01)
quay.visible_shadow = False
T = G + 0.04

# ---------- the Doge's Palace ----------
DX, DY = 0.4, 0.05
box('dogesarcade', M['white'], DX, DY, T - 0.005, 0.6, 0.3, 0.08, outline=0.012, bevel=0)
for j in range(9):
    box(f'dogesarch{j}', M['window'], DX - 0.26 + j * 0.065, DY - 0.152, T + 0.005, 0.035, 0.006, 0.06, outline=0, bevel=0)
box('dogesupper', M['pink'], DX, DY, T + 0.075, 0.6, 0.3, 0.13, outline=0.012, bevel=0)
for j in range(6):
    box(f'dogeswin{j}', M['window'], DX - 0.24 + j * 0.095, DY - 0.152, T + 0.12, 0.03, 0.006, 0.05, outline=0, bevel=0)
box('dogesroof', M['white'], DX, DY, T + 0.2, 0.61, 0.31, 0.015, outline=0.004, bevel=0)

# ---------- St Mark's Basilica ----------
BX, BY = 0.15, 0.55
box('basilica', M['white'], BX, BY, T - 0.005, 0.45, 0.3, 0.18, outline=0.012, bevel=0)
for j in range(5):
    box(f'basilicaarch{j}', M['gold'], BX - 0.18 + j * 0.09, BY - 0.153, T + 0.07, 0.06, 0.006, 0.09, outline=0, bevel=0)
for k, (dx, dy, r) in enumerate(((0.0, 0.0, 0.09), (-0.15, 0.0, 0.065), (0.15, 0.0, 0.065), (0.0, -0.1, 0.065), (0.0, 0.1, 0.065))):
    lathe(f'dome{k}', M['dome'], ((r, 0), (r * 0.95, r * 0.5), (r * 0.6, r * 0.95), (0.004, r * 1.15)), T + 0.175, BX + dx, BY + dy, segs=14, outline=0.008)
    lathe(f'lantern{k}', M['gold'], ((0.012, 0), (0.004, 0.04)), T + 0.17 + r * 1.15, BX + dx, BY + dy, segs=8, outline=0.002)

# ---------- the Campanile ----------
CX, CY = -0.3, 0.4
box('campanile', M['brick'], CX, CY, T - 0.005, 0.13, 0.13, 0.5, outline=0.012, bevel=0)
box('belfry', M['white'], CX, CY, T + 0.495, 0.12, 0.12, 0.08, outline=0.008, bevel=0)
for j in range(2):
    box(f'belfryarch{j}', M['window'], CX - 0.025 + j * 0.05, CY - 0.062, T + 0.51, 0.03, 0.006, 0.05, outline=0, bevel=0)
box('attic', M['brick'], CX, CY, T + 0.575, 0.11, 0.11, 0.05, outline=0.006, bevel=0)
pyramid('spire', M['copper'], CX, CY, T + 0.625, 0.11, 0.18, outline=0.008)
lathe('angel', M['gold'], ((0.012, 0), (0.004, 0.04)), T + 0.8, CX, CY, segs=8, outline=0.002)

# ---------- the Piazzetta's columns, gondolas and posts ----------
for k, x in enumerate((-0.05, 0.12)):
    rod(f'column{k}', M['white'], (x, -0.15, T), (x, -0.15, T + 0.3), 0.018, segs=10, outline=0.004)
    ball(f'columntop{k}', M['gold'], x, -0.15, T + 0.32, 0.022, outline=0.003)
for k, (x, y, a) in enumerate(((-0.5, -0.45, 0.2), (0.0, -0.55, -0.15), (0.45, -0.5, 0.1), (-0.85, -0.3, 0.4))):
    c, s = math.cos(a), math.sin(a)
    pts = [(x + (u * c), y + (u * s), G + 0.012 + 0.25 * u * u) for u in (-0.16, -0.1, 0.0, 0.1, 0.16)]
    for j in range(4):
        rod(f'gondola{k}{j}', M['gondola'], pts[j], pts[j + 1], 0.022, segs=8, outline=0.004)
for k in range(6):
    x = -0.75 + k * 0.3
    rod(f'post{k}', M['post'], (x, -0.3, G - 0.01), (x, -0.3, G + 0.14), 0.01, segs=6, outline=0.003)
    for j in range(2):
        rod(f'poststripe{k}{j}', M['stripe'], (x, -0.3, G + 0.04 + j * 0.05), (x, -0.3, G + 0.06 + j * 0.05), 0.011, segs=6, outline=0)

turn(before, -20)
render(G)
