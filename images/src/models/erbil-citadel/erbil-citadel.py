# A cartoon Erbil Citadel for the country maps, built in the set's shared look (../toon.py): the
# oval tell in the middle of Erbil in Iraqi Kurdistan, lived on for six thousand years, its
# flanks rising steeply from the city, the continuous wall of old brick house fronts along
# its rim, the great south gate at the top of its ramp with the statue of the scholar Ibn
# al-Mustawfi below, and the old houses and the hammam inside. Turned a little towards the camera.
# Run: blender -b --factory-startup -P erbil-citadel.py -- erbil-citadel-1024.png 1024 erbil-citadel.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d6c294', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'tell': toon('tell', '#c8ad80', shadow_mul=(0.8, 0.76, 0.8)),
    'brick': toon('brick', '#d0aa78', shadow_mul=(0.8, 0.76, 0.8), lift=0.14),
    'brickDark': toon('brickDark', '#b08a5e'),
    'paving': toon('paving', '#ddd0b4', lift=0.18),
    'bronze': toon('bronze', '#6a5a3a', lift=0.2),
    'dark': flat('dark', '#2e2420'),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(206236)
def palm(name, x, y, h=0.3):
    rod(name + "trunk", M["trunk"], (x, y, G), (x + 0.03, y, G + h), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f"{name}frond{j}", M["palm"], (x + 0.03, y, G + h), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + h - 0.05), 0.03, outline=0.002)


# ---------- the tell ----------
TZ = G + 0.26
ring = lambda sx, sy, z: [(sx * math.cos(2 * math.pi * k / 40), sy * math.sin(2 * math.pi * k / 40) + 0.15, z) for k in range(40)]
tell = loft('tell', M['tell'], [ring(0.95, 0.72, G - 0.01), ring(0.74, 0.54, TZ)], outline=0.007)
tell.visible_shadow = False

# ---------- the rim of house fronts ----------
N = 30
for k in range(N):
    a0, a1 = 2 * math.pi * k / N, 2 * math.pi * (k + 1) / N
    if 4.55 < (a0 + a1) / 2 < 4.85:
        continue
    p0 = (0.72 * math.cos(a0), 0.52 * math.sin(a0) + 0.15)
    p1 = (0.72 * math.cos(a1), 0.52 * math.sin(a1) + 0.15)
    h = 0.07 + 0.05 * rng.random()
    mx, my = (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2
    L = math.hypot(p1[0] - p0[0], p1[1] - p0[1])
    rot = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    box(f'rim{k}', M['brick'] if k % 3 else M['brickDark'], mx, my, TZ - 0.01, L + 0.005, 0.05, h, rot_z=rot, outline=0.003, bevel=0)
    if math.sin((a0 + a1) / 2) < 0:
        b = box(f'rimwin{k}', M['dark'], 0, 0, 0, 0.02, 0.006, 0.03, outline=0, bevel=0)
        nx, ny = math.cos((a0 + a1) / 2), math.sin((a0 + a1) / 2)
        b.matrix_world = Matrix.Translation((mx + 0.026 * nx, my + 0.026 * ny, TZ + h - 0.05)) @ Matrix.Rotation(rot, 4, 'Z') @ b.matrix_world

# ---------- the south gate and its ramp ----------
a = 4.7
gx, gy = 0.72 * math.cos(a), 0.52 * math.sin(a) + 0.15
box('gate', M['brick'], gx, gy, TZ - 0.01, 0.18, 0.08, 0.2, outline=0.005, bevel=0)
arch('gatearch', M['dark'], gx, gy - 0.043, TZ - 0.01, 0.07, 0.14)
for s in (-1, 1):
    lathe(f'gatetower{s}', M['brick'], ((0.04, 0), (0.04, 0.23)), TZ - 0.01, gx + s * 0.1, gy, segs=12, outline=0.003)
for k in range(10):
    t = k / 9
    box(f'ramp{k}', M['paving'], gx, gy - 0.05 - 0.3 * t, G - 0.005, 0.14, 0.04, (TZ - G) * (1 - t) + 0.01, outline=0.001, bevel=0)
lathe('statuebase', M['paving'], ((0.04, 0), (0.04, 0.05)), G - 0.005, gx + 0.25, gy - 0.4, segs=10, outline=0.002, smooth=False)
rod('statue', M['bronze'], (gx + 0.25, gy - 0.4, G + 0.045), (gx + 0.25, gy - 0.4, G + 0.14), 0.02, r2=0.014, segs=8, outline=0.002)
ball('statuehead', M['bronze'], gx + 0.25, gy - 0.4, G + 0.155, 0.018, outline=0.002)

# ---------- the old houses and the hammam inside ----------
for k in range(7):
    x, y = -0.45 + 0.9 * rng.random(), 0.0 + 0.35 * rng.random()
    box(f'house{k}', M['brick'], x, y, TZ - 0.01, 0.14, 0.12, 0.06 + 0.04 * rng.random(), outline=0.003, bevel=0)
for k in range(3):
    lathe(f'hammamdome{k}', M['brickDark'], [(0.04 * math.cos(b), 0.04 * math.sin(b)) for b in [j * math.pi / 10 for j in range(6)]], TZ - 0.01, 0.15 + k * 0.08, 0.38, segs=12, outline=0.002)
for k, (x, y) in enumerate(((-0.95, -0.55), (0.9, -0.5), (-1.0, 0.65), (0.95, 0.6))):
    palm(f'palm{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
