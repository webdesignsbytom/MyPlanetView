# A cartoon Olympia for the country maps, built in the set's shared look (../toon.py): the sanctuary
# of Zeus where the Games began, the Temple of Hera's few standing Doric columns on their platform,
# the round Philippeion's colonnade, the vaulted tunnel into the stadium and its long earth track
# between grassy banks, and olive and pine trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P olympia.py -- olympia-1024.png 1024 olympia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'track': toon('track', '#d8b888', shadow_mul=(0.86, 0.8, 0.74)),
    'bank': toon('bank', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'stone': toon('stone', '#e0d4b8', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'stoneDark': toon('stoneDark', '#c0b090', shadow_mul=(0.84, 0.82, 0.86)),
    'door': flat('door', '#2e2a28'),
    'olive': toon('olive', '#7a9a58', shadow_mul=(0.74, 0.8, 0.74)),
    'pine': toon('pine', '#3f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the stadium ----------
box('track', M['track'], 0.35, 0.55, G - 0.004, 1.1, 0.26, 0.01, rot_z=0.1, outline=0.003, bevel=0)
for s in (-1, 1):
    loft(f'bank{s}', M['bank'], [[(0.35 - 0.55 * math.cos(0.1) - s * 0.13 * math.sin(0.1) * -1, 0.55 + s * 0.13, G - 0.01), (0.9, 0.6 + s * 0.13, G - 0.01), (0.9, 0.6 + s * 0.25, G - 0.01), (-0.2, 0.5 + s * 0.25, G - 0.01)],
                                 [(-0.2, 0.5 + s * 0.15, G + 0.005), (0.9, 0.6 + s * 0.15, G + 0.005), (0.9, 0.6 + s * 0.22, G + 0.07), (-0.2, 0.5 + s * 0.22, G + 0.07)]], outline=0.005)
box('startline', M['stone'], -0.15, 0.5, G + 0.002, 0.02, 0.26, 0.008, rot_z=0.1, outline=0, bevel=0)
# the vaulted entrance
TX, TY = -0.3, 0.45
box('tunnel', M['stoneDark'], TX, TY, G - 0.005, 0.16, 0.18, 0.14, rot_z=0.1, outline=0.007, bevel=0)
arch = [(TX + 0.07 * math.cos(math.pi * j / 8), TY - 0.092, G + 0.09 + 0.05 * math.sin(math.pi * j / 8)) for j in range(9)]
loft('tunnelarch', M['stoneDark'], [arch, [(x, TY + 0.09, z) for x, _, z in arch]], outline=0.006)
box('tunneldoor', M['door'], TX, TY - 0.093, G - 0.005, 0.09, 0.006, 0.12, outline=0, bevel=0)

# ---------- the Temple of Hera ----------
HX, HY = -0.35, -0.1
box('heraplatform', M['stoneDark'], HX, HY, G - 0.005, 0.62, 0.28, 0.06, outline=0.007, bevel=0)
STAND = ((0, 0, 0.32), (1, 0, 0.32), (2, 0, 0.18), (4, 0, 0.32), (5, 0, 0.1), (0, 1, 0.32), (3, 1, 0.24), (5, 1, 0.32))
for i, j, h in STAND:
    x, y = HX - 0.26 + i * 0.104, HY - 0.1 + j * 0.2
    rod(f'heracol{i}{j}', M['stone'], (x, y, G + 0.055), (x, y, G + 0.055 + h), 0.028, r2=0.024, segs=12, outline=0.005)
    if h > 0.3:
        box(f'heracap{i}{j}', M['stone'], x, y, G + 0.055 + h, 0.07, 0.07, 0.02, outline=0.003, bevel=0)
for k, (x, y, a) in enumerate(((HX + 0.05, HY - 0.25, 0.3), (HX + 0.25, HY - 0.28, -0.5))):
    rod(f'drum{k}', M['stone'], (x - 0.05 * math.cos(a), y - 0.05 * math.sin(a), G + 0.025), (x + 0.05 * math.cos(a), y + 0.05 * math.sin(a), G + 0.025), 0.026, segs=10, outline=0.004)

# ---------- the Philippeion ----------
PX, PY = 0.45, -0.25
lathe('philippeionbase', M['stoneDark'], ((0.17, 0), (0.17, 0.04)), G - 0.005, PX, PY, segs=24, outline=0.005)
for j in range(12):
    a = 2 * math.pi * j / 12
    if 3 <= j <= 6:
        continue
    rod(f'philcol{j}', M['stone'], (PX + 0.14 * math.cos(a), PY + 0.14 * math.sin(a), G + 0.035), (PX + 0.14 * math.cos(a), PY + 0.14 * math.sin(a), G + 0.23), 0.016, segs=8, outline=0.003)
lathe('philippeionring', M['stone'], ((0.16, 0), (0.16, 0.03)), G + 0.23, PX, PY, segs=24, outline=0.004)

# ---------- trees ----------
for k, (x, y, kind) in enumerate(((-0.95, 0.2, 'olive'), (-0.85, -0.45, 'pine'), (0.9, -0.55, 'olive'), (-0.2, -0.65, 'olive'), (1.0, 0.15, 'pine'), (-0.7, 0.75, 'pine'))):
    if kind == 'pine':
        rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.14), 0.014, segs=6, outline=0.003)
        b = ball(f'tree{k}', M['pine'], 0, 0, 0, 0.1, outline=0.008)
        b.scale = (1.3, 1.3, 0.55)
        b.location = (x, y, G + 0.18)
    else:
        rod(f'trunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.08), 0.013, segs=6, outline=0.003)
        b = ball(f'tree{k}', M['olive'], 0, 0, 0, 0.08, outline=0.008)
        b.scale = (1.2, 1.0, 0.7)
        b.location = (x + 0.02, y, G + 0.13)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
