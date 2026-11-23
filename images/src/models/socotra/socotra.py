# A cartoon Socotra for the country maps, built in the set's shared look (../toon.py): dragon's
# blood trees on the Dixam plateau, each a dense dark-green umbrella held up by a candelabra of
# branches on a thick trunk, the swollen bottle-shaped desert rose trees with their pink flowers,
# and the pale limestone rocks. Turned a little towards the camera.
# Run: blender -b --factory-startup -P socotra.py -- socotra-1024.png 1024 socotra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plateau': toon('plateau', '#c8b888', shadow_mul=(0.84, 0.82, 0.76), lift=0.2),
    'rock': toon('rock', '#e0d8c8', shadow_mul=(0.84, 0.84, 0.9), lift=0.12),
    'scrub': toon('scrub', '#8aa860', shadow_mul=(0.74, 0.8, 0.74)),
    'canopy': toon('canopy', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'canopyLight': toon('canopyLight', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'bark': toon('bark', '#9a9088', shadow_mul=(0.84, 0.84, 0.9)),
    'bottle': toon('bottle', '#c8b8a0', shadow_mul=(0.86, 0.82, 0.8)),
    'pink': toon('pink', '#f07ab0', lift=0.25),
})

G = tile(M['plateau'])
before = set(bpy.data.objects)
rng = random.Random(2099)


def dragon(name, x, y, s):
    rod(f'{name}trunk', M['bark'], (x, y, G), (x, y, G + 0.3 * s), 0.05 * s, r2=0.04 * s, segs=10, outline=0.006)
    top = G + 0.3 * s
    for k in range(7):
        a = 2 * math.pi * k / 7
        rod(f'{name}branch{k}', M['bark'], (x, y, top), (x + 0.2 * s * math.cos(a), y + 0.2 * s * math.sin(a), top + 0.16 * s), 0.02 * s, r2=0.013 * s, segs=6, outline=0.003)
    b = ball(f'{name}crown', M['canopy'], 0, 0, 0, 0.34 * s, outline=0.014)
    b.scale = (1.0, 1.0, 0.42)
    b.location = (x, y, top + 0.2 * s)
    b = ball(f'{name}crowntop', M['canopyLight'], 0, 0, 0, 0.26 * s, outline=0.008)
    b.scale = (1.0, 1.0, 0.3)
    b.location = (x, y, top + 0.26 * s)


def desert_rose(name, x, y, s):
    lathe(name, M['bottle'], ((0.1 * s, 0), (0.12 * s, 0.06 * s), (0.08 * s, 0.16 * s), (0.04 * s, 0.24 * s), (0.03 * s, 0.28 * s)), G - 0.005, x, y, segs=14, outline=0.006)
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.4
        tip = (x + 0.08 * s * math.cos(a), y + 0.08 * s * math.sin(a), G + 0.34 * s)
        rod(f'{name}arm{k}', M['bottle'], (x, y, G + 0.26 * s), tip, 0.018 * s, r2=0.01 * s, segs=6, outline=0.003)
        ball(f'{name}flower{k}', M['pink'], tip[0], tip[1], tip[2] + 0.015, 0.03 * s, outline=0.003)


dragon('dragon0', -0.3, 0.25, 1.35)
dragon('dragon1', 0.55, 0.5, 1.0)
dragon('dragon2', -0.85, 0.65, 0.8)
desert_rose('rose0', 0.55, -0.35, 1.2)
desert_rose('rose1', -0.65, -0.5, 1.0)

for k, (x, y, r, h) in enumerate(((0.95, 0.05, 0.2, 0.14), (0.2, -0.75, 0.18, 0.1), (-1.0, -0.1, 0.16, 0.12), (0.0, 0.95, 0.2, 0.12))):
    b = ball(f'rock{k}', M['rock'], 0, 0, 0, r, outline=0.01)
    b.scale = (1.2, 0.95, h / r)
    b.location = (x, y, G + h * 0.4)
for k in range(10):
    x, y = rng.uniform(-1.05, 1.05), rng.uniform(-1.0, 1.0)
    if math.hypot(x, y) > 1.15:
        continue
    ball(f'scrub{k}', M['scrub'], x, y, G + 0.02, 0.045, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
