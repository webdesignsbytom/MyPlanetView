# A cartoon Pile Dwellings of Unteruhldingen for the country maps, built in the set's shared look
# (../toon.py): the prehistoric lake villages round the Alps, here rebuilt on Lake Constance in
# Germany: wooden houses with steep thatched roofs and wattle walls standing on stilts over the
# water, the plank walkways between them, a dugout canoe, and the green shore. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P pile-dwellings.py -- pile-dwellings-1024.png 1024 pile-dwellings.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'water': toon('water', '#4a9ac8', shadow_mul=(0.8, 0.84, 0.9), lift=0.3),
    'wall': toon('wall', '#b89468', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'thatch': toon('thatch', '#c8a458', shadow_mul=(0.8, 0.76, 0.76), lift=0.15),
    'wood': toon('wood', '#6a4a30'),
    'plank': toon('plank', '#9a7650'),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['water'])
before = set(bpy.data.objects)
rng = random.Random(4580)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the shore at the back ----------
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('shore', M['grass'], [strip(0.72, 1.36, 1.38, G - 0.01), strip(0.72, 1.36, 1.38, G + 0.03)], outline=0.004)

# ---------- the houses on their stilts ----------
PZ = G + 0.1
HOUSES = ((-0.4, 0.25, 0.3, 0.22), (0.12, 0.38, 0.28, 0.2), (0.55, 0.05, 0.26, 0.22), (-0.15, -0.3, 0.3, 0.2), (0.4, -0.45, 0.24, 0.2))
for k, (x, y, w, d) in enumerate(HOUSES):
    for i in (-1, 1):
        for j in (-1, 1):
            rod(f'stilt{k}{i}{j}', M['wood'], (x + i * (w / 2 - 0.02), y + j * (d / 2 - 0.02), G - 0.01), (x + i * (w / 2 - 0.02), y + j * (d / 2 - 0.02), PZ), 0.01, segs=6, outline=0.001)
    box(f'platform{k}', M['plank'], x, y, PZ, w + 0.06, d + 0.06, 0.018, outline=0.002, bevel=0)
    box(f'house{k}', M['wall'], x, y, PZ + 0.015, w, d, 0.1, outline=0.004, bevel=0)
    gable(f'roof{k}', M['thatch'], x, y, PZ + 0.11, w, d, 0.16, ridge_x=True, over=0.03, outline=0.005)
    box(f'door{k}', M['dark'], x, y - d / 2 - 0.003, PZ + 0.015, 0.04, 0.006, 0.07, outline=0, bevel=0)

# ---------- the walkways ----------
WALKS = (((-0.4, 0.13), (-0.15, -0.2)), ((-0.15, -0.4), (0.4, -0.55)), ((0.12, 0.28), (0.55, 0.15)), ((-0.4, 0.36), (-0.4, 0.75)), ((0.12, 0.48), (0.12, 0.75)))
for k, (p0, p1) in enumerate(WALKS):
    bar(f'walk{k}', M['plank'], (p0[0], p0[1], PZ + 0.009), (p1[0], p1[1], PZ + 0.009), 0.05, outline=0.002)
    n = max(2, int(math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 0.12))
    for j in range(n + 1):
        t = j / n
        rod(f'walkpost{k}{j}', M['wood'], (p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, G - 0.01), (p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, PZ), 0.007, segs=6, outline=0)
# a palisade along the front and a dugout canoe
for k in range(16):
    a = math.pi + 0.35 + k * (math.pi - 0.7) / 15
    x, y = 0.95 * math.cos(a), 0.95 * math.sin(a) + 0.05
    rod(f'palisade{k}', M['wood'], (x, y, G - 0.01), (x, y, G + 0.09 + 0.02 * (k % 2)), 0.012, segs=6, outline=0.001)
cyl('canoe', M['wood'], 0.028, 0.26, segs=10, outline=0.002, matrix=Matrix.Translation((-0.7, -0.35, G + 0.01)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))

for k, (x, y) in enumerate(((-0.75, 0.95), (-0.2, 1.1), (0.55, 1.0), (0.9, 0.85))):
    tree(f'tree{k}', x, y, r=0.1, h=0.14)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
