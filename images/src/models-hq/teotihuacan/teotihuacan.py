# Teotihuacan in the high-quality look (hq.py), laid out in metres and seen from the south-west: the
# Pyramid of the Sun in its sloping terraces, the stairway up its west face and the platform at its
# foot; the Avenue of the Dead running north past it between the low stepped platforms; the Pyramid of
# the Moon at the avenue's end (brought nearer than it is, so both stand on the base), its own front
# platform and stair; the dry grass and agaves of the valley, Cerro Gordo rising behind, and people.
# Run: blender -b --factory-startup -P teotihuacan.py -- teotihuacan-1024.png 1024 teotihuacan.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(100)
M['tezontle'] = masonry('teotihuacanStone', '#6f6358', '#4c433b', scale=260, rough=0.9, vary='#645850')
M['tezontleLight'] = material('teotihuacanLight', '#8c7f71', 0.9, vary='#807365', vary_scale=40, bump=0.3, bump_scale=200)
M['dryGrassT'] = material('dryGrassT', '#a8a157', 0.9, vary='#979148', vary_scale=12, bump=0.3, bump_scale=200)
M['avenue'] = material('avenueOfTheDead', '#c9bfae', 0.9, vary='#bdb2a0', vary_scale=40, bump=0.2, bump_scale=300)
M['agave'] = material('agave', '#6f9a8a', 0.7, vary='#7aa596', vary_scale=20)
M['cerro'] = material('cerroGordo', '#8f8a5c', 0.9, vary='#7f7a50', vary_scale=12, bump=0.4, bump_scale=120)

S = 0.0058              # metres to the tile's units


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    return 30.0 * smooth((y - 205.0) / 50.0) * smooth((1.0 - abs(x + 60.0) / 220.0) * 2.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return (ground(x / S, y / S) + 0.6) * S * rim


AV = (-95.0, 20.0)      # the avenue's middle line (x) and half width


def pick(z, nz, x, y):
    mx, my = x / S, y / S
    if abs(mx - AV[0]) < AV[1] and my < 95.0:
        return 1
    return 2 if ground(mx, my) > 4.0 else 0


land = terrain('valley', H, [M['dryGrassT'], M['avenue'], M['cerro']], pick, rings=200, segs=500)
Z0 = G + 0.6 * S
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def tiers(name, cx, cy, half_x, half_y, levels, mat):
    """A stepped pyramid: its terraces as sloping frustums, each `levels` entry (its top's height, how far its
    sides slope in), from the ground up; returns the top's half widths and height."""
    z0 = -0.5
    hx, hy = half_x, half_y
    for k, (z1, slope) in enumerate(levels):
        top_x, top_y = hx - slope, hy - slope
        bm_ = bmesh.new()
        lo = [bm_.verts.new(P(cx + sx * hx, cy + sy * hy, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        hi = [bm_.verts.new(P(cx + sx * top_x, cy + sy * top_y, z1)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        add_prism(bm_, lo, hi)
        finish(f'{name}Tier{k}', bm_, mat, smooth_sides=False)
        hx, hy = top_x - 4.0, top_y - 4.0          # each terrace set back from the one below
        z0 = z1 - 0.2
    return hx + 4.0, hy + 4.0, z0 + 0.2


def stair(name, x0, x1, y0, y1, z0, z1, axis):
    """A straight stairway from (x0|y0, z0) to (x1|y1, z1), its steps along `axis` ('x' or 'y')."""
    n = max(4, int(abs(z1 - z0) / 1.2))
    bm_ = bmesh.new()
    for k in range(n):
        t0, t1 = k / n, (k + 1) / n
        if axis == 'x':
            xa, xb = x0 + (x1 - x0) * t0, x1
            q = (min(xa, xb), max(xa, xb), y0, y1)
        else:
            ya, yb = y0 + (y1 - y0) * t0, y1
            q = (x0, x1, min(ya, yb), max(ya, yb))
        zt = z0 + (z1 - z0) * t1
        bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation(P((q[0] + q[1]) / 2, (q[2] + q[3]) / 2, (z0 + zt) / 2)) @ Matrix.Diagonal(((q[1] - q[0]) * S, (q[3] - q[2]) * S, (zt - z0) * S, 1)))
    finish(name, bm_, M['tezontleLight'], smooth_sides=False)


# ------------------------------------------------------------------ the Pyramid of the Sun, its stairway up the west face, the platform at its foot
SX, SY = 25.0, -35.0
hx, hy, ztop = tiers('sun', SX, SY, 112.0, 112.0, ((20.0, 22.0), (38.0, 18.0), (50.0, 14.0), (60.0, 10.0), (65.0, 4.0)), M['tezontle'])
box('sunSummit', M['tezontleLight'], P(SX, SY, ztop + 0.5), (2 * hx * S, 2 * hy * S, 1.0 * S), bevel=0)
# the stairway climbs the west face in flights, terrace by terrace
FLIGHTS = ((-112.0, -90.0, -0.5, 20.0), (-86.0, -68.0, 19.8, 38.0), (-64.0, -50.0, 37.8, 50.0), (-46.0, -36.0, 49.8, 60.0), (-32.0, -28.0, 59.8, 65.0))
for k, (xa, xb, za, zb) in enumerate(FLIGHTS):
    stair(f'sunStair{k}', SX + xa, SX + xb, SY - 9.0, SY + 9.0, za, zb, 'x')
tiers('sunAdosada', SX - 132.0, SY, 20.0, 62.0, ((10.0, 4.0), (16.0, 3.0)), M['tezontle'])
stair('adosadaStair', SX - 152.0, SX - 140.0, SY - 7.0, SY + 7.0, -0.5, 16.0, 'x')

# ------------------------------------------------------------------ the Avenue of the Dead and the low platforms along it
for k, y in enumerate(range(-200, 95, 42)):
    for side in (-1, 1):
        x = AV[0] + side * (AV[1] + 14.0)
        if side > 0 and SY - 150.0 < y < SY + 120.0:
            continue
        if math.hypot(x, y) * S > 1.34:
            continue
        tiers(f'platform{k}{side}', x, float(y), 11.0, 15.0, ((5.0, 1.5), (9.0, 1.2)), M['tezontle'])
        stair(f'platformStair{k}{side}', x - side * 12.5, x - side * 10.0, y - 3.0, y + 3.0, -0.5, 9.0, 'x')

# ------------------------------------------------------------------ the Pyramid of the Moon at the avenue's end
MX, MY = AV[0], 150.0
tiers('moon', MX, MY, 52.0, 48.0, ((14.0, 9.0), (25.0, 8.0), (34.0, 6.0), (40.0, 4.0)), M['tezontle'])
tiers('moonPlatform', MX, MY - 60.0, 26.0, 14.0, ((9.0, 3.0), (15.0, 2.0)), M['tezontle'])
stair('moonPlatformStair', MX - 7.0, MX + 7.0, MY - 76.0, MY - 66.0, -0.5, 15.0, 'y')
for k, (ya, yb, za, zb) in enumerate(((-48.0, -36.0, -0.5, 14.0), (-34.0, -26.0, 13.8, 25.0), (-24.0, -18.0, 24.8, 34.0), (-16.0, -12.0, 33.8, 40.0))):
    stair(f'moonStair{k}', MX - 6.0, MX + 6.0, MY + ya, MY + yb, za, zb, 'y')

# ------------------------------------------------------------------ agaves in the dry grass, people on the avenue and the pyramid
AG = bmesh.new()
for p in range(260):
    x, y = rng.uniform(-240.0, 240.0), rng.uniform(-240.0, 200.0)
    if math.hypot(x, y) * S > 1.36 or abs(x - AV[0]) < AV[1] + 30.0 or (abs(x - SX) < 125.0 and abs(y - SY) < 125.0) or (abs(x - MX) < 60.0 and y > MY - 80.0):
        continue
    for k in range(7):
        a = 2 * math.pi * k / 7 + p
        bmesh.ops.create_cone(AG, cap_ends=True, segments=4, radius1=0.5 * S, radius2=0.0, depth=3.2 * S,
                              matrix=Matrix.Translation(P(x, y, ground(x, y) + 1.2)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(0.7, 4, 'Y'))
finish('agaves', AG, M['agave'], smooth_sides=False)
for k, (x, y, z) in enumerate(((AV[0] - 5.0, -120.0, 0.0), (AV[0] + 6.0, -60.0, 0.0), (AV[0] - 3.0, 20.0, 0.0), (SX - 50.0, SY + 2.0, 50.0), (SX - 30.0, SY - 3.0, 65.0), (SX, SY + 10.0, 65.5))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k % 4], z=c.z, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 30.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('teotihuacan')
