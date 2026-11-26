# Bruges in the high-quality look (hq.py), laid out in metres (drawn closer together, to fit), as from
# the Rozenhoedkaai: the canal across the front with a tour boat on it, the old brick houses rising
# straight from the water under their stepped gables; behind them the Belfry, its two square brick
# stages with their corner turrets and its pale octagonal crown, over the Cloth Hall's roofs; beyond,
# the Markt and its coloured guild houses with their stepped gables; a willow, and people.
# Run: blender -b --factory-startup -P bruges.py -- bruges-1024.png 1024 bruges.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1240)
M['brickB'] = material('brugesBrick', '#a5553d', 0.8, vary='#954a34', vary_scale=24, bump=0.12, bump_scale=220)
M['brickDark'] = material('brugesBrickDark', '#8a4433', 0.8, vary='#7d3c2d', vary_scale=24, bump=0.12, bump_scale=220)
M['belfryStone'] = material('belfryStone', '#cbb894', 0.75, vary='#bea984', vary_scale=24, bump=0.08, bump_scale=200)
M['slateB'] = material('brugesSlate', '#58616c', 0.5, vary='#4e5761', vary_scale=14, bump=0.1, bump_scale=200)
M['tileB'] = banded(material('brugesTile', '#9e4a35', 0.7, vary='#8d412e', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['canal'] = material('brugesCanal', '#4b6f64', 0.08, vary='#557a6e', vary_scale=6, coat=0.7)
M['cobble'] = masonry('markt', '#a89f92', '#8b8378', scale=160, rough=0.85, vary='#9c9387')
M['quay'] = material('brugesQuay', '#8f877c', 0.8, vary='#837b70', vary_scale=40)
M['boat'] = material('tourBoat', '#2f4d6e', 0.5)
M['willow'] = material('willow', '#7ea24a', 0.85, vary='#8cb055', vary_scale=14, bump=0.3, bump_scale=90)
GUILD = [material(f'guild{k}', c, 0.75, vary=c, vary_scale=30, bump=0.05, bump_scale=200) for k, c in enumerate(('#c9543f', '#f2ede2', '#e8c45c', '#d98a6a', '#a5553d', '#9bb08a', '#e6d7b8'))]

S = 0.019               # metres to the tile's units
Z0 = G + 0.004
CY0, CY1 = -56.0, -42.0 # the canal between its banks


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


BEFORE = set(bpy.data.objects)
WIN = []


def stepped_house(name, mat, x, y, w, d, h, gh, facing, steps=5):
    """A narrow house with its stepped gable to the street (facing -y or +x or -x): its wall, its
    steep roof behind the gable, the gable's stepped outline standing proud of the roof."""
    roof = M['slateB'] if hash(name) % 3 == 0 else M['tileB']
    if facing in ('-y', '+y'):
        box(name, mat, P(x, y, h / 2), (w * S, d * S, h * S), bevel=0.0004)
        gable_roof(name + 'Roof', roof, (x - w / 2 + 0.2) * S, (x + w / 2 - 0.2) * S, (y - d / 2) * S, (y + d / 2) * S, Z0 + (h - 0.05) * S, gh * S, over=0.0, along='y')
        fy = y - d / 2 if facing == '-y' else y + d / 2
        pts = [(-w / 2, 0.0), (w / 2, 0.0)]
        sw = w / 2 / (steps + 0.5)
        for k in range(steps):
            u = w / 2 - sw * k
            z = gh * k / steps
            pts += [(u, z + gh / steps), (u - sw, z + gh / steps)] if k < steps - 1 else [(u, z + gh / steps)]
        top = pts[-1][1]
        right = pts[2:]
        left = [(-u, z) for u, z in reversed(right)]
        outline = [(-w / 2, 0.0), (w / 2, 0.0)] + right + [(0.0, top + 0.6)] + left
        bm = bmesh.new()
        add_prism(bm, [bm.verts.new(P(x + u, fy - 0.2, h + z)) for u, z in outline], [bm.verts.new(P(x + u, fy + 0.25, h + z)) for u, z in outline])
        finish(name + 'Gable', bm, mat, smooth_sides=False)
        nrm = (0, -1) if facing == '-y' else (0, 1)
        for row in range(int(h / 3.2)):
            for u in ((-w * 0.22, w * 0.22) if w > 6 else (0.0,)):
                c = P(x + u, fy + nrm[1] * 0.05, 0)
                WIN.append((c.x, c.y, Z0 + (1.2 + 3.2 * row) * S, 1.1 * S, 2.0 * S, nrm, 'rect'))
        c = P(x, fy + nrm[1] * 0.05, 0)
        WIN.append((c.x, c.y, Z0 + (h + gh * 0.25) * S, 1.0 * S, 1.8 * S, nrm, 'round'))
    else:
        sx = 1 if facing == '+x' else -1
        box(name, mat, P(x, y, h / 2), (d * S, w * S, h * S), bevel=0.0004)
        gable_roof(name + 'Roof', roof, (x - d / 2) * S, (x + d / 2) * S, (y - w / 2 + 0.2) * S, (y + w / 2 - 0.2) * S, Z0 + (h - 0.05) * S, gh * S, over=0.0, along='x')
        fx = x + sx * d / 2
        pts = []
        sw = w / 2 / (steps + 0.5)
        for k in range(steps):
            u = w / 2 - sw * k
            z = gh * k / steps
            pts += [(u, z + gh / steps), (u - sw, z + gh / steps)] if k < steps - 1 else [(u, z + gh / steps)]
        top = pts[-1][1]
        left = [(-u, z) for u, z in reversed(pts)]
        outline = [(-w / 2, 0.0), (w / 2, 0.0)] + pts + [(0.0, top + 0.6)] + left
        bm = bmesh.new()
        add_prism(bm, [bm.verts.new(P(fx - sx * 0.2, y + u, h + z)) for u, z in outline], [bm.verts.new(P(fx + sx * 0.25, y + u, h + z)) for u, z in outline])
        finish(name + 'Gable', bm, mat, smooth_sides=False)
        for row in range(int(h / 3.2)):
            for u in ((-w * 0.22, w * 0.22) if w > 6 else (0.0,)):
                c = P(fx + sx * 0.05, y + u, 0)
                WIN.append((c.x, c.y, Z0 + (1.2 + 3.2 * row) * S, 1.1 * S, 2.0 * S, (sx, 0), 'rect'))


# ------------------------------------------------------------------ the ground: the Markt's cobbles, the canal and its quays
slab('canal', M['canal'], rect(0.0, (CY0 + CY1) / 2 * S, 4.0, (CY1 - CY0) * S), Z0 - 0.003, Z0 - 0.0005, margin=0.03)
slab('nearQuay', M['quay'], [(-2.0, -2.0), (2.0, -2.0), (2.0, CY0 * S), (-2.0, CY0 * S)], Z0 - 0.003, Z0 + 1.2 * S, margin=0.02)
slab('markt', M['cobble'], [(-2.0, CY1 * S), (2.0, CY1 * S), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0 + 1.2 * S, margin=0.02)

# ------------------------------------------------------------------ the houses rising from the canal, their stepped gables to the water
x = -70.0
k = 0
while x < 70.0:
    w = rng.uniform(6.0, 9.0)
    xc = x + w / 2
    if math.hypot(xc * S, (CY1 + 5.0) * S) < 1.33 and not (-8.0 < xc < 8.0):
        stepped_house(f'canalHouse{k}', GUILD[(k * 3) % len(GUILD)] if k % 3 == 0 else (M['brickB'] if k % 2 else M['brickDark']), xc, CY1 + 5.0, w - 0.3, 10.0, rng.uniform(10.0, 15.0), rng.uniform(6.0, 8.0), '-y')
        box(f'canalFoot{k}', M['brickDark'], P(xc, CY1 + 0.6, -0.4), ((w - 0.3) * S, 1.2 * S, 1.6 * S), bevel=0)
    x += w
    k += 1
# the little humped bridge over the canal where the houses part
bm = bmesh.new()
outline = arch_outline((CY1 - CY0) / 2 + 2.0, 3.2, -1.5, 4.0, steps=12)
add_prism(bm, [bm.verts.new(P(-3.5, (CY0 + CY1) / 2 - u, z)) for u, z in outline], [bm.verts.new(P(3.5, (CY0 + CY1) / 2 - u, z)) for u, z in outline])
finish('bridge', bm, M['brickB'], smooth_sides=False)

# ------------------------------------------------------------------ the Cloth Hall and the Belfry over it
HY0, HY1 = -28.0, -6.0
box('clothHall', M['brickB'], P(0.0, (HY0 + HY1) / 2, 7.0), (36.0 * S, (HY1 - HY0) * S, 14.0 * S), bevel=0.0004)
gable_roof('clothHallRoofS', M['slateB'], -18.3 * S, 18.3 * S, (HY0 - 0.3) * S, (HY0 + 8.0) * S, Z0 + 13.95 * S, 6.0 * S, over=0.0, along='x')
gable_roof('clothHallRoofN', M['slateB'], -18.3 * S, 18.3 * S, (HY1 - 8.0) * S, (HY1 + 0.3) * S, Z0 + 13.95 * S, 6.0 * S, over=0.0, along='x')
for sx in (-1, 1):
    gable_roof(f'clothHallRoofSide{sx}', M['slateB'], *sorted((sx * 10.0 * S, sx * 18.3 * S)), HY0 * S, HY1 * S, Z0 + 13.95 * S, 6.0 * S, over=0.0, along='y')
BX, BY = 0.0, HY1 - 4.0
BW = 15.0
for k, (z0, z1, w) in enumerate(((0.0, 30.0, BW), (30.0, 52.0, BW - 1.4))):
    box(f'belfryStage{k}', M['brickB'] if k == 0 else M['brickDark'], P(BX, BY, (z0 + z1) / 2), (w * S, w * S, (z1 - z0) * S), bevel=0.0006)
    box(f'belfryBand{k}', M['belfryStone'], P(BX, BY, z1 - 0.4), ((w + 0.8) * S, (w + 0.8) * S, 0.8 * S), bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            tx, ty = BX + sx * (w / 2 - 0.2), BY + sy * (w / 2 - 0.2)
            cylinder(f'turret{k}{sx}{sy}', M['belfryStone'], 1.0 * S, 3.4 * S, P(tx, ty, z1), segs=12)
            lathe(f'turretCap{k}{sx}{sy}', M['slateB'], [(1.1 * S, 0.0), (0.0, 2.8 * S)], P(tx, ty, z1 + 3.4), segs=12)
    for nx, ny in ((0, -1), (-1, 0), (0, 1)):
        for z in ((z0 + 8.0, z0 + 18.0) if k == 0 else (z0 + 7.0,)):
            c = P(BX + nx * (w / 2 + 0.05), BY + ny * (w / 2 + 0.05), 0)
            WIN.append((c.x, c.y, Z0 + z * S, 2.0 * S, 7.0 * S, (nx, ny), 'pointed'))
# the pale octagonal crown: its pointed openings, the parapet, the little spire
lathe('belfryOctagon', M['belfryStone'], [(6.4 * S, 0.0), (6.0 * S, 22.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(BX, BY, 52.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for j in range(8):
    a = 2 * math.pi * j / 8
    c = P(BX + 6.05 * math.cos(a), BY + 6.05 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + 58.0 * S, 2.0 * S, 10.0 * S, (math.cos(a), math.sin(a)), 'pointed'))
lathe('belfryParapet', M['belfryStone'], [(6.8 * S, 0.0), (6.8 * S, 1.6 * S), (6.2 * S, 1.6 * S), (6.2 * S, 0.4 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(BX, BY, 74.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for j in range(8):
    a = 2 * math.pi * (j + 0.5) / 8
    lathe(f'crownPinnacle{j}', M['belfryStone'], [(0.5 * S, 0.0), (0.0, 3.4 * S)], P(BX + 6.4 * math.cos(a), BY + 6.4 * math.sin(a), 75.4), segs=6)
lathe('belfrySpire', M['slateB'], [(2.6 * S, 0.0), (0.0, 7.0 * S)], P(BX, BY, 74.0), segs=8)
lathe('belfryLion', M['gold'], [(0.2 * S, 0.0), (0.0, 1.6 * S)], P(BX, BY, 81.0), segs=6)

# ------------------------------------------------------------------ the Markt's guild houses, their coloured stepped gables to the square
for j in range(7):
    w = 7.5
    stepped_house(f'guildN{j}', GUILD[j % len(GUILD)], -26.0 + 8.0 * j + 3.0, 40.0, w, 12.0, rng.uniform(11.0, 14.0), rng.uniform(6.0, 8.0), '-y')
for j in range(5):
    stepped_house(f'guildW{j}', GUILD[(j + 3) % len(GUILD)], -40.0, 2.0 + 8.0 * j, 7.5, 12.0, rng.uniform(11.0, 14.0), rng.uniform(6.0, 8.0), '+x')
for j in range(4):
    stepped_house(f'guildE{j}', GUILD[(j + 5) % len(GUILD)], 40.0, 6.0 + 8.0 * j, 7.5, 12.0, rng.uniform(11.0, 14.0), rng.uniform(6.0, 8.0), '-x')
# more of the town round the Markt: a row behind its north side, and down its west and east
for j in range(-5, 6):
    x = 8.4 * j + 1.0
    if math.hypot(x * S, 58.0 * S) < 1.34:
        stepped_house(f'backRow{j}', GUILD[(j + 7) % len(GUILD)] if j % 2 else M['brickB'], x, 56.0, 7.8, 10.0, rng.uniform(10.0, 13.0), rng.uniform(5.5, 7.5), '-y')
for sx in (-1, 1):
    for j in range(-2, 6):
        y = 8.4 * j + 4.0
        if math.hypot(58.0 * S, y * S) < 1.34 and not (y < -24.0):
            stepped_house(f'sideRow{sx}{j}', M['brickDark'] if j % 2 else GUILD[(j + 2) % len(GUILD)], sx * 56.0, y, 7.8, 10.0, rng.uniform(10.0, 13.0), rng.uniform(5.5, 7.5), '+x' if sx < 0 else '-x')
glazed('windows', WIN, M['white'], depth=0.3 * S)
# lime trees along the near quay
LIMES = []
for k in range(-8, 9):
    x = 9.0 * k + 4.0
    y = CY0 - 6.0
    if math.hypot(x * S, y * S) > 1.36 or abs(x) < 6.0:
        continue
    cylinder(f'lime{k}Trunk', M['trunk'], 0.35 * S, 4.0 * S, P(x, y, 1.2), segs=8)
    LIMES.append((P(x, y, 7.4).to_tuple(), rng.uniform(2.8, 3.4) * S, 0.9))
blob_cloud('limes', M['willow'], LIMES)

# ------------------------------------------------------------------ the tour boat, a willow, people
TX, TY = -20.0, (CY0 + CY1) / 2
box('boatHull', M['boat'], P(TX, TY, 0.3), (14.0 * S, 3.4 * S, 1.2 * S), bevel=0.003)
box('boatTrim', M['white'], P(TX, TY, 0.95), (14.2 * S, 3.6 * S, 0.15 * S), bevel=0)
for k in range(5):
    c = P(TX - 5.0 + 2.5 * k, TY + (0.6 if k % 2 else -0.6), 0.6)
    person(f'boatPassenger{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green', 'red')[k], z=c.z, scale=1.1)
cylinder('willowTrunk', M['trunk'], 0.5 * S, 5.0 * S, P(34.0, CY0 - 4.0, 1.2), segs=8)
WILLOW = [(P(34.0 + rng.uniform(-3.0, 3.0), CY0 - 4.0 + rng.uniform(-3.0, 3.0), 7.0 + rng.uniform(-2.0, 2.0)).to_tuple(), rng.uniform(2.0, 3.2) * S, 1.3) for _ in range(9)]
blob_cloud('willow', M['willow'], WILLOW)
for k, (x, y, z, shirt) in enumerate(((-6.0, -62.0, 1.2, 'red'), (5.0, -64.0, 1.2, 'blue'), (-10.0, 14.0, 1.2, 'yellow'), (12.0, 20.0, 1.2, 'green'), (0.0, -49.0, 4.0, 'red'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.2)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('bruges')
