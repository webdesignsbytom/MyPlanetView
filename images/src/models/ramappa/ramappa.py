# A cartoon Ramappa Temple for the country maps, built in the set's shared look (../toon.py): the
# Kakatiya temple of Rudreshwara at Palampet in Telangana, India, named after its sculptor: the
# star-shaped platform, the pillared hall with its carved bracket figures of dancers leaning out
# under the eaves, the stepped tower of light brick over the shrine, the Nandi pavilion before
# it, and the green fields and lake round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ramappa.py -- ramappa-1024.png 1024 ramappa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#c8a47a', shadow_mul=(0.8, 0.76, 0.8), lift=0.14),
    'stoneDark': toon('stoneDark', '#6a5e54'),
    'brick': toon('brick', '#e0c8a0', lift=0.18),
    'path': toon('path2', '#e2d4b4', lift=0.18),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)

def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('lake', M['water'], [strip(0.85, 1.31, 1.32, G - 0.004), strip(0.85, 1.31, 1.32, G + 0.008)], outline=0.002)
box('court', M['path'], 0.0, 0.0, G - 0.004, 1.3, 1.0, 0.008, outline=0.001, bevel=0)

# ---------- the star-shaped platform ----------
TX, TY = 0.0, 0.1
star = []
for k in range(16):
    a = 2 * math.pi * k / 16 + math.pi / 16
    r = 0.42 if k % 2 == 0 else 0.34
    star.append((TX + r * math.cos(a), TY + r * math.sin(a)))
loft('platform', M['stone'], [[(x, y, G - 0.005) for x, y in star], [(x, y, G + 0.07) for x, y in star]], outline=0.005)
for k in range(4):
    box(f'platstep{k}', M['stone'], TX, TY - 0.44 + k * 0.02, G - 0.005, 0.14, 0.03, 0.02 * (k + 1), outline=0.001, bevel=0)

# ---------- the pillared hall ----------
HY = TY - 0.1
box('hallfloor', M['stoneDark'], TX, HY, G + 0.065, 0.42, 0.36, 0.015, outline=0.002, bevel=0)
for i in range(4):
    for j in range(3):
        if 0 < i < 3 and j == 1:
            continue
        lathe(f'hallpillar{i}{j}', M['stoneDark'], ((0.018, 0), (0.018, 0.13)), G + 0.075, TX - 0.15 + i * 0.1, HY - 0.12 + j * 0.12, segs=8, outline=0.001, smooth=False)
box('hallroof', M['stone'], TX, HY, G + 0.2, 0.46, 0.4, 0.035, outline=0.004, bevel=0)
# the leaning bracket dancers under the eaves
for k in range(4):
    x = TX - 0.15 + k * 0.1
    bar(f'dancer{k}', M['stoneDark'], (x, HY - 0.18, G + 0.11), (x, HY - 0.22, G + 0.19), 0.016, outline=0.001)
    ball(f'dancerhead{k}', M['stoneDark'], x, HY - 0.225, G + 0.2, 0.012, outline=0.001)
box('halldoor', M['dark'], TX, HY + 0.02, G + 0.08, 0.06, 0.006, 0.1, outline=0, bevel=0)

# ---------- the shrine and its stepped tower ----------
SY = TY + 0.22
box('shrine', M['stone'], TX, SY, G + 0.065, 0.24, 0.24, 0.15, outline=0.005, bevel=0)
z, w = G + 0.21, 0.24
for k in range(5):
    box(f'tower{k}', M['brick'], TX, SY, z, w, w, 0.065, outline=0.003, bevel=0)
    for c in (-1, 1):
        for d in (-1, 1):
            box(f'towerkuta{k}{c}{d}', M['brick'], TX + c * (w / 2 - 0.015), SY + d * (w / 2 - 0.015), z + 0.065, 0.025, 0.025, 0.02, outline=0.001, bevel=0)
    z += 0.065
    w *= 0.82
lathe('towertop', M['brick'], ((w * 0.6, 0), (w * 0.7, 0.04), (w * 0.4, 0.08), (0.0, 0.11)), z, TX, SY, segs=8, outline=0.003, smooth=False)

# ---------- the Nandi pavilion ----------
NY = TY - 0.62
box('nandiplinth', M['stone'], TX, NY, G - 0.005, 0.18, 0.18, 0.05, outline=0.003, bevel=0)
b = ball('nandi', M['stoneDark'], 0, 0, 0, 0.045, outline=0.003)
b.scale = (0.8, 1.4, 0.8)
b.location = (TX, NY, G + 0.08)
ball('nandihead', M['stoneDark'], TX, NY - 0.07, G + 0.1, 0.025, outline=0.002)

for k, (x, y) in enumerate(((-0.85, -0.3), (0.85, -0.3), (-0.75, 0.5), (0.75, 0.5), (-0.5, -0.85), (0.5, -0.85))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
