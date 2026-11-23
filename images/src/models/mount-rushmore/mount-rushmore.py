# A cartoon Mount Rushmore for the country maps, built in the set's shared look (../toon.py): the
# granite mountain in the Black Hills with the four presidents' heads carved into its face, the
# pale scree of rubble below them, the dark ponderosa pines round it, and the Avenue of Flags on
# the terrace in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mount-rushmore.py -- mount-rushmore-1024.png 1024 mount-rushmore.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#6a9a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'granite': toon('granite', '#c8c0b8', shadow_mul=(0.82, 0.84, 0.9), lift=0.1),
    'graniteDark': toon('graniteDark', '#a8a098', shadow_mul=(0.82, 0.84, 0.9)),
    'face': toon('face', '#e0d8d0', shadow_mul=(0.82, 0.84, 0.9), lift=0.12),
    'eye': flat('eye', '#5a5450'),
    'scree': toon('scree', '#d8d0c4'),
    'pine': toon('pine', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
    'terrace': toon('terrace', '#d8ccb8'),
    'pole': toon('pole', '#c8c8cc'),
    'f0': toon('f0', '#d8302a'), 'f1': toon('f1', '#2f5ab0'), 'f2': toon('f2', '#f8f6f0', lift=0.2),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2179)

# ---------- the mountain ----------
FOOT = [(-1.0, 0.3), (-0.55, 0.05), (0.2, 0.0), (0.85, 0.12), (1.05, 0.5), (0.6, 0.95), (-0.6, 0.95), (-1.05, 0.65)]
CEN = (0.0, 0.5)


def shrink(f, z, dy=0.0):
    return [(CEN[0] + (x - CEN[0]) * f, CEN[1] + dy + (y - CEN[1]) * f, G + z) for x, y in FOOT]


mtn = loft('mountain', M['granite'], [shrink(1.0, -0.01), shrink(0.92, 0.35, 0.02), shrink(0.75, 0.68, 0.06), shrink(0.45, 0.8, 0.1)], outline=0.016)
mtn.visible_shadow = False
for k in range(6):
    x = -0.8 + k * 0.32
    bar(f'mtnstreak{k}', M['graniteDark'], (x, 0.08 + 0.05 * abs(x), G + 0.04), (x * 0.85, 0.2, G + 0.6), 0.05, outline=0)
scree = loft('scree', M['scree'], [[(-0.7, -0.05, G - 0.008), (0.7, -0.05, G - 0.008), (0.6, 0.15, G - 0.008), (-0.6, 0.15, G - 0.008)],
                                   [(-0.62, 0.05, G + 0.08), (0.62, 0.05, G + 0.08), (0.55, 0.18, G + 0.12), (-0.55, 0.18, G + 0.12)]], outline=0.008)
scree.visible_shadow = False

# ---------- the four heads ----------
HEADS = ((-0.56, 0.1, 0.5, 0.19, False), (-0.2, 0.06, 0.53, 0.2, False), (0.1, 0.12, 0.49, 0.17, True), (0.45, 0.07, 0.5, 0.2, False))
for k, (x, y, z, r, tucked) in enumerate(HEADS):
    zz = G + z
    b = ball(f'head{k}', M['face'], 0, 0, 0, r, outline=0.01)
    b.scale = (0.82, 0.75, 1.15)
    b.location = (x, y, zz)
    b = ball(f'brow{k}', M['face'], 0, 0, 0, r * 0.55, outline=0.005)
    b.scale = (1.3, 0.5, 0.35)
    b.location = (x, y - r * 0.6, zz + r * 0.25)
    for s in (-1, 1):
        ball(f'eye{k}{s}', M['eye'], x + s * r * 0.28, y - r * 0.66, zz + r * 0.12, r * 0.12, outline=0)
    pyramid(f'nose{k}', M['face'], x, y - r * 0.72, zz - r * 0.25, r * 0.2, r * 0.38, outline=0.004)
    box(f'mouth{k}', M['eye'], x, y - r * 0.7, zz - r * 0.5, r * 0.35, 0.006, r * 0.06, outline=0, bevel=0)
    if k == 3:
        b = ball('beard', M['face'], 0, 0, 0, r * 0.55, outline=0.005)
        b.scale = (1.1, 0.6, 0.7)
        b.location = (x, y - r * 0.4, zz - r * 0.72)

# ---------- the pines ----------
for k in range(18):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.95, 1.2)
    x, y = r * math.cos(a), 0.3 + r * math.sin(a) * 0.75
    if math.hypot(x, y) > 1.22 or (-0.75 < x < 0.75 and y < -0.15):
        continue
    h = rng.uniform(0.2, 0.3)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.012, segs=6, outline=0.003)
    lathe(f'pine{k}', M['pine'], ((0.06, 0), (0.04, h * 0.4), (0.004, h)), G + 0.04, x, y, segs=8, outline=0.006)

# ---------- the terrace and the Avenue of Flags ----------
box('terrace', M['terrace'], 0.0, -0.65, G - 0.005, 1.1, 0.3, 0.03, outline=0.005, bevel=0)
for s in (-1, 1):
    for j in range(5):
        x = s * (0.12 + j * 0.09)
        y = -0.6 - 0.015 * j
        rod(f'flagpole{s}{j}', M['pole'], (x, y, G + 0.025), (x, y, G + 0.2), 0.004, segs=4, outline=0)
        box(f'flag{s}{j}', M['f%d' % ((j + (s > 0)) % 3)], x + 0.025, y, G + 0.16, 0.05, 0.004, 0.035, outline=0.001, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
