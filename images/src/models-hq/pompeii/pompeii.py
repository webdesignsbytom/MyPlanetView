# Pompeii in the high-quality look (hq.py), laid out in metres round its Forum: the long paved square
# with the broken columns of its porticoes (the two storeys standing again at its south-west corner,
# the pedestals of its statues), the Temple of Jupiter on its high podium at the north end, its stair,
# the stumps of its columns and the brick walls of its cella, the honorary arches either side; the
# Basilica's brick columns and the Temple of Apollo's colonnade to the west, the Building of Eumachia,
# the Macellum and the houses' roofless walls on their grid of stone-paved streets with stepping stones;
# umbrella pines, people; and Vesuvius looming behind, from real ground heights (Mapzen's terrain tiles,
# SRTM; _sources/dem/), seen in the direction it stands from the Forum, its bare grey cone over pine-
# dark lower slopes.
# Run: blender -b --factory-startup -P pompeii.py -- pompeii-1024.png 1024 pompeii.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *
from mathutils.bvhtree import BVHTree

setup()
rng = random.Random(79)
M['meadow'] = material('pompeiiMeadow', '#a3a565', 0.9, vary='#8f9457', vary_scale=14, bump=0.15, bump_scale=200)
M['dirt'] = material('pompeiiDirt', '#a38c6d', 0.95, vary='#957f62', vary_scale=20, bump=0.15, bump_scale=200)
M['slopes'] = material('vesuviusSlopes', '#5d7743', 0.9, vary='#4f6838', vary_scale=18, bump=0.3, bump_scale=120)
M['scrub'] = material('vesuviusScrub', '#8a8461', 0.9, vary='#7a735a', vary_scale=18, bump=0.3, bump_scale=120)
M['ash'] = material('vesuviusAsh', '#8a7c70', 0.95, vary='#77695e', vary_scale=24, bump=0.4, bump_scale=140)
M['ashDark'] = material('vesuviusAshDark', '#675a51', 0.95, vary='#5a4e46', vary_scale=24, bump=0.4, bump_scale=140)
M['tufa'] = material('noceraTufa', '#a99d88', 0.85, vary='#988c78', vary_scale=24, bump=0.3, bump_scale=160)
M['opus'] = masonry('opusIncertum', '#ad9c86', '#7f705f', scale=150, rough=0.9, vary='#9c8b76')
M['brickP'] = masonry('pompeiiBrick', '#b3664a', '#8c503b', scale=280, rough=0.85, vary='#a65d43')
M['stucco'] = material('pompeiiStucco', '#e9e2d3', 0.7, vary='#ddd5c5', vary_scale=20, bump=0.1, bump_scale=200)
M['basalt'] = masonry('basaltPaving', '#605c57', '#45423e', scale=110, rough=0.8, vary='#55524d')
M['forumSlabs'] = masonry('forumSlabs', '#b3a58f', '#968975', scale=70, rough=0.85, vary='#a69882')
M['pine'] = material('stonePine', '#3f5a32', 0.85, vary='#4b6a3a', vary_scale=16, bump=0.3, bump_scale=90)

S = 0.012               # metres to the tile's units, round the Forum
FX, FY = -0.15, -0.45   # the Forum's middle on the tile


def P(x, y, z):
    """A point x metres east and y north of the Forum's middle, z above the ground."""
    return Vector((FX + x * S, FY + y * S, G + z * S))


def T(x, y):
    return (FX + x * S, FY + y * S)


def on_base(x, y, room=0.0):
    return math.hypot(FX + x * S, FY + y * S) < PLINTH_R - 0.05 - room


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


# ------------------------------------------------------------------ Vesuvius behind, from real heights, and the plain
SUMMIT = (0.35, 1.05)                     # where the cone's top stands on the tile
LAT0, LON0 = 40.8213, 14.4261           # the Gran Cono's summit
MPU = 5000.0                            # the mountain's own scale: metres a tile unit
EXAG = 2.4
PLAIN = 20.0
elev = elevation('vesuvius', 12)
to = geo(LAT0, LON0, MPU, turn=-50.0)   # turned so it stands where it stands, seen from the Forum


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def H(x, y):
    d = math.hypot(x - SUMMIT[0], y - SUMMIT[1])
    w = smooth((0.72 - d) / 0.27) * smooth((1.47 - math.hypot(x, y)) / 0.17)
    if w <= 0.0:
        return 0.0
    return max(0.0, elev(*to(x - SUMMIT[0], y - SUMMIT[1])) - PLAIN) * EXAG / MPU * w


def pick(z, nz, x, y):
    real = z * MPU / EXAG
    if z < 0.0015:
        return 0
    if real > 1080.0:
        return 4
    if real > 700.0:
        return 3
    return 1 if real < 380.0 else 2


ground = terrain('ground', H, [M['meadow'], M['slopes'], M['scrub'], M['ash'], M['ashDark']], pick, rings=230, segs=560)
print('VESUVIUS height', round(max(v.co.z for v in ground.data.vertices) - G, 3))
# pines on the mountain's lower slopes
bm = bmesh.new()
bm.from_mesh(ground.data)
bm.faces.ensure_lookup_table()
hits = BVHTree.FromBMesh(bm)
WOOD = bmesh.new()
for k in range(2600):
    x, y = SUMMIT[0] + rng.uniform(-0.75, 0.75), SUMMIT[1] + rng.uniform(-0.75, 0.75)
    if math.hypot(x, y) > 1.42:
        continue
    hit = hits.ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)), 5.0)
    if hit[0] is None or bm.faces[hit[2]].material_index != 1:
        continue
    r = rng.uniform(0.007, 0.011)
    bmesh.ops.create_icosphere(WOOD, subdivisions=1, radius=r, matrix=Matrix.Translation(hit[0] + Vector((0, 0, r * 0.5))) @ Matrix.Diagonal((1, 1, 0.75, 1)))
finish('vesuviusPines', WOOD, M['pine'], smooth_all=True)
bm.free()

# ------------------------------------------------------------------ the streets: big basalt blocks, raised pavements, stepping stones
STREETS = (((-95.0, -64.0), (160.0, -58.0)), ((62.0, -64.0), (68.0, 120.0)), ((-95.0, -26.0), (-25.0, -20.0)), ((25.0, -8.0), (62.0, -2.0)),
           ((68.0, -4.0), (160.0, 2.0)), ((-10.0, -140.0), (-4.0, -64.0)), ((-68.0, -20.0), (-62.0, 120.0)))
for k, ((x0, y0), (x1, y1)) in enumerate(STREETS):
    slab(f'street{k}', M['basalt'], [T(x0, y0), T(x1, y0), T(x1, y1), T(x0, y1)], G - 0.002, G + 0.1 * S, margin=0.06)
    long_x = (x1 - x0) > (y1 - y0)
    for side in (0, 1):
        if long_x:
            a, b = (y0 - 1.4, y0) if side == 0 else (y1, y1 + 1.4)
            pts = [T(x0, a), T(x1, a), T(x1, b), T(x0, b)]
        else:
            a, b = (x0 - 1.4, x0) if side == 0 else (x1, x1 + 1.4)
            pts = [T(a, y0), T(b, y0), T(b, y1), T(a, y1)]
        slab(f'pavement{k}{side}', M['tufa'], pts, G - 0.002, G + 0.4 * S, margin=0.06)
STONES = bmesh.new()
for x, y, along_x in ((40.0, -61.0, False), (100.0, -61.0, False), (65.0, -30.0, True), (65.0, 30.0, True), (-45.0, -23.0, False), (110.0, -1.0, False)):
    for j in (-1.6, 0.0, 1.6):
        sx, sy = (x, y + j) if not along_x else (x + j, y)
        if on_base(sx, sy):
            bmesh.ops.create_cube(STONES, size=1.0, matrix=Matrix.Translation(P(sx, sy, 0.22)) @ Matrix.Diagonal((1.0 * S, 1.0 * S, 0.45 * S, 1)))
finish('steppingStones', STONES, M['tufa'], smooth_sides=False)

# ------------------------------------------------------------------ the Forum: its paving, porticoes, columns and statue pedestals
block('forumPaving', M['forumSlabs'], -19.0, 19.0, -50.0, 50.0, -0.05, 0.3)
for name, x0, x1, y0, y1 in (('W', -25.0, -18.95, -56.0, 50.0), ('E', 18.95, 25.0, -56.0, 50.0), ('S', -18.95, 18.95, -56.0, -49.95)):
    block('portico' + name, M['tufa'], x0, x1, y0, y1, -0.05, 0.55)
COL_POS = [(-19.4, -48.6 + 3.24 * k) for k in range(31)] + [(19.4, -48.6 + 3.24 * k) for k in range(31)] + [(-16.2 + 3.24 * k, -50.4) for k in range(11)]
TWO_STOREY = [p for p in COL_POS if (p[1] == -50.4 and p[0] < -2.0) or (p[0] == -19.4 and p[1] < -36.0)]
for k, (x, y) in enumerate(COL_POS):
    if (x, y) in TWO_STOREY:
        column(f'forumColumn{k}', M['travertine'], *T(x, y), G + 0.5 * S, 5.6 * S, 0.46 * S)
        column(f'upperColumn{k}', M['travertine'], *T(x, y), G + 6.95 * S, 4.2 * S, 0.3 * S)
        continue
    h = rng.choice((5.6, 5.6, 4.4, 3.2, 2.1, 1.2, 0.7))
    if h > 5.5:
        column(f'forumColumn{k}', M['travertine'], *T(x, y), G + 0.5 * S, h * S, 0.46 * S)
    else:
        cylinder(f'forumColumn{k}', M['travertine'], 0.46 * S, h * S, P(x, y, 0.5), segs=12, r2=0.44 * S)
# the two storeys standing again: architraves over the lower and the upper columns
for z0, z1 in ((6.1, 7.0), (11.15, 11.85)):
    block(f'architraveS{z0}', M['travertine'], -17.0, -2.6, -51.0, -49.8, z0, z1)
    block(f'architraveW{z0}', M['travertine'], -20.0, -18.8, -49.0, -35.0, z0, z1)
for k, (x, y, w, d, h) in enumerate(((-8.0, -40.0, 3.0, 5.0, 2.4), (6.0, -40.0, 3.0, 5.0, 2.4), (-12.0, -10.0, 2.4, 3.6, 2.0), (12.0, 4.0, 2.4, 3.6, 2.0), (0.0, -28.0, 4.0, 2.4, 1.6))):
    block(f'pedestal{k}', M['stucco'], x - w / 2, x + w / 2, y - d / 2, y + d / 2, 0.25, 0.25 + h, bevel=0.0005)

# ------------------------------------------------------------------ the Temple of Jupiter at the north end
block('podium', M['tufa'], -8.5, 8.5, 50.0, 83.0, -0.05, 3.3)
block('podiumBase', M['tufa'], -8.8, 8.8, 49.7, 83.3, -0.05, 0.5)
block('podiumCornice', M['travertine'], -8.7, 8.7, 49.9, 83.2, 3.0, 3.35)
stair = [(44.0, -0.05)] + [p for k in range(8) for p in ((44.0 + 0.75 * k, 0.41 * (k + 1)), (44.75 + 0.75 * k, 0.41 * (k + 1)))] + [(50.2, 3.28), (50.2, -0.05)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(-6.0, y, z)) for y, z in stair], [bm.verts.new(P(6.0, y, z)) for y, z in stair])
finish('templeStair', bm, M['travertine'], smooth_sides=False)
for sx in (-1, 1):
    x0, x1 = sorted((sx * 5.9, sx * 8.5))
    block(f'rostrum{sx}', M['tufa'], x0, x1, 44.0, 50.1, -0.05, 1.8)
for k, (x, y, h) in enumerate(((-7.0, 52.0, 6.8), (-4.2, 52.0, 2.6), (-1.4, 52.0, 1.4), (1.4, 52.0, 3.4), (4.2, 52.0, 1.0), (7.0, 52.0, 5.2),
                               (-7.0, 55.5, 2.0), (7.0, 55.5, 3.8), (-4.2, 55.5, 1.1), (4.2, 55.5, 1.6))):
    cylinder(f'templeColumn{k}', M['travertine'], 0.58 * S, h * S, P(x, y, 3.3), segs=14, r2=0.55 * S)
# the cella: brick walls broken at the top, its door wide open
BRICK, OPUS = bmesh.new(), bmesh.new()


def wall(bm, x0, y0, x1, y1, h, t=0.6, gaps=(), jag=0.35, z0=0.0, piece=1.6):
    """A ruined wall from (x0, y0) to (x1, y1) metres, `h` tall with its top broken piece by piece;
    `gaps` the stretches (metres along it) left open for doorways."""
    L = math.hypot(x1 - x0, y1 - y0)
    n = max(1, int(round(L / piece)))
    ang = math.atan2(y1 - y0, x1 - x0)
    for k in range(n):
        u0, u1 = L * k / n, L * (k + 1) / n
        if any(g0 < (u0 + u1) / 2 < g1 for g0, g1 in gaps):
            continue
        mx, my = x0 + (x1 - x0) * (u0 + u1) / (2 * L), y0 + (y1 - y0) * (u0 + u1) / (2 * L)
        if not on_base(mx, my, room=0.02):
            continue
        hh = h * (1.0 - jag * rng.random())
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(mx, my, z0 + (hh - 0.05) / 2)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal(((u1 - u0) * S, t * S, (hh + 0.05) * S, 1)))


wall(BRICK, -7.3, 59.6, 7.3, 59.6, 9.0, t=1.2, gaps=((5.0, 9.6),), jag=0.25, z0=3.3)
wall(BRICK, -7.3, 82.0, 7.3, 82.0, 9.5, t=1.2, jag=0.2, z0=3.3)
for sx in (-1, 1):
    wall(BRICK, sx * 6.7, 60.2, sx * 6.7, 81.4, 9.0, t=1.2, jag=0.3, z0=3.3)


def arch(name, mat, x, y, w=9.0, h=11.0, opening=4.4, spring=6.0, depth=3.0):
    """An honorary arch facing the Forum, open through."""
    o = opening / 2
    out = [(-w / 2, h), (-w / 2, -0.05), (-o, -0.05), (-o, spring)] + [(o * math.cos(math.pi - math.pi * k / 12), spring + o * math.sin(math.pi * k / 12)) for k in range(1, 12)] + [(o, spring), (o, -0.05), (w / 2, -0.05), (w / 2, h)]
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x + u, y, z)) for u, z in out], [bm.verts.new(P(x + u, y + depth, z)) for u, z in out])
    finish(name, bm, mat, smooth_sides=False)
    block(name + 'Cornice', M['travertine'], x - w / 2 - 0.3, x + w / 2 + 0.3, y - 0.3, y + depth + 0.3, h - 0.05, h + 0.6)


arch('archEast', M['brickP'], 14.0, 50.5)
arch('archWest', M['brickP'], -14.0, 50.5, h=9.0)

# ------------------------------------------------------------------ the Basilica: its brick columns in their rectangle, its broken walls
wall(OPUS, -75.0, -56.0, -26.0, -56.0, 4.5)
wall(OPUS, -75.0, -28.0, -26.0, -28.0, 4.0, gaps=((10.0, 13.0),))
wall(OPUS, -75.0, -56.0, -75.0, -28.0, 5.5)
wall(OPUS, -26.0, -56.0, -26.0, -28.0, 2.5, gaps=((2.0, 6.0), (8.0, 12.0), (14.0, 18.0), (20.0, 24.0)))
slab('basilicaFloor', M['dirt'], [T(-74.7, -55.7), T(-26.3, -55.7), T(-26.3, -28.3), T(-74.7, -28.3)], G - 0.002, G + 0.2 * S, margin=0.06)
for k in range(12):
    for y in (-49.0, -35.0):
        x = -67.0 + 3.3 * k
        cylinder(f'basilicaColumn{k}{y}', M['brickP'], 0.6 * S, rng.choice((2.2, 3.0, 4.2, 5.5, 2.6)) * S, P(x, y, 0.2), segs=14)
for k, y in enumerate((-45.5, -42.0, -38.5)):
    for x in (-67.0, -30.7):
        cylinder(f'basilicaEnd{k}{x}', M['brickP'], 0.6 * S, rng.choice((2.2, 3.0, 4.2)) * S, P(x, y, 0.2), segs=14)

# ------------------------------------------------------------------ the Temple of Apollo: its colonnade round the court, the temple on its podium
wall(OPUS, -62.0, -20.0, -26.0, -20.0, 4.0)
wall(OPUS, -62.0, 30.0, -26.0, 30.0, 4.5)
wall(OPUS, -62.0, -20.0, -62.0, 30.0, 5.0)
wall(OPUS, -26.0, -20.0, -26.0, 30.0, 4.5, gaps=((12.0, 15.0), (30.0, 33.0)))
block('apolloCourt', M['dirt'], -61.7, -26.3, -19.7, 29.7, -0.05, 0.15)
for k in range(10):
    for x in (-57.0, -31.0):
        y = -15.0 + 4.4 * k
        h = rng.choice((5.0, 5.0, 3.6, 2.2))
        cylinder(f'apolloColumn{k}{x}', M['stucco'], 0.38 * S, h * S, P(x, y, 0.15), segs=12)
for k in range(5):
    for y in (-15.0, 24.6):
        x = -52.6 + 4.3 * k
        cylinder(f'apolloColumnEnd{k}{y}', M['stucco'], 0.38 * S, rng.choice((5.0, 3.0, 2.0)) * S, P(x, y, 0.15), segs=12)
block('apolloPodium', M['tufa'], -48.0, -40.0, 2.0, 20.0, -0.05, 2.6)
block('apolloStair', M['travertine'], -46.5, -41.5, -1.0, 2.05, -0.05, 1.5)
for k, (x, y, h) in enumerate(((-47.0, 4.0, 3.5), (-44.0, 4.0, 1.4), (-41.0, 4.0, 4.6))):
    cylinder(f'apolloTempleColumn{k}', M['stucco'], 0.45 * S, h * S, P(x, y, 2.6), segs=12)
block('apolloAltar', M['travertine'], -45.5, -42.5, -6.0, -4.0, 0.1, 1.3)

# ------------------------------------------------------------------ the Building of Eumachia, the Lares, the Macellum and the houses: roofless walls
wall(OPUS, 25.0, -56.0, 25.0, -8.0, 7.0, t=0.9, gaps=((18.0, 23.0),))
wall(OPUS, 62.0, -56.0, 62.0, -8.0, 5.0)
wall(OPUS, 25.0, -56.0, 62.0, -56.0, 5.0)
wall(OPUS, 25.0, -8.0, 62.0, -8.0, 5.5)
wall(BRICK, 31.0, -50.0, 56.0, -50.0, 3.0, t=0.5)
wall(BRICK, 31.0, -14.0, 56.0, -14.0, 3.0, t=0.5)
wall(BRICK, 31.0, -50.0, 31.0, -14.0, 3.0, t=0.5, gaps=((15.0, 21.0),))
wall(OPUS, 25.0, -2.0, 25.0, 50.0, 5.5, gaps=((6.0, 12.0), (30.0, 34.0)))
wall(OPUS, 25.0, -2.0, 62.0, -2.0, 4.0)
wall(OPUS, 62.0, -2.0, 62.0, 50.0, 4.5)
wall(OPUS, 25.0, 50.0, 62.0, 50.0, 5.0)
wall(OPUS, 25.0, 20.0, 62.0, 20.0, 3.5, gaps=((12.0, 16.0),))
for k in range(12):
    a = 2 * math.pi * k / 12
    cylinder(f'tholos{k}', M['stucco'], 0.4 * S, rng.choice((0.8, 1.2, 1.8)) * S, P(44.0 + 4.0 * math.cos(a), 36.0 + 4.0 * math.sin(a), -0.05), segs=10)


def houses(x0, x1, y0, y1):
    """A block of houses as they stand: outer walls, rooms off atria, doorways onto the streets."""
    W = x1 - x0
    wall(OPUS, x0, y0, x1, y0, rng.uniform(3.0, 5.0), gaps=((W * 0.3, W * 0.3 + 3.0), (W * 0.7, W * 0.7 + 3.0)))
    wall(OPUS, x0, y1, x1, y1, rng.uniform(3.0, 5.0), gaps=((W * 0.45, W * 0.45 + 3.0),))
    wall(OPUS, x0, y0, x0, y1, rng.uniform(3.0, 5.0), gaps=(((y1 - y0) * 0.5, (y1 - y0) * 0.5 + 3.0),))
    wall(OPUS, x1, y0, x1, y1, rng.uniform(3.0, 5.0))
    x = x0 + rng.uniform(9.0, 14.0)
    while x < x1 - 6.0:
        door = (y1 - y0) * rng.uniform(0.2, 0.7)
        wall(BRICK if rng.random() < 0.3 else OPUS, x, y0, x, y1, rng.uniform(1.5, 3.6), t=0.45, gaps=((door, door + 2.0),), jag=0.5)
        x += rng.uniform(9.0, 15.0)
    y = y0 + rng.uniform(8.0, 12.0)
    while y < y1 - 6.0:
        a = x0 + rng.uniform(0.0, W * 0.4)
        wall(OPUS, a, y, a + rng.uniform(6.0, W * 0.6), y, rng.uniform(1.2, 3.0), t=0.45, jag=0.5)
        y += rng.uniform(8.0, 13.0)


for x0, x1, y0, y1 in ((70.0, 120.0, -56.0, -6.0), (70.0, 120.0, 4.0, 56.0), (-60.0, -12.0, -120.0, -66.0), (-2.0, 60.0, -120.0, -66.0), (70.0, 130.0, -120.0, -66.0),
                       (-60.0, -26.0, 34.0, 80.0), (-120.0, -77.0, -56.0, -28.0), (-120.0, -70.0, -18.0, 30.0)):
    slab(f'houseFloor{x0}{y0}', M['dirt'], [T(x0 + 0.3, y0 + 0.3), T(x1 - 0.3, y0 + 0.3), T(x1 - 0.3, y1 - 0.3), T(x0 + 0.3, y1 - 0.3)], G - 0.002, G + 0.06 * S, margin=0.06)
    houses(x0, x1, y0, y1)
finish('ruinWalls', OPUS, M['opus'], smooth_sides=False)
finish('brickWalls', BRICK, M['brickP'], smooth_sides=False)


# ------------------------------------------------------------------ umbrella pines, people
def stone_pine(name, x, y, h):
    lean = rng.uniform(-0.25, 0.25)
    top = P(x + lean * h * 0.3, y, h * 0.8)
    bar(name + 'Trunk', M['trunk'], P(x, y, -0.05), top, 0.6 * S)
    bm = bmesh.new()
    for k in range(7):
        a = 2 * math.pi * k / 7 + rng.random()
        r = h * rng.uniform(0.18, 0.26)
        off = Vector((math.cos(a) * h * 0.22, math.sin(a) * h * 0.22, rng.uniform(0.0, 0.08) * h)) * S
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r * S, matrix=Matrix.Translation(top + off) @ Matrix.Diagonal((1, 1, 0.45, 1)))
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=h * 0.3 * S, matrix=Matrix.Translation(top + Vector((0, 0, 0.06 * h * S))) @ Matrix.Diagonal((1, 1, 0.4, 1)))
    finish(name, bm, M['pine'], smooth_all=True)


for k, (x, y, h) in enumerate(((-80.0, 30.0, 16.0), (105.0, 65.0, 15.0), (-45.0, 62.0, 14.0), (120.0, 40.0, 15.0))):
    if on_base(x, y, room=0.1):
        stone_pine(f'pine{k}', x, y, h)
for k, (x, y) in enumerate(((-70.0, 45.0), (35.0, 62.0), (60.0, -62.0))):
    cypress(f'cypress{k}', *T(x, y), h=0.13, r=0.018)
for k, (x, y, shirt) in enumerate(((-4.0, -30.0, 'red'), (5.0, -18.0, 'blue'), (-10.0, 0.0, 'yellow'), (8.0, 15.0, 'green'), (-2.0, 30.0, 'red'), (3.0, 42.0, 'blue'),
                                   (-14.0, -44.0, 'green'), (12.0, -46.0, 'yellow'), (40.0, -61.0, 'red'), (-45.0, -40.0, 'blue'))):
    person(f'p{k}', *T(x, y), rng.random() * 6, shirt, z=G + 0.3 * S, scale=0.55)

render('pompeii')
