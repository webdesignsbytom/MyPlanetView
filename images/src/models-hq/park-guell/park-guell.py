# Park Güell in the high-quality look (hq.py), laid out in metres and seen from the entrance: Gaudí's
# terrace on the hypostyle hall's forest of Doric columns, the long serpentine bench along its wavy edge
# in broken-tile mosaic (trencadís), the double stairway with its mosaic fountains up the middle, the
# rubble-stone walls and the hill behind with its pines; the two gingerbread gatehouses by the gate,
# their rippling mosaic roofs, one crowned with its red and white mushroom, the other with its
# chequered tower and four-armed cross; palms on the square, and people. (The mosaic dragon on the
# stairway is left out: no scan of it under a free licence was found, and sculpture isn't built in code.)
# Run: blender -b --factory-startup -P park-guell.py -- park-guell-1024.png 1024 park-guell.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='gravel')
rng = random.Random(1900)


M['rubble'] = masonry('guellRubble', '#8a6e50', '#5a4733', scale=110, rough=0.9, vary='#7b6147')
M['sandG'] = material('guellSand', '#d8c39a', 0.9, vary='#cbb489', vary_scale=40, bump=0.2, bump_scale=400)
M['scrub'] = material('guellScrub', '#6f8a45', 0.9, vary='#7d9450', vary_scale=12, bump=0.3, bump_scale=120)
M['pineG'] = material('stonePine', '#3f6b34', 0.85, vary='#4b7a3d', vary_scale=14, bump=0.3, bump_scale=90)
M['palm'] = material('palmFrond', '#5c8f3a', 0.8, vary='#6aa043', vary_scale=20)
M['bench'] = mosaic('benchTrencadis', ((5, '#f2efe6'), (2, '#e6dfcb'), (1, '#4f86c6'), (1, '#6fae5a'), (1, '#e8c14a'), (1, '#d9793a'), (0.6, '#c9463d'), (0.6, '#3f6fa8'), (0.6, '#9fc6d8')))
M['whiteTiles'] = mosaic('whiteTrencadis', ((3, '#f4f2ec'), (2, '#e6e2d6'), (0.4, '#cfd8dc')), scale=90)
M['roofTiles'] = mosaic('roofTrencadis', ((3, '#8a5a3a'), (3, '#efe4cc'), (1, '#6d4630'), (0.7, '#5a7fa8')), scale=60)
M['fountainTiles'] = mosaic('fountainTrencadis', ((3, '#f2efe6'), (1.4, '#3f78b8'), (1, '#e8c14a'), (1, '#d9793a'), (0.8, '#5a9a4a'), (0.6, '#c9463d')))
M['capRed'] = material('mushroomCap', '#c8382c', 0.45)
M['chequer'] = chequer('chequer', '#f4f2ec', '#2f68b3', scale=55.0)

S = 0.034               # metres to the tile's units
FY = 0.10               # the terrace's front on the tile, before the turn
HALL, DECK, TOP = 6.0, 10.5, 12.0


def P(x, y, z):
    return Vector((x * S, FY + y * S, G + z * S))


def T(x, y):
    return (x * S, FY + y * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def edge(x):
    """The terrace's wavy front edge (metres)."""
    return 1.2 * math.sin(2 * math.pi * x / 13.0 + 0.6)


BEFORE = set(bpy.data.objects)
WIDE, HW = 32.0, 16.0   # the terrace's and the hall's half widths


# ------------------------------------------------------------------ the ground: the square at the gate, the hillsides either side of the terrace and behind it
def H(x, y):
    mx, my = x / S, (y - FY) / S
    side = TOP * min(1.0, 1.0 - (abs(mx) - WIDE) / 16.0) * smooth((my + 4.0) / 6.0) if abs(mx) > WIDE else 0.0
    back = (TOP + 9.0 * smooth((my - 22.0) / 14.0)) * smooth((my - 20.0) / 5.0)
    rim = smooth((1.48 - math.hypot(x, y)) / 0.12)
    return max(0.0, side, back) * S * rim


ground = terrain('ground', H, [M['gravel'], M['scrub']], lambda z, nz, x, y: 0 if z < 0.004 else 1, rings=160, segs=420)
front = [(x, edge(x)) for x in [-WIDE + 0.5 * k for k in range(int(4 * WIDE) + 1)]]
far = 34.0
for side in (-1, 1):
    pts = [(x, y) for x, y in front if side * x >= HW]
    xa, xb = (pts[0][0], pts[-1][0])
    # Gaudí's portico: the wall set back under the terrace, a row of leaning rubble columns along its edge
    slab(f'terraceMass{side}', M['rubble'], [T(x, y + 3.5) for x, y in pts] + [T(xb, far), T(xa, far)], G - 0.004, G + DECK * S, margin=0.02)
    slab(f'terraceDeck{side}', M['rubble'], [T(*p) for p in pts] + [T(xb, far), T(xa, far)], G + DECK * S, G + TOP * S, margin=0.02)
    for k in range(5):
        x = side * (HW + 2.2 + 3.3 * k)
        tube(f'porticoColumn{side}{k}', M['rubble'], [P(x, edge(x) + 2.2, -0.3), P(x, edge(x) + 1.0, DECK + 0.2)], 0.6 * S)
slab('terraceBack', M['rubble'], [T(-HW, 26.0), T(HW, 26.0), T(HW, far), T(-HW, far)], G - 0.004, G + TOP * S, margin=0.02)
slab('hallDeck', M['whiteStone'], [T(x, y) for x, y in front if abs(x) <= HW] + [T(HW, 26.0), T(-HW, 26.0)], G + DECK * S, G + TOP * S, margin=0.02)
slab('terraceTop', M['sandG'], [T(*p) for p in front] + [T(WIDE, far), T(-WIDE, far)], G + TOP * S, G + (TOP + 0.12) * S, margin=0.02)
slab('hallFloor', M['rubble'], [T(-HW, -2.0), T(HW, -2.0), T(HW, 26.0), T(-HW, 26.0)], G - 0.004, G + (HALL - 0.1) * S, margin=0.02)
slab('hallPaving', M['paving'], [T(-HW, -2.0), T(HW, -2.0), T(HW, 26.0), T(-HW, 26.0)], G + (HALL - 0.1) * S, G + HALL * S, margin=0.02)

# ------------------------------------------------------------------ the serpentine bench along the terrace's edge
SECTION = [(-0.15, -0.25), (-0.15, 0.85), (0.0, 1.05), (0.28, 1.02), (0.42, 0.55), (0.95, 0.47), (1.1, 0.25), (1.1, -0.25)]
rings = []
for k in range(len(front)):
    x, y = front[k]
    d = (edge(x + 0.01) - edge(x - 0.01)) / 0.02
    nl = math.hypot(d, 1.0)
    nx, ny = -d / nl, 1.0 / nl
    rings.append([P(x + nx * u, y + ny * u, TOP + v) for u, v in SECTION])
loft('bench', M['bench'], rings, cap=True, smooth=False)

# ------------------------------------------------------------------ the hypostyle hall's Doric columns
SHAFT = []
for row, yc in enumerate((2.2, 7.0, 12.0, 17.0, 22.0)):
    for k in range(7):
        xc = -15.0 + 5.0 * k
        cylinder(f'col{row}{k}', M['whiteStone'], 0.72 * S, (DECK - HALL - 0.55) * S, P(xc, yc, HALL), segs=16, r2=0.62 * S)
        cylinder(f'colFoot{row}{k}', M['whiteTiles'], 0.76 * S, 1.6 * S, P(xc, yc, HALL), segs=16, r2=0.74 * S)
        lathe(f'colCap{row}{k}', M['whiteStone'], [(0.6 * S, 0.0), (1.05 * S, 0.32 * S), (1.05 * S, 0.34 * S)], P(xc, yc, DECK - 0.56), segs=16)
        block(f'colAbacus{row}{k}', M['whiteStone'], xc - 1.1, xc + 1.1, yc - 1.1, yc + 1.1, DECK - 0.23, DECK + 0.01, bevel=0)


# ------------------------------------------------------------------ the double stairway, its walls, and the mosaic fountains up its middle
def stair(name, x0, x1):
    prof = [(-20.0, 0.0)]
    for k in range(18):
        prof += [(-20.0 + k, HALL * (k + 1) / 18), (-19.0 + k, HALL * (k + 1) / 18)]
    prof += [(-2.0, 0.0)]
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(x0, y, z)) for y, z in prof], [bm_.verts.new(P(x1, y, z)) for y, z in prof])
    finish(name, bm_, M['paving'], smooth_sides=False)


stair('stairLeft', -8.6, -3.4)
stair('stairRight', 3.4, 8.6)


def stair_wall(name, x0, x1, mat):
    top = []
    for k in range(39):
        y = -21.0 + 0.5 * k
        top.append((y, min(HALL, max(0.0, HALL * (y + 20.0) / 18)) + 1.25 + 0.3 * math.sin(2.4 * y)))
    prof = [(-21.0, 0.0)] + top + [(-1.6, HALL + 1.0), (-1.6, 0.0)]
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(x0, y, z)) for y, z in prof], [bm_.verts.new(P(x1, y, z)) for y, z in prof])
    finish(name, bm_, mat, smooth_sides=False)


for side in (-1, 1):
    stair_wall(f'stairWallOut{side}', *sorted((side * 8.6, side * 9.6)), M['whiteTiles'])
    stair_wall(f'stairWallIn{side}', *sorted((side * 2.6, side * 3.4)), M['whiteTiles'])
for k, (y0, y1, z1) in enumerate(((-21.0, -16.0, 1.6), (-16.0, -11.0, 3.0), (-11.0, -6.5, 4.4), (-6.5, -2.0, HALL + 0.6))):
    block(f'fountain{k}', M['fountainTiles'], -2.6, 2.6, y0, y1, -0.3, z1)
    block(f'fountainPool{k}', M['water'], -2.0, 2.0, y0 + 0.4, y0 + 2.4, z1 - 0.25, z1 + 0.05, bevel=0)


# ------------------------------------------------------------------ the gatehouses, their rippling mosaic roofs, the mushroom, the chequered tower and its cross
def ripple_roof(name, cx, cy, z0, rx, ry, height, waves, amp, phase=0.0):
    prof = [(1.06, 0.0), (1.0, 0.08), (0.9, 0.3), (0.74, 0.55), (0.55, 0.75), (0.34, 0.9), (0.14, 0.98), (0.0, 1.0)]
    rings_ = []
    for f, h in prof:
        ring = []
        for k in range(64):
            t = 2 * math.pi * k / 64
            r = f * (1.0 + amp * math.sin(waves * t + phase) * (1.0 - h))
            ring.append(P(cx + rx * r * math.cos(t), cy + ry * r * math.sin(t), z0 + height * h + 0.6 * amp * math.sin(waves * t + phase) * (1.0 - h) * 6.0))
        rings_.append(ring)
    return loft(name, M['roofTiles'], rings_, cap=True, smooth=True)


WIN, DOORS = [], []


def gatehouse(name, cx, cy, w, d, wall_h):
    block(name, M['rubble'], cx - w / 2, cx + w / 2, cy - d / 2, cy + d / 2, -0.3, wall_h, bevel=0.004)
    ripple_roof(name + 'Roof', cx, cy, wall_h - 0.2, w * 0.62, d * 0.62, 5.0, 5, 0.08, phase=cx)
    for u in (-w * 0.25, w * 0.25):
        c = P(cx + u, cy - d / 2 - 0.05, 0)
        WIN.append((c.x, c.y, G + 3.0 * S, 1.0 * S, 1.6 * S, (0, -1), 'round'))
    c = P(cx, cy - d / 2 - 0.05, 0)
    DOORS.append((c.x, c.y, G + 0.0 * S, 1.6 * S, 2.6 * S, (0, -1), 'round'))


gatehouse('guardHouse', -13.0, -30.0, 8.5, 7.5, 6.0)
cylinder('mushroomStem', M['whiteTiles'], 0.9 * S, 3.0 * S, P(-13.0, -30.0, 10.4), segs=20, r2=0.7 * S)
lathe('mushroomCap', M['capRed'], [(2.2 * S, 0.0), (2.1 * S, 0.5 * S), (1.6 * S, 1.3 * S), (0.8 * S, 1.8 * S), (0.0, 1.95 * S)], P(-13.0, -30.0, 13.2), segs=32, smooth=True)
SPOTS = []
for k in range(22):
    t = rng.uniform(0, 2 * math.pi)
    h = rng.uniform(0.15, 0.9)
    r = 2.15 * (1.0 - h) ** 0.6 + 0.2
    SPOTS.append(((P(-13.0 + r * math.cos(t), -30.0 + r * math.sin(t), 13.2 + 1.95 * h + 0.05)).to_tuple(), rng.uniform(0.18, 0.3) * S, 0.5))
blob_cloud('mushroomSpots', M['white'], SPOTS, subdivisions=1)
gatehouse('pavilion', 13.0, -30.0, 8.5, 7.5, 6.5)
TX, TY = 16.5, -33.0
lathe('tower', M['chequer'], [(1.9 * S, 0.0), (1.8 * S, 8.0 * S), (1.55 * S, 14.0 * S), (1.2 * S, 17.0 * S), (0.9 * S, 18.0 * S), (0.0, 18.6 * S)], P(TX, TY, -0.3), segs=24, smooth=True)
for ax, ay, az, sx, sy, sz in ((0, 0, 20.3, 0.36, 0.36, 3.6), (0.95, 0, 20.4, 1.6, 0.36, 0.36), (-0.95, 0, 20.4, 1.6, 0.36, 0.36), (0, 0.95, 20.4, 0.36, 1.6, 0.36), (0, -0.95, 20.4, 0.36, 1.6, 0.36)):
    box(f'cross{ax}{ay}{sz}', M['whiteTiles'], P(TX + ax, TY + ay, az), (sx * S, sy * S, sz * S), bevel=0)
glazed('windows', WIN, M['whiteStone'], depth=0.3 * S)
glazed('doors', DOORS, M['whiteStone'], glass=M['door'], depth=0.3 * S)
for side in (-1, 1):
    xa, xb = sorted((side * 17.5, side * 80.0))
    slab(f'parkWall{side}', M['rubble'], [T(xa, -35.5), T(xb, -35.5), T(xb, -34.0), T(xa, -34.0)], G - 0.004, G + 3.4 * S, margin=0.02)
    slab(f'parkWallTop{side}', M['whiteTiles'], [T(xa, -35.7), T(xb, -35.7), T(xb, -33.8), T(xa, -33.8)], G + 3.4 * S, G + 4.0 * S, margin=0.02)

# ------------------------------------------------------------------ palms on the square, stone pines on the hill, and people
FRONDS = []
PALMS = ((-24.0, -26.0, 10.0, 0.0), (-29.0, -15.0, 11.0, 0.0), (-21.0, -8.0, 9.0, 0.0), (24.0, -24.0, 10.5, 0.0), (29.0, -13.0, 11.0, 0.0), (21.0, -6.0, 9.5, 0.0),
         (-26.0, 19.0, 8.0, TOP), (-11.0, 21.0, 9.0, TOP), (9.0, 20.0, 8.5, TOP), (25.0, 18.0, 9.0, TOP))
for k, (x, y, h, z0) in enumerate(PALMS):
    lean = rng.uniform(-0.6, 0.6)
    trunk = [P(x + lean * (j / 6) ** 2 * 2, y, z0 + h * j / 6) for j in range(7)]
    tube(f'palmTrunk{k}', M['trunk'], trunk, 0.3 * S)
    top = trunk[-1]
    for j in range(9):
        a = 2 * math.pi * j / 9 + k
        FRONDS.append([top, top + Vector((math.cos(a) * 1.8 * S, math.sin(a) * 1.8 * S, 0.6 * S)), top + Vector((math.cos(a) * 3.4 * S, math.sin(a) * 3.4 * S, -0.4 * S)),
                       top + Vector((math.cos(a) * 4.2 * S, math.sin(a) * 4.2 * S, -1.6 * S))])
cu = bpy.data.curves.new('palmFronds', 'CURVE')
cu.dimensions = '3D'
cu.bevel_depth = 0.34 * S
cu.bevel_resolution = 1
for pts in FRONDS:
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, q in enumerate(pts):
        sp.points[i].co = (*q, 1)
fr = bpy.data.objects.new('palmFronds', cu)
fr.data.materials.append(M['palm'])
bpy.context.scene.collection.objects.link(fr)
PINES = []
for p in scatter_on(ground, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.33 and p.z > G + 3.0 * S, seed=11):
    if abs(p.x / S) < WIDE + 2.0 and ((p.y - FY) / S < 22.0 or p.z < G + (TOP + 0.5) * S):
        continue
    if len(PINES) >= 60:
        break
    cylinder(f'pineTrunk{len(PINES)}', M['trunk'], 0.3 * S, 5.0 * S, (p.x, p.y, p.z - 0.2 * S), segs=6)
    PINES.append(((p.x, p.y, p.z + 6.0 * S), rng.uniform(3.0, 4.0) * S, 0.42))
blob_cloud('stonePines', M['pineG'], PINES)
for k, (x, y, z, shirt) in enumerate(((-5.0, -26.0, 0.0, 'red'), (4.0, -29.0, 0.0, 'blue'), (-10.0, -18.0, 0.0, 'yellow'), (-6.0, -13.0, 2.4, 'green'), (6.0, -8.0, 4.0, 'red'),
                                      (-8.0, 10.0, TOP + 0.12, 'blue'), (4.0, 16.0, TOP + 0.12, 'yellow'), (14.0, 6.0, TOP + 0.12, 'green'), (-22.0, 12.0, TOP + 0.12, 'red'),
                                      (24.0, 18.0, TOP + 0.12, 'blue'), (16.0, -22.0, 0.0, 'green'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.75)

R = Matrix.Rotation(math.radians(-32.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('park-guell')
