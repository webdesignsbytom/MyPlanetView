# A cartoon Ferapontov Monastery for the country maps, built in the set's shared look (../toon.py):
# the white monastery by Lake Borodaevskoe in the north of Russia, whose cathedral holds
# Dionisy's frescoes: the Cathedral of the Nativity of the Virgin with its tall drum and dark
# onion dome, the little domed gate church, the tented bell tower, the white walls round
# them, and the lake and birches. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ferapontov.py -- ferapontov-1024.png 1024 ferapontov.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'white': toon('white', '#f4f2ec', shadow_mul=(0.8, 0.82, 0.9), lift=0.25),
    'dome': toon('dome', '#4a5a4a'),
    'roof': toon('roof', '#5a6a5a'),
    'gold': toon('gold2', '#e8b848', shadow_mul=(0.78, 0.66, 0.6), lift=0.35),
    'water': toon('water', '#4a8ac0', lift=0.3),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#5a9a44', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#e8e4dc'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)

def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('lake', M['water'], [strip(-1.31, -0.72, 1.32, G - 0.004), strip(-1.31, -0.72, 1.32, G + 0.008)], outline=0.002)


def onion(name, x, y, z, r, mat):
    lathe(name, mat, ((r * 0.8, 0), (r * 1.1, r * 0.5), (r, r * 1.0), (r * 0.5, r * 1.5), (r * 0.12, r * 1.9), (0.0, r * 2.1)), z, x, y, segs=16, outline=0.004)
    rod(name + 'cross', M['gold'], (x, y, z + r * 2.1), (x, y, z + r * 2.1 + 0.05), 0.005, segs=6, outline=0)


# ---------- the cathedral ----------
CX, CY = -0.1, 0.2
box('cathedral', M['white'], CX, CY, G - 0.005, 0.32, 0.32, 0.24, outline=0.006, bevel=0)
for s in (-1, 1):
    for j in range(3):
        lathe(f'zakomar{s}{j}', M['white'], [(0.05 * math.cos(a), 0.05 * math.sin(a)) for a in [k * math.pi / 8 for k in range(5)]], G + 0.235, CX - 0.1 + j * 0.1, CY + s * 0.15, segs=8, outline=0.002, smooth=False)
gable('cathroof', M['roof'], CX, CY, G + 0.235, 0.32, 0.32, 0.06)
lathe('drum', M['white'], ((0.07, 0), (0.07, 0.16)), G + 0.26, CX, CY, segs=16, outline=0.004)
for j in range(6):
    a = 2 * math.pi * j / 6
    box(f'drumslit{j}', M['dark'], CX + 0.071 * math.cos(a), CY + 0.071 * math.sin(a), G + 0.3, 0.012, 0.012, 0.06, outline=0, bevel=0)
onion('cathdome', CX, CY, G + 0.42, 0.07, M['dome'])
box('porch', M['white'], CX, CY - 0.2, G - 0.005, 0.18, 0.1, 0.12, outline=0.004, bevel=0)
gable('porchroof', M['roof'], CX, CY - 0.2, G + 0.115, 0.18, 0.1, 0.06, over=0.01)
arch('porchdoor', M['dark'], CX, CY - 0.253, G - 0.005, 0.05, 0.09)

# ---------- the bell tower and the gate church ----------
BX, BY = 0.3, 0.35
box('belltower', M['white'], BX, BY, G - 0.005, 0.12, 0.12, 0.3, outline=0.005, bevel=0)
arch('belfry', M['dark'], BX, BY - 0.063, G + 0.2, 0.05, 0.08)
lathe('tent', M['roof'], ((0.075, 0), (0.0, 0.2)), G + 0.295, BX, BY, segs=8, outline=0.004, smooth=False)
GX, GY = 0.25, -0.35
box('gatechurch', M['white'], GX, GY, G - 0.005, 0.24, 0.14, 0.18, outline=0.005, bevel=0)
arch('gatepassage1', M['dark'], GX - 0.05, GY - 0.073, G - 0.005, 0.06, 0.1)
arch('gatepassage2', M['dark'], GX + 0.06, GY - 0.073, G - 0.005, 0.04, 0.07)
for k, x in enumerate((GX - 0.06, GX + 0.06)):
    lathe(f'gatedrum{k}', M['white'], ((0.025, 0), (0.025, 0.05)), G + 0.175, x, GY, segs=10, outline=0.002)
    onion(f'gatedome{k}', x, GY, G + 0.225, 0.03, M['dome'])

# ---------- the walls ----------
for k, (x, y, sx, sy) in enumerate(((-0.45, -0.35, 0.6, 0.04), (0.55, -0.35, 0.36, 0.04), (-0.75, 0.15, 0.04, 1.0), (0.73, 0.15, 0.04, 1.0), (0.0, 0.65, 1.5, 0.04))):
    box(f'wall{k}', M['white'], x, y, G - 0.005, sx, sy, 0.08, outline=0.003, bevel=0)

for k, (x, y) in enumerate(((-0.95, -0.4), (-1.0, 0.2), (0.95, -0.4), (-0.5, 0.95), (0.4, 0.95), (1.0, 0.3))):
    tree(f'birch{k}', x, y, r=0.08, h=0.14)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
