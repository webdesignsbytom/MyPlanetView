# Tallinn's Old Town in the high-quality look (hq.py), laid out in metres (drawn closer together, to
# fit): the medieval town wall curving across the front, its round towers under tall red cones and its
# roofed wall-walk; inside, the Lower Town's pastel houses under steep red roofs; the Town Hall on its
# square, its grey Gothic hall and slender octagonal tower with its green spire; St Olaf's Church and
# its tall green spire; behind, Toompea on its limestone hill with Tall Hermann flying the blue, black
# and white flag and the onion domes of the Alexander Nevsky Cathedral; the park outside the walls,
# and people.
# Run: blender -b --factory-startup -P tallinn.py -- tallinn-1024.png 1024 tallinn.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1248)
M['limestoneT'] = material('tallinnLimestone', '#b9b3a6', 0.85, vary='#a7a194', vary_scale=18, bump=0.25, bump_scale=200)
M['roofTal'] = banded(material('tallinnRoof', '#b04a33', 0.7, vary='#9e402c', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['copperTal'] = material('tallinnCopper', '#4e8a6e', 0.5, vary='#5a977a', vary_scale=20, metallic=0.35)
M['darkDome'] = material('nevskyDome', '#3b3f45', 0.4, metallic=0.5)
M['cliff'] = layered('toompeaCliff', ['#a39d8e', '#918b7d', '#b0aa9c'], scale=10.0, distortion=1.5, rough=0.9, bump=0.5, bump_scale=90, axis='Z')
M['street'] = material('tallinnStreet', '#a49d92', 0.85, vary='#988f84', vary_scale=60)
M['park'] = material('tallinnPark', '#6fae45', 0.85, vary='#7ab84f', vary_scale=10)
M['pinkT'] = material('nevskyPink', '#d9a7a0', 0.75)
M['flagBlue'] = material('flagBlue', '#2b6cc4', 0.6)
M['flagBlack'] = material('flagBlack', '#1d1d1d', 0.6)
WALLS = [material(f'tallinnWall{k}', c, 0.8, vary=c, vary_scale=30, bump=0.05, bump_scale=200) for k, c in enumerate(('#f0dca2', '#e9c3b8', '#f3efe2', '#cfe0c2', '#e9d2a8', '#d9e3ea', '#f5e7b8'))]

S = 0.0145              # metres to the tile's units
TOOM = (-52.0, 52.0)    # Toompea's middle


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


WALL = [(-92.0, -6.0), (-70.0, -34.0), (-38.0, -50.0), (0.0, -56.0), (38.0, -50.0), (70.0, -34.0), (92.0, -6.0)]


def inside_wall(x, y):
    """Behind (north of) the wall's line."""
    for (xa, ya), (xb, yb) in zip(WALL, WALL[1:]):
        if xa <= x <= xb:
            t = (x - xa) / (xb - xa)
            return y > ya + (yb - ya) * t + 3.0
    return y > 0.0


def ground(x, y):
    d = math.hypot((x - TOOM[0]) * 0.9, y - TOOM[1])
    return 22.0 * smooth((40.0 - d) / 9.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return ground(x / S, y / S) * S * rim


def pick(z, nz, x, y):
    mx, my = x / S, y / S
    if nz < 0.42:
        return 1
    if ground(mx, my) > 3.0 and ground(mx, my) < 20.0:
        return 0
    if inside_wall(mx, my) or ground(mx, my) >= 20.0:
        return 2
    return 0


land = terrain('ground', H, [M['park'], M['cliff'], M['street']], pick, rings=180, segs=460)
Z0 = G
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def footing(x0, x1, y0, y1):
    hs = [ground(x, y) for x in (x0, (x0 + x1) / 2, x1) for y in (y0, (y0 + y1) / 2, y1)]
    return min(hs) - 1.0, max(hs)


WIN = []
# ------------------------------------------------------------------ the town wall, its round towers under red cones
bm = bmesh.new()
for (xa, ya), (xb, yb) in zip(WALL, WALL[1:]):
    ang = math.atan2(yb - ya, xb - xa)
    nx, ny = -math.sin(ang), math.cos(ang)
    sec = [(0.0, -1.0), (2.6, -1.0), (2.6, 12.0), (0.0, 12.0)]
    add_prism(bm, [bm.verts.new(P(xa + nx * u, ya + ny * u, z)) for u, z in sec], [bm.verts.new(P(xb + nx * u, yb + ny * u, z)) for u, z in sec])
    # the roofed wall-walk along the top
    rb = bmesh.new()
    rs = [(-0.6, 11.8), (3.2, 11.8), (1.3, 14.2)]
    add_prism(rb, [rb.verts.new(P(xa + nx * u, ya + ny * u, z)) for u, z in rs], [rb.verts.new(P(xb + nx * u, yb + ny * u, z)) for u, z in rs])
    finish(f'wallWalkRoof{xa:.0f}', rb, M['roofTal'], smooth_sides=False)
finish('townWall', bm, M['limestoneT'], smooth_sides=False)
TOWERS = WALL[:]
for (xa, ya), (xb, yb) in zip(WALL, WALL[1:]):
    TOWERS.append(((xa + xb) / 2, (ya + yb) / 2))
for k, (x, y) in enumerate(TOWERS):
    if math.hypot(x * S, y * S) > 1.33:
        continue
    r = 4.6 if k % 2 else 5.4
    h = 18.0 + 4.0 * ((k * 5) % 3)
    cylinder(f'tower{k}', M['limestoneT'], r * S, (h + 1.0) * S, P(x, y, -1.0), segs=32, r2=(r - 0.3) * S)
    lathe(f'towerCone{k}', M['roofTal'], [((r + 0.6) * S, 0.0), (r * 0.6 * S, r * 0.9 * S), (0.0, r * 2.6 * S)], P(x, y, h), segs=24)
    for z in (h - 6.0, h - 12.0):
        for j in range(3):
            a = math.radians(240 + 30 * j)
            c = P(x + r * math.cos(a), y + r * math.sin(a), 0)
            WIN.append((c.x, c.y, Z0 + z * S, 0.7 * S, 1.6 * S, (math.cos(a), math.sin(a)), 'rect'))

# ------------------------------------------------------------------ the Town Hall on its square: the Gothic hall, the slender tower and spire
TX, TY = 4.0, -10.0
slab('townHallSquare', M['street'], rect(TX * S, (TY - 16.0) * S, 34.0 * S, 18.0 * S), Z0, Z0 + 0.2 * S, margin=0.05)
box('townHall', M['limestoneT'], P(TX, TY, 8.0), (30.0 * S, 12.0 * S, 16.0 * S), bevel=0.0004)
gable_roof('townHallRoof', M['roofTal'], (TX - 15.3) * S, (TX + 15.3) * S, (TY - 6.3) * S, (TY + 6.3) * S, Z0 + 15.95 * S, 9.0 * S, over=0.0, along='x')
for j in range(13):
    box(f'townHallMerlon{j}', M['limestoneT'], P(TX - 14.0 + 28.0 * j / 12, TY - 5.8, 16.6), (1.0 * S, 0.6 * S, 1.2 * S), bevel=0)
for j in range(9):
    c = P(TX - 12.0 + 3.0 * j, TY - 6.05, 0)
    WIN.append((c.x, c.y, Z0 + 2.0 * S, 1.6 * S, 4.0 * S, (0, -1), 'pointed'))
    WIN.append((c.x, c.y, Z0 + 9.0 * S, 1.4 * S, 3.6 * S, (0, -1), 'pointed'))
HX = TX + 17.0
lathe('townHallTower', M['limestoneT'], [(3.2 * S, 0.0), (3.0 * S, 30.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(HX, TY - 2.0, 0.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('townHallGallery', M['limestoneT'], [(3.6 * S, 0.0), (3.6 * S, 0.8 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(HX, TY - 2.0, 30.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('townHallSpire', M['copperTal'], [(2.8 * S, 0.0), (2.0 * S, 3.0 * S), (2.6 * S, 4.0 * S), (1.2 * S, 7.0 * S), (1.6 * S, 8.0 * S), (0.5 * S, 11.0 * S), (0.0, 15.0 * S)], P(HX, TY - 2.0, 30.8), segs=16, smooth=True)
lathe('oldThomas', M['gold'], [(0.25 * S, 0.0), (0.0, 1.6 * S)], P(HX, TY - 2.0, 45.8), segs=6)

# ------------------------------------------------------------------ St Olaf's: its nave and its tall tower with the green spire
OX, OY = 46.0, 30.0
box('stOlafNave', M['limestoneT'], P(OX - 12.0, OY, 10.0), (26.0 * S, 14.0 * S, 20.0 * S), bevel=0.0004)
gable_roof('stOlafRoof', M['roofTal'], (OX - 25.3) * S, (OX + 1.0) * S, (OY - 7.3) * S, (OY + 7.3) * S, Z0 + 19.95 * S, 10.0 * S, over=0.0, along='x')
box('stOlafTower', M['limestoneT'], P(OX + 6.0, OY, 21.0), (12.0 * S, 12.0 * S, 42.0 * S), bevel=0.0006)
for z in (14.0, 28.0, 41.0):
    box(f'stOlafBand{z:.0f}', M['limestoneT'], P(OX + 6.0, OY, z), (12.6 * S, 12.6 * S, 0.8 * S), bevel=0)
for nx, ny in ((0, -1), (-1, 0)):
    c = P(OX + 6.0 + nx * 6.05, OY + ny * 6.05, 0)
    WIN.append((c.x, c.y, Z0 + 32.0 * S, 2.2 * S, 7.0 * S, (nx, ny), 'pointed'))
pyramid('stOlafSpireBase', M['copperTal'], (OX + 6.0) * S, OY * S, Z0 + 41.95 * S, 12.6 * S, 6.0 * S)
lathe('stOlafSpire', M['copperTal'], [(2.8 * S, 0.0), (0.3 * S, 34.0 * S), (0.0, 37.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(OX + 6.0, OY, 46.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))

# ------------------------------------------------------------------ Toompea: Tall Hermann and its flag, the Alexander Nevsky Cathedral
th = ground(*TOOM)
HMX, HMY = TOOM[0] - 10.0, TOOM[1] + 4.0
box('tallHermann', M['limestoneT'], P(HMX, HMY, th + 13.0), (9.0 * S, 9.0 * S, 30.0 * S), bevel=0.0006)
box('tallHermannTop', M['limestoneT'], P(HMX, HMY, th + 28.8), (10.0 * S, 10.0 * S, 1.6 * S), bevel=0)
for j in range(12):
    a = 2 * math.pi * j / 12
    box(f'hermannMerlon{j}', M['limestoneT'], P(HMX + 4.4 * math.cos(a), HMY + 4.4 * math.sin(a), th + 30.4), (1.0 * S, 1.0 * S, 1.2 * S), bevel=0)
cylinder('flagpole', M['white'], 0.15 * S, 12.0 * S, P(HMX, HMY, th + 29.6), segs=6)
for k, mat in enumerate(('flagBlue', 'flagBlack', 'white')):
    box(f'flag{k}', M[mat], P(HMX + 3.0, HMY, th + 40.6 - 1.0 * k), (6.0 * S, 0.12 * S, 1.0 * S), bevel=0)
box('toompeaWall', M['limestoneT'], P(TOOM[0] + 10.0, TOOM[1] - 26.0, th - 4.0), (44.0 * S, 3.0 * S, 12.0 * S), rot_z=math.radians(-10), bevel=0.0004)
NX, NY = TOOM[0] + 12.0, TOOM[1] - 6.0
box('nevsky', M['pinkT'], P(NX, NY, th + 7.0), (16.0 * S, 22.0 * S, 14.0 * S), bevel=0.0004)
gable_roof('nevskyRoof', M['darkDome'], (NX - 8.3) * S, (NX + 8.3) * S, (NY - 11.3) * S, (NY + 11.3) * S, Z0 + (th + 13.95) * S, 4.0 * S, over=0.0, along='y')
for k, (dx, dy, r, z) in enumerate(((0.0, 0.0, 3.6, 18.0), (-5.0, -7.0, 2.0, 15.0), (5.0, -7.0, 2.0, 15.0), (-5.0, 7.0, 2.0, 15.0), (5.0, 7.0, 2.0, 15.0))):
    cylinder(f'nevskyDrum{k}', M['pinkT'], r * 0.8 * S, (z - 14.0) * S, P(NX + dx, NY + dy, th + 14.0), segs=16)
    lathe(f'nevskyDome{k}', M['darkDome'], [(r * S, 0.0), (r * 1.25 * S, r * 0.6 * S), (r * 0.9 * S, r * 1.3 * S), (r * 0.25 * S, r * 1.8 * S), (0.0, r * 2.4 * S)], P(NX + dx, NY + dy, th + z), segs=16, smooth=True)
    lathe(f'nevskyCross{k}', M['gold'], [(0.15 * S, 0.0), (0.0, 1.6 * S)], P(NX + dx, NY + dy, th + z + r * 2.4), segs=6)

# ------------------------------------------------------------------ the Lower Town's houses under steep red roofs
HOUSES = []
for i in range(-12, 13):
    for j in range(-7, 9):
        x = i * 7.8 + rng.uniform(-1.0, 1.0)
        y = j * 7.8 + rng.uniform(-1.0, 1.0)
        if not inside_wall(x, y) or math.hypot(x * S, y * S) > 1.3 or ground(x, y) > 3.0:
            continue
        if abs(x - TX) < 22.0 and TY - 26.0 < y < TY + 9.0:
            continue
        if OX - 28.0 < x < OX + 14.0 and OY - 10.0 < y < OY + 10.0:
            continue
        if inside_wall(x, y - 9.0) is False or rng.random() < 0.12:
            continue
        HOUSES.append((x, y, rng.uniform(6.0, 7.0), rng.uniform(6.0, 7.2), rng.uniform(8.0, 13.0)))
# and on Toompea's top, round Tall Hermann and the cathedral
for i in range(-8, 9):
    for j in range(-8, 9):
        x = TOOM[0] + i * 7.6 + rng.uniform(-1.0, 1.0)
        y = TOOM[1] + j * 7.6 + rng.uniform(-1.0, 1.0)
        if ground(x, y) < 21.0 or math.hypot(x * S, y * S) > 1.3:
            continue
        if math.hypot(x - HMX, y - HMY) < 9.0 or (abs(x - NX) < 13.0 and abs(y - NY) < 16.0) or rng.random() < 0.15:
            continue
        HOUSES.append((x, y, rng.uniform(6.0, 7.0), rng.uniform(6.0, 7.2), rng.uniform(8.0, 11.0)))
for k, (x, y, w, d, h) in enumerate(HOUSES):
    g, gt = footing(x - w / 2, x + w / 2, y - d / 2, y + d / 2)
    box(f'house{k}', WALLS[k % len(WALLS)], P(x, y, (g + gt + h) / 2), (w * S, d * S, (gt + h - g) * S), bevel=0.0004)
    gable_roof(f'houseRoof{k}', M['roofTal'], (x - w / 2 - 0.3) * S, (x + w / 2 + 0.3) * S, (y - d / 2 - 0.3) * S, (y + d / 2 + 0.3) * S, Z0 + (gt + h - 0.05) * S, 6.0 * S, over=0.0, along='y' if k % 3 else 'x')
    c = P(x, y - d / 2 - 0.05, 0)
    for z in (gt + 2.4, gt + 5.6):
        if z < gt + h - 1.6:
            WIN.append((c.x, c.y, Z0 + z * S, 1.0 * S, 1.6 * S, (0, -1), 'rect'))
glazed('windows', WIN, M['white'], depth=0.3 * S)

# ------------------------------------------------------------------ trees in the park outside the walls, people
TREES = []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 0 and math.hypot(p.x, p.y) < 1.36, seed=17):
    mx, my = p.x / S, p.y / S
    if inside_wall(mx, my + 8.0):
        continue
    TREES.append(((p.x, p.y, p.z + 4.0 * S), rng.uniform(3.0, 4.0) * S, 1.0))
    if len(TREES) >= 50:
        break
blob_cloud('parkTrees', M['leaf'], TREES)
for k, (x, y, shirt) in enumerate(((0.0, -22.0, 'red'), (8.0, -24.0, 'blue'), (-4.0, -70.0, 'yellow'), (22.0, -68.0, 'green'), (-30.0, -64.0, 'red'))):
    c = P(x, y, 0.2 if y > -30.0 else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.3)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('tallinn')
