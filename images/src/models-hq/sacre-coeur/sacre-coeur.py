# The Sacré-Cœur in the high-quality look (hq.py), laid out in metres on top of Montmartre and turned
# to face the camera squarely: the white travertine basilica, its porch of three arches with the two
# bronze riders over it (St Louis and Joan of Arc, here the scanned equestrian Napoleon, Loïc Norgeot
# from Artec 3D, CC BY 4.0, in _sources/), the front's great arched window between its two small domes,
# the tall egg-shaped main dome on its drum ringed with columns, the two small domes behind, the
# rounded apse and the square campanile; the parvis, the hill falling away in front with the grand
# stairs down the middle, the terraced lawns and trees either side, the funicular up the left; people.
# Run: blender -b --factory-startup -P sacre-coeur.py -- sacre-coeur-1024.png 1024 sacre-coeur.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1914)
M['travertineW'] = material('chateauLandon', '#f2eee6', 0.6, vary='#e6e1d6', vary_scale=18, bump=0.07, bump_scale=200)
M['travertineShade'] = material('chateauLandonShade', '#e2ddd2', 0.65, vary='#d8d2c5', vary_scale=18, bump=0.07, bump_scale=200)
M['bronzeG'] = material('greenBronze', '#5f7a66', 0.45, vary='#4f6857', vary_scale=40, metallic=0.6)
M['hillLawn'] = material('montmartreLawn', '#6f9c45', 0.85, vary='#63903f', vary_scale=20, bump=0.15, bump_scale=200)
M['steps'] = material('montmartreSteps', '#d9d3c6', 0.85, vary='#cfc8ba', vary_scale=30, bump=0.1, bump_scale=300)
M['parvis'] = masonry('parvis', '#cfc8bb', '#a9a294', scale=90, rough=0.85, vary='#c3bcae')
M['funicular'] = material('funicularGlass', '#9cc3d0', 0.15, coat=0.6)
M['rail'] = material('funicularRail', '#5a5c60', 0.4, metallic=0.6)

S = 0.0145              # metres to the tile's units
FY = -0.2               # the basilica's front on the tile (before the turn)
HILL = 0.34             # the hilltop above the turf
ZT = G + HILL


def P(x, y, z):
    """A point x metres across, y metres back from the basilica's front, z above the hilltop."""
    return Vector((x * S, FY + y * S, ZT + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------------ Montmartre: the hilltop, the slope in front (the layout turned to face the camera)
TURN = math.radians(-32.0)
BROW = FY - 18.0 * S                    # where the parvis ends and the hill falls


def unturn(x, y):
    c, s_ = math.cos(-TURN), math.sin(-TURN)
    return x * c - y * s_, x * s_ + y * c


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.22)
    return HILL * smooth((y + 1.38) / (BROW + 1.38)) * rim if y < BROW else HILL * rim


def pick(z, nz, x, y):
    parvis = y >= BROW - 0.004 and z > HILL * 0.97 and abs(x) < 0.42 and y < FY + 0.4
    return 0 if parvis else 1


ground = terrain('montmartre', lambda x, y: H(*unturn(x, y)), [M['parvis'], M['hillLawn']], lambda z, nz, x, y: pick(z, nz, *unturn(x, y)), rings=200, segs=520)
GROUND_Z = lambda x, y: G + H(x, y)
BEFORE = set(bpy.data.objects)

# the grand stairs down the middle, flight by flight with landings, and the paths across the lawns
STAIRS = bmesh.new()
y = BROW
while y > -1.3:
    z = GROUND_Z(0.0, y)
    nxt = y - 0.012
    bmesh.ops.create_cube(STAIRS, size=1.0, matrix=Matrix.Translation((0.0, y - 0.006, (z + GROUND_Z(0.0, nxt)) / 2 - 0.004)) @ Matrix.Diagonal((0.16, 0.0125, abs(z - GROUND_Z(0.0, nxt)) + 0.008, 1)))
    y = nxt
finish('grandStairs', STAIRS, M['steps'], smooth_sides=False)
for sx in (-1, 1):
    BAL = bmesh.new()
    y = BROW
    while y > -1.3:
        z = GROUND_Z(sx * 0.085, y)
        bmesh.ops.create_cube(BAL, size=1.0, matrix=Matrix.Translation((sx * 0.085, y - 0.006, z + 0.006)) @ Matrix.Diagonal((0.008, 0.0125, 0.016, 1)))
        y -= 0.012
    finish(f'stairWall{sx}', BAL, M['travertineShade'], smooth_sides=False)
PATHS = bmesh.new()
for k in range(4):
    y0 = BROW - 0.12 - 0.26 * k
    for sx in (-1, 1):
        for j in range(10):
            xa, xb = sx * (0.1 + 0.07 * j), sx * (0.1 + 0.07 * (j + 1))
            if math.hypot(xb, y0) > 1.3:
                break
            pa, pb = Vector((xa, y0, GROUND_Z(xa, y0) + 0.003)), Vector((xb, y0, GROUND_Z(xb, y0) + 0.003))
            bmesh.ops.create_cube(PATHS, size=1.0, matrix=Matrix.Translation((pa + pb) / 2) @ Matrix.Diagonal((0.072, 0.03, 0.004, 1)))
finish('terracePaths', PATHS, M['steps'], smooth_sides=False)
trees = []
for k in range(5000):
    x, y = rng.uniform(-1.4, 1.4), rng.uniform(-1.4, BROW - 0.04)
    if math.hypot(x, y) > 1.38 or abs(x) < 0.16 or abs(x + 0.62) < 0.07 or any(abs(y - (BROW - 0.12 - 0.26 * k)) < 0.04 for k in range(4)):
        continue
    if rng.random() > 0.35:
        continue
    r = rng.uniform(0.022, 0.034)
    trees.append(((x, y, GROUND_Z(x, y) + r * 0.85), r, 0.95))
for k in range(6000):
    x, y = rng.uniform(-1.4, 1.4), rng.uniform(BROW, 1.4)
    if math.hypot(x, y) > 1.38 or (abs(x) < 0.5 and y < FY + 1.45) or rng.random() > 0.3:
        continue
    r = rng.uniform(0.022, 0.034)
    trees.append(((x, y, GROUND_Z(x, y) + r * 0.85), r, 0.95))
blob_cloud('hillTrees', M['leaf'], trees)
# the funicular up the left of the gardens: its rails and its two glass cars
FX = -0.62
RAILS = bmesh.new()
for k in range(40):
    y0, y1 = -1.25 + (BROW + 1.25) * k / 40, -1.25 + (BROW + 1.25) * (k + 1) / 40
    a, b = Vector((FX, y0, GROUND_Z(FX, y0) + 0.004)), Vector((FX, y1, GROUND_Z(FX, y1) + 0.004))
    d = b - a
    bmesh.ops.create_cube(RAILS, size=1.0, matrix=Matrix.Translation((a + b) / 2) @ d.normalized().to_track_quat('Y', 'Z').to_matrix().to_4x4() @ Matrix.Diagonal((0.04, d.length, 0.008, 1)))
finish('funicularTrack', RAILS, M['rail'], smooth_sides=False)
for k, t in enumerate((0.3, 0.7)):
    y = -1.25 + (BROW + 1.25) * t
    a, b = Vector((FX, y - 0.02, GROUND_Z(FX, y - 0.02))), Vector((FX, y + 0.02, GROUND_Z(FX, y + 0.02)))
    d = b - a
    box_m(f'funicularCar{k}', M['funicular'], Matrix.Translation((a + b) / 2 + Vector((0, 0, 0.02))) @ d.normalized().to_track_quat('Y', 'Z').to_matrix().to_4x4(), (0.032, 0.05, 0.03), bevel=0.003)

# ------------------------------------------------------------------ the basilica: the porch, the front, the nave and transept, the apse
ARCH = []
for x in (-8.0, 0.0, 8.0):
    out = [(x - 3.0, -0.3), (x - 3.0, 6.5)] + [(x - 3.0 * math.cos(math.pi * k / 10), 6.5 + 3.0 * math.sin(math.pi * k / 10)) for k in range(1, 10)] + [(x + 3.0, 6.5), (x + 3.0, -0.3)]
    ARCH.append(out)
prof = [(-15.0, 15.0), (-15.0, -0.3)]
for out in ARCH:
    prof += out
prof += [(15.0, -0.3), (15.0, 15.0)]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new(P(x, -8.0, z)) for x, z in prof], [bm_.verts.new(P(x, -1.0, z)) for x, z in prof])
finish('porch', bm_, M['travertineW'], smooth_sides=False)
block('porchTop', M['travertineShade'], -15.6, 15.6, -8.6, 0.2, 14.9, 16.2)
for x in (-14.4, 14.4):
    block(f'porchBalustradeEnd{x}', M['travertineW'], x - 0.6, x + 0.6, -8.4, 0.0, 16.1, 17.4)
block('porchBalustrade', M['travertineW'], -15.0, 15.0, -8.5, -7.9, 16.1, 17.2)
glazed('portals', [(P(x, -0.95, 0).x, P(x, -0.95, 0).y, ZT - 0.2 * S, 4.0 * S, 8.0 * S, (0, -1), 'round') for x in (-8.0, 0.0, 8.0)], M['travertineShade'], glass=M['bronze'], depth=0.4 * S)
block('front', M['travertineW'], -17.0, 17.0, -1.0, 16.0, -0.3, 30.0)
bm_ = bmesh.new()
tri = [(-12.0, 29.9), (12.0, 29.9), (0.0, 37.0)]
add_prism(bm_, [bm_.verts.new(P(x, -1.0, z)) for x, z in tri], [bm_.verts.new(P(x, 8.0, z)) for x, z in tri])
finish('frontGable', bm_, M['travertineW'], smooth_sides=False)
c = P(0.0, -1.05, 0)
glazed('frontWindow', [(c.x, c.y, ZT + 17.5 * S, 8.0 * S, 11.0 * S, (0, -1), 'round')], M['travertineShade'], depth=0.4 * S)
block('nave', M['travertineW'], -12.0, 12.0, 15.9, 72.0, -0.3, 31.0)
block('transept', M['travertineW'], -19.0, 19.0, 30.0, 52.0, -0.3, 30.5)
lathe('apse', M['travertineW'], [(12.0 * S, 0.0), (12.0 * S, 31.0 * S)], (0, 0, 0), segs=40, matrix=Matrix.Translation(P(0.0, 72.0, -0.3)))
lathe('apseDome', M['travertineShade'], [(12.0 * S, 0.0)] + [(12.0 * S * math.cos(a), 12.0 * S * 0.8 * math.sin(a)) for a in [math.pi / 2 * k / 8 for k in range(1, 9)]], (0, 0, 0), segs=40, smooth=True,
      matrix=Matrix.Translation(P(0.0, 72.0, 30.7)))
SIDE = []
for y in (22.0, 28.0, 56.0, 62.0, 68.0):
    for sx in (-1, 1):
        c = P(sx * 12.05, y, 0)
        SIDE.append((c.x, c.y, ZT + 14.0 * S, 2.4 * S, 8.0 * S, (sx, 0), 'round'))
for sx in (-1, 1):
    c = P(sx * 19.05, 41.0, 0)
    SIDE.append((c.x, c.y, ZT + 12.0 * S, 5.0 * S, 12.0 * S, (sx, 0), 'round'))
glazed('sideWindows', SIDE, M['travertineShade'], depth=0.3 * S)


def small_dome(name, x, y, z0, r, h):
    """A small dome: its drum ringed with little arches, the egg-shaped cap, a lantern and a cross."""
    c = P(x, y, z0)
    cylinder(name + 'Drum', M['travertineW'], r * S, 6.0 * S, (c.x, c.y, c.z), segs=32)
    lathe(name + 'Cap', M['travertineW'], [(rr * S, zz * S) for rr, zz in ((r + 0.3, 0.0), (r + 0.5, h * 0.25), (r * 0.8, h * 0.62), (r * 0.35, h * 0.9), (r * 0.18, h))], (c.x, c.y, c.z + 5.9 * S), segs=32, smooth=True)
    lathe(name + 'Lantern', M['travertineShade'], [(rr * S, zz * S) for rr, zz in ((r * 0.22, 0.0), (r * 0.22, 2.2), (r * 0.3, 2.6), (0.0, 4.2))], (c.x, c.y, c.z + (5.8 + h) * S), segs=12, smooth=True)


for sx in (-1, 1):
    block(f'frontTower{sx}', M['travertineW'], sx * 14.0 - 3.6, sx * 14.0 + 3.6, 1.0, 8.6, -0.3, 33.0)
    small_dome(f'frontDome{sx}', sx * 14.0, 4.8, 32.9, 3.4, 8.0)
    small_dome(f'backDome{sx}', sx * 15.0, 48.0, 30.4, 3.4, 8.0)

# ------------------------------------------------------------------ the main dome: the drum and its colonnade, the egg-shaped dome, the lantern
DY = 41.0
c = P(0.0, DY, 0)
cylinder('drum', M['travertineW'], 10.0 * S, 20.0 * S, (c.x, c.y, ZT + 30.4 * S), segs=48)
DRUM = []
for k in range(16):
    a = 2 * math.pi * k / 16
    cylinder(f'drumColumn{k}', M['travertineShade'], 0.55 * S, 10.5 * S, (c.x + 11.3 * S * math.cos(a), c.y + 11.3 * S * math.sin(a), ZT + 38.4 * S), segs=10)
    a2 = a + math.pi / 16
    n = Vector((math.cos(a2), math.sin(a2), 0))
    p = c + n * 10.02 * S
    DRUM.append((p.x, p.y, ZT + 39.5 * S, 2.0 * S, 7.0 * S, (n.x, n.y), 'round'))
glazed('drumWindows', DRUM, M['travertineShade'], depth=0.25 * S)
annulus('colonnadeBase', M['travertineShade'], 12.4 * S, 9.8 * S, ZT + 37.6 * S, ZT + 38.5 * S, segs=48, center=(c.x, c.y))
annulus('colonnadeTop', M['travertineShade'], 12.4 * S, 9.8 * S, ZT + 48.8 * S, ZT + 50.3 * S, segs=48, center=(c.x, c.y))
lathe('mainDome', M['travertineW'], [(r * S, z * S) for r, z in ((10.4, 0.0), (10.8, 4.0), (10.2, 9.0), (8.2, 15.0), (5.2, 20.0), (2.6, 23.2), (2.2, 23.8))], (c.x, c.y, ZT + 50.2 * S), segs=48, smooth=True)
for k in range(16):
    a = 2 * math.pi * k / 16
    tube(f'domeRib{k}', M['travertineShade'], [Vector((c.x + (r + 0.15) * S * math.cos(a), c.y + (r + 0.15) * S * math.sin(a), ZT + (50.2 + z) * S)) for r, z in ((10.4, 0.0), (10.8, 4.0), (10.2, 9.0), (8.2, 15.0), (5.2, 20.0), (2.6, 23.2))], 0.3 * S)
lathe('lantern', M['travertineW'], [(r * S, z * S) for r, z in ((2.4, 0.0), (2.4, 4.0), (3.0, 4.5), (2.0, 6.5), (0.6, 8.0), (0.0, 8.6))], (c.x, c.y, ZT + 73.9 * S), segs=24, smooth=True)
cylinder('crossUpright', M['bronze'], 0.15 * S, 2.6 * S, (c.x, c.y, ZT + 82.4 * S), segs=6)
box('crossArm', M['bronze'], P(0.0, DY, 84.0), (1.4 * S, 0.22 * S, 0.22 * S), bevel=0)

# ------------------------------------------------------------------ the campanile behind the apse
block('campanile', M['travertineW'], -5.0, 5.0, 84.0, 94.0, -0.3, 58.0)
CAMP = []
for nx, ny in ((0, -1), (-1, 0), (1, 0), (0, 1)):
    c = P(nx * 5.05, 89.0 + ny * 5.05, 0)
    CAMP.append((c.x, c.y, ZT + 46.0 * S, 3.6 * S, 9.0 * S, (nx, ny), 'round'))
glazed('campanileOpenings', CAMP, M['travertineShade'], glass=M['bronzeG'], depth=0.4 * S)
small_dome('campanileDome', 0.0, 89.0, 57.9, 4.6, 10.0)

# ------------------------------------------------------------------ the two bronze riders over the porch
def rider():
    src = import_model('equestrian-napoleon', 'riderSource')
    stand_sourced(src, cut=0.02, turn=-90.0, height=1.0, z=0.0, mat=M['bronzeG'], report=False)
    me = src.data
    bpy.data.objects.remove(src, do_unlink=True)
    return me


horse = rider()
for k, x in enumerate((-11.0, 11.0)):
    block(f'riderPedestal{k}', M['travertineShade'], x - 2.2, x + 2.2, -6.6, -2.4, 16.1, 18.4)
    ob = bpy.data.objects.new(f'rider{k}', horse)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(P(x, -4.5, 18.35)) @ Matrix.Scale(6.0 * S, 4)

for k, (x, y, shirt) in enumerate(((-0.3, BROW - 0.06, 'red'), (0.25, BROW - 0.05, 'blue'), (0.05, -0.5, 'yellow'), (-0.04, -0.8, 'green'), (0.5, -0.6, 'red'), (-0.45, -0.9, 'blue'), (0.15, BROW + 0.03, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=GROUND_Z(x, y) + (0.004 if abs(x) < 0.08 else 0.0), scale=0.7)

R = Matrix.Rotation(TURN, 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('sacre-coeur')
