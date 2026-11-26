# The Rialto Bridge in the high-quality look (hq.py), drawn to its real proportions (laid out in metres):
# Venice's white Istrian stone arch over the Grand Canal, its walkways stepping up from the quays to the
# crown, the balustrades along the outer ones, the two rows of arcaded shops under their grey roofs, the
# portico at the crown with its great arch and pediment; the canal with gondolas and their gondoliers,
# the striped mooring poles, the quays, and people.
# Run: blender -b --factory-startup -P rialto-bridge.py -- rialto-bridge-1024.png 1024 rialto-bridge.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1591)
M['istrian'] = material('istrianStone', '#ece7dc', 0.5, vary='#ded8cb', vary_scale=20, bump=0.1, bump_scale=150)
M['istrianShade'] = material('istrianShade', '#d6cfc0', 0.55, vary='#c9c1b1', vary_scale=20, bump=0.1, bump_scale=150)
M['canal'] = material('grandCanal', '#3f8a86', 0.06, vary='#4a968f', vary_scale=3, coat=0.6, bump=0.12, bump_scale=40)
M['leadR'] = material('leadR', '#8f969b', 0.45, vary='#838a8f', vary_scale=12, metallic=0.3)
M['gondola'] = material('gondolaBlack', '#1b1c1f', 0.3, coat=0.6)
M['poleBlue'] = material('poleBlue', '#2f5d9a', 0.5)
M['fondamenta'] = masonry('fondamenta', '#b9b2a6', '#8f897f', scale=90, rough=0.8, vary='#ada69a')

S = 0.045               # metres to the tile's units
Z0 = G + 0.002          # the water
QZ = 1.4                # the quays' height above the water (metres)
HALF = 24.0             # half the bridge's length on the quays
SPAN = 14.4             # half the arch's span
BW = 11.0               # half the bridge's width


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def deck(x):
    """The walkways' height (metres) along the bridge: up from the quays to the crown."""
    return QZ + 9.6 * (1 - min(1.0, abs(x) / HALF) ** 1.6)


def soffit(x):
    """The arch's underside over the canal."""
    R = (SPAN ** 2 + 6.4 ** 2) / (2 * 6.4)
    return 7.4 - R + math.sqrt(max(0.0, R * R - x * x))


# ------------------------------------------------------------------ the canal and the quays
slab('canal', M['canal'], [(-SPAN * S, -2), (SPAN * S, -2), (SPAN * S, 2), (-SPAN * S, 2)], G - 0.004, Z0, margin=0.02)
for sx in (-1, 1):
    slab(f'quay{sx}', M['fondamenta'], [(sx * SPAN * S, -2), (sx * 2.0, -2), (sx * 2.0, 2), (sx * SPAN * S, 2)], G - 0.004, Z0 + QZ * S, bevel=0.003, margin=0.02)

# ------------------------------------------------------------------ the bridge's body: the arch and the walkways' fill
prof = [(-HALF, -0.5), (-SPAN, -0.5)] + [(x, soffit(x)) for x in [-SPAN + 2 * SPAN * k / 24 for k in range(25)]] + [(SPAN, -0.5), (HALF, -0.5)]
prof += [(x, deck(x)) for x in [HALF - 2 * HALF * k / 30 for k in range(31)]]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, -BW, z)) for x, z in prof], [bm.verts.new(P(x, BW, z)) for x, z in prof])
finish('bridge', bm, M['istrian'], bevel=0.004, smooth_sides=False)
# the arch's moulded edge, on both faces
for sy in (-1, 1):
    tube(f'archivolt{sy}', M['istrianShade'], [P(x, sy * (BW + 0.3), soffit(x) + 0.6) for x in [-SPAN + 2 * SPAN * k / 30 for k in range(31)]], 0.5 * S)
    tube(f'cornice{sy}', M['istrianShade'], [P(x, sy * (BW + 0.3), deck(x) - 0.3) for x in [-HALF + 2 * HALF * k / 40 for k in range(41)]], 0.35 * S)

# ------------------------------------------------------------------ the steps up the three walkways
STEPS = bmesh.new()
for lane, (y0, y1) in enumerate(((-BW, -7.0), (-3.0, 3.0), (7.0, BW))):
    for k in range(32):
        x0, x1 = -HALF + 2 * HALF * k / 32, -HALF + 2 * HALF * (k + 1) / 32
        if abs((x0 + x1) / 2) < 3.5 and lane == 1:
            continue
        z = deck((x0 + x1) / 2) + 0.12
        bmesh.ops.create_cube(STEPS, size=1.0, matrix=Matrix.Translation(P((x0 + x1) / 2, (y0 + y1) / 2, z)) @ Matrix.Diagonal(((x1 - x0) * 0.92 * S, (y1 - y0) * S, 0.24 * S, 1)))
finish('steps', STEPS, M['istrianShade'], smooth_sides=False)
# the balustrades along the outer walkways
POSTS = bmesh.new()
for sy in (-1, 1):
    for k in range(60):
        x = -HALF + 1.0 + (2 * HALF - 2.0) * k / 59
        bmesh.ops.create_cone(POSTS, cap_ends=True, segments=6, radius1=0.16 * S, radius2=0.1 * S, depth=0.9 * S, matrix=Matrix.Translation(P(x, sy * (BW - 0.3), deck(x) + 0.7)))
    tube(f'rail{sy}', M['istrian'], [P(x, sy * (BW - 0.3), deck(x) + 1.25) for x in [-HALF + 1 + (2 * HALF - 2) * k / 40 for k in range(41)]], 0.18 * S)
finish('balusters', POSTS, M['istrian'], smooth_all=True)

# ------------------------------------------------------------------ the shops: two rows of arcades each side of the crown, under grey roofs
DOORS = []
for sx in (-1, 1):
    for sy in (-1, 1):
        for k in range(6):
            x0 = sx * (4.2 + 2.9 * k)
            x1 = sx * (4.2 + 2.9 * (k + 1))
            xm = (x0 + x1) / 2
            z0 = deck(xm) + 0.2
            box(f'shop{sx}{sy}{k}', M['istrian'], P(xm, sy * 5.0, z0 + 2.4), (2.9 * S, 4.0 * S, 4.8 * S), bevel=0.001)
            gable_roof(f'shopRoof{sx}{sy}{k}', M['leadR'], min(x0, x1) * S, max(x0, x1) * S, (sy * 5.0 - 2.4) * S, (sy * 5.0 + 2.4) * S, Z0 + (z0 + 4.8) * S, 1.2 * S, over=0.001)
            for face in (-1, 1):
                DOORS.append((xm * S, (sy * 5.0 + face * 2.0) * S, Z0 + (z0 + 0.3) * S, 2.0 * S, 3.4 * S, (0, face), 'round'))
# the portico at the crown: its great arches over the walkway and its pediment towards the canal
box('portico', M['istrian'], P(0, 0, deck(0) + 3.6), (8.0 * S, 14.0 * S, 7.2 * S), bevel=0.002)
for sy in (-1, 1):
    bm = bmesh.new()
    tri = [(-4.3, deck(0) + 7.2), (4.3, deck(0) + 7.2), (0.0, deck(0) + 9.6)]
    add_prism(bm, [bm.verts.new(P(u, sy * 7.2, z)) for u, z in tri], [bm.verts.new(P(u, sy * 6.0, z)) for u, z in tri])
    finish(f'pediment{sy}', bm, M['istrian'], smooth_sides=False)
    DOORS.append((0.0, sy * 7.05 * S, Z0 + (deck(0) + 0.3) * S, 4.4 * S, 6.0 * S, (0, sy), 'round'))
gable_roof('porticoRoof', M['leadR'], -4.0 * S, 4.0 * S, -7.0 * S, 7.0 * S, Z0 + (deck(0) + 7.2) * S, 2.3 * S, over=0.002, along='y')
M['shopFront'] = material('shopFront', '#5d4632', 0.6)
glazed('shopFronts', DOORS, M['istrianShade'], glass=M['shopFront'], depth=0.3 * S)

# ------------------------------------------------------------------ gondolas, mooring poles, people
def gondola(name, x, y, rot):
    m = Matrix.Translation((x, y, Z0)) @ Matrix.Rotation(rot, 4, 'Z')
    bm = bmesh.new()
    rings = []
    for j in range(13):
        t = -1 + 2 * j / 12
        w = 0.032 * (1 - t * t) ** 0.6 + 0.003
        lift = 0.035 * abs(t) ** 4
        rings.append([bm.verts.new(m @ Vector((t * 0.24, u * w, lift + v))) for u, v in ((-1, 0.012), (-0.7, 0.0), (0.7, 0.0), (1, 0.012))])
    for a, b in zip(rings, rings[1:]):
        for k in range(3):
            bm.faces.new((a[k], a[k + 1], b[k + 1], b[k]))
    finish(name, bm, M['gondola'], smooth_all=True)
    box_m(name + 'Ferro', M['steel'], m @ Matrix.Translation((0.245, 0, 0.05)), (0.006, 0.012, 0.03), bevel=0.001)
    person(name + 'Gondolier', x - 0.16 * math.cos(rot), y - 0.16 * math.sin(rot), rot, 'white', z=Z0 + 0.012, scale=0.9)


for k, (x, y, r) in enumerate(((-0.25, -1.05, 0.3), (0.2, -0.75, -0.2), (-0.1, 0.85, 0.15), (0.3, 1.15, 2.9))):
    gondola(f'gondola{k}', x, y, math.pi / 2 + r)
for k, (x, y) in enumerate(((-0.6, -0.45), (-0.6, -0.6), (0.6, 0.5), (0.6, 0.65), (-0.6, 0.9), (0.6, -0.95))):
    cylinder(f'pole{k}', M['poleBlue'], 0.006, 0.14, (x, y, G - 0.004), segs=10)
    cylinder(f'poleBand{k}', M['white'], 0.0062, 0.02, (x, y, Z0 + 0.06), segs=10)
for k, (x, y, shirt) in enumerate(((-1.0, -0.55, 'red'), (-0.85, 0.3, 'blue'), (0.95, -0.4, 'yellow'), (1.05, 0.45, 'green'), (-0.3, -0.38, 'red'), (0.25, 0.38, 'blue'))):
    zz = Z0 + (deck(x / S) + 0.24 if abs(x) < HALF * S and abs(y) < BW * S else QZ) * S
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=zz)

render('rialto-bridge')
