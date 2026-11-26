# The Giralda in the high-quality look (hq.py), laid out in metres from the Patio de los Naranjos: the
# old Almohad minaret of pink brick, its stone foot, its column of paired horseshoe windows up each face
# between the raised lattice (sebka) panels; the Renaissance stages on top, the belfry with its bells'
# arches, the clock and star stages with their balustrades, the lily vases and the cupola, and the
# Giraldillo turning on top (a scanned statue, UBICA.srl, CC BY 4.0, in _sources/madonnina/, standing
# in, in bronze); the Gothic cathedral beside it, its stepped roofs with their balustrades, pinnacles and
# flying buttresses, its tall pointed windows and the raised crossing; the Patio's rows of orange trees,
# its fountain, its crenellated wall and the horseshoe arch of the Puerta del Perdón; and people.
# Run: blender -b --factory-startup -P seville-giralda.py -- seville-giralda-1024.png 1024 seville-giralda.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1198)
M['giraldaBrick'] = masonry('giraldaBrick', '#cf946a', '#e3c29e', scale=420, rough=0.85, vary='#c4895f')
M['giraldaStone'] = masonry('giraldaStone', '#d9c9a8', '#b5a585', scale=200, rough=0.8, vary='#cfbe9c')
M['belfry'] = material('belfryOchre', '#e6c48a', 0.75, vary='#dcb97d', vary_scale=24, bump=0.06, bump_scale=200)
M['bronze'] = material('giraldilloBronze', '#6f5a3a', 0.35, vary='#7d6644', vary_scale=40, metallic=0.8)
M['patioS'] = masonry('patioNaranjos', '#d6c5a4', '#b2a181', scale=260, rough=0.85, vary='#cdbb98')
M['orangeLeaf'] = material('orangeLeafS', '#3f6e2e', 0.8, vary='#4a7d36', vary_scale=14, bump=0.3, bump_scale=90)
M['orangeFruit'] = material('orangeFruitS', '#f08a24', 0.5)
M['bells'] = material('bellBronze', '#8a6a3a', 0.35, metallic=0.9)

S = 0.02                # metres to the tile's units
FX, FY = -19.0, -18.0   # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector(((x + FX) * S, (y + FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
WIN = []
GX0, GX1, GY0, GY1 = 46.0, 59.6, -12.0, 1.6      # the tower's square
GX, GY = (GX0 + GX1) / 2, (GY0 + GY1) / 2
FACES = ((0, -1), (1, 0), (-1, 0), (0, 1))


# ------------------------------------------------------------------ the minaret: its stone foot, brick shaft, windows and sebka lattice
block('towerFoot', M['giraldaStone'], GX0 - 0.2, GX1 + 0.2, GY0 - 0.2, GY1 + 0.2, -0.3, 3.0)
block('shaft', M['giraldaBrick'], GX0, GX1, GY0, GY1, 2.9, 50.5)
HALF = (GX1 - GX0) / 2
lattice = bmesh.new()
for nx, ny in FACES:
    tx, ty = (-ny, nx)                       # along the face
    for z in (9.0, 17.0, 25.0, 33.0, 41.0):
        for u in (-0.55, 0.55):
            c = P(GX + nx * (HALF + 0.26) + tx * u, GY + ny * (HALF + 0.26) + ty * u, 0)
            WIN.append((c.x, c.y, Z0 + z * S, 0.9 * S, 2.6 * S, (nx, ny), 'round'))
        # the window's frame panel, a little proud of the wall
        c = P(GX + nx * (HALF + 0.12), GY + ny * (HALF + 0.12), z + 1.4)
        box(f'windowPanel{nx}{ny}{z:.0f}', M['giraldaBrick'], c, ((2.8 if ny else 0.24) * S, (0.24 if ny else 2.8) * S, 3.8 * S), bevel=0)
    # the sebka: a raised diamond net either side of the windows, from 24 m to 48 m
    for side in (-1, 1):
        u0, u1 = side * 2.2, side * 6.2
        z0, z1 = 24.0, 48.0
        cells = 3
        w = (u1 - u0) / cells
        rows = int((z1 - z0) / abs(w * 1.6))
        h = (z1 - z0) / rows
        for i in range(cells + 1):
            for j in range(rows + 1):
                for di, dj in ((1, 1), (1, -1)):
                    if not (0 <= i + di <= cells and 0 <= j + dj <= rows):
                        continue
                    ua, za = u0 + w * i, z0 + h * j
                    ub, zb = u0 + w * (i + di), z0 + h * (j + dj)
                    pa = P(GX + nx * (HALF + 0.12) + tx * ua, GY + ny * (HALF + 0.12) + ty * ua, za)
                    pb = P(GX + nx * (HALF + 0.12) + tx * ub, GY + ny * (HALF + 0.12) + ty * ub, zb)
                    d = pb - pa
                    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
                    bmesh.ops.create_cube(lattice, size=1.0, matrix=Matrix.Translation((pa + pb) / 2) @ rot @ Matrix.Diagonal((0.32 * S, 0.32 * S, d.length, 1)))
        # the arcade of small blind arches framing the panel's foot
        c = P(GX + nx * (HALF + 0.1) + tx * (u0 + u1) / 2, GY + ny * (HALF + 0.1) + ty * (u0 + u1) / 2, 22.6)
        box(f'sebkaSill{nx}{ny}{side}', M['giraldaStone'], c, ((abs(u1 - u0) if ny else 0.3) * S, (0.3 if ny else abs(u1 - u0)) * S, 0.5 * S), bevel=0)
finish('sebka', lattice, M['giraldaBrick'], smooth_sides=False)
block('shaftTop', M['giraldaStone'], GX0 - 0.3, GX1 + 0.3, GY0 - 0.3, GY1 + 0.3, 50.2, 51.0, bevel=0)

# ------------------------------------------------------------------ the Renaissance stages: belfry, clock, stars, lilies, cupola, the Giraldillo
B = 5.6                 # the belfry's half width
# the belfry: an open arcade of four arches a side round its core, the bells hanging in the arches
block('belfryCore', M['belfry'], GX - B + 1.6, GX + B - 1.6, GY - B + 1.6, GY + B - 1.6, 51.0, 58.4)
ring_pts = []
for (ax, ay), (bx, by) in (((-B, -B), (B, -B)), ((B, -B), (B, B)), ((B, B), (-B, B)), ((-B, B), (-B, -B))):
    for k in range(4):
        ring_pts.append(((GX + FX + ax + (bx - ax) * k / 4) * S, (GY + FY + ay + (by - ay) * k / 4) * S))
ring_pts.append(ring_pts[0])
arcade_path('belfryArches', M['belfry'], ring_pts, 0.9 * S, Z0 + 54.6 * S, 3.8 * S, 1.0 * S, inward=True, closed_center=((GX + FX) * S, (GY + FY) * S))
for (ax, ay) in [(p[0] / S - GX - FX, p[1] / S - GY - FY) for p in ring_pts[:-1]]:
    box(f'belfryPier{ax:+.0f}{ay:+.0f}', M['belfry'], P(GX + ax * (B - 0.45) / B, GY + ay * (B - 0.45) / B, 52.8), (0.9 * S, 0.9 * S, 3.8 * S), bevel=0)
for nx, ny in FACES:
    tx, ty = (-ny, nx)
    for u in (-2.1, 2.1):
        bell = P(GX + nx * (B - 1.2) + tx * u, GY + ny * (B - 1.2) + ty * u, 54.0)
        lathe(f'bell{nx}{ny}{u:+.0f}', M['bells'], [(0.75 * S, 0.0), (0.6 * S, 0.4 * S), (0.45 * S, 1.4 * S), (0.0, 1.6 * S)], bell, segs=16, smooth=True)
block('belfryCornice', M['white'], GX - B - 0.4, GX + B + 0.4, GY - B - 0.4, GY + B + 0.4, 58.4, 59.0, bevel=0)
BAL = []


def balustrade(half, z):
    """A railing round a stage's top (a closed ring, one spline each)."""
    BAL.append([P(GX + sx * half, GY + sy * half, z + 0.9) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1), (-1, -1))])


balustrade(B + 0.2, 59.0)
block('clockStage', M['belfry'], GX - 4.4, GX + 4.4, GY - 4.4, GY + 4.4, 59.0, 66.0)
for nx, ny in FACES:
    lathe(f'clock{nx}{ny}', M['white'], [(0.0, 0.0), (1.3 * S, 0.0), (1.3 * S, 0.15 * S), (0.0, 0.15 * S)], (0, 0, 0), segs=24,
          matrix=Matrix.Translation(P(GX + nx * 4.42, GY + ny * 4.42, 62.6)) @ Matrix.Rotation(math.atan2(ny, nx), 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
block('clockCornice', M['white'], GX - 4.8, GX + 4.8, GY - 4.8, GY + 4.8, 66.0, 66.5, bevel=0)
balustrade(4.6, 66.5)
block('starStage', M['belfry'], GX - 3.4, GX + 3.4, GY - 3.4, GY + 3.4, 66.5, 72.0)
for nx, ny in FACES:
    tx, ty = (-ny, nx)
    for u in (-1.4, 1.4):
        c = P(GX + nx * 3.45 + tx * u, GY + ny * 3.45 + ty * u, 0)
        WIN.append((c.x, c.y, Z0 + 67.6 * S, 0.9 * S, 2.8 * S, (nx, ny), 'round'))
block('starCornice', M['white'], GX - 3.8, GX + 3.8, GY - 3.8, GY + 3.8, 72.0, 72.5, bevel=0)
balustrade(3.6, 72.5)
for sx in (-1, 1):
    for sy in (-1, 1):
        c = P(GX + sx * 3.0, GY + sy * 3.0, 72.5)
        lathe(f'lilyVase{sx}{sy}', M['belfry'], [(0.3 * S, 0.0), (0.7 * S, 0.8 * S), (0.5 * S, 1.6 * S), (0.75 * S, 2.0 * S), (0.0, 2.1 * S)], c, segs=12, smooth=True)
        blob_cloud(f'lilies{sx}{sy}', M['bronze'], [((c.x, c.y, c.z + 2.9 * S), 0.6 * S, 1.4)], subdivisions=1)
cylinder('drum', M['belfry'], 2.4 * S, 5.0 * S, P(GX, GY, 72.5), segs=16)
for k in range(8):
    a = 2 * math.pi * k / 8
    c = P(GX + 2.42 * math.cos(a), GY + 2.42 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + 73.6 * S, 0.7 * S, 2.2 * S, (math.cos(a), math.sin(a)), 'round'))
lathe('cupola', M['belfry'], [(2.6 * S, 0.0), (2.4 * S, 1.4 * S), (1.6 * S, 2.8 * S), (0.6 * S, 3.6 * S), (0.0, 3.8 * S)], P(GX, GY, 77.5), segs=24, smooth=True)
cylinder('cupolaNeck', M['bronze'], 0.4 * S, 2.2 * S, P(GX, GY, 81.2), segs=8)
lathe('orb', M['bronze'], [(0.0, 0.0), (0.7 * S, 0.5 * S), (0.7 * S, 0.9 * S), (0.0, 1.4 * S)], P(GX, GY, 83.3), segs=12, smooth=True)
src = import_model('madonnina', 'giraldilloSource')
stand_sourced(src, cut=0.34, turn=0.0, height=4.2 * S, z=0.0, mat=M['bronze'], report=False)
src.matrix_world = Matrix.Translation(P(GX, GY, 84.6))

# ------------------------------------------------------------------ the cathedral beside it: stepped roofs, pinnacles, flying buttresses, the crossing
# (shortened: the real one is 116 m long)
CX0, CX1 = -22.0, 46.0
LEVELS = ((0.0, 7.0, 18.0), (7.0, 31.0, 27.0), (31.0, 45.0, 40.0), (45.0, 69.0, 27.0), (69.0, 76.0, 18.0))
for k, (y0, y1, h) in enumerate(LEVELS):
    block(f'cathedral{k}', M['giraldaStone'], CX0, CX1, y0, y1, -0.3, h)
    block(f'cathedralParapet{k}', M['giraldaStone'], CX0 - 0.2, CX1 + 0.2, y0 - 0.2, y1 + 0.2, h, h + 1.0, bevel=0)
block('crossing', M['giraldaStone'], 4.0, 20.0, 29.0, 47.0, 39.0, 52.0)
block('crossingParapet', M['giraldaStone'], 3.7, 20.3, 28.7, 47.3, 52.0, 53.0, bevel=0)
PIN = bmesh.new()


def pinnacle(x, y, z, h=6.0, r=0.6):
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * S, radius2=r * S, depth=h * 0.45 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.225)))
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * 1.15 * S, radius2=0.0, depth=h * 0.6 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.45 + h * 0.3 - 0.05)))


FLY = bmesh.new()
for k, x in enumerate([CX0 + 2.0 + 9.0 * i for i in range(8)]):
    for y, z, (ty, tz) in ((0.0, 18.0, (7.0, 27.0)), (7.0, 27.0, (31.0, 40.0)), (76.0, 18.0, (69.0, 27.0)), (69.0, 27.0, (45.0, 40.0))):
        pinnacle(x, y, z + 1.0, h=7.0 if z > 20 else 5.0)
        a, b = P(x, y, z + 3.0), P(x, ty, tz - 2.0)
        d = b - a
        rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        bmesh.ops.create_cube(FLY, size=1.0, matrix=Matrix.Translation((a + b) / 2) @ rot @ Matrix.Diagonal((0.6 * S, 0.9 * S, d.length, 1)))
    for y in (-0.05, 6.95):
        c = P(x + 4.5, y, 0)
        z, hh = (6.0, 9.0) if y < 1 else (19.6, 6.4)
        WIN.append((c.x, c.y, Z0 + z * S, 2.4 * S, hh * S, (0, -1), 'pointed'))
    c = P(x + 4.5, 30.95, 0)
    WIN.append((c.x, c.y, Z0 + 29.0 * S, 2.6 * S, 9.0 * S, (0, -1), 'pointed'))
for x, y in ((4.0, 29.0), (20.0, 29.0), (4.0, 47.0), (20.0, 47.0)):
    pinnacle(x, y, 53.0, h=8.0, r=0.8)
finish('pinnacles', PIN, M['giraldaStone'], smooth_sides=False)
finish('flyingButtresses', FLY, M['giraldaStone'], smooth_sides=False)
for x in (8.0, 16.0):
    c = P(x, 28.95, 0)
    WIN.append((c.x, c.y, Z0 + 43.0 * S, 2.6 * S, 7.0 * S, (0, -1), 'pointed'))

# ------------------------------------------------------------------ the Patio de los Naranjos: its wall, the Puerta del Perdón, the fountain and orange trees
PX0, PX1, PY0 = -20.0, 44.0, -40.0
block('patioFloor', M['patioS'], PX0, PX1, PY0, 0.0, -0.3, 0.05, bevel=0)
MERLON = [(-0.5, 0.0), (0.5, 0.0), (0.5, 0.9), (0.0, 1.4), (-0.5, 0.9)]
mer = bmesh.new()
for (ax, ay), (bx, by) in (((PX0, PY0), (PX1, PY0)), ((PX0, PY0), (PX0, 0.0)), ((PX1, PY0), (PX1, GY0))):
    L = math.hypot(bx - ax, by - ay)
    ang = math.atan2(by - ay, bx - ax)
    box(f'patioWall{ax:.0f}{ay:.0f}{bx:.0f}', M['giraldaStone'], P((ax + bx) / 2, (ay + by) / 2, 4.85), ((L + 1.6) * S, 1.6 * S, 10.3 * S), rot_z=ang, bevel=0)
    tx, ty = math.cos(ang), math.sin(ang)
    for k in range(int(L / 1.6)):
        cx, cy = ax + tx * (k + 0.5) * L / int(L / 1.6), ay + ty * (k + 0.5) * L / int(L / 1.6)
        add_prism(mer, [mer.verts.new(P(cx + tx * u + ty * 0.3, cy + ty * u - tx * 0.3, 10.0 + v)) for u, v in MERLON],
                  [mer.verts.new(P(cx + tx * u - ty * 0.3, cy + ty * u + tx * 0.3, 10.0 + v)) for u, v in MERLON])
finish('patioMerlons', mer, M['giraldaStone'], smooth_sides=False)
# the Puerta del Perdón: a tall horseshoe arch in its frame, rising over the wall
GATE = 12.0
block('perdonFrame', M['giraldaStone'], GATE - 8.0, GATE + 8.0, PY0 - 1.4, PY0 + 1.0, -0.3, 16.0)
arcade_path('perdonArch', M['giraldaBrick'], [((GATE - 5.2 + FX) * S, (PY0 - 1.7 + FY) * S), ((GATE + 5.2 + FX) * S, (PY0 - 1.7 + FY) * S)], 0.3 * S, Z0 + 6.0 * S, 7.0 * S, 3.6 * S)
c = P(GATE, PY0 - 1.45, 0)
glazed('perdonDoor', [(c.x, c.y, Z0 + 0.0, 7.0 * S, 9.4 * S, (0, -1), 'round')], M['giraldaStone'], glass=M['door'], depth=0.3 * S)
mer2 = bmesh.new()
for k in range(10):
    x = GATE - 7.2 + 1.6 * k
    add_prism(mer2, [mer2.verts.new(P(x + u, PY0 - 0.9, 16.0 + v)) for u, v in MERLON], [mer2.verts.new(P(x + u, PY0 + 0.5, 16.0 + v)) for u, v in MERLON])
finish('perdonMerlons', mer2, M['giraldaStone'], smooth_sides=False)
c = P(GATE, -20.0, 0.0)
lathe('fountain', M['giraldaStone'], [(2.2 * S, 0.0), (2.2 * S, 0.6 * S), (0.5 * S, 0.8 * S), (0.4 * S, 1.6 * S), (1.4 * S, 2.0 * S), (1.3 * S, 2.3 * S), (0.0, 2.3 * S)], c, segs=24, smooth=True)
TREES, FRUIT = [], []
for i, x in enumerate([PX0 + 6.0 + 6.5 * i for i in range(9)]):
    for j, y in enumerate([PY0 + 6.0 + 6.5 * j for j in range(5)]):
        if abs(x - GATE) < 4.0 and abs(y + 20.0) < 4.0:
            continue
        if x > GX0 - 4.0 and y > GY0 - 4.0:
            continue
        cylinder(f'orangeTrunk{i}_{j}', M['trunk'], 0.18 * S, 1.6 * S, P(x, y, 0.0), segs=6)
        TREES.append((P(x, y, 2.9).to_tuple(), 2.0 * S, 0.95))
        for k in range(5):
            a = rng.uniform(0, 2 * math.pi)
            e = rng.uniform(-0.4, 0.9)
            FRUIT.append((P(x + 1.9 * math.cos(a) * math.cos(e), y + 1.9 * math.sin(a) * math.cos(e), 2.9 + 1.8 * math.sin(e)).to_tuple(), 0.26 * S, 1.0))
blob_cloud('orangeTrees', M['orangeLeaf'], TREES)
blob_cloud('oranges', M['orangeFruit'], FRUIT, subdivisions=1)
cu = bpy.data.curves.new('balustrades', 'CURVE')
cu.dimensions = '3D'
cu.bevel_depth = 0.2 * S
for pts in BAL:
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, q in enumerate(pts):
        sp.points[i].co = (*q, 1)
bal = bpy.data.objects.new('balustrades', cu)
bal.data.materials.append(M['white'])
bpy.context.scene.collection.objects.link(bal)
glazed('windows', WIN, M['giraldaStone'], depth=0.3 * S)
for k, (x, y, shirt) in enumerate(((-10.0, -26.0, 'red'), (16.0, -32.0, 'blue'), (28.0, -14.0, 'yellow'), (-14.0, -8.0, 'green'), (36.0, -26.0, 'red'), (10.0, -46.0, 'blue'), (64.0, -10.0, 'yellow'))):
    c = P(x, y, 0.05)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.6)

R = Matrix.Rotation(math.radians(-32.0 - 45.0), 4, 'Z')     # seen from the north-east, the Giralda nearest
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('seville-giralda')
