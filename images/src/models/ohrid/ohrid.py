# A cartoon Ohrid for the country maps, built in the set's shared look (../toon.py) on a tile of
# lake water: the little Byzantine Church of Saint John at Kaneo on its rocky headland above Lake
# Ohrid, its walls banded in brick and stone, red tiled roofs, the apse and the octagonal drum
# under its dome; pines on the cliff, a rowing boat on the lake, and the hills across the water.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P ohrid.py -- ohrid-1024.png 1024 ohrid.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#3fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'rock': toon('rock', '#b4a58e', shadow_mul=(0.8, 0.76, 0.84)),
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#e6d8b8', shadow_mul=(0.8, 0.78, 0.86)),
    'brick': toon('brick', '#b8664a'),
    'tiles': toon('tiles', '#c8573a'),
    'window': flat('window', '#33303d'),
    'pine': toon('pine', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b4a33'),
    'hills': toon('hills', '#6a9a7a', shadow_mul=(0.72, 0.8, 0.84)),
    'boat': toon('boat', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'shirt': toon('shirt', '#f6f3ec', lift=0.2),
    'skin': toon('skin', '#e8b48f'),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(229)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def gable_roof(name, x, y, z, w, d, h, along_x=True):
    top = ([(x - w / 2, y - 0.004), (x + w / 2, y - 0.004), (x + w / 2, y + 0.004), (x - w / 2, y + 0.004)] if along_x else
           [(x - 0.004, y - d / 2), (x + 0.004, y - d / 2), (x + 0.004, y + d / 2), (x - 0.004, y + d / 2)])
    loft(name, M['tiles'], [[(x - w / 2 - 0.015, y - d / 2 - 0.015, z), (x + w / 2 + 0.015, y - d / 2 - 0.015, z), (x + w / 2 + 0.015, y + d / 2 + 0.015, z),
                             (x - w / 2 - 0.015, y + d / 2 + 0.015, z)],
                            [(px, py, z + h) for px, py in top]], outline=0.014)


def banded(name, x, y, w, d, z0, h, bands=5):
    """A wall block banded in stone and brick."""
    for k in range(bands):
        box(f'{name}{k}', M['stone' if k % 2 == 0 else 'brick'], x, y, z0 + k * h / bands, w, d, h / bands + 0.001, outline=0.014 if k == 0 else 0.012,
            bevel=0)


# ---------- the hills across the lake ----------
for k, (cx, cy, r, h) in enumerate(((0.45, 0.95, 0.45, 0.42), (-0.2, 1.08, 0.45, 0.3))):
    hl = loft(f'hill{k}', M['hills'], [ring(cx, cy, r, r * 0.45, -0.01, 0.03), ring(cx, cy, r * 0.6, r * 0.28, h * 0.6, 0.08), ring(cx, cy, r * 0.25, r * 0.12, h, 0.1)],
              outline=0.03)
    hl.visible_shadow = False

# ---------- the rocky headland ----------
HX, HY = -0.35, 0.0
head = loft('headland', M['rock'], [ring(HX, HY, 0.78, 0.62, -0.01, 0.05), ring(HX, HY, 0.72, 0.56, 0.25, 0.06), ring(HX, HY, 0.66, 0.5, 0.4, 0.04)],
            outline=0.035)
top = loft('headlandtop', M['grass'], [ring(HX, HY, 0.665, 0.505, 0.395, 0.0), ring(HX, HY, 0.6, 0.44, 0.44, 0.03)], outline=0.022)
head.visible_shadow = top.visible_shadow = False
T = G + 0.44

# ---------- the Church of Saint John at Kaneo ----------
CX, CY = HX + 0.12, HY - 0.05
banded('nave', CX, CY, 0.34, 0.2, T - 0.005, 0.18)
banded('crossarm', CX, CY, 0.2, 0.34, T - 0.005, 0.18)
gable_roof('naveroof', CX, CY, T + 0.175, 0.34, 0.2, 0.08)
gable_roof('armroof', CX, CY, T + 0.175, 0.2, 0.34, 0.08, along_x=False)
lathe('apse', M['brick'], ((0.08, 0), (0.08, 0.15)), T - 0.005, CX + 0.18, CY, segs=16, outline=0.014)
lathe('apseroof', M['tiles'], ((0.095, 0), (0.004, 0.06)), T + 0.145, CX + 0.18, CY, segs=16, outline=0.01)
lathe('drum', M['stone'], ((0.07, 0), (0.07, 0.14)), T + 0.22, CX, CY, segs=8, outline=0.012, smooth=False)
lathe('drumband', M['brick'], ((0.072, 0), (0.072, 0.03)), T + 0.28, CX, CY, segs=8, outline=0, smooth=False)
lathe('dome', M['tiles'], ((0.09, 0), (0.004, 0.1)), T + 0.36, CX, CY, segs=8, outline=0.012, smooth=False)
rod('cross', M['gold'], (CX, CY, T + 0.46), (CX, CY, T + 0.52), 0.005, segs=6, outline=0)
for k in range(8):
    a = math.pi / 8 + k * math.pi / 4
    box(f'drumwin{k}', M['window'], CX + 0.066 * math.cos(a), CY + 0.066 * math.sin(a), T + 0.25, 0.014, 0.014, 0.05, rot_z=a, outline=0, bevel=0)
box('door', M['window'], CX - 0.17 - 0.004, CY, T, 0.01, 0.05, 0.1, outline=0, bevel=0)
for k, dx in enumerate((-0.06, 0.06)):
    box(f'win{k}', M['window'], CX + dx, CY - 0.172, T + 0.07, 0.02, 0.01, 0.05, outline=0, bevel=0)

# ---------- pines on the cliff ----------
for k, (x, y) in enumerate(((HX - 0.42, HY + 0.2), (HX - 0.3, HY - 0.3), (HX + 0.35, HY + 0.28), (HX - 0.5, HY - 0.05))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, T), (x, y, T + 0.14), 0.016, segs=6, outline=0.006)
    b = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.1, outline=0.016)
    b.scale = (1.1, 1.1, 0.55)
    b.location = (x, y, T + 0.17)

# ---------- a rowing boat on the lake ----------
BX, BY = 0.55, -0.55
loft('boat', M['boat'], [[(BX - 0.12, BY, G - 0.005), (BX + 0.08, BY - 0.03, G - 0.005), (BX + 0.12, BY, G - 0.005), (BX + 0.08, BY + 0.03, G - 0.005)],
                         [(BX - 0.13, BY, G + 0.04), (BX + 0.08, BY - 0.05, G + 0.04), (BX + 0.15, BY, G + 0.04), (BX + 0.08, BY + 0.05, G + 0.04)]],
     outline=0.01)
rod('rower', M['shirt'], (BX, BY, G + 0.03), (BX, BY, G + 0.1), 0.02, segs=8, outline=0.006)
ball('rowerhead', M['skin'], BX, BY, G + 0.12, 0.02, outline=0.005)
for s in (-1, 1):
    bar(f'oar{s}', M['trunk'], (BX, BY + s * 0.02, G + 0.07), (BX - 0.04, BY + s * 0.14, G + 0.0), 0.007, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
