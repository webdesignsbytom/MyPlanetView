# A cartoon Takht-e Soleyman for the country maps, built in the set's shared look (../toon.py): the
# Sasanian royal sanctuary in the hills of West Azerbaijan, Iran, its oval stone walls with
# their round towers ringing the deep blue lake in a volcanic crater, the brick arches of the
# great fire temple and the iwan on the lake's north side, and the bare hills round it. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P takht-e-soleyman.py -- takht-e-soleyman-1024.png 1024 takht-e-soleyman.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#b4bc78', shadow_mul=(0.75, 0.78, 0.8), lift=0.2),
    'plateau': toon('plateau', '#c8c08c', shadow_mul=(0.78, 0.78, 0.82)),
    'stone': toon('stone', '#ccb48c', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'brick': toon('brick', '#b8906a'),
    'water': toon('water', '#2a82b8', lift=0.3),
    'dark': flat('dark', '#2e2620'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(115253)

# ---------- the walled mound ----------
PZ = G + 0.08
RX, RY = 0.9, 0.68
ring = lambda sx, sy, z, n=36: [(sx * math.cos(2 * math.pi * k / n), sy * math.sin(2 * math.pi * k / n) + 0.05, z) for k in range(n)]
mound = loft('mound', M['plateau'], [ring(RX + 0.12, RY + 0.12, G - 0.01), ring(RX, RY, PZ)], outline=0.005)
mound.visible_shadow = False
# the lake
loft('lake', M['water'], [ring(0.3, 0.22, PZ - 0.004, 24), ring(0.3, 0.22, PZ + 0.006, 24)], outline=0.003)
# the walls and their towers
N = 28
for k in range(N):
    a0, a1 = 2 * math.pi * k / N, 2 * math.pi * (k + 1) / N
    p0 = (RX * 0.95 * math.cos(a0), RY * 0.95 * math.sin(a0) + 0.05)
    p1 = (RX * 0.95 * math.cos(a1), RY * 0.95 * math.sin(a1) + 0.05)
    h = 0.09 + 0.03 * rng.random() if k % 7 else 0.03
    bar(f'wall{k}', M['stone'], (p0[0], p0[1], PZ + h / 2), (p1[0], p1[1], PZ + h / 2), 0.035, outline=0.002)
    if k % 2 == 0:
        lathe(f'tower{k}', M['stone'], ((0.045, 0), (0.045, h + 0.03)), PZ - 0.005, p0[0], p0[1], segs=10, outline=0.003, smooth=False)
# the gate on the front
box('gate', M['stone'], 0.0, -RY * 0.95 + 0.05, PZ - 0.005, 0.12, 0.06, 0.15, outline=0.004, bevel=0)
arch('gatepassage', M['dark'], 0.0, -RY * 0.95 + 0.017, PZ - 0.005, 0.05, 0.1)

# ---------- the fire temple and the iwan ----------
TX, TY = 0.0, 0.47
box('temple', M['brick'], TX, TY, PZ - 0.005, 0.3, 0.2, 0.16, outline=0.005, bevel=0)
for j in range(3):
    arch(f'templearch{j}', M['dark'], TX - 0.09 + j * 0.09, TY - 0.103, PZ - 0.005, 0.06, 0.12)
lathe('templedome', M['brick'], [(0.08 * math.cos(a), 0.06 * math.sin(a)) for a in [k * math.pi / 12 for k in range(7)]], PZ + 0.155, TX, TY + 0.02, segs=16, outline=0.004)
box('iwan', M['brick'], -0.38, 0.35, PZ - 0.005, 0.18, 0.16, 0.22, outline=0.005, bevel=0)
arch('iwanarch', M['dark'], -0.38, 0.268, PZ - 0.005, 0.1, 0.18)
for k in range(5):
    x, y = 0.25 + 0.25 * rng.random(), -0.25 + 0.4 * rng.random()
    box(f'ruin{k}', M['stone'], x, y, PZ - 0.005, 0.1, 0.02, 0.03 + 0.03 * rng.random(), rot_z=rng.random(), outline=0.001, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
