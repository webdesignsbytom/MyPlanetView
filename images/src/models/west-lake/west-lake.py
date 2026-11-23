# A cartoon West Lake for the country maps, built in the set's shared look (../toon.py): Hangzhou's
# lake with the Leifeng Pagoda on its wooded hill by the south shore, five octagonal storeys of red
# columns under flaring bronze roofs, the Bai Causeway crossing the water with its willows and the
# little arched Broken Bridge, the stone lanterns of Three Pools Mirroring the Moon, lotus, and a
# painted pleasure boat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P west-lake.py -- west-lake-1024.png 1024 west-lake.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#5a9ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'shore': toon('shore', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'hill': toon('hill', '#4f8a40', shadow_mul=(0.72, 0.8, 0.74)),
    'red': toon('red', '#b83a2a'),
    'bronze': toon('bronze', '#b8843a', lift=0.15),
    'stone': toon('stone', '#d0c8b8', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'willow': toon('willow', '#8ac860', shadow_mul=(0.72, 0.8, 0.74)),
    'trunk': toon('trunk', '#5a4a40'),
    'pad': toon('pad', '#4f9a4a'),
    'lotus': toon('lotus', '#f07ab0', lift=0.25),
    'boat': toon('boat', '#8a3a2a'),
    'canopy': toon('canopy', '#e0b040', lift=0.15),
    'dark': flat('dark', '#3a3028'),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(2423)


def segment(c, r, z, n=30):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


loft('shore', M['shore'], [segment(0.35, 1.33, -0.004), segment(0.35, 1.33, 0.03)], outline=0.006)
HX, HY = -0.3, 0.68
hl = lathe('hill', M['hill'], ((0.42, 0), (0.3, 0.1), (0.16, 0.15), (0.1, 0.16)), G + 0.02, HX, HY, segs=24, outline=0.008)
hl.visible_shadow = False
T = G + 0.175

# ---------- the Leifeng Pagoda ----------
box('pagodabase', M['stone'], HX, HY, T - 0.01, 0.24, 0.24, 0.04, outline=0.004, bevel=0)
z = T + 0.03
r = 0.1
for i in range(5):
    h = 0.1 if i == 0 else 0.08
    lathe(f'storey{i}', M['red'], ((r, 0), (r, h)), z, HX, HY, segs=8, outline=0.005, smooth=False)
    for j in range(8):
        a = 2 * math.pi * (j + 0.5) / 8
        if math.sin(a) > 0.3:
            continue
        box(f'door{i}{j}', M['dark'], HX + r * 0.93 * math.cos(a), HY + r * 0.93 * math.sin(a), z + h * 0.15, 0.025, 0.006, h * 0.55, rot_z=a + math.pi / 2, outline=0, bevel=0)
    lathe(f'eave{i}', M['bronze'], ((r + 0.07, 0), (r * 0.7, 0.04), (r * 0.6, 0.045)), z + h - 0.005, HX, HY, segs=8, outline=0.004, smooth=False)
    z += h + 0.04
    r *= 0.88
lathe('finial', M['bronze'], ((0.025, 0), (0.015, 0.05), (0.02, 0.07), (0.004, 0.14)), z, HX, HY, segs=8, outline=0.002, smooth=False)

# ---------- the Bai Causeway and the Broken Bridge ----------
P0, P1 = (-1.0, -0.38), (0.98, -0.02)
BX = 0.3
t = (BX - P0[0]) / (P1[0] - P0[0])
BY = P0[1] + (P1[1] - P0[1]) * t
for k, (a, b) in enumerate(((P0, (BX - 0.1, BY - 0.018)), ((BX + 0.1, BY + 0.018), P1))):
    bar(f'causeway{k}', M['shore'], (a[0], a[1], G + 0.012), (b[0], b[1], G + 0.012), 0.09, outline=0.004)
n = 8
pts = [(BX - 0.11 + 0.22 * i / n, BY - 0.02 + 0.04 * i / n, G + 0.02 + 0.06 * math.sin(math.pi * i / n)) for i in range(n + 1)]
for i in range(n):
    bar(f'bridge{i}', M['stone'], pts[i], pts[i + 1], 0.07, outline=0.003)
cyl('bridgearch', M['dark'], 0.04, 0.006, segs=14, outline=0, matrix=Matrix.Translation((BX, BY - 0.04, G + 0.0)) @ Matrix.Rotation(0.18, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k in range(8):
    tt = (k + 0.5) / 8
    x = P0[0] + (P1[0] - P0[0]) * tt
    if abs(x - BX) < 0.15:
        continue
    y = P0[1] + (P1[1] - P0[1]) * tt + 0.03
    rod(f'willowtrunk{k}', M['trunk'], (x, y, G + 0.02), (x, y, G + 0.14), 0.01, segs=6, outline=0.001)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f'willowfrond{k}{j}', M['willow'], (x, y, G + 0.14), (x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.05), 0.016, outline=0.001)

# ---------- lanterns, lotus and a boat ----------
for k, (x, y) in enumerate(((0.45, 0.22), (0.58, 0.12), (0.62, 0.27))):
    lathe(f'lantern{k}', M['stone'], ((0.02, 0), (0.016, 0.05), (0.03, 0.06), (0.022, 0.085), (0.004, 0.11)), G - 0.004, x, y, segs=8, outline=0.002, smooth=False)
for k in range(12):
    x, y = rng.uniform(-0.8, -0.2), rng.uniform(-0.75, -0.5)
    lathe(f'pad{k}', M['pad'], ((0.035, 0), (0.035, 0.005)), G + 0.003, x, y, segs=10, outline=0.001)
    if k % 3 == 0:
        lathe(f'lotus{k}', M['lotus'], ((0.01, 0), (0.022, 0.02), (0.004, 0.04)), G + 0.006, x, y, segs=6, outline=0.002, smooth=False)
BXo, BYo = 0.0, 0.15
loft('boat', M['boat'], [[(BXo - 0.1, BYo - 0.02, G), (BXo + 0.1, BYo - 0.02, G), (BXo + 0.1, BYo + 0.02, G), (BXo - 0.1, BYo + 0.02, G)],
                         [(BXo - 0.14, BYo - 0.04, G + 0.035), (BXo + 0.14, BYo - 0.04, G + 0.035), (BXo + 0.14, BYo + 0.04, G + 0.035), (BXo - 0.14, BYo + 0.04, G + 0.035)]], outline=0.003)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'boatpost{sx}{sy}', M['red'], (BXo + sx * 0.06, BYo + sy * 0.03, G + 0.035), (BXo + sx * 0.06, BYo + sy * 0.03, G + 0.09), 0.004, segs=4, outline=0)
loft('boatroof', M['canopy'], [[(BXo - 0.08, BYo - 0.045, G + 0.09), (BXo + 0.08, BYo - 0.045, G + 0.09), (BXo + 0.08, BYo + 0.045, G + 0.09), (BXo - 0.08, BYo + 0.045, G + 0.09)],
                               [(BXo - 0.06, BYo - 0.004, G + 0.12), (BXo + 0.06, BYo - 0.004, G + 0.12), (BXo + 0.06, BYo + 0.004, G + 0.12), (BXo - 0.06, BYo + 0.004, G + 0.12)]], outline=0.002)
for k, (x, y, r) in enumerate(((0.3, 0.75, 0.1), (0.6, 0.6, 0.09), (-0.8, 0.5, 0.09), (0.0, 0.95, 0.09))):
    ball(f'tree{k}', M['hill'], x, y, G + 0.03 + r * 0.9, r, outline=0.007)

turn(before, -20)
render(G)
