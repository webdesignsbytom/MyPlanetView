# A cartoon Tyre for the country maps, built in the set's shared look (../toon.py): the Roman city on
# Lebanon's coast, the long colonnaded road paved in stone with its rows of green marble columns,
# some still whole with their capitals, some broken, running to the great triumphal arch, the long
# hippodrome's stands with the spina and its obelisk beside it, and the Mediterranean beyond.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P tyre.py -- tyre-1024.png 1024 tyre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8c49a', shadow_mul=(0.8, 0.8, 0.84), lift=0.18),
    'road': toon('road', '#ddd4bc', lift=0.18),
    'stone': toon('stone', '#e0d2b4', shadow_mul=(0.82, 0.82, 0.88), lift=0.18),
    'marble': toon('marble', '#8aa49a', lift=0.15),
    'white': toon('white', '#f2eee6', lift=0.22),
    'water': toon('water', '#3a92c8', lift=0.3),
    'dark': flat('dark', '#3a322a'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(116)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the sea beyond ----------
loft('sea', M['water'], [strip(0.82, 1.31, 1.32, G - 0.004), strip(0.82, 1.31, 1.32, G + 0.008)], outline=0.002)

# ---------- the colonnaded road ----------
RX = -0.25
box('road', M['road'], RX, -0.15, G - 0.004, 0.24, 1.5, 0.012, outline=0.001, bevel=0)
for s in (-1, 1):
    for k in range(10):
        y = -0.85 + k * 0.13
        if math.hypot(RX + s * 0.15, y) > 1.2:
            continue
        whole = rng.random() < 0.6
        h = 0.3 if whole else 0.08 + 0.12 * rng.random()
        box(f'colbase{s}{k}', M['white'], RX + s * 0.15, y, G - 0.005, 0.045, 0.045, 0.025, outline=0.002, bevel=0)
        rod(f'col{s}{k}', M['marble'], (RX + s * 0.15, y, G + 0.02), (RX + s * 0.15, y, G + 0.02 + h), 0.017, segs=10, outline=0.002)
        if whole:
            box(f'capital{s}{k}', M['white'], RX + s * 0.15, y, G + 0.02 + h, 0.05, 0.05, 0.03, outline=0.002, bevel=0)
    for k in range(3):
        box(f'drum{s}{k}', M['marble'], RX + s * 0.25, -0.6 + k * 0.4, G - 0.005, 0.03, 0.09, 0.03, rot_z=rng.random(), outline=0.002, bevel=0)

# ---------- the triumphal arch ----------
AY = 0.6
for s in (-1, 1):
    box(f'archpier{s}', M['stone'], RX + s * 0.13, AY, G - 0.005, 0.1, 0.13, 0.42, outline=0.006, bevel=0)
SPAN = 0.16
for j in range(8):
    um = (j + 0.5) / 8
    z = G + 0.28 + 0.08 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
    box(f'archslice{j}', M['stone'], RX - SPAN / 2 + SPAN * um, AY, z, SPAN / 8 + 0.002, 0.13, G + 0.415 - z, outline=0.002, bevel=0)
box('attic', M['stone'], RX, AY, G + 0.41, 0.38, 0.14, 0.06, outline=0.005, bevel=0)
box('cornice', M['white'], RX, AY, G + 0.395, 0.4, 0.15, 0.018, outline=0.002, bevel=0)

# ---------- the hippodrome ----------
HX0, HX1, HY0, HY1 = 0.3, 0.95, -0.75, 0.45
for k, x in enumerate((HX0, HX1)):
    inner = x + (0.12 if k == 0 else -0.12)
    xa, xb = sorted((x, inner))
    loft(f'stands{k}', M['stone'], [[(xa, HY0, G - 0.005), (xb, HY0, G - 0.005), (xb, HY1, G - 0.005), (xa, HY1, G - 0.005)],
                                              [(x - (0.0 if k == 0 else 0.02), HY0, G + 0.12), (x + (0.02 if k == 0 else 0.0), HY0, G + 0.12), (x + (0.02 if k == 0 else 0.0), HY1, G + 0.12), (x - (0.0 if k == 0 else 0.02), HY1, G + 0.12)]], outline=0.004)
box('spina', M['stone'], (HX0 + HX1) / 2, (HY0 + HY1) / 2, G - 0.005, 0.05, 0.8, 0.04, outline=0.003, bevel=0)
lathe('obelisk', M['white'], ((0.02, 0), (0.014, 0.2), (0.0, 0.23)), G + 0.035, (HX0 + HX1) / 2, (HY0 + HY1) / 2, segs=4, outline=0.002, smooth=False)
for s in (-1, 1):
    lathe(f'meta{s}', M['white'], ((0.025, 0), (0.0, 0.08)), G + 0.035, (HX0 + HX1) / 2, (HY0 + HY1) / 2 + s * 0.38, segs=8, outline=0.002, smooth=False)

for k, (x, y) in enumerate(((-0.75, 0.3), (-0.85, -0.3), (-0.7, 0.65))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.02 + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.29)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
