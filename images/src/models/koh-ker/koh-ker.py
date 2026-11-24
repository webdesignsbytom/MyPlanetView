# A cartoon Koh Ker for the country maps, built in the set's shared look (../toon.py): Prasat Thom, the
# great pyramid temple of the tenth-century Khmer capital in the forest of northern Cambodia, its
# seven square tiers of laterite and sandstone rising steeply, the long stair straight up the front
# to the platform on top, moss and young trees growing on its steps, and the jungle all round.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P koh-ker.py -- koh-ker-1024.png 1024 koh-ker.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#6aa84c', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'clearing': toon('clearing', '#9ab870', lift=0.18),
    'laterite': toon('laterite', '#a8826a', shadow_mul=(0.8, 0.76, 0.8), lift=0.12),
    'sandstone': toon('sandstone', '#b8ac94', lift=0.15),
    'moss': toon('moss', '#6a9a4a'),
    'dark': flat('dark', '#2e2a26'),
    'jungle': toon('jungle', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(928)

box('clearing', M['clearing'], 0.0, -0.1, G - 0.004, 1.2, 1.1, 0.01, outline=0.001, bevel=0)

# ---------- the seven tiers ----------
CX, CY = 0.0, 0.1
z = G - 0.005
TH = 0.072
for k in range(7):
    half = 0.4 - k * 0.048
    loft(f'tier{k}', M['laterite'], [[(CX - half, CY - half, z), (CX + half, CY - half, z), (CX + half, CY + half, z), (CX - half, CY + half, z)],
                                     [(CX - half + 0.012, CY - half + 0.012, z + TH), (CX + half - 0.012, CY - half + 0.012, z + TH), (CX + half - 0.012, CY + half - 0.012, z + TH), (CX - half + 0.012, CY + half - 0.012, z + TH)]], outline=0.005)
    for j in range(3):
        if rng.random() < 0.7:
            m = ball(f'moss{k}{j}', M['moss'], 0, 0, 0, 1.0, outline=0.002)
            m.scale = (0.04, 0.02, 0.01)
            m.location = (CX - half + 0.1 + rng.random() * (2 * half - 0.2), CY - half + 0.01, z + TH)
    z += TH
TOP = z
box('platform', M['sandstone'], CX, CY, TOP - 0.005, 0.12, 0.12, 0.04, outline=0.003, bevel=0)
box('shrine', M['sandstone'], CX, CY + 0.01, TOP + 0.03, 0.07, 0.07, 0.05, outline=0.003, bevel=0)
# the long stair straight up the front
N = 20
for i in range(N):
    t = (i + 1) / N
    y = CY - 0.42 + i * (0.36 / N)
    box(f'stair{i}', M['sandstone'], CX, y, G - 0.005, 0.09, 0.36 / N + 0.002, (TOP - G) * t + 0.005, outline=0.001, bevel=0)
for s in (-1, 1):
    bar(f'stairwall{s}', M['laterite'], (CX + s * 0.05, CY - 0.42, G + 0.02), (CX + s * 0.05, CY - 0.06, TOP + 0.01), 0.014, outline=0.002)
# a young tree growing from a tier
rod('treeontier', M['trunk'], (CX + 0.25, CY - 0.2, G + 0.14), (CX + 0.27, CY - 0.2, G + 0.24), 0.008, segs=6, outline=0.001)
ball('treeontiertop', M['jungle'], CX + 0.27, CY - 0.2, G + 0.28, 0.06, outline=0.006)

# ---------- the jungle all round ----------
for k in range(20):
    a = 2 * math.pi * k / 20 + 0.15
    r = 0.95 + 0.12 * rng.random()
    x, y = r * math.cos(a), r * math.sin(a)
    if math.hypot(x, y) > 1.2 or (y < -0.6 and abs(x) < 0.35):
        continue
    ball(f'jungle{k}', M['jungle'], x, y, G + 0.13, 0.11 + 0.04 * rng.random(), outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
