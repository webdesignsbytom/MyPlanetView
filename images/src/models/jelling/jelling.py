# A cartoon Jelling for the country maps, built in the set's shared look (../toon.py): the Viking royal
# monuments in Jutland, the two great grassy burial mounds with the small whitewashed church between
# them, its red tiled roof and its tower with stepped gables, the two rune stones in front of it
# (Harald Bluetooth's, Denmark's "birth certificate", the larger), the churchyard's white wall, and
# the white stones marking the outline of the huge stone ship round them all. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P jelling.py -- jelling-1024.png 1024 jelling.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mound': toon('mound', '#6aa84c', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'roof': toon('roof', '#b8503e'),
    'runestone': toon('runestone', '#8a8a86'),
    'path': toon('path', '#d8ccb0', lift=0.15),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(958)

# ---------- the two burial mounds ----------
MOUNDS = ((-0.66, 0.15), (0.66, 0.15))
for k, (x, y) in enumerate(MOUNDS):
    m = lathe(f'mound{k}', M['mound'], ((0.42, 0), (0.36, 0.07), (0.25, 0.15), (0.12, 0.19), (0.0, 0.2)), G - 0.01, x, y, segs=32, outline=0.006)
    m.visible_shadow = False

# ---------- the stone ship's outline of white stones ----------
for k in range(56):
    side, j = (-1, k) if k < 28 else (1, k - 28)
    x = -1.08 + 2.16 * j / 27
    y = 0.15 + side * 0.42 * (1 - (x / 1.08) ** 2)
    if any(math.hypot(x - mx, y - my) < 0.44 for mx, my in MOUNDS):
        continue
    box(f'shipstone{k}', M['white'], x, y, G - 0.005, 0.03, 0.03, 0.03 + 0.01 * rng.random(), rot_z=rng.random(), outline=0.002, bevel=0)

# ---------- the churchyard's white wall and the path ----------
WX, WY = 0.24, 0.2
for s in (-1, 1):
    box(f'wallside{s}', M['white'], s * WX, 0.15, G - 0.005, 0.025, 2 * WY, 0.05, outline=0.002, bevel=0)
    box(f'wallfront{s}', M['white'], s * 0.15, 0.15 - WY, G - 0.005, 0.18, 0.025, 0.05, outline=0.002, bevel=0)
box('wallback', M['white'], 0.0, 0.15 + WY, G - 0.005, 2 * WX, 0.025, 0.05, outline=0.002, bevel=0)
box('path', M['path'], 0.0, -0.35, G - 0.004, 0.08, 0.6, 0.008, outline=0.001, bevel=0)

# ---------- the church ----------
CX, CY = 0.04, 0.22
box('nave', M['white'], CX, CY, G - 0.005, 0.3, 0.13, 0.13, outline=0.005, bevel=0)
for j in range(3):
    box(f'navewin{j}', M['dark'], CX - 0.08 + j * 0.08, CY - 0.068, G + 0.06, 0.02, 0.006, 0.04, outline=0, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.15, CY - 0.075, G + 0.125), (CX + 0.15, CY - 0.075, G + 0.125), (CX + 0.15, CY + 0.075, G + 0.125), (CX - 0.15, CY + 0.075, G + 0.125)],
                             [(CX - 0.15, CY - 0.004, G + 0.2), (CX + 0.15, CY - 0.004, G + 0.2), (CX + 0.15, CY + 0.004, G + 0.2), (CX - 0.15, CY + 0.004, G + 0.2)]], outline=0.004)
# the tower at the west end, its stepped gables to the front and back
TX = CX - 0.19
box('tower', M['white'], TX, CY, G - 0.005, 0.1, 0.12, 0.24, outline=0.005, bevel=0)
box('towerdoor', M['dark'], TX, CY - 0.063, G - 0.005, 0.035, 0.006, 0.06, outline=0, bevel=0)
box('towerwin', M['dark'], TX, CY - 0.063, G + 0.16, 0.02, 0.006, 0.035, outline=0, bevel=0)
for st in range(4):
    box(f'towergable{st}', M['white'], TX, CY, G + 0.235 + st * 0.022, 0.1 - st * 0.024, 0.12, 0.023, outline=0.002, bevel=0)
loft('towerroof', M['roof'], [[(TX - 0.045, CY - 0.055, G + 0.235), (TX + 0.045, CY - 0.055, G + 0.235), (TX + 0.045, CY + 0.055, G + 0.235), (TX - 0.045, CY + 0.055, G + 0.235)],
                              [(TX - 0.004, CY - 0.055, G + 0.315), (TX + 0.004, CY - 0.055, G + 0.315), (TX + 0.004, CY + 0.055, G + 0.315), (TX - 0.004, CY + 0.055, G + 0.315)]], outline=0.003)
# the stepped gable at the east end
for st in range(3):
    box(f'eastgable{st}', M['white'], CX + 0.15, CY, G + 0.125 + st * 0.025, 0.02, 0.13 - st * 0.04, 0.026, outline=0.002, bevel=0)

# ---------- the two rune stones ----------
for k, (x, h, w) in enumerate(((-0.05, 0.11, 0.06), (0.1, 0.08, 0.045))):
    loft(f'runestone{k}', M['runestone'], [[(x - w / 2, 0.02, G - 0.005), (x + w / 2, 0.02, G - 0.005), (x + w / 2 - 0.008, 0.06, G - 0.005), (x - w / 2 + 0.008, 0.06, G - 0.005)],
                                           [(x - w / 2 + 0.01, 0.025, G + h), (x + w / 2 - 0.01, 0.025, G + h), (x + w / 2 - 0.014, 0.055, G + h), (x - w / 2 + 0.014, 0.055, G + h)]], outline=0.003)

for k, (x, y) in enumerate(((-0.4, -0.7), (0.45, -0.72), (-0.15, 0.95), (0.35, 0.92))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.12, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
