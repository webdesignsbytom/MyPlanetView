# The Tower of Belém in the high-quality look (hq.py), laid out in metres and seen from the river: the
# pale limestone bastion standing in the Tagus, its gun ports, its parapet of shield-shaped merlons each
# bearing the red cross of the Order of Christ, and the little ribbed-domed watchtowers on its corbels at
# its corners; the square tower rising behind it, its Renaissance loggia over the river, its paired
# windows with their balconies, the stone rope knotted round it, its own merlons and corner turrets; the
# rocks at its foot, the wooden footbridge to the promenade on the shore, and people.
# Run: blender -b --factory-startup -P belem-tower.py -- belem-tower-1024.png 1024 belem-tower.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1519)
M['lioz'] = masonry('liozStone', '#e8dfca', '#c9bea6', scale=170, rough=0.75, vary='#ded3bb')
M['liozPlain'] = material('liozPlain', '#ece4d1', 0.7, vary='#e2d9c4', vary_scale=20, bump=0.08, bump_scale=200)
M['crossRed'] = material('orderCross', '#b8312a', 0.5)
M['tagus'] = material('tagus', '#4d7f95', 0.1, vary='#5a8ca1', vary_scale=8, bump=0.05, bump_scale=30)
M['riprap'] = material('riprap', '#8f8a80', 0.9, vary='#7d786f', vary_scale=60, bump=0.6, bump_scale=200)

S = 0.042               # metres to the tile's units
Z0 = G + 0.01           # the river's level
TURN = -32.0 + 28.0     # seen from the river, a little from the side


def P(x, y, z):
    return Vector((x * S, (y + 5.0) * S, Z0 + z * S))


def T(x, y):
    return (x * S, (y + 5.0) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def prism(name, mat, outline, z0, z1):
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(x, y, z0)) for x, y in outline], [bm_.verts.new(P(x, y, z1)) for x, y in outline])
    return finish(name, bm_, mat, smooth_sides=False)


# ------------------------------------------------------------------ the river and the shore
slab('river', M['tagus'], [T(-60, -60), T(60, -60), T(60, 21), T(-60, 21)], G - 0.003, Z0, margin=0.02)
slab('embankment', M['lioz'], [T(-60, 21), T(60, 21), T(60, 60), T(-60, 60)], G - 0.003, Z0 + 1.6 * S, margin=0.02)
slab('promenade', M['paving'], [T(-60, 21.4), T(60, 21.4), T(60, 60), T(-60, 60)], Z0 + 1.6 * S, Z0 + 1.7 * S, margin=0.02)
slab('lawn', M['lawn'], [T(-60, 30), T(60, 30), T(60, 60), T(-60, 60)], Z0 + 1.7 * S, Z0 + 1.8 * S, margin=0.04)
BEFORE = set(bpy.data.objects)

# ------------------------------------------------------------------ the bastion: its walls, gun ports, terrace, merlons and watchtowers
BASTION = [(-10.5, 3.0), (10.5, 3.0), (12.5, -9.5), (6.5, -17.5), (-6.5, -17.5), (-12.5, -9.5)]
FOOT = [(x * 1.12, y * 1.08 - 0.4) for x, y in BASTION]
prism('rocks', M['riprap'], FOOT, -1.2, 0.5)
prism('bastion', M['lioz'], BASTION, -1.0, 8.0)
BAND = [(x * 1.015, y * 1.015) for x, y in BASTION]
prism('bastionBand', M['liozPlain'], BAND, 7.6, 8.2)
WIN = []


def along(poly, step, inset=0.0):
    """Points every `step` metres round a polygon's edges, with each edge's outward normal."""
    out = []
    cx, cy = sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly)
    for (ax, ay), (bx, by) in zip(poly, poly[1:] + poly[:1]):
        L = math.hypot(bx - ax, by - ay)
        nx, ny = (by - ay) / L, -(bx - ax) / L
        if (ax - cx) * nx + (ay - cy) * ny < 0:
            nx, ny = -nx, -ny
        n = max(1, int(L / step))
        for k in range(n):
            t = (k + 0.5) / n
            out.append((ax + (bx - ax) * t - nx * inset, ay + (by - ay) * t - ny * inset, nx, ny, (bx - ax) / L, (by - ay) / L))
    return out


for x, y, nx, ny, tx, ty in along(BASTION, 3.2):
    if y > 2.0:
        continue
    c = P(x + nx * 0.05, y + ny * 0.05, 0)
    WIN.append((c.x, c.y, Z0 + 3.2 * S, 0.9 * S, 1.1 * S, (nx, ny), 'round'))
# the parapet and its shield merlons, each with the red cross
prism('parapet', M['lioz'], [(x * 1.0, y * 1.0) for x, y in BASTION], 8.0, 9.3)
SHIELD = [(-0.5, 0.0), (0.5, 0.0), (0.5, 0.75), (0.38, 1.05), (0.0, 1.35), (-0.38, 1.05), (-0.5, 0.75)]
mer, red = bmesh.new(), bmesh.new()
for x, y, nx, ny, tx, ty in along(BASTION, 1.7, inset=0.3):
    if y > 2.5:
        continue
    def at(u, v, d):
        return P(x + tx * u + nx * d, y + ty * u + ny * d, 9.3 + v)
    add_prism(mer, [mer.verts.new(at(u, v, 0.25)) for u, v in SHIELD], [mer.verts.new(at(u, v, -0.25)) for u, v in SHIELD])
    for (u0, u1, v0, v1) in ((-0.07, 0.07, 0.2, 1.0), (-0.28, 0.28, 0.6, 0.74)):
        q = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
        add_prism(red, [red.verts.new(at(u, v, 0.3)) for u, v in q], [red.verts.new(at(u, v, 0.24)) for u, v in q])
finish('merlons', mer, M['liozPlain'], smooth_sides=False)
finish('merlonCrosses', red, M['crossRed'], smooth_sides=False)


def watchtower(name, x, y, z0, r, h):
    """A little round watchtower on its corbel, under a ribbed dome."""
    lathe(name + 'Corbel', M['liozPlain'], [(0.25 * S, 0.0), (r * 0.6 * S, 0.8 * S), (r * S, 1.8 * S)], P(x, y, z0 - 1.8), segs=16)
    cylinder(name, M['lioz'], r * S, h * S, P(x, y, z0), segs=16)
    cylinder(name + 'Ring', M['liozPlain'], (r + 0.15) * S, 0.35 * S, P(x, y, z0 + h - 0.2), segs=16)
    dome = lathe(name + 'Dome', M['liozPlain'], [((r + 0.05) * S, 0.0), (r * 0.95 * S, r * 0.5 * S), (r * 0.7 * S, r * 0.95 * S), (r * 0.3 * S, r * 1.2 * S), (0.0, r * 1.28 * S)], P(x, y, z0 + h + 0.1), segs=12)
    dome.data.polygons.foreach_set('use_smooth', [False] * len(dome.data.polygons))
    lathe(name + 'Finial', M['liozPlain'], [(0.0, 0.0), (0.22 * S, 0.3 * S), (0.0, 1.0 * S)], P(x, y, z0 + h + 0.1 + r * 1.25), segs=8, smooth=True)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        c = P(x + math.cos(a) * (r + 0.03), y + math.sin(a) * (r + 0.03), 0)
        WIN.append((c.x, c.y, Z0 + (z0 + 1.0) * S, 0.5 * S, 1.2 * S, (math.cos(a), math.sin(a)), 'round'))


for k, (x, y) in enumerate(BASTION):
    if y > 2.0:
        continue
    dx, dy = x / math.hypot(x, y + 7.0), (y + 7.0) / math.hypot(x, y + 7.0)
    watchtower(f'bastionTurret{k}', x + dx * 0.6, y + dy * 0.6, 7.6, 1.15, 3.2)

# ------------------------------------------------------------------ the tower: its storeys, loggia over the river, windows, rope, merlons and turrets
TX0, TX1, TY0, TY1 = -6.0, 6.0, -3.5, 8.5
TOP = 30.5
block('tower', M['lioz'], TX0, TX1, TY0, TY1, -1.0, TOP)
for z in (16.8, 23.2):
    block(f'towerBand{z:.0f}', M['liozPlain'], TX0 - 0.15, TX1 + 0.15, TY0 - 0.15, TY1 + 0.15, z, z + 0.4, bevel=0)
rope = []
for k in range(97):
    t = k / 96 * 4
    side = int(min(t, 3.999))
    f = t - side
    corners = [(TX0 - 0.25, TY0 - 0.25), (TX1 + 0.25, TY0 - 0.25), (TX1 + 0.25, TY1 + 0.25), (TX0 - 0.25, TY1 + 0.25), (TX0 - 0.25, TY0 - 0.25)]
    (ax, ay), (bx, by) = corners[side], corners[side + 1]
    rope.append(P(ax + (bx - ax) * f, ay + (by - ay) * f, 27.4))
tube('rope', M['liozPlain'], rope, 0.28 * S)
block('towerCornice', M['liozPlain'], TX0 - 0.3, TX1 + 0.3, TY0 - 0.3, TY1 + 0.3, TOP - 0.4, TOP + 0.1, bevel=0)
TOWER = [(TX0, TY0), (TX1, TY0), (TX1, TY1), (TX0, TY1)]
mer, red = bmesh.new(), bmesh.new()
for x, y, nx, ny, tx, ty in along(TOWER, 1.55, inset=0.3):
    def at(u, v, d):
        return P(x + tx * u + nx * d, y + ty * u + ny * d, TOP + 0.1 + v)
    add_prism(mer, [mer.verts.new(at(u, v * 0.9, 0.25)) for u, v in SHIELD], [mer.verts.new(at(u, v * 0.9, -0.25)) for u, v in SHIELD])
    for (u0, u1, v0, v1) in ((-0.07, 0.07, 0.15, 0.9), (-0.26, 0.26, 0.52, 0.65)):
        q = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
        add_prism(red, [red.verts.new(at(u, v, 0.3)) for u, v in q], [red.verts.new(at(u, v, 0.24)) for u, v in q])
finish('towerMerlons', mer, M['liozPlain'], smooth_sides=False)
finish('towerCrosses', red, M['crossRed'], smooth_sides=False)
for sx, x in ((-1, TX0), (1, TX1)):
    for sy, y in ((-1, TY0), (1, TY1)):
        watchtower(f'towerTurret{sx}{sy}', x + sx * 0.3, y + sy * 0.3, TOP - 1.0, 0.95, 2.8)
# the loggia over the river, its arches and balustrade
block('loggiaFloor', M['liozPlain'], -5.2, 5.2, TY0 - 2.4, TY0, 11.4, 12.0, bevel=0)
block('loggiaRoof', M['liozPlain'], -5.4, 5.4, TY0 - 2.6, TY0, 16.4, 17.0, bevel=0)
arcade_path('loggiaArches', M['lioz'], [((-5.2 + 10.4 * k / 5) * S, (TY0 - 2.3 + 5.0) * S) for k in range(6)], 0.4 * S, Z0 + 13.6 * S, 2.8 * S, 0.85 * S)
for k in range(6):
    x = -5.2 + 10.4 * k / 5
    cylinder(f'loggiaColumn{k}', M['liozPlain'], 0.2 * S, 2.3 * S, P(x, TY0 - 2.1, 12.0), segs=10)
for k in range(21):
    x = -5.0 + 10.0 * k / 20
    cylinder(f'baluster{k}', M['liozPlain'], 0.08 * S, 0.9 * S, P(x, TY0 - 2.25, 12.0), segs=6)
block('loggiaRail', M['liozPlain'], -5.2, 5.2, TY0 - 2.4, TY0 - 2.1, 12.9, 13.1, bevel=0)
# paired windows with little balconies on the other faces and above the loggia
for (nx, ny), (cx, cy) in (((0, -1), (0.0, TY0)), ((-1, 0), (TX0, 2.5)), ((1, 0), (TX1, 2.5)), ((0, 1), (0.0, TY1))):
    for z in (18.6, 24.2) + ((12.6,) if ny >= 0 else ()):
        for u in (-0.75, 0.75):
            c = P(cx + nx * 0.05 + (u if ny else 0.0), cy + ny * 0.05 + (u if nx else 0.0), 0)
            WIN.append((c.x, c.y, Z0 + z * S, 1.2 * S, 2.6 * S, (nx, ny), 'round'))
        bx, by = cx + nx * 0.6, cy + ny * 0.6
        block(f'balcony{nx}{ny}{z:.0f}', M['liozPlain'], bx - (0.4 if nx else 1.8), bx + (0.4 if nx else 1.8), by - (0.4 if ny else 1.8), by + (0.4 if ny else 1.8), z - 0.5, z - 0.1, bevel=0)
c = P(0.0, TY1 + 0.05, 0)
glazed('door', [(c.x, c.y, Z0 + 1.6 * S, 1.6 * S, 2.8 * S, (0, 1), 'round')], M['liozPlain'], glass=M['door'], depth=0.3 * S)
glazed('windows', WIN, M['liozPlain'], depth=0.3 * S)

# ------------------------------------------------------------------ the footbridge to the shore, and people
block('footbridgeDeck', M['wood'], -1.4, 1.4, TY1, 22.0, 1.3, 1.6, bevel=0)
POSTS = []
for k in range(8):
    y = TY1 + 1.0 + (22.0 - TY1 - 2.0) * k / 7
    for x in (-1.3, 1.3):
        cylinder(f'post{k}{x:+.0f}', M['wood'], 0.12 * S, 1.0 * S, P(x, y, 1.6), segs=6)
    for x in (-1.1, 1.1):
        cylinder(f'pile{k}{x:+.0f}', M['wood'], 0.15 * S, 2.6 * S, P(x, y, -1.2), segs=6)
for x in (-1.3, 1.3):
    block(f'rail{x:+.0f}', M['wood'], x - 0.08, x + 0.08, TY1, 22.0, 2.5, 2.65, bevel=0)
for k, (x, y, z, shirt) in enumerate(((-0.4, 13.0, 1.6, 'red'), (0.5, 17.5, 1.6, 'blue'), (-8.0, 25.0, 1.7, 'yellow'), (6.0, 26.0, 1.7, 'green'), (14.0, 24.0, 1.7, 'red'), (-3.0, -8.0, 9.3, 'blue'), (4.0, -12.0, 9.3, 'yellow'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.6)

R = Matrix.Rotation(math.radians(TURN), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('belem-tower')
