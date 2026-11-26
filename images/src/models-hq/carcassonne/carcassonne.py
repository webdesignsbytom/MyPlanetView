# The Cité of Carcassonne in the high-quality look (hq.py), laid out in metres on its hill: the double
# ring of walls, the high inner one and the lower outer one, crenellated, their round towers under steep
# slate cones (a few in the south under low red tiles, as Viollet-le-Duc left them), the grassy lices
# between; the Porte Narbonnaise's twin towers at the east, the Château Comtal on the west side with its
# own towers, its curtain wall and its barbican, the Basilica of Saint-Nazaire in the south with its
# tall windows and crenellated tower; the town's red roofs in their streets inside; the vineyards on the
# slopes below, and people.
# Run: blender -b --factory-startup -P carcassonne.py -- carcassonne-1024.png 1024 carcassonne.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *
from mathutils.bvhtree import BVHTree

setup()
rng = random.Random(1209)
M['citeStone'] = material('citeStone', '#c9b99a', 0.85, vary='#b9a98b', vary_scale=18, bump=0.3, bump_scale=150)
M['citeStoneDark'] = material('citeStoneDark', '#ad9e82', 0.9, vary='#9f9075', vary_scale=18, bump=0.3, bump_scale=150)
M['slateCone'] = banded(material('slateCone', '#4d5762', 0.5, vary='#444d58', vary_scale=14, metallic=0.2), 'Z', 400.0, strength=0.2)
M['tilesRed'] = banded(material('citeTiles', '#b5603f', 0.7, vary='#a35537', vary_scale=12, bump=0.12, bump_scale=200), 'Z', 300.0, strength=0.25)
M['houseWall'] = material('citeHouses', '#d8c7a6', 0.85, vary='#cdb998', vary_scale=18)
M['lices'] = material('lices', '#86a04f', 0.9, vary='#78924a', vary_scale=14, bump=0.2, bump_scale=200)
M['streets'] = material('citeStreets', '#b7a88c', 0.95, vary='#a99a7f', vary_scale=20, bump=0.2, bump_scale=200)
M['vineSoil'] = material('audeSoil', '#a38d62', 0.95, vary='#957f56', vary_scale=20)
M['vines'] = material('vinesC', '#5d7c36', 0.85, vary='#4f6b2e', vary_scale=30)
M['plain'] = material('audePlain', '#93a457', 0.9, vary='#86984f', vary_scale=14, bump=0.2, bump_scale=200)

S = 0.0064              # metres to the tile's units (the Cité's length shortened by a quarter)
PLATEAU = 0.17          # the hilltop above the turf
ZP = G + PLATEAU
IN_A, IN_B = 165.0, 92.0            # the inner wall's oval (metres)
OUT_A, OUT_B = 191.0, 116.0         # the outer wall's


def P(x, y, z):
    return Vector((x * S, y * S, ZP + z * S))


def oval(a, b, n, phase=0.0):
    return [(a * math.cos(phase + 2 * math.pi * k / n), b * math.sin(phase + 2 * math.pi * k / n)) for k in range(n)]


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def oval_d(x, y, a, b):
    """Roughly how far (metres) a point lies outside an oval (negative inside)."""
    r = math.hypot(x / a, y / b)
    return (r - 1.0) * min(a, b)


# ------------------------------------------------------------------ the hill: the hilltop inside the outer wall, the vineyard slopes, the plain
def H(x, y):
    d = oval_d(x / S, y / S, OUT_A + 8.0, OUT_B + 8.0) * S
    rim = smooth((1.47 - math.hypot(x, y)) / 0.16)
    return (PLATEAU if d <= 0 else PLATEAU * (1.0 - smooth(d / 0.22))) * rim


def pick(z, nz, x, y):
    if z > PLATEAU * 0.985:
        return 0 if oval_d(x / S, y / S, IN_A, IN_B) < 0 else 1
    return 2 if z > 0.006 else 3


ground = terrain('hill', H, [M['streets'], M['lices'], M['vineSoil'], M['plain']], pick, rings=220, segs=560)
bm = bmesh.new()
bm.from_mesh(ground.data)
bm.faces.ensure_lookup_table()
hits = BVHTree.FromBMesh(bm)
VINES = bmesh.new()
for k in range(26):
    ang = 2 * math.pi * k / 26
    for j in range(16):
        d = 0.03 + 0.018 * j
        a_, b_ = (OUT_A + 8.0) * S + d, (OUT_B + 8.0) * S + d
        for t in range(-3, 4):
            th = ang + t * 0.012
            x, y = a_ * math.cos(th), b_ * math.sin(th)
            if math.hypot(x, y) > 1.38:
                continue
            hit = hits.ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)), 5.0)
            if hit[0] is None or bm.faces[hit[2]].material_index != 2:
                continue
            bmesh.ops.create_cube(VINES, size=1.0, matrix=Matrix.Translation(hit[0] + Vector((0, 0, 0.004))) @ Matrix.Rotation(th + math.pi / 2, 4, 'Z') @ Matrix.Diagonal((0.012, 0.006, 0.009, 1)))
finish('vineyards', VINES, M['vines'], smooth_sides=False)
bm.free()

# ------------------------------------------------------------------ the walls and their towers
WALLS, MERLONS = bmesh.new(), bmesh.new()


def battlements(x0, y0, x1, y1, z, t=0.9):
    L = math.hypot(x1 - x0, y1 - y0)
    ang = math.atan2(y1 - y0, x1 - x0)
    for k in range(max(1, int(L / 2.6))):
        u = (k + 0.5) / max(1, int(L / 2.6))
        c = P(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z + 0.75)
        bmesh.ops.create_cube(MERLONS, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((1.3 * S, t * S, 1.5 * S, 1)))


def curtain(pts, h, t):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1]):
        L = math.hypot(x1 - x0, y1 - y0)
        ang = math.atan2(y1 - y0, x1 - x0)
        c = P((x0 + x1) / 2, (y0 + y1) / 2, (h - 6.0) / 2)
        bmesh.ops.create_cube(WALLS, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((L * S, t * S, (h + 6.0) * S, 1)))
        battlements(x0, y0, x1, y1, h)


def tower(name, x, y, r, h, roof='slate', cone=None):
    """A round tower r metres across its radius, h tall, under a steep slate cone or low red tiles."""
    c = P(x, y, -6.0)
    cylinder(name, M['citeStone'], r * S, (h + 6.0) * S, (c.x, c.y, c.z), segs=24)
    if roof == 'slate':
        lathe(name + 'Cone', M['slateCone'], [((r + 0.5) * S, 0.0), ((r + 0.4) * S, 0.6 * S), (0.0, (cone or r * 3.3) * S)], P(x, y, h - 0.1), segs=24)
        cylinder(name + 'Finial', M['iron'], 0.12 * S, 1.6 * S, P(x, y, h + (cone or r * 3.3) - 0.3), segs=6)
    else:
        lathe(name + 'Roof', M['tilesRed'], [((r + 0.6) * S, 0.0), (0.0, r * 0.55 * S)], P(x, y, h - 0.1), segs=24)


inner = oval(IN_A, IN_B, 22, phase=0.06)
outer = oval(OUT_A, OUT_B, 16, phase=0.12)
curtain(inner, 14.0, 3.0)
curtain(outer, 9.0, 2.4)
for k, (x, y) in enumerate(inner):
    south_low = y < -45.0 and -90.0 < x < 100.0 and k % 3 == 0
    tower(f'innerTower{k}', x, y, rng.uniform(4.6, 6.0), rng.uniform(22.0, 27.0), roof='tiles' if south_low else 'slate')
for k, (x, y) in enumerate(outer):
    tower(f'outerTower{k}', x, y, rng.uniform(3.6, 4.6), rng.uniform(14.0, 17.0), roof='tiles' if k % 4 == 1 else 'slate')
# the Porte Narbonnaise: two great towers either side of the gate, at the east
for sy in (-1, 1):
    tower(f'narbonnaise{sy}', IN_A + 4.0, sy * 9.0, 7.5, 30.0, cone=22.0)
box('narbonnaiseGate', M['citeStoneDark'], P(IN_A + 4.0, 0.0, 7.0), (10.0 * S, 12.0 * S, 26.0 * S), bevel=0.0005)
finish('walls', WALLS, M['citeStone'], smooth_sides=False)

# ------------------------------------------------------------------ the Château Comtal on the west side: its curtain, towers, halls and barbican
CX0, CX1, CY0, CY1 = -158.0, -112.0, -27.0, 27.0
for x0, y0, x1, y1 in ((CX0, CY0, CX1, CY0), (CX1, CY0, CX1, CY1), (CX1, CY1, CX0, CY1)):
    L = math.hypot(x1 - x0, y1 - y0)
    ang = math.atan2(y1 - y0, x1 - x0)
    box(f'chateauWall{x0}{y0}', M['citeStone'], P((x0 + x1) / 2, (y0 + y1) / 2, 8.0), ((L + 2.0) * S, 3.0 * S, 18.0 * S), rot_z=ang, bevel=0.0004)
    battlements(x0, y0, x1, y1, 17.0)
for k, (x, y) in enumerate(((CX1, CY0), (CX1, CY1), (CX1, -9.0), (CX1, 9.0), ((CX0 + CX1) / 2, CY0), ((CX0 + CX1) / 2, CY1))):
    tower(f'chateauTower{k}', x, y, 5.0, 29.0, cone=17.0)
for k, (x0, x1, y0, y1, h) in enumerate(((-154.0, -126.0, -22.0, -10.0, 16.0), (-154.0, -142.0, -10.0, 22.0, 16.0), (-142.0, -122.0, 12.0, 22.0, 14.0))):
    box(f'chateauHall{k}', M['citeStoneDark'], P((x0 + x1) / 2, (y0 + y1) / 2, (h - 1.0) / 2), ((x1 - x0) * S, (y1 - y0) * S, (h + 1.0) * S), bevel=0.0004)
    gable_roof(f'chateauHallRoof{k}', M['tilesRed'], x0 * S, x1 * S, y0 * S, y1 * S, ZP + (h - 0.05) * S, 4.0 * S, over=0.001, along='x' if (x1 - x0) > (y1 - y0) else 'y')
lathe('barbican', M['citeStone'], [(12.0 * S, 0.0), (12.0 * S, 10.0 * S)], P(-90.0, 0.0, -0.5), segs=40)
annulus('barbicanTop', M['citeStoneDark'], 12.3 * S, 9.6 * S, ZP + 9.4 * S, ZP + 10.6 * S, segs=40, center=(-90.0 * S, 0.0))
box('chateauBridge', M['citeStoneDark'], P(-106.0, 0.0, 3.0), (16.0 * S, 5.0 * S, 7.0 * S), bevel=0.0004)

# ------------------------------------------------------------------ the Basilica of Saint-Nazaire in the south
BX, BY = 50.0, -48.0
box('basilicaNave', M['citeStoneDark'], P(BX - 8.0, BY, 8.0), (34.0 * S, 14.0 * S, 18.0 * S), bevel=0.0004)
gable_roof('basilicaNaveRoof', M['slateCone'], (BX - 25.0) * S, (BX + 9.0) * S, (BY - 7.0) * S, (BY + 7.0) * S, ZP + 16.9 * S, 7.0 * S, over=0.001)
box('basilicaChoir', M['citeStoneDark'], P(BX + 18.0, BY, 11.0), (18.0 * S, 26.0 * S, 24.0 * S), bevel=0.0004)
gable_roof('basilicaChoirRoof', M['slateCone'], (BX + 9.0) * S, (BX + 27.0) * S, (BY - 13.0) * S, (BY + 13.0) * S, ZP + 22.9 * S, 8.0 * S, over=0.001, along='y')
box('basilicaTower', M['citeStone'], P(BX - 28.0, BY, 12.0), (9.0 * S, 9.0 * S, 26.0 * S), bevel=0.0004)
battlements(BX - 32.5, BY - 4.5, BX - 23.5, BY - 4.5, 24.9, t=0.7)
battlements(BX - 32.5, BY + 4.5, BX - 23.5, BY + 4.5, 24.9, t=0.7)
BWIN = []
for x in (BX - 20.0, BX - 13.0, BX - 6.0, BX + 1.0):
    c = P(x, BY - 7.05, 0)
    BWIN.append((c.x, c.y, ZP + 5.0 * S, 2.2 * S, 8.0 * S, (0, -1), 'pointed'))
for x in (BX + 13.0, BX + 18.0, BX + 23.0):
    c = P(x, BY - 13.05, 0)
    BWIN.append((c.x, c.y, ZP + 6.0 * S, 3.0 * S, 13.0 * S, (0, -1), 'pointed'))
glazed('basilicaWindows', BWIN, M['citeStone'], depth=0.3 * S)

# ------------------------------------------------------------------ the town's houses in their streets inside the inner wall
HOUSES, ROOFS = bmesh.new(), bmesh.new()
for gx in range(-22, 23):
    for gy in range(-10, 11):
        x, y = gx * 7.6 + rng.uniform(-0.8, 0.8), gy * 9.0 + rng.uniform(-0.8, 0.8)
        if oval_d(x, y, IN_A - 12.0, IN_B - 12.0) > 0 or x < -76.0 or (abs(x - BX) < 42.0 and abs(y - BY) < 22.0) or gy % 3 == 0 or gx % 5 == 0:
            continue
        w, d, h = rng.uniform(5.6, 6.6), rng.uniform(6.5, 7.6), rng.uniform(7.0, 11.0)
        c = P(x, y, (h - 1.0) / 2)
        bmesh.ops.create_cube(HOUSES, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((w * S, d * S, (h + 1.0) * S, 1)))
        z0 = ZP + h * S
        a, b = Vector(((x - w / 2 - 0.3) * S, (y - d / 2 - 0.3) * S, z0)), Vector(((x + w / 2 + 0.3) * S, (y + d / 2 + 0.3) * S, z0))
        ridge = z0 + 2.4 * S
        v = [ROOFS.verts.new(p) for p in ((a.x, a.y, z0), (b.x, a.y, z0), (b.x, b.y, z0), (a.x, b.y, z0), (a.x, (a.y + b.y) / 2, ridge), (b.x, (a.y + b.y) / 2, ridge))]
        for f in ((v[0], v[1], v[5], v[4]), (v[2], v[3], v[4], v[5]), (v[0], v[4], v[3]), (v[1], v[2], v[5]), (v[0], v[3], v[2], v[1])):
            ROOFS.faces.new(f)
finish('houses', HOUSES, M['houseWall'], smooth_sides=False)
finish('houseRoofs', ROOFS, M['tilesRed'], smooth_sides=False)
finish('battlements', MERLONS, M['citeStone'], smooth_sides=False)

for k, (x, y, shirt) in enumerate(((176.0, -20.0, 'red'), (180.0, 12.0, 'blue'), (0.0, -104.0, 'yellow'), (-60.0, 102.0, 'green'), (90.0, 96.0, 'red'), (-80.0, -98.0, 'blue'))):
    person(f'p{k}', x * S, y * S, rng.random() * 6, shirt, z=ZP, scale=0.7)

render('carcassonne')
