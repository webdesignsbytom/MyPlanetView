# A cartoon Santorini for the country maps, built in the set's shared look (../toon.py): Oia on the
# rim of the caldera, its white cave houses stacked down the banded volcanic cliff, the blue domes
# of its churches and a white bell tower, a windmill on the top, and the deep blue Aegean below.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P santorini.py -- santorini-1024.png 1024 santorini.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#1f5ab0', shadow_mul=(0.76, 0.82, 0.92), lift=0.3),
    'cliffRed': toon('cliffRed', '#a8503a', shadow_mul=(0.86, 0.76, 0.74)),
    'cliffDark': toon('cliffDark', '#5a4448', shadow_mul=(0.84, 0.82, 0.86)),
    'cliffTan': toon('cliffTan', '#c8a078', shadow_mul=(0.86, 0.8, 0.76)),
    'white': toon('white', '#fbfbf8', shadow_mul=(0.8, 0.84, 0.92), lift=0.12),
    'blue': toon('domeBlue', '#1f6ad0', lift=0.2),
    'door': toon('door', '#2f8ad8'),
    'window': flat('window', '#2e3a54'),
    'thatch': toon('thatch', '#a88050'),
    'sail': toon('sail', '#f8f6f0', lift=0.2),
    'bell': toon('bell', '#d8a030', lift=0.3),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(2147)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the caldera cliff in bands ----------
for i, (c, z0, z1, mat) in enumerate(((-0.75, -0.01, 0.12, 'cliffDark'), (-0.5, 0.12, 0.24, 'cliffRed'), (-0.25, 0.24, 0.36, 'cliffTan'), (0.0, 0.36, 0.42, 'cliffRed'))):
    b = loft(f'cliff{i}', M[mat], [segment(c, 1.35, z0), segment(c + 0.02, 1.34, z1)], outline=0.012)
    b.visible_shadow = False
up = loft('upper', M['cliffTan'], [segment(0.15, 1.31, 0.41), segment(0.18, 1.29, 0.58)], outline=0.012)
up.visible_shadow = False


def house(name, x, y, z, w, h):
    box(name, M['white'], x, y, z - 0.005, w, 0.14, h, outline=0.007, bevel=0)
    box(f'{name}door', M['door'], x - w * 0.2, y - 0.072, z - 0.005, w * 0.24, 0.006, h * 0.6, outline=0.002, bevel=0)
    box(f'{name}win', M['window'], x + w * 0.22, y - 0.072, z + h * 0.45, w * 0.18, 0.006, h * 0.22, outline=0, bevel=0)
    if rng.random() < 0.5:
        lathe(f'{name}roof', M['white'], ((w * 0.45, 0), (w * 0.4, 0.025), (0.004, 0.04)), z + h - 0.01, x, y, segs=14, outline=0.004)


def church(name, x, y, z, s):
    box(name, M['white'], x, y, z - 0.005, 0.16 * s, 0.16 * s, 0.12 * s, outline=0.007, bevel=0)
    lathe(f'{name}drum', M['white'], ((0.065 * s, 0), (0.065 * s, 0.03 * s)), z + 0.115 * s, x, y, segs=16, outline=0.004)
    lathe(f'{name}dome', M['blue'], ((0.07 * s, 0), (0.065 * s, 0.035 * s), (0.04 * s, 0.07 * s), (0.004, 0.09 * s)), z + 0.14 * s, x, y, segs=18, outline=0.006)
    rod(f'{name}cross', M['white'], (x, y, z + 0.225 * s), (x, y, z + 0.27 * s), 0.004, segs=4, outline=0)


# terraces down the cliff, each with a row of houses
for t, (y, z, n) in enumerate(((-0.67, 0.12, 6), (-0.42, 0.24, 7), (-0.17, 0.36, 7), (0.25, 0.58, 6))):
    for k in range(n):
        x = -1.0 + (k + 0.5) * 2.0 / n + rng.uniform(-0.03, 0.03)
        if math.hypot(x, y) > 1.12:
            continue
        if (t, k) in ((1, 2), (2, 5), (3, 3)):
            church(f'church{t}{k}', x, y, G + z, 1.15)
        else:
            house(f'house{t}{k}', x, y, G + z, rng.uniform(0.14, 0.2), rng.uniform(0.08, 0.11))

# ---------- the bell tower and the windmill ----------
BX, BY = 0.35, 0.5
box('belltower', M['white'], BX, BY, G + 0.575, 0.12, 0.08, 0.22, outline=0.006, bevel=0)
box('bellarch', M['window'], BX, BY - 0.042, G + 0.67, 0.06, 0.006, 0.08, outline=0, bevel=0)
ball('bell', M['bell'], BX, BY - 0.02, G + 0.7, 0.02, outline=0.003)
lathe('belltop', M['blue'], ((0.05, 0), (0.004, 0.06)), G + 0.79, BX, BY, segs=10, outline=0.004)
WX, WY = -0.55, 0.6
lathe('windmill', M['white'], ((0.08, 0), (0.07, 0.22)), G + 0.575, WX, WY, segs=16, outline=0.006)
lathe('windmillroof', M['thatch'], ((0.085, 0), (0.004, 0.1)), G + 0.79, WX, WY, segs=16, outline=0.005)
for j in range(4):
    a = math.radians(20 + j * 90)
    hub = (WX, WY - 0.085, G + 0.75)
    tip = (WX + 0.2 * math.cos(a), WY - 0.085, G + 0.75 + 0.2 * math.sin(a))
    bar(f'windmillarm{j}', M['thatch'], hub, tip, 0.012, outline=0.002)
    mid = (WX + 0.13 * math.cos(a), WY - 0.09, G + 0.75 + 0.13 * math.sin(a))
    loft(f'windmillsail{j}', M['sail'], [[(hub[0] + 0.04 * math.cos(a), WY - 0.088, hub[2] + 0.04 * math.sin(a)), (tip[0], WY - 0.088, tip[2]), (mid[0] - 0.05 * math.sin(a), WY - 0.088, mid[2] + 0.05 * math.cos(a))],
                                         [(hub[0] + 0.04 * math.cos(a), WY - 0.094, hub[2] + 0.04 * math.sin(a)), (tip[0], WY - 0.094, tip[2]), (mid[0] - 0.05 * math.sin(a), WY - 0.094, mid[2] + 0.05 * math.cos(a))]],
         outline=0.002)

turn(before, -20)
render(G)
