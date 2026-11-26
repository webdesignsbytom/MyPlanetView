# Hallstatt in the high-quality look (hq.py), laid out in metres (the mountain drawn steeper and nearer):
# the salt town's pastel houses packed onto the narrow shore of the Hallstätter See and stepping up the
# slope, their steep shingle roofs and wooden balconies, the boathouses at the water; the Protestant
# church's white tower and slender dark spire at the water's edge, the Catholic church on its terrace
# above; the mountain rising straight behind, dark with spruce, then bare rock and snow on top; the lake
# with its flat-bottomed boats; people.
# Run: blender -b --factory-startup -P hallstatt.py -- hallstatt-1024.png 1024 hallstatt.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1311)
M['lakeH'] = material('hallstaetterSee', '#3f6f6c', 0.05, vary='#4a7b77', vary_scale=3, coat=0.7, bump=0.08, bump_scale=40)
M['meadowH'] = material('meadowH', '#6b9440', 0.85, vary='#5f873a', vary_scale=14, bump=0.2, bump_scale=200)
M['slopeH'] = material('spruceSlope', '#3e5a34', 0.9, vary='#36502e', vary_scale=14, bump=0.3, bump_scale=160)
M['rockH'] = material('dachsteinRock', '#9b9a94', 0.9, vary='#86847e', vary_scale=14, bump=0.5, bump_scale=90)
M['snowH'] = material('snowH', '#f4f6f8', 0.5, vary='#e8ecef', vary_scale=20)
M['spruce'] = material('spruce', '#2f4a2b', 0.85, vary='#3a5733', vary_scale=16, bump=0.3, bump_scale=90)
M['shingles'] = banded(material('shingles', '#5a4a42', 0.8, vary='#4e3f38', vary_scale=14, bump=0.2, bump_scale=200), 'Z', 420.0, strength=0.3)
M['spireDark'] = material('spireDark', '#3b4a4a', 0.5, metallic=0.3)
M['woodBalcony'] = material('balconyWood', '#6b4a2f', 0.7)
PASTELS = [material(f'pastel{k}', c, 0.75, vary=c, vary_scale=30) for k, c in enumerate(('#f3ede0', '#efd99a', '#e9b9a8', '#cfe0c0', '#e8c98a', '#f0e2c8', '#d9c4e0'))]

S = 0.0075              # metres to the tile's units
LAKE = G + 0.002


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def shore(x):
    return -0.22 + 0.05 * math.sin(2.1 * x + 0.4) + 0.025 * math.sin(5.3 * x)


def bumps(x, y):
    return (0.05 * math.sin(7.0 * x + 1.3) * math.cos(5.0 * y) + 0.035 * math.sin(13.0 * x - 2.0 * y) + 0.02 * math.sin(23.0 * x + 7.0 * y)
            + 0.012 * math.sin(41.0 * x - 13.0 * y) + 0.008 * math.sin(67.0 * x + 29.0 * y))


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.16)
    s0 = shore(x)
    if y < s0:
        return 0.0
    town = 0.02 + 0.09 * smooth((y - s0) / 0.24)
    massif = 0.55 + 0.45 * smooth((1.25 - abs(x - 0.1)) / 0.9)          # highest behind the town, falling away at the sides
    mountain = (1.05 * smooth((y - s0 - 0.2) / 1.0) ** 1.2 + bumps(x, y) * smooth((y - s0 - 0.3) / 0.4) * 1.6) * massif
    return max(town, town + mountain) * rim


def pick(z, nz, x, y):
    if z < 0.003:
        return 0
    if z > 0.88:
        return 4
    if z > 0.62 or nz < 0.45:
        return 3
    return 1 if y < shore(x) + 0.26 else 2


ground = terrain('mountain', H, [M['lakeH'], M['meadowH'], M['slopeH'], M['rockH'], M['snowH']], pick, rings=240, segs=600)
slab('lake', M['lakeH'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, LAKE + 0.004, margin=0.02)
spruces = [((p.x, p.y, p.z + r * 1.4), r, 2.2) for p in scatter_on(ground, 26000, (-1.5, 1.5, -0.3, 1.5), lambda p, m: m == 2 and math.hypot(p.x, p.y) < 1.42, seed=4)
           for r in (rng.uniform(0.011, 0.017),)]
blob_cloud('spruces', M['spruce'], spruces, subdivisions=1)


def GZ(x, y):
    return G + H(x, y)


# ------------------------------------------------------------------ the town: pastel houses on the shore and stepping up the slope
WALLS = {k: bmesh.new() for k in range(len(PASTELS))}
ROOFS, BALC = bmesh.new(), bmesh.new()
WIN = []
CHURCH_X, CATH_X = -0.28, 0.32


def house(x, y, w, d, h, colour, ang=0.0):
    z0 = min(GZ(x, y - d / 2), GZ(x, y + d / 2)) - 0.004
    top = max(GZ(x, y - d / 2), GZ(x, y + d / 2)) + h
    bm = WALLS[colour]
    m = Matrix.Translation((x, y, (z0 + top) / 2)) @ Matrix.Rotation(ang, 4, 'Z')
    bmesh.ops.create_cube(bm, size=1.0, matrix=m @ Matrix.Diagonal((w, d, top - z0, 1)))
    # a steep shingle roof, its ridge across the slope, its gable to the lake
    mr = Matrix.Translation((x, y, top)) @ Matrix.Rotation(ang, 4, 'Z')
    hw, hd, rise = w / 2 + 0.6 * S, d / 2 + 0.6 * S, w * 0.55
    v = [ROOFS.verts.new(mr @ Vector(p)) for p in ((-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0), (0, -hd, rise), (0, hd, rise))]
    for f in ((v[0], v[4], v[5], v[3]), (v[1], v[2], v[5], v[4]), (v[0], v[1], v[4]), (v[2], v[3], v[5]), (v[3], v[2], v[1], v[0])):
        ROOFS.faces.new(f)
    front = m @ Vector((0, -d / 2, 0))
    n_ = Matrix.Rotation(ang, 3, 'Z') @ Vector((0, -1, 0))
    rows = int((top - GZ(x, y - d / 2)) / (3.0 * S))
    for r_ in range(1, max(1, rows)):
        zr = GZ(x, y - d / 2) + r_ * 3.0 * S - 1.6 * S
        for u in (-w * 0.25, w * 0.25):
            p = m @ Vector((u, -d / 2 - 0.0003, 0))
            WIN.append((p.x, p.y, zr, 1.0 * S, 1.4 * S, (n_.x, n_.y), 'rect'))
    if rng.random() < 0.5:
        zb = GZ(x, y - d / 2) + 3.6 * S
        bmesh.ops.create_cube(BALC, size=1.0, matrix=Matrix.Translation(front + Vector((0, 0, zb - front.z))) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Translation((0, -0.8 * S, 0)) @ Matrix.Diagonal((w * 0.85, 1.6 * S, 0.9 * S, 1)))


for gx in range(-17, 18):
    x = gx * 0.066 + rng.uniform(-0.008, 0.008)
    if math.hypot(x, shore(x)) > 1.3 or abs(x - CHURCH_X) < 0.075:
        continue
    y = shore(x) + 0.05
    row = 0
    while y < shore(x) + 0.3 and row < 4:
        if not (abs(x - CATH_X) < 0.08 and row >= 2):
            w, d, h = rng.uniform(8.0, 11.0) * S, rng.uniform(8.0, 10.0) * S, rng.uniform(9.0, 13.0) * S
            house(x, y, w, d, h, rng.randrange(len(PASTELS)), ang=rng.uniform(-0.08, 0.08))
        y += rng.uniform(0.075, 0.095)
        row += 1
for k, colour in enumerate(WALLS):
    finish(f'houses{k}', WALLS[colour], PASTELS[colour], smooth_sides=False)
finish('houseRoofs', ROOFS, M['shingles'], smooth_sides=False)
finish('balconies', BALC, M['woodBalcony'], smooth_sides=False)
glazed('houseWindows', WIN, M['white'], depth=0.25 * S)
# the boathouses at the water
for k, x in enumerate((-0.95, -0.7, -0.5, 0.05, 0.2, 0.55, 0.8)):
    y = shore(x) - 0.01
    if math.hypot(x, y) > 1.3:
        continue
    box(f'boathouse{k}', M['woodBalcony'], Vector((x, y, LAKE + 2.0 * S)), (6.0 * S, 7.0 * S, 4.6 * S), bevel=0.0006)
    gable_roof(f'boathouseRoof{k}', M['shingles'], x - 3.0 * S, x + 3.0 * S, y - 3.5 * S, y + 3.5 * S, LAKE + 4.25 * S, 2.6 * S, over=0.002, along='y')


# ------------------------------------------------------------------ the two churches
def church(name, x, y, nave, tower_h, spire_h, white=True):
    z0 = min(GZ(x, y - 0.05), GZ(x, y + 0.05)) - 0.004
    zt = max(GZ(x, y - 0.05), GZ(x, y + 0.05))
    box(name + 'Nave', M['white'], Vector((x + 0.02, y + 0.03, (z0 + zt + nave[2] * S) / 2)), (nave[0] * S, nave[1] * S, zt - z0 + nave[2] * S), bevel=0.0008)
    gable_roof(name + 'NaveRoof', M['shingles'], x + 0.02 - nave[0] / 2 * S, x + 0.02 + nave[0] / 2 * S, y + 0.03 - nave[1] / 2 * S, y + 0.03 + nave[1] / 2 * S, zt + nave[2] * S - 0.0005, nave[0] * 0.5 * S, over=0.002, along='y')
    box(name + 'Tower', M['white'], Vector((x, y - nave[1] / 2 * S + 0.03 - 0.02, (z0 + zt + tower_h * S) / 2)), (6.0 * S, 6.0 * S, zt - z0 + tower_h * S), bevel=0.0008)
    tz = zt + tower_h * S
    ty = y - nave[1] / 2 * S + 0.01
    lathe(name + 'Spire', M['spireDark'], [(4.3 * S, 0.0), (3.3 * S, 1.0 * S), (0.3 * S, spire_h * S), (0.0, (spire_h + 0.6) * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation((x, ty, tz - 0.0003)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    c = Vector((x, ty - 3.03 * S, 0))
    glazed(name + 'Openings', [(c.x, c.y, tz - 6.0 * S, 1.6 * S, 3.6 * S, (0, -1), 'round'), (c.x, c.y, tz - 14.0 * S, 1.2 * S, 2.6 * S, (0, -1), 'round')], M['white'], glass=M['shingles'], depth=0.3 * S)
    cylinder(name + 'Clock', M['white'], 1.2 * S, 0.3 * S, (0, 0, 0), segs=16, matrix=Matrix.Translation((x, ty - 3.1 * S, tz - 9.5 * S)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


church('protestant', CHURCH_X, shore(CHURCH_X) + 0.06, (11.0, 22.0, 12.0), 30.0, 20.0)
church('catholic', CATH_X, shore(CATH_X) + 0.24, (12.0, 26.0, 14.0), 26.0, 22.0)

# ------------------------------------------------------------------ boats on the lake, people
for k, (x, y, rot) in enumerate(((-0.4, -0.62, 0.2), (0.3, -0.75, -0.4), (0.75, -0.5, 0.9))):
    m = Matrix.Translation((x, y, LAKE + 0.004)) @ Matrix.Rotation(rot, 4, 'Z')
    bm_ = bmesh.new()
    rings = []
    for j in range(9):
        t = -1 + 2 * j / 8
        w = 0.016 * (1 - abs(t) ** 2.5) + 0.002
        rings.append([bm_.verts.new(m @ Vector((t * 0.07, u * w, v))) for u, v in ((-1, 0.006), (-0.8, -0.002), (0.8, -0.002), (1, 0.006))])
    for a, b in zip(rings, rings[1:]):
        for i in range(3):
            bm_.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    finish(f'fuhr{k}', bm_, M['woodBalcony'], smooth_all=True)
    p = m @ Vector((-0.045, 0, 0.002))
    person(f'boatman{k}', p.x, p.y, rot, 'white', z=p.z, scale=0.65)
for k, x in enumerate((-0.6, -0.15, 0.45, 0.68)):
    y = shore(x) + 0.02
    person(f'p{k}', x, y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k], z=GZ(x, y), scale=0.65)

render('hallstatt')
