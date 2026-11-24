# A cartoon Holstentor for the country maps, built in the set's shared look (../toon.py): Lübeck's
# brick city gate, its two fat round towers under tall pointed slate roofs, the middle block with
# the gate arch and its bands of dark glazed brick and terracotta, the lawn in front, and the old
# salt storehouses with their stepped gables by the Trave behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P holstentor.py -- holstentor-1024.png 1024 holstentor.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a7a9a', lift=0.3),
    'brick': toon('brick', '#b04a34', shadow_mul=(0.86, 0.78, 0.76), lift=0.04),
    'brickDark': toon('brickDark', '#5a2e28'),
    'terracotta': toon('terracotta', '#d8905a'),
    'slate': toon('slate', '#4a5058'),
    'dark': flat('dark', '#2a2424'),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'path': toon('path', '#c8c0b0'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('trave', M['river'], [strip(0.5, 0.75, 1.33, -0.004), strip(0.5, 0.75, 1.33, 0.006)], outline=0.004)
box('path', M['path'], 0.0, -0.45, G - 0.003, 0.14, 0.6, 0.008, outline=0, bevel=0)

# ---------- the gate ----------
GY = 0.05
box('middle', M['brick'], 0.0, GY, G - 0.005, 0.3, 0.22, 0.34, outline=0.008, bevel=0)
box('gatearch', M['dark'], 0.0, GY - 0.113, G - 0.005, 0.09, 0.006, 0.12, outline=0, bevel=0)
cyl('gatearchtop', M['dark'], 0.045, 0.006, segs=16, outline=0, matrix=Matrix.Translation((0.0, GY - 0.113, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('inscription', M['white'], 0.0, GY - 0.114, G + 0.19, 0.14, 0.004, 0.02, outline=0, bevel=0)
for k, z in enumerate((0.24, 0.29)):
    for j in range(4):
        box(f'midwin{k}{j}', M['dark'], -0.09 + j * 0.06, GY - 0.113, G + z, 0.022, 0.006, 0.035, outline=0, bevel=0)
loft('midroof', M['slate'], [[(-0.15, GY - 0.11, G + 0.335), (0.15, GY - 0.11, G + 0.335), (0.15, GY + 0.11, G + 0.335), (-0.15, GY + 0.11, G + 0.335)],
                             [(-0.15, GY - 0.004, G + 0.44), (0.15, GY - 0.004, G + 0.44), (0.15, GY + 0.004, G + 0.44), (-0.15, GY + 0.004, G + 0.44)]], outline=0.005)
lathe('ridgeturret', M['slate'], ((0.02, 0), (0.02, 0.04), (0.004, 0.1)), G + 0.43, 0.0, GY, segs=8, outline=0.002, smooth=False)
for s in (-1, 1):
    tx = s * 0.22
    lathe(f'tower{s}', M['brick'], ((0.12, 0), (0.12, 0.36)), G - 0.005, tx, GY, segs=24, outline=0.008)
    for k, z in enumerate((0.1, 0.18, 0.26)):
        lathe(f'band{s}{k}', M['brickDark'], ((0.123, 0), (0.123, 0.02)), G + z, tx, GY, segs=24, outline=0)
        lathe(f'terra{s}{k}', M['terracotta'], ((0.124, 0), (0.124, 0.008)), G + z + 0.025, tx, GY, segs=24, outline=0)
    for k, z in enumerate((0.12, 0.2, 0.28)):
        a = -math.pi / 2 + s * 0.4
        box(f'towerwin{s}{k}', M['dark'], tx + 0.118 * math.cos(a), GY + 0.118 * math.sin(a), G + z + 0.035, 0.022, 0.006, 0.035, rot_z=a + math.pi / 2, outline=0, bevel=0)
    lathe(f'towerroof{s}', M['slate'], ((0.13, 0), (0.06, 0.12), (0.004, 0.3)), G + 0.355, tx, GY, segs=24, outline=0.006)
    ball(f'towerball{s}', M['terracotta'], tx, GY, G + 0.66, 0.012, outline=0)

# ---------- the salt storehouses ----------
for k in range(5):
    x = -0.52 + k * 0.26
    if abs(x) < 0.15:
        x += 0.1 if x >= 0 else -0.1
    box(f'salt{k}', M['brick'], x, 0.38, G - 0.005, 0.2, 0.14, 0.2, outline=0.005, bevel=0)
    for j, (w, h) in enumerate(((0.16, 0.05), (0.11, 0.05), (0.06, 0.04))):
        box(f'saltgable{k}{j}', M['brick'], x, 0.32, G + 0.195 + j * 0.05, w, 0.03, h, outline=0.002, bevel=0)
    for r in range(3):
        box(f'saltwin{k}{r}', M['dark'], x, 0.307, G + 0.04 + r * 0.05, 0.08, 0.006, 0.025, outline=0, bevel=0)

turn(before, -20)
render(G)
