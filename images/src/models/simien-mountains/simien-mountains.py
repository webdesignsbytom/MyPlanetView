# A cartoon Simien Mountains for the country maps, built in the set's shared look (../toon.py): the
# high plateau's grassy edge breaking off in a sheer escarpment, the basalt pinnacles rising from the
# valley far below, giant lobelias, a troop of gelada monkeys on the grass, and a walia ibex with its
# great curved horns on a rock. Turned a little towards the camera.
# Run: blender -b --factory-startup -P simien-mountains.py -- simien-mountains-1024.png 1024 simien-mountains.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#7a9a58', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'grass': toon('grass2', '#a8b860', shadow_mul=(0.76, 0.8, 0.72)),
    'cliff': toon('cliff', '#7a6a5e', shadow_mul=(0.84, 0.82, 0.88)),
    'pinnacle': toon('pinnacle', '#8a7a6a', shadow_mul=(0.84, 0.82, 0.88)),
    'lobelia': toon('lobelia', '#5a8a5a', shadow_mul=(0.72, 0.8, 0.74)),
    'lobeliaStem': toon('lobeliaStem', '#7a6a4a'),
    'gelada': toon('gelada', '#9a7a5a', shadow_mul=(0.86, 0.8, 0.76)),
    'chest': toon('chest', '#d8483a'),
    'ibex': toon('ibex', '#8a6a4e'),
    'horn': toon('horn', '#3a3430'),
})

G = tile(M['valley'])
before = set(bpy.data.objects)
rng = random.Random(1493)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the plateau and its escarpment ----------
cl = loft('escarpment', M['cliff'], [segment(0.0, 1.41, -0.01), segment(0.05, 1.4, 0.52)], outline=0.02)
cl.visible_shadow = False
for k in range(8):
    x = -1.1 + k * 0.32
    bar(f'gully{k}', M['pinnacle'], (x, -0.005 + 0.0, G + 0.05), (x + 0.03, 0.04, G + 0.48), 0.06, outline=0.004)
top = loft('plateau', M['grass'], [segment(0.05, 1.4, 0.515), segment(0.08, 1.39, 0.54)], outline=0.01)
top.visible_shadow = False
T = G + 0.54

# ---------- the pinnacles rising from the valley ----------
for k, (x, y, r, h) in enumerate(((-0.55, -0.35, 0.1, 0.45), (-0.3, -0.5, 0.08, 0.36), (0.35, -0.4, 0.11, 0.5), (0.6, -0.6, 0.08, 0.32), (-0.85, -0.6, 0.07, 0.28),
                                  (0.05, -0.75, 0.06, 0.24))):
    lathe(f'pinnacle{k}', M['pinnacle'], ((r, 0), (r * 0.8, h * 0.6), (r * 0.5, h * 0.9), (0.004, h)), G - 0.01, x, y, segs=7, outline=0.012, smooth=False)
    ball(f'pinnaclegreen{k}', M['lobelia'], x, y, G + h * 0.8, r * 0.45, outline=0.006)

# ---------- giant lobelias on the plateau ----------
for k, (x, y) in enumerate(((-0.9, 0.35), (-0.6, 0.6), (0.7, 0.45), (0.95, 0.2), (-0.2, 0.75))):
    rod(f'lobeliastem{k}', M['lobeliaStem'], (x, y, T), (x, y, T + 0.12), 0.018, segs=6, outline=0.004)
    lathe(f'lobeliaspike{k}', M['lobelia'], ((0.04, 0), (0.035, 0.08), (0.004, 0.2)), T + 0.12, x, y, segs=10, outline=0.006)

# ---------- geladas on the grass edge ----------
for k, x in enumerate((-0.35, -0.2, 0.0, 0.18)):
    y = 0.2 + 0.03 * (k % 2)
    b = ball(f'gelada{k}', M['gelada'], 0, 0, 0, 0.04, outline=0.006)
    b.scale = (1.0, 1.0, 1.2)
    b.location = (x, y, T + 0.04)
    ball(f'geladahead{k}', M['gelada'], x, y - 0.01, T + 0.1, 0.026, outline=0.004)
    b = ball(f'geladachest{k}', M['chest'], 0, 0, 0, 0.016, outline=0)
    b.scale = (1.2, 0.5, 1.0)
    b.location = (x, y - 0.035, T + 0.06)

# ---------- a walia ibex on a rock ----------
IX, IY = 0.55, 0.12
ball('ibexrock', M['pinnacle'], IX, IY, T + 0.01, 0.06, outline=0.008)
IZ = T + 0.06
for fx in (-0.03, 0.03):
    for side in (-1, 1):
        rod(f'ibexleg{fx}{side}', M['ibex'], (IX + fx, IY + side * 0.015, IZ), (IX + fx, IY + side * 0.015, IZ + 0.05), 0.007, segs=5, outline=0.002)
b = ball('ibexbody', M['ibex'], 0, 0, 0, 0.035, outline=0.005)
b.scale = (1.5, 0.8, 0.8)
b.location = (IX, IY, IZ + 0.065)
ball('ibexhead', M['ibex'], IX + 0.06, IY, IZ + 0.095, 0.018, outline=0.003)
for side in (-1, 1):
    pts = [(IX + 0.06 - 0.04 * math.sin(t), IY + side * 0.008, IZ + 0.11 + 0.04 * (1 - math.cos(t))) for t in (j * 0.5 for j in range(5))]
    for j in range(4):
        rod(f'horn{side}{j}', M['horn'], pts[j], pts[j + 1], 0.007 - j * 0.001, segs=5, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
