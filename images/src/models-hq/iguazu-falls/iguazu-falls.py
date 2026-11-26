# Iguazú Falls in the high-quality look (hq.py), laid out in metres round the Devil's Throat (Garganta del
# Diablo): the U-shaped chasm with its basalt walls, the river pouring over its brink on three sides in
# white curtains that bow out as they fall, split where wooded islands sit on the brink; the spray rising
# from the foot of the falls; the wide upper river behind with its jungle islands, the rapids quickening
# towards the edge; the lower river running out of the chasm towards us, a tour boat on it; the steel
# catwalk on its piers across the upper river to the viewing platform at the brink, with people; and the
# Atlantic forest on the banks.
# Run: blender -b --factory-startup -P iguazu-falls.py -- iguazu-falls-1024.png 1024 iguazu-falls.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1541)
M['basalt'] = layered('iguazuBasalt', ['#4a4038', '#5b5045', '#3f3730', '#64584b'], scale=9.0, distortion=1.5, rough=0.9, bump=0.4, bump_scale=70)
M['upperRiver'] = material('upperRiver', '#5f8466', 0.12, vary='#6c9070', vary_scale=10, bump=0.05, bump_scale=40, coat=0.5)
M['rapids'] = material('rapids', '#a9c4b4', 0.3, vary='#e4efe9', vary_scale=40, bump=0.15, bump_scale=120)
M['lowerRiver'] = material('lowerRiver', '#4d7466', 0.12, vary='#5a8272', vary_scale=10, bump=0.05, bump_scale=40, coat=0.5)
M['foam'] = material('foam', '#dfece6', 0.4, vary='#f6faf8', vary_scale=30, bump=0.2, bump_scale=120)
M['forestFloor'] = material('forestFloor', '#3e6b2e', 0.9, vary='#4a7a35', vary_scale=14, bump=0.3, bump_scale=90)
M['jungle'] = material('atlanticForest', '#2f7a34', 0.85, vary='#3f8c3a', vary_scale=14, bump=0.3, bump_scale=90)
M['jungleLight'] = material('atlanticForestLight', '#5c9b3c', 0.85, vary='#6aa845', vary_scale=14, bump=0.3, bump_scale=90)
M['deck'] = material('catwalkDeck', '#8b8f8c', 0.6, vary='#7f8380', vary_scale=60)
M['steel'] = material('catwalkSteel', '#5d6266', 0.45, metallic=0.5)
M['boat'] = material('tourBoat', '#2c3e57', 0.5)
M['vest'] = material('lifeVest', '#f08a1f', 0.6)


def falls_material():
    """White water streaked downwards: a noise squashed along z, white to pale green-grey."""
    mat = bpy.data.materials.new('fallingWater')
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
    tex.inputs['Detail'].default_value = 4.0
    l.new(mapping.outputs['Vector'], tex.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = lin('#b9d0c6')
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = lin('#f7fbf9')
    l.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


def mist_material():
    mat = material('spray', '#f4f8f7', 0.6)
    mat.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 0.55
    return mat


M['falls'] = falls_material()
M['mist'] = mist_material()

S = 0.0085              # metres to the tile's units
Z0 = G
UPW, LOW = 70.0, 1.5    # the upper and lower rivers' surface
W = 74.0                # the throat's half-width
YB = 4.0                # the middle of the throat's round end
YS = -14.0              # the upper river's edge: wooded land in front of it


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def throat_q(x, y):
    """How far (x, y) is from the throat's middle line: under W inside the chasm."""
    return abs(x) if y <= YB else math.hypot(x, y - YB)


def width(y):
    """The chasm's half-width: exact where the water falls, ragged further down the gorge."""
    rag = smooth((YS - 12.0 - y) / 30.0)
    return W + rag * (5.0 * math.sin(y / 17.0) + 3.0 * math.sin(y / 7.3 + 1.0))


ISLANDS = [(-56.0, 86.0, 13.0, 7.0), (40.0, 96.0, 15.0, 8.0), (88.0, 40.0, 14.0, 7.0), (-90.0, 30.0, 11.0, 6.0),
           (-20.0, 128.0, 16.0, 8.0), (70.0, 130.0, 14.0, 7.0), (-110.0, 90.0, 18.0, 8.0), (118.0, 88.0, 16.0, 7.0),
           (80.0, 4.0, 8.0, 6.0), (-81.0, 10.0, 7.0, 5.0)]


def plateau(x, y):
    """The ground above the falls: the upper river (UPW) with its islands, wooded land in front."""
    land = smooth((YS - y + 4.0 * math.sin(x / 19.0)) / 10.0) * (7.0 + 2.0 * math.sin(x / 11.0 + y / 13.0))
    isl = 0.0
    for ix, iy, r, h in ISLANDS:
        d = math.hypot(x - ix, (y - iy) * 1.3)
        isl = max(isl, h * smooth((r - d) / (0.5 * r)))
    return UPW + max(land, isl)


def ground(x, y):
    q = throat_q(x, y) - (width(y) - W if y <= YB else 0.0)
    wall = smooth((q - (W - 1.6)) / 3.0)            # the cliff, from the lower river up to the brink
    talus = 3.0 * smooth((q - (W - 9.0)) / 7.0) * (1.0 - wall)
    return LOW + talus + (plateau(x, y) - LOW) * wall


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.3)
    return ground(x / S, y / S) * S * rim


def pick(z, nz, x, y):
    zm, xm, ym = z / S, x / S, y / S
    q = throat_q(xm, ym)
    if math.hypot(x, y) > 1.17 and q > W + 4.0 and zm < UPW - 0.3:
        return 5                                    # the wooded banks down to the base's edge
    if nz < 0.55:
        return 0                                    # basalt
    if zm < LOW + 0.2:
        return 4 if q > W - 13.0 and ym > YS else 3   # foam at the foot of the falls, else the lower river
    if abs(zm - UPW) < 0.25:
        return 2 if q < W + 14.0 else 1             # rapids near the brink, else the upper river
    if zm < UPW - 1.0:
        return 0
    return 5


land = terrain('throat', H, [M['basalt'], M['upperRiver'], M['rapids'], M['lowerRiver'], M['foam'], M['forestFloor']], pick, rings=380, segs=1100)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


# ------------------------------------------------------------------ the brink: a path round the U, wet where the river reaches it
def brink():
    """(point on the brink, inward direction) every metre round the U, from the right side's front end."""
    out = []
    y = YS + 4.0
    while y < YB:
        out.append(((W, y), (-1.0, 0.0)))
        y += 1.0
    for k in range(int(math.pi * W)):
        a = math.pi * k / int(math.pi * W)
        out.append(((W * math.cos(a), YB + W * math.sin(a)), (-math.cos(a), -math.sin(a))))
    y = YB
    while y > YS + 4.0:
        out.append(((-W, y), (1.0, 0.0)))
        y -= 1.0
    return out


PATH = brink()
OUT = 8.0               # how far the water bows out by the foot


def wet(p, d):
    """Whether the river reaches the brink here (no island on it)."""
    x, y = p[0] - d[0] * 4.0, p[1] - d[1] * 4.0
    return plateau(x, y) < UPW + 0.3


runs, cur = [], []
for p, d in PATH:
    if wet(p, d):
        cur.append((p, d))
    elif cur:
        runs.append(cur)
        cur = []
if cur:
    runs.append(cur)
ROWS = 14
SPRAY, MIST = [], []
for j, run in enumerate(runs):
    if len(run) < 3:
        continue
    bm = bmesh.new()
    grid = []
    for (px, py), (dx, dy) in run:
        col = []
        for r in range(ROWS + 1):
            t = r / ROWS
            o = OUT * math.sqrt(t) - 1.4
            z = UPW + 0.35 - (UPW - LOW + 0.9) * t
            col.append(bm.verts.new(P(px + dx * o, py + dy * o, z)))
        grid.append(col)
    for a, b in zip(grid, grid[1:]):
        for r in range(ROWS):
            bm.faces.new((a[r], b[r], b[r + 1], a[r + 1]))
    finish(f'falls{j}', bm, M['falls'], smooth_all=True)
    for k, ((px, py), (dx, dy)) in enumerate(run):
        if k % 5 == 0:
            o = OUT + rng.uniform(0.5, 4.0)
            SPRAY.append((P(px + dx * o, py + dy * o, LOW + 0.5).to_tuple(), rng.uniform(3.5, 5.5) * S, 0.5))
        if k % 9 == 0:
            o = OUT + rng.uniform(6.0, 16.0)
            MIST.append((P(px + dx * o, py + dy * o, LOW + rng.uniform(8.0, 20.0)).to_tuple(), rng.uniform(9.0, 14.0) * S, 0.8))
blob_cloud('spray', M['foam'], SPRAY)
blob_cloud('mist', M['mist'], MIST)

# ------------------------------------------------------------------ the catwalk on its piers to the platform at the brink, people
DECK = UPW + 3.0
a = math.radians(146.0)
edge = (W * math.cos(a), YB + W * math.sin(a))
ROUTE = [(-150.0, -6.0), (-122.0, 8.0), (-100.0, 34.0), (edge[0] - 6.0 * math.cos(a), edge[1] - 6.0 * math.sin(a))]
SIDES = [[], []]
for (x0, y0), (x1, y1) in zip(ROUTE, ROUTE[1:]):
    L_ = math.hypot(x1 - x0, y1 - y0)
    ux, uy = (x1 - x0) / L_, (y1 - y0) / L_
    box(f'deck{x0:.0f}', M['deck'], P((x0 + x1) / 2, (y0 + y1) / 2, DECK - 0.3), ((L_ + 3.4) * S, 3.4 * S, 0.6 * S), rot_z=math.atan2(uy, ux), bevel=0)
    n = max(1, int(L_ / 9.0))
    for k in range(n + 1):
        x, y = x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n
        for s in (-1, 1):
            bar(f'pier{x:.0f}{y:.0f}{s}', M['steel'], P(x - uy * 1.4 * s, y + ux * 1.4 * s, UPW - 2.0), P(x - uy * 1.4 * s, y + ux * 1.4 * s, DECK - 0.6), 0.5 * S)
            bar(f'post{x:.0f}{y:.0f}{s}', M['steel'], P(x - uy * 1.6 * s, y + ux * 1.6 * s, DECK), P(x - uy * 1.6 * s, y + ux * 1.6 * s, DECK + 1.3), 0.25 * S)
    for s, side in zip((-1, 1), SIDES):
        side += [(x0 - uy * 1.6 * s, y0 + ux * 1.6 * s), (x1 - uy * 1.6 * s, y1 + ux * 1.6 * s)]
for k, side in enumerate(SIDES):
    tube(f'rail{k}', M['steel'], [P(x, y, DECK + 1.3) for x, y in side[1:-1]], 0.2 * S)
# the platform: a round deck reaching out over the brink
px, py = ROUTE[-1]
cylinder('platform', M['deck'], 9.0 * S, 0.6 * S, P(px + 3.0 * math.cos(a), py + 3.0 * math.sin(a), DECK - 0.6), segs=40)
CX, CY = px + 3.0 * math.cos(a), py + 3.0 * math.sin(a)
for k in range(6):
    b = 2 * math.pi * k / 6
    bar(f'platformPier{k}', M['steel'], P(CX + 7.0 * math.cos(b), CY + 7.0 * math.sin(b), UPW - 2.0), P(CX + 7.0 * math.cos(b), CY + 7.0 * math.sin(b), DECK - 0.6), 0.45 * S)
tube('platformRail', M['steel'], [P(CX + 8.8 * math.cos(2 * math.pi * k / 40), CY + 8.8 * math.sin(2 * math.pi * k / 40), DECK + 1.3) for k in range(41)], 0.2 * S)
SPOTS = [(CX + 3.0, CY + 3.0), (CX - 4.0, CY + 1.0), (CX + 1.0, CY - 4.0), (CX - 2.0, CY + 5.0)]
for (x0, y0), (x1, y1) in zip(ROUTE[1:], ROUTE[2:]):
    SPOTS.append((x0 + (x1 - x0) * 0.4, y0 + (y1 - y0) * 0.4))
for k, (x, y) in enumerate(SPOTS):
    c = P(x, y, DECK)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k % 4], z=c.z, scale=0.5)

# ------------------------------------------------------------------ the tour boat on the lower river
BX, BY = 18.0, -30.0
boat = [(-13.0, -3.4), (9.0, -3.4), (15.0, 0.0), (9.0, 3.4), (-13.0, 3.4)]
bm = bmesh.new()
rot = math.radians(70.0)
pts = [(BX + x * math.cos(rot) - y * math.sin(rot), BY + x * math.sin(rot) + y * math.cos(rot)) for x, y in boat]
add_prism(bm, [bm.verts.new(P(x, y, LOW - 0.6)) for x, y in pts], [bm.verts.new(P(x, y, LOW + 1.4)) for x, y in pts])
finish('boat', bm, M['boat'], smooth_sides=False)
for k in range(4):
    u = -9.0 + 5.0 * k
    for s in (-1, 1):
        x, y = BX + u * math.cos(rot) - s * 1.7 * math.sin(rot), BY + u * math.sin(rot) + s * 1.7 * math.cos(rot)
        c = P(x, y, LOW + 1.0)
        cylinder(f'rider{k}{s}', M['vest'], 0.9 * S, 2.2 * S, (c.x, c.y, c.z), segs=10)
        cylinder(f'riderHead{k}{s}', M['skin'], 0.6 * S, 1.1 * S, (c.x, c.y, c.z + 2.2 * S), segs=10)

# ------------------------------------------------------------------ the forest on the banks and islands
CROWNS = []
for p in scatter_on(land, 30000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 5 and math.hypot(p.x, p.y) < 1.42, seed=5):
    x, y = p.x / S, p.y / S
    if any(math.hypot(x - rx, y - ry) < 7.0 for rx, ry in ROUTE[:1]):
        continue
    if abs(x - ROUTE[0][0]) < 30.0 and abs(y - ROUTE[0][1]) < 10.0:
        continue
    CROWNS.append(((p.x, p.y, p.z + rng.uniform(3.0, 6.0) * S), rng.uniform(3.5, 6.5) * S, 0.8))
    if len(CROWNS) >= 1100:
        break
half = len(CROWNS) // 3
blob_cloud('forest', M['jungle'], CROWNS[half:])
blob_cloud('forestLight', M['jungleLight'], CROWNS[:half])

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('iguazu-falls')
