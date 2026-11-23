# A cartoon Lake Baikal for the country maps, built in the set's shared look (../toon.py): the
# lake's clear turquoise winter ice cracked into great plates, Shaman Rock's two pale crags on the
# shore of Olkhon Island, the steppe hills of the island, and the serge, the ritual posts hung with
# coloured ribbons. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lake-baikal.py -- lake-baikal-1024.png 1024 lake-baikal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ice': toon('ice', '#8ad8e0', shadow_mul=(0.78, 0.88, 0.94), lift=0.35),
    'crack': flat('crack', '#e8f8fc'),
    'hump': toon('hump', '#b8e8f0', shadow_mul=(0.8, 0.9, 0.96), lift=0.3),
    'steppe': toon('steppe', '#b8a870', shadow_mul=(0.84, 0.82, 0.74)),
    'snow': toon('snow', '#f8fafc', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'rock': toon('rock', '#d8d0c4', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'lichen': toon('lichen', '#d8903a'),
    'post': toon('post', '#8a6448'),
    'r0': toon('r0', '#2f6fc0'), 'r1': toon('r1', '#f0c030'), 'r2': toon('r2', '#e8402c'), 'r3': toon('r3', '#f8f6f0', lift=0.2), 'r4': toon('r4', '#3f9a4a'),
})

G = tile(M['ice'])
before = set(bpy.data.objects)
rng = random.Random(2003)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the cracks in the ice and the pressure ridges ----------
for k in range(16):
    x0, y0 = rng.uniform(-1.0, 1.0), rng.uniform(-0.9, 0.2)
    if math.hypot(x0, y0) > 1.15:
        continue
    a = rng.uniform(0, math.pi)
    L = rng.uniform(0.2, 0.45)
    pts = [(x0, y0)]
    for j in range(3):
        a += rng.uniform(-0.6, 0.6)
        pts.append((pts[-1][0] + L / 3 * math.cos(a), pts[-1][1] + L / 3 * math.sin(a)))
    for j in range(3):
        bar(f'crack{k}{j}', M['crack'], (pts[j][0], pts[j][1], G + 0.001), (pts[j + 1][0], pts[j + 1][1], G + 0.001), 0.012, outline=0)
for k in range(5):
    x, y = -0.7 + k * 0.32, -0.55 + 0.1 * math.sin(k)
    lathe(f'hump{k}', M['hump'], ((0.07, 0), (0.04, 0.04), (0.004, 0.06)), G - 0.005, x, y, segs=5, outline=0.005, smooth=False)

# ---------- Olkhon's shore and steppe hills ----------
sh = loft('shore', M['steppe'], [segment(0.25, 1.4, -0.01), segment(0.32, 1.38, 0.08), segment(0.55, 1.27, 0.2), segment(0.75, 1.12, 0.24)], outline=0.016, smooth=True)
sh.visible_shadow = False
sn = loft('snowpatches', M['snow'], [segment(0.6, 1.24, 0.21), segment(0.76, 1.11, 0.245)], outline=0.008, smooth=True)
sn.visible_shadow = False

# ---------- Shaman Rock ----------
for k, (x, y, r, h) in enumerate(((-0.25, 0.25, 0.18, 0.42), (0.05, 0.22, 0.15, 0.34))):
    lathe(f'shamanrock{k}', M['rock'], ((r, 0), (r * 0.9, h * 0.4), (r * 0.6, h * 0.8), (r * 0.25, h)), G - 0.01, x, y, segs=7, outline=0.014, smooth=False)
    bar(f'lichen{k}', M['lichen'], (x - r * 0.5, y - r * 0.85, G + h * 0.3), (x - r * 0.3, y - r * 0.7, G + h * 0.75), 0.05, outline=0)

# ---------- the serge posts with ribbons ----------
for k in range(9):
    x = 0.4 + (k % 3) * 0.12
    y = 0.4 + (k // 3) * 0.1
    rod(f'serge{k}', M['post'], (x, y, G + 0.08), (x, y, G + 0.3), 0.01, segs=6, outline=0.003)
    for j in range(3):
        bar(f'ribbon{k}{j}', M[f'r{(k + j) % 5}'], (x, y, G + 0.27 - j * 0.04), (x + 0.04, y - 0.015, G + 0.24 - j * 0.04), 0.012, outline=0)

turn(before, -20)
render(G)
