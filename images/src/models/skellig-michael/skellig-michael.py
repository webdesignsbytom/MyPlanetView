# A cartoon Skellig Michael for the country maps, built in the set's shared look (../toon.py): the
# sheer rock rising in two peaks out of the Atlantic off Kerry, the early monks' stone beehive huts
# on their terrace near the top, the stone stairs climbing to them, puffins on the grassy ledges,
# and the surf round its foot. Turned a little towards the camera.
# Run: blender -b --factory-startup -P skellig-michael.py -- skellig-michael-1024.png 1024 skellig-michael.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a5a8a', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'rock': toon('rock', '#6a6460', shadow_mul=(0.84, 0.84, 0.9)),
    'rockLight': toon('rockLight', '#8a847c', shadow_mul=(0.84, 0.84, 0.9)),
    'grass': toon('grass2', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'hut': toon('hut', '#9a948a', shadow_mul=(0.84, 0.84, 0.9)),
    'door': flat('door', '#2e2a28'),
    'stairs': toon('stairs', '#b8b0a2', lift=0.15),
    'black': toon('puffinBlack', '#2e2a30'),
    'white': toon('puffinWhite', '#f8f6f0', lift=0.2),
    'beak': toon('beak', '#f08a2a', lift=0.3),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1609)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.08 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.08 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the rock: a broad base, two peaks ----------
base = loft('rockbase', M['rock'], [ring(0.0, 0.2, 0.9, 0.6, -0.01, 1), ring(0.0, 0.22, 0.75, 0.48, 0.25, 1), ring(0.0, 0.25, 0.6, 0.36, 0.4, 1)], outline=0.018)
base.visible_shadow = False
for k, (x, y, r, h) in enumerate(((-0.3, 0.3, 0.3, 0.78), (0.35, 0.35, 0.24, 0.62))):
    lathe(f'peak{k}', M['rockLight' if k else 'rock'], ((r, 0), (r * 0.7, (h - 0.4) * 0.6), (0.004, h - 0.4)), G + 0.39, x, y, segs=7, outline=0.014, smooth=False)
# the grassy terrace and ledges
loft('terrace', M['grass'], [ring(0.05, 0.12, 0.42, 0.18, 0.395, 3), ring(0.05, 0.12, 0.4, 0.16, 0.41, 3)], outline=0.006)
for k, (x, y, z) in enumerate(((-0.55, -0.15, 0.2), (0.55, -0.1, 0.22), (0.0, -0.3, 0.12))):
    loft(f'ledge{k}', M['grass'], [ring(x, y, 0.14, 0.06, z, k + 5), ring(x, y, 0.13, 0.055, z + 0.015, k + 5)], outline=0.004)
T = G + 0.41

# ---------- the beehive huts ----------
for k, (x, y, r) in enumerate(((-0.15, 0.15, 0.07), (0.02, 0.2, 0.08), (0.18, 0.15, 0.065), (0.08, 0.05, 0.055))):
    lathe(f'hut{k}', M['hut'], ((r, 0), (r * 0.95, r * 0.6), (r * 0.6, r * 1.2), (0.004, r * 1.55)), T - 0.005, x, y, segs=14, outline=0.008)
    box(f'hutdoor{k}', M['door'], x, y - r + 0.002, T, 0.025, 0.006, 0.04, outline=0, bevel=0)

# ---------- the stairs climbing from the landing ----------
ZIG = [(0.45, -0.45, 0.02), (0.25, -0.3, 0.12), (0.4, -0.15, 0.22), (0.2, 0.0, 0.32), (0.1, 0.05, 0.41)]
for k in range(len(ZIG) - 1):
    (x0, y0, z0), (x1, y1, z1) = ZIG[k], ZIG[k + 1]
    bar(f'stairs{k}', M['stairs'], (x0, y0, G + z0 + 0.01), (x1, y1, G + z1 + 0.01), 0.03, outline=0.003)


# ---------- puffins ----------
def puffin(name, x, y, z):
    lathe(f'{name}body', M['black'], ((0.018, 0), (0.022, 0.02), (0.016, 0.045), (0.004, 0.05)), z, x, y, segs=10, outline=0.003)
    b = ball(f'{name}belly', M['white'], 0, 0, 0, 0.015, outline=0)
    b.scale = (0.9, 0.6, 1.2)
    b.location = (x, y - 0.012, z + 0.022)
    ball(f'{name}head', M['black'], x, y, z + 0.058, 0.014, outline=0.002)
    ball(f'{name}face', M['white'], x, y - 0.008, z + 0.058, 0.01, outline=0)
    bar(f'{name}beak', M['beak'], (x, y - 0.015, z + 0.056), (x, y - 0.03, z + 0.052), 0.012, outline=0)


for k, (x, y, z) in enumerate(((-0.6, -0.17, 0.215), (-0.5, -0.14, 0.215), (0.5, -0.12, 0.235), (0.6, -0.1, 0.235), (-0.05, -0.32, 0.135), (0.05, -0.3, 0.135))):
    puffin(f'puffin{k}', x, y, G + z)

# ---------- the surf round its foot ----------
for k in range(16):
    a = 2 * math.pi * k / 16
    ball(f'surf{k}', M['surf'], 0.92 * math.cos(a), 0.2 + 0.62 * math.sin(a), G + 0.005, rng.uniform(0.03, 0.045), outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
