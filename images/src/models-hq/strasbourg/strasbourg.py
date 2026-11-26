# Strasbourg Cathedral in the high-quality look (hq.py), laid out in metres from its square: the west
# front of pink Vosges sandstone, its three portals under their pointed gables, the great rose window, the
# "harp strings" of slender tracery standing proud of the whole front, the platform at 66 metres; the one
# north tower rising from it, its tall octagon ringed by four openwork stair turrets, and the openwork
# spire climbing in tiers of little turrets to its lantern and cross; the nave, aisles and flying
# buttresses, the transept and apse behind under their dark roofs; on the square, Maison Kammerzell's
# carved timber frame; and people.
# Run: blender -b --factory-startup -P strasbourg.py -- strasbourg-1024.png 1024 strasbourg.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1439)
M['vosges'] = masonry('vosgesSandstone', '#c98a7a', '#a66c5e', scale=260, rough=0.8, vary='#bd7e6e')
M['vosgesLight'] = material('vosgesLight', '#d39a8a', 0.75, vary='#c98e7e', vary_scale=24, bump=0.08, bump_scale=200)
M['roofS'] = banded(material('cathedralRoof', '#4f5a55', 0.5, vary='#46504c', vary_scale=14, metallic=0.25), 'Z', 380.0, strength=0.2)
M['squareS'] = masonry('placeCathedrale', '#cbbfae', '#a99e8d', scale=220, rough=0.8, vary='#c2b6a4')
M['plaster'] = material('kammerzellPlaster', '#ead9b5', 0.8, vary='#e0cda6', vary_scale=24)
M['timber'] = material('kammerzellTimber', '#4a2f1e', 0.7, vary='#3f2819', vary_scale=40)
M['roseGlass'] = material('roseGlass', '#3f5f8a', 0.25, vary='#5a3f7a', vary_scale=8)

S = 0.017               # metres to the tile's units
FY = -6.0               # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y + FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


slab('square', M['squareS'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], G - 0.003, Z0, margin=0.02)
BEFORE = set(bpy.data.objects)
WIN, DOORS = [], []
PIN = bmesh.new()
RODS = bmesh.new()


def pinnacle(x, y, z, h=5.0, r=0.5):
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * S, radius2=r * S, depth=h * 0.4 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.2)))
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * 1.15 * S, radius2=0.0, depth=h * 0.62 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.4 + h * 0.31 - 0.05)))


def rod(x0, y0, z0, x1, y1, z1, t=0.25):
    a, b = P(x0, y0, z0), P(x1, y1, z1)
    d = b - a
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(RODS, size=1.0, matrix=Matrix.Translation((a + b) / 2) @ rot @ Matrix.Diagonal((t * S, t * S, d.length, 1)))


# ------------------------------------------------------------------ the west front: its block, portals and gables, rose window, harp strings, platform
FX0, FX1, FRONT, BACK = -25.5, 25.5, -47.0, -30.0
PLAT = 66.0
block('westFront', M['vosges'], FX0, FX1, FRONT, BACK, -0.3, PLAT)
for z in (26.0, 47.0, PLAT - 0.6):
    block(f'frontBand{z:.0f}', M['vosgesLight'], FX0 - 0.3, FX1 + 0.3, FRONT - 0.3, BACK + 0.3, z, z + 0.8, bevel=0)
for k, (x, w, h, g) in enumerate(((0.0, 8.0, 16.0, 12.0), (-16.0, 6.0, 12.0, 9.0), (16.0, 6.0, 12.0, 9.0))):
    block(f'portal{k}', M['vosgesLight'], x - w / 2 - 1.5, x + w / 2 + 1.5, FRONT - 2.0, FRONT, -0.3, h)
    c = P(x, FRONT - 2.05, 0)
    DOORS.append((c.x, c.y, Z0 - 0.3 * S, w * S, h * 0.85 * S, (0, -1), 'pointed'))
    bm = bmesh.new()
    tri = [(x - w / 2 - 1.5, h - 0.2), (x + w / 2 + 1.5, h - 0.2), (x, h + g)]
    add_prism(bm, [bm.verts.new(P(u, FRONT - 2.0, v)) for u, v in tri], [bm.verts.new(P(u, FRONT - 1.2, v)) for u, v in tri])
    finish(f'portalGable{k}', bm, M['vosgesLight'], smooth_sides=False)
    pinnacle(x - w / 2 - 1.5, FRONT - 1.6, h, h=5.0, r=0.6)
    pinnacle(x + w / 2 + 1.5, FRONT - 1.6, h, h=5.0, r=0.6)
    pinnacle(x, FRONT - 1.6, h + g - 0.5, h=3.0, r=0.4)
# the great rose window: its glass, frame and tracery spokes
RZ, RR = 36.0, 6.8
lathe('roseGlass', M['roseGlass'], [(0.0, 0.0), (RR * S, 0.0), (RR * S, 0.3 * S), (0.0, 0.3 * S)], (0, 0, 0), segs=48,
      matrix=Matrix.Translation(P(0.0, FRONT - 0.1, RZ)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
annulus('roseFrame', M['vosgesLight'], (RR + 1.0) * S, RR * S, 0.0, 0.9 * S, segs=48, matrix=Matrix.Translation(P(0.0, FRONT - 0.2, RZ)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
annulus('roseHub', M['vosgesLight'], 1.4 * S, 0.8 * S, 0.0, 0.9 * S, segs=24, matrix=Matrix.Translation(P(0.0, FRONT - 0.2, RZ)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k in range(16):
    a = 2 * math.pi * k / 16
    rod(1.1 * math.cos(a), FRONT - 0.5, RZ + 1.1 * math.sin(a), RR * math.cos(a), FRONT - 0.5, RZ + RR * math.sin(a), t=0.3)
# the harp strings: slender rods standing proud of the front, clear of the rose
for k in range(55):
    x = FX0 + 0.6 + k * (FX1 - FX0 - 1.2) / 54
    for z0, z1 in ((17.0, 26.0), (27.0, 47.0), (48.0, PLAT - 0.8)):
        if abs(x) < RR + 1.4 and z1 > RZ - RR - 1.2 and z0 < RZ + RR + 1.2:
            if z0 < RZ - RR - 1.2:
                rod(x, FRONT - 0.9, z0, x, FRONT - 0.9, RZ - math.sqrt(max(0.0, (RR + 1.2) ** 2 - x * x)))
            if z1 > RZ + RR + 1.2:
                rod(x, FRONT - 0.9, RZ + math.sqrt(max(0.0, (RR + 1.2) ** 2 - x * x)), x, FRONT - 0.9, z1)
            continue
        rod(x, FRONT - 0.9, z0, x, FRONT - 0.9, z1)
    if k % 6 == 0:
        for z in (26.0, 47.0):
            rod(x - 0.1, FRONT - 0.9, z - 1.0, x + 0.1 + (FX1 - FX0 - 1.2) / 9, FRONT - 0.9, z - 1.0, t=0.3)
for x in (-17.0, 17.0):
    for u in (-2.2, 2.2):
        c = P(x + u, FRONT - 0.05, 0)
        WIN.append((c.x, c.y, Z0 + 28.5 * S, 2.6 * S, 16.0 * S, (0, -1), 'pointed'))
        WIN.append((c.x, c.y, Z0 + 49.5 * S, 2.4 * S, 13.0 * S, (0, -1), 'pointed'))
for x in [FX0 + 1.0 + 3.18 * k for k in range(17)]:
    pinnacle(x, FRONT + 0.4, PLAT + 0.2, h=2.4, r=0.35)
block('watchmansHouse', M['vosgesLight'], 11.0, 19.0, -44.0, -36.0, PLAT, PLAT + 5.0)
gable_roof('watchmansRoof', M['roofS'], 10.6 * S, 19.4 * S, (-44.4 + FY) * S, (-35.6 + FY) * S, Z0 + (PLAT + 4.95) * S, 3.0 * S, over=0.0)

# ------------------------------------------------------------------ the north tower: its octagon and stair turrets, the openwork spire
TX, TY = -17.0, -38.5
lathe('octagon', M['vosges'], [(7.2 * S, 0.0), (7.2 * S, 34.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(TX, TY, PLAT)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for k in range(8):
    a = 2 * math.pi * k / 8
    c = P(TX + 6.68 * math.cos(a), TY + 6.68 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + (PLAT + 4.0) * S, 2.0 * S, 24.0 * S, (math.cos(a), math.sin(a)), 'pointed'))
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    x, y = TX + 8.2 * math.cos(a), TY + 8.2 * math.sin(a)
    lathe(f'stairTurret{k}', M['vosgesLight'], [(1.9 * S, 0.0), (1.9 * S, 32.0 * S)], (0, 0, 0), segs=6, matrix=Matrix.Translation(P(x, y, PLAT)) @ Matrix.Rotation(a, 4, 'Z'))
    for j in range(6):
        b = a + math.pi / 6 + 2 * math.pi * j / 6         # the hexagon's faces, between its corners
        for z in (PLAT + 3.0, PLAT + 17.0):
            c = P(x + 1.7 * math.cos(b), y + 1.7 * math.sin(b), 0)
            WIN.append((c.x, c.y, Z0 + z * S, 0.9 * S, 11.0 * S, (math.cos(b), math.sin(b)), 'rect'))
    pinnacle(x, y, PLAT + 32.0, h=4.0, r=1.0)
OT = PLAT + 34.0
lathe('octagonTop', M['vosgesLight'], [(7.8 * S, 0.0), (7.8 * S, 1.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(TX, TY, OT)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('spireCore', M['vosges'], [(5.6 * S, 0.0), (0.6 * S, 38.0 * S), (0.0, 39.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(TX, TY, OT + 1.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for tier in range(8):
    r = 6.4 - 0.75 * tier
    z = OT + 1.0 + 4.4 * tier
    for k in range(8):
        a = math.pi / 8 + 2 * math.pi * k / 8
        x, y = TX + r * math.cos(a), TY + r * math.sin(a)
        lathe(f'spireTurret{tier}_{k}', M['vosgesLight'], [(0.55 * S, 0.0), (0.55 * S, 2.6 * S)], P(x, y, z), segs=6)
        pinnacle(x, y, z + 2.6, h=2.2, r=0.5)
        rod(x, y, z + 2.6, TX + (r - 0.75) * math.cos(a), TY + (r - 0.75) * math.sin(a), z + 4.4, t=0.35)
lathe('lantern', M['vosgesLight'], [(1.4 * S, 0.0), (1.4 * S, 3.0 * S), (0.0, 7.0 * S)], P(TX, TY, OT + 36.0), segs=8)
rod(TX, TY, OT + 42.0, TX, TY, OT + 46.0, t=0.3)
rod(TX - 1.0, TY, OT + 45.0, TX + 1.0, TY, OT + 45.0, t=0.3)

# ------------------------------------------------------------------ the nave, aisles, flying buttresses, transept and apse
block('nave', M['vosges'], -8.0, 8.0, BACK, 30.0, -0.3, 32.0)
gable_roof('naveRoof', M['roofS'], -8.6 * S, 8.6 * S, (BACK + FY) * S, (30.0 + FY) * S, Z0 + 31.95 * S, 13.0 * S, over=0.0, along='y')
for sx in (-1, 1):
    xa, xb = sorted((sx * 8.0, sx * 20.0))
    block(f'aisle{sx}', M['vosges'], xa, xb, BACK, 30.0, -0.3, 18.0)
    bm = bmesh.new()
    q = [(xa if sx > 0 else xb, BACK), (xb if sx > 0 else xa, BACK), (xb if sx > 0 else xa, 30.0), (xa if sx > 0 else xb, 30.0)]
    zs = [24.0, 18.0, 18.0, 24.0]
    add_prism(bm, [bm.verts.new(P(x, y, z)) for (x, y), z in zip(q, zs)], [bm.verts.new(P(x, y, z - 0.4)) for (x, y), z in zip(q, zs)])
    finish(f'aisleRoof{sx}', bm, M['roofS'], smooth_sides=False)
    for k in range(7):
        y = BACK + 4.0 + 8.0 * k
        pinnacle(sx * 20.5, y, 18.0, h=7.0, r=0.8)
        rod(sx * 20.5, y, 22.0, sx * 8.5, y, 29.0, t=0.7)
        c = P(sx * 20.05, y + 4.0, 0)
        WIN.append((c.x, c.y, Z0 + 4.0 * S, 3.0 * S, 11.0 * S, (sx, 0), 'pointed'))
        c = P(sx * 8.05, y + 4.0, 0)
        WIN.append((c.x, c.y, Z0 + 20.5 * S, 3.0 * S, 10.0 * S, (sx, 0), 'pointed'))
block('transept', M['vosges'], -25.0, 25.0, 30.0, 44.0, -0.3, 30.0)
gable_roof('transeptRoof', M['roofS'], -25.6 * S, 25.6 * S, (30.0 + FY) * S, (44.0 + FY) * S, Z0 + 29.95 * S, 12.0 * S, over=0.0)
for sx in (-1, 1):
    c = P(sx * 25.05, 37.0, 0)
    WIN.append((c.x, c.y, Z0 + 8.0 * S, 4.0 * S, 16.0 * S, (sx, 0), 'pointed'))
lathe('crossingTower', M['vosges'], [(4.6 * S, 0.0), (4.6 * S, 10.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 37.0, 38.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('crossingRoof', M['roofS'], [(5.0 * S, 0.0), (0.0, 8.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 37.0, 48.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
block('choir', M['vosges'], -9.0, 9.0, 44.0, 54.0, -0.3, 26.0)
lathe('apse', M['vosges'], [(9.0 * S, 0.0), (9.0 * S, 26.3 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 54.0, -0.3)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
gable_roof('choirRoof', M['roofS'], -9.5 * S, 9.5 * S, (44.0 + FY) * S, (54.0 + FY) * S, Z0 + 25.95 * S, 9.0 * S, over=0.0, along='y')
lathe('apseRoof', M['roofS'], [(9.6 * S, 0.0), (0.0, 9.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 54.0, 26.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))

# ------------------------------------------------------------------ Maison Kammerzell on the square: stone ground floor, carved timber frame, steep roof
KX0, KX1, KY0, KY1 = -46.0, -34.0, -62.0, -48.0
block('kammerzellBase', M['vosgesLight'], KX0, KX1, KY0, KY1, -0.3, 4.5)
for x in (KX0 + 2.2, KX0 + 6.0, KX1 - 2.2):
    c = P(x, KY0 - 0.05, 0)
    DOORS.append((c.x, c.y, Z0 + 0.2 * S, 2.6 * S, 3.6 * S, (0, -1), 'round'))
FL = (4.5, 7.6, 10.7, 13.8)
for k in range(len(FL) - 1):
    jet = 0.4 * (k + 1)
    block(f'kammerzellFloor{k}', M['plaster'], KX0 - jet, KX1 + jet, KY0 - jet, KY1, FL[k], FL[k + 1])
    for face, (ax, ay, bx, by, nx, ny) in enumerate(((KX0 - jet, KY0 - jet, KX1 + jet, KY0 - jet, 0, -1), (KX0 - jet, KY0 - jet, KX0 - jet, KY1, -1, 0))):
        L = math.hypot(bx - ax, by - ay)
        tx, ty = (bx - ax) / L, (by - ay) / L
        for j in range(int(L / 1.0) + 1):
            u = j * L / int(L / 1.0)
            x, y = ax + tx * u + nx * 0.06, ay + ty * u + ny * 0.06
            rod(x, y, FL[k], x, y, FL[k + 1], t=0.22)
            if j % 2 == 0 and j + 1 <= int(L / 1.0):
                x2, y2 = x + tx * L / int(L / 1.0), y + ty * L / int(L / 1.0)
                c = P((x + x2) / 2 + nx * 0.02, (y + y2) / 2 + ny * 0.02, 0)
                WIN.append((c.x, c.y, Z0 + (FL[k] + 1.0) * S, 0.7 * S, 1.4 * S, (nx, ny), 'rect'))
        for z in (FL[k] + 0.1, FL[k] + 0.9, FL[k + 1] - 0.1):
            rod(ax + nx * 0.06, ay + ny * 0.06, z, bx + nx * 0.06, by + ny * 0.06, z, t=0.24)
top = FL[-1]
jet = 1.2
gable_roof('kammerzellRoof', M['roofS'], (KX0 - jet - 0.3) * S, (KX1 + jet + 0.3) * S, (KY0 - jet - 0.3 + FY) * S, (KY1 + FY) * S, Z0 + (top - 0.05) * S, 13.0 * S, over=0.0)
for row, (z, n, ya, yb) in enumerate(((top + 1.2, 4, KY0 - 0.6, KY0 + 2.2), (top + 5.6, 3, KY0 + 1.8, KY0 + 4.4), (top + 8.4, 2, KY0 + 3.6, KY0 + 5.8))):
    for j in range(n):
        x = KX0 + (KX1 - KX0) * (j + 0.5) / n
        block(f'kDormer{row}{j}', M['plaster'], x - 0.9, x + 0.9, ya, yb, z, z + 2.0)
        gable_roof(f'kDormerRoof{row}{j}', M['roofS'], (x - 1.1) * S, (x + 1.1) * S, (ya - 0.2 + FY) * S, (yb + FY) * S, Z0 + (z + 1.95) * S, 1.0 * S, over=0.0, along='y')
        c = P(x, ya - 0.05, 0)
        WIN.append((c.x, c.y, Z0 + (z + 0.4) * S, 0.8 * S, 1.2 * S, (0, -1), 'rect'))
finish('pinnacles', PIN, M['vosgesLight'], smooth_sides=False)
finish('tracery', RODS, M['vosgesLight'], smooth_sides=False)
glazed('windows', WIN, M['vosgesLight'], depth=0.3 * S)
glazed('doors', DOORS, M['vosgesLight'], glass=M['door'], depth=0.3 * S)
for k, (x, y, shirt) in enumerate(((-6.0, -60.0, 'red'), (8.0, -66.0, 'blue'), (20.0, -58.0, 'yellow'), (-24.0, -66.0, 'green'), (-14.0, -54.0, 'red'), (30.0, -68.0, 'blue'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.6)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('strasbourg')
