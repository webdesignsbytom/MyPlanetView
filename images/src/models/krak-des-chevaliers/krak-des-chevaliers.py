# A cartoon Krak des Chevaliers for the country maps, built in the set's shared look (../toon.py):
# the Crusader castle on its ridge, its outer curtain wall ringed with round towers, the great
# sloping glacis of the inner ward, the three tall round towers on its south side and the hall
# inside, all in pale limestone on a green hill. Turned a little towards the camera.
# Run: blender -b --factory-startup -P krak-des-chevaliers.py -- krak-des-chevaliers-1024.png 1024 krak-des-chevaliers.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'hill': toon('hill', '#9aa860', shadow_mul=(0.74, 0.78, 0.72)),
    'stone': toon('stone', '#d8c8a4', shadow_mul=(0.84, 0.8, 0.8), lift=0.15),
    'stoneDark': toon('stoneDark', '#bca888', shadow_mul=(0.84, 0.8, 0.8)),
    'window': flat('window', '#2e2a28'),
    'bush': toon('bush', '#5a8a40', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2039)

hill = lathe('hill', M['hill'], ((1.2, 0), (1.0, 0.1), (0.8, 0.18), (0.72, 0.2)), G - 0.01, 0.0, 0.1, segs=28, outline=0.014)
hill.visible_shadow = False
T = G + 0.19
CX, CY = 0.0, 0.1


def crenels(name, x, y, z, a, w):
    for j in range(3):
        o = (j - 1) * w / 3
        box(f'{name}c{j}', M['stone'], x + o * math.cos(a), y + o * math.sin(a), z, w / 6, 0.035, 0.03, rot_z=a, outline=0.002, bevel=0)


# ---------- the outer curtain wall and its round towers ----------
R = 0.62
for k in range(18):
    a0, a1 = 2 * math.pi * k / 18, 2 * math.pi * (k + 1) / 18
    x0, y0, x1, y1 = CX + R * math.cos(a0), CY + R * math.sin(a0), CX + R * math.cos(a1), CY + R * math.sin(a1)
    a = math.atan2(y1 - y0, x1 - x0)
    L = math.hypot(x1 - x0, y1 - y0) + 0.01
    box(f'outerwall{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.01, L, 0.05, 0.13, rot_z=a, outline=0.006, bevel=0)
    crenels(f'outerwall{k}', (x0 + x1) / 2, (y0 + y1) / 2, T + 0.12, a, L)
for k in range(9):
    a = 2 * math.pi * k / 9 + 0.2
    x, y = CX + R * math.cos(a), CY + R * math.sin(a)
    lathe(f'outertower{k}', M['stoneDark'], ((0.07, 0), (0.07, 0.19)), T - 0.01, x, y, segs=14, outline=0.006)
    box(f'outertowerslit{k}', M['window'], x + 0.071 * math.cos(a), y + 0.071 * math.sin(a), T + 0.08, 0.006, 0.015, 0.04, rot_z=a, outline=0, bevel=0)
box('gatehouse', M['stoneDark'], CX + 0.15, CY - R, T - 0.01, 0.16, 0.1, 0.2, outline=0.007, bevel=0)
box('gate', M['window'], CX + 0.15, CY - R - 0.052, T - 0.01, 0.06, 0.006, 0.1, outline=0, bevel=0)

# ---------- the glacis and the inner ward ----------
lathe('glacis', M['stone'], ((0.46, 0), (0.36, 0.22)), T - 0.01, CX, CY + 0.02, segs=28, outline=0.01)
lathe('innerwall', M['stone'], ((0.36, 0), (0.36, 0.08)), T + 0.21, CX, CY + 0.02, segs=28, outline=0.008)
IZ = T + 0.29
for k, a in enumerate((-130, -90, -50)):
    a = math.radians(a)
    x, y = CX + 0.33 * math.cos(a), CY + 0.02 + 0.33 * math.sin(a)
    lathe(f'southtower{k}', M['stoneDark'], ((0.1, 0), (0.1, 0.2), (0.11, 0.2), (0.11, 0.23)), T + 0.1, x, y, segs=16, outline=0.008)
    for j in range(2):
        box(f'southtowerwin{k}{j}', M['window'], x + 0.1 * math.cos(a), y + 0.1 * math.sin(a), T + 0.2 + j * 0.08, 0.02, 0.006, 0.045, rot_z=a + math.pi / 2, outline=0, bevel=0)
box('hall', M['stone'], CX - 0.05, CY + 0.12, IZ - 0.01, 0.4, 0.2, 0.1, outline=0.007, bevel=0)
for j in range(4):
    box(f'hallwin{j}', M['window'], CX - 0.2 + j * 0.1, CY + 0.019, IZ + 0.02, 0.025, 0.006, 0.05, outline=0, bevel=0)
box('chapel', M['stoneDark'], CX + 0.2, CY + 0.2, IZ - 0.01, 0.12, 0.2, 0.14, outline=0.007, bevel=0)
lathe('keeptower', M['stoneDark'], ((0.08, 0), (0.08, 0.2)), IZ - 0.01, CX - 0.25, CY + 0.25, segs=14, outline=0.006)

# ---------- scrub on the slopes ----------
for k in range(10):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.8, 1.05)
    x, y = r * math.cos(a), 0.1 + r * math.sin(a)
    if math.hypot(x, y) > 1.2:
        continue
    ball(f'bush{k}', M['bush'], x, y, G + 0.07, 0.05, outline=0.006)

turn(before, -20)
render(G)
