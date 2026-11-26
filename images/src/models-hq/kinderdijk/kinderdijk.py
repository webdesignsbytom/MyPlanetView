# The windmills of Kinderdijk in the high-quality look (hq.py), laid out in metres (the mills drawn
# closer together than they stand): the thatched polder mills in their two rows along the canal, each
# on its red brick foot, its octagonal thatched body tapering up to the cap, its door and little
# windows, its four lattice sails on their stocks turned into the wind (here towards the camera), the
# tail beam down the back to its capstan wheel; the still canal mirroring them, the reeds along its
# banks, the dykes' paths and the flat green polder with its ditches; people.
# Run: blender -b --factory-startup -P kinderdijk.py -- kinderdijk-1024.png 1024 kinderdijk.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1740)
M['thatch'] = material('millThatch', '#76664c', 0.95, vary='#68593f', vary_scale=30, bump=0.5, bump_scale=260)
M['brickK'] = masonry('millBrick', '#9a4a38', '#6f3427', scale=320, rough=0.85, vary='#8e4433')
M['capWood'] = material('capWood', '#4a3a2a', 0.7, vary='#3f3123', vary_scale=40)
M['sailWood'] = material('sailLattice', '#e8e2d4', 0.7, vary='#d9d2c2', vary_scale=60)
M['stock'] = material('sailStock', '#5b3a26', 0.6)
M['doorGreen'] = material('millDoor', '#2f5a3a', 0.6)
M['polder'] = material('polder', '#6e9c43', 0.85, vary='#62903c', vary_scale=14, bump=0.15, bump_scale=200)
M['dyke'] = material('dykePath', '#b5ad98', 0.95, vary='#a9a08b', vary_scale=30)
M['canal'] = material('kinderdijkCanal', '#4f7d8a', 0.04, vary='#5b8996', vary_scale=3, coat=0.7, bump=0.04, bump_scale=40)
M['reed'] = material('reed', '#8a9a4e', 0.85, vary='#a39d58', vary_scale=40, bump=0.4, bump_scale=200)

S = 0.023               # metres to the tile's units
Z0 = G + 0.002          # the water
ZB = G + 0.03           # the banks


def P(x, y, z):
    return Vector((x * S, y * S, ZB + z * S))


# ------------------------------------------------------------------ the canal, its banks and reeds, the polder and its ditches
slab('canal', M['canal'], [(-2, -0.26), (2, -0.26), (2, 0.26), (-2, 0.26)], G - 0.004, Z0, margin=0.02)
for sy in (-1, 1):
    a, b = sorted((sy * 0.26, sy * 2.0))
    slab(f'polder{sy}', M['polder'], [(-2, a), (2, a), (2, b), (-2, b)], G - 0.004, ZB, margin=0.02)
    slab(f'dykePath{sy}', M['dyke'], [(-2, sy * 0.82 - 0.035), (2, sy * 0.82 - 0.035), (2, sy * 0.82 + 0.035), (-2, sy * 0.82 + 0.035)], ZB - 0.001, ZB + 0.0012, margin=0.03)
    for k, x in enumerate((-1.05, -0.2, 0.6)):
        y0, y1 = sorted((sy * 0.92, sy * 1.5))
        slab(f'ditch{sy}{k}', M['canal'], [(x - 0.012, y0), (x + 0.012, y0), (x + 0.012, y1), (x - 0.012, y1)], ZB - 0.004, ZB + 0.0005, margin=0.03)
REEDS = []
for k in range(2600):
    x = rng.uniform(-1.5, 1.5)
    sy = rng.choice((-1, 1))
    y = sy * rng.uniform(0.24, 0.3)
    if math.hypot(x, y) > 1.45:
        continue
    r = rng.uniform(0.008, 0.013)
    REEDS.append(((x, y, Z0 + r * 1.2), r, 2.2))
blob_cloud('reeds', M['reed'], REEDS, subdivisions=1)


# ------------------------------------------------------------------ a polder mill
def mill(key, x, y, face):
    """A thatched octagonal polder mill at (x, y) metres, its sails facing `face` (radians from -y)."""
    m = Matrix.Translation(P(x, y, 0)) @ Matrix.Rotation(face, 4, 'Z')
    lathe(key + 'Foot', M['brickK'], [(r * S, z * S) for r, z in ((6.8, -0.4), (6.6, 2.6), (6.3, 2.6))], (0, 0, 0), segs=8, matrix=m @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    lathe(key + 'Body', M['thatch'], [(r * S, z * S) for r, z in ((6.0, 2.5), (5.3, 8.0), (4.3, 14.0), (3.4, 18.6))], (0, 0, 0), segs=8, matrix=m @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    lathe(key + 'Cap', M['capWood'], [(r * S, z * S) for r, z in ((3.7, 18.4), (3.7, 19.6), (3.1, 21.3), (1.8, 22.5), (0.0, 23.0))], (0, 0, 0), segs=16, matrix=m @ Matrix.Diagonal((1.0, 1.25, 1.0, 1)), smooth=True)
    # the door and two little windows on the side facing the sails, white-framed
    face_n = m.to_3x3() @ Vector((0, -1, 0))
    door = m @ Vector((0, -6.25 * S, 0))
    glazed(key + 'Door', [(door.x, door.y, ZB + 2.6 * S, 1.4 * S, 2.4 * S, (face_n.x, face_n.y), 'rect')], M['white'], glass=M['doorGreen'], depth=0.3 * S, bars=False)
    WIN = []
    for z, r in ((8.6, 5.2), (14.2, 4.25)):
        p = m @ Vector((0, -r * S, 0))
        WIN.append((p.x, p.y, ZB + z * S, 0.9 * S, 1.1 * S, (face_n.x, face_n.y), 'rect'))
    glazed(key + 'Windows', WIN, M['white'], depth=0.4 * S)
    # the windshaft and the four sails: a stock through the hub, each sail a lattice on one side of it
    hub = m @ Vector((0, -4.3 * S, 20.6 * S))
    tilt = Matrix.Rotation(math.radians(10.0), 4, 'X')
    sails = Matrix.Translation(hub) @ m.to_3x3().to_4x4() @ tilt @ Matrix.Rotation(rng.uniform(0.0, math.pi / 2), 4, 'Y')
    bm = bmesh.new()
    for k in range(2):
        bmesh.ops.create_cube(bm, size=1.0, matrix=sails @ Matrix.Rotation(math.pi / 2 * k, 4, 'Y') @ Matrix.Diagonal((28.5 * S, 0.45 * S, 0.45 * S, 1)))
    finish(key + 'Stocks', bm, M['stock'], smooth_sides=False)
    bm = bmesh.new()
    for k in range(4):
        arm = sails @ Matrix.Rotation(math.pi / 2 * k, 4, 'Y')
        for z in (1.15, 2.3):
            bmesh.ops.create_cube(bm, size=1.0, matrix=arm @ Matrix.Translation((8.2 * S, -0.3 * S, z * S)) @ Matrix.Diagonal((11.6 * S, 0.18 * S, 0.16 * S, 1)))
        for j in range(17):
            u = 2.5 + 11.4 * j / 16
            bmesh.ops.create_cube(bm, size=1.0, matrix=arm @ Matrix.Translation((u * S, -0.3 * S, 1.25 * S)) @ Matrix.Diagonal((0.14 * S, 0.16 * S, 2.3 * S, 1)))
    finish(key + 'Lattice', bm, M['sailWood'], smooth_sides=False)
    cylinder(key + 'Hub', M['capWood'], 0.9 * S, 1.6 * S, (0, 0, 0), segs=12, matrix=Matrix.Translation(hub) @ m.to_3x3().to_4x4() @ tilt @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -0.8 * S)))
    # the tail beam down the back to the capstan wheel
    top = m @ Vector((0, 3.9 * S, 19.4 * S))
    foot = m @ Vector((0, 11.5 * S, 1.2 * S))
    bar(key + 'Tail', M['capWood'], top, foot, 0.45 * S)
    for sx in (-1, 1):
        bar(key + f'Strut{sx}', M['capWood'], m @ Vector((sx * 2.4 * S, 3.1 * S, 18.8 * S)), m @ Vector((0, 10.4 * S, 3.6 * S)), 0.3 * S)
    wheel = Matrix.Translation(foot) @ m.to_3x3().to_4x4() @ Matrix.Rotation(math.pi / 2, 4, 'Y')
    annulus(key + 'Wheel', M['capWood'], 1.6 * S, 1.3 * S, -0.15 * S, 0.15 * S, segs=16, matrix=wheel)


FACE = math.radians(-32.0)          # every mill turned to the same wind: here the sails face the camera
for k, (x, y) in enumerate(((-38.0, 24.0), (0.0, 26.0), (38.0, 24.0), (-20.0, -24.0), (20.0, -26.0))):
    mill(f'mill{k}', x, y, FACE + rng.uniform(-0.05, 0.05))

for k, (x, y, shirt) in enumerate(((-0.6, -0.8, 'red'), (-0.5, -0.83, 'blue'), (0.3, 0.82, 'yellow'), (0.9, -0.81, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=ZB + 0.0012, scale=0.75)

render('kinderdijk')
