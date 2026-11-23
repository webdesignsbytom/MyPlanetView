# A cartoon Santa Maria delle Grazie for the country maps, built in the set's shared look
# (../toon.py): Milan's church, its red-brick nave and Bramante's great tribune with the sixteen-sided
# drum ringed by a little gallery, and beside it the refectory, its wall opened so you see
# Leonardo's Last Supper inside: the long table, the thirteen figures and the three windows behind
# them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P last-supper.py -- last-supper-1024.png 1024 last-supper.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'brick': toon('brick', '#c0603e', shadow_mul=(0.86, 0.76, 0.72)),
    'white': toon('white', '#f2ece0', lift=0.15),
    'roof': toon('roof', '#a8503a'),
    'window': flat('window', '#3a3a44'),
    'fresco': toon('fresco', '#c8a878', lift=0.15),
    'sky': toon('frescoSky', '#a8c0c8', lift=0.2),
    'table': toon('table', '#f8f6f0', lift=0.2),
    'p0': toon('p0', '#c84030'), 'p1': toon('p1', '#3a6aa8'), 'p2': toon('p2', '#4f8a50'), 'p3': toon('p3', '#d8a040'), 'p4': toon('p4', '#8a5aa0'),
    'skin': toon('skin', '#e8b890'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the church ----------
CX, CY = -0.3, 0.3
box('nave', M['brick'], CX - 0.15, CY, G - 0.005, 0.5, 0.3, 0.24, outline=0.01, bevel=0)
for j in range(4):
    cyl(f'oculus{j}', M['white'], 0.025, 0.006, segs=12, outline=0.002, matrix=Matrix.Translation((CX - 0.35 + j * 0.12, CY - 0.152, G + 0.17)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('naveroof', M['roof'], [[(CX - 0.4, CY - 0.155, G + 0.235), (CX + 0.1, CY - 0.155, G + 0.235), (CX + 0.1, CY + 0.155, G + 0.235), (CX - 0.4, CY + 0.155, G + 0.235)],
                             [(CX - 0.4, CY - 0.004, G + 0.31), (CX + 0.1, CY - 0.004, G + 0.31), (CX + 0.1, CY + 0.004, G + 0.31), (CX - 0.4, CY + 0.004, G + 0.31)]], outline=0.006)
box('westfront', M['brick'], CX - 0.42, CY, G - 0.005, 0.04, 0.32, 0.3, outline=0.006, bevel=0)
# Bramante's tribune
TX, TY = CX + 0.22, CY
box('tribune', M['brick'], TX, TY, G - 0.005, 0.36, 0.36, 0.3, outline=0.011, bevel=0)
for j in range(3):
    cyl(f'tribunecircle{j}', M['white'], 0.03, 0.006, segs=14, outline=0.002, matrix=Matrix.Translation((TX - 0.1 + j * 0.1, TY - 0.182, G + 0.22)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'tribunewin{j}', M['window'], TX - 0.1 + j * 0.1, TY - 0.182, G + 0.06, 0.04, 0.006, 0.09, outline=0, bevel=0)
lathe('drum', M['brick'], ((0.17, 0), (0.17, 0.12)), G + 0.295, TX, TY, segs=16, outline=0.007, smooth=False)
for j in range(16):
    a = 2 * math.pi * j / 16
    rod(f'gallerycol{j}', M['white'], (TX + 0.172 * math.cos(a), TY + 0.172 * math.sin(a), G + 0.36), (TX + 0.172 * math.cos(a), TY + 0.172 * math.sin(a), G + 0.41), 0.006, segs=4, outline=0)
lathe('tribuneroof', M['roof'], ((0.19, 0), (0.06, 0.12)), G + 0.41, TX, TY, segs=16, outline=0.007, smooth=False)
lathe('lantern', M['white'], ((0.05, 0), (0.05, 0.06), (0.004, 0.1)), G + 0.525, TX, TY, segs=12, outline=0.004)

# ---------- the refectory, opened to show the Last Supper ----------
RX, RY = 0.45, -0.15
box('refectoryback', M['brick'], RX, RY + 0.12, G - 0.005, 0.56, 0.04, 0.26, outline=0.008, bevel=0)
for s in (-1, 1):
    box(f'refectoryside{s}', M['brick'], RX + s * 0.28, RY, G - 0.005, 0.04, 0.28, 0.26, outline=0.007, bevel=0)
loft('refectoryroof', M['roof'], [[(RX - 0.31, RY - 0.03, G + 0.255), (RX + 0.31, RY - 0.03, G + 0.255), (RX + 0.31, RY + 0.15, G + 0.255), (RX - 0.31, RY + 0.15, G + 0.255)],
                                  [(RX - 0.31, RY + 0.12, G + 0.32), (RX + 0.31, RY + 0.12, G + 0.32), (RX + 0.31, RY + 0.15, G + 0.32), (RX - 0.31, RY + 0.15, G + 0.32)]], outline=0.006)
FY = RY + 0.098
box('fresco', M['fresco'], RX, FY, G + 0.03, 0.46, 0.006, 0.2, outline=0.003, bevel=0)
for j, x in enumerate((-0.09, 0.0, 0.09)):
    box(f'frescowin{j}', M['sky'], RX + x, FY - 0.004, G + 0.13, 0.05 if j != 1 else 0.07, 0.004, 0.07, outline=0, bevel=0)
box('frescotable', M['table'], RX, FY - 0.01, G + 0.05, 0.4, 0.02, 0.025, outline=0.002, bevel=0)
for j in range(13):
    x = RX - 0.18 + j * 0.03
    z = G + 0.08 + 0.008 * math.sin(j * 1.7)
    box(f'apostle{j}', M[f'p{j % 5}' if j != 6 else 'p1'], x, FY - 0.006, z, 0.022, 0.004, 0.04, outline=0, bevel=0)
    ball(f'apostlehead{j}', M['skin'], x, FY - 0.008, z + 0.05, 0.009, outline=0)

for k, (x, y) in enumerate(((-0.9, -0.3), (0.95, 0.35), (-0.55, -0.6), (0.05, -0.65))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.009)

turn(before, -20)
render(G)
