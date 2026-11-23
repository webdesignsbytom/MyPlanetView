# A cartoon Sidi Bou Saïd for the country maps, built in the set's shared look (../toon.py): the
# village on its cliff over the Gulf of Tunis, white cube houses with their famous blue doors,
# windows and railings, little white domes, the square minaret, bougainvillea spilling over the
# walls, and the sea below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sidi-bou-said.py -- sidi-bou-said-1024.png 1024 sidi-bou-said.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'cliff': toon('cliff', '#d8b080', shadow_mul=(0.86, 0.78, 0.74)),
    'white': toon('white', '#f8f8f6', shadow_mul=(0.8, 0.84, 0.92), lift=0.15),
    'blue': toon('sbsBlue', '#1f78c8', lift=0.2),
    'bougainvillea': toon('bougainvillea', '#d83a9a', lift=0.2),
    'leaf': toon('leaf', '#4f8a40'),
    'window': flat('window', '#2e3a54'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(2043)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


low = loft('cliff', M['cliff'], [segment(-0.3, 1.4, -0.01), segment(-0.25, 1.38, 0.18)], outline=0.014)
low.visible_shadow = False
high = loft('upper', M['cliff'], [segment(0.3, 1.33, 0.17), segment(0.34, 1.3, 0.34)], outline=0.012)
high.visible_shadow = False


def house(name, x, y, z, w, d, h, dome=False):
    box(name, M['white'], x, y, z - 0.005, w, d, h, outline=0.007, bevel=0)
    box(f'{name}door', M['blue'], x - w * 0.2, y - d / 2 - 0.004, z - 0.005, w * 0.22, 0.008, h * 0.6, outline=0.002, bevel=0)
    box(f'{name}win', M['blue'], x + w * 0.22, y - d / 2 - 0.004, z + h * 0.45, w * 0.2, 0.008, h * 0.25, outline=0.002, bevel=0)
    box(f'{name}grille', M['window'], x + w * 0.22, y - d / 2 - 0.009, z + h * 0.5, w * 0.12, 0.004, h * 0.12, outline=0, bevel=0)
    if dome:
        lathe(f'{name}dome', M['white'], ((min(w, d) * 0.35, 0), (min(w, d) * 0.33, 0.03), (min(w, d) * 0.2, 0.07), (0.004, 0.09)), z + h - 0.01, x, y, segs=14, outline=0.005)


# lower terrace, over the sea
Z1 = G + 0.18
for k, (x, w, h) in enumerate(((-1.0, 0.22, 0.14), (-0.72, 0.26, 0.18), (-0.42, 0.22, 0.13), (-0.12, 0.28, 0.17), (0.2, 0.22, 0.14), (0.5, 0.26, 0.19), (0.8, 0.22, 0.13), (1.05, 0.18, 0.12))):
    y = -0.08 + 0.05 * math.sin(k * 1.3)
    if math.hypot(x, y + 0.1) > 1.2:
        continue
    house(f'lowhouse{k}', x, y, Z1, w, 0.18, h, dome=(k % 3 == 1))
    bar(f'railing{k}', M['blue'], (x - w / 2, y - 0.14, Z1 + 0.04), (x + w / 2, y - 0.14, Z1 + 0.04), 0.01, outline=0)
    if k % 2 == 0:
        for j in range(3):
            ball(f'bloom{k}{j}', M['bougainvillea'], x - w / 2 + 0.02 + j * 0.03, y - 0.1, Z1 + h - 0.02 - j * 0.03, 0.035, outline=0.004)
# upper terrace
Z2 = G + 0.34
for k, (x, w, h) in enumerate(((-0.8, 0.24, 0.16), (-0.5, 0.28, 0.2), (-0.2, 0.22, 0.15), (0.35, 0.26, 0.18), (0.65, 0.22, 0.15))):
    y = 0.5 + 0.04 * math.cos(k)
    house(f'highhouse{k}', x, y, Z2, w, 0.2, h, dome=(k % 2 == 0))
    if k % 2:
        for j in range(3):
            ball(f'highbloom{k}{j}', M['bougainvillea'], x + w / 2 - 0.02 - j * 0.03, y - 0.11, Z2 + h - 0.02 - j * 0.03, 0.035, outline=0.004)
# the minaret
MX, MY = 0.08, 0.55
box('minaret', M['white'], MX, MY, Z2 - 0.005, 0.11, 0.11, 0.4, outline=0.008, bevel=0)
box('minaretgallery', M['white'], MX, MY, Z2 + 0.39, 0.14, 0.14, 0.025, outline=0.005, bevel=0)
box('minarettop', M['white'], MX, MY, Z2 + 0.41, 0.08, 0.08, 0.08, outline=0.005, bevel=0)
lathe('minaretdome', M['white'], ((0.045, 0), (0.035, 0.03), (0.004, 0.07)), Z2 + 0.485, MX, MY, segs=10, outline=0.004)
for j in range(2):
    box(f'minaretwin{j}', M['blue'], MX, MY - 0.057, Z2 + 0.15 + j * 0.12, 0.03, 0.006, 0.06, outline=0, bevel=0)
for k, x in enumerate((-1.05, 1.0)):
    ball(f'shrub{k}', M['leaf'], x, 0.75, Z2 + 0.04, 0.08, outline=0.008)

turn(before, -20)
render(G)
