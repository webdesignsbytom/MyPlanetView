# A cartoon Alhambra for the country maps, built in the set's shared look (../toon.py): the red
# fortress-palace along its wooded hill over Granada, the Alcazaba's towers at its point, the
# Comares tower, the long walls with their towers, cypresses, and the snowy Sierra Nevada behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P alhambra.py -- alhambra-1024.png 1024 alhambra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#c8b88a', shadow_mul=(0.86, 0.8, 0.74), lift=0.25),
    'hill': toon('hill', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'red': toon('alhambraRed', '#c87a52', shadow_mul=(0.86, 0.76, 0.72)),
    'redDark': toon('alhambraRedDark', '#a8603e', shadow_mul=(0.86, 0.76, 0.72)),
    'roof': toon('roof', '#b8503a'),
    'window': flat('window', '#3a2a24'),
    'mountain': toon('mountain', '#8a8a96', shadow_mul=(0.82, 0.82, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'cypress': toon('cypress', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(1481)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the Sierra Nevada behind ----------
for k, (x, y, r, h) in enumerate(((-0.7, 1.0, 0.42, 0.55), (-0.1, 1.08, 0.45, 0.68), (0.55, 1.02, 0.42, 0.58))):
    lathe(f'sierra{k}', M['mountain'], ((r, 0), (r * 0.5, h * 0.6), (0.004, h)), G - 0.01, x, y, segs=6, outline=0.014, smooth=False)
    lathe(f'sierrasnow{k}', M['snow'], ((r * 0.33, 0), (0.004, h * 0.42)), G - 0.01 + h * 0.6, x, y, segs=6, outline=0.008, smooth=False)

# ---------- the Sabika hill ----------
hill = loft('hill', M['hill'], [[(-1.25, -0.25, G - 0.01), (1.2, -0.1, G - 0.01), (1.15, 0.55, G - 0.01), (-1.15, 0.45, G - 0.01)],
                                [(-1.1, -0.15, G + 0.16), (1.05, 0.0, G + 0.16), (1.0, 0.45, G + 0.16), (-1.0, 0.38, G + 0.16)]], outline=0.016, smooth=True)
hill.visible_shadow = False
T = G + 0.16

# ---------- the walls and towers along the hilltop ----------
WALL = [(-0.95, -0.1), (-0.4, -0.05), (0.2, 0.02), (0.85, 0.1)]
for k in range(len(WALL) - 1):
    (x0, y0), (x1, y1) = WALL[k], WALL[k + 1]
    L = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'wall{k}', M['red'], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.01, L, 0.05, 0.12, rot_z=a, outline=0.01, bevel=0)
    for j in range(int(L / 0.06)):
        f = (j + 0.5) / int(L / 0.06)
        box(f'merlon{k}{j}', M['red'], x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, T + 0.105, 0.028, 0.05, 0.025, rot_z=a, outline=0.003, bevel=0)
for k, (x, y, h) in enumerate(((-0.95, -0.1, 0.24), (-0.75, -0.08, 0.2), (-0.4, -0.05, 0.18), (0.2, 0.02, 0.17), (0.55, 0.06, 0.16), (0.85, 0.1, 0.18))):
    box(f'tower{k}', M['redDark'], x, y, T - 0.01, 0.1, 0.1, h, outline=0.01, bevel=0)
    for j in range(4):
        a = j * math.pi / 2
        box(f'towermerlon{k}{j}', M['redDark'], x + 0.035 * math.cos(a), y + 0.035 * math.sin(a), T + h - 0.012, 0.03, 0.03, 0.025, outline=0.003, bevel=0)
# the Comares tower and the palaces behind the wall
box('comares', M['red'], -0.1, 0.12, T - 0.01, 0.16, 0.16, 0.3, outline=0.012, bevel=0)
for j in range(2):
    box(f'comareswin{j}', M['window'], -0.13 + j * 0.06, 0.038, T + 0.2, 0.03, 0.006, 0.05, outline=0, bevel=0)
for k, (x, w) in enumerate(((-0.55, 0.3), (0.35, 0.4))):
    box(f'palace{k}', M['red'], x, 0.18, T - 0.01, w, 0.18, 0.14, outline=0.01, bevel=0)
    pyramid(f'palaceroof{k}', M['roof'], x, 0.18, T + 0.13, max(w, 0.2) + 0.02, 0.06, outline=0.006)
box('palacecharlesv', M['red'], 0.65, 0.28, T - 0.01, 0.2, 0.2, 0.12, outline=0.01, bevel=0)

# ---------- cypresses and trees ----------
for k in range(10):
    x = -1.0 + k * 0.22
    y = 0.38 + 0.04 * math.sin(k)
    if math.hypot(x, y) > 1.2:
        continue
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.04, 0.05), (0.025, 0.14), (0.004, 0.2)), T - 0.01, x, y, segs=10, outline=0.005)
for k in range(8):
    x = -1.05 + k * 0.3
    ball(f'tree{k}', M['tree'], x, -0.25 + 0.06 * math.cos(k), G + 0.14, rng.uniform(0.06, 0.08), outline=0.01)

turn(before, -20)
render(G)
