# A cartoon Paquimé for the country maps, built in the set's shared look (../toon.py): the great
# adobe trading town of Casas Grandes in Chihuahua, Mexico: its maze of thick earthen walls,
# once several storeys high, with the T-shaped doorways that are its mark, the stepped walls
# of the rooms, the ball court and the bird pens, and the dry hills of the Sierra Madre
# behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P paquime.py -- paquime-1024.png 1024 paquime.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c094', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'mountain': toon('mountain', '#b8a07a', shadow_mul=(0.78, 0.76, 0.82)),
    'adobe': toon('adobe', '#c8946a', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'adobeLight': toon('adobeLight', '#d8aa80', lift=0.15),
    'dark': flat('dark', '#2e2420'),
    'shrub': toon('shrub', '#9aa860', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(853265)

for k, (x, y, r, h) in enumerate(((-0.65, 1.0, 0.42, 0.32), (0.25, 1.05, 0.45, 0.4), (0.9, 0.7, 0.3, 0.26))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.65, h * 0.55), (r * 0.25, h * 0.9), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    mt.visible_shadow = False


def tdoor(name, x, y, z, face='y'):
    """The T-shaped doorway: a narrow lower slot under a wider upper one."""
    if face == 'y':
        box(name, M['dark'], x, y, z, 0.03, 0.008, 0.05, outline=0, bevel=0)
        box(name + 'top', M['dark'], x, y, z + 0.05, 0.06, 0.008, 0.035, outline=0, bevel=0)
    else:
        box(name, M['dark'], x, y, z, 0.008, 0.03, 0.05, outline=0, bevel=0)
        box(name + 'top', M['dark'], x, y, z + 0.05, 0.008, 0.06, 0.035, outline=0, bevel=0)


# ---------- the maze of rooms ----------
CELL = 0.17
for i in range(6):
    for j in range(4):
        x, y = -0.55 + i * CELL, -0.35 + j * CELL
        if math.hypot(x, y) > 0.8:
            continue
        h = 0.08 + 0.05 * ((i + 2 * j) % 3) + 0.02 * rng.random()
        mat = M['adobe'] if (i + j) % 2 else M['adobeLight']
        if j == 0 or rng.random() < 0.7:
            box(f'wallx{i}{j}', mat, x, y - CELL / 2, G - 0.005, CELL + 0.03, 0.035, h, outline=0.003, bevel=0)
            if j == 0 and i % 2 == 0:
                tdoor(f'door{i}{j}', x, y - CELL / 2 - 0.02, G - 0.005)
        if i == 0 or rng.random() < 0.7:
            box(f'wally{i}{j}', mat, x - CELL / 2, y, G - 0.005, 0.035, CELL + 0.03, h, outline=0.003, bevel=0)
# the tall house in the middle
box('tallhouse', M['adobeLight'], -0.05, 0.05, G - 0.005, 0.3, 0.24, 0.24, outline=0.006, bevel=0)
for j in range(3):
    tdoor(f'talldoor{j}', -0.15 + j * 0.1, 0.05 - 0.123, G + 0.04 + (0.08 if j == 1 else 0.0))
for k in range(4):
    box(f'tallstep{k}', M['adobe'], 0.15 + k * 0.02, 0.05, G + 0.24 - (k + 1) * 0.05, 0.04, 0.2, 0.05, outline=0.002, bevel=0)

# ---------- the I-shaped ball court and the bird pens ----------
BX, BY = 0.55, -0.45
for s in (-1, 1):
    box(f'court{s}', M['adobeLight'], BX, BY + s * 0.08, G - 0.005, 0.3, 0.04, 0.05, outline=0.003, bevel=0)
    box(f'courtend{s}', M['adobeLight'], BX + s * 0.17, BY, G - 0.005, 0.04, 0.24, 0.05, outline=0.003, bevel=0)
for k in range(4):
    box(f'birdpen{k}', M['adobe'], -0.75 + k * 0.09, -0.6, G - 0.005, 0.07, 0.07, 0.06, outline=0.002, bevel=0)
    box(f'birdpenhole{k}', M['dark'], -0.75 + k * 0.09, -0.636, G + 0.015, 0.02, 0.006, 0.02, outline=0, bevel=0)
for k, (x, y) in enumerate(((0.9, -0.1), (-0.95, -0.2), (0.2, -0.85), (-0.5, -0.85))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
