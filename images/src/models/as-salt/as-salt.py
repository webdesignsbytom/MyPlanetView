# A cartoon As-Salt for the country maps, built in the set's shared look (../toon.py): the old
# merchant town in the hills of Jordan, its houses of honey-yellow limestone stacked up the
# steep slopes with flat roofs, tall arched windows and domes, the Abu Jaber mansion's
# three arches on its terrace, and the stairs climbing between them. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P as-salt.py -- as-salt-1024.png 1024 as-salt.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a8b46a', shadow_mul=(0.75, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#b8b07a', shadow_mul=(0.78, 0.78, 0.82)),
    'stone': toon('stone', '#e2c27e', shadow_mul=(0.8, 0.76, 0.8), lift=0.16),
    'stoneLight': toon('stoneLight', '#ecd29a', lift=0.18),
    'dark': flat('dark', '#3a2a20'),
    'tree': toon('tree', '#5a8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(867586)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the hillside in terraces ----------
LEVELS = ((-0.3, G + 0.1), (0.05, G + 0.2), (0.4, G + 0.3))
for k, (y0, z) in enumerate(LEVELS):
    ring = [(-1.18, y0), (1.18, y0), (0.9, 0.95), (-0.9, 0.95)]
    t = loft(f'terrace{k}', M['hill'], [[(x, y, G - 0.01) for x, y in ring], [(x, y, z) for x, y in ring]], outline=0.005)
    t.visible_shadow = False


def house(name, x, y, z, w, d, h, mat, dome=False, arches=2):
    box(name, mat, x, y, z - 0.005, w, d, h, outline=0.005, bevel=0)
    box(name + 'parapet', M['stoneLight'], x, y, z + h - 0.005, w + 0.01, d + 0.01, 0.015, outline=0.001, bevel=0)
    for j in range(arches):
        arch(f'{name}win{j}', M['dark'], x - w / 2 + (j + 0.5) * w / arches, y - d / 2 - 0.003, z + h * 0.35, 0.03, h * 0.45)
    if dome:
        lathe(name + 'dome', M['stoneLight'], [(0.06 * math.cos(a), 0.06 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], z + h, x, y + d * 0.1, segs=16, outline=0.003)


# the rows of houses, one on each step of the hill (the mansion takes the second row's middle)
ROWS = ((-0.55, G), (-0.15, G + 0.1), (0.22, G + 0.2), (0.6, G + 0.3))
for r, (y, z) in enumerate(ROWS):
    x = -0.95 + 0.06 * (r % 2) + (0.1 if r == 3 else 0.0)
    k = 0
    while True:
        w = 0.22 + 0.08 * rng.random()
        if x + w > 0.52:
            break
        if r == 1 and -0.25 < x + w / 2 < 0.2:
            x += 0.05
            continue
        house(f'h{r}{k}', x + w / 2, y, z, w, 0.22, 0.12 + 0.1 * rng.random(), M['stone'] if (r + k) % 2 else M['stoneLight'], dome=(k % 3 == 1), arches=2 if w < 0.27 else 3)
        x += w + 0.03
        k += 1

# ---------- the Abu Jaber mansion's arcade ----------
AX, AY, AZ = -0.02, -0.1, G + 0.1
box('mansion', M['stoneLight'], AX, AY, AZ - 0.005, 0.38, 0.22, 0.26, outline=0.006, bevel=0)
box('mansionloggia', M['stone'], AX, AY - 0.12, AZ + 0.11, 0.3, 0.04, 0.15, outline=0.004, bevel=0)
for j in range(3):
    arch(f'mansionarch{j}', M['dark'], AX - 0.09 + j * 0.09, AY - 0.142, AZ + 0.12, 0.06, 0.12)
box('mansionparapet', M['stone'], AX, AY, AZ + 0.255, 0.4, 0.24, 0.02, outline=0.002, bevel=0)
# the stairs up the slope
for k in range(12):
    box(f'stair{k}', M['stoneLight'], 0.68, -0.75 + k * 0.1, G - 0.005, 0.1, 0.1, 0.3 * (k + 1) / 12, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((-0.95, -0.75), (0.35, -0.95), (0.95, -0.55))):
    tree(f'tree{k}', x, y, r=0.08, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
