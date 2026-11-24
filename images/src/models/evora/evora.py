# A cartoon Roman Temple of Évora for the country maps, built in the set's shared look
# (../toon.py): the Roman temple in the middle of the old town, its tall granite columns with white
# marble bases and Corinthian capitals still carrying pieces of their architrave on the high stone
# podium, the cathedral's crenellated towers behind, and the white houses with yellow trim round the
# square. Turned a little towards the camera.
# Run: blender -b --factory-startup -P evora.py -- evora-1024.png 1024 evora.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'garden': toon('garden', '#7cb85a'),
    'granite': toon('granite', '#9a968e', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'podium': toon('podium', '#a8a090', shadow_mul=(0.84, 0.84, 0.9)),
    'marble': toon('marble', '#f2ece0', lift=0.15),
    'white': toon('white', '#f6f4ee', lift=0.15),
    'yellow': toon('yellow', '#e8c050', lift=0.15),
    'cathedral': toon('cathedral', '#d8ccb0', lift=0.08),
    'slate': toon('slate', '#5a5e66'),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2a28'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the temple ----------
TX, TY, PW, PD, PH = 0.0, 0.0, 0.42, 0.56, 0.13
box('podium', M['podium'], TX, TY, G - 0.005, PW, PD, PH, outline=0.008, bevel=0)
box('podiumcap', M['granite'], TX, TY, G + PH - 0.01, PW + 0.02, PD + 0.02, 0.02, outline=0.002, bevel=0)
Z = G + PH + 0.01
cols = [(TX - 0.17 + j * 0.068, TY - 0.24) for j in range(6)] + [(TX - 0.17, TY - 0.24 + j * 0.08) for j in range(1, 5)] + [(TX + 0.17, TY - 0.24 + j * 0.08) for j in range(1, 3)]
for k, (x, y) in enumerate(cols):
    box(f'base{k}', M['marble'], x, y, Z - 0.005, 0.04, 0.04, 0.02, outline=0.001, bevel=0)
    rod(f'shaft{k}', M['granite'], (x, y, Z + 0.015), (x, y, Z + 0.3), 0.016, segs=10, outline=0.002)
    lathe(f'capital{k}', M['marble'], ((0.016, 0), (0.026, 0.035), (0.026, 0.04)), Z + 0.3, x, y, segs=10, outline=0.001)
for j in range(5):
    x0, x1 = cols[j][0], cols[j + 1][0]
    box(f'architrave{j}', M['granite'], (x0 + x1) / 2, TY - 0.24, Z + 0.34, x1 - x0 + 0.04, 0.04, 0.04, outline=0.002, bevel=0)
for j in range(3):
    y0, y1 = TY - 0.24 + j * 0.08, TY - 0.24 + (j + 1) * 0.08
    box(f'sidearch{j}', M['granite'], TX - 0.17, (y0 + y1) / 2, Z + 0.34, 0.04, y1 - y0 + 0.04, 0.04, outline=0.002, bevel=0)
box('garden', M['garden'], 0.0, -0.55, G - 0.003, 0.5, 0.25, 0.008, outline=0.002, bevel=0)

# ---------- the cathedral behind ----------
CX, CY = 0.1, 0.65
box('cathedral', M['cathedral'], CX, CY, G - 0.005, 0.4, 0.2, 0.2, outline=0.007, bevel=0)
for s in (-1, 1):
    tx = CX + s * 0.17
    box(f'ctower{s}', M['cathedral'], tx, CY - 0.06, G - 0.005, 0.1, 0.1, 0.32, outline=0.005, bevel=0)
    for j in range(3):
        box(f'cmerlon{s}{j}', M['cathedral'], tx - 0.03 + j * 0.03, CY - 0.11, G + 0.315, 0.018, 0.015, 0.03, outline=0.001, bevel=0)
    pyramid(f'ctowerroof{s}', M['slate'], tx, CY - 0.06, G + 0.315, 0.08, 0.1 if s < 0 else 0.07, outline=0.003)
box('cportal', M['dark'], CX, CY - 0.103, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)

# ---------- white houses with yellow trim ----------
for k, (x, y, w) in enumerate(((-0.62, -0.1, 0.22), (-0.62, 0.25, 0.22), (0.62, -0.15, 0.22), (0.62, 0.22, 0.22), (-0.45, 0.6, 0.2))):
    box(f'house{k}', M['white'], x, y, G - 0.005, w, 0.2, 0.15, outline=0.005, bevel=0)
    box(f'housetrim{k}', M['yellow'], x, y, G - 0.005, w + 0.005, 0.205, 0.03, outline=0, bevel=0)
    for j in range(2):
        box(f'housewin{k}{j}', M['dark'], x - w * 0.22 + j * w * 0.44, y - 0.103, G + 0.07, 0.03, 0.006, 0.05, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - w / 2, y - 0.1, G + 0.145), (x + w / 2, y - 0.1, G + 0.145), (x + w / 2, y + 0.1, G + 0.145), (x - w / 2, y + 0.1, G + 0.145)],
                                      [(x - w / 2, y - 0.004, G + 0.2), (x + w / 2, y - 0.004, G + 0.2), (x + w / 2, y + 0.004, G + 0.2), (x - w / 2, y + 0.004, G + 0.2)]], outline=0.003)
for k, (x, y) in enumerate(((-0.25, -0.6), (0.25, -0.6))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.09, 0.08, outline=0.006)

turn(before, -20)
render(G)
