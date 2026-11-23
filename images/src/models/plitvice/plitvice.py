# Cartoon Plitvice Lakes for the country maps, built in the set's shared look (../toon.py): three
# turquoise lakes stepping down through the forest, each spilling over its pale travertine rim in
# waterfalls into the next, a wooden boardwalk zigzagging across the lowest, and the forest all
# round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P plitvice.py -- plitvice-1024.png 1024 plitvice.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#3fc1c9', shadow_mul=(0.72, 0.84, 0.88), lift=0.35),
    'travertine': toon('travertine', '#e6dcc0', shadow_mul=(0.82, 0.8, 0.86)),
    'slope': toon('slope', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'foamBlue': toon('foamBlue', '#bfe3f5', shadow_mul=(0.82, 0.86, 0.95), lift=0.15),
    'planks': toon('planks', '#9a6b43'),
    'trunk': toon('trunk', '#7a5238'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(37)


def blob(cx, cy, rx, ry, n=20, jitter=0.14):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / n),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / n)) for k in range(n)]


# ---------- three lakes, each a terrace of ground with its water on top and a travertine rim ----------
LAKES = ((0.15, 0.62, 0.78, 0.42, 0.5), (-0.1, 0.05, 0.9, 0.36, 0.3), (0.05, -0.62, 0.95, 0.42, 0.1))
for k, (cx, cy, rx, ry, z) in enumerate(LAKES):
    shore = blob(cx, cy, rx + 0.1, ry + 0.1, jitter=0.1)
    terrace = loft(f'terrace{k}', M['slope'], [[(x, y, G - 0.01) for x, y in shore], [(x, y, G + z) for x, y in shore]], outline=0.035)
    terrace.visible_shadow = False
    water = blob(cx, cy, rx, ry, jitter=0.03)
    loft(f'rim{k}', M['travertine'], [[(x, y, G + z - 0.01) for x, y in water], [(x, y, G + z + 0.012) for x, y in water]], outline=0.015)
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((cx + (x - cx) * 0.94, cy + (y - cy) * 0.94, G + z + 0.014)) for x, y in water])
    bmesh.ops.triangulate(bm, faces=[face])
    finish(f'lake{k}', bm, M['lake'], outline=0)


# ---------- waterfalls from each lake down to the next ----------
def falls(name, x, y, top, bottom, width):
    for i, (dx, mat) in enumerate(((-width / 3, 'foam'), (0, 'foamBlue'), (width / 3, 'foam'))):
        loft(f'{name}{i}', M[mat], [[(x + dx - width / 6, y, G + bottom), (x + dx + width / 6, y, G + bottom), (x + dx + width / 6, y + 0.02, G + bottom),
                                     (x + dx - width / 6, y + 0.02, G + bottom)],
                                    [(x + dx - width / 6, y + 0.02, G + top), (x + dx + width / 6, y + 0.02, G + top),
                                     (x + dx + width / 6, y + 0.04, G + top), (x + dx - width / 6, y + 0.04, G + top)]], outline=0.008)
    for i, dx in enumerate((-width / 3, width / 3)):
        ball(f'{name}spray{i}', M['foam'], x + dx, y - 0.04, G + bottom + 0.02, 0.045, outline=0.012)


# on each upper lake's front wall, spilling down into the lake below it
def front_y(lake, x):
    cx, cy, rx, ry, z = LAKES[lake]
    t = max(-0.95, min(0.95, (x - cx) / (rx + 0.1)))
    return cy - (ry + 0.1) * math.sqrt(1 - t * t) * 0.92 - 0.035


for k, x in enumerate((-0.42, -0.12, 0.2, 0.5)):
    falls(f'upperfalls{k}', x, front_y(0, x), 0.52, 0.31, 0.16 if k % 2 else 0.22)
for k, x in enumerate((-0.6, -0.25, 0.12, 0.45)):
    falls(f'lowerfalls{k}', x, front_y(1, x), 0.32, 0.11, 0.16 if k % 2 else 0.22)

# ---------- a boardwalk zigzagging across the lowest lake ----------
PATH = [(-0.9, -0.5), (-0.45, -0.72), (-0.05, -0.48), (0.35, -0.75), (0.8, -0.55)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(PATH, PATH[1:])):
    a = math.atan2(y1 - y0, x1 - x0)
    length = math.hypot(x1 - x0, y1 - y0)
    box(f'boardwalk{k}', M['planks'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.125, length + 0.05, 0.07, 0.015, rot_z=a, outline=0.008, bevel=0)

# ---------- the forest all round ----------
for k in range(14):
    a = 2 * math.pi * k / 14 + 0.2
    r = rng.uniform(1.12, 1.3)
    x, y = r * math.cos(a), r * math.sin(a)
    h = rng.uniform(0.3, 0.42)
    rod(f'tree{k}', M['forest'], (x, y, G), (x, y, G + h), 0.09, r2=0.0, segs=8, outline=0.02)

turn(before, -20)
render(G)
