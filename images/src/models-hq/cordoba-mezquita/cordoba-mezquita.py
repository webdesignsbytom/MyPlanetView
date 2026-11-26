# The Mosque-Cathedral of Córdoba in the high-quality look (hq.py), laid out in metres: the great
# prayer hall under its rows of tiled gable roofs, cut open along its front so you see the forest of
# marble columns and their double arches with voussoirs striped red brick and cream stone; the
# Renaissance cathedral rising in its middle with its crossing lantern; the golden walls round it all
# with their buttresses, horseshoe doorways and stepped merlons; the Courtyard of the Oranges with its
# rows of orange trees, palms and cypresses, its galleries; and the bell tower that was the minaret,
# with the gilded archangel on top (a scanned statue, CUNO jiannibang, CC BY 4.0, in
# _sources/st-michael/, standing in for St Raphael); and people.
# Run: blender -b --factory-startup -P cordoba-mezquita.py -- cordoba-mezquita-1024.png 1024 cordoba-mezquita.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(786)
M['goldWall'] = masonry('mezquitaWall', '#d8b47a', '#b08d58', scale=160, rough=0.85, vary='#cda86f')
M['cathedralStone'] = masonry('cathedralStone', '#e2d6bd', '#bfb196', scale=180, rough=0.8, vary='#d8cbb0')
M['roofM'] = banded(material('mezquitaRoof', '#b8603e', 0.7, vary='#a5553a', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['voussoirRed'] = material('voussoirRed', '#b2452f', 0.7, vary='#a23e2b', vary_scale=40)
M['voussoirCream'] = material('voussoirCream', '#efe3c6', 0.7, vary='#e5d8ba', vary_scale=40)
MARBLES = [material(f'columnMarble{k}', c, 0.35, vary=c, vary_scale=60) for k, c in enumerate(('#c9c1b4', '#8a7f74', '#b7a58d', '#6f6a66', '#a89a8c'))]
M['hallFloor'] = masonry('hallFloor', '#d9cdb5', '#bcae94', scale=300, rough=0.7, vary='#d0c3a9')
M['patio'] = masonry('patioCobbles', '#cdbd9c', '#a8977a', scale=260, rough=0.85, vary='#c3b291')
M['orangeLeaf'] = material('orangeLeaf', '#3f6e2e', 0.8, vary='#4a7d36', vary_scale=14, bump=0.3, bump_scale=90)
M['orangeFruit'] = material('orangeFruit', '#f08a24', 0.5)
M['cypress'] = material('mezquitaCypress', '#2d4d2c', 0.85, vary='#365a33', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.0142              # metres to the tile's units
Z0 = G + 0.004
X0, XC, X1 = -77.0, -33.0, 77.0     # north wall, courtyard to hall, south wall (a little shortened)
Y0, Y1 = -57.0, 57.0                 # east (front) and west walls
WALL = 11.0
NAVES = 19
NW = (Y1 - Y0) / NAVES
CUT = (-8.0, 70.0)                   # the stretch of the front opened up
CUT_NAVES = 6


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
WIN, DOORS = [], []
MERLON = [(-0.5, 0.0), (0.5, 0.0), (0.5, 0.6), (0.3, 0.6), (0.3, 1.0), (0.1, 1.0), (0.1, 1.35), (-0.1, 1.35), (-0.1, 1.0), (-0.3, 1.0), (-0.3, 0.6), (-0.5, 0.6)]
merlons = bmesh.new()


def merlon_row(ax, ay, bx, by, z, step=1.5):
    L = math.hypot(bx - ax, by - ay)
    tx, ty = (bx - ax) / L, (by - ay) / L
    for k in range(int(L / step)):
        t = (k + 0.5) / int(L / step)
        cx, cy = ax + (bx - ax) * t, ay + (by - ay) * t
        add_prism(merlons, [merlons.verts.new(P(cx + tx * u - ty * 0.3, cy + ty * u + tx * 0.3, z + v)) for u, v in MERLON],
                  [merlons.verts.new(P(cx + tx * u + ty * 0.3, cy + ty * u - tx * 0.3, z + v)) for u, v in MERLON])


def outer_wall(name, ax, ay, bx, by, h=WALL, doors=0):
    """A stretch of the golden outer wall, its buttresses, stepped merlons and horseshoe doorways."""
    L = math.hypot(bx - ax, by - ay)
    ang = math.atan2(by - ay, bx - ax)
    nx, ny = math.sin(ang), -math.cos(ang)
    box(name, M['goldWall'], P((ax + bx) / 2, (ay + by) / 2, (h - 0.3) / 2), (L * S, 1.6 * S, (h + 0.3) * S), rot_z=ang, bevel=0)
    merlon_row(ax, ay, bx, by, h)
    for k in range(int(L / 8.0) + 1):
        t = k / max(1, int(L / 8.0))
        cx, cy = ax + (bx - ax) * t + nx * 1.4, ay + (by - ay) * t + ny * 1.4
        box(f'{name}Buttress{k}', M['goldWall'], P(cx, cy, (h + 0.5) / 2 - 0.3), (1.8 * S, 1.4 * S, (h + 1.1) * S), rot_z=ang, bevel=0)
        merlon_row(cx - math.cos(ang) * 0.9, cy - math.sin(ang) * 0.9, cx + math.cos(ang) * 0.9, cy + math.sin(ang) * 0.9, h + 0.8, step=1.0)
    for j in range(doors):
        t = (j + 0.5) / doors
        cx, cy = ax + (bx - ax) * t + nx * 0.85, ay + (by - ay) * t + ny * 0.85
        c = P(cx + math.cos(ang) * 4.0, cy + math.sin(ang) * 4.0, 0)
        DOORS.append((c.x, c.y, Z0 + 0.0, 2.4 * S, 4.2 * S, (nx, ny), 'round'))
        WIN.append((c.x, c.y, Z0 + 5.6 * S, 1.0 * S, 1.6 * S, (nx, ny), 'round'))


# ------------------------------------------------------------------ the prayer hall: its floor, the opened front, the walls round it
block('hallFloorSlab', M['hallFloor'], XC, X1, Y0, Y1, -0.3, 0.05, bevel=0)
outer_wall('wallFrontA', XC, Y0, CUT[0], Y0, doors=3)
outer_wall('wallFrontB', CUT[1], Y0, X1, Y0, doors=1)
outer_wall('wallSouth', X1, Y0, X1, Y1)
outer_wall('wallWest', X1, Y1, XC, Y1, doors=4)

# the gable roofs over the naves, open over the front naves along the cut
for k in range(NAVES):
    y0, y1 = Y0 + k * NW, Y0 + (k + 1) * NW
    spans = ((XC, CUT[0]), (CUT[1], X1)) if k < CUT_NAVES else ((XC, X1),)
    for j, (xa, xb) in enumerate(spans):
        gable_roof(f'naveRoof{k}_{j}', M['roofM'], xa * S, xb * S, (y0 + 0.05) * S, (y1 - 0.05) * S, Z0 + (WALL - 0.05) * S, 2.6 * S, over=0.0)

# the forest of columns and their double arches, red and cream, under and through the opening
red, cream = bmesh.new(), bmesh.new()
piers = bmesh.new()


def ring(bm_list, cx, y, zc, r0, r1, a0, a1, n, depth):
    """An arch's voussoirs round (cx, zc) from angle a0 to a1 (radians), alternately red and cream."""
    for k in range(n):
        t0, t1 = a0 + (a1 - a0) * k / n, a0 + (a1 - a0) * (k + 1) / n
        pts = [(cx + r0 * math.cos(t0), zc + r0 * math.sin(t0)), (cx + r1 * math.cos(t0), zc + r1 * math.sin(t0)),
               (cx + r1 * math.cos(t1), zc + r1 * math.sin(t1)), (cx + r0 * math.cos(t1), zc + r0 * math.sin(t1))]
        bm_ = bm_list[k % 2]
        add_prism(bm_, [bm_.verts.new(P(u, y - depth / 2, v)) for u, v in pts], [bm_.verts.new(P(u, y + depth / 2, v)) for u, v in pts])


BAY = 3.0
for row in range(1, CUT_NAVES + 4):
    y = Y0 + row * NW
    xs = [CUT[0] + 1.5 + BAY * j for j in range(int((CUT[1] - CUT[0] - 3.0) / BAY) + 1)]
    for j, x in enumerate(xs):
        cylinder(f'column{row}_{j}', MARBLES[(row * 7 + j * 3) % len(MARBLES)], 0.24 * S, 3.0 * S, P(x, y, 0.0), segs=12)
        bmesh.ops.create_cube(piers, size=1.0, matrix=Matrix.Translation(P(x, y, 3.2)) @ Matrix.Diagonal((0.75 * S, 0.75 * S, 0.4 * S, 1)))
        bmesh.ops.create_cube(piers, size=1.0, matrix=Matrix.Translation(P(x, y, 6.1)) @ Matrix.Diagonal((0.8 * S, 0.6 * S, 5.4 * S, 1)))
    for j, (a, b) in enumerate(zip(xs, xs[1:])):
        cx = (a + b) / 2
        # the lower horseshoe arch, bracing the piers, and the upper round arch carrying the roof
        d = 0.9 if j % 2 else 0.96          # neighbouring arches overlap at the piers: never on the same face
        ring((red, cream), cx, y, 3.75, 1.1, 1.75, -0.25, math.pi + 0.25, 11, d)
        ring((red, cream), cx, y, 6.9, 1.1, 1.75, 0.0, math.pi, 9, d)
    if row > CUT_NAVES:     # under the roofs the arcades carry a wall up to the eaves; in the opening their arches show
        bmesh.ops.create_cube(piers, size=1.0, matrix=Matrix.Translation(P((xs[0] + xs[-1]) / 2, y, (8.65 + WALL) / 2)) @ Matrix.Diagonal(((xs[-1] - xs[0] + 0.8) * S, 0.6 * S, (WALL - 8.65) * S, 1)))
finish('arcadePiers', piers, M['voussoirCream'], smooth_sides=False)
finish('voussoirsRed', red, M['voussoirRed'], smooth_sides=False)
finish('voussoirsCream', cream, M['voussoirCream'], smooth_sides=False)

# ------------------------------------------------------------------ the cathedral rising in the middle, its crossing lantern
CX, CY = 30.0, 4.0
block('cathedralNave', M['cathedralStone'], CX - 7.0, CX + 7.0, CY - 25.0, CY + 25.0, -0.3, 30.0)
gable_roof('cathedralNaveRoof', M['roofM'], (CX - 7.6) * S, (CX + 7.6) * S, (CY - 25.6) * S, (CY + 25.6) * S, Z0 + 29.95 * S, 5.5 * S, over=0.0, along='y')
block('cathedralTransept', M['cathedralStone'], CX - 20.0, CX + 20.0, CY - 7.0, CY + 7.0, -0.3, 27.0)
gable_roof('cathedralTranseptRoof', M['roofM'], (CX - 20.6) * S, (CX + 20.6) * S, (CY - 7.6) * S, (CY + 7.6) * S, Z0 + 26.95 * S, 5.0 * S, over=0.0)
cylinder('crossingDrum', M['cathedralStone'], 6.0 * S, 7.0 * S, P(CX, CY, 33.0), segs=8)
lathe('crossingDome', M['roofM'], [(6.4 * S, 0.0), (5.6 * S, 2.6 * S), (3.6 * S, 4.6 * S), (1.2 * S, 5.6 * S), (0.0, 5.8 * S)], P(CX, CY, 40.0), segs=24, smooth=True)
cylinder('lanternDrum', M['cathedralStone'], 1.3 * S, 2.6 * S, P(CX, CY, 45.6), segs=8)
lathe('lanternTop', M['cathedralStone'], [(1.5 * S, 0.0), (0.0, 3.0 * S)], P(CX, CY, 48.2), segs=8)
for k in range(8):
    a = math.pi / 8 + 2 * math.pi * k / 8
    c = P(CX + 6.0 * math.cos(a), CY + 6.0 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + 34.4 * S, 1.6 * S, 3.8 * S, (math.cos(a), math.sin(a)), 'round'))
for dx in (-13.0, 13.0):
    c = P(CX + dx, CY - 7.05, 0)
    WIN.append((c.x, c.y, Z0 + 15.0 * S, 3.0 * S, 8.0 * S, (0, -1), 'pointed'))
for dy in (-19.0, -12.0):
    c = P(CX - 7.05, CY + dy, 0)
    WIN.append((c.x, c.y, Z0 + 17.0 * S, 2.6 * S, 7.0 * S, (-1, 0), 'pointed'))
for k, dx in enumerate((-19.4, 19.4)):
    for dy in (-6.4, 6.4):
        block(f'cathedralPinnacle{k}{dy:+.0f}', M['cathedralStone'], CX + dx - 0.6, CX + dx + 0.6, CY + dy - 0.6, CY + dy + 0.6, 26.5, 31.5)

# ------------------------------------------------------------------ the Courtyard of the Oranges, its galleries, trees and the bell tower
block('patioFloor', M['patio'], X0, XC, Y0, Y1, -0.3, 0.05, bevel=0)
outer_wall('patioFront', X0, Y0, XC, Y0, doors=1)
outer_wall('patioNorth', X0, Y1, X0, Y0, doors=1)
outer_wall('patioWest', XC, Y1, X0, Y1, doors=1)
block('hallFacade', M['goldWall'], XC - 0.8, XC + 0.8, Y0, Y1, -0.3, WALL)
merlon_row(XC, Y0, XC, Y1, WALL)
for j in range(14):
    y = Y0 + (j + 0.5) * (Y1 - Y0) / 14
    c = P(XC - 0.85, y, 0)
    DOORS.append((c.x, c.y, Z0 + 0.0, 3.0 * S, 5.0 * S, (-1, 0), 'round'))
# galleries along the courtyard's front and back
for side, yw in ((-1, Y0), (1, Y1)):
    yi = yw - side * 6.0
    arcade_path(f'gallery{side}', M['goldWall'], [((X0 + 2.0 + 4.6 * k) * S, yi * S) for k in range(int((XC - X0 - 4.0) / 4.6) + 1)], (6.0 - 1.2) * S,
                Z0 + 3.4 * S, 3.0 * S, 1.7 * S, normal_side=side)
    ya, yb = sorted((yi, yw - side * 0.8))
    gable_roof(f'galleryRoof{side}', M['roofM'], (X0 + 1.0) * S, (XC - 1.0) * S, ya * S, yb * S, Z0 + 6.35 * S, 2.0 * S, over=0.004)
    for k in range(int((XC - X0 - 4.0) / 4.6) + 1):
        cylinder(f'galleryColumn{side}{k}', M['goldWall'], 0.4 * S, 3.6 * S, P(X0 + 2.0 + 4.6 * k, yi, -0.2), segs=10)
TREES, FRUIT, TALL = [], [], []
for i, x in enumerate([X0 + 9.0 + 6.0 * i for i in range(6)]):
    for j, y in enumerate([Y0 + 12.0 + 6.5 * j for j in range(15)]):
        if abs(y) < 5.0 or (i + j) % 7 == 3:
            continue
        cylinder(f'orangeTrunk{i}_{j}', M['trunk'], 0.18 * S, 1.6 * S, P(x, y, 0.0), segs=6)
        TREES.append((P(x, y, 2.9).to_tuple(), 1.9 * S, 0.95))
        for k in range(5):
            a = rng.uniform(0, 2 * math.pi)
            e = rng.uniform(-0.4, 0.9)
            FRUIT.append((P(x + 1.8 * math.cos(a) * math.cos(e), y + 1.8 * math.sin(a) * math.cos(e), 2.9 + 1.7 * math.sin(e)).to_tuple(), 0.25 * S, 1.0))
blob_cloud('orangeTrees', M['orangeLeaf'], TREES)
blob_cloud('oranges', M['orangeFruit'], FRUIT, subdivisions=1)
for k, (x, y) in enumerate(((X0 + 12.0, -2.0), (X0 + 30.0, 2.0), (XC - 6.0, -2.5), (XC - 18.0, 2.5))):
    lathe(f'cypress{k}', M['cypress'], [(0.0, 0.0), (1.1 * S, 1.5 * S), (1.2 * S, 5.0 * S), (0.6 * S, 9.0 * S), (0.0, 11.0 * S)], P(x, y, 0.0), segs=12, smooth=True)
# the bell tower in the courtyard's north wall
BX, BY = X0 + 1.0, 8.0
block('towerBase', M['goldWall'], BX - 6.0, BX + 6.0, BY - 6.0, BY + 6.0, -0.3, 32.0)
for z in (12.0, 22.0, 31.4):
    block(f'towerBand{z:.0f}', M['cathedralStone'], BX - 6.2, BX + 6.2, BY - 6.2, BY + 6.2, z, z + 0.6, bevel=0)
block('belfry', M['cathedralStone'], BX - 5.0, BX + 5.0, BY - 5.0, BY + 5.0, 32.0, 41.0)
block('belfryTop', M['cathedralStone'], BX - 5.4, BX + 5.4, BY - 5.4, BY + 5.4, 40.6, 41.4, bevel=0)
block('clockStage', M['cathedralStone'], BX - 3.6, BX + 3.6, BY - 3.6, BY + 3.6, 41.4, 47.0)
lathe('towerDome', M['cathedralStone'], [(3.0 * S, 0.0), (2.6 * S, 1.6 * S), (1.4 * S, 3.0 * S), (0.6 * S, 3.6 * S), (0.0, 3.8 * S)], P(BX, BY, 47.0), segs=16, smooth=True)
for nx, ny in ((0, -1), (1, 0), (0, 1)):
    for u in (-2.0, 2.0):
        c = P(BX + nx * 5.05 + (u if ny else 0.0), BY + ny * 5.05 + (u if nx else 0.0), 0)
        WIN.append((c.x, c.y, Z0 + 33.4 * S, 2.2 * S, 5.4 * S, (nx, ny), 'round'))
    c = P(BX + nx * 3.65, BY + ny * 3.65, 0)
    WIN.append((c.x, c.y, Z0 + 42.6 * S, 1.8 * S, 3.0 * S, (nx, ny), 'round'))
    for z in (14.0, 24.0):
        c = P(BX + nx * 6.05, BY + ny * 6.05, 0)
        WIN.append((c.x, c.y, Z0 + z * S, 1.6 * S, 3.6 * S, (nx, ny), 'round'))
src = import_model('st-michael', 'archangelSource')
stand_sourced(src, cut=0.33, turn=0.0, height=4.0 * S, z=0.0, mat=M['gold'], report=False)
src.matrix_world = Matrix.Translation(P(BX, BY, 50.7))
finish('merlons', merlons, M['goldWall'], smooth_sides=False)
glazed('windows', WIN, M['cathedralStone'], depth=0.3 * S)
glazed('doors', DOORS, M['voussoirCream'], glass=M['door'], depth=0.3 * S)
for k, (x, y, shirt) in enumerate(((10.0, -48.0, 'red'), (30.0, -53.0, 'blue'), (50.0, -44.0, 'yellow'), (24.0, -38.0, 'green'), (-60.0, -6.0, 'red'), (-44.0, 4.0, 'blue'), (-66.0, 3.0, 'yellow'))):
    c = P(x, y, 0.05)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.55)

R = Matrix.Rotation(math.radians(-32.0 + 20.0), 4, 'Z')     # turned so the rows of arches recede
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('cordoba-mezquita')
