# A cartoon Voroneț Monastery for the country maps, built in the set's shared look (../toon.py): the
# little Moldavian church painted all over its outside walls in Voroneț blue with rows of saints,
# its great overhanging shingle roof and the tower over the nave, the white stone wall round the
# churchyard, and the beech trees of Bukovina. Turned a little towards the camera.
# Run: blender -b --factory-startup -P voronet.py -- voronet-1024.png 1024 voronet.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'blue': toon('voronetBlue', '#2f6ac0', shadow_mul=(0.76, 0.8, 0.92), lift=0.2),
    'fresco': toon('fresco', '#e8c890', lift=0.2),
    'frescoRed': toon('frescoRed', '#c84a3a'),
    'shingle': toon('shingle', '#5a4a40', shadow_mul=(0.84, 0.82, 0.84)),
    'white': toon('white', '#f4efe4', lift=0.2),
    'window': flat('window', '#2e2a28'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1993)

def grow(objs, f, px, py, rot=0.0):
    """Scales (and turns) a group of finished objects about a point on the ground."""
    m = Matrix.Translation((px, py, G)) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Scale(f, 4) @ Matrix.Translation((-px, -py, -G))
    for o in objs:
        o.matrix_world = m @ o.matrix_world


# ---------- the painted church: built end-on, then turned so its long painted side faces us ----------
mark = set(bpy.data.objects)
CX, CY = 0.0, 0.15
box('church', M['blue'], CX, CY, G - 0.005, 0.28, 0.6, 0.22, outline=0.014, bevel=0)
lathe('apse', M['blue'], ((0.14, 0), (0.14, 0.22)), G - 0.005, CX, CY + 0.3, segs=12, outline=0.012)
for row in range(3):
    for j in range(7):
        y = CY - 0.25 + j * 0.08
        z = G + 0.03 + row * 0.065
        box(f'saintL{row}{j}', M['fresco' if (row + j) % 3 else 'frescoRed'], CX - 0.142, y, z, 0.006, 0.05, 0.05, outline=0, bevel=0)
        box(f'saintR{row}{j}', M['fresco' if (row + j) % 2 else 'frescoRed'], CX + 0.142, y, z, 0.006, 0.05, 0.05, outline=0, bevel=0)
for j in range(3):
    box(f'saintF{j}', M['fresco'], CX - 0.08 + j * 0.08, CY - 0.302, G + 0.1, 0.05, 0.006, 0.08, outline=0, bevel=0)
box('door', M['window'], CX, CY - 0.302, G, 0.06, 0.006, 0.09, outline=0, bevel=0)
# the great overhanging roof
loft('roof', M['shingle'], [[(CX - 0.24, CY - 0.38, G + 0.2), (CX + 0.24, CY - 0.38, G + 0.2), (CX + 0.24, CY + 0.48, G + 0.2), (CX - 0.24, CY + 0.48, G + 0.2)],
                            [(CX - 0.004, CY - 0.3, G + 0.38), (CX + 0.004, CY - 0.3, G + 0.38), (CX + 0.004, CY + 0.4, G + 0.38), (CX - 0.004, CY + 0.4, G + 0.38)]],
     outline=0.012)
lathe('tower', M['blue'], ((0.07, 0), (0.07, 0.12)), G + 0.32, CX, CY + 0.12, segs=8, outline=0.008, smooth=False)
for j in range(4):
    a = j * math.pi / 2
    box(f'towerwin{j}', M['window'], CX + 0.07 * math.cos(a), CY + 0.12 + 0.07 * math.sin(a), G + 0.37, 0.02, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('towerroof', M['shingle'], ((0.1, 0), (0.05, 0.05), (0.004, 0.12)), G + 0.44, CX, CY + 0.12, segs=8, outline=0.007, smooth=False)
rod('cross', M['white'], (CX, CY + 0.12, G + 0.56), (CX, CY + 0.12, G + 0.62), 0.005, segs=5, outline=0)
grow(set(bpy.data.objects) - mark, 1.5, CX, CY, math.pi / 2)

# ---------- the churchyard wall, beeches ----------
for k in range(20):
    a = 2 * math.pi * k / 20
    x0, y0 = 1.0 * math.cos(a), CY + 0.62 * math.sin(a)
    x1, y1 = 1.0 * math.cos(a + math.pi / 10), CY + 0.62 * math.sin(a + math.pi / 10)
    if 4.4 < a < 5.0:
        continue
    box(f'wall{k}', M['white'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.04, 0.06, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.004, bevel=0)
for k, (x, y) in enumerate(((-1.15, -0.35), (1.15, -0.35), (-0.75, 0.95), (0.75, 0.95), (0.0, 1.1), (-1.2, 0.3), (1.2, 0.3))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.014, segs=6, outline=0.003)
    ball(f'beech{k}', M['tree'], x, y, G + 0.17, rng.uniform(0.09, 0.11), outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
