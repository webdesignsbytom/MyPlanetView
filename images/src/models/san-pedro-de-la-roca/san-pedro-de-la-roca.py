# A cartoon San Pedro de la Roca for the country maps, built in the set's shared look (../toon.py): El
# Morro, the Spanish fortress guarding the entrance to Santiago de Cuba's harbour, its stone
# terraces and batteries stepping up the rocky headland over the Caribbean, the bastions with their
# round domed sentry boxes at the corners, the cannons on the platforms, and the little lighthouse
# at the top. Turned a little towards the camera.
# Run: blender -b --factory-startup -P san-pedro-de-la-roca.py -- san-pedro-de-la-roca-1024.png 1024 san-pedro-de-la-roca.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'water': toon('water', '#2f8fc0', lift=0.3),
    'rock': toon('rock', '#a8987e', shadow_mul=(0.8, 0.78, 0.84)),
    'stone': toon('stone', '#d8c49c', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'stoneDark': toon('stoneDark', '#b8a47c'),
    'white': toon('white', '#f6f4ee', lift=0.22),
    'red': toon('red', '#c0403a', lift=0.12),
    'iron': toon('iron', '#3a3e44'),
    'dark': flat('dark', '#2e2a2a'),
    'palm': toon('palm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


def garita(name, x, y, z):
    """A round sentry box with its little dome."""
    lathe(name, M['stone'], ((0.028, 0), (0.028, 0.06)), z, x, y, segs=12, outline=0.002)
    lathe(f'{name}dome', M['stone'], ((0.032, 0), (0.025, 0.02), (0.0, 0.035)), z + 0.06, x, y, segs=12, outline=0.002)
    box(f'{name}slit', M['dark'], x, y - 0.029, z + 0.025, 0.008, 0.004, 0.02, outline=0, bevel=0)


# ---------- the sea and the headland ----------
loft('sea', M['water'], [strip(-1.31, -0.55, 1.32, G - 0.004), strip(-1.31, -0.55, 1.32, G + 0.008)], outline=0.002)
head = loft('headland', M['rock'], [[(-0.85, -0.55, G - 0.01), (0.75, -0.55, G - 0.01), (0.9, 0.5, G - 0.01), (-0.9, 0.5, G - 0.01)],
                                    [(-0.6, -0.35, G + 0.18), (0.55, -0.35, G + 0.18), (0.65, 0.4, G + 0.18), (-0.65, 0.4, G + 0.18)]], outline=0.007)
head.visible_shadow = False
H0 = G + 0.17

# ---------- the terraces of the fortress, stepping up ----------
TERRACES = ((-0.5, 0.5, -0.32, 0.38, 0.08), (-0.38, 0.38, -0.12, 0.36, 0.08), (-0.24, 0.26, 0.06, 0.34, 0.09))
z = H0
for k, (x0, x1, y0, y1, h) in enumerate(TERRACES):
    box(f'terrace{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, z, x1 - x0, y1 - y0, h, outline=0.006, bevel=0)
    box(f'parapet{k}', M['stoneDark'], (x0 + x1) / 2, y0 + 0.01, z + h - 0.005, x1 - x0, 0.02, 0.025, outline=0.002, bevel=0)
    for j in range(4):
        x = x0 + (j + 0.5) * (x1 - x0) / 4
        box(f'embrasure{k}{j}', M['dark'], x, y0 + 0.004, z + h + 0.005, 0.025, 0.02, 0.016, outline=0, bevel=0)
        if k < 2:
            bar(f'cannon{k}{j}', M['iron'], (x, y0 + 0.05, z + h + 0.012), (x, y0 - 0.01, z + h + 0.016), 0.014, outline=0.001)
    box(f'gun{k}', M['dark'], (x0 + x1) / 2, y0 - 0.003, z + h * 0.35, 0.05, 0.006, 0.03, outline=0, bevel=0)
    garita(f'garita{k}l', x0 + 0.02, y0 + 0.02, z + h)
    garita(f'garita{k}r', x1 - 0.02, y0 + 0.02, z + h)
    z += h
# the lighthouse at the top
LX, LY = 0.1, 0.25
lathe('lighthouse', M['white'], ((0.035, 0), (0.03, 0.2)), z - 0.005, LX, LY, segs=12, outline=0.003)
lathe('lantern', M['red'], ((0.03, 0), (0.03, 0.04), (0.003, 0.07)), z + 0.195, LX, LY, segs=12, outline=0.002, smooth=False)

for k, (x, y) in enumerate(((0.95, 0.3), (-0.95, 0.35), (0.55, 0.85), (-0.5, 0.85))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        b = ball(f'frond{k}{j}', M['palm'], 0, 0, 0, 1.0, outline=0.003)
        b.scale = (0.08, 0.02, 0.012)
        b.rotation_euler = (0, 0.35, a)
        b.location = (x + 0.02 + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.29)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
