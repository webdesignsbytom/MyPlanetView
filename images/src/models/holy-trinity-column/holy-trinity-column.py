# A cartoon Holy Trinity Column for the country maps, built in the set's shared look (../toon.py): the
# great baroque column on Olomouc's Upper Square, its three-storey base with the little chapel inside
# and the stone saints and angels on every tier, the tall column rising out of it covered with more
# figures, and at the top the gilded copper group of the Holy Trinity with the Archangel Michael below,
# with the town hall's astronomical clock tower and the square's houses round it. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P holy-trinity-column.py -- holy-trinity-column-1024.png 1024 holy-trinity-column.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobbles': toon('cobbles', '#c8c0b0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#e8e0cc', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#c8bca0'),
    'gold': toon('gold', '#f0c040', shadow_mul=(0.86, 0.76, 0.6), lift=0.3),
    'dark': flat('dark', '#2e2a2a'),
    'house': toon('house', '#f0dcb4', lift=0.12),
    'roof': toon('roof', '#b8503e'),
    'clock': toon('clock', '#2a4a8a'),
})

G = tile(M['cobbles'])
before = set(bpy.data.objects)
rng = random.Random(1754)


def figure(name, x, y, z, s=1.0, mat='stone'):
    rod(name, M[mat], (x, y, z), (x, y, z + 0.06 * s), 0.012 * s, r2=0.008 * s, segs=6, outline=0.001)
    ball(name + 'head', M[mat], x, y, z + 0.07 * s, 0.008 * s, outline=0.001)


# ---------- the base: three tiers, each with its figures ----------
CX, CY = 0.0, 0.05
Z = G - 0.005
for k, (r, h) in enumerate(((0.3, 0.12), (0.22, 0.12), (0.15, 0.1))):
    lathe(f'tier{k}', M['stone'], ((r, 0), (r, h)), Z, CX, CY, segs=6, outline=0.006, smooth=False)
    lathe(f'tiercornice{k}', M['stoneDark'], ((r + 0.01, 0), (r + 0.01, 0.015)), Z + h - 0.01, CX, CY, segs=6, outline=0.002, smooth=False)
    for j in range(6):
        a = 2 * math.pi * j / 6
        if math.sin(a) > 0.3:
            continue
        figure(f'saint{k}{j}', CX + (r + 0.02) * math.cos(a), CY + (r + 0.02) * math.sin(a), Z + h + 0.005, 1.0 - 0.15 * k)
    Z += h
box('chapeldoor', M['dark'], CX, CY - 0.26 * 1.0 - 0.003, G - 0.005, 0.06, 0.006, 0.09, outline=0, bevel=0)

# ---------- the column with its figures ----------
lathe('column', M['stone'], ((0.06, 0), (0.05, 0.42), (0.065, 0.44), (0.065, 0.46)), Z, CX, CY, segs=12, outline=0.005, smooth=False)
for k in range(8):
    a = 2 * math.pi * k / 8
    z = Z + 0.05 + k * 0.045
    figure(f'columnfigure{k}', CX + 0.07 * math.cos(a), CY + 0.07 * math.sin(a), z, 0.6)
# the gilded group at the top: the Archangel below, the Trinity above with the sunburst
TZ = Z + 0.46
figure('archangel', CX, CY - 0.02, TZ, 1.0, 'gold')
for s in (-1, 1):
    bar(f'archangelwing{s}', M['gold'], (CX, CY - 0.01, TZ + 0.05), (CX + s * 0.04, CY, TZ + 0.09), 0.01, outline=0.001)
lathe('cloud', M['gold'], ((0.05, 0), (0.06, 0.03), (0.03, 0.05)), TZ + 0.07, CX, CY, segs=10, outline=0.002)
for k, dx in enumerate((-0.03, 0.03)):
    figure(f'trinity{k}', CX + dx, CY, TZ + 0.11, 1.0, 'gold')
for k in range(10):
    a = 2 * math.pi * k / 10
    bar(f'ray{k}', M['gold'], (CX, CY + 0.01, TZ + 0.2), (CX + 0.07 * math.cos(a), CY + 0.01, TZ + 0.2 + 0.07 * math.sin(a)), 0.006, outline=0)

# ---------- the town hall tower and the square's houses ----------
HX, HY = -0.6, 0.45
box('townhall', M['house'], HX, HY, G - 0.005, 0.3, 0.24, 0.24, outline=0.006, bevel=0)
box('townhalltower', M['house'], HX + 0.08, HY - 0.05, G - 0.005, 0.1, 0.1, 0.62, outline=0.005, bevel=0)
cyl('clockface', M['clock'], 0.03, 0.006, segs=14, outline=0.001, matrix=Matrix.Translation((HX + 0.08, HY - 0.103, G + 0.48)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('towercap', M['roof'], ((0.06, 0), (0.003, 0.14)), G + 0.615, HX + 0.08, HY - 0.05, segs=4, outline=0.003, smooth=False)
for k, (x, y) in enumerate(((0.55, 0.55), (0.75, 0.15), (0.7, -0.35), (-0.75, -0.25), (0.2, 0.8))):
    h = rng.uniform(0.18, 0.24)
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.22, 0.2, h, outline=0.005, bevel=0)
    for j in (-1, 1):
        box(f'housewin{k}{j}', M['dark'], x + j * 0.05, y - 0.103, G + h - 0.1, 0.03, 0.006, 0.04, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.11, y - 0.1, G + h - 0.005), (x + 0.11, y - 0.1, G + h - 0.005), (x + 0.11, y + 0.1, G + h - 0.005), (x - 0.11, y + 0.1, G + h - 0.005)],
                                      [(x - 0.11, y - 0.004, G + h + 0.07), (x + 0.11, y - 0.004, G + h + 0.07), (x + 0.11, y + 0.004, G + h + 0.07), (x - 0.11, y + 0.004, G + h + 0.07)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
