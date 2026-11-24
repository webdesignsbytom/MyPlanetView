# A cartoon Bom Jesus do Monte for the country maps, built in the set's shared look (../toon.py): the
# baroque sanctuary above Braga, its great zigzag stairway climbing the wooded hillside in white
# plaster and dark granite flights, the fountains and statues on its landings, and at the top the
# church's granite front with its two towers, with the little funicular running up beside it through
# the trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bom-jesus-braga.py -- bom-jesus-braga-1024.png 1024 bom-jesus-braga.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f4f2ec', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'granite': toon('granite', '#8a8680', lift=0.08),
    'graniteLight': toon('graniteLight', '#b8b2a6', lift=0.12),
    'dark': flat('dark', '#2e2a2a'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'tree': toon('tree', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'red': toon('red', '#c83a30'),
    'blue': toon('blue', '#3a5a9a'),
})

G = tile(M['hill'])
before = set(bpy.data.objects)

# ---------- the hillside: the staircase climbs from the front to the church at the back ----------
HZ = 0.5


def ground(y):
    return G + HZ * min(1.0, max(0.0, (y + 0.85) / 1.3))


for j in range(9):
    y0, y1 = -0.95 + j * 0.25, min(-0.95 + (j + 1) * 0.25, 1.3)
    if y0 >= 1.3:
        break
    x0, x1 = math.sqrt(max(0.0, 1.36 ** 2 - y0 * y0)), math.sqrt(max(0.0, 1.36 ** 2 - y1 * y1))
    quad = [(-x0, y0), (x0, y0), (x1, y1), (-x1, y1)]
    top = [(quad[0][0], y0, ground(y0)), (quad[1][0], y0, ground(y0)), (quad[2][0], y1, ground(y1)), (quad[3][0], y1, ground(y1))]
    sl = loft(f'slope{j}', M['hill'], [[(x, y, G - 0.01) for x, y in quad], top], outline=0.005)
    sl.visible_shadow = False

# ---------- the zigzag stairway ----------
FLIGHTS = 6
Y0, Y1 = -0.85, 0.3
for k in range(FLIGHTS):
    ya, yb = Y0 + (Y1 - Y0) * k / FLIGHTS, Y0 + (Y1 - Y0) * (k + 1) / FLIGHTS
    side = -1 if k % 2 == 0 else 1
    # each flight climbs on one side, then turns at its landing
    for i in range(5):
        t = i / 5
        y = ya + (yb - ya) * 0.6 * t
        box(f'flight{k}{i}', M['granite'], side * 0.12, y, G - 0.005, 0.14, (yb - ya) * 0.6 / 5 + 0.003, ground(y) - G + 0.02, outline=0.001, bevel=0)
    yl = ya + (yb - ya) * 0.8
    box(f'landing{k}', M['white'], 0, yl, G - 0.005, 0.44, (yb - ya) * 0.4, ground(yl) - G + 0.02, outline=0.003, bevel=0)
    # a fountain and two statues on each landing
    zl = ground(yl) + 0.015
    box(f'fountain{k}', M['white'], 0, yl + 0.02, zl, 0.06, 0.03, 0.08, outline=0.002, bevel=0)
    box(f'fountainwater{k}', M['water'], 0, yl - 0.002, zl + 0.02, 0.03, 0.006, 0.04, outline=0, bevel=0)
    for s in (-1, 1):
        rod(f'statue{k}{s}', M['graniteLight'], (s * 0.2, yl, zl), (s * 0.2, yl, zl + 0.08), 0.011, segs=6, outline=0.001)
        ball(f'statuehead{k}{s}', M['graniteLight'], s * 0.2, yl, zl + 0.09, 0.009, outline=0.001)
    for s in (-1, 1):
        box(f'wall{k}{s}', M['white'], s * 0.21, (ya + yb) / 2, G - 0.005, 0.02, yb - ya, ground((ya + yb) / 2) - G + 0.05, outline=0.002, bevel=0)

# ---------- the church at the top ----------
CY = 0.55
CZ = ground(CY)
box('terrace', M['white'], 0, 0.38, ground(0.38) - 0.01, 0.6, 0.18, 0.03, outline=0.003, bevel=0)
box('church', M['graniteLight'], 0, CY + 0.1, CZ - 0.01, 0.3, 0.36, 0.26, outline=0.007, bevel=0)
box('churchfront', M['graniteLight'], 0, CY - 0.09, CZ - 0.01, 0.34, 0.04, 0.3, outline=0.006, bevel=0)
box('churchdoor', M['dark'], 0, CY - 0.112, CZ - 0.01, 0.06, 0.006, 0.12, outline=0, bevel=0)
loft('churchgable', M['graniteLight'], [[(-0.1, CY - 0.11, CZ + 0.29), (0.1, CY - 0.11, CZ + 0.29), (0.1, CY - 0.07, CZ + 0.29), (-0.1, CY - 0.07, CZ + 0.29)],
                                        [(-0.02, CY - 0.11, CZ + 0.36), (0.02, CY - 0.11, CZ + 0.36), (0.02, CY - 0.07, CZ + 0.36), (-0.02, CY - 0.07, CZ + 0.36)]], outline=0.003)
for s in (-1, 1):
    tx = s * 0.2
    box(f'tower{s}', M['graniteLight'], tx, CY - 0.06, CZ - 0.01, 0.1, 0.1, 0.42, outline=0.005, bevel=0)
    box(f'belfry{s}', M['dark'], tx, CY - 0.113, CZ + 0.3, 0.035, 0.006, 0.06, outline=0, bevel=0)
    lathe(f'towercap{s}', M['granite'], ((0.055, 0), (0.05, 0.03), (0.02, 0.07), (0.003, 0.11)), CZ + 0.405, tx, CY - 0.06, segs=8, outline=0.002, smooth=False)

# ---------- the funicular beside the stairs, and the woods ----------
FX = 0.55
for s in (-1, 1):
    bar(f'rail{s}', M['granite'], (FX + s * 0.02, -0.85, ground(-0.85) + 0.02), (FX + s * 0.02, 0.4, ground(0.4) + 0.02), 0.008, outline=0)
car = box('car', M['blue'], 0, 0, 0, 0.07, 0.11, 0.06, outline=0.003, bevel=0)
bpy.context.view_layer.update()
slope = math.atan2(ground(0.4) - ground(-0.85), 1.25)
car.matrix_world = Matrix.Translation((FX, -0.2, ground(-0.2) + 0.03)) @ Matrix.Rotation(slope, 4, 'X') @ car.matrix_world
bpy.context.view_layer.update()
rng = random.Random(1784)
for k in range(18):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(-0.9, 0.95)
    if math.hypot(x, y) > 1.15 or abs(x) < 0.32 or abs(x - FX) < 0.08:
        continue
    ball(f'tree{k}', M['tree'], x, y, ground(y) + 0.1, rng.uniform(0.08, 0.12), outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
