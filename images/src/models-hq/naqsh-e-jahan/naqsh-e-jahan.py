# Naqsh-e Jahan Square in the high-quality look (hq.py), laid out in metres (the square drawn shorter, to
# fit): Isfahan's great square seen from its north end; the Shah Mosque at the far end, its tiled portal
# between turquoise minarets and the great blue dome behind; the Sheikh Lotfollah Mosque on the left with
# its cream dome; the Ali Qapu palace on the right with the wooden columns of its high terrace; the
# two-storey arcades of tiled arches all round; the long pool down the middle with its fountains, lawns
# beside it, and people.
# Run: blender -b --factory-startup -P naqsh-e-jahan.py -- naqsh-e-jahan-1024.png 1024 naqsh-e-jahan.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1602)
M['brickN'] = material('isfahanBrick', '#cfae80', 0.85, vary='#c4a273', vary_scale=40, bump=0.1, bump_scale=200)
M['tileN'] = mosaic('isfahanTile', [(5, '#2a5fae'), (4, '#2fa0c6'), (1, '#f0e4c4'), (1, '#e2b23e'), (2, '#1d3c80')], scale=60, mortar='#d9cfb4', rough=0.35)
M['domeBlue'] = mosaic('shahDome', [(6, '#2f9fc6'), (3, '#2a5fae'), (1, '#f0e4c4'), (1, '#e2b23e')], scale=40, mortar='#1d3c80', rough=0.3)
M['domeCream'] = mosaic('lotfollahDome', [(6, '#dcc39a'), (2, '#c9a57a'), (1, '#2a5fae'), (1, '#2fa0c6')], scale=40, mortar='#b8956a', rough=0.35)
M['recessN'] = material('isfahanRecess', '#1f3a68', 0.6)
M['woodN'] = material('talarWood', '#7a5236', 0.7)
M['poolN'] = material('isfahanPool', '#3f8fb0', 0.05, coat=0.8)
M['lawnN'] = material('isfahanLawn', '#6aa443', 0.85, vary='#78b14e', vary_scale=12)
M['squareN'] = masonry('isfahanSquare', '#d2c09c', '#b29f7c', scale=90, rough=0.85, vary='#c8b692')

S = 0.0205              # metres to the tile's units
FY = 6.0
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def dome(name, cx, cy, z, r, mat, drum=6.0):
    cylinder(name + 'Drum', M['tileN'], r * S, drum * S, P(cx, cy, z), segs=48)
    prof = [(r, 0.0), (r * 1.08, r * 0.35), (r * 1.06, r * 0.7), (r * 0.86, r * 1.1), (r * 0.5, r * 1.45), (r * 0.15, r * 1.62), (0.0, r * 1.66)]
    lathe(name, M[mat], [(u * S, v * S) for u, v in prof], P(cx, cy, z + drum), segs=64, smooth=True)
    lathe(name + 'Finial', M['tileN'], [(0.4 * S, 0.0), (0.6 * S, 0.5 * S), (0.2 * S, 1.2 * S), (0.0, 2.6 * S)], P(cx, cy, z + drum + r * 1.66), segs=12)


WIN = []
BEFORE = set(bpy.data.objects)
slab('square', M['squareN'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
# ------------------------------------------------------------------ the pool and its lawns, fountains
block('pool', M['poolN'], -5.0, 5.0, -44.0, 26.0, 0.0, 0.3)
for s in (-1, 1):
    block(f'lawn{s}', M['lawnN'], *sorted((s * 7.0, s * 17.0)), -44.0, 26.0, 0.0, 0.2)
for k in range(7):
    lathe(f'fountain{k}', M['poolN'], [(0.5 * S, 0.0), (0.2 * S, 2.0 * S), (0.0, 2.6 * S)], P(0.0, -44.0 + 11.0 * k, 0.3), segs=8)

# ------------------------------------------------------------------ the arcades down both sides: two storeys of tiled arches
AXW = 34.0
for s in (-1, 1):
    x0, x1 = sorted((s * AXW, s * (AXW + 8.0)))
    for y0, y1 in ((-46.0, 2.0), (18.0, 34.0)):
        block(f'arcade{s}{y0:+.0f}', M['brickN'], x0, x1, y0, y1, 0.0, 12.0)
        block(f'arcadeTop{s}{y0:+.0f}', M['tileN'], x0, x1, y0, y1, 12.0, 12.8)
        n = int((y1 - y0) / 4.0)
        for k in range(n):
            y = y0 + (y1 - y0) * (k + 0.5) / n
            for z, h in ((0.6, 5.0), (6.6, 4.6)):
                c = P(s * (AXW - 0.05), y, 0)
                WIN.append((c.x, c.y, Z0 + z * S, 2.6 * S, h * S, (-s, 0), 'pointed'))

# ------------------------------------------------------------------ the Shah Mosque at the far end: portal, minarets, the great dome
PY = 38.0
block('mosqueWings', M['brickN'], -34.0, 34.0, PY, PY + 10.0, 0.0, 13.0)
block('mosqueWingTop', M['tileN'], -34.0, 34.0, PY, PY + 10.0, 13.0, 13.8)
block('portal', M['tileN'], -12.0, 12.0, PY - 3.0, PY + 6.0, 0.0, 30.0)
block('portalTop', M['domeBlue'], -12.4, 12.4, PY - 3.4, PY + 6.0, 29.0, 31.0)
c = P(0.0, PY - 3.05, 0)
WIN.append((c.x, c.y, Z0 + 0.0, 13.0 * S, 22.0 * S, (0, -1), 'pointed'))
for s in (-1, 1):
    cylinder(f'minaret{s}', M['tileN'], 2.0 * S, 40.0 * S, P(s * 10.0, PY + 3.0, 0.0), segs=24, r2=1.7 * S)
    cylinder(f'minaretBalcony{s}', M['brickN'], 2.6 * S, 1.6 * S, P(s * 10.0, PY + 3.0, 36.0), segs=24)
    lathe(f'minaretCap{s}', M['domeBlue'], [(1.7 * S, 0.0), (1.7 * S, 1.2 * S), (1.0 * S, 2.6 * S), (0.0, 3.6 * S)], P(s * 10.0, PY + 3.0, 40.0), segs=24, smooth=True)
for k in range(5):
    for s in (-1, 1):
        x = s * (15.0 + 4.0 * k)
        c = P(x, PY - 0.05, 0)
        WIN.append((c.x, c.y, Z0 + 1.0 * S, 2.6 * S, 5.0 * S, (0, -1), 'pointed'))
        WIN.append((c.x, c.y, Z0 + 7.0 * S, 2.6 * S, 4.6 * S, (0, -1), 'pointed'))
block('domeBase', M['brickN'], -16.0, 16.0, PY + 10.0, PY + 34.0, 0.0, 20.0)
dome('shahDome', 0.0, PY + 22.0, 20.0, 12.5, 'domeBlue', drum=7.0)

# ------------------------------------------------------------------ the Sheikh Lotfollah Mosque on the left, Ali Qapu on the right
LY = 10.0
block('lotfollahPortal', M['tileN'], -AXW - 1.5, -AXW + 2.0, LY - 8.0, LY + 8.0, 0.0, 18.0)
c = P(-AXW + 2.05, LY, 0)
WIN.append((c.x, c.y, Z0 + 0.0, 8.0 * S, 12.0 * S, (1, 0), 'pointed'))
block('lotfollahHall', M['brickN'], -AXW - 22.0, -AXW - 1.5, LY - 10.0, LY + 10.0, 0.0, 14.0)
dome('lotfollahDome', -AXW - 12.0, LY, 14.0, 9.0, 'domeCream', drum=5.0)
QY = -18.0
block('aliQapu', M['brickN'], AXW - 2.0, AXW + 16.0, QY - 10.0, QY + 10.0, 0.0, 30.0)
block('talarFloor', M['woodN'], AXW - 10.0, AXW - 2.0, QY - 9.0, QY + 9.0, 13.0, 14.0)
for i in range(3):
    for j in range(6):
        cylinder(f'talarCol{i}{j}', M['woodN'], 0.35 * S, 9.0 * S, P(AXW - 9.0 + 3.2 * i, QY - 7.5 + 3.0 * j, 14.0), segs=10)
block('talarRoof', M['woodN'], AXW - 10.6, AXW - 1.4, QY - 9.6, QY + 9.6, 23.0, 24.0)
block('talarBase', M['brickN'], AXW - 10.0, AXW - 2.0, QY - 9.0, QY + 9.0, 0.0, 13.0)
for k in range(4):
    for x, z in ((AXW - 10.05, 2.0), (AXW - 10.05, 7.6), (AXW - 2.05, 16.0), (AXW - 2.05, 25.4)):
        c = P(x, QY - 6.0 + 4.0 * k, 0)
        WIN.append((c.x, c.y, Z0 + z * S, 2.0 * S, 3.4 * S, (-1, 0), 'pointed'))
glazed('arches', WIN, M['tileN'], glass=M['recessN'], depth=0.4 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-10.0, -40.0, 'red'), (12.0, -36.0, 'blue'), (-22.0, -10.0, 'yellow'), (22.0, 0.0, 'green'), (-4.0, 30.0, 'red'), (4.0, 32.0, 'blue'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 6.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('naqsh-e-jahan')
