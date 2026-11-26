# Malbork Castle in the high-quality look (hq.py), laid out in metres and seen from across the Nogat: the
# Teutonic Order's red-brick fortress, its riverside wall with round towers and battlements; the High
# Castle's four wings round their courtyard under steep tiled roofs and its great square tower; the
# Middle Castle beside it with the Grand Master's Palace facing the river, its tall pointed windows,
# battlements and slender octagonal corner turrets; the wooden footbridge across the river, the trees
# along the banks, and people.
# Run: blender -b --factory-startup -P malbork.py -- malbork-1024.png 1024 malbork.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1274)
M['brickM'] = masonry('malborkBrick', '#9b3f2b', '#c58a6e', scale=420, rough=0.85, vary='#8e3926')
M['roofM'] = banded(material('malborkRoof', '#8a3a2a', 0.7, vary='#7a3324', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['nogat'] = material('nogat', '#4f7380', 0.1, vary='#5a7f8c', vary_scale=8, bump=0.05, bump_scale=30)
M['bankGrass'] = material('nogatBank', '#6d9a48', 0.85, vary='#7aa553', vary_scale=12, bump=0.3, bump_scale=120)
M['treeM'] = material('nogatTree', '#4a7634', 0.85, vary='#578340', vary_scale=14, bump=0.3, bump_scale=90)
M['plasterM'] = material('blindPanel', '#e6dcc8', 0.8)

S = 0.0125              # metres to the tile's units
FY = 15.0               # the plan's middle on the tile's (the river nearer us)
ZB = G + 0.03           # the banks' level


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, ZB + z * S))


def T(x, y):
    return (x * S, (y - FY) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)    # the banks and river turn with the castle (they're cut to the round base, so they stay on it)
RIVER = (-62.0, -22.0)        # the Nogat's near and far banks (y, metres)
slab('bankNear', M['bankGrass'], [T(-200, -200), T(200, -200), T(200, RIVER[0]), T(-200, RIVER[0])], G - 0.003, ZB, margin=0.02)
slab('bankFar', M['bankGrass'], [T(-200, RIVER[1]), T(200, RIVER[1]), T(200, 200), T(-200, 200)], G - 0.003, ZB, margin=0.02)
slab('river', M['nogat'], [T(-200, RIVER[0]), T(200, RIVER[0]), T(200, RIVER[1]), T(-200, RIVER[1])], G - 0.003, ZB - 1.4 * S, margin=0.02)
MER = bmesh.new()
WIN = []


def merlons(ax, ay, bx, by, z, step=1.8, w=1.0, h=1.4, d=0.8):
    L = math.hypot(bx - ax, by - ay)
    ang = math.atan2(by - ay, bx - ax)
    for k in range(int(L / step) + 1):
        t = k / max(1, int(L / step))
        bmesh.ops.create_cube(MER, size=1.0, matrix=Matrix.Translation(P(ax + (bx - ax) * t, ay + (by - ay) * t, z + h / 2)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((w * S, d * S, h * S, 1)))


def round_tower(name, x, y, r, h, roof=8.0):
    cylinder(name, M['brickM'], r * S, (h + 0.3) * S, P(x, y, -0.3), segs=24)
    lathe(name + 'Roof', M['roofM'], [((r + 0.5) * S, 0.0), (0.0, roof * S)], P(x, y, h - 0.05), segs=24)
    for k in range(3):
        a = -math.pi / 2 + (k - 1) * 0.7
        c = P(x + r * math.cos(a), y + r * math.sin(a), 0)
        WIN.append((c.x, c.y, ZB + (h - 6.0) * S, 0.8 * S, 1.6 * S, (math.cos(a), math.sin(a)), 'pointed'))


def wing(name, x0, x1, y0, y1, h, rise, along, windows=None):
    block(name, M['brickM'], x0, x1, y0, y1, -0.3, h)
    gable_roof(name + 'Roof', M['roofM'], (x0 - 0.4) * S, (x1 + 0.4) * S, (y0 - 0.4 - FY) * S, (y1 + 0.4 - FY) * S, ZB + (h - 0.05) * S, rise * S, over=0.0, along=along)
    if windows:
        y = y0 - 0.05
        for k in range(int((x1 - x0) / windows)):
            c = P(x0 + windows * (k + 0.5), y, 0)
            for z in (4.0, h * 0.5):
                WIN.append((c.x, c.y, ZB + z * S, 1.3 * S, 3.4 * S, (0, -1), 'pointed'))


# ------------------------------------------------------------------ the riverside wall, its round towers and battlements
WY = RIVER[1] + 4.0
block('riverWall', M['brickM'], -104.0, 104.0, WY - 1.8, WY, -1.5, 11.0)
merlons(-104.0, WY - 0.9, 104.0, WY - 0.9, 11.0)
for k, x in enumerate((-98.0, -66.0, -10.0, 70.0, 98.0)):
    round_tower(f'wallTower{k}', x, WY - 0.6, 5.0, 18.0)

# ------------------------------------------------------------------ the High Castle: four wings round their courtyard, the great tower
HX0, HX1, HY0, HY1 = -100.0, -46.0, -6.0, 46.0
wing('highFront', HX0, HX1, HY0, HY0 + 12.0, 22.0, 13.0, 'x', windows=6.0)
wing('highBack', HX0, HX1, HY1 - 12.0, HY1, 22.0, 13.0, 'x')
wing('highLeft', HX0, HX0 + 12.0, HY0 + 12.0, HY1 - 12.0, 22.0, 13.0, 'y')
wing('highRight', HX1 - 12.0, HX1, HY0 + 12.0, HY1 - 12.0, 22.0, 13.0, 'y')
TX, TY = -52.0, 40.0
block('greatTower', M['brickM'], TX - 6.5, TX + 6.5, TY - 6.5, TY + 6.5, -0.3, 46.0)
merlons(TX - 6.5, TY - 6.5, TX + 6.5, TY - 6.5, 46.0, step=1.6)
merlons(TX - 6.5, TY - 6.5, TX - 6.5, TY + 6.5, 46.0, step=1.6)
lathe('greatTowerRoof', M['roofM'], [(8.0 * S, 0.0), (0.0, 14.0 * S)], (0, 0, 0), segs=4, matrix=Matrix.Translation(P(TX, TY, 47.0)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
for z in (24.0, 32.0, 40.0):
    for nx, ny in ((0, -1), (-1, 0)):
        c = P(TX + nx * 6.55, TY + ny * 6.55, 0)
        WIN.append((c.x, c.y, ZB + z * S, 1.2 * S, 3.6 * S, (nx, ny), 'pointed'))
for x in (HX0, HX1):
    for y in (HY0, HY1):
        lathe(f'highTurret{x:.0f}{y:.0f}', M['brickM'], [(1.6 * S, 0.0), (1.6 * S, 8.0 * S)], P(x, y, 20.0), segs=8)
        lathe(f'highTurretSpire{x:.0f}{y:.0f}', M['roofM'], [(1.9 * S, 0.0), (0.0, 7.0 * S)], P(x, y, 28.0), segs=8)
# its gable over the river side, stepped, with blind white panels
steps = [(-27.0, 0.0), (-27.0, 2.0), (-20.0, 2.0), (-20.0, 6.0), (-13.0, 6.0), (-13.0, 10.0), (-6.0, 10.0), (-6.0, 13.5)]
outline = steps + [(-u, v) for u, v in reversed(steps)]
GX = (HX0 + HX1) / 2
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(GX + u, HY0 - 0.3, 22.0 + v)) for u, v in outline], [bm.verts.new(P(GX + u, HY0 + 1.2, 22.0 + v)) for u, v in outline])
finish('highGable', bm, M['brickM'], smooth_sides=False)
for u in (-16.5, -9.5, -2.5, 2.5, 9.5, 16.5):
    block(f'gablePanel{u:+.0f}', M['plasterM'], GX + u - 1.0, GX + u + 1.0, HY0 - 0.45, HY0 - 0.25, 22.6, 22.6 + (2.0 if abs(u) > 13 else 6.0 if abs(u) > 6 else 9.6), bevel=0)

# ------------------------------------------------------------------ the Middle Castle and the Grand Master's Palace facing the river
wing('middleFront', -40.0, 20.0, 6.0, 18.0, 17.0, 10.0, 'x', windows=7.5)
wing('middleSide', 20.0, 32.0, 6.0, 52.0, 17.0, 10.0, 'y')
wing('middleBack', -40.0, 20.0, 40.0, 52.0, 17.0, 10.0, 'x')
PX0, PX1, PY0, PY1 = 30.0, 58.0, -6.0, 18.0
block('grandMastersPalace', M['brickM'], PX0, PX1, PY0, PY1, -0.3, 30.0)
merlons(PX0, PY0, PX1, PY0, 30.0, step=1.6)
merlons(PX1, PY0, PX1, PY1, 30.0, step=1.6)
hip_roof('palaceRoof', M['roofM'], (PX0 + PX1) / 2 * S, ((PY0 + PY1) / 2 - FY) * S, ZB + 29.9 * S, (PX1 - PX0 - 2.0) * S, (PY1 - PY0 - 2.0) * S, 8.0 * S, over=0.0)
for k in range(6):
    x = PX0 + 2.4 + 4.64 * k
    c = P(x, PY0 - 0.05, 0)
    WIN.append((c.x, c.y, ZB + 7.0 * S, 1.6 * S, 14.0 * S, (0, -1), 'pointed'))
    WIN.append((c.x, c.y, ZB + 23.5 * S, 1.2 * S, 3.4 * S, (0, -1), 'pointed'))
    block(f'palaceShaft{k}', M['brickM'], x + 1.6, x + 2.6, PY0 - 0.6, PY0, -0.3, 29.0, bevel=0)
for k in range(4):
    y = PY0 + 3.0 + 5.0 * k
    c = P(PX1 + 0.05, y, 0)
    WIN.append((c.x, c.y, ZB + 7.0 * S, 1.6 * S, 14.0 * S, (1, 0), 'pointed'))
for x, y in ((PX0, PY0), (PX1, PY0), (PX1, PY1)):
    lathe(f'palaceTurret{x:.0f}{y:.0f}', M['brickM'], [(1.4 * S, 0.0), (1.4 * S, 10.0 * S)], P(x, y, 24.0), segs=8)
    lathe(f'palaceTurretSpire{x:.0f}{y:.0f}', M['roofM'], [(1.7 * S, 0.0), (0.0, 8.0 * S)], P(x, y, 34.0), segs=8)
block('palaceTerrace', M['brickM'], PX0 - 2.0, PX1 + 2.0, PY0 - 8.0, PY0, -1.5, 3.0)
merlons(PX0 - 2.0, PY0 - 8.0, PX1 + 2.0, PY0 - 8.0, 3.0, step=1.6)

# ------------------------------------------------------------------ the footbridge across the Nogat, the trees on the banks, people
BX = -30.0
block('footbridgeDeck', M['wood'], BX - 1.8, BX + 1.8, RIVER[0] - 6.0, WY - 1.8, 2.2, 2.6, bevel=0)
for k in range(9):
    y = RIVER[0] - 3.0 + (WY - RIVER[0]) * k / 8
    for x in (BX - 1.5, BX + 1.5):
        cylinder(f'pile{k}{x:+.0f}', M['wood'], 0.25 * S, 4.4 * S, P(x, y, -2.0), segs=6)
    for x in (BX - 1.7, BX + 1.7):
        cylinder(f'rail{k}{x:+.0f}', M['wood'], 0.1 * S, 1.1 * S, P(x, y, 2.6), segs=6)
for x in (BX - 1.7, BX + 1.7):
    block(f'handrail{x:+.0f}', M['wood'], x - 0.1, x + 0.1, RIVER[0] - 6.0, WY - 1.8, 3.6, 3.8, bevel=0)
c = P(BX, WY - 1.85, 0)
glazed('gate', [(c.x, c.y, ZB + 0.0, 3.6 * S, 5.0 * S, (0, -1), 'pointed')], M['brickM'], glass=M['door'], depth=0.4 * S)
CROWNS = []
for k in range(80):
    x = rng.uniform(-140.0, 140.0)
    y = rng.choice((rng.uniform(-150.0, RIVER[0] - 8.0), rng.uniform(56.0, 150.0)))
    if math.hypot(x * S, (y - FY) * S) > 1.36 or abs(x - BX) < 8.0:
        continue
    cylinder(f'treeTrunk{k}', M['trunk'], 0.4 * S, 4.0 * S, P(x, y, 0.0), segs=6)
    CROWNS.append((P(x, y, 7.0).to_tuple(), rng.uniform(3.6, 5.0) * S, 1.05))
blob_cloud('trees', M['treeM'], CROWNS)
finish('battlements', MER, M['brickM'], smooth_sides=False)
glazed('windows', WIN, M['brickM'], depth=0.3 * S)
for k, (x, y, z, shirt) in enumerate(((BX - 0.6, -50.0, 2.6, 'red'), (BX + 0.7, -38.0, 2.6, 'blue'), (-60.0, -72.0, 0.0, 'yellow'), (10.0, -70.0, 0.0, 'green'), (40.0, -76.0, 0.0, 'red'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.6)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('malbork')
