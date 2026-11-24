# A cartoon Antequera Dolmens for the country maps, built in the set's shared look (../toon.py): the
# Dolmen of Menga, a long gallery of enormous upright stone slabs roofed with huge capstones, opening
# from the side of its grassy round mound, the stone passage leading in, the olive groves round it,
# and La Peña de los Enamorados, the rock shaped like a sleeping face, on the skyline behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P antequera-dolmens.py -- antequera-dolmens-1024.png 1024 antequera-dolmens.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#9ac05a', shadow_mul=(0.74, 0.8, 0.76), lift=0.2),
    'mound': toon('mound', '#7aa84a', shadow_mul=(0.72, 0.8, 0.74)),
    'slab': toon('slab', '#b8ac94', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'slabDark': toon('slabDark', '#9a8e78'),
    'dark': flat('dark', '#2a2420'),
    'rock': toon('rock', '#a8987a', shadow_mul=(0.84, 0.82, 0.82)),
    'olive': toon('olive', '#8aa060', shadow_mul=(0.72, 0.8, 0.76)),
    'trunk': toon('trunk', '#6a4a36'),
    'path': toon('path', '#d8c8a8'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- La Peña de los Enamorados on the skyline ----------
pena = [(-0.75, 0.9, 0.0), (-0.55, 0.95, 0.38), (-0.25, 0.95, 0.44), (0.05, 0.95, 0.36), (0.35, 0.92, 0.42), (0.55, 0.9, 0.0)]
for k in range(len(pena) - 1):
    (x0, y0, z0), (x1, y1, z1) = pena[k], pena[k + 1]
    loft(f'pena{k}', M['rock'], [[(x0, y0 - 0.12, G - 0.01), (x1, y1 - 0.12, G - 0.01), (x1, y1 + 0.12, G - 0.01), (x0, y0 + 0.12, G - 0.01)],
                                 [(x0, y0 - 0.04, G + z0), (x1, y1 - 0.04, G + z1), (x1, y1 + 0.04, G + z1), (x0, y0 + 0.04, G + z0)]], outline=0.007)

# ---------- the mound with Menga inside it ----------
MX, MY = 0.05, 0.15
mo = lathe('mound', M['mound'], ((0.62, 0), (0.56, 0.08), (0.4, 0.2), (0.18, 0.26), (0.0, 0.27)), G - 0.01, MX, MY, segs=32, outline=0.008)
mo.visible_shadow = False
# the gallery's mouth: the uprights and the great capstone over the entrance, cut out of the mound's side
EY = MY - 0.55
box('entrancecut', M['grass'], MX, EY + 0.05, G - 0.005, 0.32, 0.3, 0.01, outline=0, bevel=0)
for s in (-1, 1):
    for j in range(3):
        y = EY - 0.02 + j * 0.1
        box(f'upright{s}{j}', M['slab'], MX + s * 0.1, y, G - 0.005, 0.05, 0.09, 0.2, outline=0.004, bevel=0)
for j in range(3):
    box(f'capstone{j}', M['slabDark'], MX, EY - 0.02 + j * 0.1, G + 0.19, 0.3, 0.1, 0.05, outline=0.005, bevel=0)
box('gallerydark', M['dark'], MX, EY - 0.068, G - 0.005, 0.15, 0.006, 0.19, outline=0, bevel=0)
# the earth banks either side of the cut, sloping into the mound
for s in (-1, 1):
    xi, xo = MX + s * 0.13, MX + s * 0.3
    foot = [(xi, EY - 0.08), (xo, EY - 0.08), (xo, EY + 0.3), (xi, EY + 0.3)]
    tops = [G + 0.2, G + 0.01, G + 0.18, G + 0.22]
    loft(f'cutbank{s}', M['mound'], [[(x, y, G - 0.01) for x, y in foot], [(x, y, z) for (x, y), z in zip(foot, tops)]], outline=0.004)
box('path', M['path'], MX, EY - 0.3, G - 0.004, 0.14, 0.42, 0.01, outline=0.001, bevel=0)

# ---------- olive groves ----------
rng = random.Random(3750)
for k in range(16):
    x, y = rng.uniform(-1.05, 1.05), rng.uniform(-1.0, 0.6)
    if math.hypot(x, y) > 1.15 or math.hypot(x - MX, y - MY) < 0.7 or abs(x - MX) < 0.25 and y < EY:
        continue
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.012, segs=6, outline=0.002)
    ball(f'olive{k}', M['olive'], x, y, G + 0.1, 0.075, outline=0.008)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
