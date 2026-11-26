# Cartagena in the high-quality look (hq.py), laid out in metres: the walled city's Clock Tower Gate
# (Puerta del Reloj), its yellow front with the wide middle arch between two smaller ones, the clock
# tower over it with its four faces, the belfry and the little dome; the thick battered coral-stone
# walls running off to either side with their round sentry boxes; inside, the Plaza de los Coches and
# the colonial houses round it in bright colours, their wooden balconies and the bougainvillea on them;
# in front, the plaza with its royal palms, and people.
# Run: blender -b --factory-startup -P cartagena.py -- cartagena-1024.png 1024 cartagena.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1533)
M['coral'] = material('coralStone', '#bba98a', 0.9, vary='#a8977a', vary_scale=24, bump=0.3, bump_scale=160)
M['coralDark'] = material('coralStoneDark', '#9e8f73', 0.9, vary='#8f8166', vary_scale=24, bump=0.3, bump_scale=160)
M['gateYellow'] = material('gateYellow', '#ecc85a', 0.7, vary='#e6bf4e', vary_scale=30, bump=0.05, bump_scale=200)
M['trimWhite'] = material('gateTrim', '#f3efe4', 0.6)
M['clockFace'] = material('clockFace', '#fbf8ef', 0.5)
M['balcony'] = material('woodBalcony', '#5a3a22', 0.7, vary='#4c3019', vary_scale=40)
M['roofTiles'] = material('clayRoof', '#b65a36', 0.75, vary='#a54c2c', vary_scale=30)
M['bougainvillea'] = material('bougainvillea', '#d23d8b', 0.8, vary='#e4569e', vary_scale=40, bump=0.3, bump_scale=200)
M['plazaC'] = masonry('cartagenaPlaza', '#d6ccb8', '#b8ad97', scale=120, rough=0.8, vary='#cec3ae')
M['palmTrunk'] = material('palmTrunk', '#a49a86', 0.8, vary='#968c78', vary_scale=40)
M['frond'] = material('palmFrond', '#4f8f36', 0.8, vary='#5c9c40', vary_scale=20)
HOUSE = [material(f'houseColour{k}', c, 0.8, vary=c, vary_scale=30, bump=0.06, bump_scale=200)
         for k, c in enumerate(('#f2b53d', '#e47a48', '#4f9fd1', '#e780a1', '#86bf74', '#f4d65e', '#8e7bc9'))]

S = 0.032               # metres to the tile's units
FY = 5.0                # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def T(x, y):
    return (x * S, (y - FY) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def battered(name, mat, x0, x1, y_front, y_back, z1, batter):
    """A wall whose front leans back by `batter` metres from its foot to its top."""
    bm = bmesh.new()
    sec = [(y_front, 0.0), (y_back, 0.0), (y_back, z1), (y_front + batter, z1)]
    a = [bm.verts.new(P(x0, y, z)) for y, z in sec]
    b = [bm.verts.new(P(x1, y, z)) for y, z in sec]
    add_prism(bm, a, b)
    return finish(name, bm, mat, smooth_sides=False)


BEFORE = set(bpy.data.objects)
slab('plaza', M['plazaC'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
WIN, DOORS = [], []

# ------------------------------------------------------------------ the walls: battered coral stone, the walk and its parapet, the sentry boxes
WH = 9.0
YW0, YW1 = -6.0, 4.0
for side, (x0, x1) in ((-1, (-41.0, -11.0)), (1, (11.0, 41.0))):
    battered(f'wall{side}', M['coral'], x0, x1, YW0, YW1, WH, 1.6)
    block(f'parapet{side}', M['coralDark'], x0, x1, YW0 + 1.6, YW0 + 2.6, WH, WH + 1.4, bevel=0)
    for k in range(int((x1 - x0) / 4.0)):
        x = x0 + 2.0 + 4.0 * k
        block(f'merlon{side}{k}', M['coralDark'], x - 1.1, x + 1.1, YW0 + 1.6, YW0 + 2.6, WH + 1.4, WH + 2.2, bevel=0)
    block(f'cordon{side}', M['coralDark'], x0, x1, YW0 + 1.3, YW0 + 1.8, WH - 0.6, WH, bevel=0)
    gx = side * 36.0
    cylinder(f'garita{side}', M['coral'], 1.5 * S, 3.4 * S, P(gx, YW0 + 1.0, WH), segs=24)
    lathe(f'garitaDome{side}', M['coralDark'], [(1.7 * S, 0.0), (1.6 * S, 0.5 * S), (0.9 * S, 1.6 * S), (0.0, 2.2 * S)], P(gx, YW0 + 1.0, WH + 3.4), segs=24, smooth=True)
    lathe(f'garitaFoot{side}', M['coralDark'], [(0.4 * S, 0.0), (1.2 * S, 1.2 * S), (1.6 * S, 1.8 * S)], P(gx, YW0 + 1.0, WH - 1.8), segs=24)
    c = P(gx, YW0 - 0.55, 0)
    DOORS.append((c.x, c.y, Z0 + (WH + 1.0) * S, 0.6 * S, 1.0 * S, (0, -1), 'rect'))

# ------------------------------------------------------------------ the gate: its front with three arches, the clock tower, belfry and dome
GX0, GX1, GY0, GY1 = -11.0, 11.0, -9.0, 6.0
GH = 13.0
block('gate', M['gateYellow'], GX0, GX1, GY0, GY1, -0.3, GH)
block('gatePlinth', M['trimWhite'], GX0 - 0.3, GX1 + 0.3, GY0 - 0.3, GY1, -0.3, 1.0, bevel=0)
block('gateCornice', M['trimWhite'], GX0 - 0.5, GX1 + 0.5, GY0 - 0.6, GY1 + 0.3, GH, GH + 0.8, bevel=0)
block('gateParapet', M['gateYellow'], GX0, GX1, GY0, GY1, GH + 0.8, GH + 2.0)
for x in (GX0 + 0.6, GX1 - 0.6, -4.6, 4.6):
    lathe(f'gateFinial{x:+.0f}', M['trimWhite'], [(0.5 * S, 0.0), (0.6 * S, 0.5 * S), (0.3 * S, 1.2 * S), (0.0, 1.6 * S)], P(x, GY0 + 0.5, GH + 2.0), segs=12)
for x, w, h in ((0.0, 5.6, 8.4), (-7.0, 2.8, 5.6), (7.0, 2.8, 5.6)):
    c = P(x, GY0 - 0.05, 0)
    DOORS.append((c.x, c.y, Z0 + 0.4 * S, w * S, h * S, (0, -1), 'round'))
    arcade_path(f'archTrim{x:+.0f}', M['trimWhite'], [((x - w / 2 - 0.7) * S, (GY0 - 0.3 - FY) * S), ((x + w / 2 + 0.7) * S, (GY0 - 0.3 - FY) * S)], 0.35 * S,
                Z0 + (0.4 + h - w / 2) * S, (w / 2 + 0.8) * S, (w / 2 + 0.05) * S)
for x in (-9.6, -4.0, 4.0, 9.6):
    block(f'pilaster{x:+.0f}', M['trimWhite'], x - 0.5, x + 0.5, GY0 - 0.45, GY0, 1.0, GH)
# the clock tower: the clock storey, the belfry, the dome
TW = 7.0
block('clockStorey', M['gateYellow'], -TW / 2, TW / 2, -TW / 2 - 1.0, TW / 2 - 1.0, GH + 2.0, GH + 11.0)
block('clockCornice', M['trimWhite'], -TW / 2 - 0.4, TW / 2 + 0.4, -TW / 2 - 1.4, TW / 2 - 0.6, GH + 11.0, GH + 11.7, bevel=0)
for k, (nx, ny) in enumerate(((0, -1), (1, 0), (-1, 0), (0, 1))):
    c = P(nx * (TW / 2 + 0.1), -1.0 + ny * (TW / 2 + 0.1), GH + 7.2)
    rot = Matrix.Rotation(math.atan2(ny, nx) - math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X')
    cylinder(f'clock{k}', M['clockFace'], 2.0 * S, 0.25 * S, (0, 0, 0), segs=32, matrix=Matrix.Translation(c) @ rot)
    rim = Matrix.Translation(c + Vector((nx, ny, 0)) * 0.26 * S)
    for j, (ang, ln) in enumerate(((0.3, 1.4), (2.2, 1.0))):
        hand = c + Vector((nx, ny, 0)) * 0.3 * S
        tip = hand + (Vector((-ny, nx, 0)) * math.sin(ang) + Vector((0, 0, 1)) * math.cos(ang)) * ln * S
        bar(f'hand{k}{j}', M['iron'], hand, tip, 0.18 * S)
BW = 5.6
block('belfry', M['gateYellow'], -BW / 2, BW / 2, -BW / 2 - 1.0, BW / 2 - 1.0, GH + 11.7, GH + 18.0)
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    c = P(nx * (BW / 2 + 0.05), -1.0 + ny * (BW / 2 + 0.05), 0)
    WIN.append((c.x, c.y, Z0 + (GH + 12.6) * S, 2.6 * S, 4.4 * S, (nx, ny), 'round'))
block('belfryCornice', M['trimWhite'], -BW / 2 - 0.4, BW / 2 + 0.4, -BW / 2 - 1.4, BW / 2 - 0.6, GH + 18.0, GH + 18.6, bevel=0)
lathe('towerDome', M['gateYellow'], [(2.6 * S, 0.0), (2.5 * S, 0.8 * S), (1.8 * S, 2.4 * S), (0.8 * S, 3.2 * S), (0.0, 3.4 * S)], P(0.0, -1.0, GH + 18.6), segs=32, smooth=True)
lathe('lanternTop', M['trimWhite'], [(0.5 * S, 0.0), (0.5 * S, 1.0 * S), (0.2 * S, 1.6 * S), (0.0, 2.4 * S)], P(0.0, -1.0, GH + 21.9), segs=12)
bar('vane', M['iron'], P(0.0, -1.0, GH + 24.0), P(0.0, -1.0, GH + 26.0), 0.15 * S)

# ------------------------------------------------------------------ inside: the Plaza de los Coches and its colonial houses, balconies, bougainvillea
ROW = [(-37.0, 16.0), (-24.0, 22.0), (-8.0, 25.0), (8.0, 25.0), (24.0, 22.0), (37.0, 16.0)]
k = 0
for (xa, ya), (xb, yb) in zip(ROW, ROW[1:]):
    seg = math.hypot(xb - xa, yb - ya)
    n = max(1, int(seg / 8.0))
    for j in range(n):
        t0, t1 = j / n, (j + 1) / n
        x0, y0 = xa + (xb - xa) * t0, ya + (yb - ya) * t0
        x1, y1 = xa + (xb - xa) * t1, ya + (yb - ya) * t1
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        ang = math.atan2(y1 - y0, x1 - x0)
        w = math.hypot(x1 - x0, y1 - y0)
        h = rng.choice((9.0, 10.0, 11.0))
        d = 7.0
        mat = HOUSE[k % len(HOUSE)]
        m = Matrix.Translation(P(cx, cy, 0.0)) @ Matrix.Rotation(ang, 4, 'Z')
        box_m(f'house{k}', mat, m @ Matrix.Translation((0, d / 2 * S, (h / 2 - 0.3) * S)), (w * S, d * S, (h + 0.3) * S))
        box_m(f'houseCornice{k}', M['trimWhite'], m @ Matrix.Translation((0, (d / 2 - 0.2) * S, h * S)), ((w + 0.2) * S, (d + 0.4) * S, 0.5 * S))
        box_m(f'houseRoof{k}', M['roofTiles'], m @ Matrix.Translation((0, (d / 2 + 1.0) * S, (h + 0.45) * S)), ((w - 0.6) * S, (d - 3.0) * S, 0.4 * S))
        nrm = Vector((-math.sin(ang), math.cos(ang), 0))
        tan = Vector((math.cos(ang), math.sin(ang), 0))
        for u in (-w / 4, w / 4):
            c = P(cx + tan.x * u - nrm.x * 0.05, cy + tan.y * u - nrm.y * 0.05, 0)
            DOORS.append((c.x, c.y, Z0 + 0.2 * S, 1.8 * S, 3.6 * S, (-nrm.x, -nrm.y), 'rect'))
            DOORS.append((c.x, c.y, Z0 + 5.2 * S, 1.6 * S, 3.0 * S, (-nrm.x, -nrm.y), 'rect'))
        box_m(f'balcony{k}', M['balcony'], m @ Matrix.Translation((0, -0.8 * S, 4.9 * S)), ((w - 1.2) * S, 1.6 * S, 0.3 * S))
        box_m(f'balconyRail{k}', M['balcony'], m @ Matrix.Translation((0, -1.5 * S, 5.7 * S)), ((w - 1.2) * S, 0.2 * S, 1.3 * S))
        box_m(f'balconyRoof{k}', M['balcony'], m @ Matrix.Translation((0, -0.9 * S, 8.4 * S)), ((w - 1.0) * S, 1.9 * S, 0.25 * S))
        if k % 2 == 0:
            BOUG = [((m @ Vector((rng.uniform(-w / 2.5, w / 2.5) * S, -1.6 * S, rng.uniform(5.6, 8.6) * S))).to_tuple(), rng.uniform(0.8, 1.4) * S, 0.8) for _ in range(9)]
            blob_cloud(f'bougainvillea{k}', M['bougainvillea'], BOUG)
        k += 1

# ------------------------------------------------------------------ royal palms on the plaza in front, people
FRONDS = []
for j, (x, y) in enumerate(((-26.0, -16.0), (-17.0, -21.0), (17.0, -21.0), (26.0, -16.0))):
    h = rng.uniform(14.0, 16.0)
    lathe(f'palm{j}', M['palmTrunk'], [(0.55 * S, 0.0), (0.45 * S, h * 0.5 * S), (0.42 * S, h * S)], P(x, y, 0.0), segs=12, smooth=True)
    for f in range(9):
        a = 2 * math.pi * f / 9 + j
        top = P(x, y, h)
        mid = P(x + 2.4 * math.cos(a), y + 2.4 * math.sin(a), h + 0.8)
        end = P(x + 4.4 * math.cos(a), y + 4.4 * math.sin(a), h - 1.4)
        tube(f'frond{j}{f}', M['frond'], [top, mid, end], 0.35 * S)
glazed('windows', WIN, M['trimWhite'], glass=M['window'], depth=0.3 * S)
glazed('doors', DOORS, M['trimWhite'], glass=M['door'], depth=0.25 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-3.0, -14.0, 'red'), (4.0, -18.0, 'blue'), (-10.0, -24.0, 'yellow'), (9.0, -26.0, 'green'), (0.0, 12.0, 'red'), (-12.0, 14.0, 'blue'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.85)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('cartagena')
