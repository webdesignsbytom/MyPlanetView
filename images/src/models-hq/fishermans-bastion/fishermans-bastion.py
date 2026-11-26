# Fisherman's Bastion in the high-quality look (hq.py), laid out in metres (drawn shorter, to fit):
# Budapest's white terraces along the edge of Castle Hill, their round-arched arcades on two levels,
# the grand stair down the middle, and the seven towers with their pointed cone roofs; behind it the
# Matthias Church with its roof of coloured diamond-patterned tiles and its tall Gothic spire; the wooded
# slope below, and people.
# Run: blender -b --factory-startup -P fishermans-bastion.py -- fishermans-bastion-1024.png 1024 fishermans-bastion.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1902)
M['whiteB'] = material('bastionStone', '#efe9dc', 0.7, vary='#e4ddcf', vary_scale=24, bump=0.1, bump_scale=200)
M['whiteShade'] = material('bastionStoneShade', '#d9d2c3', 0.75)
M['zsolnay'] = chequer('zsolnayRoof', '#e0a63a', '#2a6f58', scale=26.0, rough=0.4)
M['zsolnayEdge'] = material('zsolnayEdge', '#a8452e', 0.5)
M['slopeB'] = material('castleHillSlope', '#5f8a3e', 0.9, vary='#6b9647', vary_scale=14)
M['treeB'] = material('castleHillTrees', '#3f7a36', 0.85, vary='#4c8a40', vary_scale=14, bump=0.3, bump_scale=90)
M['pavingB'] = masonry('castlePaving', '#cfc6b6', '#aca393', scale=90, rough=0.85, vary='#c6bdad')
M['recessB'] = material('bastionRecess', '#4f4a44', 0.9)
M['slateB'] = material('spireSlate', '#4e5458', 0.6)

S = 0.034               # metres to the tile's units
Z0 = G
TOP = 14.0              # the terrace's top (the hilltop)
EDGE = -12.0            # the bastion's front line (y)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    return TOP * smooth((y - EDGE + 18.0) / 16.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.14)
    return ground(x / S, y / S) * S * rim


land = terrain('hill', H, [M['slopeB']], lambda z, nz, x, y: 0, rings=140, segs=360)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


WIN = []
slab('hilltop', M['pavingB'], [(-2.0, EDGE * S), (2.0, EDGE * S), (2.0, 2.0), (-2.0, 2.0)], Z0 + (TOP - 0.2) * S, Z0 + (TOP + 0.12) * S, margin=0.03)     # its top a little above the hill's


def cone_tower(name, x, y, r, h, roof):
    """A bastion tower: round walls with a ring of little arched windows, a pointed cone roof."""
    z0 = ground(x, y) - 1.0
    cylinder(name, M['whiteB'], r * S, (TOP + h - z0) * S, P(x, y, z0), segs=24)
    cylinder(name + 'Ring', M['whiteShade'], (r + 0.3) * S, 0.6 * S, P(x, y, TOP + h - 0.6), segs=24)
    for k in range(6):
        a = 2 * math.pi * k / 6
        c = P(x + (r + 0.02) * math.cos(a), y + (r + 0.02) * math.sin(a), 0)
        WIN.append((c.x, c.y, Z0 + (TOP + h - 3.2) * S, 0.9 * S, 2.0 * S, (math.cos(a), math.sin(a)), 'round'))
    lathe(name + 'Roof', M['whiteB'], [((r + 0.4) * S, 0.0), (r * 0.8 * S, roof * 0.3 * S), (r * 0.35 * S, roof * 0.75 * S), (0.0, roof * S)], P(x, y, TOP + h), segs=24, smooth=True)


# ------------------------------------------------------------------ the bastion: its arcaded wall on two levels, the stair, the seven towers
L = 34.0
for level, (z0, z1, inset) in enumerate(((TOP - 10.0, TOP - 4.0, 0.0), (TOP - 4.0, TOP + 3.6, 3.0))):
    y = EDGE + inset
    box(f'wall{level}', M['whiteB'], P(0.0, y + 2.0, (z0 + z1) / 2), (2 * L * S, 4.0 * S, (z1 - z0) * S), bevel=0)
    n = 18 if level else 22
    for k in range(n):
        x = -L + 2 * L * (k + 0.5) / n
        if abs(x) < 4.0 and level == 0:
            continue
        c = P(x, y - 0.03, 0)
        WIN.append((c.x, c.y, Z0 + (z0 + 0.6) * S, 2.2 * S, (z1 - z0 - 1.6) * S, (0, -1), 'round'))
    box(f'walk{level}', M['pavingB'], P(0.0, y + 2.0, z1 + 0.1), (2 * L * S, 4.4 * S, 0.3 * S), bevel=0)
    for k in range(int(2 * L / 2.0)):
        x = -L + 2.0 * k + 1.0
        box(f'merlon{level}{k}', M['whiteB'], P(x, y + 0.3, z1 + 0.8), (1.0 * S, 0.6 * S, 1.4 * S), bevel=0)
for j in range(12):
    z = TOP - 10.0 + (j + 1) * 0.85
    box(f'stair{j}', M['whiteShade'], P(0.0, EDGE - 9.0 + j * 0.8, z - 0.4), (7.0 * S, 0.8 * S, 0.8 * S), bevel=0)
for k, (x, y, r, h, roof) in enumerate(((-L, EDGE + 2.0, 3.6, 7.0, 8.0), (-L * 0.62, EDGE + 1.0, 2.8, 5.0, 6.0), (-L * 0.3, EDGE + 4.5, 3.0, 7.0, 7.0),
                                         (0.0, EDGE + 6.0, 4.6, 11.0, 10.0), (L * 0.3, EDGE + 4.5, 3.0, 7.0, 7.0), (L * 0.62, EDGE + 1.0, 2.8, 5.0, 6.0), (L, EDGE + 2.0, 3.6, 7.0, 8.0))):
    cone_tower(f'tower{k}', x, y, r, h, roof)

# ------------------------------------------------------------------ the Matthias Church: nave, the diamond-tiled roof, the spire
CX, CY = -4.0, 20.0
box('nave', M['whiteB'], P(CX, CY, TOP + 8.0), (16.0 * S, 34.0 * S, 16.0 * S), bevel=0)
gable_roof('naveRoof', M['zsolnay'], (CX - 8.6) * S, (CX + 8.6) * S, (CY - 17.0) * S, (CY + 17.0) * S, Z0 + (TOP + 16.0) * S, 9.0 * S, over=0.0, along='y')
for s in (-1, 1):
    for k in range(5):
        y = CY - 13.0 + 6.5 * k
        c = P(CX + s * 8.05, y, 0)
        WIN.append((c.x, c.y, Z0 + (TOP + 4.0) * S, 2.2 * S, 8.0 * S, (s, 0), 'pointed'))
SX, SY = CX + 9.0, CY - 14.0
box('bellTower', M['whiteB'], P(SX, SY, TOP + 18.0), (7.0 * S, 7.0 * S, 36.0 * S), bevel=0)
for z in (TOP + 22.0, TOP + 30.0):
    for nx, ny in ((0, -1), (-1, 0)):
        c = P(SX + nx * 3.55, SY + ny * 3.55, 0)
        WIN.append((c.x, c.y, Z0 + z * S, 1.6 * S, 5.0 * S, (nx, ny), 'pointed'))
lathe('belfry', M['whiteShade'], [(3.0 * S, 0.0), (3.0 * S, 6.0 * S), (2.6 * S, 6.6 * S)], (0, 0, 0), segs=8,
      matrix=Matrix.Translation(P(SX, SY, TOP + 36.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('spire', M['slateB'], [(2.8 * S, 0.0), (1.4 * S, 8.0 * S), (0.5 * S, 16.0 * S), (0.0, 20.0 * S)], (0, 0, 0), segs=8,
      matrix=Matrix.Translation(P(SX, SY, TOP + 42.6)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
glazed('windows', WIN, M['whiteShade'], glass=M['recessB'], depth=0.3 * S, bars=False)

# ------------------------------------------------------------------ trees on the slope below, people
TREES = []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.34, seed=8):
    x, y = p.x / S, p.y / S
    if y > EDGE - 11.0 or abs(x) < 6.0:
        continue
    TREES.append(((p.x, p.y, p.z + 3.0 * S), rng.uniform(2.0, 3.2) * S, 0.85))
    if len(TREES) >= 90:
        break
blob_cloud('trees', M['treeB'], TREES)
for k, (x, y, z, shirt) in enumerate(((-12.0, EDGE + 5.0, TOP + 3.7, 'red'), (8.0, EDGE + 5.0, TOP + 3.7, 'blue'), (-20.0, EDGE + 1.6, TOP - 3.9, 'yellow'), (-14.0, 0.0, TOP + 0.1, 'green'), (10.0, 2.0, TOP + 0.1, 'red'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('fishermans-bastion')
