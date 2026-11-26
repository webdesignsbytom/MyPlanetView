# Salzburg in the high-quality look (hq.py), laid out in metres (the town and the hill drawn closer
# together, to fit): the Hohensalzburg fortress along the top of the Festungsberg, its white walls and
# bastions, the tall Hoher Stock and its towers under red roofs; the wooded slopes and the rock face
# above the old town; below, the cathedral's pale facade
# between its twin towers, its great green dome and lantern, the Kollegienkirche's dome, and the tall
# narrow pastel houses along the river; the Salzach with its quays and the Makartsteg footbridge,
# trees on the far bank, and people.
# Run: blender -b --factory-startup -P salzburg.py -- salzburg-1024.png 1024 salzburg.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1077)
M['fortress'] = material('fortressWhite', '#efe9dc', 0.75, vary='#e3dccd', vary_scale=24, bump=0.06, bump_scale=200)
M['roofS'] = banded(material('salzburgRoof', '#a9533d', 0.7, vary='#984a36', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['domeGreen'] = material('salzburgCopper', '#5f9a82', 0.5, vary='#6aa58d', vary_scale=20, metallic=0.35)
M['domStone'] = material('domMarble', '#e8e0cf', 0.6, vary='#ddd4c1', vary_scale=24)
M['domGrey'] = material('domGrey', '#a7a29a', 0.7, vary='#9b968e', vary_scale=24)
M['rockS'] = material('nagelfluh', '#9d968a', 0.9, vary='#8a8478', vary_scale=8, bump=0.6, bump_scale=60)
M['forestS'] = material('festungsbergWood', '#3c6b35', 0.85, vary='#47793e', vary_scale=14, bump=0.3, bump_scale=90)
M['meadowS'] = material('salzburgMeadow', '#6ea343', 0.85, vary='#79ae4c', vary_scale=12)
M['streetS'] = material('salzburgStreet', '#b9b2a6', 0.85, vary='#aea699', vary_scale=60)
M['salzach'] = material('salzach', '#5f8c86', 0.1, vary='#6a9790', vary_scale=8, bump=0.05, bump_scale=30)
M['rail'] = material('funicular', '#c63a2c', 0.5)
WALLS = [material(f'salzburgWall{k}', c, 0.8, vary=c, vary_scale=30, bump=0.05, bump_scale=200) for k, c in enumerate(('#f1dca0', '#e9c7c0', '#f4eedd', '#cfe0c5', '#f0d2a6', '#e6e0f0', '#f5e6b8'))]

S = 0.0132              # metres to the tile's units
RY0, RY1 = -78.0, -54.0 # the Salzach between its quays
HILL = (0.0, 52.0)      # the Festungsberg's middle


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """Metres above the river: its bed, the quays and the town's flat, the Festungsberg with its cliff on the town's side."""
    if RY0 < y < RY1:
        return -3.0 + 2.5 * smooth(min(y - RY0, RY1 - y) / 3.0)
    d = math.hypot((x - HILL[0]) * 0.62, y - HILL[1])
    hill = 58.0 * smooth((52.0 - d) / 34.0) + 3.0 * math.sin(x * 0.08)
    return 2.0 + max(0.0, hill)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return (ground(x / S, y / S) + 3.5) * S * rim


def pick(z, nz, x, y):
    mx, my = x / S, y / S
    g = ground(mx, my)
    if g > 8.0 and nz < 0.32:
        return 1
    if g > 8.0:
        return 2
    if my < RY0:
        return 3
    return 0


land = terrain('ground', H, [M['streetS'], M['rockS'], M['forestS'], M['meadowS']], pick, rings=200, segs=500)
ZW = G + 3.5 * S
river = cylinder('salzach', M['salzach'], 1.40, 0.004, (0.0, 0.0, ZW - 0.004), segs=128)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, ZW + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def footing(x0, x1, y0, y1):
    hs = [ground(x, y) for x in (x0, (x0 + x1) / 2, x1) for y in (y0, (y0 + y1) / 2, y1)]
    return min(hs) - 1.0, max(hs)


WIN = []
# ------------------------------------------------------------------ the fortress along the hilltop: walls, bastions, the Hoher Stock, towers
FT = ground(HILL[0], HILL[1])
for k, (x0, x1, y0, y1, h) in enumerate(((-44.0, 44.0, 40.0, 66.0, 12.0), (-36.0, -8.0, 36.0, 56.0, 16.0))):
    g, gt = footing(x0, x1, y0, y1)
    block(f'fortressWall{k}', M['fortress'], x0, x1, y0, y1, g - 4.0, gt + h)
    gable_roof(f'fortressWallRoof{k}', M['roofS'], (x0 - 0.3) * S, (x1 + 0.3) * S, (y0 - 0.3) * S, (y1 + 0.3) * S, ZW + (gt + h - 0.05) * S, 5.0 * S, over=0.0, along='x')
    for j in range(int((x1 - x0) / 5.0)):
        c = P(x0 + 2.5 + 5.0 * j, y0 - 0.05, 0)
        WIN.append((c.x, c.y, ZW + (gt + h - 6.0) * S, 1.2 * S, 2.0 * S, (0, -1), 'rect'))
# the Hoher Stock: the tall block in the middle with its hipped roof
hg, hgt = footing(-6.0, 14.0, 44.0, 60.0)
block('hoherStock', M['fortress'], -6.0, 14.0, 44.0, 60.0, hg, hgt + 26.0)
hip_roof('hoherStockRoof', M['roofS'], 4.0 * S, 52.0 * S, ZW + (hgt + 25.95) * S, 21.0 * S, 17.0 * S, 7.0 * S, over=0.0)
for j in range(4):
    for z in (hgt + 14.0, hgt + 19.0):
        c = P(-3.5 + 5.0 * j, 43.95, 0)
        WIN.append((c.x, c.y, ZW + z * S, 1.3 * S, 2.2 * S, (0, -1), 'rect'))
# towers: the round bell tower, the square keep, the corner bastions
for k, (x, y, r, h, kind) in enumerate(((22.0, 48.0, 4.0, 34.0, 'round'), (-20.0, 46.0, 5.0, 28.0, 'square'), (40.0, 42.0, 6.0, 16.0, 'round'), (-42.0, 44.0, 6.0, 16.0, 'round'), (30.0, 64.0, 4.0, 22.0, 'square'))):
    g, gt = footing(x - r, x + r, y - r, y + r)
    if kind == 'round':
        cylinder(f'tower{k}', M['fortress'], r * S, (gt + h - g) * S, P(x, y, g), segs=32)
        lathe(f'towerRoof{k}', M['roofS'], [((r + 0.5) * S, 0.0), (0.0, r * 1.4 * S)], P(x, y, gt + h), segs=24)
    else:
        block(f'tower{k}', M['fortress'], x - r, x + r, y - r, y + r, g, gt + h)
        pyramid(f'towerRoof{k}', M['roofS'], x * S, y * S, ZW + (gt + h - 0.05) * S, (2 * r + 1.0) * S, r * 1.5 * S)
    c = P(x, y - r - 0.05, 0)
    WIN.append((c.x, c.y, ZW + (gt + h - 5.0) * S, 1.0 * S, 1.8 * S, (0, -1), 'rect'))

# ------------------------------------------------------------------ the cathedral: facade and twin towers, the nave, the great green dome
DX, DY = 6.0, -14.0     # the dome's centre
NG = 2.0
block('domNave', M['domStone'], DX - 44.0, DX + 14.0, DY - 11.0, DY + 11.0, NG - 1.0, NG + 26.0)
gable_roof('domNaveRoof', M['domGrey'], (DX - 44.3) * S, (DX + 14.3) * S, (DY - 11.3) * S, (DY + 11.3) * S, ZW + (NG + 25.95) * S, 8.0 * S, over=0.0, along='x')
block('domTransept', M['domStone'], DX - 9.0, DX + 9.0, DY - 18.0, DY + 18.0, NG - 1.0, NG + 26.0)
gable_roof('domTranseptRoof', M['domGrey'], (DX - 9.3) * S, (DX + 9.3) * S, (DY - 18.3) * S, (DY + 18.3) * S, ZW + (NG + 25.95) * S, 8.0 * S, over=0.0, along='y')
lathe('domDrum', M['domStone'], [(8.0 * S, 0.0), (8.0 * S, 7.0 * S)], P(DX, DY, NG + 28.0), segs=8)
lathe('domDome', M['domeGreen'], [(8.4 * S, 0.0), (8.0 * S, 3.0 * S), (5.6 * S, 8.0 * S), (2.0 * S, 10.6 * S), (0.0, 11.0 * S)], P(DX, DY, NG + 35.0), segs=32, smooth=True)
cylinder('domLantern', M['domStone'], 1.8 * S, 4.0 * S, P(DX, DY, NG + 45.6), segs=16)
lathe('domLanternCap', M['domeGreen'], [(2.0 * S, 0.0), (1.0 * S, 1.6 * S), (0.3 * S, 3.2 * S), (0.0, 4.4 * S)], P(DX, DY, NG + 49.6), segs=16, smooth=True)
for j in range(8):
    a = 2 * math.pi * (j + 0.5) / 8
    c = P(DX + 8.05 * math.cos(a), DY + 8.05 * math.sin(a), 0)
    WIN.append((c.x, c.y, ZW + (NG + 30.0) * S, 1.6 * S, 3.4 * S, (math.cos(a), math.sin(a)), 'round'))
# the facade at the west end between its two towers, their green helmets
FX = DX - 44.0
block('domFacade', M['domStone'], FX - 2.0, FX, DY - 11.0, DY + 11.0, NG - 1.0, NG + 32.0)
gable_roof('domPediment', M['domStone'], (FX - 2.0) * S, FX * S, (DY - 6.0) * S, (DY + 6.0) * S, ZW + (NG + 31.95) * S, 5.0 * S, over=0.0, along='x')
for s in (-1, 1):
    ty = DY + s * 8.0
    block(f'domTower{s}', M['domStone'], FX - 2.5, FX + 6.5, ty - 4.5, ty + 4.5, NG - 1.0, NG + 40.0)
    lathe(f'domHelmet{s}', M['domeGreen'], [(4.2 * S, 0.0), (4.4 * S, 2.0 * S), (2.4 * S, 4.6 * S), (1.2 * S, 6.4 * S), (1.6 * S, 7.4 * S), (0.4 * S, 9.4 * S), (0.0, 11.0 * S)], P(FX + 2.0, ty, NG + 40.0), segs=16, smooth=True)
    for z in (NG + 22.0, NG + 32.0):
        c = P(FX + 2.0, ty - 4.55 if s < 0 else ty + 4.55, 0)
        WIN.append((c.x, c.y, ZW + z * S, 1.6 * S, 3.6 * S, (0, -1 if s < 0 else 1), 'round'))
for j in range(5):
    c = P(DX - 40.0 + 6.0 * j, DY - 11.05, 0)
    WIN.append((c.x, c.y, ZW + (NG + 14.0) * S, 1.8 * S, 5.0 * S, (0, -1), 'round'))

# ------------------------------------------------------------------ the Kollegienkirche's dome and towers
KX, KY = -46.0, 20.0
block('kollegien', M['domStone'], KX - 10.0, KX + 10.0, KY - 14.0, KY + 14.0, NG - 1.0, NG + 22.0)
gable_roof('kollegienRoof', M['domGrey'], (KX - 10.3) * S, (KX + 10.3) * S, (KY - 14.3) * S, (KY + 14.3) * S, ZW + (NG + 21.95) * S, 6.0 * S, over=0.0, along='y')
lathe('kollegienDrum', M['domStone'], [(5.0 * S, 0.0), (5.0 * S, 4.0 * S)], P(KX, KY, NG + 24.0), segs=8)
lathe('kollegienDome', M['domeGreen'], [(5.3 * S, 0.0), (4.8 * S, 3.0 * S), (2.0 * S, 6.4 * S), (0.0, 7.0 * S)], P(KX, KY, NG + 28.0), segs=24, smooth=True)

# ------------------------------------------------------------------ the old town's tall narrow houses, and their row along the quay
HOUSES = []
for i in range(-14, 15):
    for j in range(-6, 6):
        x = i * 7.6 + rng.uniform(-1.0, 1.0)
        y = -16.0 + j * 7.6 + rng.uniform(-1.0, 1.0)
        if y < RY1 + 7.0 or ground(x, y) > 6.0 or math.hypot(x * S, y * S) > 1.3:
            continue
        if DX - 48.0 < x < DX + 16.0 and DY - 21.0 < y < DY + 21.0:
            continue
        if KX - 13.0 < x < KX + 13.0 and KY - 17.0 < y < KY + 17.0:
            continue
        if rng.random() < 0.1:
            continue
        HOUSES.append((x, y, rng.uniform(6.0, 7.0), rng.uniform(6.0, 7.2), rng.uniform(12.0, 19.0)))
for k, (x, y, w, d, h) in enumerate(HOUSES):
    g, gt = footing(x - w / 2, x + w / 2, y - d / 2, y + d / 2)
    block(f'house{k}', WALLS[k % len(WALLS)], x - w / 2, x + w / 2, y - d / 2, y + d / 2, g, gt + h)
    hip_roof(f'houseRoof{k}', M['roofS'] if k % 3 else M['domGrey'], x * S, y * S, ZW + (gt + h - 0.05) * S, (w + 0.6) * S, (d + 0.6) * S, 2.2 * S, over=0.0)
    if y < RY1 + 18.0:
        for u in (-w * 0.25, w * 0.25):
            c = P(x + u, y - d / 2 - 0.05, 0)
            for z in (gt + 3.0, gt + 6.5, gt + 10.0):
                if z < gt + h - 2.0:
                    WIN.append((c.x, c.y, ZW + z * S, 1.0 * S, 1.8 * S, (0, -1), 'rect'))
glazed('windows', WIN, M['white'], depth=0.3 * S)

# ------------------------------------------------------------------ the quays, the Makartsteg, trees on the far bank, the hillside's woods, people
for k, y in enumerate((RY1, RY0)):
    slab(f'quay{k}', M['domGrey'], rect(0.0, y * S, 4.0, 1.6 * S), ZW - 0.003, ZW + 2.2 * S, margin=0.03)
BX = 18.0
box('makartsteg', M['steel'], P(BX, (RY0 + RY1) / 2, 2.6), (3.6 * S, (RY1 - RY0 + 2.0) * S, 0.5 * S), bevel=0)
for sx in (-1, 1):
    tube(f'makartRail{sx}', M['steel'], [P(BX + sx * 1.7, RY0 - 1.0, 3.6), P(BX + sx * 1.7, RY1 + 1.0, 3.6)], 0.12 * S)
TREES = []
for k in range(24):
    x = -100.0 + 9.0 * k
    y = RY0 - 6.0
    if math.hypot(x * S, y * S) > 1.36 or abs(x - BX) < 6.0:
        continue
    cylinder(f'quayTree{k}Trunk', M['trunk'], 0.35 * S, 5.0 * S, P(x, y, 2.0), segs=8)
    TREES.append((P(x, y, 9.0).to_tuple(), rng.uniform(3.2, 4.0) * S, 0.9))
for p in scatter_on(land, 9000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 2 and math.hypot(p.x, p.y) < 1.36, seed=31):
    mx, my = p.x / S, p.y / S
    if -46.0 < mx < 46.0 and 34.0 < my < 70.0:
        continue
    TREES.append(((p.x, p.y, p.z + 3.0 * S), rng.uniform(3.0, 4.2) * S, 1.0))
    if len(TREES) >= 520:
        break
blob_cloud('trees', M['forestS'], TREES)
for k, (x, y, shirt) in enumerate(((BX - 0.8, -66.0, 'red'), (BX + 0.8, -60.0, 'blue'), (-30.0, -50.0, 'yellow'), (40.0, -50.0, 'green'), (-10.0, -84.0, 'red'))):
    c = P(x, y, 3.0 if abs(x - BX) < 2.0 else ground(x, y))
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.4)

R = Matrix.Rotation(math.radians(-32.0 + 8.0), 4, 'Z')
for ob in [land, river] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('salzburg')
