# A cartoon Ashur for the country maps, built in the set's shared look (../toon.py): the first
# capital of Assyria on its cliff over the Tigris in Iraq, the worn mud-brick mound of the great
# ziggurat of the god Ashur, the city walls with their towers along the edge of the plateau, the
# rebuilt Tabira gate, and the river below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ashur.py -- ashur-1024.png 1024 ashur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d6c294', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'plateau': toon('plateau', '#c8ad7e', shadow_mul=(0.8, 0.76, 0.8)),
    'brick': toon('brick', '#c09464', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'brickLight': toon('brickLight', '#d2aa78', lift=0.15),
    'water': toon('water', '#4a96c0', lift=0.3),
    'dark': flat('dark', '#2e2620'),
    'shrub': toon('shrub', '#8a9a5a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(200200)


# ---------- the Tigris on the right, below the cliff ----------
loft('river', M['water'], [[(0.78, -1.1, G - 0.004), (1.3, -0.5, G - 0.004), (1.3, 0.5, G - 0.004), (0.78, 1.1, G - 0.004)],
                           [(0.78, -1.1, G + 0.008), (1.3, -0.5, G + 0.008), (1.3, 0.5, G + 0.008), (0.78, 1.1, G + 0.008)]], outline=0.002)

# ---------- the plateau and its cliff ----------
PZ = G + 0.12
plat = loft('plateau', M['plateau'], [[(-1.05, -0.7, G - 0.01), (0.72, -0.9, G - 0.01), (0.72, 0.9, G - 0.01), (-1.05, 0.7, G - 0.01)],
                                      [(-1.0, -0.65, PZ), (0.64, -0.82, PZ), (0.64, 0.82, PZ), (-1.0, 0.65, PZ)]], outline=0.006)
plat.visible_shadow = False

# ---------- the ziggurat's worn mound ----------
ZX, ZY = 0.25, 0.3
zig = loft('ziggurat', M['brick'], [[(ZX - 0.3, ZY - 0.28, PZ - 0.005), (ZX + 0.3, ZY - 0.28, PZ - 0.005), (ZX + 0.3, ZY + 0.28, PZ - 0.005), (ZX - 0.3, ZY + 0.28, PZ - 0.005)],
                                    [(ZX - 0.24, ZY - 0.22, PZ + 0.14), (ZX + 0.24, ZY - 0.22, PZ + 0.14), (ZX + 0.24, ZY + 0.22, PZ + 0.14), (ZX - 0.24, ZY + 0.22, PZ + 0.14)],
                                    [(ZX - 0.16, ZY - 0.14, PZ + 0.3), (ZX + 0.12, ZY - 0.16, PZ + 0.32), (ZX + 0.14, ZY + 0.14, PZ + 0.28), (ZX - 0.12, ZY + 0.12, PZ + 0.31)],
                                    [(ZX - 0.07, ZY - 0.05, PZ + 0.38), (ZX + 0.05, ZY - 0.07, PZ + 0.39), (ZX + 0.06, ZY + 0.05, PZ + 0.37), (ZX - 0.05, ZY + 0.06, PZ + 0.38)]], outline=0.007)
for k in range(5):
    box(f'zigcourse{k}', M['brickLight'], ZX - 0.25 + k * 0.12, ZY - 0.235, PZ + 0.1, 0.07, 0.02, 0.03, outline=0.001, bevel=0)

# ---------- the walls along the plateau's edge ----------
for k in range(8):
    y = -0.6 + k * 0.17
    box(f'wall{k}', M['brickLight'], 0.6, y, PZ - 0.005, 0.05, 0.17, 0.06 + 0.02 * rng.random(), outline=0.003, bevel=0)
for k in range(4):
    y = -0.6 + k * 0.4
    box(f'walltower{k}', M['brickLight'], 0.6, y, PZ - 0.005, 0.09, 0.09, 0.11, outline=0.003, bevel=0)
for k in range(6):
    x = -0.85 + k * 0.24
    box(f'frontwall{k}', M['brickLight'], x, -0.61 - 0.17 * (x + 1.0) / 1.64, PZ - 0.005, 0.24, 0.05, 0.05 + 0.02 * rng.random(), outline=0.003, bevel=0)

# ---------- the Tabira gate ----------
GX, GY = -0.35, -0.2
for s in (-1, 1):
    box(f'gatetower{s}', M['brickLight'], GX + s * 0.11, GY, PZ - 0.005, 0.12, 0.16, 0.26, outline=0.006, bevel=0)
    for j in range(3):
        box(f'merlon{s}{j}', M['brickLight'], GX + s * 0.11 - 0.04 + j * 0.04, GY - 0.065, PZ + 0.255, 0.025, 0.025, 0.03, outline=0.001, bevel=0)
box('gatelintel', M['brickLight'], GX, GY, PZ + 0.15, 0.12, 0.14, 0.08, outline=0.004, bevel=0)
arch('gatepassage', M['dark'], GX, GY - 0.072, PZ - 0.005, 0.08, 0.15)

# ---------- ruins of houses and temples ----------
for k in range(7):
    x, y = -0.85 + 0.5 * rng.random(), -0.4 + 0.9 * rng.random()
    w, d = 0.1 + 0.08 * rng.random(), 0.08 + 0.06 * rng.random()
    box(f'ruin{k}a', M['brick'], x, y - d / 2, PZ - 0.005, w, 0.02, 0.03 + 0.03 * rng.random(), outline=0.001, bevel=0)
    box(f'ruin{k}b', M['brick'], x - w / 2, y, PZ - 0.005, 0.02, d, 0.03 + 0.03 * rng.random(), outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.6, -0.92), (-0.2, -0.98), (0.25, -1.02), (-1.15, 0.2), (-1.1, 0.5), (-0.7, 0.92))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.04, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
