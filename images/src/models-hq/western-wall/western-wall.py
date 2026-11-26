# The Western Wall in the high-quality look (hq.py), laid out in metres: the great wall of pale limestone,
# its lower courses of huge Herodian ashlars with their drafted margins, smaller courses above, caper
# bushes growing from its joints; the top of the Mount behind it with its trees; the covered wooden ramp
# climbing to the Mughrabi Gate at its right; the arch into Wilson's Arch at its left; the paved plaza
# before it with the screen dividing the prayer area, and people.
# Run: blender -b --factory-startup -P western-wall.py -- western-wall-1024.png 1024 western-wall.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1967)


def ashlar(name, base, mortar, width, height, vary):
    """Ashlar courses on a wall facing -y: long blocks in rows (a brick texture on x and z)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    n, l = mat.node_tree.nodes, mat.node_tree.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.85
    coord = n.new('ShaderNodeTexCoord')
    mapping = n.new('ShaderNodeMapping')
    mapping.inputs['Rotation'].default_value = (math.pi / 2, 0.0, 0.0)
    l.new(coord.outputs['Object'], mapping.inputs['Vector'])
    brick = n.new('ShaderNodeTexBrick')
    brick.inputs['Color1'].default_value = lin(base)
    brick.inputs['Color2'].default_value = lin(vary)
    brick.inputs['Mortar'].default_value = lin(mortar)
    brick.inputs['Scale'].default_value = 1.0
    brick.inputs['Mortar Size'].default_value = height * 0.06
    brick.inputs['Brick Width'].default_value = width
    brick.inputs['Row Height'].default_value = height
    l.new(mapping.outputs['Vector'], brick.inputs['Vector'])
    l.new(brick.outputs['Color'], bsdf.inputs['Base Color'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.5
    bump.inputs['Distance'].default_value = 0.002
    l.new(brick.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


S = 0.0305              # metres to the tile's units
FY = 6.0
Z0 = G + 0.004
M['herodian'] = ashlar('herodian', '#dcd1b6', '#a89c82', 3.2 * S, 1.15 * S, '#d2c6aa')
M['upperCourse'] = ashlar('upperCourses', '#d8ccb0', '#a69a80', 1.4 * S, 0.7 * S, '#cfc3a6')
M['plazaW'] = masonry('kotelPlaza', '#ddd3bd', '#bcb19b', scale=60, rough=0.8, vary='#d4c9b2')
M['caper'] = material('caperBush', '#5f8f3e', 0.85, vary='#6c9c48', vary_scale=14, bump=0.3, bump_scale=90)
M['treeW'] = material('mountTrees', '#4a7f38', 0.85, vary='#578c41', vary_scale=14, bump=0.3, bump_scale=90)
M['wood'] = material('rampWood', '#7a5a3e', 0.7, vary='#6c4f35', vary_scale=40)
M['roofW'] = material('rampRoof', '#8a8e90', 0.5)
M['screen'] = material('partitionScreen', '#c9c3b6', 0.6)
M['recessW'] = material('wilsonArch', '#4a4234', 0.9)


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
slab('plaza', M['plazaW'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
WX0, WX1, WY = -30.0, 26.0, 8.0
# ------------------------------------------------------------------ the wall: Herodian courses below, smaller courses above, the Mount behind
block('wallLower', M['herodian'], WX0, WX1, WY, WY + 6.0, -0.3, 11.0)
block('wallUpper', M['upperCourse'], WX0, WX1, WY + 0.2, WY + 6.0, 11.0, 19.0)
slab('mount', M['plazaW'], [((WX0 - 30.0) * S, (WY + 6.0 - FY) * S), ((WX1 + 30.0) * S, (WY + 6.0 - FY) * S), ((WX1 + 30.0) * S, (WY + 60.0 - FY) * S), ((WX0 - 30.0) * S, (WY + 60.0 - FY) * S)], Z0 - 0.003, Z0 + 18.6 * S, margin=0.03)
TREES = []
for k in range(26):
    x, y = rng.uniform(WX0 - 4.0, WX1 + 10.0), rng.uniform(WY + 10.0, WY + 28.0)
    if math.hypot(x, y - FY) * S > 1.34:
        continue
    TREES.append((P(x, y, 22.0 + rng.uniform(-0.6, 0.8)).to_tuple(), rng.uniform(2.2, 3.4) * S, 0.85))
    tube(f'treeTrunk{k}', M['trunk'], [P(x, y, 18.6), P(x, y, 21.0)], 0.3 * S)
blob_cloud('mountTrees', M['treeW'], TREES)
CAPERS = []
for k in range(40):
    x, z = rng.uniform(WX0 + 1.0, WX1 - 1.0), rng.uniform(6.0, 18.0)
    CAPERS.append((P(x, WY - 0.2, z).to_tuple(), rng.uniform(0.4, 0.9) * S, 0.7))
blob_cloud('capers', M['caper'], CAPERS)

# ------------------------------------------------------------------ Wilson's Arch at the left, the Mughrabi ramp at the right
block('wilsonBlock', M['upperCourse'], WX0 - 11.0, WX0, WY - 5.0, WY + 6.0, -0.3, 14.0)
arcade_path('wilsonArch', M['herodian'], [((WX0 - 10.0) * S, (WY - 5.2 - FY) * S), ((WX0 - 1.0) * S, (WY - 5.2 - FY) * S)], 0.6 * S, Z0 + 4.0 * S, 6.0 * S, 4.2 * S)
c = P(WX0 - 5.5, WY - 5.05, 0)
WIN = [(c.x, c.y, Z0 + 0.0, 8.0 * S, 8.0 * S, (0, -1), 'round')]
glazed('wilsonRecess', WIN, M['herodian'], glass=M['recessW'], depth=0.3 * S, bars=False)
RX0, RX1 = WX1 + 1.0, WX1 + 9.0
for j in range(10):
    t = j / 9
    y = WY - 20.0 + 24.0 * t
    z = 2.0 + 15.0 * t
    for s in (-1, 1):
        bar(f'rampLeg{j}{s}', M['wood'], P((RX0 + RX1) / 2 + s * 2.4, y, 0.0), P((RX0 + RX1) / 2 + s * 2.4, y, z), 0.3 * S)
bm = bmesh.new()
sec = [((RX0 + RX1) / 2 - 2.8, 0.0), ((RX0 + RX1) / 2 + 2.8, 0.0), ((RX0 + RX1) / 2 + 2.8, 3.0), ((RX0 + RX1) / 2 - 2.8, 3.0)]
a = [bm.verts.new(P(x, WY - 20.0, 2.0 + z)) for x, z in sec]
b = [bm.verts.new(P(x, WY + 4.0, 17.0 + z)) for x, z in sec]
add_prism(bm, a, b)
finish('ramp', bm, M['wood'], smooth_sides=False)
bm = bmesh.new()
sec = [((RX0 + RX1) / 2 - 3.2, 3.0), ((RX0 + RX1) / 2 + 3.2, 3.0), ((RX0 + RX1) / 2, 4.6)]
a = [bm.verts.new(P(x, WY - 20.0, 2.0 + z)) for x, z in sec]
b = [bm.verts.new(P(x, WY + 4.0, 17.0 + z)) for x, z in sec]
add_prism(bm, a, b)
finish('rampRoof', bm, M['roofW'], smooth_sides=False)

# ------------------------------------------------------------------ the prayer area's screen, people
block('screen', M['screen'], 4.0, 5.0, WY - 16.0, WY - 1.0, 0.0, 1.8)
block('fence', M['screen'], WX0, RX0 - 1.0, WY - 17.0, WY - 16.4, 0.0, 1.1)
for k in range(24):
    x = rng.uniform(WX0 + 2.0, WX1 - 4.0)
    y = WY - rng.uniform(1.5, 10.0)
    if abs(x - 4.5) < 1.2:
        continue
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('blue', 'white', 'red', 'green', 'yellow')[k % 5], z=Z0, scale=0.75)

R = Matrix.Rotation(math.radians(-32.0 + 16.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('western-wall')
