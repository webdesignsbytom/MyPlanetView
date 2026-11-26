# A cartoon Eisinga Planetarium for the country maps, built in the set's shared look (../toon.py):
# the oldest working planetarium in the world, which the wool-comber Eise Eisinga built into the
# ceiling of his living room in Franeker, Friesland, the Netherlands: his narrow brick canal
# house with its stepped gable and green shutters, the blue ceiling with the gilded orrery
# showing through the opened front, the neighbouring gabled houses, and the canal. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P eisinga.py -- eisinga-1024.png 1024 eisinga.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobble': toon('cobble', '#c8bca4', shadow_mul=(0.82, 0.8, 0.84), lift=0.16),
    'brick': toon('brick', '#a8503a', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'brickLight': toon('brickLight', '#c47a5a', lift=0.14),
    'white': toon('white', '#f4f0e6', lift=0.22),
    'green': toon('green3', '#2a6a4a'),
    'sky': toon('sky', '#2a4a8a', lift=0.2),
    'gold': toon('gold2', '#e8b848', shadow_mul=(0.78, 0.66, 0.6), lift=0.35),
    'roof': toon('roof', '#4a4a50'),
    'water': toon('water', '#4a8ac0', lift=0.3),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['cobble'])
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


loft('canal', M['water'], [strip(-0.95, -0.62, 1.32, G - 0.004), strip(-0.95, -0.62, 1.32, G + 0.008)], outline=0.002)


def canal_house(name, x, y, w, h, mat, stepped=True):
    box(name, mat, x, y, G - 0.005, w, 0.3, h, outline=0.005, bevel=0)
    gable(name + 'roof', M['roof'], x, y, G + h - 0.005, w, 0.3, 0.14, over=0.005)
    if stepped:
        for k in range(4):
            box(f'{name}step{k}', mat, x, y - 0.14, G + h - 0.005 + k * 0.035, w - k * w / 4.4, 0.03, 0.035, outline=0.002, bevel=0)
    else:
        gable(name + 'front', mat, x, y - 0.14, G + h - 0.005, w, 0.03, 0.14)
    for f in range(2):
        for j in (-1, 1):
            box(f'{name}win{f}{j}', M['white'], x + j * w * 0.22, y - 0.153, G + 0.05 + f * 0.11, 0.05, 0.006, 0.07, outline=0, bevel=0)
            box(f'{name}glass{f}{j}', M['dark'], x + j * w * 0.22, y - 0.156, G + 0.055 + f * 0.11, 0.04, 0.004, 0.06, outline=0, bevel=0)
            box(f'{name}shutter{f}{j}', M['green'], x + j * w * 0.22 + j * 0.035, y - 0.155, G + 0.05 + f * 0.11, 0.018, 0.006, 0.07, outline=0, bevel=0)


# ---------- Eisinga's house, opened to show the planetarium ----------
EX, EY = 0.0, 0.1
canal_house('eisinga', EX, EY, 0.26, 0.26, M['brick'])
box('door', M['green'], EX, EY - 0.153, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
# the orrery's gilded rings and planets shown big over the door, as on the sign
for k, r in enumerate((0.03, 0.05, 0.07)):
    cyl(f'orbit{k}', M['gold'], r, 0.004, segs=24, outline=0, matrix=Matrix.Translation((EX, EY - 0.16, G + 0.33)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    cyl(f'orbitin{k}', M['sky'], r - 0.006, 0.006, segs=24, outline=0, matrix=Matrix.Translation((EX, EY - 0.16, G + 0.33)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
ball('sun', M['gold'], EX, EY - 0.165, G + 0.33, 0.014, outline=0.001)
for k, (r, a) in enumerate(((0.03, 0.5), (0.05, 2.2), (0.07, 4.0))):
    ball(f'planet{k}', M['white'], EX + r * math.cos(a), EY - 0.168, G + 0.33 + r * math.sin(a), 0.007, outline=0)

# ---------- the neighbouring houses ----------
canal_house('west1', EX - 0.29, EY, 0.26, 0.22, M['brickLight'], stepped=False)
canal_house('west2', EX - 0.58, EY + 0.02, 0.24, 0.26, M['brick'])
canal_house('east1', EX + 0.29, EY, 0.26, 0.24, M['brickLight'], stepped=False)
canal_house('east2', EX + 0.58, EY + 0.02, 0.24, 0.2, M['brick'])
for k, x in enumerate((-0.55, -0.1, 0.4)):
    tree(f'tree{k}', x, -0.4, r=0.09, h=0.12)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
