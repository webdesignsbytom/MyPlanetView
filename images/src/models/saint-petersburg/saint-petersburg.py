# A cartoon Saint Petersburg for the country maps, built in the set's shared look (../toon.py): the
# Church of the Savior on Spilled Blood, its red brick and white stone, the cluster of onion domes
# twisted in stripes of blue, green, yellow and gold, the tall tented spire in the middle, standing
# by the Griboyedov canal with its iron-railed bridge and a tour boat. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P saint-petersburg.py -- saint-petersburg-1024.png 1024 saint-petersburg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'canal': toon('canal', '#3a6a8a', lift=0.3),
    'granite': toon('granite', '#9a8a82', shadow_mul=(0.84, 0.84, 0.9)),
    'brick': toon('brick', '#b8503a', shadow_mul=(0.86, 0.76, 0.72)),
    'white': toon('white', '#f6f3ea', lift=0.2),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'blue': toon('domeBlue', '#2f6ac0'), 'green': toon('domeGreen', '#2f9a5a'), 'yellow': toon('domeYellow', '#f0c040', lift=0.25),
    'window': flat('window', '#2e3a54'),
    'iron': toon('iron', '#2e2a30'),
    'boat': toon('boat', '#f6f3ec', lift=0.2),
    'glass': toon('glass', '#8ab8d8', lift=0.3),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

box('canal', M['canal'], 0.0, -0.45, G - 0.004, 2.6, 0.36, 0.01, outline=0.004, bevel=0)
for s in (-1, 1):
    box(f'embankment{s}', M['granite'], 0.0, -0.45 + s * 0.19, G - 0.005, 2.6, 0.03, 0.04, outline=0.004, bevel=0)
BX = -0.55
box('bridge', M['granite'], BX, -0.45, G + 0.02, 0.2, 0.42, 0.03, outline=0.006, bevel=0)
for s in (-1, 1):
    bar(f'bridgerail{s}', M['iron'], (BX + s * 0.1, -0.66, G + 0.08), (BX + s * 0.1, -0.24, G + 0.08), 0.008, outline=0)
box('tourboat', M['glass'], 0.45, -0.48, G + 0.01, 0.4, 0.12, 0.06, outline=0.006, bevel=0)
box('tourboathull', M['boat'], 0.45, -0.48, G - 0.002, 0.42, 0.13, 0.025, outline=0.004, bevel=0)


def onion(name, x, y, z, r, cols):
    lathe(f'{name}drum', M['white'], ((r * 0.6, 0), (r * 0.6, r * 0.8)), z, x, y, segs=10, outline=0.004)
    prof = [(r * 0.65, 0), (r, r * 0.5), (r * 0.85, r * 1.0), (r * 0.35, r * 1.4), (0.004, r * 1.8)]
    for i in range(len(prof) - 1):
        (r0, h0), (r1, h1) = prof[i], prof[i + 1]
        lathe(f'{name}band{i}', M[cols[i % len(cols)]], ((r0, 0), (r1, h1 - h0)), z + r * 0.8 + h0, x, y, segs=14, outline=0.004 if i else 0.006)
    rod(f'{name}cross', M['gold'], (x, y, z + r * 2.6), (x, y, z + r * 3.0), 0.004, segs=4, outline=0)


def grow(objs, f, px, py):
    """Scales a group of finished objects about a point on the ground."""
    m = Matrix.Translation((px, py, G)) @ Matrix.Scale(f, 4) @ Matrix.Translation((-px, -py, -G))
    for o in objs:
        o.matrix_world = m @ o.matrix_world


# ---------- the church ----------
mark = set(bpy.data.objects)
CX, CY = 0.0, 0.3
box('church', M['brick'], CX, CY, G - 0.005, 0.46, 0.4, 0.24, outline=0.014, bevel=0)
for j in range(4):
    box(f'whiteband{j}', M['white'], CX, CY - 0.203, G + 0.03 + j * 0.055, 0.46, 0.006, 0.012, outline=0, bevel=0)
for j in range(3):
    box(f'churchwin{j}', M['window'], CX - 0.14 + j * 0.14, CY - 0.204, G + 0.1, 0.035, 0.006, 0.08, outline=0, bevel=0)
box('belfry', M['brick'], CX, CY - 0.24, G - 0.005, 0.14, 0.1, 0.36, outline=0.01, bevel=0)
onion('belfrydome', CX, CY - 0.24, G + 0.355, 0.055, ['gold'])
lathe('tentbase', M['white'], ((0.1, 0), (0.1, 0.12)), G + 0.235, CX, CY + 0.02, segs=8, outline=0.008, smooth=False)
lathe('tent', M['brick'], ((0.1, 0), (0.05, 0.2), (0.03, 0.26)), G + 0.355, CX, CY + 0.02, segs=8, outline=0.008, smooth=False)
onion('centraldome', CX, CY + 0.02, G + 0.61, 0.05, ['gold', 'yellow'])
for k, (dx, dy, cols) in enumerate(((-0.17, -0.12, ['blue', 'white']), (0.17, -0.12, ['green', 'yellow']), (-0.17, 0.15, ['yellow', 'green']), (0.17, 0.15, ['blue', 'yellow']))):
    lathe(f'drum{k}', M['white'], ((0.05, 0), (0.05, 0.08)), G + 0.235, CX + dx, CY + dy, segs=10, outline=0.005)
    onion(f'dome{k}', CX + dx, CY + dy, G + 0.31, 0.055, cols)
lathe('apse', M['brick'], ((0.1, 0), (0.1, 0.18)), G - 0.005, CX, CY + 0.22, segs=10, outline=0.008)
onion('apsedome', CX, CY + 0.22, G + 0.175, 0.045, ['gold'])
grow(set(bpy.data.objects) - mark, 1.5, CX, CY)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
