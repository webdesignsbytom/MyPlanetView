# A cartoon of Alberobello's trulli for the country maps, built in the set's shared look
# (../toon.py): the little whitewashed round houses of Apulia under their conical roofs of grey
# stone slabs, each crowned with a white pinnacle, some painted with a white symbol, along a lane,
# with olive trees and a dry-stone wall. Turned a little towards the camera.
# Run: blender -b --factory-startup -P trulli.py -- trulli-1024.png 1024 trulli.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'earth': toon('earth', '#c8a070', shadow_mul=(0.86, 0.78, 0.72), lift=0.2),
    'lane': toon('lane', '#e2d8c2', lift=0.25),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'stone': toon('stone', '#8a8680', shadow_mul=(0.84, 0.84, 0.9)),
    'stoneDark': toon('stoneDark', '#6e6a66', shadow_mul=(0.84, 0.84, 0.9)),
    'door': toon('door', '#2f6fa0'),
    'olive': toon('olive', '#8a9a5a', shadow_mul=(0.76, 0.8, 0.74)),
    'trunk': toon('trunk', '#6a5a46'),
    'wall': toon('wall', '#b8aa94', shadow_mul=(0.84, 0.82, 0.86)),
})

G = tile(M['earth'])
before = set(bpy.data.objects)
rng = random.Random(1657)

box('lane', M['lane'], 0.0, -0.1, G - 0.004, 2.4, 0.2, 0.008, rot_z=0.15, outline=0.003, bevel=0)


def trullo(name, x, y, r, symbol=False):
    lathe(name, M['white'], ((r, 0), (r, 0.1)), G - 0.005, x, y, segs=18, outline=0.01)
    lathe(f'{name}cone', M['stone' if rng.random() > 0.3 else 'stoneDark'], ((r * 1.05, 0), (r * 0.7, 0.1), (r * 0.25, 0.2), (r * 0.12, 0.22)), G + 0.095, x, y, segs=18,
          outline=0.01)
    lathe(f'{name}pinnacle', M['white'], ((0.025, 0), (0.025, 0.02), (0.012, 0.04), (0.02, 0.05), (0.004, 0.07)), G + 0.31, x, y, segs=10, outline=0.004)
    box(f'{name}door', M['door'], x, y - r + 0.004, G, 0.04, 0.006, 0.07, outline=0, bevel=0)
    if symbol:
        box(f'{name}symbolv', M['white'], x, y - r * 0.7 - 0.006, G + 0.16, 0.008, 0.004, 0.05, outline=0, bevel=0)
        box(f'{name}symbolh', M['white'], x, y - r * 0.68 - 0.006, G + 0.175, 0.035, 0.004, 0.008, outline=0, bevel=0)


ROW = [(-0.85, 0.25, 0.12), (-0.58, 0.3, 0.13), (-0.3, 0.35, 0.12), (0.0, 0.38, 0.14), (0.3, 0.42, 0.12), (0.58, 0.45, 0.13), (0.82, 0.5, 0.11),
       (-0.7, -0.45, 0.11), (-0.42, -0.42, 0.12), (-0.12, -0.38, 0.13), (0.2, -0.33, 0.12), (0.5, -0.3, 0.12)]
for k, (x, y, r) in enumerate(ROW):
    trullo(f'trullo{k}', x, y, r, symbol=k % 3 == 0)
for k, (x, y) in enumerate(((-0.3, 0.75), (0.25, 0.8), (0.85, -0.2), (-0.95, -0.15))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.08), 0.014, segs=6, outline=0.004)
    b = ball(f'olive{k}', M['olive'], 0, 0, 0, 0.08, outline=0.01)
    b.scale = (1.3, 1.2, 0.8)
    b.location = (x + 0.02, y, G + 0.13)
for k in range(9):
    x = -0.9 + k * 0.22
    box(f'drystone{k}', M['wall'], x, -0.82 + 0.02 * k, G - 0.005, 0.21, 0.05, 0.05, rot_z=0.15, outline=0.004, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
