# Humayun's Tomb in the high-quality look (hq.py), laid out in metres: Delhi's Mughal garden tomb on its
# high red sandstone platform, ringed with arched cells and climbed by a stair in the middle of every side;
# the tomb with its chamfered corners, the great arched portals on each face outlined in white marble, the
# smaller arches beside them; the drum and the white marble double dome with its finial; the little
# domed kiosks round it on the roof; the four-part garden round the platform, its water channels and
# paths along the axes, its trees, and people.
# Run: blender -b --factory-startup -P humayuns-tomb.py -- humayuns-tomb-1024.png 1024 humayuns-tomb.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1572)
M['redH'] = material('humayunRed', '#b8573e', 0.85, vary='#a94e37', vary_scale=30, bump=0.1, bump_scale=200)
M['redHDeep'] = material('humayunRedDeep', '#984330', 0.85)
M['marbleH'] = material('humayunMarble', '#f3efe6', 0.45, vary='#ebe6dc', vary_scale=30)
M['recessH'] = material('humayunRecess', '#4c2a20', 0.85)
M['pathH'] = material('charbaghPath', '#cdbfa6', 0.85, vary='#c2b49a', vary_scale=40)
M['channel'] = material('charbaghWater', '#3f7f98', 0.06, coat=0.8)
M['lawnH'] = material('charbaghLawn', '#6aa443', 0.85, vary='#78b14e', vary_scale=12, bump=0.3, bump_scale=200)
M['treeH'] = material('charbaghTree', '#3e7e34', 0.85, vary='#4b8e3e', vary_scale=14, bump=0.3, bump_scale=90)
M['brass'] = material('humayunFinial', '#c9a24a', 0.3, metallic=0.85)

S = 0.0196              # metres to the tile's units
Z0 = G + 0.004
PH = 7.0                # the platform's top


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def chamfered(h, c):
    return [(h - c, -h), (h, -h + c), (h, h - c), (h - c, h), (-h + c, h), (-h, h - c), (-h, -h + c), (-h + c, -h)]


def prism(name, mat, poly, z0, z1):
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x, y, z1)) for x, y in poly], [bm.verts.new(P(x, y, z0)) for x, y in poly])
    return finish(name, bm, mat, smooth_sides=False)


def chhatri(name, x, y, z, r, h):
    for j in range(8):
        a = 2 * math.pi * (j + 0.5) / 8
        bar(f'{name}Post{j}', M['redH'], P(x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z), P(x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z + h), 0.22 * r * S)
    cylinder(f'{name}Floor', M['redHDeep'], r * S, 0.4 * S, P(x, y, z - 0.4), segs=16)
    cylinder(f'{name}Eave', M['redHDeep'], r * 1.15 * S, 0.4 * S, P(x, y, z + h), segs=16)
    lathe(f'{name}Dome', M['marbleH'], [(r * 0.95 * S, 0.0), (r * 1.0 * S, r * 0.35 * S), (r * 0.7 * S, r * 0.9 * S), (r * 0.2 * S, r * 1.25 * S), (0.0, r * 1.35 * S)], P(x, y, z + h + 0.4), segs=20, smooth=True)


BEFORE = set(bpy.data.objects)
WIN = []
# ------------------------------------------------------------------ the garden: paths and water channels along the axes, trees in the quarters
for k in range(2):
    for s in (-1, 1):
        if k == 0:
            poly = [(-5.0, s * 46.0), (5.0, s * 46.0), (5.0, s * 90.0), (-5.0, s * 90.0)]
            chan = [(-1.0, s * 46.0), (1.0, s * 46.0), (1.0, s * 90.0), (-1.0, s * 90.0)]
        else:
            poly = [(s * 46.0, -5.0), (s * 90.0, -5.0), (s * 90.0, 5.0), (s * 46.0, 5.0)]
            chan = [(s * 46.0, -1.0), (s * 90.0, -1.0), (s * 90.0, 1.0), (s * 46.0, 1.0)]
        slab(f'path{k}{s}', M['pathH'], [(x * S, y * S) for x, y in poly], Z0, Z0 + 0.25 * S, margin=0.02)
        slab(f'channel{k}{s}', M['channel'], [(x * S, y * S) for x, y in chan], Z0, Z0 + 0.32 * S, margin=0.02)
TREES = []
for j in range(60):
    x, y = rng.uniform(-80.0, 80.0), rng.uniform(-80.0, 80.0)
    if max(abs(x), abs(y)) < 52.0 or min(abs(x), abs(y)) < 9.0 or math.hypot(x, y) * S > 1.34:
        continue
    TREES.append((P(x, y, 6.0).to_tuple(), rng.uniform(3.0, 4.6) * S, 0.85))
    tube(f'trunk{j}', M['trunk'], [P(x, y, 0.0), P(x, y, 4.0)], 0.4 * S)
blob_cloud('gardenTrees', M['treeH'], TREES)

# ------------------------------------------------------------------ the platform: its arched cells all round, the stairs
PL = 42.0
block('platform', M['redH'], -PL, PL, -PL, PL, -0.3, PH)
block('platformCap', M['redHDeep'], -PL - 0.4, PL + 0.4, -PL - 0.4, PL + 0.4, PH - 0.5, PH + 0.06, bevel=0)
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    for j in range(15):
        u = -PL + 2 * PL * (j + 0.5) / 15
        if abs(u) < 6.0:
            continue
        c = P(nx * (PL + 0.05) + (-ny) * u, ny * (PL + 0.05) + nx * u, 0)
        WIN.append((c.x, c.y, Z0 + 0.6 * S, 3.0 * S, 5.0 * S, (nx, ny), 'pointed'))
    rot = Matrix.Rotation(math.atan2(ny, nx) + math.pi / 2, 4, 'Z')
    for j in range(10):
        m = rot @ Matrix.Translation((0.0, (-PL - 1.0 - 8.0 + j * 0.9) * S, Z0 + (j * 0.7 + 0.35) * S))
        box_m(f'stair{nx}{ny}{j}', M['redHDeep'], m, (9.0 * S, 0.9 * S, 0.7 * S))

# ------------------------------------------------------------------ the tomb: chamfered body, portals in white frames, smaller arches, parapet
TH = 24.0
TOP = PH + 22.0
prism('tomb', M['redH'], chamfered(TH, 7.0), PH, TOP - 0.1)
prism('tombCornice', M['marbleH'], chamfered(TH + 0.4, 7.15), TOP - 1.0, TOP)
prism('tombParapet', M['redHDeep'], chamfered(TH, 7.0), TOP, TOP + 1.6)
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    tx, ty = -ny, nx
    c = P(nx * (TH + 0.05), ny * (TH + 0.05), 0)
    WIN.append((c.x, c.y, Z0 + (PH + 1.0) * S, 9.0 * S, 18.0 * S, (nx, ny), 'pointed'))
    fx, fy = nx * (TH + 0.2), ny * (TH + 0.2)
    for u in (-5.6, 5.6):
        block(f'portalFrame{nx}{ny}{u:+.0f}', M['marbleH'], min(fx + tx * u - 0.4, fx + tx * u + 0.4), max(fx + tx * u - 0.4, fx + tx * u + 0.4),
              min(fy + ty * u - 0.4, fy + ty * u + 0.4), max(fy + ty * u - 0.4, fy + ty * u + 0.4), PH, PH + 20.0, bevel=0)
    block(f'portalTop{nx}{ny}', M['marbleH'], min(fx - tx * 6.0, fx + tx * 6.0) - abs(nx) * 0.4, max(fx - tx * 6.0, fx + tx * 6.0) + abs(nx) * 0.4,
          min(fy - ty * 6.0, fy + ty * 6.0) - abs(ny) * 0.4, max(fy - ty * 6.0, fy + ty * 6.0) + abs(ny) * 0.4, PH + 20.0, PH + 20.8, bevel=0)
    for u in (-12.0, 12.0):
        for z, h in ((PH + 1.0, 7.4), (PH + 11.0, 7.4)):
            c = P(nx * (TH + 0.05) + tx * u, ny * (TH + 0.05) + ty * u, 0)
            WIN.append((c.x, c.y, Z0 + z * S, 4.0 * S, h * S, (nx, ny), 'pointed'))
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    d = TH - 3.5 + 0.07     # the chamfer's middle, a hair out from it
    c = P(math.copysign(d, nx), math.copysign(d, ny), 0)
    for z, h in ((PH + 1.0, 7.4), (PH + 11.0, 7.4)):
        WIN.append((c.x, c.y, Z0 + z * S, 4.4 * S, h * S, (nx, ny), 'pointed'))

# ------------------------------------------------------------------ the drum, the white dome, its finial; the kiosks on the roof
cylinder('drum', M['redH'], 13.4 * S, 8.0 * S, P(0, 0, TOP), segs=64)
cylinder('drumBand', M['marbleH'], 13.6 * S, 0.8 * S, P(0, 0, TOP + 7.2), segs=64)
for k in range(16):
    a = 2 * math.pi * (k + 0.5) / 16
    c = P(13.42 * math.cos(a), 13.42 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + (TOP + 1.6) * S, 2.4 * S, 4.4 * S, (math.cos(a), math.sin(a)), 'pointed'))
prof = [(13.4, 0.0), (14.2, 2.4), (14.4, 5.0), (13.6, 8.6), (11.0, 12.6), (6.6, 15.8), (2.4, 17.2), (0.0, 17.6)]
lathe('dome', M['marbleH'], [(u * S, v * S) for u, v in prof], P(0, 0, TOP + 8.0), segs=72, smooth=True)
lathe('finial', M['brass'], [(0.8 * S, 0.0), (1.0 * S, 0.8 * S), (0.5 * S, 1.6 * S), (0.7 * S, 2.2 * S), (0.15 * S, 4.2 * S), (0.0, 5.0 * S)], P(0, 0, TOP + 25.6), segs=16, smooth=True)
for k in range(8):
    a = k * math.pi / 4
    r = 20.0 if k % 2 == 0 else 18.0
    chhatri(f'kiosk{k}', r * math.cos(a), r * math.sin(a), TOP + 2.0, 2.4 if k % 2 == 0 else 2.0, 3.6)
glazed('arches', WIN, M['marbleH'], glass=M['recessH'], depth=0.5 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-3.0, -60.0, 'red'), (3.0, -66.0, 'blue'), (-14.0, -30.0, 'yellow'), (10.0, -30.0, 'green'), (0.0, -50.0, 'red'))):
    c = P(x, y, PH if abs(y) < PL else 0.25)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('humayuns-tomb')
