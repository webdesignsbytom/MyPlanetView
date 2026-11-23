# A cartoon Matobo Hills for the country maps, built in the set's shared look (../toon.py): the
# granite whalebacks and their famous balancing rocks, boulders piled one on another as if placed
# by hand, a rock shelter whose wall carries red San paintings of people and animals, and msasa
# trees in the grass. Turned a little towards the camera.
# Run: blender -b --factory-startup -P matobo-hills.py -- matobo-hills-1024.png 1024 matobo-hills.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#a8b860', shadow_mul=(0.74, 0.8, 0.74), lift=0.2),
    'granite': toon('granite', '#c8b8a8', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'graniteDark': toon('graniteDark', '#a89888', shadow_mul=(0.84, 0.84, 0.9)),
    'ochre': flat('ochre', '#b4402a'),
    'tree': toon('tree', '#6a8a3a', shadow_mul=(0.72, 0.8, 0.74)),
    'treeRed': toon('treeRed', '#b86a3a'),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2113)


def rock(name, x, y, z, r, sx=1.0, sy=1.0, sz=0.8, mat='granite'):
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.012)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the whalebacks ----------
lathe('whaleback0', M['graniteDark'], ((0.55, 0), (0.42, 0.14), (0.22, 0.22), (0.004, 0.24)), G - 0.01, -0.45, 0.5, segs=22, outline=0.012)
lathe('whaleback1', M['graniteDark'], ((0.45, 0), (0.32, 0.12), (0.15, 0.18), (0.004, 0.19)), G - 0.01, 0.6, 0.65, segs=22, outline=0.012)

# ---------- the balancing rocks ----------
BX, BY = 0.15, 0.0
rock('base0', BX, BY, G + 0.08, 0.2, 1.3, 1.0, 0.55)
rock('stack1', BX + 0.02, BY, G + 0.27, 0.15, 1.1, 0.9, 0.8)
rock('stack2', BX - 0.01, BY, G + 0.46, 0.12, 1.0, 0.9, 0.85)
rock('stack3', BX + 0.02, BY, G + 0.6, 0.075, 1.0, 1.0, 0.85)
rock('pairA', BX + 0.45, BY + 0.2, G + 0.1, 0.16, 1.2, 1.0, 0.65)
rock('pairB', BX + 0.43, BY + 0.2, G + 0.28, 0.13, 1.3, 0.9, 0.7)
rock('topW', -0.45, 0.5, G + 0.33, 0.14, 1.1, 1.0, 0.8)
rock('topW2', -0.43, 0.5, G + 0.5, 0.1, 1.0, 1.0, 0.85)
rock('topE', 0.6, 0.65, G + 0.26, 0.11, 1.2, 1.0, 0.8)

# ---------- the painted rock shelter ----------
SX, SY = -0.55, -0.15
rock('shelter', SX, SY, G + 0.12, 0.3, 1.2, 0.8, 0.6)
loft('shelterwall', M['granite'], [[(SX - 0.25, SY - 0.2, G + 0.02), (SX + 0.25, SY - 0.2, G + 0.02), (SX + 0.25, SY - 0.15, G + 0.02), (SX - 0.25, SY - 0.15, G + 0.02)],
                                   [(SX - 0.23, SY - 0.2, G + 0.2), (SX + 0.23, SY - 0.2, G + 0.2), (SX + 0.23, SY - 0.15, G + 0.2), (SX - 0.23, SY - 0.15, G + 0.2)]], outline=0.006)
for k in range(5):
    x = SX - 0.17 + k * 0.08
    box(f'figure{k}', M['ochre'], x, SY - 0.204, G + 0.07, 0.012, 0.004, 0.06, outline=0, bevel=0)
    ball(f'figurehead{k}', M['ochre'], x, SY - 0.205, G + 0.14, 0.012, outline=0)
    bar(f'figurespear{k}', M['ochre'], (x + 0.015, SY - 0.205, G + 0.06), (x + 0.03, SY - 0.205, G + 0.15), 0.004, outline=0)
b = ball('kudu', M['ochre'], 0, 0, 0, 0.03, outline=0)
b.scale = (1.8, 0.15, 0.8)
b.location = (SX + 0.05, SY - 0.205, G + 0.17)

# ---------- msasa trees ----------
for k, (x, y) in enumerate(((-1.0, 0.2), (1.0, 0.1), (0.85, -0.45), (-0.2, -0.7), (0.45, -0.8), (-0.95, -0.45))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.014, segs=6, outline=0.003)
    b = ball(f'tree{k}', M['treeRed' if k % 3 == 0 else 'tree'], 0, 0, 0, 0.12, outline=0.012)
    b.scale = (1.0, 1.0, 0.65)
    b.location = (x, y, G + 0.19)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
