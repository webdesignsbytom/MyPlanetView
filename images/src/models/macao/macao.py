# A cartoon Ruins of St. Paul's for the country maps, built in the set's shared look (../toon.py):
# Macao's lone granite façade of the old Jesuit church, standing in five tiers of columns, niches
# and statues to its triangular pediment and cross, the sky showing through its doors and windows,
# at the top of the great stairway in its three flights, with banyan trees and pastel colonial houses
# beside it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P macao.py -- macao-1024.png 1024 macao.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'granite': toon('granite', '#c8b8a0', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'graniteDark': toon('graniteDark', '#a89880'),
    'sky': flat('sky', '#a8c8e0'),
    'stairs': toon('stairs', '#b8b0a4', shadow_mul=(0.84, 0.84, 0.88)),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a48'),
    'yellow': toon('yellow', '#f0d080', lift=0.12),
    'pink': toon('pink', '#e8a8a0', lift=0.12),
    'roof': toon('roof', '#b8603e'),
    'window': flat('window', '#3a3430'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the stairway ----------
SW = 0.6
z = G - 0.005
for k in range(8):
    y = -0.72 + k * 0.045
    box(f'step1_{k}', M['stairs'], 0.0, y, G - 0.005, SW, 0.05, (k + 1) * 0.011, outline=0.002, bevel=0)
box('landing1', M['stairs'], 0.0, -0.31, G - 0.005, SW, 0.12, 0.09, outline=0.003, bevel=0)
for k in range(8):
    y = -0.235 + k * 0.045
    box(f'step2_{k}', M['stairs'], 0.0, y, G - 0.005, SW, 0.05, 0.09 + (k + 1) * 0.011, outline=0.002, bevel=0)
box('terrace', M['stairs'], 0.0, 0.3, G - 0.005, SW + 0.1, 0.34, 0.18, outline=0.006, bevel=0)
for s in (-1, 1):
    for j in range(2):
        y0, y1, z0, z1 = (-0.74, -0.37, 0.02, 0.1) if j == 0 else (-0.25, 0.12, 0.11, 0.2)
        bar(f'rail{s}{j}', M['granite'], (s * (SW / 2 + 0.02), y0, G + z0 + 0.02), (s * (SW / 2 + 0.02), y1, G + z1 + 0.02), 0.035, outline=0.002)
T = G + 0.175

# ---------- the façade ----------
FY = 0.3
tiers = ((0.6, 0.15), (0.6, 0.13), (0.6, 0.13), (0.38, 0.11))
z = T
for i, (w, h) in enumerate(tiers):
    box(f'tier{i}', M['granite'], 0.0, FY, z - 0.005, w, 0.05, h, outline=0.006, bevel=0)
    box(f'cornice{i}', M['graniteDark'], 0.0, FY, z + h - 0.012, w + 0.03, 0.07, 0.016, outline=0.002, bevel=0)
    ncol = 6 if w > 0.5 else 4
    for j in range(ncol):
        x = -w / 2 + 0.03 + j * (w - 0.06) / (ncol - 1)
        rod(f'col{i}{j}', M['graniteDark'], (x, FY - 0.03, z), (x, FY - 0.03, z + h - 0.012), 0.01, segs=8, outline=0.001)
    if i == 0:
        for x, ow in ((-0.18, 0.06), (0.0, 0.08), (0.18, 0.06)):
            box(f'door{x}', M['sky'], x, FY - 0.027, z - 0.005, ow, 0.006, h * 0.6, outline=0, bevel=0)
            cyl(f'doortop{x}', M['sky'], ow / 2, 0.006, segs=14, outline=0, matrix=Matrix.Translation((x, FY - 0.027, z + h * 0.6 - 0.005)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    elif i == 1:
        for x in (-0.18, 0.0, 0.18):
            box(f'window{x}', M['sky'], x, FY - 0.027, z + 0.03, 0.05, 0.006, 0.06, outline=0, bevel=0)
    elif i == 2:
        for x in (-0.18, 0.0, 0.18):
            box(f'niche{x}', M['graniteDark'], x, FY - 0.027, z + 0.015, 0.05, 0.006, 0.09, outline=0, bevel=0)
            lathe(f'statue{x}', M['granite'], ((0.013, 0), (0.011, 0.05), (0.004, 0.06)), z + 0.02, x, FY - 0.035, segs=8, outline=0.001)
            ball(f'statuehead{x}', M['granite'], x, FY - 0.035, z + 0.085, 0.01, outline=0.001)
    else:
        box('topniche', M['graniteDark'], 0.0, FY - 0.027, z + 0.015, 0.06, 0.006, 0.08, outline=0, bevel=0)
        lathe('dove', M['graniteDark'], ((0.015, 0), (0.004, 0.03)), z + 0.035, 0.0, FY - 0.035, segs=8, outline=0.001)
    z += h
loft('pediment', M['granite'], [[(-0.13, FY - 0.025, z - 0.005), (0.13, FY - 0.025, z - 0.005), (0.13, FY + 0.025, z - 0.005), (-0.13, FY + 0.025, z - 0.005)],
                                 [(-0.004, FY - 0.025, z + 0.1), (0.004, FY - 0.025, z + 0.1), (0.004, FY + 0.025, z + 0.1), (-0.004, FY + 0.025, z + 0.1)]], outline=0.004)
rod('cross', M['graniteDark'], (0.0, FY, z + 0.09), (0.0, FY, z + 0.17), 0.008, segs=6, outline=0.001)
bar('crossbar', M['graniteDark'], (-0.025, FY, z + 0.145), (0.025, FY, z + 0.145), 0.012, outline=0.001)

# ---------- trees and houses ----------
for k, (x, y, r) in enumerate(((-0.62, 0.4, 0.15), (0.62, 0.45, 0.15), (-0.75, -0.05, 0.12), (0.78, 0.0, 0.12))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + r * 1.8), 0.025, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + r * 2.1, r, outline=0.009)
for k, (x, y, mat) in enumerate(((-0.62, -0.55, 'yellow'), (0.62, -0.55, 'pink'), (-0.85, -0.4, 'pink'), (0.88, -0.35, 'yellow'))):
    box(f'house{k}', M[mat], x, y, G - 0.005, 0.2, 0.16, 0.14, outline=0.005, bevel=0)
    for j in range(2):
        box(f'housewin{k}{j}', M['window'], x - 0.05 + j * 0.1, y - 0.083, G + 0.05, 0.03, 0.006, 0.05, outline=0, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.13, 0.22, 0.06, outline=0.003)

turn(before, -20)
render(G)
