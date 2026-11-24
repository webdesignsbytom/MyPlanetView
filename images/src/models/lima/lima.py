# A cartoon Historic Centre of Lima for the country maps, built in the set's shared look
# (../toon.py): the Plaza Mayor, the cathedral's ochre baroque front between its two towers, the
# Archbishop's Palace beside it with its great carved wooden balconies, the yellow colonial
# buildings round the square, and the bronze fountain among the gardens and palms in the middle.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P lima.py -- lima-1024.png 1024 lima.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'ochre': toon('ochre', '#e0b070', shadow_mul=(0.88, 0.84, 0.76), lift=0.1),
    'yellow': toon('yellow', '#f0d080', lift=0.12),
    'wood': toon('wood', '#5a3a24'),
    'grey': toon('grey', '#8a8e96'),
    'bronze': toon('bronze', '#4a5a50'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'window': flat('window', '#3a3a42'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the cathedral ----------
CX, CY = -0.28, 0.45
box('cathedral', M['ochre'], CX, CY + 0.1, G - 0.005, 0.4, 0.4, 0.22, outline=0.007, bevel=0)
box('front', M['ochre'], CX, CY - 0.12, G - 0.005, 0.22, 0.06, 0.3, outline=0.006, bevel=0)
box('portal', M['window'], CX, CY - 0.153, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
cyl('portaltop', M['window'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((CX, CY - 0.153, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j, x in enumerate((-0.07, -0.04, 0.04, 0.07)):
    rod(f'portalcol{j}', M['yellow'], (CX + x, CY - 0.16, G), (CX + x, CY - 0.16, G + 0.2), 0.008, segs=8, outline=0.001)
box('portalwindow', M['window'], CX, CY - 0.153, G + 0.2, 0.04, 0.006, 0.05, outline=0, bevel=0)
for s in (-1, 1):
    tx = CX + s * 0.16
    box(f'tower{s}', M['ochre'], tx, CY - 0.1, G - 0.005, 0.1, 0.1, 0.36, outline=0.005, bevel=0)
    box(f'belfry{s}', M['window'], tx, CY - 0.152, G + 0.27, 0.035, 0.006, 0.06, outline=0, bevel=0)
    lathe(f'spire{s}', M['grey'], ((0.05, 0), (0.04, 0.03), (0.02, 0.07), (0.004, 0.14)), G + 0.355, tx, CY - 0.1, segs=8, outline=0.003, smooth=False)
loft('cathedralroof', M['grey'], [[(CX - 0.2, CY - 0.1, G + 0.215), (CX + 0.2, CY - 0.1, G + 0.215), (CX + 0.2, CY + 0.3, G + 0.215), (CX - 0.2, CY + 0.3, G + 0.215)],
                                  [(CX - 0.17, CY + 0.07, G + 0.26), (CX + 0.17, CY + 0.07, G + 0.26), (CX + 0.17, CY + 0.13, G + 0.26), (CX - 0.17, CY + 0.13, G + 0.26)]], outline=0.004)

# ---------- the Archbishop's Palace ----------
PX, PY = 0.25, 0.4
box('palace', M['yellow'], PX, PY, G - 0.005, 0.42, 0.24, 0.26, outline=0.007, bevel=0)
for k, x in enumerate((-0.13, 0.13)):
    box(f'balcony{k}', M['wood'], PX + x, PY - 0.15, G + 0.12, 0.12, 0.07, 0.12, outline=0.004, bevel=0)
    for j in range(4):
        box(f'balconylattice{k}{j}', M['window'], PX + x - 0.045 + j * 0.03, PY - 0.186, G + 0.15, 0.012, 0.004, 0.07, outline=0, bevel=0)
    box(f'balconyroof{k}', M['wood'], PX + x, PY - 0.15, G + 0.235, 0.13, 0.08, 0.015, outline=0.002, bevel=0)
    for j in range(3):
        bar(f'balconybracket{k}{j}', M['wood'], (PX + x - 0.04 + j * 0.04, PY - 0.12, G + 0.09), (PX + x - 0.04 + j * 0.04, PY - 0.18, G + 0.12), 0.01, outline=0)
box('palaceportal', M['window'], PX, PY - 0.123, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
box('palacecornice', M['ochre'], PX, PY, G + 0.255, 0.44, 0.26, 0.02, outline=0.002, bevel=0)

# ---------- buildings round the square ----------
for s in (-1, 1):
    box(f'arcade{s}', M['yellow'], s * 0.72, -0.15, G - 0.005, 0.18, 0.6, 0.18, outline=0.006, bevel=0)
    for j in range(5):
        box(f'arcadearch{s}{j}', M['window'], s * 0.72 - s * 0.093, -0.4 + j * 0.12, G + 0.01, 0.006, 0.06, 0.07, outline=0, bevel=0)
        box(f'arcadebalcony{s}{j}', M['wood'], s * 0.72 - s * 0.1, -0.4 + j * 0.12, G + 0.1, 0.03, 0.07, 0.05, outline=0.002, bevel=0)

# ---------- the fountain and gardens ----------
FX, FY = 0.0, -0.25
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'garden{sx}{sy}', M['lawn'], FX + sx * 0.22, FY + sy * 0.15, G - 0.003, 0.3, 0.2, 0.01, outline=0.002, bevel=0)
lathe('basin', M['grey'], ((0.12, 0), (0.12, 0.035)), G - 0.005, FX, FY, segs=16, outline=0.003)
lathe('basinwater', M['water'], ((0.11, 0), (0.11, 0.038)), G - 0.005, FX, FY, segs=16, outline=0)
lathe('fountain', M['bronze'], ((0.03, 0), (0.02, 0.06), (0.06, 0.08), (0.02, 0.1), (0.015, 0.16), (0.035, 0.18), (0.004, 0.22)), G + 0.03, FX, FY, segs=12, outline=0.002)
for k, (x, y) in enumerate(((-0.4, -0.55), (0.4, -0.55), (-0.45, 0.0), (0.45, 0.0))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.28), 0.014, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, G + 0.28), (x + 0.02 + 0.1 * math.cos(a), y + 0.1 * math.sin(a), G + 0.22), 0.022, outline=0.002)

turn(before, -20)
render(G)
