# A cartoon Melaka for the country maps, built in the set's shared look (../toon.py): the red Dutch
# Square, Christ Church's plain gabled front painted deep red with its white cross, the long red
# Stadthuys and its clock tower, the little fountain, and trishaws decked in flowers.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P melaka.py -- melaka-1024.png 1024 melaka.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'square': toon('square', '#b8503a', shadow_mul=(0.86, 0.74, 0.72), lift=0.15),
    'red': toon('dutchRed', '#a83a2c', shadow_mul=(0.86, 0.74, 0.72)),
    'roof': toon('roof', '#7a3028'),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'window': flat('window', '#2e2a28'),
    'clock': toon('clock', '#f8f6f0', lift=0.2),
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'f0': toon('f0', '#e86a9a'), 'f1': toon('f1', '#f0c030'), 'f2': toon('f2', '#3fa8e0'),
    'tyre': toon('tyre', '#2e2a30'),
})

G = tile(M['square'])
before = set(bpy.data.objects)
rng = random.Random(1871)

# ---------- Christ Church ----------
CX, CY = -0.4, 0.3
box('church', M['red'], CX, CY, G - 0.005, 0.32, 0.5, 0.22, outline=0.012, bevel=0)
loft('churchroof', M['roof'], [[(CX - 0.17, CY - 0.25, G + 0.215), (CX + 0.17, CY - 0.25, G + 0.215), (CX + 0.17, CY + 0.25, G + 0.215), (CX - 0.17, CY + 0.25, G + 0.215)],
                               [(CX - 0.004, CY - 0.25, G + 0.33), (CX + 0.004, CY - 0.25, G + 0.33), (CX + 0.004, CY + 0.25, G + 0.33), (CX - 0.004, CY + 0.25, G + 0.33)]],
     outline=0.01)
loft('gable', M['red'], [[(CX - 0.17, CY - 0.27, G + 0.215), (CX + 0.17, CY - 0.27, G + 0.215), (CX + 0.17, CY - 0.24, G + 0.215), (CX - 0.17, CY - 0.24, G + 0.215)],
                         [(CX - 0.004, CY - 0.27, G + 0.36), (CX + 0.004, CY - 0.27, G + 0.36), (CX + 0.004, CY - 0.24, G + 0.36), (CX - 0.004, CY - 0.24, G + 0.36)]],
     outline=0.008)
box('porch', M['red'], CX, CY - 0.3, G - 0.005, 0.16, 0.08, 0.12, outline=0.008, bevel=0)
box('porchdoor', M['window'], CX, CY - 0.342, G, 0.06, 0.006, 0.09, outline=0, bevel=0)
bar('crossup', M['white'], (CX, CY - 0.255, G + 0.36), (CX, CY - 0.255, G + 0.44), 0.014, outline=0.002)
bar('crossbar', M['white'], (CX - 0.03, CY - 0.255, G + 0.41), (CX + 0.03, CY - 0.255, G + 0.41), 0.014, outline=0.002)
for j in range(3):
    box(f'churchwin{j}', M['window'], CX - 0.162, CY - 0.12 + j * 0.15, G + 0.08, 0.006, 0.04, 0.08, outline=0, bevel=0)

# ---------- the Stadthuys and its clock tower ----------
SX, SY = 0.4, 0.45
box('stadthuys', M['red'], SX, SY, G - 0.005, 0.6, 0.22, 0.18, outline=0.012, bevel=0)
loft('stadthuysroof', M['roof'], [[(SX - 0.31, SY - 0.12, G + 0.175), (SX + 0.31, SY - 0.12, G + 0.175), (SX + 0.31, SY + 0.12, G + 0.175), (SX - 0.31, SY + 0.12, G + 0.175)],
                                  [(SX - 0.31, SY - 0.005, G + 0.25), (SX + 0.31, SY - 0.005, G + 0.25), (SX + 0.31, SY + 0.005, G + 0.25), (SX - 0.31, SY + 0.005, G + 0.25)]],
     outline=0.01)
for row in range(2):
    for j in range(6):
        box(f'stadwin{row}{j}', M['window'], SX - 0.25 + j * 0.1, SY - 0.113, G + 0.04 + row * 0.07, 0.035, 0.006, 0.045, outline=0, bevel=0)
TX, TY = 0.0, -0.05
box('clocktower', M['red'], TX, TY, G - 0.005, 0.12, 0.12, 0.34, outline=0.012, bevel=0)
cyl('clockface', M['clock'], 0.035, 0.008, segs=16, outline=0.004, matrix=Matrix.Translation((TX, TY - 0.064, G + 0.27)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
pyramid('clocktowerroof', M['roof'], TX, TY, G + 0.335, 0.15, 0.1, outline=0.007)

# ---------- the fountain, trishaws, trees ----------
lathe('fountain', M['white'], ((0.1, 0), (0.1, 0.04), (0.03, 0.05), (0.025, 0.14), (0.05, 0.15), (0.004, 0.2)), G - 0.005, 0.35, -0.2, segs=14, outline=0.006)


def trishaw(name, x, y, col):
    box(f'{name}seat', M[col], x, y, G + 0.04, 0.08, 0.07, 0.06, outline=0.005, bevel=0)
    for k in range(5):
        a = 2 * math.pi * k / 5
        ball(f'{name}flower{k}', M[f'f{k % 3}'], x + 0.04 * math.cos(a), y + 0.035 * math.sin(a), G + 0.11, 0.018, outline=0.002)
    for u in (-0.04, 0.04):
        cyl(f'{name}wheel{u}', M['tyre'], 0.03, 0.012, segs=12, outline=0.002, matrix=Matrix.Translation((x + u, y - 0.04, G + 0.03)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    cyl(f'{name}frontwheel', M['tyre'], 0.03, 0.012, segs=12, outline=0.002, matrix=Matrix.Translation((x, y + 0.1, G + 0.03)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))


trishaw('trishaw0', -0.3, -0.45, 'f0')
trishaw('trishaw1', 0.05, -0.55, 'f2')
trishaw('trishaw2', 0.7, -0.4, 'f1')
for k, (x, y) in enumerate(((-0.95, -0.2), (0.95, -0.05), (-0.9, 0.55))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.012)
    rod(f'treetrunk{k}', M['roof'], (x, y, G), (x, y, G + 0.06), 0.014, segs=6, outline=0.003)

turn(before, -20)
render(G)
