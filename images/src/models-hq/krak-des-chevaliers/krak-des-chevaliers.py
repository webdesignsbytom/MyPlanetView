# Krak des Chevaliers in the high-quality look (hq.py), laid out in metres (drawn a little smaller than
# it is, to fit): the Hospitallers' castle on its hilltop over the Homs Gap; the outer wall all round
# with its round towers and battlements; between it and the inner ward on the south side the moat's
# reservoir of water; the inner ward on higher rock, its walls rising from the great sloping talus to
# the three massive southern towers; inside, the knights' hall with its Gothic loggia on the courtyard
# and the chapel; the grassy slopes of the hill with their rocks and bushes, the road up to the gate,
# and people.
# Run: blender -b --factory-startup -P krak-des-chevaliers.py -- krak-des-chevaliers-1024.png 1024 krak-des-chevaliers.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1142)
M['krak'] = material('krakStone', '#d6c7a6', 0.85, vary='#c4b391', vary_scale=16, bump=0.35, bump_scale=220)
M['krakDark'] = material('krakStoneDark', '#ab9876', 0.85, vary='#9a876a', vary_scale=16, bump=0.35, bump_scale=220)
M['krakInner'] = material('krakStoneInner', '#b59a70', 0.85, vary='#a2875f', vary_scale=16, bump=0.35, bump_scale=220)
M['hill'] = material('krakHill', '#88a54e', 0.9, vary='#7a9846', vary_scale=10, bump=0.3, bump_scale=200)
M['hillRock'] = material('krakRock', '#a09a88', 0.9, vary='#8c8676', vary_scale=8, bump=0.5, bump_scale=80)
M['court'] = material('krakCourt', '#c6b593', 0.9, vary='#b8a785', vary_scale=40)
M['reservoir'] = material('berquilla', '#4d7f86', 0.06, coat=0.8)
M['bush'] = material('krakBush', '#5c7f36', 0.85, vary='#6a8d40', vary_scale=14, bump=0.3, bump_scale=90)
M['opening'] = material('krakOpening', '#4f4434', 0.9)

S = 0.0186              # metres to the tile's units
FY = 4.0                # the plan's middle on the tile's
Z0 = G
H0 = 20.0               # the hilltop's level inside the outer wall
AX, AY, AC = 62.0, 50.0, 6.0     # the outer wall's oval: half-axes and centre (y)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def oval(X, Y):
    return math.hypot(X / AX, (Y - AC) / AY)


def ground(X, Y):
    """The hill: level inside the outer wall, its slopes falling away to the plain."""
    e = oval(X, Y)
    return H0 * (1.0 - smooth((e - 1.03) / 0.42)) + 1.2 * math.sin(X * 0.07) * math.cos(Y * 0.05) * smooth((e - 1.1) / 0.3)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.12)
    return ground(x / S, y / S + FY) * S * rim


def pick(z, nz, x, y):
    if oval(x / S, y / S + FY) < 1.02:
        return 2
    return 1 if nz < 0.5 else 0


land = terrain('hill', H, [M['hill'], M['hillRock'], M['court']], pick, rings=170, segs=420)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def merlon_row(bm, xa, ya, xb, yb, z, step=2.2):
    n = max(1, int(math.hypot(xb - xa, yb - ya) / step))
    ang = math.atan2(yb - ya, xb - xa)
    for k in range(n):
        t = (k + 0.5) / n
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(xa + (xb - xa) * t, ya + (yb - ya) * t, z + 0.8)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((1.2 * S, 0.8 * S, 1.6 * S, 1)))


def wall_ring(name, pts, z0, z1, thick, mat, merlons):
    """A closed ring of wall through pts (its outer face on them, the thickness inwards to the centroid)."""
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    bm = bmesh.new()
    for (xa, ya), (xb, yb) in zip(pts, pts[1:] + pts[:1]):
        ang = math.atan2(yb - ya, xb - xa)
        nx, ny = -math.sin(ang), math.cos(ang)
        if (cx - (xa + xb) / 2) * nx + (cy - (ya + yb) / 2) * ny < 0:
            nx, ny = -nx, -ny
        sec = [(0.0, z0), (thick + 1.0, z0), (thick, z1), (0.0, z1)]
        a = [bm.verts.new(P(xa + nx * u, ya + ny * u, z)) for u, z in sec]
        b = [bm.verts.new(P(xb + nx * u, yb + ny * u, z)) for u, z in sec]
        add_prism(bm, a, b)
        merlon_row(merlons, xa + nx * 0.6, ya + ny * 0.6, xb + nx * 0.6, yb + ny * 0.6, z1)
    return finish(name, bm, mat, smooth_sides=False)


def tower(name, x, y, z0, z1, r, mat, merlons, square=False):
    if square:
        box(name, mat, P(x, y, (z0 + z1) / 2), (2 * r * S, 2 * r * S, (z1 - z0) * S), bevel=0.001)
        for e in range(4):
            a = math.pi / 2 * e
            c, s_ = math.cos(a), math.sin(a)
            merlon_row(merlons, x + c * (r - 0.6) - s_ * r, y + s_ * (r - 0.6) + c * r, x + c * (r - 0.6) + s_ * r, y + s_ * (r - 0.6) - c * r, z1)
        return
    cylinder(name, mat, r * S, (z1 - z0) * S, P(x, y, z0), segs=40, r2=(r - 0.4) * S)
    n = int(2 * math.pi * r / 2.3)
    for j in range(n):
        a = 2 * math.pi * j / n
        bmesh.ops.create_cube(merlons, size=1.0, matrix=Matrix.Translation(P(x + (r - 0.9) * math.cos(a), y + (r - 0.9) * math.sin(a), z1 + 0.8)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Diagonal((1.2 * S, 0.8 * S, 1.6 * S, 1)))


MERLONS = bmesh.new()
WIN = []
# ------------------------------------------------------------------ the outer wall round the oval, with its round towers
OUTER = [(AX * 0.97 * math.cos(t), AC + AY * 0.97 * math.sin(t)) for t in [2 * math.pi * k / 18 for k in range(18)]]
wall_ring('outerWall', OUTER, H0 - 5.0, H0 + 5.0, 3.0, M['krak'], MERLONS)
for k, (x, y) in enumerate(OUTER):
    if k % 2 == 0:
        tower(f'outerTower{k}', x, y, H0 - 5.0, H0 + 8.0, 4.6, M['krak'], MERLONS)
# the gate tower on the east, the road up to it
GX, GY = OUTER[1]
box('gateTower', M['krakDark'], P(GX + 1.0, GY, H0 + 4.0), (9.0 * S, 9.0 * S, 18.0 * S), rot_z=math.radians(20), bevel=0.001)
c = P(GX + 5.6, GY + 1.4, 0)
WIN.append((c.x, c.y, Z0 + (H0 - 0.5) * S, 3.0 * S, 5.0 * S, (0.94, 0.34), 'pointed'))

# ------------------------------------------------------------------ the reservoir between the walls on the south
slab('reservoir', M['reservoir'], [(x * S, (y - FY) * S) for x, y in ((-30.0, -35.0), (28.0, -35.0), (34.0, -22.0), (-36.0, -22.0))], Z0 + (H0 + 0.05) * S, Z0 + (H0 + 0.4) * S, margin=0.06)

# ------------------------------------------------------------------ the inner ward: the talus, its walls, the three great southern towers
H1 = H0 + 6.0           # the inner ward's courtyard
INNER = [(-38.0, -16.0), (36.0, -16.0), (42.0, 10.0), (30.0, 38.0), (-28.0, 40.0), (-42.0, 12.0)]
# the great sloping talus along the south and west, from the reservoir's edge to the wall's mid height
bm = bmesh.new()
TAL = [(-48.0, 14.0), (-46.0, -24.0), (42.0, -24.0), (44.0, -2.0)]
for (xa, ya), (xb, yb) in zip(TAL, TAL[1:]):
    ang = math.atan2(yb - ya, xb - xa)
    nx, ny = -math.sin(ang), math.cos(ang)
    if (0.0 - (xa + xb) / 2) * nx + (12.0 - (ya + yb) / 2) * ny < 0:
        nx, ny = -nx, -ny
    sec = [(0.0, H0 - 1.0), (12.0, H0 + 18.0), (16.0, H0 + 18.0), (16.0, H0 - 1.0)]
    a = [bm.verts.new(P(xa + nx * u, ya + ny * u, z)) for u, z in sec]
    b = [bm.verts.new(P(xb + nx * u, yb + ny * u, z)) for u, z in sec]
    add_prism(bm, a, b)
finish('talus', bm, M['krakInner'], smooth_sides=False)
wall_ring('innerWall', INNER, H0, H0 + 24.0, 4.0, M['krakInner'], MERLONS)
slab('courtyard', M['court'], [(x * S, (y - FY) * S) for x, y in INNER], Z0 + H0 * S, Z0 + H1 * S, margin=0.06)
for k, (x, y, r, top, sq) in enumerate(((-38.0, -16.0, 10.0, H0 + 32.0, False), (0.0, -18.0, 8.0, H0 + 30.0, False), (36.0, -16.0, 8.5, H0 + 30.0, True), (-28.0, 40.0, 7.0, H0 + 28.0, False), (30.0, 38.0, 7.0, H0 + 28.0, False), (42.0, 10.0, 6.0, H0 + 27.0, False))):
    tower(f'innerTower{k}', x, y, H0 - 1.0, top, r, M['krakInner'], MERLONS, square=sq)
    for j in range(3):
        a = math.radians(225 + 30 * j)
        c = P(x + r * math.cos(a) * 1.01, y + r * math.sin(a) * 1.01, 0)
        WIN.append((c.x, c.y, Z0 + (top - 8.0) * S, 0.8 * S, 2.2 * S, (math.cos(a), math.sin(a)), 'pointed'))
finish('merlons', MERLONS, M['krak'], smooth_sides=False)

# ------------------------------------------------------------------ inside: the knights' hall with its Gothic loggia, the chapel
box('hall', M['krak'], P(-24.0, 14.0, H1 + 5.0), (14.0 * S, 34.0 * S, 10.0 * S), bevel=0.001)
arcade_path('loggia', M['krakDark'], [((-17.0) * S, (y - FY) * S) for y in (0.0, 6.0, 12.0, 18.0, 24.0, 30.0)], 1.4 * S, Z0 + (H1 + 2.6) * S, 5.0 * S, 2.2 * S, pointed=0.7, normal_side=-1)
for y in (0.0, 6.0, 12.0, 18.0, 24.0, 30.0):
    box(f'loggiaPier{y:.0f}', M['krakDark'], P(-16.3, y, H1 + 1.3), (1.4 * S, 1.0 * S, 2.6 * S), bevel=0)
box('chapel', M['krak'], P(10.0, 26.0, H1 + 6.0), (24.0 * S, 11.0 * S, 12.0 * S), bevel=0.001)
lathe('chapelVault', M['krakDark'], [(5.6 * S, 0.0), (5.0 * S, 1.6 * S), (3.0 * S, 2.8 * S), (0.0, 3.2 * S)], (0, 0, 0), segs=24, sx=2.2, sy=1.0, matrix=Matrix.Translation(P(10.0, 26.0, H1 + 12.0)))
cylinder('chapelTower', M['krak'], 2.0 * S, 20.0 * S, P(-6.0, 24.0, H1), segs=16)
lathe('chapelTowerCap', M['krakDark'], [(2.3 * S, 0.0), (2.0 * S, 1.0 * S), (0.0, 2.6 * S)], P(-6.0, 24.0, H1 + 20.0), segs=16)
for j in range(4):
    c = P(-2.0 + 6.0 * j, 20.44, 0)
    WIN.append((c.x, c.y, Z0 + (H1 + 5.0) * S, 1.2 * S, 3.6 * S, (0, -1), 'pointed'))
box('courtWell', M['krakDark'], P(8.0, 6.0, H1 + 0.5), (3.0 * S, 3.0 * S, 1.0 * S), bevel=0.001)
glazed('openings', WIN, M['krakDark'], glass=M['opening'], depth=0.4 * S, bars=False)

# ------------------------------------------------------------------ bushes on the slopes, people
BUSH = []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 0 and math.hypot(p.x, p.y) < 1.36, seed=11):
    if oval(p.x / S, p.y / S + FY) < 1.12:
        continue
    BUSH.append(((p.x, p.y, p.z + 1.0 * S), rng.uniform(1.2, 2.2) * S, 0.75))
    if len(BUSH) >= 160:
        break
blob_cloud('bushes', M['bush'], BUSH)
for k, (x, y, z, shirt) in enumerate(((10.0, 4.0, H1, 'red'), (-6.0, 12.0, H1, 'blue'), (0.0, -34.0, H0, 'yellow'), (20.0, -33.0, H0, 'green'), (-12.0, -36.0, H0, 'red'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.2)

R = Matrix.Rotation(math.radians(-32.0 + 8.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('krak-des-chevaliers')
