# Český Krumlov in the high-quality look (hq.py), laid out in metres where the Vltava bends below the
# castle: the castle on its rock above the river, the round tower painted pink and gold with its
# arcaded gallery and its lantern, the castle's long painted wings, the many-arched Cloak Bridge across
# the cleft in the rock; inside the river's loop the old town's red roofs and St Vitus's slender tower;
# a raft on the water, the wooded hills round about, and people.
# Run: blender -b --factory-startup -P cesky-krumlov.py -- cesky-krumlov-1024.png 1024 cesky-krumlov.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1253)
M['towerPink'] = material('towerPink', '#e2a39a', 0.75, vary='#d8968d', vary_scale=24, bump=0.06, bump_scale=200)
M['towerGold'] = material('towerGold', '#d9b25a', 0.6, vary='#cea54e', vary_scale=24)
M['castleWall'] = material('castleWall', '#eadfc6', 0.8, vary='#e0d4b8', vary_scale=24, bump=0.06, bump_scale=200)
M['sgraffito'] = chequer('sgraffito', '#e8dcc2', '#b9a98c', scale=320.0)
M['roofCK'] = banded(material('krumlovRoof', '#b4553a', 0.7, vary='#a24c34', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['copperCK'] = material('lanternCopper', '#5b8a74', 0.5, vary='#669580', vary_scale=24, metallic=0.4)
M['rockCK'] = material('krumlovRock', '#8d8a80', 0.9, vary='#7c796f', vary_scale=10, bump=0.6, bump_scale=60)
M['meadow'] = material('krumlovMeadow', '#6f9a48', 0.85, vary='#7ca553', vary_scale=12, bump=0.3, bump_scale=120)
M['forestCK'] = material('bohemianForest', '#335a33', 0.85, vary='#3e683b', vary_scale=14, bump=0.3, bump_scale=90)
M['vltava'] = material('vltava', '#4d7a6c', 0.1, vary='#598778', vary_scale=8, bump=0.05, bump_scale=30)
M['street'] = material('townStreet', '#b9b0a0', 0.85, vary='#aea595', vary_scale=60)
WALLS = [material(f'townWall{k}', c, 0.8, vary=c, vary_scale=30, bump=0.06, bump_scale=200) for k, c in enumerate(('#efe2c4', '#e8c9a8', '#dcd4a0', '#f2eadb', '#d9b9a6', '#c9d2b9'))]

S = 0.018               # metres to the tile's units
FX = 10.0               # the plan's middle on the tile's (metres)
RIVER = [(-110.0, 22.0), (-70.0, 8.0), (-40.0, -4.0), (-12.0, -20.0), (14.0, -36.0), (40.0, -36.0), (56.0, -14.0), (54.0, 14.0), (40.0, 38.0), (28.0, 90.0)]
HALFW = 12.0            # the river's half width
CASTLE = (-45.0, 26.0)  # the castle rock's middle
TOWN = (32.0, -6.0)     # the old town's middle, in the river's loop


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def river_dist(x, y):
    best = 1e9
    for (ax, ay), (bx, by) in zip(RIVER, RIVER[1:]):
        dx, dy = bx - ax, by - ay
        t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(x - ax - dx * t, y - ay - dy * t))
    return best


def ground(x, y):
    """The land (metres above the river): its bed and banks, the castle rock, the town's rise, the hills, the cleft."""
    d = river_dist(x, y)
    bed = -3.0 + 5.0 * smooth((d - HALFW + 2.0) / 5.0)
    rock = 22.0 * smooth((26.0 - math.hypot((x - CASTLE[0]) * 0.5, y - CASTLE[1])) / 10.0)
    town = 3.0 * smooth((24.0 - math.hypot(x - TOWN[0], y - TOWN[1])) / 16.0)
    hills = 12.0 * smooth((math.hypot(x + FX, y) - 60.0) / 22.0)
    cleft = 18.0 * smooth(1.0 - abs(x + 50.0) / 7.0) * smooth(1.0 - abs(y - 22.0) / 20.0)     # open towards the river
    return bed + max(0.0, max(rock, town, hills) - cleft) * smooth((d - HALFW) / 5.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return (ground(x / S - FX, y / S) + 3.5) * S * rim


def pick(z, nz, x, y):
    mx, my = x / S - FX, y / S
    if nz < 0.55 and ground(mx, my) > 5.0 and math.hypot(x, y) < 1.25:      # bare rock on the castle's crag, never the edge's fall
        return 1
    if math.hypot(mx - TOWN[0], my - TOWN[1]) < 22.0 and river_dist(mx, my) > HALFW + 4.0:
        return 2
    return 0


land = terrain('ground', H, [M['meadow'], M['rockCK'], M['street']], pick, rings=220, segs=540)
ZW = G + 3.5 * S        # the river's level


# the river: one sheet of water just inside the base's edge, which the land covers everywhere but in the riverbed
river = cylinder('vltava', M['vltava'], 1.40, 0.004, (0.0, 0.0, ZW - 0.004), segs=128)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, ZW + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


WIN = []

# ------------------------------------------------------------------ the round tower at the rock's river end: painted shaft, gallery, lantern
TX, TY = -18.0, 14.0
TB = ground(TX, TY) - 1.0
cylinder('towerFoot', M['rockCK'], 6.4 * S, (TB + 4.0) * S, P(TX, TY, -3.0), segs=24)
cylinder('towerShaft', M['towerPink'], 5.0 * S, (44.0 - TB) * S, P(TX, TY, TB), segs=32)
for z in (TB + 6.0, TB + 12.0, TB + 18.0, 43.0):
    cylinder(f'towerBand{z:.0f}', M['towerGold'], 5.06 * S, 0.5 * S, P(TX, TY, z), segs=32)
for k in range(8):
    a = 2 * math.pi * k / 8 + math.pi / 8
    tube(f'towerPilaster{k}', M['towerGold'], [P(TX + 5.05 * math.cos(a), TY + 5.05 * math.sin(a), z) for z in (TB + 6.0, 43.0)], 0.18 * S)
    b = a + math.pi / 8
    for z in (TB + 8.0, TB + 14.0, 38.0):
        c = P(TX + 5.05 * math.cos(b), TY + 5.05 * math.sin(b), 0)
        WIN.append((c.x, c.y, ZW + z * S, 0.9 * S, 1.8 * S, (math.cos(b), math.sin(b)), 'round'))
cylinder('galleryFloor', M['towerGold'], 6.3 * S, 0.6 * S, P(TX, TY, 43.8), segs=32)
cylinder('galleryWall', M['towerPink'], 4.6 * S, 4.0 * S, P(TX, TY, 44.4), segs=24)
arcade_ring('galleryArches', M['towerPink'], 6.0 * S, 0.4 * S, ZW + 45.6 * S, 2.4 * S, 16, 0.6 * S, center=P(TX, TY, 0).xy)
for k in range(16):
    a = 2 * math.pi * k / 16
    cylinder(f'galleryPost{k}', M['towerGold'], 0.2 * S, 1.8 * S, P(TX + 5.8 * math.cos(a), TY + 5.8 * math.sin(a), 44.4), segs=8)
lathe('galleryRoof', M['copperCK'], [(6.5 * S, 0.0), (4.4 * S, 1.6 * S), (4.0 * S, 1.8 * S)], P(TX, TY, 48.0), segs=24)
lathe('lantern', M['towerPink'], [(3.4 * S, 0.0), (3.4 * S, 4.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(TX, TY, 49.8)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for k in range(8):
    a = 2 * math.pi * k / 8
    c = P(TX + 3.2 * math.cos(a), TY + 3.2 * math.sin(a), 0)
    WIN.append((c.x, c.y, ZW + 50.4 * S, 1.2 * S, 2.6 * S, (math.cos(a), math.sin(a)), 'round'))
lathe('lanternCupola', M['copperCK'], [(3.8 * S, 0.0), (3.4 * S, 1.6 * S), (1.6 * S, 3.4 * S), (0.8 * S, 4.6 * S), (1.2 * S, 5.6 * S), (0.4 * S, 6.8 * S), (0.0, 7.4 * S)], P(TX, TY, 53.8), segs=24, smooth=True)
lathe('lanternFinial', M['gold'], [(0.0, 0.0), (0.35 * S, 0.4 * S), (0.0, 1.8 * S)], P(TX, TY, 61.1), segs=8, smooth=True)

# ------------------------------------------------------------------ the castle's painted wings along the rock, and the Cloak Bridge over the cleft
WINGS = ((-24.0, 18.0, -43.0, 30.0, 18.0), (-26.0, 32.0, -42.0, 40.0, 15.0), (-58.0, 20.0, -80.0, 32.0, 16.0))
for k, (x0, y0, x1, y1, h) in enumerate(WINGS):
    xa, xb = sorted((x0, x1))
    g = min(ground(x, y) for x in (xa, xb) for y in (y0, y1)) - 2.0
    gt = max(ground(x, y) for x in (xa, xb) for y in (y0, y1))
    block(f'wing{k}', M['sgraffito'], xa, xb, y0, y1, g, gt + h)
    gable_roof(f'wingRoof{k}', M['roofCK'], (xa - 0.3) * S, (xb + 0.3) * S, (y0 - 0.3) * S, (y1 + 0.3) * S, ZW + (gt + h - 0.05) * S, 7.0 * S, over=0.0)
    for j in range(int((xb - xa) / 3.6)):
        c = P(xa + 1.8 + 3.6 * j, y0 - 0.05, 0)
        for z in (gt + 3.0, gt + 7.0, gt + 11.0):
            if z < gt + h - 2.5:
                WIN.append((c.x, c.y, ZW + z * S, 1.1 * S, 2.0 * S, (0, -1), 'rect'))
BY0, BY1 = 23.5, 28.5
arcade_path('cloakBridgeLow', M['castleWall'], [(x * S, BY0 * S) for x in (-56.0, -50.0, -44.0)], (BY1 - BY0) * S, ZW + 6.0 * S, 7.0 * S, 2.3 * S)
arcade_path('cloakBridgeMid', M['castleWall'], [(x * S, BY0 * S) for x in (-56.0, -52.0, -48.0, -44.0)], (BY1 - BY0) * S, ZW + 13.0 * S, 6.0 * S, 1.5 * S)
block('cloakBridgeTop', M['sgraffito'], -56.0, -44.0, BY0, BY1, 19.0, 25.0)
gable_roof('cloakBridgeRoof', M['roofCK'], -56.3 * S, -43.7 * S, (BY0 - 0.4) * S, (BY1 + 0.4) * S, ZW + 24.95 * S, 3.0 * S, over=0.0)
for x in (-44.0, -50.0, -56.0):
    block(f'cloakPier{x:.0f}', M['castleWall'], x - 1.0, x + 1.0, BY0, BY1, ground(x, 26.0) - 2.0, 6.2)
for j in range(3):
    c = P(-54.0 + 4.0 * j, BY0 - 0.05, 0)
    WIN.append((c.x, c.y, ZW + 21.0 * S, 1.1 * S, 2.0 * S, (0, -1), 'rect'))

# ------------------------------------------------------------------ the old town in the loop: its houses, red roofs and St Vitus
VX, VY = 36.0, 2.0
HOUSES = []
for k in range(400):
    if len(HOUSES) >= 26:
        break
    a = rng.uniform(0, 2 * math.pi)
    r = 19.0 * math.sqrt(rng.random())
    x, y = TOWN[0] + r * math.cos(a), TOWN[1] + r * math.sin(a)
    if river_dist(x, y) < HALFW + 5.0 or math.hypot(x - VX, y - VY - 6.0) < 12.0 or math.hypot(x + FX, y) * S > 1.32:
        continue
    if any(abs(x - hx) < (8.0 + hw) / 2 + 1.0 and abs(y - hy) < (7.5 + hd) / 2 + 1.0 for hx, hy, hw, hd, _ in HOUSES):
        continue
    HOUSES.append((x, y, rng.uniform(6.5, 9.0), rng.uniform(6.0, 8.0), rng.uniform(8.0, 11.0)))
for k, (x, y, w, d, h) in enumerate(HOUSES):
    g = min(ground(x + sx * w / 2, y + sy * d / 2) for sx in (-1, 1) for sy in (-1, 1)) - 1.0
    gt = max(ground(x + sx * w / 2, y + sy * d / 2) for sx in (-1, 1) for sy in (-1, 1))
    block(f'house{k}', WALLS[k % len(WALLS)], x - w / 2, x + w / 2, y - d / 2, y + d / 2, g, gt + h)
    gable_roof(f'houseRoof{k}', M['roofCK'], (x - w / 2 - 0.4) * S, (x + w / 2 + 0.4) * S, (y - d / 2 - 0.4) * S, (y + d / 2 + 0.4) * S, ZW + (gt + h - 0.05) * S, 5.5 * S, over=0.0,
               along='x' if k % 2 else 'y')
    for u in (-w * 0.25, w * 0.25):
        c = P(x + u, y - d / 2 - 0.05, 0)
        for z in (gt + 2.5, gt + 6.0):
            if z < gt + h - 1.5:
                WIN.append((c.x, c.y, ZW + z * S, 1.0 * S, 1.6 * S, (0, -1), 'rect'))
gv = ground(VX, VY) - 1.0
block('stVitusNave', M['castleWall'], VX - 4.0, VX + 4.0, VY, VY + 18.0, gv, gv + 15.0)
gable_roof('stVitusRoof', M['roofCK'], (VX - 4.6) * S, (VX + 4.6) * S, VY * S, (VY + 18.0) * S, ZW + (gv + 14.95) * S, 9.0 * S, over=0.0, along='y')
block('stVitusTower', M['castleWall'], VX - 3.2, VX + 3.2, VY - 6.4, VY, gv, gv + 30.0)
lathe('stVitusOctagon', M['castleWall'], [(3.0 * S, 0.0), (3.0 * S, 8.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(VX, VY - 3.2, gv + 30.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('stVitusSpire', M['copperCK'], [(3.2 * S, 0.0), (1.4 * S, 4.0 * S), (0.0, 16.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(VX, VY - 3.2, gv + 38.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for nx, ny in ((0, -1), (-1, 0), (1, 0)):
    c = P(VX + nx * 3.25, VY - 3.2 + ny * 3.25, 0)
    WIN.append((c.x, c.y, ZW + (gv + 20.0) * S, 1.4 * S, 4.4 * S, (nx, ny), 'pointed'))
glazed('windows', WIN, M['white'], depth=0.3 * S)

# ------------------------------------------------------------------ the raft, the wooded hills, people
RX, RY, RA = 6.0, -30.0, 0.55
for j in range(6):
    cylinder(f'raftLog{j}', M['wood'], 0.35 * S, 7.0 * S, (0, 0, 0), segs=8,
             matrix=Matrix.Translation(P(RX, RY, 0.1)) @ Matrix.Rotation(RA, 4, 'Z') @ Matrix.Translation(((j - 2.5) * 0.72 * S, 0.0, 0.0)) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -3.5 * S)))
for k, (dx, dy, shirt) in enumerate(((-0.8, -1.5, 'red'), (0.7, 1.4, 'yellow'))):
    c = P(RX + dx, RY + dy, 0.45)
    person(f'rafter{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.8)
TREES = []
for p in scatter_on(land, 9000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 0 and math.hypot(p.x, p.y) < 1.36, seed=19):
    mx, my = p.x / S - FX, p.y / S
    g = ground(mx, my)
    if river_dist(mx, my) < HALFW + 5.0 or g < 4.0 or math.hypot((mx - CASTLE[0]) * 0.5, my - CASTLE[1]) < 30.0 or math.hypot(mx - TOWN[0], my - TOWN[1]) < 26.0:
        continue
    TREES.append(((p.x - FX * S, p.y, p.z + 3.0 * S), rng.uniform(2.8, 3.8) * S, 1.1))      # everything built moves by FX at the end
    if len(TREES) >= 240:
        break
blob_cloud('forest', M['forestCK'], TREES)
for k, (x, y, shirt) in enumerate(((36.0, -14.0, 'red'), (48.0, -10.0, 'blue'), (30.0, -2.0, 'yellow'), (-30.0, 28.0, 'green'), (-36.0, 24.0, 'red'))):
    c = P(x, y, ground(x, y))
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 8.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ Matrix.Translation((FX * S, 0.0, 0.0)) @ ob.matrix_world
for ob in (land, river):
    ob.matrix_world = R @ ob.matrix_world
render('cesky-krumlov')
