# A cartoon Sukhothai for the country maps, built in the set's shared look (../toon.py): Wat
# Mahathat's great seated Buddha between the laterite columns of its ruined hall, the lotus-bud
# chedi behind and two smaller ones, the brick platform, and the lotus pond in front with its pink
# flowers. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sukhothai.py -- sukhothai-1024.png 1024 sukhothai.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'brick': toon('brick', '#b8705a', shadow_mul=(0.86, 0.78, 0.76)),
    'laterite': toon('laterite', '#a89080', shadow_mul=(0.84, 0.82, 0.86)),
    'stucco': toon('stucco', '#e8e2d4', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'chedi': toon('chedi', '#c8bca8', shadow_mul=(0.84, 0.82, 0.86), lift=0.1),
    'pond': toon('pond', '#4a8ab0', lift=0.3),
    'pad': toon('pad', '#4f9a4a'),
    'lotus': toon('lotus', '#f07ab0', lift=0.25),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2041)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.04 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.04 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the lotus pond ----------
PX, PY = 0.0, -0.8
loft('pond', M['pond'], [ring(PX, PY, 0.85, 0.3, -0.004, 1), ring(PX, PY, 0.85, 0.3, 0.004, 1)], outline=0.005, smooth=True)
for k in range(10):
    x, y = PX + rng.uniform(-0.65, 0.65), PY + rng.uniform(-0.15, 0.15)
    lathe(f'pad{k}', M['pad'], ((0.045, 0), (0.045, 0.006)), G + 0.002, x, y, segs=12, outline=0.002)
    if k % 2 == 0:
        lathe(f'lotus{k}', M['lotus'], ((0.01, 0), (0.03, 0.025), (0.004, 0.05)), G + 0.008, x, y, segs=6, outline=0.003, smooth=False)

# ---------- the platform, the hall's columns and the Buddha ----------
box('platform', M['brick'], 0.0, 0.2, G - 0.005, 1.1, 0.8, 0.05, outline=0.008, bevel=0)
T = G + 0.045
for s in (-1, 1):
    for j in range(5):
        y = -0.1 + j * 0.15
        h = 0.32 if j > 1 else 0.2 - j * 0.04
        rod(f'column{s}{j}', M['laterite'], (s * 0.38, y, T), (s * 0.38, y, T + h), 0.035, segs=10, outline=0.005)
BX, BY = 0.0, 0.42
box('pedestal', M['brick'], BX, BY, T - 0.005, 0.44, 0.3, 0.08, outline=0.007, bevel=0)
Z = T + 0.075
b = ball('legs', M['stucco'], 0, 0, 0, 0.16, outline=0.01)
b.scale = (1.35, 0.85, 0.42)
b.location = (BX, BY - 0.02, Z + 0.05)
b = ball('torso', M['stucco'], 0, 0, 0, 0.11, outline=0.01)
b.scale = (1.0, 0.75, 1.45)
b.location = (BX, BY, Z + 0.22)
for s in (-1, 1):
    b = ball(f'arm{s}', M['stucco'], 0, 0, 0, 0.04, outline=0.006)
    b.scale = (0.8, 0.8, 1.8)
    b.location = (BX + s * 0.11, BY, Z + 0.2)
ball('handright', M['stucco'], BX + 0.09, BY - 0.12, Z + 0.1, 0.035, outline=0.005)
ball('hands', M['stucco'], BX - 0.02, BY - 0.1, Z + 0.1, 0.035, outline=0.005)
ball('head', M['stucco'], BX, BY, Z + 0.42, 0.075, outline=0.008)
lathe('ushnisha', M['stucco'], ((0.035, 0), (0.025, 0.04), (0.004, 0.11)), Z + 0.47, BX, BY, segs=8, outline=0.004)

# ---------- the lotus-bud chedis ----------


def chedi(name, x, y, s):
    for j in range(3):
        box(f'{name}step{j}', M['chedi'], x, y, G - 0.005 + j * 0.05 * s, (0.4 - j * 0.08) * s, (0.4 - j * 0.08) * s, 0.055 * s, outline=0.006, bevel=0)
    lathe(name, M['chedi'], ((0.12 * s, 0), (0.1 * s, 0.14 * s), (0.08 * s, 0.24 * s), (0.11 * s, 0.32 * s), (0.07 * s, 0.42 * s), (0.004, 0.56 * s)), G + 0.14 * s, x, y, segs=12, outline=0.007)


chedi('mainchedi', 0.0, 0.85, 1.2)
chedi('chediL', -0.75, 0.55, 0.8)
chedi('chediR', 0.78, 0.5, 0.8)

# ---------- trees ----------
for k, (x, y) in enumerate(((-1.05, -0.2), (1.05, -0.25), (-0.55, 1.0), (0.6, 1.0))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.015, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + 0.2, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
