# A cartoon Patmos for the country maps, built in the set's shared look (../toon.py): the island's
# hilltop Chora with the fortress-like Monastery of St John the Theologian, its grey battlemented
# walls and buttresses crowning the hill, the white cube houses of the village tumbling round it,
# the old windmills on the ridge, and the Aegean all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P patmos.py -- patmos-1024.png 1024 patmos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'land': toon('land', '#c8b888', shadow_mul=(0.84, 0.82, 0.78)),
    'scrub': toon('scrub', '#9aa060'),
    'stone': toon('stone', '#9a948a', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'stoneDark': toon('stoneDark', '#7a746a'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'blue': toon('blue', '#2a6ab8', lift=0.12),
    'thatch': toon('thatch', '#8a6a4a'),
    'wood': toon('wood', '#6a5a48'),
    'dark': flat('dark', '#2e2a28'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(2543)


def oval(cx, cy, rx, ry, z, k, sides=28):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


isl = loft('island', M['land'], [oval(0.0, 0.1, 1.05, 0.82, -0.01, 1), oval(0.0, 0.1, 0.95, 0.72, 0.06, 1), oval(0.0, 0.2, 0.55, 0.42, 0.2, 1), oval(0.0, 0.22, 0.32, 0.26, 0.26, 1)], outline=0.01, smooth=True)
isl.visible_shadow = False


def ground(x, y):
    d = math.hypot(x / 0.95, (y - 0.15) / 0.72)
    if d > 1:
        return G
    return G + 0.06 + 0.2 * max(0.0, min(1.0, (1 - d) / 0.55))


T = G + 0.26
# ---------- the monastery ----------
MX, MY = 0.0, 0.22
box('monastery', M['stone'], MX, MY, T - 0.03, 0.32, 0.26, 0.2, outline=0.008, bevel=0)
for j in range(8):
    box(f'merlon{j}', M['stoneDark'], MX - 0.14 + j * 0.04, MY - 0.12, T + 0.165, 0.022, 0.022, 0.03, outline=0.001, bevel=0)
for j in range(4):
    x = MX - 0.12 + j * 0.08
    loft(f'buttress{j}', M['stoneDark'], [[(x - 0.02, MY - 0.17, T - 0.03), (x + 0.02, MY - 0.17, T - 0.03), (x + 0.02, MY - 0.13, T - 0.03), (x - 0.02, MY - 0.13, T - 0.03)],
                                          [(x - 0.015, MY - 0.135, T + 0.15), (x + 0.015, MY - 0.135, T + 0.15), (x + 0.015, MY - 0.13, T + 0.15), (x - 0.015, MY - 0.13, T + 0.15)]], outline=0.002)
box('monasterydoor', M['dark'], MX + 0.04, MY - 0.133, T - 0.03, 0.03, 0.006, 0.06, outline=0, bevel=0)
box('belfry', M['white'], MX + 0.1, MY + 0.06, T + 0.165, 0.06, 0.06, 0.08, outline=0.003, bevel=0)
box('belfryarch', M['dark'], MX + 0.1, MY + 0.028, T + 0.19, 0.025, 0.006, 0.035, outline=0, bevel=0)
lathe('chapeldome', M['blue'], ((0.035, 0), (0.03, 0.025), (0.004, 0.045)), T + 0.165, MX - 0.08, MY + 0.05, segs=12, outline=0.002)

# ---------- the Chora ----------
spots = []
for k in range(200):
    x, y = rng.uniform(-0.75, 0.75), rng.uniform(-0.45, 0.72)
    d = math.hypot(x / 0.9, (y - 0.15) / 0.68)
    if d > 0.95 or math.hypot(x - MX, y - MY) < 0.25 or any(math.hypot(x - px, y - py) < 0.11 for px, py in spots):
        continue
    spots.append((x, y))
    z = ground(x, y)
    h = rng.uniform(0.05, 0.08)
    box(f'house{k}', M['white'], x, y, z - 0.03, 0.09, 0.08, h + 0.03, outline=0.003, bevel=0)
    box(f'housedoor{k}', M['blue'], x, y - 0.043, z - 0.005, 0.02, 0.006, 0.035, outline=0, bevel=0)
    if len(spots) >= 30:
        break

# ---------- windmills on the ridge ----------
for k, (x, y) in enumerate(((0.45, 0.45), (0.58, 0.32), (0.66, 0.18))):
    z = ground(x, y)
    lathe(f'mill{k}', M['white'], ((0.035, 0), (0.03, 0.11)), z - 0.01, x, y, segs=12, outline=0.003)
    lathe(f'millcap{k}', M['thatch'], ((0.036, 0), (0.004, 0.04)), z + 0.1, x, y, segs=12, outline=0.002)
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        bar(f'sail{k}{j}', M['wood'], (x, y - 0.035, z + 0.09), (x + 0.08 * math.cos(a), y - 0.04, z + 0.09 + 0.08 * math.sin(a)), 0.012, outline=0.001)
for k in range(12):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.55, 0.85)
    d = math.hypot(x / 0.95, (y - 0.15) / 0.72)
    if 0.75 < d < 0.98:
        ball(f'scrub{k}', M['scrub'], x, y, ground(x, y) + 0.01, 0.035, outline=0.003)

turn(before, -20)
render(G)
