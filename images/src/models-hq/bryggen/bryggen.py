# Bryggen in Bergen in the high-quality look (hq.py), laid out in metres and turned to face the camera:
# the row of tall wooden Hanseatic wharf houses along Vågen, their steep gables to the harbour, clad in
# upright boards of ox-blood red, ochre, white and cream, their small-paned white windows, the hoist
# beams under the gables, the steep dark roofs, the narrow passages between them and the second row of
# houses behind; the timber quay before them, the harbour with its boats, and Fløyen's wooded slopes
# rising behind; people.
# Run: blender -b --factory-startup -P bryggen.py -- bryggen-1024.png 1024 bryggen.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1360)
COLOURS = {'red': '#9c3326', 'ochre': '#d39a3c', 'white': '#ece6da', 'cream': '#e3cf9c', 'brownred': '#7e3a27', 'yellow': '#e1b748'}
CLAD = {k: banded(material(f'clad{k}', c, 0.8, vary=c, vary_scale=30, bump=0.2, bump_scale=160), 'X', 520.0, strength=0.3) for k, c in COLOURS.items()}
M['roofDark'] = banded(material('bryggenRoof', '#5a5c61', 0.7, vary='#4f5156', vary_scale=14, bump=0.15, bump_scale=200), 'Z', 300.0, strength=0.25)
M['roofRed'] = banded(material('bryggenRoofRed', '#7d3d30', 0.7, vary='#6f362a', vary_scale=14, bump=0.15, bump_scale=200), 'Z', 300.0, strength=0.25)
M['quay'] = banded(material('quayPlanks', '#7a5a3c', 0.85, vary='#6b4f35', vary_scale=40, bump=0.25, bump_scale=200), 'X', 260.0, strength=0.4)
M['vagen'] = material('vagen', '#355f6e', 0.05, vary='#41707e', vary_scale=3, coat=0.7, bump=0.1, bump_scale=40)
M['hillside'] = material('floyen', '#5f8a3e', 0.9, vary='#557d37', vary_scale=14, bump=0.25, bump_scale=160)
M['forest'] = material('floyenForest', '#3c5f32', 0.85, vary='#47703c', vary_scale=16, bump=0.3, bump_scale=90)
M['cobbleB'] = masonry('bryggenCobbles', '#8f8a82', '#6a665f', scale=160, rough=0.85, vary='#827d75')
M['hullWhite'] = material('hullWhite', '#f2f2ee', 0.4)
M['hullBlue'] = material('hullBlue', '#2c4d78', 0.5)

S = 0.0155              # metres to the tile's units
Z0 = G + 0.002          # the harbour
ZQ = G + 0.03           # the quay and the ground
FY = -0.28              # the houses' fronts on the tile (before the turn)
TURN = math.radians(-32.0)


def P(x, y, z):
    return Vector((x * S, FY + y * S, ZQ + z * S))


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def unturn(x, y):
    c, s_ = math.cos(-TURN), math.sin(-TURN)
    return x * c - y * s_, x * s_ + y * c


# ------------------------------------------------------------------ the ground: the harbour in front, the wharf, Fløyen rising behind
QUAY = FY - 9.0 * S


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.2)
    if y < QUAY:
        return 0.0
    base = 0.03
    rise = 0.42 * smooth((y - (FY + 60.0 * S)) / 0.85)
    return (base + rise) * rim


def pick(z, nz, x, y):
    if y < QUAY + 0.002:
        return 0
    return 1 if z < 0.035 else 2


ground = terrain('ground', lambda x, y: H(*unturn(x, y)), [M['vagen'], M['cobbleB'], M['hillside']], lambda z, nz, x, y: pick(z, nz, *unturn(x, y)), rings=200, segs=520)
GZ = lambda x, y: G + H(x, y)
BEFORE = set(bpy.data.objects)
slab('harbour', M['vagen'], [(-2.0, -2.0), (2.0, -2.0), (2.0, QUAY - 0.001), (-2.0, QUAY - 0.001)], G - 0.004, Z0, margin=0.02)
slab('quay', M['quay'], [(-2.0, QUAY), (2.0, QUAY), (2.0, FY + 0.5 * S), (-2.0, FY + 0.5 * S)], G - 0.004, ZQ + 0.004, margin=0.03)
trees = []
for k in range(9000):
    x, y = rng.uniform(-1.5, 1.5), rng.uniform(FY + 62.0 * S, 1.5)
    if math.hypot(x, y) > 1.4 or rng.random() > 0.38:
        continue
    r = rng.uniform(0.02, 0.03)
    trees.append(((x, y, GZ(x, y) + r * 0.7), r, 1.1))
blob_cloud('floyenForest', M['forest'], trees)

# ------------------------------------------------------------------ the wharf houses: the front row on the quay, the row behind
HOUSES = {k: bmesh.new() for k in CLAD}
ROOFS = {'roofDark': bmesh.new(), 'roofRed': bmesh.new()}
WIN, HOISTS = [], bmesh.new()


def house(x0, w, y0, d, eaves, rise, colour, front=True, roof='roofDark'):
    """One wharf house from x0, w metres wide and d deep from y0, its gable to the harbour."""
    bm = HOUSES[colour]
    ROOF = ROOFS[roof]
    xm = x0 + w / 2
    pts = [(x0, -0.3), (x0 + w, -0.3), (x0 + w, eaves), (xm, eaves + rise), (x0, eaves)]
    add_prism(bm, [bm.verts.new(P(u, y0, z)) for u, z in pts], [bm.verts.new(P(u, y0 + d, z)) for u, z in pts])
    # the roof: two steep planes standing a little proud of the walls
    over = 0.45
    for side in (-1, 1):
        a = (xm, eaves + rise + 0.25)
        b = (xm + side * (w / 2 + over), eaves - 0.35)
        v = [ROOF.verts.new(P(px, py, pz)) for px, py, pz in ((a[0], y0 - over, a[1]), (b[0], y0 - over, b[1]), (b[0], y0 + d + over, b[1]), (a[0], y0 + d + over, a[1]))]
        ROOF.faces.new(v)
        v2 = [ROOF.verts.new(p.co - Vector((0, 0, 0.25 * S))) for p in v]
        ROOF.faces.new(list(reversed(v2)))
        for i in range(4):
            j = (i + 1) % 4
            ROOF.faces.new((v[j], v[i], v2[i], v2[j]))
    if not front:
        return
    n = max(2, int(w / 3.0))
    for row, (z, h) in enumerate(((2.2, 2.0), (5.6, 2.0), (8.8, 1.9))):
        for k in range(n):
            u = x0 + w * (k + 0.5) / n
            c = P(u, y0 - 0.05, 0)
            WIN.append((c.x, c.y, ZQ + z * S, 1.15 * S, h * S, (0, -1), 'rect'))
    c = P(xm, y0 - 0.05, 0)
    WIN.append((c.x, c.y, ZQ + (eaves + 0.8) * S, 1.1 * S, 1.5 * S, (0, -1), 'rect'))
    hb = P(xm, y0 - 1.2, eaves + 3.0)
    bmesh.ops.create_cube(HOISTS, size=1.0, matrix=Matrix.Translation(hb) @ Matrix.Diagonal((0.4 * S, 2.6 * S, 0.4 * S, 1)))
    bmesh.ops.create_cube(HOISTS, size=1.0, matrix=Matrix.Translation(hb + Vector((0, -0.2 * S, 0.7 * S))) @ Matrix.Diagonal((1.6 * S, 1.6 * S, 0.25 * S, 1)))


order = ['red', 'ochre', 'white', 'red', 'cream', 'brownred', 'yellow', 'white', 'red', 'ochre', 'cream', 'red', 'white', 'yellow', 'brownred']
x = -66.0
k = 0
while x < 64.0:
    w = rng.uniform(7.4, 9.6)
    eaves = rng.uniform(10.0, 12.5)
    house(x, w, 0.0, 20.0, eaves, w * 0.62, order[k % len(order)], roof='roofRed' if k % 4 == 2 else 'roofDark')
    house(x + 0.3, w - 0.6, 23.0, 14.0, eaves - rng.uniform(1.0, 2.5), (w - 0.6) * 0.6, order[(k + 5) % len(order)], front=False, roof='roofRed' if k % 3 == 0 else 'roofDark')
    x += w + rng.choice((0.0, 0.0, 1.6))
    k += 1
for c_, bm in HOUSES.items():
    finish(f'houses{c_}', bm, CLAD[c_], smooth_sides=False)
for key, bm in ROOFS.items():
    finish(key, bm, M[key], smooth_sides=False)
finish('hoists', HOISTS, M['quay'], smooth_sides=False)
glazed('windows', WIN, M['white'], depth=0.25 * S)


# ------------------------------------------------------------------ boats in the harbour, people on the quay
def boat(name, x, y, rot, length, hull):
    m = Matrix.Translation((x, y, Z0)) @ Matrix.Rotation(rot, 4, 'Z')
    bm = bmesh.new()
    rings = []
    for j in range(11):
        t = -1 + 2 * j / 10
        w = 0.32 * length * (1 - t * t) ** 0.45 * (0.6 if t > 0 else 1.0) + 0.01 * length
        rings.append([bm.verts.new(m @ Vector((t * length / 2, u * w / 2, v))) for u, v in ((-1, 0.07 * length), (-0.8, -0.02 * length), (0.8, -0.02 * length), (1, 0.07 * length))])
    for a, b in zip(rings, rings[1:]):
        for i in range(3):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    finish(name, bm, M[hull], smooth_all=True)
    box_m(name + 'Cabin', M['white'], m @ Matrix.Translation((-0.08 * length, 0, 0.11 * length)), (0.3 * length, 0.18 * length, 0.08 * length), bevel=0.002)


boat('boat0', -0.55, QUAY - 0.22, 0.05, 0.22, 'hullWhite')
boat('boat1', 0.45, QUAY - 0.3, -0.1, 0.18, 'hullBlue')
for k, (x, y, shirt) in enumerate(((-0.6, QUAY + 0.06, 'red'), (-0.2, QUAY + 0.08, 'blue'), (0.15, QUAY + 0.05, 'yellow'), (0.55, QUAY + 0.09, 'green'), (0.8, QUAY + 0.06, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=ZQ + 0.004, scale=0.8)

R = Matrix.Rotation(TURN, 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('bryggen')
