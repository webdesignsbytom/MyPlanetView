# The trulli of Alberobello in the high-quality look (hq.py), laid out in metres along a lane of the
# Rione Monti: the little whitewashed houses, round and square, under their conical roofs of grey
# limestone slabs laid in courses, each crowned with its white pinnacle, a few cones painted with a
# white symbol, a house of two cones, little chimneys and wooden doors; the lane of pale stone climbing
# between them, the olive trees and the dry-stone walls in the red earth beyond, and people.
# Run: blender -b --factory-startup -P trulli.py -- trulli-1024.png 1024 trulli.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1797)
M['whitewash'] = material('whitewash', '#f4f1ea', 0.85, vary='#ebe7dd', vary_scale=24, bump=0.15, bump_scale=160)
M['chiancarelle'] = banded(masonry('chiancarelle', '#8e8b84', '#5f5c57', scale=420, rough=0.9, vary='#827f78'), 'Z', 700.0, strength=0.35)
M['cobbles'] = masonry('laneCobbles', '#d6cfc1', '#aea797', scale=260, rough=0.85, vary='#ccc5b6')
M['redEarth'] = material('apulianEarth', '#a8683f', 0.95, vary='#9a5d38', vary_scale=14, bump=0.3, bump_scale=200)
M['olive'] = material('oliveLeaf', '#7d8f5a', 0.85, vary='#8c9b68', vary_scale=14, bump=0.3, bump_scale=90)
M['oliveWood'] = material('oliveWood', '#6b5a45', 0.85, vary='#5d4e3c', vary_scale=30)
M['dryStone'] = material('dryStone', '#bdb5a5', 0.9, vary='#a99f8d', vary_scale=40, bump=0.4, bump_scale=200)
M['grassA'] = material('apulianGrass', '#8a9a55', 0.9, vary='#97a35f', vary_scale=12, bump=0.3, bump_scale=200)

S = 0.07                # metres to the tile's units


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def lane_x(y):
    """The lane's middle, wandering a little as it climbs away from us."""
    return 1.2 * math.sin(y / 9.0)


def ground(x, y):
    return 0.6 + 0.09 * (y + 20.0) + 0.25 * math.sin(x / 3.0) * math.cos(y / 4.0) * smooth((abs(x - lane_x(y)) - 3.0) / 3.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return ground(x / S, y / S) * S * rim


def pick(z, nz, x, y):
    mx, my = x / S, y / S
    d = abs(mx - lane_x(my))
    if d < 2.4:
        return 0
    return 1 if abs(mx) < 15.0 else 2


land = terrain('ground', H, [M['cobbles'], M['grassA'], M['redEarth']], pick, rings=300, segs=760)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, G + z * S))


WIN, DOORS, PAINT = [], [], bmesh.new()


def cone(name, x, y, z0, r, h):
    """A trullo's corbelled roof: a cone of stone courses, a little bowed, its white pinnacle on top."""
    prof = [(r * 1.04, 0.0)] + [(r * (1.0 - t) ** 0.92, h * t) for t in (0.15, 0.35, 0.55, 0.75, 0.9)] + [(r * 0.08, h * 0.98)]
    lathe(name, M['chiancarelle'], [(a * S, b * S) for a, b in prof], P(x, y, z0), segs=32, smooth=True)
    kind = rng.randrange(3)
    top = z0 + h * 0.97
    cylinder(name + 'Pinnacle', M['whitewash'], 0.35 * S, 0.5 * S, P(x, y, top), segs=12)
    if kind == 0:
        lathe(name + 'Ball', M['whitewash'], [(0.0, 0.0), (0.4 * S, 0.3 * S), (0.42 * S, 0.5 * S), (0.3 * S, 0.75 * S), (0.0, 0.85 * S)], P(x, y, top + 0.5), segs=16, smooth=True)
    elif kind == 1:
        cylinder(name + 'Disc', M['whitewash'], 0.55 * S, 0.12 * S, P(x, y, top + 0.5), segs=16)
        lathe(name + 'Ball', M['whitewash'], [(0.0, 0.0), (0.25 * S, 0.2 * S), (0.0, 0.45 * S)], P(x, y, top + 0.62), segs=12, smooth=True)
    else:
        lathe(name + 'Spike', M['whitewash'], [(0.4 * S, 0.0), (0.0, 1.1 * S)], P(x, y, top + 0.5), segs=12)


def symbol(x, y, z0, r, h, face, shape):
    """A white symbol painted on the cone's face towards `face` (radians), at about a third of its height."""
    zc = z0 + h * 0.4
    rr = r * (1.0 - 0.4) ** 0.92 + 0.04
    nx, ny = math.cos(face), math.sin(face)
    tx, ty = -ny, nx
    strokes = {'cross': [(-0.06, 0.06, -0.45, 0.45), (-0.3, 0.3, 0.05, 0.17)],
               'star': [(-0.06, 0.06, -0.35, 0.35), (-0.35, 0.35, -0.06, 0.06), (-0.25, 0.25, -0.25, -0.15), (-0.25, 0.25, 0.15, 0.25)],
               'heart': [(-0.3, -0.05, 0.0, 0.25), (0.05, 0.3, 0.0, 0.25), (-0.2, 0.2, -0.3, 0.05)]}[shape]
    for u0, u1, v0, v1 in strokes:
        q = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
        add_prism(PAINT, [PAINT.verts.new(P(x + nx * (rr + 0.02) + tx * u, y + ny * (rr + 0.02) + ty * u, zc + v)) for u, v in q],
                  [PAINT.verts.new(P(x + nx * (rr - 0.12) + tx * u, y + ny * (rr - 0.12) + ty * u, zc + v)) for u, v in q])


def trullo(name, x, y, r, wall, h, round_base=True, door_face=None, sign=None):
    g = min(ground(x + dx, y + dy) for dx in (-r, r) for dy in (-r, r))
    gt = max(ground(x + dx, y + dy) for dx in (-r, r) for dy in (-r, r))
    z0 = gt + wall
    if round_base:
        cylinder(name + 'Base', M['whitewash'], (r + 0.3) * S, (z0 - g + 0.4) * S, P(x, y, g - 0.4), segs=32)
    else:
        box(name + 'Base', M['whitewash'], P(x, y, (g - 0.4 + z0) / 2), (2 * (r + 0.35) * S, 2 * (r + 0.35) * S, (z0 - g + 0.4) * S), bevel=0.0015)
    cylinder(name + 'Eave', M['whitewash'], (r + 0.4) * S, 0.3 * S, P(x, y, z0 - 0.15), segs=32)
    cone(name + 'Cone', x, y, z0 + 0.1, r, h)
    if door_face is not None:
        nx, ny = math.cos(door_face), math.sin(door_face)
        d = (r + 0.32) if round_base else (r + 0.37)
        c = P(x + nx * d, y + ny * d, 0)
        DOORS.append((c.x, c.y, G + (ground(x + nx * d, y + ny * d) - 0.05) * S, 1.0 * S, 1.9 * S, (nx, ny), 'round'))
        tx, ty = -ny, nx
        c = P(x + nx * d + tx * 1.2, y + ny * d + ty * 1.2, 0)
        WIN.append((c.x, c.y, G + (ground(x, y) + 1.0) * S, 0.5 * S, 0.6 * S, (nx, ny), 'rect'))
        if sign:
            symbol(x, y, z0 + 0.1, r, h, door_face, sign)
    if rng.random() < 0.4:
        # a chimney stack rising from the wall's top beside the cone, under its little cap
        a = rng.uniform(0.6, 2.4) + (math.pi if (door_face or 0.0) == 0.0 else 0.0)
        cx_, cy_ = x + (r + 0.05) * math.cos(a), y + (r + 0.05) * math.sin(a)
        box(name + 'Chimney', M['whitewash'], P(cx_, cy_, z0 + 1.0), (0.7 * S, 0.7 * S, 2.6 * S), bevel=0.001)
        box(name + 'ChimneyCap', M['whitewash'], P(cx_, cy_, z0 + 2.4), (1.0 * S, 1.0 * S, 0.2 * S), bevel=0.0005)


# ------------------------------------------------------------------ the trulli along both sides of the lane
HOUSES = [(-6.6, -15.0, 2.6, 2.2, 4.6, True, 'cross'), (-7.4, -7.5, 3.0, 2.4, 5.2, False, None), (-6.4, 0.0, 2.5, 2.2, 4.4, True, 'heart'),
          (-7.2, 7.4, 2.9, 2.3, 5.0, True, None), (-6.8, 14.6, 2.6, 2.2, 4.6, False, 'star'), (6.8, -12.6, 2.8, 2.3, 4.9, True, 'star'),
          (7.0, 6.0, 2.6, 2.2, 4.6, True, None), (6.6, 13.6, 2.7, 2.2, 4.8, False, 'cross'), (-12.6, -2.0, 2.4, 2.1, 4.2, True, None), (12.8, -1.0, 2.3, 2.0, 4.0, True, None)]
for k, (x, y, r, wall, h, rb, sign) in enumerate(HOUSES):
    xx = x + lane_x(y)
    face = 0.0 if x < 0 else math.pi
    trullo(f'trullo{k}', xx, y, r, wall, h, round_base=rb, door_face=face if abs(x) < 10 else None, sign=sign)
# a house of two cones on one whitewashed block
x0, y0 = 7.4 + lane_x(-3.0), -3.0
g = min(ground(x0 + dx, y0 + dy) for dx in (-3.0, 3.0) for dy in (-6.0, 6.0))
gt = max(ground(x0 + dx, y0 + dy) for dx in (-3.0, 3.0) for dy in (-6.0, 6.0))
box('twinBase', M['whitewash'], P(x0, y0, (g - 0.4 + gt + 2.4) / 2), (6.2 * S, 11.6 * S, (gt + 2.8 - g) * S), bevel=0.0015)
for j, dy in enumerate((-2.8, 2.8)):
    cylinder(f'twinEave{j}', M['whitewash'], 2.9 * S, 0.3 * S, P(x0, y0 + dy, gt + 2.25), segs=32)
    cone(f'twinCone{j}', x0, y0 + dy, gt + 2.5, 2.6, 4.8)
for dy in (-2.8, 2.8):
    c = P(x0 - 3.15, y0 + dy, 0)
    DOORS.append((c.x, c.y, G + (ground(x0 - 3.1, y0 + dy) - 0.05) * S, 1.0 * S, 1.9 * S, (-1, 0), 'round'))
symbol(x0, y0 - 2.8, gt + 2.5, 2.6, 4.8, math.pi, 'heart')
finish('paintedSymbols', PAINT, M['whitewash'], smooth_sides=False)
glazed('doors', DOORS, M['whitewash'], glass=M['door'], depth=0.2 * S)
glazed('windows', WIN, M['whitewash'], depth=0.2 * S, bars=False)

# ------------------------------------------------------------------ olive trees and dry-stone walls in the fields, people in the lane
STONES, LEAVES = [], []
for x in (-15.5, 15.5):
    for k in range(60):
        y = -19.0 + 38.0 * k / 59
        if math.hypot(x, y) * S > 1.36:
            continue
        for z in (0.35, 0.9):
            STONES.append((P(x + rng.uniform(-0.15, 0.15), y, ground(x, y) + z).to_tuple(), rng.uniform(0.32, 0.42) * S, 0.75))
blob_cloud('dryStoneWalls', M['dryStone'], STONES, subdivisions=1)
for k, (x, y) in enumerate(((-17.0, -8.0), (-17.0, 3.0), (-16.5, 10.0), (17.0, -8.0), (17.0, 2.0), (16.5, 9.0))):
    if math.hypot(x, y) * S > 1.25:
        continue
    g = ground(x, y)
    trunk = [P(x + 0.4 * math.sin(j + k), y + 0.3 * math.cos(j * 1.3 + k), g + 0.7 * j) for j in range(4)]
    tube(f'oliveTrunk{k}', M['oliveWood'], trunk, 0.28 * S)
    for j in range(6):
        a = 2 * math.pi * j / 6 + k
        LEAVES.append((P(x + 1.4 * math.cos(a), y + 1.4 * math.sin(a), g + 2.6 + rng.uniform(-0.3, 0.3)).to_tuple(), 1.3 * S, 0.75))
    LEAVES.append((P(x, y, g + 3.2).to_tuple(), 1.5 * S, 0.75))
blob_cloud('olives', M['olive'], LEAVES)
for k, (y, shirt) in enumerate(((-16.0, 'red'), (-10.0, 'blue'), (-4.5, 'yellow'), (2.5, 'green'), (9.5, 'red'), (15.0, 'blue'))):
    x = lane_x(y) + (0.8 if k % 2 else -0.8)
    c = P(x, y, ground(x, y))
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.5)

R = Matrix.Rotation(math.radians(-32.0 + 30.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('trulli')
