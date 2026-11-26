# Old Havana in the high-quality look (hq.py), laid out in metres: the Capitolio, its long wings with
# their colonnades, the grand stair up to its portico of columns, and its white dome rising on a drum
# ringed by columns to the lantern; in front, the street with its royal palms and two 1950s American
# cars with their fins, one pink and one turquoise; a row of pastel colonial houses with tall
# shuttered doors and iron balconies; and people.
# Run: blender -b --factory-startup -P old-havana.py -- old-havana-1024.png 1024 old-havana.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1519)
M['capStone'] = material('capitolioStone', '#ebe6dc', 0.7, vary='#e0dace', vary_scale=24, bump=0.06, bump_scale=200)
M['capStoneShade'] = material('capitolioShade', '#d6d0c3', 0.75, vary='#cbc4b6', vary_scale=24)
M['street'] = material('havanaStreet', '#6d6b68', 0.85, vary='#646260', vary_scale=60)
M['sidewalk'] = masonry('havanaSidewalk', '#b3aa98', '#928a7a', scale=200, rough=0.85, vary='#a9a08e')
M['lawnH'] = material('capitolioLawn', '#6fa548', 0.85, vary='#7cb053', vary_scale=12, bump=0.3, bump_scale=200)
M['palmFrond'] = material('royalPalm', '#4f8a3a', 0.8, vary='#5c9945', vary_scale=20)
M['palmTrunk'] = material('royalPalmTrunk', '#c9c2b2', 0.85, vary='#bdb6a6', vary_scale=40)
M['chrome'] = material('chrome', '#d8dde2', 0.15, metallic=1.0)
M['tyre'] = material('tyre', '#1f1d1c', 0.8)
M['carPink'] = material('carPink', '#e88fae', 0.3, coat=0.5)
M['carTeal'] = material('carTeal', '#3fb8b0', 0.3, coat=0.5)
M['shutter'] = material('shutterGreen', '#3f7a5a', 0.6)
HOUSES = [material(f'pastel{k}', c, 0.8, vary=c, vary_scale=30, bump=0.06, bump_scale=200) for k, c in enumerate(('#e9a3b3', '#f1d27a', '#8fd0c8', '#9cb8e6', '#f0b07a', '#c9a7e0'))]

S = 0.011               # metres to the tile's units
FY = 8.0
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def T(x, y):
    return (x * S, (y - FY) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
slab('street', M['street'], [T(-140.0, -64.0), T(140.0, -64.0), T(140.0, -44.0), T(-140.0, -44.0)], Z0 - 0.002, Z0 + 0.05 * S, margin=0.02)
slab('plaza', M['sidewalk'], [T(-140.0, -44.0), T(140.0, -44.0), T(140.0, 80.0), T(-140.0, 80.0)], Z0 - 0.002, Z0 + 0.12 * S, margin=0.02)
for side in (-1, 1):
    xa, xb = sorted((side * 27.0, side * 96.0))
    slab(f'lawn{side}', M['lawnH'], [T(xa, -40.0), T(xb, -40.0), T(xb, -6.0), T(xa, -6.0)], Z0, Z0 + 0.2 * S, margin=0.03)
WIN, DOORS = [], []

# ------------------------------------------------------------------ the Capitolio: wings with colonnades, the central block, stair, portico, the dome
FLOOR = 8.0
block('podium', M['capStoneShade'], -96.0, 96.0, -4.0, 62.0, -0.3, FLOOR)
for side in (-1, 1):
    xa, xb = sorted((side * 30.0, side * 94.0))
    block(f'wing{side}', M['capStone'], xa, xb, 0.0, 60.0, FLOOR, FLOOR + 16.0)
    block(f'wingCornice{side}', M['capStoneShade'], xa - 0.3, xb + 0.3, -0.3, 60.3, FLOOR + 15.0, FLOOR + 16.6, bevel=0)
    block(f'wingAttic{side}', M['capStone'], xa, xb, 0.5, 59.5, FLOOR + 16.6, FLOOR + 19.0)
    n = int((xb - xa) / 4.0)
    for k in range(n):
        x = xa + 2.0 + 4.0 * k
        cylinder(f'wingColumn{side}{k}', M['capStone'], 0.6 * S, 14.4 * S, P(x, -1.6, FLOOR), segs=12)
        if k < n - 1:                                   # a window between each pair of columns
            c = P(x + 2.0, -0.05, 0)
            for z in (FLOOR + 2.0, FLOOR + 9.0):
                WIN.append((c.x, c.y, Z0 + z * S, 1.4 * S, 4.0 * S, (0, -1), 'rect'))
    block(f'wingColonnadeRoof{side}', M['capStoneShade'], xa, xb, -2.6, 0.0, FLOOR + 14.4, FLOOR + 15.2, bevel=0)
block('centre', M['capStone'], -30.0, 30.0, -6.0, 60.0, FLOOR, FLOOR + 22.0)
block('centreCornice', M['capStoneShade'], -30.3, 30.3, -6.3, 60.3, FLOOR + 21.0, FLOOR + 22.6, bevel=0)
# the grand stair and the portico of twelve columns
for k in range(16):
    block(f'stair{k}', M['capStoneShade'], -24.0, 24.0, -44.0 + 1.75 * k, -14.0, -0.3, FLOOR * (k + 1) / 16, bevel=0)
block('porticoFloor', M['capStoneShade'], -24.0, 24.0, -14.0, -6.0, -0.3, FLOOR)
for k in range(12):
    x = -22.0 + 4.0 * k
    cylinder(f'porticoColumn{k}', M['capStone'], 0.9 * S, 17.0 * S, P(x, -12.0, FLOOR), segs=16)
    lathe(f'porticoCapital{k}', M['capStone'], [(0.9 * S, 0.0), (1.3 * S, 0.5 * S), (1.4 * S, 0.8 * S)], P(x, -12.0, FLOOR + 17.0), segs=16)
block('porticoEntablature', M['capStone'], -24.5, 24.5, -14.0, -6.0, FLOOR + 17.8, FLOOR + 21.5)
block('porticoAttic', M['capStoneShade'], -24.5, 24.5, -14.3, -6.0, FLOOR + 21.5, FLOOR + 22.6, bevel=0)
for x in (-8.0, 0.0, 8.0):
    c = P(x, -6.05, 0)
    DOORS.append((c.x, c.y, Z0 + FLOOR * S, 3.0 * S, 9.0 * S, (0, -1), 'round'))
DX, DY = 0.0, 26.0
DZ = FLOOR + 22.6
cylinder('drumBase', M['capStoneShade'], 20.0 * S, 4.0 * S, P(DX, DY, DZ), segs=48)
cylinder('drum', M['capStone'], 15.0 * S, 18.0 * S, P(DX, DY, DZ + 4.0), segs=48)
for k in range(24):
    a = 2 * math.pi * k / 24
    cylinder(f'drumColumn{k}', M['capStone'], 0.55 * S, 14.0 * S, P(DX + 17.0 * math.cos(a), DY + 17.0 * math.sin(a), DZ + 4.0), segs=10)
    c = P(DX + 15.05 * math.cos(a + math.pi / 24), DY + 15.05 * math.sin(a + math.pi / 24), 0)
    WIN.append((c.x, c.y, Z0 + (DZ + 7.0) * S, 1.4 * S, 6.0 * S, (math.cos(a + math.pi / 24), math.sin(a + math.pi / 24)), 'round'))
annulus('drumEntablature', M['capStone'], 18.0 * S, 14.6 * S, Z0 + (DZ + 18.0) * S, Z0 + (DZ + 20.0) * S, segs=48, center=P(DX, DY, 0).xy)
cylinder('drumAttic', M['capStoneShade'], 15.6 * S, 4.0 * S, P(DX, DY, DZ + 20.0), segs=48)
lathe('dome', M['capStone'], [(15.8 * S, 0.0), (15.4 * S, 4.0 * S), (13.6 * S, 10.0 * S), (10.0 * S, 15.4 * S), (5.4 * S, 19.4 * S), (2.6 * S, 20.6 * S)], P(DX, DY, DZ + 24.0), segs=48, smooth=True)
for k in range(16):
    a = 2 * math.pi * k / 16
    tube(f'domeRib{k}', M['capStoneShade'], [P(DX + r * math.cos(a), DY + r * math.sin(a), DZ + 24.0 + z) for r, z in ((15.85, 0.0), (15.45, 4.0), (13.65, 10.0), (10.05, 15.4), (5.45, 19.4), (2.65, 20.6))], 0.3 * S)
cylinder('lantern', M['capStone'], 2.6 * S, 6.0 * S, P(DX, DY, DZ + 44.4), segs=16)
for k in range(8):
    a = 2 * math.pi * k / 8
    c = P(DX + 2.65 * math.cos(a), DY + 2.65 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + (DZ + 45.4) * S, 0.8 * S, 3.0 * S, (math.cos(a), math.sin(a)), 'round'))
lathe('lanternTop', M['capStone'], [(3.0 * S, 0.0), (1.6 * S, 1.6 * S), (0.4 * S, 3.6 * S), (0.0, 6.0 * S)], P(DX, DY, DZ + 50.4), segs=16, smooth=True)

# ------------------------------------------------------------------ the colonial houses, their shutters and balconies
x = -126.0
k = 0
while x < -26.0:
    w = rng.uniform(9.0, 13.0)
    h = rng.uniform(10.0, 14.0)
    y0, y1 = -84.0, -70.0
    if math.hypot(x, y0 - FY) * S > 1.42 or math.hypot(x + w, y0 - FY) * S > 1.42:
        x += w
        continue
    block(f'house{k}', HOUSES[k % len(HOUSES)], x, x + w, y0, y1, -0.3, h - 0.5)
    block(f'houseCornice{k}', M['white'], x, x + w, y0 - 0.4, y1, h - 0.8, h, bevel=0)
    n = 2 if w < 11.0 else 3
    for j in range(n):
        xx = x + w * (j + 0.5) / n
        for z, hh in ((0.0, 4.0), (5.6, 3.6)):
            c = P(xx, y0 - 0.05, 0)
            DOORS.append((c.x, c.y, Z0 + z * S, 1.6 * S, hh * S, (0, -1), 'rect'))
            block(f'shutters{k}{j}{z:.0f}', M['shutter'], xx - 1.5, xx + 1.5, y0 - 0.12, y0 - 0.02, z, z + hh, bevel=0)
        block(f'balcony{k}{j}', M['iron'], xx - 1.6, xx + 1.6, y0 - 1.2, y0, 5.4, 5.6, bevel=0)
        block(f'balconyRail{k}{j}', M['iron'], xx - 1.6, xx + 1.6, y0 - 1.25, y0 - 1.15, 5.6, 6.6, bevel=0)
    x += w
    k += 1


# ------------------------------------------------------------------ the 1950s cars with their fins, the royal palms, people
def car(name, x, y, ang, paint):
    m = Matrix.Translation(P(x, y, 0.0)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Scale(1.8, 4)     # drawn large enough to be seen

    def bx(n, mat, cx, cy, cz, sx, sy, sz):
        box_m(name + n, mat, m @ Matrix.Translation((cx * S, cy * S, cz * S)), (sx * S, sy * S, sz * S), bevel=0.0006)
    bx('Body', paint, 0.0, 0.0, 0.9, 5.6, 2.0, 0.9)
    bx('Cabin', paint, -0.3, 0.0, 1.65, 2.6, 1.8, 0.7)
    bx('Roof', M['white'], -0.3, 0.0, 2.05, 2.5, 1.75, 0.12)
    bx('Glass', M['window'], -0.3, 0.0, 1.68, 2.66, 1.84, 0.5)
    for sy in (-1, 1):
        bx(f'Fin{sy}', paint, -2.5, sy * 0.85, 1.45, 1.4, 0.18, 0.5)
        for sx in (-1.75, 1.75):
            cylinder(f'{name}Wheel{sy}{sx}', M['tyre'], 0.42 * S, 0.3 * S, (0, 0, 0), segs=16, matrix=m @ Matrix.Translation((sx * S, sy * 1.0 * S, 0.42 * S)) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -0.15 * S)))
    for sx in (-2.85, 2.85):
        bx(f'Bumper{sx:+.0f}', M['chrome'], sx, 0.0, 0.6, 0.18, 2.05, 0.3)


car('pinkCar', -14.0, -52.0, 0.0, M['carPink'])
car('tealCar', 18.0, -57.0, math.pi, M['carTeal'])
FRONDS = []
for k, x in enumerate((-46.0, -30.0, 30.0, 46.0, 62.0, -62.0)):
    y = -40.0
    if math.hypot(x, y - FY) * S > 1.3:
        continue
    cylinder(f'palmTrunk{k}', M['palmTrunk'], 0.5 * S, 16.0 * S, P(x, y, 0.0), segs=10, r2=0.4 * S)
    top = P(x, y, 16.0)
    for j in range(10):
        a = 2 * math.pi * j / 10 + k
        FRONDS.append([top, top + Vector((math.cos(a) * 2.4 * S, math.sin(a) * 2.4 * S, 0.9 * S)), top + Vector((math.cos(a) * 4.4 * S, math.sin(a) * 4.4 * S, -0.4 * S)), top + Vector((math.cos(a) * 5.4 * S, math.sin(a) * 5.4 * S, -2.0 * S))])
cu = bpy.data.curves.new('palmFronds', 'CURVE')
cu.dimensions = '3D'
cu.bevel_depth = 0.38 * S
cu.bevel_resolution = 1
for pts in FRONDS:
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, q in enumerate(pts):
        sp.points[i].co = (*q, 1)
fr = bpy.data.objects.new('palmFronds', cu)
fr.data.materials.append(M['palmFrond'])
bpy.context.scene.collection.objects.link(fr)
glazed('windows', WIN, M['capStoneShade'], depth=0.3 * S)
glazed('doors', DOORS, M['white'], glass=M['door'], depth=0.3 * S)
for k, (x, y, z, shirt) in enumerate(((-6.0, -38.0, 0.12, 'red'), (6.0, -30.0, 3.4, 'blue'), (-14.0, -24.0, 5.6, 'yellow'), (10.0, -40.0, 0.12, 'green'), (-80.0, -66.0, 0.0, 'red'), (40.0, -48.0, 0.12, 'blue'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('old-havana')
