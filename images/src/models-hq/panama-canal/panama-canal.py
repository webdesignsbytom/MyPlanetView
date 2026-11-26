# The Panama Canal's Miraflores Locks in the high-quality look (hq.py), laid out in metres: the two
# concrete lock chambers side by side and the wide wall between them, the water a step higher behind
# the mitre gates in the middle; a container ship stacked with coloured boxes filling one chamber as it
# waits to go down, held on cables by the electric "mules" on their rails along the walls; a tug in the
# other chamber's lower step; the white control house with its red roof on the centre wall; the green
# hills round the locks, and people at the rail.
# Run: blender -b --factory-startup -P panama-canal.py -- panama-canal-1024.png 1024 panama-canal.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1914)
M['concrete'] = material('lockConcrete', '#aaa69d', 0.85, vary='#9e9a91', vary_scale=40, bump=0.15, bump_scale=200)
M['concreteDark'] = material('lockConcreteDark', '#7f7b74', 0.85, vary='#75716a', vary_scale=40)
M['canalWater'] = material('canalWater', '#3f6f6a', 0.1, vary='#4a7b75', vary_scale=8, bump=0.05, bump_scale=30)
M['hillsP'] = material('panamaHills', '#4f8a3a', 0.85, vary='#5c9745', vary_scale=12, bump=0.3, bump_scale=120)
M['jungle'] = material('panamaJungle', '#2f6a32', 0.85, vary='#3b7a3c', vary_scale=14, bump=0.3, bump_scale=90)
M['hull'] = material('shipHull', '#26344a', 0.5)
M['hullRed'] = material('shipBottom', '#9a2f2a', 0.6)
M['superstructure'] = material('shipBridge', '#f0efe9', 0.5)
M['mule'] = material('mule', '#b9bfc4', 0.35, metallic=0.6)
M['gate'] = material('mitreGate', '#5d6a6f', 0.6, metallic=0.4)
M['roofRed'] = material('controlRoof', '#b04a32', 0.7)
BOXES = [material(f'container{k}', c, 0.6) for k, c in enumerate(('#c0392b', '#2e6fb3', '#2f8a4a', '#e6862e', '#8a8f94', '#e9e4da', '#7a4a8c'))]

S = 0.011               # metres to the tile's units
Z0 = G + 0.004
TOPW = 26.0             # the walls' top
UP, LOW = 16.0, 7.5     # the upper and lower steps' water


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The land round the locks (metres): level with the walls' top beside them, hills rising behind."""
    d = abs(y)
    if d < 64.0 and abs(x) < 112.0:
        return -2.5                     # under the locks
    hills = 30.0 * smooth((y - 80.0) / 60.0) + 12.0 * smooth((-y - 90.0) / 50.0)
    return TOPW - 1.0 + hills * smooth((d - 62.0) / 10.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return ground(x / S, y / S) * S * rim


land = terrain('banks', H, [M['hillsP']], lambda z, nz, x, y: 0, rings=160, segs=400)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


# ------------------------------------------------------------------ the lock walls and floors, the water on its two steps, the mitre gates
X0, X1 = -110.0, 110.0
GX = 30.0               # the mitre gates between the steps
CH = ((10.0, 43.5), (-43.5, -10.0))        # the two chambers (y)
block('centreWall', M['concrete'], X0, X1, -10.0, 10.0, -2.0, TOPW)
for side in (-1, 1):
    block(f'sideWall{side}', M['concrete'], X0, X1, *sorted((side * 43.5, side * 64.0)), -2.0, TOPW)
    block(f'wallCoping{side}', M['concreteDark'], X0, X1, *sorted((side * 43.5, side * 44.5)), TOPW - 0.4, TOPW + 0.2, bevel=0)
for j, (y0, y1) in enumerate(CH):
    block(f'floor{j}', M['concreteDark'], X0, X1, y0, y1, -2.0, -0.5, bevel=0)
    block(f'waterUpper{j}', M['canalWater'], X0, GX - 1.2, y0, y1, -0.5, UP, bevel=0)
    block(f'waterLower{j}', M['canalWater'], GX + 1.2, X1, y0, y1, -0.5, LOW, bevel=0)
    # the mitre gates: two leaves meeting in a V pointing upstream, their walkway on top
    w = (y1 - y0) / 2
    for leaf in (-1, 1):
        yc = (y0 + y1) / 2 + leaf * w / 2
        box(f'gate{j}{leaf}', M['gate'], P(GX - 3.0, yc, (TOPW - 2.0) / 2), (2.0 * S, (w / math.cos(math.radians(18.0)) + 0.6) * S, (TOPW - 2.0) * S), rot_z=-leaf * math.radians(18.0), bevel=0)
    block(f'gateWalk{j}', M['iron'], GX - 6.0, GX, y0, y1, TOPW - 1.0, TOPW - 0.6, bevel=0)
block('stepSill', M['concreteDark'], GX - 1.4, GX + 1.4, -43.5, 43.5, -2.0, LOW - 1.0, bevel=0)

# ------------------------------------------------------------------ the container ship in the upper step, its boxes, bridge and the mules' cables
SY = sum(CH[0]) / 2
L, B = 126.0, 30.0
SX0 = -108.0
hull = [(SX0, -B / 2), (SX0 + L - 22.0, -B / 2), (SX0 + L, 0.0), (SX0 + L - 22.0, B / 2), (SX0, B / 2)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, SY + y, UP - 4.0)) for x, y in hull], [bm.verts.new(P(x, SY + y, UP + 8.0)) for x, y in hull])
finish('shipHull', bm, M['hull'], smooth_sides=False)
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, SY + y * 1.01, UP - 1.0)) for x, y in hull], [bm.verts.new(P(x, SY + y * 1.01, UP + 0.6)) for x, y in hull])
finish('shipBoot', bm, M['hullRed'], smooth_sides=False)
CONT = bmesh.new()
for bay in range(13):
    x = SX0 + 34.0 + bay * 12.6
    if x > SX0 + L - 28.0:
        break
    for row in range(10):
        y = SY - B / 2 + 1.8 + row * 2.66
        for tier in range(rng.randint(3, 6)):
            z = UP + 8.0 + tier * 2.6
            f0 = len(CONT.faces)
            bmesh.ops.create_cube(CONT, size=1.0, matrix=Matrix.Translation(P(x, y, z + 1.3)) @ Matrix.Diagonal((12.0 * S, 2.44 * S, 2.55 * S, 1)))
            col = rng.randrange(len(BOXES))
            for f in list(CONT.faces)[f0:]:
                f.material_index = col
multi('containers', CONT, BOXES, smooth=False)
block('bridgeBase', M['superstructure'], SX0 + 6.0, SX0 + 22.0, SY - 12.0, SY + 12.0, UP + 8.0, UP + 30.0)
block('bridgeWings', M['superstructure'], SX0 + 14.0, SX0 + 20.0, SY - B / 2 - 0.5, SY + B / 2 + 0.5, UP + 27.0, UP + 30.0)
WIN = []
for k in range(5):
    c = P(SX0 + 22.05, SY - 9.0 + 4.5 * k, 0)
    for z in (UP + 13.0, UP + 18.0, UP + 23.0, UP + 27.4):
        WIN.append((c.x, c.y, Z0 + z * S, 2.4 * S, 1.6 * S, (1, 0), 'rect'))
block('funnel', M['red'], SX0 + 4.0, SX0 + 10.0, SY - 3.0, SY + 3.0, UP + 30.0, UP + 36.0, bevel=0)
CABLES = []
for k, (x, side) in enumerate(((SX0 + 20.0, 1), (SX0 + 20.0, -1), (SX0 + L - 30.0, 1), (SX0 + L - 30.0, -1))):
    my = 49.0 if side > 0 else 5.0
    mx = x + (18.0 if k >= 2 else -14.0)
    block(f'mule{k}', M['mule'], mx - 4.0, mx + 4.0, my - 1.6, my + 1.6, TOPW, TOPW + 3.6)
    block(f'muleCab{k}', M['window'], mx - 3.0, mx + 3.0, my - 1.62, my + 1.62, TOPW + 2.0, TOPW + 3.0, bevel=0)
    CABLES.append([P(mx, my, TOPW + 1.5), P(x, SY + side * B / 2, UP + 8.0)])
for y in (5.0, 49.0, -5.0, -49.0):
    block(f'rail{y:+.0f}', M['iron'], X0, X1, y - 1.2, y + 1.2, TOPW, TOPW + 0.25, bevel=0)
for k, pts in enumerate(CABLES):
    tube(f'cable{k}', M['iron'], pts, 0.15 * S)
glazed('bridgeWindows', WIN, M['superstructure'], depth=0.3 * S)

# ------------------------------------------------------------------ the tug in the other chamber, the control house, the jungle, people
TY = sum(CH[1]) / 2
tug = [(60.0, -4.5), (78.0, -4.5), (83.0, 0.0), (78.0, 4.5), (60.0, 4.5)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, TY + y, LOW - 1.5)) for x, y in tug], [bm.verts.new(P(x, TY + y, LOW + 2.2)) for x, y in tug])
finish('tugHull', bm, M['red'], smooth_sides=False)
block('tugCabin', M['superstructure'], 64.0, 72.0, TY - 3.0, TY + 3.0, LOW + 2.2, LOW + 7.0)
block('tugFunnel', M['hull'], 65.0, 67.0, TY - 1.0, TY + 1.0, LOW + 7.0, LOW + 9.5, bevel=0)
block('controlHouse', M['superstructure'], GX + 4.0, GX + 22.0, -7.0, 7.0, TOPW, TOPW + 9.0)
hip_roof('controlRoof', M['roofRed'], (GX + 13.0) * S, 0.0, Z0 + (TOPW + 8.95) * S, 19.4 * S, 15.4 * S, 4.0 * S, over=0.0)
CTRL = []
for k in range(4):
    c = P(GX + 5.5 + 4.2 * k, -7.05, 0)
    for z in (TOPW + 1.5, TOPW + 5.5):
        CTRL.append((c.x, c.y, Z0 + z * S, 1.6 * S, 2.4 * S, (0, -1), 'rect'))
glazed('controlWindows', CTRL, M['superstructure'], depth=0.3 * S)
TREES = []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.33, seed=3):
    if abs(p.y / S) < 72.0:
        continue
    TREES.append(((p.x, p.y, p.z + 4.0 * S), rng.uniform(4.0, 6.0) * S, 1.0))
    if len(TREES) >= 220:
        break
blob_cloud('jungle', M['jungle'], TREES)
for k, (x, y) in enumerate(((50.0, -56.0), (58.0, -57.0), (66.0, -55.0), (-30.0, 56.0), (-20.0, 57.0))):
    c = P(x, y, TOPW + 0.2)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k % 4], z=c.z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 22.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('panama-canal')
