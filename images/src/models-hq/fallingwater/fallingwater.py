# Fallingwater in the high-quality look (hq.py), laid out in metres: Frank Lloyd Wright's house over Bear
# Run, seen from downstream as in its famous view: the stream coming down its wooded valley, the upper
# pool sliding over the sandstone ledge in a white fall to the pool below; the house on its rock above
# the bank, its cream concrete terraces with their rounded parapets cantilevered one over another out
# over the falls, the stone core and the tall chimney rising through them, the bands of glass in their
# Cherokee-red frames, the hatch's stair hanging down to the water; boulders in the stream, the woods and
# rhododendrons all round.
# Run: blender -b --factory-startup -P fallingwater.py -- fallingwater-1024.png 1024 fallingwater.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1937)
M['concreteFW'] = material('fallingwaterConcrete', '#e6d9b0', 0.75, vary='#ddcfa4', vary_scale=30, bump=0.05, bump_scale=200)
M['stoneFW'] = layered('fallingwaterStone', ['#9c8566', '#aa9373', '#8d775a', '#b39e7f'], scale=60.0, distortion=0.6, rough=0.9, bump=0.35, bump_scale=200)
M['ledge'] = layered('bearRunLedge', ['#8f8270', '#a09380', '#7d7262'], scale=20.0, distortion=1.0, rough=0.9, bump=0.4, bump_scale=120)
M['cherokee'] = material('cherokeeRed', '#9c3b2b', 0.5)
M['glassFW'] = material('fallingwaterGlass', '#6e8a8e', 0.12, vary='#7d999c', vary_scale=6, metallic=0.2)
M['pool'] = material('bearRun', '#4d6f5e', 0.12, vary='#5a7d6a', vary_scale=12, bump=0.05, bump_scale=40, coat=0.5)
M['foamFW'] = material('bearRunFoam', '#dce7e1', 0.4, vary='#f4f8f6', vary_scale=40, bump=0.2, bump_scale=120)
M['forestFloorFW'] = material('fallingwaterFloor', '#56743a', 0.9, vary='#647f42', vary_scale=14, bump=0.3, bump_scale=90)
M['woods'] = material('fallingwaterWoods', '#3f7a35', 0.85, vary='#4d8a3e', vary_scale=14, bump=0.3, bump_scale=90)
M['woodsLight'] = material('fallingwaterWoodsLight', '#6a9a3e', 0.85, vary='#79a748', vary_scale=14, bump=0.3, bump_scale=90)
M['woodsGold'] = material('fallingwaterWoodsGold', '#c99a34', 0.85, vary='#d8a93e', vary_scale=14, bump=0.3, bump_scale=90)
M['rhodo'] = material('rhododendron', '#2c5a2c', 0.85, vary='#356634', vary_scale=14, bump=0.3, bump_scale=90)
M['boulder'] = material('boulder', '#8a8478', 0.9, vary='#7a7468', vary_scale=20, bump=0.4, bump_scale=120)


def falls_material():
    mat = bpy.data.materials.new('bearRunFalls')
    mat.use_nodes = True
    n, l = mat.node_tree.nodes, mat.node_tree.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.35
    coord = n.new('ShaderNodeTexCoord')
    mapping = n.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (1.0, 1.0, 0.12)
    l.new(coord.outputs['Object'], mapping.inputs['Vector'])
    tex = n.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 60.0
    l.new(mapping.outputs['Vector'], tex.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = lin('#b4cbc0')
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = lin('#f6fbf8')
    l.new(tex.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


M['falls'] = falls_material()

S = 0.042               # metres to the tile's units
OX, OY = 5.0, 4.0       # the plan's point at the tile's middle
UPW, LOW = 6.0, 0.4     # the upper and lower pools
LEDGE = 0.0             # the ledge's brink (y)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def cx(y):
    return -6.0 + 3.0 * math.sin(y / 17.0)


def ground(x, y):
    """Bear Run's valley: the two pools, the ledge between them, the banks rising into wooded hills."""
    level = LOW + (UPW - LOW) * smooth((y - (LEDGE - 1.4)) / 1.4)
    w = 8.5 if y > LEDGE else 10.0
    d = abs(x - cx(y)) - w
    bank = 5.5 * smooth(d / 6.0) + 4.5 * smooth((d - 10.0) / 14.0)
    rock = 4.0 * smooth((x - 6.0) / 6.0) * smooth((26.0 - y) / 8.0) * smooth((y + 4.0) / 6.0)   # the house's rock on the right bank
    return level + max(0.0, bank + rock * (1.0 if d > 0 else 0.0))


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.22)
    return ground(x / S + OX, y / S + OY) * S * rim


def pick(z, nz, x, y):
    zm, ym = z / S, y / S + OY
    if math.hypot(x, y) > 1.24 and zm > LOW + 0.12:
        return 3                        # eased down to the edge: the wooded bank
    if nz < 0.6:
        return 0
    if abs(zm - UPW) < 0.12 or zm < LOW + 0.12:
        return 2 if LEDGE - 7.0 < ym < LEDGE - 1.0 else 1
    return 3


land = terrain('valley', H, [M['ledge'], M['pool'], M['foamFW'], M['forestFloorFW']], pick, rings=320, segs=900)
BEFORE = set(bpy.data.objects)
Z0 = G


def P(x, y, z):
    return Vector(((x - OX) * S, (y - OY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def tray(name, x0, x1, y0, y1, z, open_side=None):
    """A cantilevered terrace: its slab and the thick parapet round it with a rounded top."""
    block(name + 'Slab', M['concreteFW'], x0, x1, y0, y1, z - 0.6, z - 0.06)     # its top just under any ceiling it meets
    for side, (a0, a1, b0, b1) in (('s', (x0, x1, y0, y0 + 0.5)), ('n', (x0, x1, y1 - 0.5, y1)), ('w', (x0, x0 + 0.5, y0, y1)), ('e', (x1 - 0.5, x1, y0, y1))):
        if side == open_side:
            continue
        block(name + 'Parapet' + side, M['concreteFW'], a0, a1, b0, b1, z - 0.6, z + 1.0, bevel=0.0035)


# ------------------------------------------------------------------ the falls over the ledge, boulders in the stream
bm = bmesh.new()
ROWS = 8
grid = []
xs = [cx(LEDGE) - 8.4 + 16.8 * k / 40 for k in range(41)]
for x in xs:
    col = []
    for r in range(ROWS + 1):
        t = r / ROWS
        y = LEDGE - 1.6 * math.sqrt(t) - 0.2
        z = UPW + 0.1 - (UPW - LOW + 0.2) * t
        col.append(bm.verts.new(P(x, y, z)))
    grid.append(col)
for a, b in zip(grid, grid[1:]):
    for r in range(ROWS):
        bm.faces.new((a[r], b[r], b[r + 1], a[r + 1]))
finish('falls', bm, M['falls'], smooth_all=True)
blob_cloud('spray', M['foamFW'], [(P(x, LEDGE - 2.6 - rng.uniform(0.0, 1.5), LOW + 0.2).to_tuple(), rng.uniform(0.8, 1.4) * S, 0.5) for x in xs[::2]])
STONES = [(P(cx(y) + rng.uniform(-6.0, 6.0), y, (UPW if y > LEDGE else LOW) - 0.3).to_tuple(), rng.uniform(1.0, 2.2) * S, 0.6)
          for y in [rng.uniform(-22.0, -6.0) for _ in range(8)] + [rng.uniform(6.0, 26.0) for _ in range(5)]]
blob_cloud('boulders', M['boulder'], STONES)

# ------------------------------------------------------------------ the house: the stone core and chimney, the terraces cantilevered out over the falls
F1 = 12.0               # the living room's floor
block('rockBase', M['stoneFW'], 6.0, 26.0, 4.0, 22.0, 6.0, F1 - 0.6)
block('core', M['stoneFW'], 12.0, 24.0, 10.0, 22.0, F1 - 0.6, F1 + 9.0)
block('chimney', M['stoneFW'], 8.5, 12.0, 11.0, 15.0, F1 - 0.6, F1 + 12.5)
block('stairTower', M['stoneFW'], 20.0, 26.0, 14.0, 24.0, F1 - 0.6, F1 + 11.0)
for x0, x1, y0, y1 in ((-0.5, 4.0, 4.0, 6.0), (16.0, 18.0, 2.0, 4.0)):
    block(f'pier{x0:+.0f}', M['stoneFW'], x0, x1, y0, y1, 6.0, F1 - 0.6)
# the living room: glass walls in red frames on its front and sides, its big terrace over the falls
block('livingRoom', M['concreteFW'], 0.0, 20.0, 2.0, 14.0, F1, F1 + 0.4)
block('livingCeiling', M['concreteFW'], -0.6, 20.6, 1.4, 14.6, F1 + 3.2, F1 + 3.8)
block('livingBack', M['stoneFW'], 0.0, 12.0, 13.4, 14.0, F1 + 0.4, F1 + 3.2)
GL = []
for k in range(8):
    x = 1.25 + 2.5 * k
    c = P(x, 2.0, 0)
    GL.append((c.x, c.y, Z0 + (F1 + 0.4) * S, 2.3 * S, 2.7 * S, (0, -1), 'rect'))
for k in range(4):
    y = 3.4 + 2.5 * k
    c = P(0.0, y, 0)
    GL.append((c.x, c.y, Z0 + (F1 + 0.4) * S, 2.3 * S, 2.7 * S, (-1, 0), 'rect'))
block('livingGlassBack', M['glassFW'], 0.15, 19.85, 2.15, 13.3, F1 + 0.4, F1 + 3.2, bevel=0)
tray('terrace1', -10.0, 4.0, -6.0, 6.0, F1)
tray('terrace1East', 14.0, 22.0, -3.0, 2.2, F1, open_side='n')
# the hatch's stair down to the stream
for k in range(9):
    z1 = F1 - 0.6 - 0.62 * k
    block(f'hatchStep{k}', M['concreteFW'], 4.4, 7.2, 1.8 - 0.55 * (k + 1), 1.8 - 0.55 * k, z1 - 0.25, z1, bevel=0)
for s in (4.3, 7.3):
    bar(f'hatchHanger{s:.0f}', M['cherokee'], P(s, 1.6, F1 - 0.4), P(s, 1.8 - 0.55 * 9, F1 - 0.6 - 0.62 * 8 + 1.0), 0.12 * S)
# the second floor: bedrooms and the terrace thrust out at right angles
F2 = F1 + 3.8
block('bedrooms', M['concreteFW'], 6.0, 20.0, 6.0, 14.0, F2, F2 + 0.4)
block('bedroomCeiling', M['concreteFW'], 5.4, 20.6, 5.4, 14.6, F2 + 3.0, F2 + 3.5)
block('bedroomGlass', M['glassFW'], 6.15, 19.85, 6.15, 13.85, F2 + 0.4, F2 + 3.0, bevel=0)
for k in range(5):
    x = 7.4 + 2.8 * k
    c = P(x, 6.0, 0)
    GL.append((c.x, c.y, Z0 + (F2 + 0.4) * S, 2.6 * S, 2.5 * S, (0, -1), 'rect'))
tray('terrace2', 2.0, 12.0, -10.0, 6.0, F2, open_side='n')
# the third floor: the study and its terrace
F3 = F2 + 3.5
block('study', M['concreteFW'], 12.0, 20.0, 8.0, 16.0, F3, F3 + 0.4)
block('studyCeiling', M['concreteFW'], 11.4, 20.6, 7.4, 16.6, F3 + 2.8, F3 + 3.3)
block('studyGlass', M['glassFW'], 12.15, 19.85, 8.15, 15.85, F3 + 0.4, F3 + 2.8, bevel=0)
for k in range(3):
    x = 13.3 + 2.7 * k
    c = P(x, 8.0, 0)
    GL.append((c.x, c.y, Z0 + (F3 + 0.4) * S, 2.4 * S, 2.3 * S, (0, -1), 'rect'))
tray('terrace3', 8.0, 16.0, 2.0, 8.0, F3, open_side='n')
glazed('glazing', GL, M['cherokee'], glass=M['glassFW'], depth=0.15 * S, bars=False)

# ------------------------------------------------------------------ the woods: trees on the banks, rhododendrons along the water
CROWNS, SHRUBS = [], []
for p in scatter_on(land, 30000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 3 and math.hypot(p.x, p.y) < 1.33, seed=8):
    x, y = p.x / S + OX, p.y / S + OY
    if -12.0 < x < 28.0 and -12.0 < y < 26.0:
        continue
    if y < -4.0 and abs(x - cx(y)) < 18.0:
        continue                        # the view of the falls kept open
    d = abs(x - cx(y)) - (8.5 if y > LEDGE else 10.0)
    if d < 6.0 and len(SHRUBS) < 160:
        SHRUBS.append(((p.x, p.y, p.z + 0.5 * S), rng.uniform(1.0, 1.7) * S, 0.7))
    elif d > 7.0 and len(CROWNS) < 380:
        CROWNS.append(((p.x, p.y, p.z + rng.uniform(4.0, 7.0) * S), rng.uniform(2.2, 3.6) * S, 0.85))
blob_cloud('woods', M['woods'], CROWNS[::2])
blob_cloud('woodsLight', M['woodsLight'], CROWNS[1::4])
blob_cloud('woodsGold', M['woodsGold'], CROWNS[3::4])
blob_cloud('rhododendrons', M['rhodo'], SHRUBS)
for k, (x, y) in enumerate(((-4.0, -1.0), (0.0, 2.0))):
    c = P(x, y, F1)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue')[k], z=c.z, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 22.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('fallingwater')
