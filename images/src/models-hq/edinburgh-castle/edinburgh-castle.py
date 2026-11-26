# Edinburgh Castle in the high-quality look (hq.py): the castle on its Castle Rock, the crag of dark
# volcanic basalt with sheer cliffs to the north, west and south and its tail sloping down east to the
# Esplanade; along the summit the great curve of the Half Moon Battery, the Royal Palace and its tower
# round Crown Square with the Great Hall and the Scottish National War Memorial, the New Barracks above
# the south cliff, little St Margaret's Chapel at the top, the gatehouse, the batteries' walls and
# cannon; the Esplanade, Princes Street Gardens' lawns and trees below the north cliff, and people.
# Run: blender -b --factory-startup -P edinburgh-castle.py -- edinburgh-castle-1024.png 1024 edinburgh-castle.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1093)
M['basalt'] = layered('castleRock', ['#5d5853', '#6a645d', '#524d49', '#64605a'], scale=22.0, distortion=2.5, rough=0.9, bump=0.6, bump_scale=60)
M['crag'] = material('cragGrass', '#6f9a48', 0.9, vary='#628c3e', vary_scale=10, bump=0.25, bump_scale=200)
M['sandstoneE'] = material('edinSandstone', '#b7aa93', 0.75, vary='#a89a82', vary_scale=22, bump=0.2, bump_scale=140)
M['sandstoneDark'] = material('edinSandstoneDark', '#9c8f79', 0.8, vary='#8d806b', vary_scale=22, bump=0.2, bump_scale=140)
M['slateE'] = material('edinSlate', '#4f5862', 0.55, vary='#454e58', vary_scale=14, bump=0.12, bump_scale=200)
M['cannon'] = material('cannonBlack', '#26272a', 0.4, metallic=0.6)
M['summitGround'] = material('summitGround', '#8f877b', 0.85, vary='#827a6e', vary_scale=40, bump=0.3, bump_scale=300)
OPEN, DOORS = [], []

TOP = 0.5               # the summit's height above the gardens


def H(x, y):
    """Castle Rock: a summit rising east to the upper ward, rugged cliffs on three sides with ledges,
    the tail sloping away east."""
    ang = math.atan2(y - 0.02, x + 0.15)
    wob = 1.0 + 0.07 * math.sin(3 * ang + 1.0) + 0.05 * math.sin(7 * ang + 2.3) + 0.03 * math.sin(13 * ang)
    u, v = (x + 0.15) / (0.8 * wob), (y - 0.02) / (0.48 * wob)
    d = math.hypot(u, v)
    summit = TOP + 0.05 * max(0.0, min(1.0, (x + 0.1) / 0.5))          # the upper ward higher, to the east
    if d <= 0.86:
        rock = summit
    else:
        t = (d - 0.86) / 0.26
        ledge = 0.07 * math.sin(9 * ang) * math.sin(math.pi * min(1.0, t))
        rock = summit * max(0.0, 1.0 - t ** 0.8) + ledge
    rock = max(0.0, rock)
    if x > 0.45:
        t = min(1.0, (x - 0.45) / 1.0)
        width = 0.22 - 0.06 * t
        tail = (TOP - 0.06 - 0.32 * t) * max(0.0, 1.0 - (abs(y - 0.02) / width) ** 4)
        rock = max(rock, tail)
    n = 0.02 * math.sin(23 * x + 3) * math.cos(19 * y) + 0.014 * math.sin(41 * x - 17 * y) + 0.008 * math.sin(77 * x + 61 * y)
    return max(0.0, rock + (n if 0.02 < rock < summit - 0.02 else 0.0))


def pick(z, nz, x, y):
    if z < 0.012:
        return 2                        # the gardens
    if nz < 0.5:
        return 0                        # the cliffs
    if z < TOP - 0.03:
        return 1                        # the grassy ledges and slopes
    return 3                            # the summit's ground


terrain('castleRock', H, [M['basalt'], M['crag'], M['lawn'], M['summitGround']], pick, rings=200, segs=480)
ZT = G + TOP

# ------------------------------------------------------------------ the gardens below, their trees
for k, (x, y) in enumerate(((-0.9, -0.75), (-0.55, -0.95), (-0.15, -1.05), (0.3, -0.95), (0.75, -0.8), (1.05, -0.5), (-1.15, -0.35), (-1.2, 0.45), (-0.8, 0.95), (0.2, 1.15), (0.85, 0.9))):
    tree(f'garden{k}', x, y, h=0.13, r=0.055, z=G)
slab('gardenPath', M['paving'], rect(0.0, -0.7, 2.6, 0.06, rot=0.08), G - 0.004, G + 0.004, margin=0.05)

# ------------------------------------------------------------------ the castle's walls along the summit's edge, with battlements
def edge_wall(name, a0, a1, h, n=18):
    pts = []
    for k in range(n + 1):
        a = a0 + (a1 - a0) * k / n
        pts.append((-0.15 + 0.78 * 0.86 * math.cos(a), 0.02 + 0.46 * 0.86 * math.sin(a)))
    for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:])):
        L = math.hypot(x1 - x0, y1 - y0)
        ang = math.atan2(y1 - y0, x1 - x0)
        box(f'{name}{k}', M['sandstoneDark'], ((x0 + x1) / 2, (y0 + y1) / 2, ZT - 0.04 + h / 2), (L + 0.008, 0.016, h + 0.04), rot_z=ang, bevel=0.001)
        for j in range(3):
            t = (j + 0.5) / 3
            box(f'{name}Merlon{k}{j}', M['sandstoneDark'], (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, ZT + h + 0.006), (0.012, 0.018, 0.012), rot_z=ang, bevel=0)


edge_wall('northWall', math.radians(60), math.radians(160), 0.05)
edge_wall('southWall', math.radians(200), math.radians(300), 0.05)
for k, a in enumerate((math.radians(80), math.radians(100), math.radians(120))):        # the Argyle Battery's cannon
    x, y = -0.15 + 0.78 * 0.84 * math.cos(a), 0.02 + 0.46 * 0.84 * math.sin(a)
    cylinder(f'cannon{k}', M['cannon'], 0.007, 0.05, (0, 0, 0), segs=10, matrix=Matrix.Translation((x, y, ZT + 0.03)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'Y'))

# ------------------------------------------------------------------ the Half Moon Battery and the gatehouse at the east end
bm = bmesh.new()
outer = [(0.42 + 0.17 * math.cos(t), 0.02 + 0.22 * math.sin(t)) for t in (math.radians(-80 + 160 * k / 24) for k in range(25))]
inner = [(0.42 + 0.13 * math.cos(t), 0.02 + 0.18 * math.sin(t)) for t in (math.radians(80 - 160 * k / 24) for k in range(25))]
ring = outer + inner
add_prism(bm, [bm.verts.new((x, y, ZT - 0.25)) for x, y in ring], [bm.verts.new((x, y, ZT + 0.12)) for x, y in ring])
finish('halfMoonBattery', bm, M['sandstoneE'], bevel=0.002, smooth_sides=False)
for k in range(12):
    t = math.radians(-70 + 140 * k / 11)
    box(f'halfMoonMerlon{k}', M['sandstoneE'], (0.42 + 0.165 * math.cos(t), 0.02 + 0.215 * math.sin(t), ZT + 0.128), (0.014, 0.016, 0.016), rot_z=t, bevel=0)
box('gatehouse', M['sandstoneE'], (0.66, 0.08, ZT - 0.02), (0.08, 0.14, 0.14), bevel=0.002)
for sx in (-1, 1):
    lathe(f'gateTurret{sx}', M['sandstoneE'], [(0.016, 0), (0.016, 0.17), (0.0, 0.2)], (0.68, 0.08 + sx * 0.06, ZT - 0.09), segs=10)
DOORS.append((0.701, 0.08, ZT - 0.09, 0.035, 0.06, (1, 0), 'round'))

# ------------------------------------------------------------------ Crown Square: the Royal Palace and its tower, the Great Hall, the War Memorial
def block(name, cx, cy, w, d, h, rot=0.0, mat=None, roof=True, rows=(0.02, 0.06, 0.1)):
    mat = M['sandstoneE'] if mat is None else mat
    box(name, mat, (cx, cy, ZT + h / 2), (w, d, h), rot_z=rot, bevel=0.002)
    if roof:
        c, s_ = math.cos(rot), math.sin(rot)
        bm = bmesh.new()
        quad = [(-w / 2 - 0.004, -d / 2 - 0.004, 0), (w / 2 + 0.004, -d / 2 - 0.004, 0), (w / 2 + 0.004, d / 2 + 0.004, 0), (-w / 2 - 0.004, d / 2 + 0.004, 0)]
        ridge = [(-w / 2, -0.002, d * 0.45), (w / 2, -0.002, d * 0.45), (w / 2, 0.002, d * 0.45), (-w / 2, 0.002, d * 0.45)]
        rot_p = lambda p: Vector((cx + c * p[0] - s_ * p[1], cy + s_ * p[0] + c * p[1], ZT + h + p[2]))
        add_prism(bm, [bm.verts.new(rot_p(p)) for p in quad], [bm.verts.new(rot_p(p)) for p in ridge])
        finish(name + 'Roof', bm, M['slateE'], smooth_sides=False)
    for side in (-1, 1):
        nx, ny = -math.sin(rot) * side, math.cos(rot) * side
        n = max(2, int(w / 0.035))
        for k in range(n):
            u = -w / 2 + w * (k + 0.5) / n
            for z0 in rows:
                if z0 + 0.03 < h:
                    OPEN.append((cx + math.cos(rot) * u + nx * (d / 2 + 0.001), cy + math.sin(rot) * u + ny * (d / 2 + 0.001), ZT + z0, 0.012, 0.022, (nx, ny), 'rect'))


block('royalPalace', 0.22, 0.06, 0.2, 0.1, 0.17, rot=math.pi / 2)
box('palaceTower', M['sandstoneE'], (0.22, -0.06, ZT + 0.13), (0.06, 0.06, 0.26), bevel=0.002)
lathe('palaceTowerCap', M['slateE'], [(0.036, 0), (0.028, 0.024), (0.009, 0.06), (0.0, 0.072)], (0.22, -0.06, ZT + 0.26), segs=8)
lathe('palaceTowerFlag', M['white'], [(0.002, 0), (0.002, 0.06)], (0.22, -0.06, ZT + 0.33), segs=6)
box('flagSaltireBlue', M['blue'], (0.237, -0.06, ZT + 0.375), (0.032, 0.002, 0.02), bevel=0)
block('greatHall', 0.04, -0.07, 0.22, 0.08, 0.14)
block('warMemorial', 0.04, 0.19, 0.22, 0.09, 0.15, mat=M['sandstoneDark'])
block('queenAnne', -0.12, 0.02, 0.1, 0.08, 0.12, rot=math.pi / 2)
block('hospital', -0.36, 0.14, 0.2, 0.08, 0.13, rot=math.radians(10))
block('ordnance', -0.58, 0.04, 0.12, 0.09, 0.12, rot=math.pi / 2)
block('newBarracks', -0.4, -0.2, 0.46, 0.1, 0.21, rot=math.radians(-8), rows=(0.02, 0.06, 0.1, 0.14, 0.18))
block('governorsHouse', -0.16, -0.16, 0.12, 0.07, 0.12, rot=math.radians(-5))
# St Margaret's Chapel at the summit, and Mons Meg beside it
block('stMargaret', -0.17, 0.22, 0.05, 0.035, 0.05, rows=())
cylinder('monsMeg', M['cannon'], 0.012, 0.06, (0, 0, 0), segs=12, matrix=Matrix.Translation((-0.05, 0.24, ZT + 0.015)) @ Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Rotation(0.3, 4, 'X'))

# ------------------------------------------------------------------ the Esplanade on the tail, and people
for k, (x, y, shirt) in enumerate(((0.8, 0.02, 'red'), (0.9, 0.1, 'blue'), (1.0, -0.03, 'yellow'), (0.05, 0.06, 'green'), (-0.3, 0.05, 'red'), (0.15, -0.3, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + H(x, y))

glazed('windows', OPEN, M['sandstoneDark'], depth=0.004, bars=False)
glazed('doors', DOORS, M['sandstoneDark'], glass=M['door'], depth=0.004)
render('edinburgh-castle')
