# A cartoon Göreme and Cappadocia for the country maps, built in the set's shared look
# (../toon.py): the valley's fairy chimneys, pale cones of tuff wearing dark basalt caps, some with
# cave doors and windows cut into them, and striped hot-air balloons floating over them at dawn.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P cappadocia.py -- cappadocia-1024.png 1024 cappadocia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e0c49a', shadow_mul=(0.86, 0.8, 0.76), lift=0.2),
    'tuff': toon('tuff', '#f0d8b8', shadow_mul=(0.86, 0.8, 0.78), lift=0.15),
    'tuffPink': toon('tuffPink', '#e8b8a0', shadow_mul=(0.86, 0.8, 0.78)),
    'basalt': toon('basalt', '#7a6058', shadow_mul=(0.84, 0.82, 0.86)),
    'window': flat('window', '#4a3428'),
    'scrub': toon('scrub', '#8aa860', shadow_mul=(0.74, 0.8, 0.74)),
    'b0': toon('b0', '#e8402c'), 'b1': toon('b1', '#f0c030', lift=0.25), 'b2': toon('b2', '#2f6fc0'), 'b3': toon('b3', '#3f9a4a'), 'b4': toon('b4', '#f8f6f0', lift=0.2),
    'basket': toon('basket', '#8a6040'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2053)

# ---------- the fairy chimneys ----------
CHIMNEYS = ((-0.45, 0.35, 0.16, 0.55), (-0.2, 0.55, 0.12, 0.42), (-0.7, 0.6, 0.13, 0.4), (0.1, 0.3, 0.14, 0.48), (0.4, 0.55, 0.12, 0.38),
            (0.7, 0.3, 0.15, 0.44), (-0.85, 0.15, 0.12, 0.32), (0.95, 0.6, 0.11, 0.3), (-0.1, -0.05, 0.11, 0.3), (0.45, -0.15, 0.1, 0.26), (-0.6, -0.25, 0.1, 0.24))
for k, (x, y, r, h) in enumerate(CHIMNEYS):
    mat = 'tuff' if k % 3 else 'tuffPink'
    lathe(f'chimney{k}', M[mat], ((r, 0), (r * 0.75, h * 0.35), (r * 0.45, h * 0.75), (r * 0.32, h)), G - 0.01, x, y, segs=14, outline=0.01)
    b = ball(f'cap{k}', M['basalt'], 0, 0, 0, r * 0.5, outline=0.007)
    b.scale = (1.0, 1.0, 0.75)
    b.location = (x, y, G - 0.01 + h + r * 0.18)
    if k % 2 == 0:
        box(f'cavedoor{k}', M['window'], x, y - r * 0.8, G - 0.005, 0.03, 0.006, 0.05, outline=0, bevel=0)
        box(f'cavewin{k}', M['window'], x + r * 0.15, y - r * 0.55, G + h * 0.45, 0.02, 0.006, 0.025, outline=0, bevel=0)
for k in range(8):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(-0.9, -0.3)
    if math.hypot(x, y) > 1.15:
        continue
    ball(f'scrub{k}', M['scrub'], x, y, G + 0.02, 0.04, outline=0.005)

# ---------- the balloons ----------


def balloon(name, x, y, z, s, cols):
    prof = [(0.035 * s, 0), (0.1 * s, 0.08 * s), (0.13 * s, 0.15 * s), (0.13 * s, 0.21 * s), (0.1 * s, 0.27 * s), (0.004, 0.31 * s)]
    for i in range(len(prof) - 1):
        (r0, h0), (r1, h1) = prof[i], prof[i + 1]
        lathe(f'{name}band{i}', M[cols[i % len(cols)]], ((r0, 0), (r1, h1 - h0)), z + h0, x, y, segs=16, outline=0.006 if i else 0.004)
    box(f'{name}basket', M['basket'], x, y, z - 0.07 * s, 0.05 * s, 0.05 * s, 0.04 * s, outline=0.004, bevel=0)
    for sx in (-1, 1):
        rod(f'{name}rope{sx}', M['basket'], (x + sx * 0.02 * s, y, z - 0.03 * s), (x + sx * 0.03 * s, y, z + 0.005), 0.003, segs=4, outline=0)


balloon('balloon0', -0.35, -0.35, G + 0.75, 1.5, ['b0', 'b1'])
balloon('balloon1', 0.45, 0.1, G + 0.95, 1.2, ['b2', 'b4'])
balloon('balloon2', 0.75, -0.55, G + 0.55, 1.0, ['b3', 'b1'])
balloon('balloon3', -0.85, 0.5, G + 1.0, 0.9, ['b1', 'b0'])

bpy.context.view_layer.update()
turn(before, -20)
render(G)
