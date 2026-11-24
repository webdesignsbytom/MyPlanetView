# A cartoon Dholavira for the country maps, built in the set's shared look (../toon.py): the
# Harappan city on Khadir island in the Rann of Kutch, India, four and a half thousand years old:
# the raised stone citadel with its gateway and pillar bases, the great stepped reservoir cut
# into the rock below it, the low walls of the town's grid of houses, and the white salt flats
# round the island. Turned a little towards the camera.
# Run: blender -b --factory-startup -P dholavira.py -- dholavira-1024.png 1024 dholavira.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#ccb488', shadow_mul=(0.8, 0.78, 0.82), lift=0.18),
    'salt': toon('salt', '#f0ece2', lift=0.25),
    'stone': toon('stone', '#c8a47c', shadow_mul=(0.8, 0.76, 0.8), lift=0.14),
    'stoneLight': toon('stoneLight', '#dcc09a', lift=0.16),
    'water': toon('water', '#4a96c0', lift=0.3),
    'dark': flat('dark', '#2e2420'),
    'shrub': toon('shrub', '#8aa25a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(9468)

# ---------- the salt flats round the island ----------
loft('salt', M['salt'], [[(1.42 * math.cos(2 * math.pi * k / 36), 1.42 * math.sin(2 * math.pi * k / 36), G - 0.002) for k in range(36)],
                         [(1.42 * math.cos(2 * math.pi * k / 36), 1.42 * math.sin(2 * math.pi * k / 36), G + 0.005) for k in range(36)]], outline=0)
isle = loft('island', M['ground'], [[(1.2 * math.cos(2 * math.pi * k / 36), 1.1 * math.sin(2 * math.pi * k / 36), G - 0.01) for k in range(36)],
                                    [(1.12 * math.cos(2 * math.pi * k / 36), 1.02 * math.sin(2 * math.pi * k / 36), G + 0.025) for k in range(36)]], outline=0.004)
isle.visible_shadow = False
GZ = G + 0.025

# ---------- the citadel ----------
CX, CY = -0.1, 0.3
box('citadel', M['stone'], CX, CY, GZ - 0.005, 0.7, 0.5, 0.16, outline=0.007, bevel=0)
for k in range(4):
    box(f'buttress{k}', M['stoneLight'], CX - 0.3 + k * 0.2, CY - 0.26, GZ - 0.005, 0.06, 0.04, 0.17, outline=0.003, bevel=0)
box('gatehouse', M['stoneLight'], CX + 0.05, CY - 0.27, GZ - 0.005, 0.18, 0.08, 0.2, outline=0.004, bevel=0)
box('gate', M['dark'], CX + 0.05, CY - 0.312, GZ - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
for k in range(5):
    box(f'gatestep{k}', M['stoneLight'], CX + 0.05, CY - 0.33 - k * 0.025, GZ - 0.005, 0.1, 0.03, 0.12 - k * 0.025, outline=0.001, bevel=0)
TZ = GZ + 0.155
for i in range(3):
    for j in range(2):
        lathe(f'pillarbase{i}{j}', M['stoneLight'], ((0.025, 0), (0.025, 0.04)), TZ, CX - 0.15 + i * 0.12, CY + 0.05 + j * 0.12, segs=10, outline=0.002, smooth=False)
for k in range(6):
    box(f'citwall{k}', M['stoneLight'], CX - 0.3 + k * 0.12, CY + 0.22, TZ, 0.1, 0.03, 0.04 + 0.02 * rng.random(), outline=0.001, bevel=0)

# ---------- the great stepped reservoir ----------
RX, RY = 0.5, -0.25
for k in range(5):
    w, d = 0.42 - k * 0.07, 0.3 - k * 0.05
    box(f'res{k}', M['stoneLight'] if k % 2 else M['stone'], RX, RY, GZ - 0.004 - k * 0.006, w, d, 0.01, outline=0.002, bevel=0)
box('reswater', M['water'], RX, RY, GZ - 0.03, 0.12, 0.08, 0.03, outline=0.001, bevel=0)
for s in (-1, 1):
    for k in range(5):
        box(f'resstair{s}{k}', M['stone'], RX + s * (0.18 - k * 0.03), RY - 0.08, GZ + 0.002 - k * 0.006, 0.03, 0.04, 0.006, outline=0, bevel=0)

# ---------- the town's grid of low walls ----------
for i in range(4):
    for j in range(3):
        x, y = -0.75 + i * 0.2, -0.35 - j * 0.18
        if math.hypot(x, y) > 0.95:
            continue
        box(f'housea{i}{j}', M['stone'], x, y - 0.06, GZ - 0.005, 0.16, 0.02, 0.04 + 0.02 * rng.random(), outline=0.001, bevel=0)
        box(f'houseb{i}{j}', M['stone'], x - 0.07, y, GZ - 0.005, 0.02, 0.12, 0.04 + 0.02 * rng.random(), outline=0.001, bevel=0)
for k, (x, y) in enumerate(((0.85, 0.35), (0.6, 0.65), (-0.85, 0.45), (0.2, -0.85))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, GZ + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
