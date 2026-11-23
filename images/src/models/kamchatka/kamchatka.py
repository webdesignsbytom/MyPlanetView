# A cartoon Kamchatka for the country maps, built in the set's shared look (../toon.py): the
# snow-covered cones of Kamchatka's volcanoes, a plume of smoke from the highest, the Valley of the
# Geysers' steaming jets among the coloured ground, the river below, and a brown bear catching a
# salmon. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kamchatka.py -- kamchatka-1024.png 1024 kamchatka.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'tundra': toon('tundra', '#7a9a58', shadow_mul=(0.74, 0.8, 0.74), lift=0.2),
    'volcano': toon('volcano', '#5a5254', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'smoke': toon('smoke', '#c8c4c0', shadow_mul=(0.86, 0.88, 0.94), lift=0.1),
    'steam': toon('steam', '#ffffff', shadow_mul=(0.88, 0.9, 0.97), lift=0.1),
    'sinter': toon('sinter', '#d8b070', shadow_mul=(0.86, 0.8, 0.74)),
    'sinterRed': toon('sinterRed', '#c06a4a'),
    'river': toon('river', '#4a9ab8', lift=0.3),
    'bear': toon('bear', '#6a4a30', shadow_mul=(0.86, 0.8, 0.78)),
    'salmon': toon('salmon', '#e86a5a', lift=0.25),
})

G = tile(M['tundra'])
before = set(bpy.data.objects)
rng = random.Random(2011)


def volcano(name, x, y, r, h):
    lathe(name, M['volcano'], ((r, 0), (r * 0.55, h * 0.55), (r * 0.18, h)), G - 0.01, x, y, segs=20, outline=0.016)
    lathe(f'{name}snow', M['snow'], ((r * 0.6, 0), (r * 0.33, h * 0.3), (r * 0.185, h * 0.45 + 0.005)), G - 0.01 + h * 0.55, x, y, segs=20, outline=0.01)
    for j in range(6):
        a = math.radians(200 + j * 25)
        bar(f'{name}gully{j}', M['snow'], (x + r * 0.6 * math.cos(a), y + r * 0.6 * math.sin(a), G + h * 0.52), (x + r * 0.85 * math.cos(a), y + r * 0.85 * math.sin(a), G + h * 0.25),
            0.02, outline=0)


volcano('klyuchevskaya', -0.25, 0.65, 0.55, 0.85)
volcano('kamen', 0.5, 0.75, 0.42, 0.62)
volcano('koryaksky', -0.9, 0.35, 0.32, 0.45)
for k, (dx, dz, r) in enumerate(((0.0, 0.0, 0.07), (0.07, 0.06, 0.06), (0.15, 0.1, 0.05))):
    b = ball(f'smoke{k}', M['smoke'], 0, 0, 0, r, outline=0.01)
    b.scale = (1.4, 1.0, 0.8)
    b.location = (-0.25 + dx, 0.65, G + 0.88 + dz)

# ---------- the Valley of the Geysers ----------
for k, (x, y) in enumerate(((0.35, -0.05), (0.6, 0.05), (0.15, 0.1))):
    lathe(f'sinter{k}', M['sinter' if k % 2 else 'sinterRed'], ((0.1, 0), (0.08, 0.02)), G - 0.005, x, y, segs=12, outline=0.004)
    h = 0.25 if k == 0 else 0.15
    lathe(f'geyser{k}', M['steam'], ((0.02, 0), (0.035, h * 0.5), (0.05, h * 0.85), (0.004, h)), G + 0.01, x, y, segs=10, outline=0.004)
    for j in range(3):
        ball(f'geyserpuff{k}{j}', M['steam'], x + 0.03 * (j - 1), y, G + h + 0.03 * j, 0.04, outline=0.005)

# ---------- the river and the bear ----------
RIV = [(-1.25, -0.4), (-0.6, -0.5), (0.0, -0.45), (0.6, -0.6), (1.25, -0.5)]
for k in range(len(RIV) - 1):
    (x0, y0), (x1, y1) = RIV[k], RIV[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    quad = [(x0 - 0.12 * math.cos(a), y0 - 0.12 * math.sin(a)), (x1 - 0.12 * math.cos(a), y1 - 0.12 * math.sin(a)), (x1 + 0.12 * math.cos(a), y1 + 0.12 * math.sin(a)),
            (x0 + 0.12 * math.cos(a), y0 + 0.12 * math.sin(a))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.003) for x, y in quad]], outline=0.003)
BX, BY = -0.15, -0.45
for fx in (-0.05, 0.05):
    for side in (-1, 1):
        rod(f'bearleg{fx}{side}', M['bear'], (BX + fx, BY + side * 0.035, G), (BX + fx, BY + side * 0.035, G + 0.06), 0.02, segs=8, outline=0.004)
b = ball('bearbody', M['bear'], 0, 0, 0, 0.07, outline=0.008)
b.scale = (1.4, 0.95, 0.9)
b.location = (BX, BY, G + 0.1)
ball('bearhead', M['bear'], BX + 0.11, BY, G + 0.13, 0.04, outline=0.006)
for side in (-1, 1):
    ball(f'bearear{side}', M['bear'], BX + 0.1, BY + side * 0.03, G + 0.17, 0.014, outline=0.002)
b = ball('salmon', M['salmon'], 0, 0, 0, 0.02, outline=0.003)
b.scale = (2.2, 0.6, 0.8)
b.location = (BX + 0.16, BY, G + 0.12)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
