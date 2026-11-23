# A cartoon Seongsan Ilchulbong for the country maps, built in the set's shared look (../toon.py):
# Sunrise Peak on Jeju, the volcanic tuff cone rising sheer from the sea with its ring of jagged
# rocks round the rim and its grassy crater bowl, the low green neck joining it to the village with
# its stone walls and roofs, the stairway up, and a diver's boat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P seongsan.py -- seongsan-1024.png 1024 seongsan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'cliff': toon('cliff', '#8a6e56', shadow_mul=(0.86, 0.8, 0.8)),
    'green': toon('green', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'crater': toon('crater', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.15),
    'rock': toon('rock', '#6e6058', shadow_mul=(0.86, 0.82, 0.84)),
    'stone': toon('basalt', '#5a5654', shadow_mul=(0.82, 0.82, 0.9)),
    'roof': toon('roof', '#e8603a'),
    'house': toon('house', '#f2efe8', lift=0.2),
    'stairs': toon('stairs', '#d8ccb0', lift=0.2),
    'boat': toon('boat', '#f6f3ec', lift=0.2),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1733)


def ring(cx, cy, r, ry, z, k, sides=28, wob=0.05):
    return [(cx + r * math.cos(t) * (1 + wob * math.sin(5 * t + k)), cy + ry * math.sin(t) * (1 + wob * math.cos(4 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the neck of land and the village ----------
neck = loft('neck', M['green'], [[(-1.25, -0.4, G - 0.01), (-0.35, -0.25, G - 0.01), (-0.35, 0.15, G - 0.01), (-1.2, 0.35, G - 0.01)],
                                 [(-1.22, -0.37, G + 0.05), (-0.38, -0.22, G + 0.05), (-0.38, 0.12, G + 0.05), (-1.17, 0.32, G + 0.05)]], outline=0.01)
neck.visible_shadow = False
for k, (x, y) in enumerate(((-1.0, -0.15), (-0.85, 0.1), (-0.7, -0.12), (-1.05, 0.15))):
    box(f'house{k}', M['house'], x, y, G + 0.045, 0.1, 0.08, 0.06, outline=0.006, bevel=0)
    box(f'houseroof{k}', M['roof'], x, y, G + 0.1, 0.11, 0.09, 0.02, outline=0.003, bevel=0)
    for j in range(2):
        box(f'stonewall{k}{j}', M['stone'], x + 0.07, y - 0.06 + j * 0.12, G + 0.045, 0.04, 0.12, 0.03, outline=0.002, bevel=0)

# ---------- the cone: cliffs, the rim, the grassy bowl ----------
CX, CY = 0.3, 0.2
cone = loft('cone', M['cliff'], [ring(CX, CY, 0.78, 0.68, -0.01, 1), ring(CX, CY, 0.7, 0.62, 0.3, 1), ring(CX, CY, 0.62, 0.55, 0.4, 1)], outline=0.018)
cone.visible_shadow = False
rim = loft('rim', M['green'], [ring(CX, CY, 0.62, 0.55, 0.395, 1), ring(CX, CY, 0.56, 0.5, 0.42, 1), ring(CX, CY, 0.46, 0.4, 0.36, 1, wob=0.02)], outline=0.012)
rim.visible_shadow = False
bowl = loft('bowl', M['crater'], [ring(CX, CY, 0.46, 0.4, 0.355, 1, wob=0.02), ring(CX, CY, 0.44, 0.38, 0.3, 1, wob=0.02)], outline=0.006)
bowl.visible_shadow = False
for k in range(18):
    a = 2 * math.pi * k / 18
    x, y = CX + 0.58 * math.cos(a), CY + 0.52 * math.sin(a)
    h = rng.uniform(0.06, 0.12)
    lathe(f'rimrock{k}', M['rock'], ((0.04, 0), (0.025, h * 0.6), (0.004, h)), G + 0.4, x, y, segs=5, outline=0.005, smooth=False)
for k in range(5):
    a = math.radians(200 + k * 20)
    bar(f'gully{k}', M['rock'], (CX + 0.78 * math.cos(a), CY + 0.68 * math.sin(a), G + 0.02), (CX + 0.66 * math.cos(a), CY + 0.58 * math.sin(a), G + 0.36), 0.03, outline=0)

# ---------- the stairway up, the surf, a boat ----------
ZIG = [(-0.38, -0.05, 0.05), (-0.3, -0.2, 0.15), (-0.22, -0.05, 0.25), (-0.15, -0.15, 0.34), (-0.1, -0.05, 0.42)]
for k in range(len(ZIG) - 1):
    (x0, y0, z0), (x1, y1, z1) = ZIG[k], ZIG[k + 1]
    bar(f'stairs{k}', M['stairs'], (x0, y0, G + z0 + 0.01), (x1, y1, G + z1 + 0.01), 0.025, outline=0.003)
for k in range(14):
    a = math.radians(-100 + k * 15)
    ball(f'surf{k}', M['surf'], CX + 0.8 * math.cos(a), CY + 0.7 * math.sin(a), G + 0.005, rng.uniform(0.025, 0.035), outline=0.003)
loft('boat', M['boat'], [[(0.55, -0.85, G), (0.75, -0.9, G), (0.82, -0.85, G), (0.75, -0.8, G)],
                         [(0.53, -0.85, G + 0.04), (0.75, -0.91, G + 0.04), (0.86, -0.85, G + 0.05), (0.75, -0.79, G + 0.04)]], outline=0.006)

turn(before, -20)
render(G)
