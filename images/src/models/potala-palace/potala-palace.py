# A cartoon Potala Palace for the country maps, built in the set's shared look (../toon.py): the
# Dalai Lamas' palace climbing the Red Hill over Lhasa, the White Palace's sloping walls and rows of
# windows, the Red Palace rising in the middle under its golden roofs, the zigzag stairs up the
# hill, prayer flags, and poplars on the plain. Turned a little towards the camera.
# Run: blender -b --factory-startup -P potala-palace.py -- potala-palace-1024.png 1024 potala-palace.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#c8b88a', shadow_mul=(0.86, 0.8, 0.74), lift=0.25),
    'hill': toon('hill', '#8a7a62', shadow_mul=(0.84, 0.8, 0.8)),
    'white': toon('white', '#f6f3ea', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'red': toon('red', '#8a2a24'),
    'gold': toon('gold', '#f0b830', shadow_mul=(0.8, 0.66, 0.56), lift=0.35),
    'window': flat('window', '#2e2a30'),
    'stairs': toon('stairs', '#ece6d8', lift=0.2),
    'poplar': toon('poplar', '#7a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'f0': toon('f0', '#2f6fc0'), 'f1': toon('f1', '#f8f6f0'), 'f2': toon('f2', '#d83a2c'), 'f3': toon('f3', '#3f9a4a'), 'f4': toon('f4', '#f0c030'),
    'string': flat('string', '#6a5a4a'),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(1409)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def battered(name, mat, x, y, z, w, d, h, lean=0.03):
    # a block whose walls slope inwards as they rise, as Tibetan walls do
    return loft(name, M[mat], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                               [(x - w / 2 + lean, y - d / 2 + lean, z + h), (x + w / 2 - lean, y - d / 2 + lean, z + h), (x + w / 2 - lean, y + d / 2 - lean, z + h),
                                (x - w / 2 + lean, y + d / 2 - lean, z + h)]], outline=0.012)


# ---------- the Red Hill ----------
hill = loft('hill', M['hill'], [ring(0.0, 0.45, 1.05, 0.6, -0.01, 1), ring(0.0, 0.5, 0.75, 0.42, 0.12, 1), ring(0.0, 0.55, 0.55, 0.3, 0.2, 1)], outline=0.016, smooth=True)
hill.visible_shadow = False

# ---------- the White Palace, in stepped wings ----------
battered('whitebase', 'white', 0.0, 0.35, G + 0.05, 1.25, 0.34, 0.2, lean=0.04)
battered('whiteleft', 'white', -0.45, 0.45, G + 0.24, 0.42, 0.26, 0.15)
battered('whiteright', 'white', 0.45, 0.45, G + 0.24, 0.42, 0.26, 0.15)
for row in range(3):
    for j in range(14):
        x = -0.56 + j * 0.086
        if row == 2 and abs(x) < 0.2:
            continue
        z = G + 0.09 + row * 0.07 if row < 2 else G + 0.3
        y = 0.35 - 0.17 + 0.008 + (0.0 if row < 2 else 0.1)
        if row == 2 and abs(x) > 0.62:
            continue
        box(f'win{row}{j}', M['window'], x, y - 0.012 * row, z, 0.028, 0.006, 0.03, outline=0, bevel=0)

# ---------- the Red Palace in the middle, golden roofs on top ----------
battered('redpalace', 'red', 0.0, 0.48, G + 0.24, 0.4, 0.28, 0.26, lean=0.025)
box('redtrim', M['white'], 0.0, 0.48, G + 0.49, 0.36, 0.24, 0.025, outline=0.005, bevel=0)
for row in range(2):
    for j in range(5):
        box(f'redwin{row}{j}', M['window'], -0.13 + j * 0.065, 0.344 + 0.004 * row, G + 0.31 + row * 0.08, 0.026, 0.006, 0.04, outline=0, bevel=0)
for k, (x, s) in enumerate(((-0.1, 0.11), (0.1, 0.11), (0.0, 0.13))):
    yy = 0.5 if k < 2 else 0.56
    box(f'goldbase{k}', M['red'], x, yy, G + 0.51, s, s, 0.03, outline=0.005, bevel=0)
    pyramid(f'goldroof{k}', M['gold'], x, yy, G + 0.54, s + 0.03, 0.07, outline=0.006)
    lathe(f'goldfinial{k}', M['gold'], ((0.012, 0), (0.004, 0.04)), G + 0.6, x, yy, segs=8, outline=0.002)

# ---------- the zigzag stairs up the front, prayer flags, poplars ----------
ZIG = [(-0.85, -0.25, 0.0), (-0.45, -0.12, 0.06), (-0.75, 0.05, 0.1), (-0.55, 0.15, 0.13)]
for k in range(len(ZIG) - 1):
    (x0, y0, z0), (x1, y1, z1) = ZIG[k], ZIG[k + 1]
    bar(f'stairs{k}', M['stairs'], (x0, y0, G + z0 + 0.015), (x1, y1, G + z1 + 0.015), 0.045, outline=0.004)
p0, p1 = (0.65, 0.2, G + 0.3), (1.05, -0.35, G + 0.05)
bar('flagstring', M['string'], p0, p1, 0.004, outline=0)
for j in range(8):
    f = (j + 0.5) / 8
    x, y, z = (p0[i] + (p1[i] - p0[i]) * f for i in range(3))
    box(f'flag{j}', M[f'f{j % 5}'], x, y, z - 0.035, 0.03, 0.006, 0.03, rot_z=math.atan2(p1[1] - p0[1], p1[0] - p0[0]), outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.4, -0.65), (0.1, -0.75), (0.55, -0.6), (-0.95, -0.45), (0.95, -0.55))):
    lathe(f'poplar{k}', M['poplar'], ((0.04, 0), (0.045, 0.07), (0.03, 0.18), (0.004, 0.26)), G, x, y, segs=10, outline=0.006)

turn(before, -20)
render(G)
