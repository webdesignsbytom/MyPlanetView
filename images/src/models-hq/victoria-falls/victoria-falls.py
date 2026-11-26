# Victoria Falls in the high-quality look (hq.py), laid out in metres (the gorge drawn shallower and the
# bridge nearer than they are, to fit): Mosi-oa-Tunya, the Zambezi falling along its whole width over the
# straight basalt lip into the narrow first gorge, a long white curtain broken by wooded islands on the
# brink; the spray rising from the gorge; the broad river above with its islands; the rainforest along the
# facing cliff with the viewpoint path; the outlet gorge turning towards us with the steel arch of the
# Victoria Falls Bridge across it, and people.
# Run: blender -b --factory-startup -P victoria-falls.py -- victoria-falls-1024.png 1024 victoria-falls.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1855)
M['basaltV'] = layered('zambeziBasalt', ['#4d453e', '#5c5248', '#433c36', '#685d51'], scale=10.0, distortion=1.5, rough=0.9, bump=0.4, bump_scale=70)
M['river'] = material('zambezi', '#5f8466', 0.12, vary='#6c9070', vary_scale=10, bump=0.05, bump_scale=40, coat=0.5)
M['rapidsV'] = material('zambeziRapids', '#a9c4b4', 0.3, vary='#e4efe9', vary_scale=40, bump=0.15, bump_scale=120)
M['gorgeWater'] = material('boilingPot', '#3f6a5c', 0.1, vary='#e4efe9', vary_scale=30, coat=0.5)
M['floorV'] = material('rainforestFloor', '#3e6b2e', 0.9, vary='#4a7a35', vary_scale=14)
M['rainforest'] = material('rainforest', '#2f7a34', 0.85, vary='#3f8c3a', vary_scale=14, bump=0.3, bump_scale=90)
M['rainforest2'] = material('rainforestLight', '#5c9b3c', 0.85, vary='#6aa845', vary_scale=14, bump=0.3, bump_scale=90)
M['steelV'] = material('bridgeSteel', '#8a8e88', 0.45, metallic=0.5)
M['pathV'] = material('viewPath', '#b5a183', 0.9)


def falls_material():
    mat = bpy.data.materials.new('mosiOaTunya')
    mat.use_nodes = True
    n, l = mat.node_tree.nodes, mat.node_tree.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.35
    coord = n.new('ShaderNodeTexCoord')
    mapping = n.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (1.0, 1.0, 0.12)
    l.new(coord.outputs['Object'], mapping.inputs['Vector'])
    tex = n.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 70.0
    l.new(mapping.outputs['Vector'], tex.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = lin('#b9d0c6')
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = lin('#f7fbf9')
    l.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


M['falls'] = falls_material()
mist = material('sprayV', '#f4f8f7', 0.6)
mist.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.3
M['mist'] = mist

S = 0.0105              # metres to the tile's units
Z0 = G
UPW, LOW = 40.0, 2.0    # the river above, and in the gorge (drawn shallower)
LIP = 24.0              # the brink (y)
FRONT = -26.0           # the facing cliff's edge (y)
GX = 70.0               # the outlet gorge's middle (x)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


ISLANDS = [(-60.0, 40.0, 10.0, 6.0), (-10.0, 34.0, 8.0, 6.0), (30.0, 36.0, 12.0, 7.0), (-100.0, 60.0, 16.0, 7.0), (60.0, 70.0, 18.0, 7.0), (-30.0, 80.0, 14.0, 6.0)]


def plateau(x, y):
    """The land and river above: the river behind the lip, with its islands, the rainforest in front."""
    isl = 0.0
    for ix, iy, r, h in ISLANDS:
        d = math.hypot(x - ix, (y - iy) * 1.4)
        isl = max(isl, h * smooth((r - d) / (0.5 * r)))
    front = (3.0 + 1.0 * math.sin(x / 13.0)) * smooth((FRONT + 2.0 - y) / 4.0)
    return UPW + max(isl, front)


def ground(x, y):
    """The plateau cut by the first gorge (between FRONT and LIP) and the outlet gorge turning south."""
    in_gorge = smooth((y - FRONT) / 2.5) * smooth((LIP - y) / 2.5)
    outlet = smooth((14.0 - abs(x - GX - 4.0 * math.sin(y / 15.0))) / 2.5) * smooth((LIP - 10.0 - y) / 2.5)
    cut = max(in_gorge, outlet)
    return LOW + (plateau(x, y) - LOW) * (1.0 - cut)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.2)
    return ground(x / S, y / S) * S * rim


def pick(z, nz, x, y):
    zm, xm, ym = z / S, x / S, y / S
    if math.hypot(x, y) > 1.28 and zm > LOW + 0.5:
        return 3
    if nz < 0.6:
        return 0
    if zm < LOW + 0.3:
        return 4
    if abs(zm - UPW) < 0.25:
        return 2 if LIP < ym < LIP + 14.0 else 1
    return 3


land = terrain('gorge', H, [M['basaltV'], M['river'], M['rapidsV'], M['floorV'], M['gorgeWater']], pick, rings=320, segs=900)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


# ------------------------------------------------------------------ the curtain of water along the lip, broken where islands sit on the brink
ROWS = 10
runs, cur = [], []
x = -140.0
while x < 140.0:
    if math.hypot(x, LIP) * S < 1.34 and plateau(x, LIP + 4.0) < UPW + 0.3 and abs(x - GX) > 16.0:
        cur.append(x)
    elif cur:
        runs.append(cur)
        cur = []
    x += 1.5
if cur:
    runs.append(cur)
SPRAY = []
for j, run in enumerate(runs):
    if len(run) < 3:
        continue
    bm = bmesh.new()
    grid = []
    for x in run:
        col = []
        for r in range(ROWS + 1):
            t = r / ROWS
            col.append(bm.verts.new(P(x, LIP + 1.0 - 6.0 * math.sqrt(t), UPW + 0.3 - (UPW - LOW + 0.6) * t)))
        grid.append(col)
    for a, b in zip(grid, grid[1:]):
        for r in range(ROWS):
            bm.faces.new((a[r], b[r], b[r + 1], a[r + 1]))
    finish(f'falls{j}', bm, M['falls'], smooth_all=True)
    for k, x in enumerate(run):
        if k % 7 == 0:
            SPRAY.append((P(x, LIP - 14.0 + rng.uniform(-3.0, 3.0), LOW + rng.uniform(4.0, 16.0)).to_tuple(), rng.uniform(5.0, 8.0) * S, 0.8))
blob_cloud('spray', M['mist'], SPRAY)

# ------------------------------------------------------------------ the bridge over the outlet gorge
BY = -60.0
BZ = UPW + 4.0
pts = [P(GX - 22.0 + 44.0 * t, BY, LOW + 10.0 + (BZ - LOW - 16.0) * math.sin(math.pi * t)) for t in [k / 20 for k in range(21)]]
for side in (-1.6, 1.6):
    tube(f'bridgeArch{side}', M['steelV'], [Vector((p.x, p.y + side * S, p.z)) for p in pts], 0.6 * S)
box('bridgeDeck', M['steelV'], P(GX, BY, BZ), (64.0 * S, 5.0 * S, 1.2 * S), bevel=0)
for k in range(11):
    t = k / 10
    x = GX - 22.0 + 44.0 * t
    z = LOW + 10.0 + (BZ - LOW - 16.0) * math.sin(math.pi * t)
    bar(f'bridgeStrut{k}', M['steelV'], P(x, BY, z), P(x, BY, BZ - 0.6), 0.35 * S)

# ------------------------------------------------------------------ the rainforest, the viewpoint path, people
slab('path', M['pathV'], [((-110.0) * S, (FRONT - 6.0) * S), (40.0 * S, (FRONT - 6.0) * S), (40.0 * S, (FRONT - 4.0) * S), (-110.0 * S, (FRONT - 4.0) * S)], Z0 + (UPW + 3.0) * S, Z0 + (UPW + 3.4) * S, margin=0.05)
CROWNS = []
for p in scatter_on(land, 20000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 3 and math.hypot(p.x, p.y) < 1.32, seed=5):
    x, y = p.x / S, p.y / S
    if FRONT - 12.0 < y < FRONT + 1.0 or abs(x - GX) < 20.0:
        continue
    CROWNS.append(((p.x, p.y, p.z + rng.uniform(3.0, 5.0) * S), rng.uniform(3.5, 6.0) * S, 0.85))
    if len(CROWNS) >= 260:
        break
blob_cloud('rainforest', M['rainforest'], CROWNS[::2])
blob_cloud('rainforestLight', M['rainforest2'], CROWNS[1::2])
for k, x in enumerate((-60.0, -40.0, -20.0, 10.0)):
    c = P(x, FRONT - 5.0, UPW + 3.4)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k], z=c.z, scale=0.6)

R = Matrix.Rotation(math.radians(-32.0 + 52.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('victoria-falls')
