# The Alhambra in the high-quality look (hq.py), seen as from the Albaicín across the Darro, laid out in
# metres: the red fortress-palace along the top of its wooded hill, its long rammed-earth walls and their
# square towers, crenellated; the Alcazaba at its western point with the Torre de la Vela, its bell and
# flags, the keep and the barracks' ruined walls; the Comares Tower over the Nasrid palaces, the Court of
# the Myrtles with its long pool between hedges, the Court of the Lions within its arcades, the palaces'
# tiled roofs; the Palace of Charles V, square round its circular two-storey court; the Partal's portico
# and pool; the gardens, cypresses and the woods on the slopes; the Darro below; and the snowy Sierra
# Nevada behind, from real ground heights (Mapzen's terrain tiles, SRTM; _sources/dem/).
# Run: blender -b --factory-startup -P alhambra.py -- alhambra-1024.png 1024 alhambra.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *
from mathutils.bvhtree import BVHTree

setup()
rng = random.Random(1238)
M['tapial'] = material('tapial', '#c27a52', 0.9, vary='#ad6a46', vary_scale=18, bump=0.3, bump_scale=150)
M['tapialLight'] = material('tapialLight', '#cf8d65', 0.85, vary='#c07f58', vary_scale=18, bump=0.25, bump_scale=150)
M['tilesA'] = banded(material('alhambraTiles', '#b4643f', 0.7, vary='#9f5636', vary_scale=12, bump=0.12, bump_scale=200), 'X', 300.0, strength=0.3)
M['plasterA'] = material('nasridPlaster', '#e9dcc4', 0.75, vary='#dccdb2', vary_scale=18, bump=0.08, bump_scale=200)
M['charles'] = material('charlesStone', '#d8c59c', 0.75, vary='#cbb68b', vary_scale=18, bump=0.15, bump_scale=160)
M['grounds'] = material('alhambraGrounds', '#b49c76', 0.95, vary='#a58d68', vary_scale=20, bump=0.15, bump_scale=200)
M['hillside'] = material('sabikaHill', '#7a8650', 0.9, vary='#6b7845', vary_scale=14, bump=0.25, bump_scale=160)
M['valley'] = material('darroValley', '#8f9a5c', 0.9, vary='#808c52', vary_scale=14, bump=0.2, bump_scale=200)
M['scrubS'] = material('sierraScrub', '#8b8a64', 0.9, vary='#7b7a58', vary_scale=18, bump=0.3, bump_scale=120)
M['rockS'] = material('sierraRock', '#8c8274', 0.95, vary='#7b7266', vary_scale=22, bump=0.4, bump_scale=140)
M['elm'] = material('alhambraElms', '#4b6a33', 0.85, vary='#587a3c', vary_scale=16, bump=0.3, bump_scale=90)
M['myrtle'] = material('myrtleHedge', '#3c6534', 0.85, vary='#335a2d', vary_scale=40)
M['pool'] = material('nasridPool', '#3d7d86', 0.05, vary='#4a8a92', vary_scale=3, coat=0.7)
M['flagRed'] = material('flagRedA', '#c4232a', 0.7)
M['flagYellow'] = material('flagYellowA', '#f2c418', 0.7)
M['flagGreen'] = material('flagGreenA', '#1f7a3c', 0.7)

S = 0.0058                          # metres to the tile's units
PLATEAU = 0.27                      # the hill's top above the turf (tile units)
ZP = G + PLATEAU
OY = -0.2                           # the hill and all on it brought forward on the tile, the valley shorter, the Sierra freer


def P(x, y, z):
    """A point x metres across (west to the right), y metres back (south), z above the hilltop."""
    return Vector((x * S, y * S, ZP + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


# the line of the walls round the hilltop, from the Alcazaba's point (right) round the north side
OUTLINE = [(215.0, 0.0), (198.0, -30.0), (160.0, -46.0), (110.0, -56.0), (60.0, -60.0), (10.0, -54.0), (-40.0, -54.0), (-90.0, -48.0), (-140.0, -42.0), (-190.0, -30.0),
           (-218.0, -2.0), (-200.0, 32.0), (-150.0, 52.0), (-80.0, 64.0), (0.0, 70.0), (70.0, 66.0), (130.0, 54.0), (180.0, 34.0)]
EDGES = list(zip(OUTLINE, OUTLINE[1:] + OUTLINE[:1]))


def outside(px, py):
    """How far (metres) a point lies outside the walls' line; below 0 inside it."""
    inside = False
    best = 1e9
    for (ax, ay), (bx, by) in EDGES:
        if (ay > py) != (by > py) and px < ax + (py - ay) * (bx - ax) / (by - ay):
            inside = not inside
        dx, dy = bx - ax, by - ay
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(px - ax - t * dx, py - ay - t * dy))
    return -best if inside else best


# ------------------------------------------------------------------ the ground: the hill, the Darro valley, the Sierra Nevada behind
LAT0, LON0 = 37.0563, -3.3655           # the Veleta
MPU, EXAG, BASE = 8000.0, 2.2, 1300.0
SIERRA_AT = (0.15, 1.05)                # where the Veleta stands on the tile
elev = elevation('sierra', 12)
to = geo(LAT0, LON0, MPU, turn=180.0)   # south at the back: the range as the Alhambra sees it


def sierra(x, y):
    w = smooth((y - 0.55) / 0.35)
    if w <= 0.0:
        return 0.0
    return max(0.0, elev(*to(x - SIERRA_AT[0], y - SIERRA_AT[1])) - BASE) * EXAG / MPU * w


def hill(x, y):
    d = outside(x / S, (y - OY) / S) * S
    return PLATEAU if d <= 0.0 else PLATEAU * (1.0 - smooth(d / 0.34))


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.2)
    return max(hill(x, y), sierra(x, y)) * rim


def pick(z, nz, x, y):
    s = sierra(x, y)
    if s > 0.004 and s >= hill(x, y):
        real = z * MPU / EXAG + BASE
        return 5 if real > 2650.0 else 4 if real > 1900.0 or nz < 0.55 else 3
    if z > PLATEAU - 0.002 and outside(x / S, (y - OY) / S) < 1.0:
        return 0
    return 1 if z > 0.012 else 2


ground = terrain('ground', H, [M['grounds'], M['hillside'], M['valley'], M['scrubS'], M['rockS'], M['snow']], pick, rings=240, segs=600)
print('SIERRA height', round(max(v.co.z for v in ground.data.vertices) - G, 3))
slab('darro', M['pool'], [(-2.0, -1.2), (2.0, -1.2), (2.0, -1.17), (-2.0, -1.17)], G - 0.002, G + 0.0015, margin=0.05)
bm = bmesh.new()
bm.from_mesh(ground.data)
bm.faces.ensure_lookup_table()
hits = BVHTree.FromBMesh(bm)
WOODS = []
for k in range(11000):
    x, y = rng.uniform(-1.45, 1.45), rng.uniform(-1.15, 0.6)
    hit = hits.ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)), 5.0)
    if hit[0] is None or bm.faces[hit[2]].material_index != 1 or math.hypot(x, y) > 1.4:
        continue
    r = rng.uniform(0.010, 0.016)
    WOODS.append((hit[0] + Vector((0, 0, r * 0.6)), r, 0.85))
blob_cloud('woods', M['elm'], WOODS)
print('WOODS', len(WOODS))
BEFORE = set(bpy.data.objects)          # everything from here on stands on the hill, laid out as if it were at the tile's middle

# ------------------------------------------------------------------ the walls along the line, crenellated, and their square towers
WALLS, MERLONS = bmesh.new(), bmesh.new()


def crenellate(bm, cx, cy, ang, length, z, width=1.0, depth=0.9, h=1.4):
    n = max(1, int(length / 2.4))
    for k in range(n):
        u = -length / 2 + (k + 0.5) * length / n
        c = P(cx + u * math.cos(ang), cy + u * math.sin(ang), z + h / 2)
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((width * S, depth * S, h * S, 1)))


def tower(name, x, y, ang, w, h, mat=None):
    """A square tower w metres a side, h tall above the hilltop, its battlements round the top."""
    c = P(x, y, (h - 8.0) / 2)
    box(name, mat or M['tapial'], c, (w * S, w * S, (h + 8.0) * S), rot_z=ang, bevel=0.0006)
    for k in range(4):
        a = ang + math.pi / 2 * k
        ox, oy = -math.sin(a) * (w / 2 - 0.45), math.cos(a) * (w / 2 - 0.45)
        crenellate(MERLONS, x + ox, y + oy, a, w - 0.6, h)


for k, ((ax, ay), (bx, by)) in enumerate(EDGES):
    L = math.hypot(bx - ax, by - ay)
    ang = math.atan2(by - ay, bx - ax)
    mx, my = (ax + bx) / 2, (ay + by) / 2
    nx, ny = -math.sin(ang), math.cos(ang)               # the side of the line the hilltop is on
    if outside(mx + nx * 3.0, my + ny * 3.0) > 0:
        nx, ny = -nx, -ny
    cx, cy = mx + nx * 1.25, my + ny * 1.25
    c = P(cx, cy, 1.5)
    bmesh.ops.create_cube(WALLS, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((L * S, 2.5 * S, 19.0 * S, 1)))
    crenellate(MERLONS, mx + nx * 0.45, my + ny * 0.45, ang, L, 11.0)
    for j in range(1, max(1, int(L / 45.0)) + 1):
        t = j / (int(L / 45.0) + 1)
        tower(f'wallTower{k}_{j}', ax + (bx - ax) * t - nx * 1.5, ay + (by - ay) * t - ny * 1.5, ang, 8.0, rng.uniform(15.0, 19.0))
for k, (x, y) in enumerate(OUTLINE[1:]):                 # the point itself is the Torre de la Vela's
    tower(f'cornerTower{k}', x, y, 0.0, 9.0, rng.uniform(16.0, 21.0))
finish('walls', WALLS, M['tapial'], smooth_sides=False)

# ------------------------------------------------------------------ the Alcazaba: the Torre de la Vela, the keep, the barracks' ruins
block('alcazabaInnerWall', M['tapial'], 148.0, 151.0, -46.0, 46.0, -6.0, 13.0)
crenellate(MERLONS, 149.5, 0.0, math.pi / 2, 90.0, 13.0)
tower('torreVela', 204.0, 0.0, 0.0, 13.0, 27.0)
block('velaBelfry', M['tapialLight'], 200.5, 207.5, -2.0, 2.0, 27.0, 31.0)
bm_ = bmesh.new()
tri = [(200.0, 31.0), (208.0, 31.0), (204.0, 33.6)]
add_prism(bm_, [bm_.verts.new(P(x, -2.3, z)) for x, z in tri], [bm_.verts.new(P(x, 2.3, z)) for x, z in tri])
finish('velaBelfryRoof', bm_, M['tilesA'], smooth_sides=False)
lathe('velaBell', M['bronze'], [(r * S, z * S) for r, z in ((1.0, 0.0), (0.8, 0.6), (0.5, 1.5), (0.0, 1.7))], P(204.0, -2.15, 28.3), segs=16, smooth=True)
for k, (x, outer, middle) in enumerate(((200.5, 'flagRed', 'flagYellow'), (207.5, 'flagGreen', 'white'))):
    cylinder(f'flagPole{k}', M['iron'], 0.12 * S, 7.0 * S, P(x, 4.5, 27.0), segs=6)
    block(f'flag{k}', M[outer], x + 0.1, x + 3.4, 4.46, 4.54, 31.5, 33.7)
    block(f'flagBand{k}', M[middle], x + 0.1, x + 3.4, 4.43, 4.57, 32.23, 32.97)
tower('torreHomenaje', 162.0, 22.0, 0.15, 10.0, 26.0)
tower('torreQuebrada', 168.0, -38.0, -0.3, 9.0, 21.0)
RUINS = bmesh.new()
for k in range(5):
    y = -26.0 + 10.0 * k
    for x0 in (158.0, 176.0):
        c = P(x0 + 7.0, y, 0.8)
        bmesh.ops.create_cube(RUINS, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((14.0 * S, 0.6 * S, rng.uniform(1.0, 2.4) * S, 1)))
    for x in (158.0, 165.0, 172.0, 176.0, 183.0, 190.0):
        c = P(x, y + 5.0, 0.6)
        bmesh.ops.create_cube(RUINS, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((0.6 * S, 10.0 * S, rng.uniform(0.8, 2.0) * S, 1)))
finish('barracksRuins', RUINS, M['tapialLight'], smooth_sides=False)

# ------------------------------------------------------------------ the Comares Tower and the Nasrid palaces: the Court of the Myrtles, the Court of the Lions
tower('comares', 60.0, -52.0, 0.0, 16.0, 45.0)
c = P(60.0, -60.05, 0)
glazed('comaresWindows', [(c.x + u * S, c.y, ZP + 30.0 * S, 1.8 * S, 4.2 * S, (0, -1), 'round') for u in (-4.0, 0.0, 4.0)], M['plasterA'], glass=M['door'], depth=0.4 * S)


def courtyard_wings(key, x0, x1, y0, y1, depth, h, mat):
    """The low wings round a court, each under its own tiled roof."""
    for name, a, b, c_, d, way in (('N', x0, x1, y0, y0 + depth, 'x'), ('S', x0, x1, y1 - depth, y1, 'x'),
                                   ('W', x0, x0 + depth, y0 + depth - 0.1, y1 - depth + 0.1, 'y'), ('E', x1 - depth, x1, y0 + depth - 0.1, y1 - depth + 0.1, 'y')):
        block(f'{key}Wing{name}', mat, a, b, c_, d, -0.3, h if way == 'x' else h - 0.05)
        rise = 3.0
        if way == 'x':
            gable_roof(f'{key}Roof{name}', M['tilesA'], a * S, b * S, c_ * S, d * S, ZP + (h - 0.05) * S, rise * S, over=0.002)
        else:
            gable_roof(f'{key}Roof{name}', M['tilesA'], a * S, b * S, (y0 + depth / 2) * S, (y1 - depth / 2) * S, ZP + (h - 0.08) * S, rise * S, over=0.002, along='y')


courtyard_wings('myrtles', 44.0, 76.0, -44.0, -2.0, 7.0, 9.0, M['plasterA'])
slab('myrtlesCourt', M['whiteMarble'], [(51.0 * S, -37.0 * S), (69.0 * S, -37.0 * S), (69.0 * S, -9.0 * S), (51.0 * S, -9.0 * S)], ZP - 0.002, ZP + 0.2 * S, margin=0.05)
block('myrtlesPool', M['pool'], 56.5, 63.5, -34.0, -12.0, 0.0, 0.32)
for x in (54.6, 65.4):
    block(f'myrtles{x}', M['myrtle'], x - 0.8, x + 0.8, -33.0, -13.0, 0.1, 1.3)
arcade_path('myrtlesPortico', M['plasterA'], [((52.0 + 2.29 * k) * S, -37.2 * S) for k in range(8)], 1.0 * S, ZP + 3.6 * S, 2.6 * S, 0.95 * S)
courtyard_wings('lions', 12.0, 44.0, -38.0, -10.0, 6.0, 8.0, M['plasterA'])
slab('lionsCourt', M['grounds'], [(18.0 * S, -32.0 * S), (38.0 * S, -32.0 * S), (38.0 * S, -16.0 * S), (18.0 * S, -16.0 * S)], ZP - 0.002, ZP + 0.2 * S, margin=0.05)
ring = [(18.6, -31.4), (37.4, -31.4), (37.4, -16.6), (18.6, -16.6), (18.6, -31.4)]
LION_ARCH = []
for (ax, ay), (bx, by) in zip(ring, ring[1:]):
    n = max(2, int(math.hypot(bx - ax, by - ay) / 2.1))
    LION_ARCH += [((ax + (bx - ax) * k / n) * S, (ay + (by - ay) * k / n) * S) for k in range(n)]
LION_ARCH.append(LION_ARCH[0])
arcade_path('lionsArcade', M['plasterA'], LION_ARCH, 0.8 * S, ZP + 3.2 * S, 2.0 * S, 0.8 * S, inward=True, closed_center=(28.0 * S, -24.0 * S))
for k, (x, y) in enumerate(LION_ARCH[:-1]):
    cylinder(f'lionColumn{k}', M['whiteMarble'], 0.16 * S, 3.3 * S, (x, y, ZP), segs=8)
for x in (18.6, 37.4):
    block(f'lionsPavilion{x}', M['plasterA'], x - 2.2, x + 2.2, -27.0, -21.0, -0.3, 6.5)
    lathe(f'lionsPavilionRoof{x}', M['tilesA'], [(4.0 * S, 0.0), (0.0, 3.2 * S)], (0, 0, 0), segs=4, matrix=Matrix.Translation(P(x, -24.0, 6.45)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
lathe('lionsFountain', M['whiteMarble'], [(r * S, z * S) for r, z in ((2.2, 0.0), (2.2, 0.6), (1.2, 0.6), (0.4, 1.4), (1.4, 1.6), (1.3, 1.9), (0.2, 2.0), (0.15, 2.8), (0.0, 2.9))], P(28.0, -24.0, 0.15), segs=24, smooth=True)
# the halls between: the Mexuar and the palace's other rooms
for k, (x0, x1, y0, y1, h) in enumerate(((12.0, 44.0, -54.0, -38.1, 8.5), (12.0, 44.0, -9.9, 2.0, 8.0), (76.1, 92.0, -50.0, -24.0, 9.5))):
    block(f'hall{k}', M['plasterA'], x0, x1, y0, y1, -0.3, h)
    hip_roof(f'hallRoof{k}', M['tilesA'], (x0 + x1) / 2 * S, (y0 + y1) / 2 * S, ZP + (h - 0.05) * S, (x1 - x0) * S, (y1 - y0) * S, 3.5 * S, over=0.002)

# ------------------------------------------------------------------ the Palace of Charles V: square, round its circular court
CX, CY, HALF, RIN, PH = 116.0, 14.0, 31.5, 17.5, 17.0
bm_ = bmesh.new()
N = 64
outer, inner = [], []
for k in range(N):
    a = 2 * math.pi * k / N
    c_, s_ = math.cos(a), math.sin(a)
    q = HALF / max(abs(c_), abs(s_))
    outer.append((CX + q * c_, CY + q * s_))
    inner.append((CX + RIN * c_, CY + RIN * s_))
ob_ = [bm_.verts.new(P(x, y, -0.3)) for x, y in outer]
ot = [bm_.verts.new(P(x, y, PH)) for x, y in outer]
ib = [bm_.verts.new(P(x, y, -0.3)) for x, y in inner]
it = [bm_.verts.new(P(x, y, PH)) for x, y in inner]
for k in range(N):
    j = (k + 1) % N
    bm_.faces.new((ob_[k], ob_[j], ot[j], ot[k]))
    bm_.faces.new((ib[j], ib[k], it[k], it[j]))
    bm_.faces.new((ot[k], ot[j], it[j], it[k]))
    bm_.faces.new((ib[k], ib[j], ob_[j], ob_[k]))
finish('charlesV', bm_, M['charles'], smooth_sides=False)
c = P(CX, CY, 0)
for z0, h in ((-0.3, 8.6), (8.3, 8.4)):
    arcade_ring(f'charlesCourt{z0}', M['charles'], (RIN - 2.0) * S, 0.9 * S, ZP + (z0 + h * 0.55) * S, h * 0.45 * S, 32, 1.3 * S, center=(c.x, c.y))
    for k in range(32):
        a = 2 * math.pi * k / 32
        cylinder(f'charlesColumn{z0}{k}', M['charles'], 0.4 * S, h * 0.56 * S, (c.x + (RIN - 2.45) * S * math.cos(a), c.y + (RIN - 2.45) * S * math.sin(a), ZP + z0 * S), segs=10)
annulus('charlesGalleryFloor', M['charles'], RIN * S, (RIN - 2.9) * S, ZP + 8.2 * S, ZP + 8.7 * S, segs=64, center=(c.x, c.y))
annulus('charlesGalleryRoof', M['tilesA'], (RIN + 0.05) * S, (RIN - 2.9) * S, ZP + 16.7 * S, ZP + 17.3 * S, segs=64, center=(c.x, c.y))
CW = []
for side, (nx, ny) in enumerate(((0, -1), (-1, 0))):
    for k in range(9):
        u = -26.0 + 6.5 * k
        x, y = (CX + u, CY - HALF - 0.05) if side == 0 else (CX - HALF - 0.05, CY + u)
        for z in (3.0, 11.0):
            CW.append((x * S, y * S, ZP + z * S, 2.0 * S, 3.4 * S, (nx, ny), 'rect'))
glazed('charlesWindows', CW, M['plasterA'], depth=0.35 * S)

# ------------------------------------------------------------------ the Partal: the Ladies' Tower with its portico, its pool, the gardens
tower('torreDamas', -22.0, -54.0, 0.0, 12.0, 15.0, mat=M['tapialLight'])
arcade_path('partalPortico', M['plasterA'], [((-30.0 + 3.2 * k) * S, -47.2 * S) for k in range(6)], 1.0 * S, ZP + 3.5 * S, 3.0 * S, 1.2 * S)
block('partalPoolRim', M['whiteMarble'], -34.6, -9.4, -44.6, -31.4, -0.3, 0.15)
block('partalPool', M['pool'], -34.0, -10.0, -44.0, -32.0, -0.3, 0.25)
for k, (x0, x1, y0, y1) in enumerate(((-120.0, -60.0, -36.0, 10.0), (-190.0, -130.0, -20.0, 30.0), (-60.0, -6.0, -24.0, 40.0), (-120.0, -60.0, 20.0, 56.0))):
    slab(f'lawn{k}', M['lawn'], [(x0 * S, y0 * S), (x1 * S, y0 * S), (x1 * S, y1 * S), (x0 * S, y1 * S)], ZP - 0.002, ZP + 0.15 * S, margin=0.06)
    for j in range(int((x1 - x0) / 9.0)):
        x = x0 + 4.5 + 9.0 * j
        for y in (y0 + 2.0, y1 - 2.0):
            cypress(f'cypress{k}_{j}_{y}', x * S, y * S, h=0.075, r=0.011, z=ZP)
for k, (x, y) in enumerate(((-150.0, 0.0), (-95.0, -10.0), (-40.0, 10.0), (-85.0, 35.0), (40.0, 30.0), (20.0, 55.0), (-170.0, 20.0))):
    tree(f'orange{k}', x * S, y * S, h=0.05, r=0.025, z=ZP)
for k, (x, y, shirt) in enumerate(((40.0, 10.0, 'red'), (-20.0, -5.0, 'blue'), (90.0, -10.0, 'yellow'), (180.0, 0.0, 'green'), (-100.0, 0.0, 'red'), (60.0, 40.0, 'blue'))):
    person(f'p{k}', x * S, y * S, rng.random() * 6, shirt, z=ZP, scale=0.4)
finish('battlements', MERLONS, M['tapial'], smooth_sides=False)
for ob in set(bpy.data.objects) - BEFORE:
    ob.location.y += OY

render('alhambra')
