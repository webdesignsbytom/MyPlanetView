# A cartoon of The Baths for the country maps, built in the set's shared look (../toon.py): the giant
# granite boulders piled on the white beach of Virgin Gorda, the clear pools and channels between
# them, palms and sea grape behind, swimmers in the turquoise water, and a sailboat at anchor.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P the-baths.py -- the-baths-1024.png 1024 the-baths.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3ec4cc', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'sand': toon('sand', '#f6eedc', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'granite': toon('granite', '#cbbfa8', shadow_mul=(0.82, 0.8, 0.86), lift=0.15),
    'graniteDark': toon('graniteDark', '#b0a28a', shadow_mul=(0.82, 0.8, 0.86), lift=0.1),
    'pool': toon('pool', '#6ad6d6', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'bush': toon('bush', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'skin': toon('skin', '#e0a882'),
    'cap0': toon('cap0', '#e8402c'), 'cap1': toon('cap1', '#f0c030'),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'mast': toon('mast', '#b7bcc4'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1201)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the beach and the green behind it ----------
beach = loft('beach', M['sand'], [ring(0.0, 0.42, 1.12, 0.78, -0.01, 1), ring(0.0, 0.43, 1.08, 0.75, 0.03, 1)], outline=0.014, smooth=True)
beach.visible_shadow = False
for k in range(10):
    t = math.radians(25 + k * 14)
    ball(f'seagrape{k}', M['bush'], 0.95 * math.cos(t), 0.42 + 0.62 * math.sin(t), G + 0.09, rng.uniform(0.07, 0.09), outline=0.012)
for k, (x, y) in enumerate(((-0.75, 0.75), (0.65, 0.85), (0.0, 1.05), (-0.35, 0.95))):
    hgt = rng.uniform(0.3, 0.36)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.03), (x + 0.03, y, G + hgt), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + hgt), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + hgt - 0.05), 0.019, outline=0.005)

# ---------- the pools between the boulders ----------
for k, (x, y, rx, ry) in enumerate(((-0.1, 0.0, 0.2, 0.1), (0.42, 0.1, 0.14, 0.08))):
    cyl(f'pool{k}', M['pool'], 1.0, 0.012, segs=20, outline=0.004,
        matrix=Matrix.Translation((x, y, G + 0.025)) @ Matrix.Scale(rx, 4, Vector((1, 0, 0))) @ Matrix.Scale(ry, 4, Vector((0, 1, 0))))

# ---------- the boulders, piled ----------
BOULDERS = [(-0.6, 0.2, 0.0, 0.26, 1.15, 1.0, 0.85), (-0.3, 0.35, 0.0, 0.22, 1.1, 0.95, 0.9), (-0.42, 0.25, 0.22, 0.16, 1.2, 1.0, 0.8),
            (0.05, 0.3, 0.0, 0.24, 1.2, 1.0, 0.9), (0.35, 0.42, 0.0, 0.2, 1.0, 1.0, 0.95), (0.18, 0.28, 0.24, 0.15, 1.3, 1.0, 0.75),
            (0.65, 0.25, 0.0, 0.18, 1.1, 0.9, 0.9), (0.3, -0.15, -0.02, 0.15, 1.25, 1.0, 0.8), (-0.35, -0.2, -0.02, 0.13, 1.2, 1.0, 0.85),
            (-0.85, -0.05, -0.02, 0.12, 1.1, 1.0, 0.8), (0.85, -0.1, -0.02, 0.1, 1.2, 1.0, 0.85), (-0.05, -0.4, -0.04, 0.09, 1.2, 1.0, 0.7)]
for k, (x, y, z, r, sx, sy, sz) in enumerate(BOULDERS):
    squashed(f'boulder{k}', M['granite' if k % 3 else 'graniteDark'], x, y, G + z + r * sz * 0.7, r, sx, sy, sz, outline=0.016)

# ---------- swimmers and a sailboat ----------
for k, (x, y) in enumerate(((0.1, -0.7), (-0.6, -0.6))):
    ball(f'swimmer{k}', M['skin'], x, y, G + 0.01, 0.025, outline=0.004)
    squashed(f'swimcap{k}', M[f'cap{k}'], x, y, G + 0.02, 0.026, 1.0, 1.0, 0.6, outline=0.004)
BX, BY = 0.6, -0.75
loft('boathull', M['hull'], [[(BX - 0.1, BY, G - 0.002), (BX + 0.06, BY - 0.028, G - 0.002), (BX + 0.12, BY, G - 0.002), (BX + 0.06, BY + 0.028, G - 0.002)],
                             [(BX - 0.11, BY, G + 0.035), (BX + 0.06, BY - 0.036, G + 0.035), (BX + 0.14, BY, G + 0.035), (BX + 0.06, BY + 0.036, G + 0.035)]], outline=0.007)
rod('boatmast', M['mast'], (BX, BY, G + 0.035), (BX, BY, G + 0.34), 0.005, segs=6, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
