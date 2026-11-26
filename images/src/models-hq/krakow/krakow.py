# Kraków's Main Market Square in the high-quality look (hq.py), laid out in metres: the Cloth Hall in
# the middle, its arcaded loggias along both sides, its carved attic with the pinnacles and the
# mascarons' heads, its Renaissance gables at the ends and the passage through its middle; St Mary's
# Basilica behind in red brick, its high roof and its two unequal towers, the taller with its spired
# helmet ringed by eight turrets and its gilded crown, the shorter with its Renaissance cupolas, the
# great window between them; the Town Hall Tower with its baroque helmet; the square's paving, the
# flower stalls under their white umbrellas, and people.
# Run: blender -b --factory-startup -P krakow.py -- krakow-1024.png 1024 krakow.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1257)
M['rynek'] = masonry('rynekPaving', '#cfc6b6', '#aea595', scale=200, rough=0.8, vary='#c5bcab')
M['clothWall'] = material('clothHallWall', '#efe3c4', 0.75, vary='#e6d8b6', vary_scale=24, bump=0.06, bump_scale=200)
M['clothStone'] = masonry('clothStone', '#d8c8a3', '#b3a27f', scale=200, rough=0.8, vary='#cfbf98')
M['brickK'] = masonry('krakowBrick', '#a84a32', '#c99a7e', scale=380, rough=0.85, vary='#9a4430')
M['roofK'] = banded(material('krakowRoof', '#b65a3a', 0.7, vary='#a5503a', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['slateK'] = banded(material('stMarysRoof', '#4b4f52', 0.55, vary='#43474a', vary_scale=14, metallic=0.2), 'Z', 380.0, strength=0.2)
M['helmet'] = material('helmetCopper', '#3f5f55', 0.5, vary='#476a5e', vary_scale=24, metallic=0.4)
M['flowers'] = mosaic('flowerStall', ((2, '#d8433b'), (2, '#f0c23a'), (1.5, '#e98fb4'), (1, '#9b59b6'), (1.2, '#f4f2ec'), (2, '#4f8a3a')), scale=240.0, mortar='#4f8a3a')

S = 0.017               # metres to the tile's units
FX, FY = -7.0, -22.0    # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector(((x + FX) * S, (y + FY) * S, Z0 + z * S))


def T(x, y):
    return ((x + FX) * S, (y + FY) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


slab('square', M['rynek'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], G - 0.003, Z0, margin=0.02)
BEFORE = set(bpy.data.objects)
WIN, DOORS = [], []
PIN = bmesh.new()


def pinnacle(x, y, z, h=3.0, r=0.4):
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * S, radius2=r * S, depth=h * 0.4 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.2)))
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * 1.2 * S, radius2=0.0, depth=h * 0.62 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.4 + h * 0.31 - 0.05)))


# ------------------------------------------------------------------ the Cloth Hall: its body, loggias, attic with pinnacles and mascarons, gables, passage
CL0, CL1, CW = -54.0, 54.0, 9.0
block('clothHall', M['clothWall'], CL0, CL1, -CW, CW, -0.3, 14.0)
gable_roof('clothRoof', M['roofK'], CL0 * S + FX * S, CL1 * S + FX * S, (-CW + FY) * S, (CW + FY) * S, Z0 + 13.95 * S, 8.0 * S, over=0.002)
MASK = []
for side in (-1, 1):
    yw = side * CW
    yl = side * (CW + 3.2)
    # the loggia: pointed arches on stone piers, under a lean-to roof
    pts = [((CL0 + 2.0 + 4.0 * k + FX) * S, (yl + FY) * S) for k in range(int((CL1 - CL0 - 4.0) / 4.0) + 1)]
    arcade_path(f'loggia{side}', M['clothStone'], pts, 3.0 * S, Z0 + 3.6 * S, 3.0 * S, 1.5 * S, pointed=1.0, normal_side=-side)
    for k in range(len(pts)):
        x = CL0 + 2.0 + 4.0 * k
        block(f'loggiaPier{side}{k}', M['clothStone'], x - 0.5, x + 0.5, *sorted((yl, yl - side * 0.8)), -0.3, 3.7)
    bm = bmesh.new()
    prof = [(yl + side * 0.4, 6.5), (yw, 8.6)]
    for (ya, za), (yb, zb) in zip(prof, prof[1:]):
        q = [(CL0 + 1.0, ya, za), (CL1 - 1.0, ya, za), (CL1 - 1.0, yb, zb), (CL0 + 1.0, yb, zb)]
        add_prism(bm, [bm.verts.new(P(x, y, z)) for x, y, z in q], [bm.verts.new(P(x, y, z - 0.3)) for x, y, z in q])
    finish(f'loggiaRoof{side}', bm, M['roofK'], smooth_sides=False)
    # the attic: a parapet of blind arches with pinnacles and mascarons along the top
    arcade_path(f'attic{side}', M['clothWall'], [((CL0 + 3.0 * k + FX) * S, (yw + FY) * S) for k in range(int((CL1 - CL0) / 3.0) + 1)],
                0.6 * S, Z0 + 14.0 * S, 4.2 * S, 1.1 * S, pointed=1.2, normal_side=-side)
    block(f'atticBack{side}', M['clothWall'], CL0, CL1, *sorted((yw - side * 0.6, yw - side * 1.1)), 14.0, 17.2)
    for k in range(int((CL1 - CL0) / 6.0) + 1):
        x = CL0 + 6.0 * k
        pinnacle(x, yw, 18.2, h=3.6, r=0.45)
        MASK.append((P(x + 3.0, yw + side * 0.1, 16.6).to_tuple(), 0.55 * S, 1.0))
    for k in range(int((CL1 - CL0 - 8.0) / 4.0)):
        x = CL0 + 6.0 + 4.0 * k
        c = P(x, yw + side * 0.05, 0)
        WIN.append((c.x, c.y, Z0 + 9.4 * S, 1.6 * S, 2.8 * S, (0, side), 'rect'))
    # the passage through the middle, its tall portal
    block(f'portal{side}', M['clothStone'], -5.0, 5.0, *sorted((yw, yw + side * 3.6)), -0.3, 12.0)
    c = P(0.0, yw + side * 3.65, 0)
    DOORS.append((c.x, c.y, Z0 - 0.3 * S, 5.0 * S, 7.6 * S, (0, side), 'pointed'))
    pinnacle(-5.0, yw + side * 3.0, 12.0, h=4.0, r=0.5)
    pinnacle(5.0, yw + side * 3.0, 12.0, h=4.0, r=0.5)
blob_cloud('mascarons', M['clothStone'], MASK, subdivisions=1)
# the Renaissance gables at the ends, with their stair towers
for side, x in ((-1, CL0), (1, CL1)):
    steps = [(-CW, 0.0), (-CW, 1.0), (-5.5, 3.0), (-5.0, 5.5), (-2.5, 7.5), (-2.0, 9.5), (0.0, 10.5)]
    outline = steps + [(-u, v) for u, v in reversed(steps) if u < 0]
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x + side * 0.3, u, 14.0 + v)) for u, v in outline], [bm.verts.new(P(x - side * 1.2, u, 14.0 + v)) for u, v in outline])
    finish(f'endGable{side}', bm, M['clothWall'], smooth_sides=False)
    tube(f'endGableCoping{side}', M['clothStone'], [P(x + side * 0.4, u, 14.0 + v) for u, v in outline[1:-1]], 0.22 * S)
    for u in (-3.0, 3.0):
        c = P(x + side * 0.35, u, 0)
        WIN.append((c.x, c.y, Z0 + 16.0 * S, 1.2 * S, 2.6 * S, (side, 0), 'round'))
    block(f'stairTower{side}', M['clothStone'], *sorted((x, x + side * 4.0)), -3.0, 3.0, -0.3, 11.0)
    c = P(x + side * 4.05, 0.0, 0)
    DOORS.append((c.x, c.y, Z0 - 0.3 * S, 2.4 * S, 4.4 * S, (side, 0), 'round'))

# ------------------------------------------------------------------ St Mary's Basilica: its body, roof, great window and two unequal towers
NX0, NX1, NY0, NY1 = 42.0, 64.0, 34.0, 72.0
block('nave', M['brickK'], NX0, NX1, NY0, NY1, -0.3, 28.0)
gable_roof('naveRoof', M['slateK'], (NX0 + FX) * S, (NX1 + FX) * S, (NY0 + FY) * S, (NY1 + FY) * S, Z0 + 27.95 * S, 20.0 * S, over=0.004, along='y')
for sx, (xa, xb) in ((-1, (34.0, 42.0)), (1, (64.0, 72.0))):
    block(f'aisle{sx}', M['brickK'], xa, xb, NY0 + 6.0, NY1, -0.3, 17.0)
    gable_roof(f'aisleRoof{sx}', M['slateK'], (xa + FX) * S, (xb + FX) * S, (NY0 + 6.0 + FY) * S, (NY1 + FY) * S, Z0 + 16.95 * S, 4.0 * S, over=0.004, along='y')
    for k in range(4):
        y = NY0 + 10.0 + 7.0 * k
        c = P(xa if sx < 0 else xb, y, 0)
        WIN.append((c.x + sx * 0.05 * S, c.y, Z0 + 4.0 * S, 2.2 * S, 10.0 * S, (sx, 0), 'pointed'))
        c = P(NX0 if sx < 0 else NX1, y, 0)
        WIN.append((c.x + sx * 0.05 * S, c.y, Z0 + 19.0 * S, 2.0 * S, 7.0 * S, (sx, 0), 'pointed'))
c = P((NX0 + NX1) / 2, NY0 - 0.05, 0)
WIN.append((c.x, c.y, Z0 + 10.0 * S, 6.0 * S, 15.0 * S, (0, -1), 'pointed'))
block('porch', M['clothStone'], 49.0, 57.0, NY0 - 3.0, NY0, -0.3, 6.5)
c = P(53.0, NY0 - 3.05, 0)
DOORS.append((c.x, c.y, Z0 - 0.3 * S, 3.2 * S, 5.0 * S, (0, -1), 'round'))
# the taller tower: brick shaft, octagonal top stage, the spired helmet ringed by turrets, the gilded crown
TX, TY, TH = 37.0, NY0 + 1.0, 6.0
block('hejnalTower', M['brickK'], TX - TH, TX + TH, TY - TH, TY + TH, -0.3, 54.0)
for z in (18.0, 36.0, 53.4):
    block(f'hejnalBand{z:.0f}', M['clothStone'], TX - TH - 0.2, TX + TH + 0.2, TY - TH - 0.2, TY + TH + 0.2, z, z + 0.6, bevel=0)
for z, h in ((22.0, 8.0), (40.0, 8.0)):
    for nx, ny in ((0, -1), (-1, 0), (1, 0)):
        c = P(TX + nx * (TH + 0.05), TY + ny * (TH + 0.05), 0)
        WIN.append((c.x, c.y, Z0 + z * S, 2.0 * S, h * S, (nx, ny), 'pointed'))
lathe('hejnalOctagon', M['brickK'], [(5.6 * S, 0.0), (5.6 * S, 6.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(TX, TY, 54.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('hejnalHelmet', M['helmet'], [(5.0 * S, 0.0), (3.0 * S, 4.0 * S), (1.6 * S, 10.0 * S), (0.6 * S, 18.0 * S), (0.0, 22.0 * S)], (0, 0, 0), segs=8,
      matrix=Matrix.Translation(P(TX, TY, 60.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for k in range(8):
    a = math.pi / 8 + 2 * math.pi * k / 8
    x, y = TX + 5.0 * math.cos(a), TY + 5.0 * math.sin(a)
    cylinder(f'helmetTurret{k}', M['helmet'], 0.6 * S, 3.0 * S, P(x, y, 60.0), segs=8)
    lathe(f'helmetTurretSpire{k}', M['helmet'], [(0.75 * S, 0.0), (0.0, 4.5 * S)], P(x, y, 63.0), segs=8)
    lathe(f'helmetTurretKnob{k}', M['gold'], [(0.0, 0.0), (0.2 * S, 0.2 * S), (0.0, 0.5 * S)], P(x, y, 67.4), segs=6)
lathe('crown', M['gold'], [(2.2 * S, 0.0), (2.2 * S, 1.0 * S), (2.6 * S, 1.6 * S), (2.0 * S, 1.4 * S)], P(TX, TY, 68.5), segs=16)
for k in range(8):
    a = 2 * math.pi * k / 8
    lathe(f'crownPoint{k}', M['gold'], [(0.25 * S, 0.0), (0.0, 0.9 * S)], P(TX + 2.4 * math.cos(a), TY + 2.4 * math.sin(a), 70.0), segs=6)
lathe('hejnalOrb', M['gold'], [(0.0, 0.0), (0.5 * S, 0.4 * S), (0.5 * S, 0.8 * S), (0.0, 1.2 * S)], P(TX, TY, 81.8), segs=12, smooth=True)
# the shorter tower: brick shaft and its Renaissance helmet of cupolas and lanterns
UX, UY, UH = 67.0, NY0 + 1.5, 5.0
block('bellTower', M['brickK'], UX - UH, UX + UH, UY - UH, UY + UH, -0.3, 50.0)
for z in (18.0, 36.0, 49.4):
    block(f'bellBand{z:.0f}', M['clothStone'], UX - UH - 0.2, UX + UH + 0.2, UY - UH - 0.2, UY + UH + 0.2, z, z + 0.6, bevel=0)
for nx, ny in ((0, -1), (1, 0), (-1, 0)):
    c = P(UX + nx * (UH + 0.05), UY + ny * (UH + 0.05), 0)
    WIN.append((c.x, c.y, Z0 + 40.0 * S, 1.8 * S, 7.0 * S, (nx, ny), 'pointed'))
lathe('bellDome', M['helmet'], [(5.4 * S, 0.0), (5.0 * S, 1.6 * S), (3.4 * S, 3.4 * S), (1.6 * S, 4.4 * S), (1.2 * S, 4.6 * S)], P(UX, UY, 50.0), segs=16, smooth=True)
cylinder('bellLantern', M['helmet'], 1.3 * S, 3.0 * S, P(UX, UY, 54.5), segs=12)
lathe('bellDome2', M['helmet'], [(1.8 * S, 0.0), (1.6 * S, 1.0 * S), (0.8 * S, 2.0 * S), (0.5 * S, 2.2 * S)], P(UX, UY, 57.5), segs=16, smooth=True)
cylinder('bellLantern2', M['helmet'], 0.6 * S, 2.0 * S, P(UX, UY, 59.6), segs=8)
lathe('bellSpire', M['helmet'], [(0.8 * S, 0.0), (0.0, 5.0 * S)], P(UX, UY, 61.6), segs=8)
lathe('bellOrb', M['gold'], [(0.0, 0.0), (0.35 * S, 0.3 * S), (0.0, 0.9 * S)], P(UX, UY, 66.4), segs=8, smooth=True)
for sx in (-1, 1):
    for sy in (-1, 1):
        pinnacle(UX + sx * (UH - 0.4), UY + sy * (UH - 0.4), 50.0, h=3.6, r=0.45)

# ------------------------------------------------------------------ the Town Hall Tower and its baroque helmet
RX, RY, RH = -46.0, 24.0, 5.5     # behind the Cloth Hall's west end, clear of its gable
block('townHallTower', M['brickK'], RX - RH, RX + RH, RY - RH, RY + RH, -0.3, 48.0)
for sx in (-1, 1):
    for sy in (-1, 1):
        block(f'quoin{sx}{sy}', M['clothStone'], RX + sx * RH - 0.5, RX + sx * RH + 0.5, RY + sy * RH - 0.5, RY + sy * RH + 0.5, -0.3, 48.0, bevel=0)
block('townHallGallery', M['clothStone'], RX - RH - 0.6, RX + RH + 0.6, RY - RH - 0.6, RY + RH + 0.6, 47.6, 48.6, bevel=0)
for nx, ny in ((0, -1), (1, 0), (-1, 0)):
    c = P(RX + nx * (RH + 0.05), RY + ny * (RH + 0.05), 0)
    for z, h in ((14.0, 5.0), (28.0, 5.0)):
        WIN.append((c.x, c.y, Z0 + z * S, 1.6 * S, h * S, (nx, ny), 'pointed'))
    lathe(f'clock{nx}{ny}', M['white'], [(0.0, 0.0), (1.6 * S, 0.0), (1.6 * S, 0.15 * S), (0.0, 0.15 * S)], (0, 0, 0), segs=24,
          matrix=Matrix.Translation(P(RX + nx * (RH + 0.02), RY + ny * (RH + 0.02), 41.5)) @ Matrix.Rotation(math.atan2(ny, nx), 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
c = P(RX, RY - RH - 0.05, 0)
DOORS.append((c.x, c.y, Z0 - 0.3 * S, 2.6 * S, 4.6 * S, (0, -1), 'pointed'))
lathe('townHallHelmet', M['helmet'], [(5.0 * S, 0.0), (4.6 * S, 2.0 * S), (2.6 * S, 4.4 * S), (1.0 * S, 5.4 * S)], P(RX, RY, 48.6), segs=16, smooth=True)
cylinder('townHallLantern', M['helmet'], 1.1 * S, 3.0 * S, P(RX, RY, 53.8), segs=12)
lathe('townHallCap', M['helmet'], [(1.5 * S, 0.0), (1.2 * S, 1.2 * S), (0.4 * S, 2.2 * S), (0.3 * S, 2.4 * S)], P(RX, RY, 56.8), segs=12, smooth=True)
lathe('townHallSpire', M['helmet'], [(0.4 * S, 0.0), (0.0, 7.0 * S)], P(RX, RY, 59.1), segs=8)
lathe('townHallOrb', M['gold'], [(0.0, 0.0), (0.35 * S, 0.3 * S), (0.0, 0.9 * S)], P(RX, RY, 65.6), segs=8, smooth=True)
finish('pinnacles', PIN, M['clothStone'], smooth_sides=False)
glazed('windows', WIN, M['clothStone'], depth=0.3 * S)
glazed('doors', DOORS, M['clothStone'], glass=M['door'], depth=0.3 * S)

# ------------------------------------------------------------------ the flower stalls under their umbrellas, and people
for k, (x, y) in enumerate(((-64.0, 6.0), (-60.0, 14.0), (-66.0, 20.0), (-56.0, 24.0))):
    block(f'stall{k}', M['wood'], x - 1.6, x + 1.6, y - 1.0, y + 1.0, -0.3, 1.0, bevel=0)
    block(f'stallFlowers{k}', M['flowers'], x - 1.5, x + 1.5, y - 0.9, y + 0.9, 1.0, 1.6)
    cylinder(f'umbrellaPole{k}', M['iron'], 0.07 * S, 3.0 * S, P(x, y, 1.0), segs=6)
    lathe(f'umbrella{k}', M['white'], [(2.4 * S, 0.0), (1.5 * S, 0.5 * S), (0.0, 0.9 * S)], P(x, y, 3.0), segs=8)
for k, (x, y, shirt) in enumerate(((-30.0, -20.0, 'red'), (-12.0, -26.0, 'blue'), (8.0, -18.0, 'yellow'), (26.0, -24.0, 'green'), (40.0, 24.0, 'red'), (30.0, 32.0, 'blue'),
                                   (-40.0, 26.0, 'yellow'), (-52.0, -12.0, 'green'), (60.0, 20.0, 'red'), (-20.0, 30.0, 'blue'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.6)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('krakow')
