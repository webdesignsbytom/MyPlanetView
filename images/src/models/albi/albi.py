# A cartoon Albi for the country maps, built in the set's shared look (../toon.py): the cathedral
# of Sainte-Cécile, a fortress of red brick with its round buttress towers all along its walls and
# the tall stepped bell tower with corner turrets at its west end, the Berbie Palace beside it, and
# the brick arches of the Pont Vieux crossing the Tarn. Turned a little towards the camera.
# Run: blender -b --factory-startup -P albi.py -- albi-1024.png 1024 albi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bank': toon('bank', '#c8bca8', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'grass': toon('grass2', '#7cb85a'),
    'river': toon('river', '#5a8a7a', lift=0.25),
    'brick': toon('brick', '#c86a4a', shadow_mul=(0.86, 0.8, 0.76), lift=0.04),
    'brickDark': toon('brickDark', '#a04e34'),
    'roof': toon('roof', '#b8503e'),
    'window': flat('window', '#3a2a28'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['bank'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('tarn', M['river'], [strip(-1.25, -0.5, 1.33, -0.004), strip(-1.25, -0.5, 1.33, 0.006)], outline=0.004)

# ---------- the Pont Vieux ----------
BX = -0.55
box('bridge', M['brick'], BX, -0.8, G - 0.005, 0.1, 0.6, 0.1, outline=0.006, bevel=0)
for k in range(4):
    y = -1.05 + k * 0.14
    if y < -0.5 and math.hypot(BX, y) < 1.2:
        box(f'bridgearch{k}', M['window'], BX - 0.053, y + 0.05, G - 0.005, 0.006, 0.08, 0.04, outline=0, bevel=0)
        cyl(f'bridgearchtop{k}', M['window'], 0.04, 0.006, segs=14, outline=0, matrix=Matrix.Translation((BX - 0.053, y + 0.05, G + 0.035)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))

# ---------- the cathedral ----------
CY, X0, X1, W, H = 0.2, -0.3, 0.55, 0.26, 0.3
box('cathedral', M['brick'], (X0 + X1) / 2, CY, G - 0.005, X1 - X0, W, H, outline=0.009, bevel=0)
loft('cathedralroof', M['roof'], [[(X0, CY - W / 2, G + H - 0.005), (X1, CY - W / 2, G + H - 0.005), (X1, CY + W / 2, G + H - 0.005), (X0, CY + W / 2, G + H - 0.005)],
                                  [(X0, CY - 0.004, G + H + 0.06), (X1, CY - 0.004, G + H + 0.06), (X1, CY + 0.004, G + H + 0.06), (X0, CY + 0.004, G + H + 0.06)]], outline=0.005)
for j in range(9):
    x = X0 + 0.06 + j * (X1 - X0 - 0.1) / 8
    lathe(f'buttress{j}', M['brick'], ((0.032, 0), (0.032, H + 0.02)), G - 0.005, x, CY - W / 2, segs=12, outline=0.003)
    if j < 8:
        box(f'win{j}', M['window'], x + (X1 - X0 - 0.1) / 16, CY - W / 2 - 0.003, G + 0.12, 0.022, 0.006, 0.15, outline=0, bevel=0)
lathe('apse', M['brick'], ((W / 2, 0), (W / 2, H)), G - 0.005, X1, CY, segs=14, outline=0.007)
lathe('apseroof', M['roof'], ((W / 2 + 0.005, 0), (0.004, 0.06)), G + H - 0.005, X1, CY, segs=14, outline=0.004)
# the bell tower
TX = X0 - 0.08
z = G - 0.005
for k, (w, h) in enumerate(((0.2, 0.34), (0.16, 0.14), (0.13, 0.1), (0.1, 0.08))):
    box(f'tower{k}', M['brick'], TX, CY, z, w, w, h, outline=0.007, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            lathe(f'turret{k}{sx}{sy}', M['brick'], ((0.025, 0), (0.025, h + 0.02)), z, TX + sx * w / 2, CY + sy * w / 2, segs=10, outline=0.002)
    box(f'towerwin{k}', M['window'], TX, CY - w / 2 - 0.003, z + h * 0.35, 0.03, 0.006, h * 0.45, outline=0, bevel=0)
    z += h
box('towertop', M['brickDark'], TX, CY, z - 0.005, 0.11, 0.11, 0.015, outline=0.001, bevel=0)

# ---------- the Berbie Palace ----------
box('berbie', M['brick'], -0.05, -0.28, G - 0.005, 0.5, 0.2, 0.18, outline=0.007, bevel=0)
for j in range(6):
    box(f'berbiewin{j}', M['window'], -0.27 + j * 0.088, -0.383, G + 0.08, 0.025, 0.006, 0.05, outline=0, bevel=0)
box('berbieterrace', M['grass'], 0.4, -0.3, G - 0.003, 0.3, 0.25, 0.012, outline=0.001, bevel=0)
box('berbiekeep', M['brick'], -0.25, -0.25, G - 0.005, 0.1, 0.1, 0.27, outline=0.005, bevel=0)
for k, (x, y, r) in enumerate(((0.8, 0.0, 0.1), (0.75, 0.45, 0.1), (-0.85, 0.2, 0.1), (0.35, 0.65, 0.09))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
