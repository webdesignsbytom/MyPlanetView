# The Pena Palace in the high-quality look (hq.py), laid out in metres on its peak above Sintra: the
# red former monastery and its clock tower with the little onion cupola, the grey stone of the old
# chapel, the yellow palace with its battlements and the great round tower under its tiled dome, the
# ramparts round the summit with their bartizans and the Moorish gate with its tiles; the granite
# boulders of the peak and the dark forest of the park all round it, and people on the terraces.
# Run: blender -b --factory-startup -P pena-palace.py -- pena-palace-1024.png 1024 pena-palace.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1854)
M['penaRed'] = material('penaRed', '#b8473a', 0.8, vary='#a83f33', vary_scale=24, bump=0.08, bump_scale=200)
M['penaYellow'] = material('penaYellow', '#e5b74c', 0.8, vary='#d9aa42', vary_scale=24, bump=0.08, bump_scale=200)
M['penaGrey'] = masonry('penaGrey', '#a39e94', '#77726a', scale=140, rough=0.85, vary='#959087')
M['penaMauve'] = material('penaMauve', '#9b7fa6', 0.7, vary='#8f7399', vary_scale=24)
M['penaTiles'] = chequer('penaTiles', '#e8c35c', '#2f62a8', scale=260.0)
M['domeTiles'] = mosaic('domeTiles', ((4, '#d9b44a'), (2.4, '#2f62a8'), (0.6, '#f2efe6'), (0.6, '#7da34f')), scale=180.0, mortar='#e9dcb8')
M['granitePeak'] = material('sintraGranite', '#8f8b82', 0.9, vary='#7e7a72', vary_scale=10, bump=0.6, bump_scale=60)
M['forest'] = material('sintraForest', '#2f5530', 0.85, vary='#3b6538', vary_scale=14, bump=0.3, bump_scale=90)
M['forestFloor'] = material('forestFloor', '#4f6b36', 0.9, vary='#5a7840', vary_scale=12, bump=0.3, bump_scale=120)

S = 0.026               # metres to the tile's units
TOPZ = 26.0             # the summit's terrace, above the base (metres)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    r = math.hypot(x, y + 2.0)
    peak = TOPZ * (1.0 - smooth((r - 34.0) / 21.0))     # down to the ground just inside the base's edge
    lumps = 1.6 * math.sin(x / 7.0) * math.cos(y / 9.0) * smooth((r - 36.0) / 8.0)
    return max(0.0, peak + lumps)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return ground(x / S, y / S) * S * rim


land = terrain('peak', H, [M['forestFloor'], M['granitePeak']], lambda z, nz, x, y: 1 if nz < 0.35 else 0, rings=180, segs=440)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, G + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0005):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


MERLONS = {}
WIN = []


def battlements(mat, x0, x1, y0, y1, z, step=1.6, size=0.8, h=1.1):
    """Merlons along a rectangle's top edges."""
    bm_ = MERLONS.setdefault(mat.name, (mat, bmesh.new()))[1]
    for (ax, ay), (bx, by) in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
        L = math.hypot(bx - ax, by - ay)
        for k in range(int(L / step) + 1):
            t = k / max(1, int(L / step))
            c = P(ax + (bx - ax) * t, ay + (by - ay) * t, z + h / 2)
            bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((size * S, size * S, h * S, 1)))


def round_battlements(mat, cx, cy, r, z, n=None, size=0.8, h=1.1):
    bm_ = MERLONS.setdefault(mat.name, (mat, bmesh.new()))[1]
    n = n or int(2 * math.pi * r / 1.6)
    for k in range(n):
        a = 2 * math.pi * k / n
        c = P(cx + r * math.cos(a), cy + r * math.sin(a), z + h / 2)
        bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Diagonal((size * S, size * S, h * S, 1)))


def front_windows(x0, x1, y, zs, step=4.0, w=1.4, h=2.4, shape='round'):
    n = max(1, int((x1 - x0) / step))
    for k in range(n):
        c = P(x0 + (x1 - x0) * (k + 0.5) / n, y - 0.05, 0)
        for z in zs:
            WIN.append((c.x, c.y, G + z * S, w * S, h * S, (0, -1), shape))


def bartizan(name, x, y, z, r=1.3, h=3.2, mat=None):
    """A little round turret corbelled out at a corner, under a dome."""
    mat = mat or M['penaYellow']
    lathe(name + 'Corbel', M['penaGrey'], [(0.2 * S, 0.0), (r * S, 1.8 * S)], P(x, y, z - 1.8), segs=16)
    cylinder(name, mat, r * S, h * S, P(x, y, z), segs=16)
    round_battlements(M['penaGrey'], x, y, r - 0.2, z + h, n=8, size=0.6, h=0.8)
    lathe(name + 'Dome', M['domeTiles'], [(r * 0.85 * S, 0.0), (r * 0.8 * S, r * 0.5 * S), (r * 0.45 * S, r * 1.0 * S), (0.0, r * 1.3 * S)], P(x, y, z + h), segs=16, smooth=True)


# ------------------------------------------------------------------ the ramparts round the summit, their bartizans, and the Moorish gate
RAMP = [(-36.0, -22.0), (38.0, -22.0), (40.0, 16.0), (-34.0, 18.0)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, y, 14.0)) for x, y in RAMP], [bm.verts.new(P(x, y, TOPZ)) for x, y in RAMP])
finish('summitTerrace', bm, M['penaGrey'], smooth_sides=False)
block('terraceFloor', M['paving'], -35.5, 37.5, -21.5, 17.0, TOPZ, TOPZ + 0.1, bevel=0)
for (ax, ay), (bx, by) in zip(RAMP, RAMP[1:] + RAMP[:1]):
    L = math.hypot(bx - ax, by - ay)
    ang = math.atan2(by - ay, bx - ax)
    box(f'parapet{ax:.0f}{ay:.0f}', M['penaGrey'], P((ax + bx) / 2, (ay + by) / 2, TOPZ + 0.6), (L * S, 0.7 * S, 1.2 * S), rot_z=ang, bevel=0)
    bm_ = MERLONS.setdefault('penaGrey', (M['penaGrey'], bmesh.new()))[1]
    for k in range(int(L / 1.6) + 1):
        t = k / int(L / 1.6)
        c = P(ax + (bx - ax) * t, ay + (by - ay) * t, TOPZ + 1.6)
        bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((0.8 * S, 0.8 * S, 0.9 * S, 1)))
for k, (x, y) in enumerate(RAMP):
    bartizan(f'rampTurret{k}', x, y, TOPZ - 0.5, r=1.6, h=3.4, mat=M['penaGrey'])
# the Moorish gate on the terrace's front, tiled, with its crenellations
block('gate', M['penaGrey'], -26.0, -16.0, -24.0, -20.0, TOPZ - 4.0, TOPZ + 7.0)
block('gateTiles', M['penaTiles'], -25.6, -16.4, -24.15, -23.9, TOPZ + 4.6, TOPZ + 6.2, bevel=0)
arcade_path('gateArch', M['penaGrey'], [(-23.8 * S, -24.3 * S), (-18.2 * S, -24.3 * S)], 0.4 * S, G + (TOPZ + 0.1) * S, 4.3 * S, 2.6 * S, pointed=0.6)
c = P(-21.0, -24.1, 0)
glazed('gateDoor', [(c.x, c.y, G + (TOPZ - 0.2) * S, 4.4 * S, 4.6 * S, (0, -1), 'pointed')], M['penaGrey'], glass=M['door'], depth=0.3 * S)
battlements(M['penaGrey'], -26.0, -16.0, -24.0, -20.0, TOPZ + 7.0)
for x in (-26.0, -16.0):
    bartizan(f'gateTurret{x:.0f}', x, -24.0, TOPZ + 4.0, r=1.1, h=3.4, mat=M['penaMauve'])

# ------------------------------------------------------------------ the red former monastery and its clock tower
block('monastery', M['penaRed'], -32.0, -10.0, -2.0, 14.0, TOPZ, TOPZ + 12.0)
battlements(M['penaRed'], -32.0, -10.0, -2.0, 14.0, TOPZ + 12.0)
front_windows(-31.0, -15.0, -2.0, (TOPZ + 2.0, TOPZ + 7.0))
block('monasteryCornice', M['white'], -32.2, -9.8, -2.2, 14.2, TOPZ + 11.2, TOPZ + 11.6, bevel=0)
block('clockTower', M['penaRed'], -15.5, -8.5, -9.0, -2.0, TOPZ, TOPZ + 27.0)
block('clockTowerBand', M['white'], -15.8, -8.2, -9.3, -1.7, TOPZ + 18.0, TOPZ + 18.5, bevel=0)
battlements(M['penaRed'], -15.5, -8.5, -9.0, -2.0, TOPZ + 27.0, step=1.4, size=0.7)
lathe('clockFace', M['white'], [(0.0, 0.0), (1.4 * S, 0.0), (1.4 * S, 0.2 * S), (0.0, 0.2 * S)], (0, 0, 0), segs=24,
      matrix=Matrix.Translation(P(-12.0, -9.05, TOPZ + 22.5)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for z in (TOPZ + 4.0, TOPZ + 10.0, TOPZ + 14.5):
    c = P(-12.0, -9.05, 0)
    WIN.append((c.x, c.y, G + z * S, 1.4 * S, 2.6 * S, (0, -1), 'round'))
cylinder('cupolaDrum', M['penaYellow'], 2.2 * S, 2.4 * S, P(-12.0, -5.5, TOPZ + 27.0), segs=16)
lathe('cupola', M['domeTiles'], [(2.4 * S, 0.0), (2.9 * S, 1.2 * S), (2.6 * S, 2.4 * S), (1.4 * S, 3.6 * S), (0.4 * S, 4.4 * S), (0.0, 5.2 * S)], P(-12.0, -5.5, TOPZ + 29.4), segs=24, smooth=True)
lathe('cupolaFinial', M['gold'], [(0.0, 0.0), (0.25 * S, 0.3 * S), (0.0, 1.6 * S)], P(-12.0, -5.5, TOPZ + 34.5), segs=8, smooth=True)

# ------------------------------------------------------------------ the grey chapel of the old monastery
block('chapel', M['penaGrey'], -10.0, 6.0, 0.0, 16.0, TOPZ, TOPZ + 14.0)
gable_roof('chapelRoof', M['penaGrey'], -10.0 * S, 6.0 * S, 0.0, 16.0 * S, G + (TOPZ + 13.95) * S, 4.0 * S, over=0.004, along='y')
c = P(-2.0, -0.05, 0)
WIN.append((c.x, c.y, G + (TOPZ + 5.0) * S, 3.2 * S, 6.4 * S, (0, -1), 'pointed'))
for x in (-10.0, 6.0):
    block(f'chapelPinnacle{x:.0f}', M['penaGrey'], x - 0.6, x + 0.6, -0.6, 0.6, TOPZ, TOPZ + 19.0)
    lathe(f'chapelPinnacleTop{x:.0f}', M['penaGrey'], [(0.8 * S, 0.0), (0.0, 2.4 * S)], P(x, 0.0, TOPZ + 19.0), segs=8)

# ------------------------------------------------------------------ the yellow palace and its great round tower under the tiled dome
block('palace', M['penaYellow'], 6.0, 34.0, -4.0, 12.0, TOPZ, TOPZ + 15.0)
block('palaceTileBand', M['penaTiles'], 5.8, 34.2, -4.2, 12.2, TOPZ + 12.6, TOPZ + 13.8, bevel=0)
battlements(M['penaYellow'], 6.0, 34.0, -4.0, 12.0, TOPZ + 15.0)
front_windows(8.0, 17.0, -4.0, (TOPZ + 2.5, TOPZ + 8.0), step=3.6)
for x, y in ((6.0, -4.0), (34.0, 12.0), (34.0, -4.0)):
    bartizan(f'palaceTurret{x:.0f}{y:.0f}', x, y, TOPZ + 13.0, r=1.4, h=3.6, mat=M['penaYellow'])
TX, TY = 26.0, -10.0
cylinder('roundTower', M['penaYellow'], 7.0 * S, 24.0 * S, P(TX, TY, TOPZ - 2.0), segs=40)
cylinder('roundTowerTiles', M['penaTiles'], 7.12 * S, 1.2 * S, P(TX, TY, TOPZ + 18.4), segs=40)
lathe('roundTowerCornice', M['white'], [(7.0 * S, 0.0), (7.6 * S, 0.6 * S), (7.6 * S, 1.0 * S), (6.8 * S, 1.0 * S)], P(TX, TY, TOPZ + 21.0), segs=40)
round_battlements(M['penaYellow'], TX, TY, 7.2, TOPZ + 22.0)
cylinder('domeDrum', M['penaYellow'], 5.0 * S, 3.0 * S, P(TX, TY, TOPZ + 22.0), segs=32)
lathe('roundTowerDome', M['domeTiles'], [(5.2 * S, 0.0), (5.4 * S, 1.6 * S), (4.6 * S, 3.6 * S), (3.0 * S, 5.2 * S), (1.2 * S, 6.2 * S), (0.0, 6.6 * S)], P(TX, TY, TOPZ + 25.0), segs=32, smooth=True)
cylinder('lantern', M['penaYellow'], 0.9 * S, 2.0 * S, P(TX, TY, TOPZ + 31.4), segs=12)
lathe('lanternCap', M['domeTiles'], [(1.1 * S, 0.0), (0.0, 1.8 * S)], P(TX, TY, TOPZ + 33.3), segs=12)
for k in range(8):
    a = -math.pi / 2 + (k - 3.5) * 0.36
    c = P(TX + 7.05 * math.cos(a), TY + 7.05 * math.sin(a), 0)
    for z in (TOPZ + 3.0, TOPZ + 10.0):
        WIN.append((c.x, c.y, G + z * S, 1.2 * S, 2.6 * S, (math.cos(a), math.sin(a)), 'round'))
for name, (mat, bm_) in MERLONS.items():
    finish(f'merlons{name}', bm_, mat, smooth_sides=False)
glazed('windows', WIN, M['white'], depth=0.3 * S)

# ------------------------------------------------------------------ the granite boulders, the forest of the park, people on the terraces
BOULDERS = []
for k in range(22):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(38.0, 52.0)
    x, y = r * math.cos(a), r * math.sin(a) - 2.0
    if math.hypot(x, y) * S > 1.3:
        continue
    BOULDERS.append((P(x, y, ground(x, y) + 1.0).to_tuple(), rng.uniform(2.0, 4.0) * S, 0.7))
blob_cloud('boulders', M['granitePeak'], BOULDERS)
TREES = []
for p in scatter_on(land, 9000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.36, seed=13):
    mx, my = p.x / S, p.y / S
    if -42.0 < mx < 46.0 and -34.0 < my < 24.0:      # the forest right up to the summit's walls, clear of the gate
        continue
    r = rng.uniform(2.8, 4.2)
    TREES.append(((p.x, p.y, p.z + r * 0.8 * S), r * S, 1.25))
    if len(TREES) >= 560:
        break
blob_cloud('forest', M['forest'], TREES)
for k, (x, y, shirt) in enumerate(((-4.0, -14.0, 'red'), (4.0, -18.0, 'blue'), (14.0, -18.0, 'yellow'), (-28.0, -12.0, 'green'), (32.0, 4.0, 'red'))):
    c = P(x, y, TOPZ + 0.1)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.7)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('pena-palace')
