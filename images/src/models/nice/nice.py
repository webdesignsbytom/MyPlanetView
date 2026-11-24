# A cartoon Nice for the country maps, built in the set's shared look (../toon.py): the Hôtel
# Negresco on the Promenade des Anglais, its white Belle Époque front with the rows of balconies and
# its famous pink dome with its green-tipped lantern, the neighbouring hotels in pastel colours, the
# promenade with its palm trees and the blue chairs, the pebble beach and the Baie des Anges. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P nice.py -- nice-1024.png 1024 nice.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d8c8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'sea': toon('sea', '#2a9ad0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'pebbles': toon('pebbles', '#c8c0b0'),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'pink': toon('pink', '#e8a0a8', shadow_mul=(0.86, 0.78, 0.8), lift=0.15),
    'green': toon('green', '#4a9a7a', lift=0.12),
    'yellow': toon('yellow', '#f0d890', lift=0.12),
    'ochre': toon('ochre', '#e8b880', lift=0.12),
    'window': flat('window', '#3a3a46'),
    'blue': toon('blue', '#2a6ab0', lift=0.12),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#8a6a4a'),
    'red': toon('red', '#d84a3a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('bay', M['sea'], [strip(-1.41, -0.72, 1.42, -0.004), strip(-1.41, -0.72, 1.42, 0.004)], outline=0)
loft('beach', M['pebbles'], [strip(-0.72, -0.45, 1.42, -0.004), strip(-0.72, -0.45, 1.42, 0.006)], outline=0.001)
for k in range(5):
    x = -0.8 + k * 0.4
    box(f'parasol{k}', M['blue'] if k % 2 else M['red'], x, -0.6, G + 0.08, 0.1, 0.1, 0.012, outline=0.002, bevel=0)
    rod(f'parasolpole{k}', M['white'], (x, -0.6, G), (x, -0.6, G + 0.08), 0.004, segs=4, outline=0)

# ---------- the Negresco ----------
NX, NY = 0.0, 0.35
NW, ND, NH = 0.6, 0.36, 0.38
box('negresco', M['white'], NX, NY, G - 0.005, NW, ND, NH, outline=0.009, bevel=0)
for row in range(5):
    for j in range(8):
        x = NX - NW / 2 + 0.05 + j * (NW - 0.1) / 7
        box(f'negwin{row}{j}', M['window'], x, NY - ND / 2 - 0.003, G + 0.05 + row * 0.065, 0.03, 0.006, 0.04, outline=0, bevel=0)
        box(f'negbalcony{row}{j}', M['white'], x, NY - ND / 2 - 0.015, G + 0.045 + row * 0.065, 0.04, 0.025, 0.006, outline=0.001, bevel=0)
box('canopy', M['green'], NX, NY - ND / 2 - 0.03, G + 0.04, 0.2, 0.06, 0.01, outline=0.002, bevel=0)
box('negroof', M['white'], NX, NY, G + NH - 0.01, NW + 0.02, ND + 0.02, 0.03, outline=0.003, bevel=0)
# the famous pink dome on the corner rotunda
DX, DY = NX - NW / 2 + 0.06, NY - ND / 2 + 0.06
lathe('rotunda', M['white'], ((0.1, 0), (0.1, NH + 0.06)), G - 0.005, DX, DY, segs=20, outline=0.006)
lathe('dome', M['pink'], ((0.11, 0), (0.105, 0.06), (0.08, 0.12), (0.04, 0.16), (0.015, 0.17)), G + NH + 0.05, DX, DY, segs=24, outline=0.006)
for k in range(8):
    a = 2 * math.pi * k / 8
    pts = [(DX + r * math.cos(a), DY + r * math.sin(a), G + NH + 0.05 + z + 0.004) for r, z in ((0.11, 0), (0.105, 0.06), (0.08, 0.12), (0.04, 0.16))]
    for j, (p, q) in enumerate(zip(pts, pts[1:])):
        bar(f'domerib{k}{j}', M['white'], p, q, 0.008, outline=0)
lathe('lantern', M['green'], ((0.02, 0), (0.02, 0.04), (0.003, 0.08)), G + NH + 0.215, DX, DY, segs=10, outline=0.002)

# ---------- the pastel neighbours along the front ----------
for k, (x, mat, h) in enumerate(((-0.65, 'ochre', 0.3), (0.62, 'yellow', 0.32), (0.95, 'pink', 0.26), (-0.98, 'yellow', 0.24))):
    if abs(x) > 0.9:
        y, w = 0.15, 0.2
    else:
        y, w = 0.32, 0.3
    box(f'neighbour{k}', M[mat], x, y, G - 0.005, w, 0.3, h, outline=0.006, bevel=0)
    for row in range(3):
        for j in range(int(w / 0.07)):
            box(f'nwin{k}{row}{j}', M['window'], x - w / 2 + 0.04 + j * 0.07, y - 0.153, G + 0.05 + row * 0.08, 0.03, 0.006, 0.045, outline=0, bevel=0)

# ---------- the promenade: palms and the blue chairs ----------
for k in range(6):
    x = -1.0 + k * 0.4
    if math.hypot(x, -0.25) > 1.2:
        continue
    rod(f'palmtrunk{k}', M['trunk'], (x, -0.25, G), (x + 0.02, -0.25, G + 0.32), 0.014, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, -0.25, G + 0.32), (x + 0.02 + 0.1 * math.cos(a), -0.25 + 0.1 * math.sin(a), G + 0.27), 0.022, outline=0.002)
for k in range(7):
    x = -0.75 + k * 0.25
    box(f'chairseat{k}', M['blue'], x, -0.38, G + 0.03, 0.06, 0.05, 0.01, outline=0.001, bevel=0)
    box(f'chairback{k}', M['blue'], x, -0.355, G + 0.03, 0.06, 0.008, 0.06, outline=0.001, bevel=0)
    for fx in (-0.025, 0.025):
        rod(f'chairleg{k}{fx}', M['white'], (x + fx, -0.38, G), (x + fx, -0.38, G + 0.03), 0.003, segs=4, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
