# Sigiriya in the high-quality look (hq.py), laid out in metres (the rock drawn smaller, to fit): Lion Rock
# rising sheer out of the jungle, its streaked orange-grey cliffs and its flat top with the brick terraces
# and pools of the palace; the brick Lion Terrace halfway up (its giant paws left out: no open scan of
# them was found) and the stairs climbing the face from it; at its foot the symmetrical water gardens,
# their long pools, fountains and paths; the jungle round it all, and people.
# Run: blender -b --factory-startup -P sigiriya.py -- sigiriya-1024.png 1024 sigiriya.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(477)
M['gneiss'] = layered('sigiriyaRock', ['#a0705a', '#8f6652', '#b07e64', '#7d6a5e'], scale=7.0, distortion=2.0, rough=0.9, bump=0.5, bump_scale=90, axis='X')
M['brickS'] = material('sigiriyaBrick', '#a8583c', 0.9, vary='#984e36', vary_scale=30, bump=0.2, bump_scale=200)
M['jungleS'] = material('sigiriyaJungle', '#2f7a34', 0.85, vary='#3f8c3a', vary_scale=14, bump=0.3, bump_scale=90)
M['jungleS2'] = material('sigiriyaJungleLight', '#5c9b3c', 0.85, vary='#6aa845', vary_scale=14, bump=0.3, bump_scale=90)
M['floorS'] = material('sigiriyaFloor', '#5c7a36', 0.9, vary='#68863f', vary_scale=14)
M['poolS'] = material('waterGardens', '#3f8a8f', 0.06, coat=0.8)
M['pathS'] = material('gardenPath', '#c9a982', 0.9, vary='#bd9d76', vary_scale=40)
M['lawnS'] = material('gardenLawn', '#7aa64a', 0.85, vary='#87b155', vary_scale=12)
M['ironS'] = material('stairRail', '#3e3a36', 0.5, metallic=0.4)

S = 0.0115              # metres to the tile's units
Z0 = G
RH = 120.0              # the rock's height (drawn lower)
RX, RY = 0.0, 40.0      # the rock's middle


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def rock_edge(x, y):
    """How far inside the rock's outline (an egg-shaped plan, 60 m by 42 m in half-widths)."""
    a = math.atan2(y - RY, (x - RX) * 0.7)
    r = math.hypot((x - RX) / 60.0, (y - RY) / 42.0)
    wobble = 1.0 + 0.06 * math.sin(3 * a) + 0.03 * math.sin(7 * a + 1.0)
    return (wobble - r) * 50.0


def ground(x, y):
    e = rock_edge(x, y)
    rock = RH * smooth(e / 9.0) ** 0.8 + 4.0 * smooth((e - 8.0) / 20.0)
    return 1.0 + rock + 6.0 * smooth((y - 90.0) / 40.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.12)
    return ground(x / S, y / S) * S * rim


def pick(z, nz, x, y):
    if nz < 0.6:
        return 0
    return 2


land = terrain('rock', H, [M['gneiss'], M['brickS'], M['floorS']], pick, rings=360, segs=900)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


# ------------------------------------------------------------------ the water gardens before the rock: pools, paths, fountains
GY0, GY1 = -110.0, -20.0
slab('gardenPath', M['pathS'], [(-8.0 * S, GY0 * S), (8.0 * S, GY0 * S), (8.0 * S, GY1 * S), (-8.0 * S, GY1 * S)], Z0 + 0.9 * S, Z0 + 1.2 * S, margin=0.03)
for s in (-1, 1):
    for k, (y0, y1) in enumerate(((-100.0, -76.0), (-70.0, -46.0), (-40.0, -24.0))):
        x0, x1 = sorted((s * 12.0, s * 40.0))
        slab(f'lawn{s}{k}', M['lawnS'], [((x0 - 2.0) * S, (y0 - 2.0) * S), ((x1 + 2.0) * S, (y0 - 2.0) * S), ((x1 + 2.0) * S, (y1 + 2.0) * S), ((x0 - 2.0) * S, (y1 + 2.0) * S)], Z0 + 0.9 * S, Z0 + 1.1 * S, margin=0.03)
        slab(f'pool{s}{k}', M['poolS'], [(x0 * S, y0 * S), (x1 * S, y0 * S), (x1 * S, y1 * S), (x0 * S, y1 * S)], Z0 + 1.0 * S, Z0 + 1.25 * S, margin=0.03)
    for k in range(4):
        lathe(f'fountain{s}{k}', M['poolS'], [(0.4 * S, 0.0), (0.15 * S, 2.4 * S), (0.0, 3.0 * S)], P(s * 26.0, -94.0 + 8.0 * k, 1.25), segs=8)

# ------------------------------------------------------------------ the Lion Terrace halfway up, the stairs up the face, the palace on top
LY = RY - 44.0
LZ = 1.0 + RH * 0.42
box('lionTerrace', M['brickS'], P(RX, LY + 2.0, LZ - 3.0), (34.0 * S, 14.0 * S, 6.0 * S), bevel=0)
box('lionTerraceWall', M['brickS'], P(RX, LY - 4.6, LZ + 0.8), (34.0 * S, 0.8 * S, 1.6 * S), bevel=0)
bm = bmesh.new()
sec = [(LY - 40.0, 1.0), (LY - 5.0, LZ - 0.2), (LY - 5.0, LZ - 6.0), (LY - 34.0, 1.0)]
add_prism(bm, [bm.verts.new(P(RX - 3.0, y, z)) for y, z in sec], [bm.verts.new(P(RX + 3.0, y, z)) for y, z in sec])
finish('approachStair', bm, M['brickS'], smooth_sides=False)
box('lionStairBase', M['brickS'], P(RX, LY + 6.0, LZ + 6.0), (10.0 * S, 6.0 * S, 12.0 * S), bevel=0)
ZIG = [(RX - 6.0, LY + 6.0, LZ + 12.0), (RX + 10.0, LY + 8.0, LZ + 30.0), (RX - 8.0, LY + 10.0, LZ + 48.0), (RX + 4.0, LY + 12.0, RH + 1.0)]
for (xa, ya, za), (xb, yb, zb) in zip(ZIG, ZIG[1:]):
    n = 14
    for j in range(n):
        t = (j + 0.5) / n
        box(f'step{xa:+.0f}{za:.0f}{j}', M['ironS'], P(xa + (xb - xa) * t, ya + (yb - ya) * t, za + (zb - za) * t), (2.4 * S, 1.4 * S, 0.3 * S), bevel=0)
    tube(f'rail{xa:+.0f}{za:.0f}', M['ironS'], [P(xa, ya - 1.2, za + 1.2), P(xb, yb - 1.2, zb + 1.2)], 0.12 * S)
for k, (x, y, w, d) in enumerate(((RX - 20.0, RY + 4.0, 16.0, 12.0), (RX + 6.0, RY + 14.0, 18.0, 10.0), (RX + 22.0, RY - 6.0, 10.0, 14.0), (RX - 4.0, RY - 18.0, 12.0, 8.0))):
    for (u0, u1, v0, v1) in ((-w / 2, w / 2, -d / 2, -d / 2 + 1.0), (-w / 2, w / 2, d / 2 - 1.0, d / 2), (-w / 2, -w / 2 + 1.0, -d / 2, d / 2), (w / 2 - 1.0, w / 2, -d / 2, d / 2)):
        gx, gy = x + (u0 + u1) / 2, y + (v0 + v1) / 2
        box(f'ruin{k}{u0:+.0f}{v0:+.0f}', M['brickS'], P(gx, gy, ground(gx, gy) + 0.6), ((u1 - u0) * S, (v1 - v0) * S, 2.4 * S), bevel=0)
slab('summitPool', M['poolS'], [((RX + 10.0) * S, (RY - 20.0) * S), ((RX + 26.0) * S, (RY - 20.0) * S), ((RX + 26.0) * S, (RY - 12.0) * S), ((RX + 10.0) * S, (RY - 12.0) * S)], Z0 + (ground(RX + 18.0, RY - 16.0) - 0.4) * S, Z0 + (ground(RX + 18.0, RY - 16.0) + 0.3) * S, margin=0.03)

# ------------------------------------------------------------------ the jungle round the rock and on its top, people
TREES = []
for p in scatter_on(land, 30000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m != 0 and math.hypot(p.x, p.y) < 1.34, seed=3):
    x, y = p.x / S, p.y / S
    if (-46.0 < x < 46.0 and GY0 - 6.0 < y < GY1 + 4.0) or (abs(x - RX) < 20.0 and LY - 30.0 < y < LY + 10.0):
        continue
    top = p.z > (RH - 2.0) * S + Z0
    if top and rng.random() < 0.93:
        continue
    TREES.append(((p.x, p.y, p.z + rng.uniform(5.0, 8.0) * S), rng.uniform(5.0, 8.0) * S, 0.85))
    if len(TREES) >= 360:
        break
blob_cloud('jungle', M['jungleS'], TREES[::2])
blob_cloud('jungleLight', M['jungleS2'], TREES[1::2])
for k, (x, y, z, shirt) in enumerate(((-2.0, -60.0, 1.2, 'red'), (3.0, -80.0, 1.2, 'blue'), (RX + 2.0, LY - 2.0, LZ, 'yellow'), (RX - 6.0, RY, ground(RX - 6.0, RY), 'green'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.2)

R = Matrix.Rotation(math.radians(-32.0 + 8.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('sigiriya')
