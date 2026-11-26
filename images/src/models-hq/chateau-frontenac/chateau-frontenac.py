# The Château Frontenac in the high-quality look (hq.py), laid out in metres and seen from the St
# Lawrence: Québec City's château-style hotel on Cap Diamant, its red-brick wings under steep green
# copper roofs with their dormers, the round turrets with their conical caps at the corners, the central
# tower rising under its tall copper roof ringed by turrets; Dufferin Terrace's boardwalk along the
# cliff's edge below it with its white kiosks; the wooded cliff, the river with a ferry, and people.
# Run: blender -b --factory-startup -P chateau-frontenac.py -- chateau-frontenac-1024.png 1024 chateau-frontenac.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1893)
M['brickF'] = masonry('frontenacBrick', '#8a4b38', '#b98b74', scale=420, rough=0.85, vary='#7e4433')
M['stoneF'] = material('frontenacStone', '#b8b0a2', 0.8, vary='#aca496', vary_scale=24, bump=0.08, bump_scale=200)
M['copperF'] = banded(material('frontenacCopper', '#5f9a84', 0.5, vary='#6aa58e', vary_scale=14, metallic=0.3), 'Z', 380.0, strength=0.2)
M['cliffF'] = material('capDiamant', '#7d786e', 0.9, vary='#6d685f', vary_scale=10, bump=0.6, bump_scale=60)
M['parkF'] = material('frontenacPark', '#6a9a46', 0.85, vary='#77a651', vary_scale=12, bump=0.3, bump_scale=120)
M['river'] = material('stLawrence', '#3d6678', 0.08, vary='#477284', vary_scale=8, bump=0.06, bump_scale=30)
M['boardwalk'] = material('dufferinBoards', '#9a7b58', 0.75, vary='#8c6f4f', vary_scale=60)
M['treeF'] = material('frontenacTree', '#4a7a36', 0.85, vary='#578742', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.011               # metres to the tile's units
TOP = 52.0              # the clifftop above the river
EDGE = -6.0             # the cliff's edge (y)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    return 1.0 + (TOP - 1.0) * smooth((y - EDGE + 42.0) / 42.0) + 4.0 * math.sin(x / 23.0) * smooth((y - EDGE + 40.0) / 6.0) * smooth((EDGE - 2.0 - y) / 6.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return ground(x / S, y / S) * S * rim


def pick(z, nz, x, y):
    if nz < 0.5:
        return 0                        # the steepest rock bare
    return 1


land = terrain('capDiamant', H, [M['cliffF'], M['parkF']], pick, rings=200, segs=500)
river = slab('river', M['river'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (EDGE - 46.0) * S), (-2.0, (EDGE - 46.0) * S)], G - 0.003, G + 0.6 * S, margin=0.015)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, G + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


WIN = []
DORM = bmesh.new()


def dormers(x0, x1, y_eave, z_eave, rise, depth, step=5.0, face=-1):
    """Dormers along a roof's slope that faces `face` (-1 towards -y)."""
    for k in range(int((x1 - x0) / step)):
        x = x0 + step * (k + 0.5)
        yf = y_eave + (-face) * 2.0
        zb = z_eave + rise * 2.0 / depth
        bmesh.ops.create_cube(DORM, size=1.0, matrix=Matrix.Translation(P(x, yf + 1.0, zb + 1.2)) @ Matrix.Diagonal((2.0 * S, 2.4 * S, 2.6 * S, 1)))
        c = P(x, yf - 0.25, 0)
        WIN.append((c.x, c.y, G + (zb + 0.4) * S, 1.0 * S, 1.6 * S, (0, -1), 'round'))


def wing(name, x0, x1, y0, y1, h, roof):
    z0 = TOP - 1.0
    block(name, M['brickF'], x0, x1, y0, y1, z0, TOP + h)
    block(name + 'Band', M['stoneF'], x0 - 0.2, x1 + 0.2, y0 - 0.2, y1 + 0.2, TOP + 3.0, TOP + 3.6, bevel=0)
    along = 'x' if x1 - x0 >= y1 - y0 else 'y'
    gable_roof(name + 'Roof', M['copperF'], (x0 - 0.5) * S, (x1 + 0.5) * S, (y0 - 0.5) * S, (y1 + 0.5) * S, G + (TOP + h - 0.05) * S, roof * S, over=0.0, along=along)
    if along == 'x':
        dormers(x0 + 1.0, x1 - 1.0, y0 - 0.5, TOP + h, roof, (y1 - y0) / 2 + 0.5)
        for k in range(int((x1 - x0) / 3.6)):
            c = P(x0 + 1.8 + 3.6 * k, y0 - 0.05, 0)
            for z in range(int((h - 4.0) / 3.4)):
                WIN.append((c.x, c.y, G + (TOP + 4.6 + 3.4 * z) * S, 1.1 * S, 1.9 * S, (0, -1), 'rect'))


def turret(name, x, y, r, h, cone):
    cylinder(name, M['brickF'], r * S, (h + 1.0) * S, P(x, y, TOP - 1.0), segs=20)
    lathe(name + 'Roof', M['copperF'], [((r + 0.4) * S, 0.0), (r * 0.7 * S, cone * 0.3 * S), (0.0, cone * S)], P(x, y, TOP + h - 0.05), segs=20, smooth=True)
    lathe(name + 'Finial', M['copperF'], [(0.12 * S, 0.0), (0.0, 2.0 * S)], P(x, y, TOP + h + cone - 0.2), segs=6)
    for k in range(int((h - 4.0) / 3.4)):
        c = P(x, y - r - 0.03, 0)
        WIN.append((c.x, c.y, G + (TOP + 4.6 + 3.4 * k) * S, 1.0 * S, 1.8 * S, (0, -1), 'rect'))


# ------------------------------------------------------------------ the château: its wings, turrets and the central tower
wing('frontWing', -48.0, 30.0, 18.0, 32.0, 26.0, 13.0)
wing('westWing', -60.0, -46.0, 18.0, 72.0, 24.0, 12.0)
wing('eastWing', 28.0, 42.0, 24.0, 64.0, 22.0, 11.0)
for k, (x, y, r, h, cone) in enumerate(((-48.0, 18.0, 5.0, 30.0, 13.0), (30.0, 18.0, 4.6, 28.0, 12.0), (-60.0, 18.0, 4.0, 26.0, 11.0), (42.0, 24.0, 4.0, 24.0, 11.0), (-16.0, 18.0, 3.4, 29.0, 10.0))):
    turret(f'turret{k}', x, y, r, h, cone)
TX0, TX1, TY0, TY1, TH = -14.0, 8.0, 34.0, 56.0, 58.0
block('centralTower', M['brickF'], TX0, TX1, TY0, TY1, TOP - 1.0, TOP + TH)
for z in (3.0, 30.0, TH - 1.0):
    block(f'towerBand{z:.0f}', M['stoneF'], TX0 - 0.2, TX1 + 0.2, TY0 - 0.2, TY1 + 0.2, TOP + z, TOP + z + 0.6, bevel=0)
for k in range(5):
    c = P(TX0 + 2.2 + 4.4 * k, TY0 - 0.05, 0)
    for z in range(int((TH - 6.0) / 3.4)):
        if TOP + 4.6 + 3.4 * z > TOP + 26.0 + 13.0:
            WIN.append((c.x, c.y, G + (TOP + 4.6 + 3.4 * z) * S, 1.2 * S, 2.0 * S, (0, -1), 'rect'))
hip_roof('towerRoof', M['copperF'], (TX0 + TX1) / 2 * S, (TY0 + TY1) / 2 * S, G + (TOP + TH - 0.05) * S, (TX1 - TX0 + 1.0) * S, (TY1 - TY0 + 1.0) * S, 22.0 * S, over=0.0)
for sx in (TX0, TX1):
    for sy in (TY0, TY1):
        turret(f'towerTurret{sx:.0f}{sy:.0f}', sx, sy, 2.2, TH + 4.0, 9.0)
lathe('towerSpike', M['copperF'], [(0.25 * S, 0.0), (0.0, 6.0 * S)], P((TX0 + TX1) / 2, (TY0 + TY1) / 2, TOP + TH + 21.8), segs=6)
for k in range(3):
    x = TX0 + 4.0 + 7.0 * k
    zb = TOP + TH + 6.0
    bmesh.ops.create_cube(DORM, size=1.0, matrix=Matrix.Translation(P(x, TY0 + 4.5, zb)) @ Matrix.Diagonal((2.4 * S, 3.0 * S, 3.2 * S, 1)))
    c = P(x, TY0 + 2.95, 0)
    WIN.append((c.x, c.y, G + (zb - 0.9) * S, 1.2 * S, 1.8 * S, (0, -1), 'round'))
finish('dormers', DORM, M['brickF'], smooth_sides=False)
glazed('windows', WIN, M['stoneF'], depth=0.3 * S)

# ------------------------------------------------------------------ Dufferin Terrace: the boardwalk on the cliff's edge and its kiosks
block('terraceDeck', M['boardwalk'], -110.0, 70.0, EDGE - 2.0, EDGE + 12.0, TOP - 2.0, TOP + 0.4, bevel=0)
block('terraceRail', M['iron'], -110.0, 70.0, EDGE - 2.2, EDGE - 1.8, TOP + 0.4, TOP + 1.4, bevel=0)
for k, x in enumerate((-96.0, -70.0, -44.0, 0.0, 44.0)):
    lathe(f'kiosk{k}', M['white'], [(2.4 * S, 0.0), (2.4 * S, 0.3 * S)], P(x, EDGE + 2.0, TOP + 0.4), segs=8)
    for j in range(8):
        a = 2 * math.pi * j / 8
        cylinder(f'kioskPost{k}{j}', M['white'], 0.12 * S, 3.0 * S, P(x + 2.2 * math.cos(a), EDGE + 2.0 + 2.2 * math.sin(a), TOP + 0.7), segs=6)
    lathe(f'kioskRoof{k}', M['copperF'], [(2.9 * S, 0.0), (1.6 * S, 1.2 * S), (0.0, 2.6 * S)], P(x, EDGE + 2.0, TOP + 3.7), segs=8, smooth=True)

# ------------------------------------------------------------------ the trees on the cliff, the ferry, people
CROWNS = []
for p in scatter_on(land, 7000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.32 and (m == 1 or rng.random() < 0.35), seed=7):
    mx, my = p.x / S, p.y / S
    if my > EDGE - 4.0 and my < 80.0 and -66.0 < mx < 50.0:
        continue
    if EDGE - 4.0 < my < EDGE + 14.0:
        continue
    CROWNS.append(((p.x, p.y, p.z + 4.0 * S), rng.uniform(3.0, 4.2) * S, 1.0))
    if len(CROWNS) >= 200:
        break
blob_cloud('trees', M['treeF'], CROWNS)
FX, FY = -20.0, EDGE - 82.0
hull = [(-12.0, -3.2), (10.0, -3.2), (13.0, 0.0), (10.0, 3.2), (-12.0, 3.2)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(FX + u, FY + v, 0.0)) for u, v in hull], [bm.verts.new(P(FX + u, FY + v, 2.6)) for u, v in hull])
finish('ferryHull', bm, M['white'], smooth_sides=False)
block('ferryStripe', M['blue'], FX - 12.05, FX + 10.0, FY - 3.25, FY + 3.25, 1.4, 2.0, bevel=0)
block('ferryCabin', M['white'], FX - 6.0, FX + 5.0, FY - 2.6, FY + 2.6, 2.6, 5.0)
block('ferryBridge', M['white'], FX + 2.0, FX + 5.0, FY - 2.0, FY + 2.0, 5.0, 6.6)
block('ferryFunnel', M['red'], FX - 3.0, FX - 1.6, FY - 0.7, FY + 0.7, 5.0, 7.6, bevel=0)
for k, (x, shirt) in enumerate(((-80.0, 'red'), (-56.0, 'blue'), (-24.0, 'yellow'), (10.0, 'green'), (30.0, 'red'), (56.0, 'blue'))):
    c = P(x, EDGE + 5.0 + (k % 3) * 2.0, TOP + 0.4)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 18.0), 4, 'Z')
for ob in [land, river] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('chateau-frontenac')
