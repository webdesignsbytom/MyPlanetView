# A cartoon Alamut Castle for the country maps, built in the set's shared look (../toon.py): the
# Assassins' eagle's nest in the Alborz mountains of Iran, its ruined walls and towers along the
# top of a sheer crag of rock rising from the green valley, a path winding up, and the
# mountains behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P alamut.py -- alamut-1024.png 1024 alamut.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a4bc68', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#b09a7c', shadow_mul=(0.78, 0.74, 0.8), lift=0.12),
    'rockDark': toon('rockDark', '#8a7660'),
    'mountain': toon('mountain', '#9c907c', shadow_mul=(0.78, 0.78, 0.84)),
    'wall': toon('wall', '#c8b08a', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'path': toon('path2', '#e0cca4', lift=0.18),
    'dark': flat('dark', '#2e2620'),
    'tree': toon('tree', '#5a8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(4706020)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


for k, (x, y, r, h) in enumerate(((-0.6, 0.95, 0.4, 0.5), (0.35, 1.0, 0.36, 0.42))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.2, h * 0.92), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    mt.visible_shadow = False

# ---------- the crag ----------
RZ = G + 0.42
crag = loft('crag', M['rock'], [[(-0.55, -0.3, G - 0.01), (0.45, -0.4, G - 0.01), (0.6, 0.15, G - 0.01), (0.1, 0.45, G - 0.01), (-0.5, 0.3, G - 0.01)],
                                [(-0.45, -0.22, G + 0.25), (0.38, -0.32, G + 0.27), (0.5, 0.1, G + 0.26), (0.08, 0.36, G + 0.25), (-0.42, 0.24, G + 0.26)],
                                [(-0.4, -0.16, RZ), (0.32, -0.25, RZ), (0.42, 0.06, RZ), (0.05, 0.28, RZ), (-0.36, 0.18, RZ)]], outline=0.008)
crag.visible_shadow = False
for k in range(6):
    a = 2 * math.pi * k / 6 + 0.4
    bar(f'crack{k}', M['rockDark'], (0.45 * math.cos(a), 0.3 * math.sin(a) - 0.02, G + 0.03), (0.38 * math.cos(a), 0.24 * math.sin(a) - 0.02, G + 0.3), 0.015, outline=0)

# ---------- the castle's ruins on top ----------
PTS = ((-0.36, -0.13), (0.28, -0.22), (0.37, 0.04), (0.03, 0.24), (-0.32, 0.15))
for k in range(5):
    p0, p1 = PTS[k], PTS[(k + 1) % 5]
    h = 0.07 + 0.05 * rng.random()
    n = 3
    for j in range(n):
        t0, t1 = j / n, (j + 0.8) / n
        a = (p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0)
        b = (p0[0] + (p1[0] - p0[0]) * t1, p0[1] + (p1[1] - p0[1]) * t1)
        hh = h * (0.6 + 0.5 * rng.random())
        loft(f'wall{k}{j}', M['wall'], [[(a[0], a[1] - 0.015, RZ - 0.01), (b[0], b[1] - 0.015, RZ - 0.01), (b[0], b[1] + 0.015, RZ - 0.01), (a[0], a[1] + 0.015, RZ - 0.01)],
                                         [(a[0], a[1] - 0.015, RZ + hh), (b[0], b[1] - 0.015, RZ + hh), (b[0], b[1] + 0.015, RZ + hh), (a[0], a[1] + 0.015, RZ + hh)]], outline=0.003)
    lathe(f'tower{k}', M['wall'], ((0.045, 0), (0.042, 0.14 + 0.04 * rng.random())), RZ - 0.01, p0[0], p0[1], segs=10, outline=0.003, smooth=False)
box('keep', M['wall'], -0.05, 0.0, RZ - 0.01, 0.14, 0.12, 0.16, outline=0.004, bevel=0)
box('keepwin', M['dark'], -0.05, -0.062, RZ + 0.08, 0.025, 0.006, 0.04, outline=0, bevel=0)

# ---------- the path up from the valley ----------
for k in range(10):
    t = k / 9
    box(f'path{k}', M['path'], 0.3 - 0.2 * t + 0.08 * math.sin(4 * t), -1.05 + 0.65 * t, G - 0.004, 0.08, 0.08, 0.01, rot_z=0.4 * t, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((-0.95, -0.45), (-0.65, -0.8), (0.75, -0.7), (1.0, -0.15))):
    tree(f'tree{k}', x, y, r=0.08, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
