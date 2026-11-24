# A cartoon Cromford Mills for the country maps, built in the set's shared look (../toon.py): Sir
# Richard Arkwright's first water-powered cotton spinning mill in the Derwent Valley,
# Derbyshire, England, the birthplace of the factory system: the tall gritstone mill buildings
# with their rows of small windows round the yard, the mill pond, the aqueduct and the water
# wheel, the village's terrace of weavers' cottages, and the wooded valley. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P cromford.py -- cromford-1024.png 1024 cromford.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#c8b48e', shadow_mul=(0.8, 0.78, 0.82), lift=0.15),
    'stoneDark': toon('stoneDark', '#a8946e'),
    'roof': toon('roof', '#5a5a62'),
    'water': toon('water', '#4a8ac0', lift=0.3),
    'wood': toon('wood', '#6a4a30'),
    'yard': toon('yard', '#c8bca4', lift=0.15),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


box('yard', M['yard'], 0.0, 0.05, G - 0.004, 0.8, 0.5, 0.008, outline=0.001, bevel=0)
lathe('pond', M['water'], ((0.22, 0), (0.22, 0.01)), G - 0.004, -0.6, 0.45, segs=24, outline=0.002)


def mill(name, x, y, w, d, floors, ridge_x=True):
    H = 0.07 * floors
    box(name, M['stone'], x, y, G - 0.005, w, d, H, outline=0.006, bevel=0)
    gable(name + 'roof', M['roof'], x, y, G + H - 0.005, w, d, 0.07, ridge_x=ridge_x, over=0.012)
    if ridge_x:
        for f in range(floors):
            for j in range(int(w / 0.05)):
                box(f'{name}win{f}{j}', M['dark'], x - w / 2 + 0.03 + j * 0.05, y - d / 2 - 0.003, G + 0.02 + f * 0.07, 0.022, 0.006, 0.035, outline=0, bevel=0)
    else:
        for f in range(floors):
            for j in range(int(d / 0.05)):
                box(f'{name}win{f}{j}', M['dark'], x + w / 2 + 0.003, y - d / 2 + 0.03 + j * 0.05, G + 0.02 + f * 0.07, 0.006, 0.022, 0.035, outline=0, bevel=0)


# ---------- the mills round the yard ----------
mill('firstmill', 0.0, 0.42, 0.6, 0.16, 5)
mill('secondmill', 0.45, 0.1, 0.16, 0.5, 4, ridge_x=False)
mill('warehouse', -0.38, -0.05, 0.16, 0.34, 3, ridge_x=False)
box('gatehouse', M['stoneDark'], 0.05, -0.28, G - 0.005, 0.3, 0.1, 0.12, outline=0.004, bevel=0)
gable('gatehouseroof', M['roof'], 0.05, -0.28, G + 0.115, 0.3, 0.1, 0.05, ridge_x=True, over=0.01)
arch('gatearch', M['dark'], 0.05, -0.333, G - 0.005, 0.06, 0.09)

# ---------- the aqueduct and the water wheel ----------
for j in range(4):
    x = -0.48 + j * 0.12
    box(f'aqueductpier{j}', M['stoneDark'], x, 0.62, G - 0.005, 0.04, 0.05, 0.14, outline=0.002, bevel=0)
box('aqueduct', M['stoneDark'], -0.3, 0.62, G + 0.13, 0.42, 0.06, 0.04, outline=0.003, bevel=0)
box('aqueductwater', M['water'], -0.3, 0.62, G + 0.168, 0.4, 0.04, 0.006, outline=0, bevel=0)
cyl('wheel', M['wood'], 0.1, 0.04, segs=16, outline=0.003, matrix=Matrix.Translation((-0.32, 0.42, G + 0.1)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
for k in range(8):
    a = 2 * math.pi * k / 8
    bar(f'paddle{k}', M['wood'], (-0.32, 0.42 + 0.06 * math.cos(a), G + 0.1 + 0.06 * math.sin(a)), (-0.32, 0.42 + 0.11 * math.cos(a), G + 0.1 + 0.11 * math.sin(a)), 0.02, outline=0)

# ---------- the cottages ----------
box('cottages', M['stone'], 0.1, -0.7, G - 0.005, 0.8, 0.13, 0.14, outline=0.005, bevel=0)
gable('cottagesroof', M['roof'], 0.1, -0.7, G + 0.135, 0.8, 0.13, 0.06, ridge_x=True, over=0.01)
for j in range(8):
    x = -0.25 + j * 0.1
    box(f'cotdoor{j}', M['dark'], x, -0.768, G - 0.005, 0.025, 0.006, 0.06, outline=0, bevel=0)
    box(f'cotwin{j}', M['dark'], x + 0.035, -0.768, G + 0.08, 0.035, 0.006, 0.03, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.9, -0.2), (-0.8, -0.6), (0.9, -0.35), (0.85, 0.4), (0.4, 0.85), (-0.15, 0.85))):
    tree(f'tree{k}', x, y, r=0.1, h=0.13)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
