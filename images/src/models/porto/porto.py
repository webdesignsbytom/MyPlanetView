# A cartoon Porto for the country maps, built in the set's shared look (../toon.py): the Ribeira's
# tall narrow houses in every colour stacked up the bank of the Douro, the Dom Luís I bridge's great
# iron arch with its two decks, the rabelo boats with their square sails and wine barrels, and the
# port lodges on the far bank. Turned a little towards the camera.
# Run: blender -b --factory-startup -P porto.py -- porto-1024.png 1024 porto.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'douro': toon('douro', '#3a7a9a', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'bank': toon('bank', '#a89a86', shadow_mul=(0.84, 0.84, 0.9)),
    'h0': toon('h0', '#f0c050'), 'h1': toon('h1', '#e8806a'), 'h2': toon('h2', '#3fa8b0'), 'h3': toon('h3', '#f2ece0', lift=0.2), 'h4': toon('h4', '#c8503a'),
    'h5': toon('h5', '#a8c890'),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#3a3640'),
    'iron': toon('iron', '#5a5e66', shadow_mul=(0.8, 0.82, 0.9)),
    'rabelo': toon('rabelo', '#7a5236'),
    'sail': toon('sail', '#f4ece0', lift=0.2),
    'barrel': toon('barrel', '#8a5a3a'),
    'lodge': toon('lodge', '#f2ece0', lift=0.2),
})

G = tile(M['douro'])
before = set(bpy.data.objects)
rng = random.Random(1987)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the Ribeira bank, stepping up behind ----------
TIERS = [(0.15, 0.05), (0.33, 0.15), (0.5, 0.25), (0.68, 0.35)]
for i, (c, z) in enumerate(TIERS):
    t = loft(f'bank{i}', M['bank'], [segment(c, 1.39 - i * 0.02, -0.01), segment(c + 0.01, 1.385 - i * 0.02, z)], outline=0.01)
    t.visible_shadow = False
    n = 9 - i
    half = math.sqrt(max(0.0, (1.3 - i * 0.04) ** 2 - (c + 0.08) ** 2)) - 0.08
    for j in range(n):
        x = -half + (j + 0.5) * 2 * half / n
        y = c + 0.08
        h = rng.uniform(0.15, 0.24)
        w = 2 * half / n - 0.01
        box(f'house{i}{j}', M[f'h{(i + j) % 6}'], x, y, G + z - 0.005, w, 0.12, h, outline=0.007, bevel=0)
        box(f'houseroof{i}{j}', M['roof'], x, y + 0.01, G + z + h - 0.008, w + 0.005, 0.12, 0.025, outline=0.003, bevel=0)
        for row in range(int(h / 0.06)):
            box(f'housewin{i}{j}{row}', M['window'], x, y - 0.062, G + z + 0.03 + row * 0.06, w * 0.4, 0.006, 0.03, outline=0, bevel=0)

# ---------- the Dom Luís I bridge ----------
BX = 0.75
for s in (-1, 1):
    box(f'pylon{s}', M['iron'], BX, s * 0.55, G - 0.01, 0.08, 0.06, 0.48, outline=0.008, bevel=0)
pts = [(BX, -0.55 + 1.1 * t, G + 0.48 * math.sin(math.pi * t) * 0.85 + 0.02) for t in (j / 14 for j in range(15))]
for side in (-0.035, 0.035):
    for j in range(14):
        bar(f'arch{side}{j}', M['iron'], (pts[j][0] + side, pts[j][1], pts[j][2]), (pts[j + 1][0] + side, pts[j + 1][1], pts[j + 1][2]), 0.024, outline=0.004)
box('upperdeck', M['iron'], BX, 0.0, G + 0.45, 0.1, 1.3, 0.025, outline=0.005, bevel=0)
box('lowerdeck', M['iron'], BX, 0.0, G + 0.08, 0.1, 1.2, 0.025, outline=0.005, bevel=0)
for j in range(1, 14, 2):
    if pts[j][2] < G + 0.45:
        bar(f'hanger{j}', M['iron'], (BX, pts[j][1], pts[j][2]), (BX, pts[j][1], G + 0.45), 0.008, outline=0)

# ---------- rabelo boats and the far bank's lodges ----------
for k, (x, y) in enumerate(((-0.55, -0.3), (-0.05, -0.45), (0.35, -0.25))):
    loft(f'rabelo{k}', M['rabelo'], [[(x - 0.14, y, G), (x + 0.1, y - 0.04, G), (x + 0.16, y, G), (x + 0.1, y + 0.04, G)],
                                     [(x - 0.18, y, G + 0.05), (x + 0.1, y - 0.05, G + 0.04), (x + 0.2, y, G + 0.06), (x + 0.1, y + 0.05, G + 0.04)]], outline=0.007)
    for j in range(3):
        cyl(f'barrel{k}{j}', M['barrel'], 0.02, 0.04, segs=10, outline=0.003, matrix=Matrix.Translation((x - 0.06 + j * 0.05, y, G + 0.04)))
    rod(f'mast{k}', M['rabelo'], (x + 0.05, y, G + 0.04), (x + 0.05, y, G + 0.26), 0.005, segs=5, outline=0)
    box(f'sail{k}', M['sail'], x + 0.05, y, G + 0.12, 0.008, 0.12, 0.12, outline=0.003, bevel=0)
for k in range(4):
    a = math.radians(225 + k * 25)
    x, y = 1.28 * math.cos(a), 1.2 * math.sin(a)
    box(f'lodge{k}', M['lodge'], x, y, G - 0.005, 0.2, 0.12, 0.08, rot_z=a + math.pi / 2, outline=0.007, bevel=0)
    pyramid(f'lodgeroof{k}', M['roof'], x, y, G + 0.075, 0.2, 0.04, outline=0.004)

turn(before, -20)
render(G)
