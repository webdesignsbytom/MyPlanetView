# The Teatro Amazonas in the high-quality look (hq.py), laid out in metres: Manaus's rubber-boom opera
# house, rose-pink with its white trim; the front's loggia of arches under the balcony on its paired
# columns, the tall arched windows over it and the pediment; the long sides with their windows; the
# dome over the auditorium at the back, tiled in the Brazilian flag's green, yellow and blue between its
# ribs, its lantern on top; the black-and-white wave pavement of São Sebastião square before it, palms
# and mango trees, and people.
# Run: blender -b --factory-startup -P teatro-amazonas.py -- teatro-amazonas-1024.png 1024 teatro-amazonas.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1896)
M['rose'] = material('teatroRose', '#e3a3a8', 0.7, vary='#dc979d', vary_scale=30, bump=0.04, bump_scale=200)
M['trimT'] = material('teatroTrim', '#f6f3ec', 0.55)
M['roofT'] = material('teatroRoof', '#8f8a86', 0.6, vary='#85807b', vary_scale=30)
M['domeTiles'] = mosaic('teatroDome', [(4, '#2f9a4c'), (4, '#f2c63a'), (3, '#2f62b8'), (1, '#e8e2cf')], scale=34, mortar='#cfc8b2', rough=0.3)
M['domeRib'] = material('teatroDomeRib', '#e2b23a', 0.4, metallic=0.3)
M['mango'] = material('mangoTree', '#2f6f2f', 0.85, vary='#3c7f37', vary_scale=14, bump=0.3, bump_scale=90)
M['palmTrunkT'] = material('palmTrunkT', '#a49a86', 0.8, vary='#968c78', vary_scale=40)
M['frondT'] = material('palmFrondT', '#4f8f36', 0.8, vary='#5c9c40', vary_scale=20)


def waves_material():
    """The square's Portuguese pavement: black and cream waves."""
    mat = bpy.data.materials.new('wavePavement')
    mat.use_nodes = True
    n, l = mat.node_tree.nodes, mat.node_tree.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.75
    coord = n.new('ShaderNodeTexCoord')
    sine = n.new('ShaderNodeMath')
    sine.operation = 'SINE'
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(coord.outputs['Object'], sep.inputs['Vector'])
    k = n.new('ShaderNodeMath')
    k.operation = 'MULTIPLY'
    k.inputs[1].default_value = 9.0
    l.new(sep.outputs['X'], k.inputs[0])
    l.new(k.outputs['Value'], sine.inputs[0])
    amp = n.new('ShaderNodeMath')
    amp.operation = 'MULTIPLY'
    amp.inputs[1].default_value = 0.07
    l.new(sine.outputs['Value'], amp.inputs[0])
    add = n.new('ShaderNodeMath')
    add.operation = 'ADD'
    l.new(sep.outputs['Y'], add.inputs[0])
    l.new(amp.outputs['Value'], add.inputs[1])
    band = n.new('ShaderNodeMath')
    band.operation = 'MULTIPLY'
    band.inputs[1].default_value = 13.0
    l.new(add.outputs['Value'], band.inputs[0])
    frac = n.new('ShaderNodeMath')
    frac.operation = 'PINGPONG'
    frac.inputs[1].default_value = 1.0
    l.new(band.outputs['Value'], frac.inputs[0])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = lin('#2f2e31')
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = lin('#ece6d8')
    l.new(frac.outputs['Value'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


M['waves'] = waves_material()

S = 0.027               # metres to the tile's units
FY = 10.0               # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def T(x, y):
    return (x * S, (y - FY) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
slab('square', M['waves'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
WIN, DOORS = [], []

# ------------------------------------------------------------------ the body: rose walls, white trim, two storeys of windows down the sides
XW, YF, YB = 22.0, -14.0, 44.0
EH = 17.0
block('podium', M['trimT'], -XW - 1.2, XW + 1.2, YF - 1.2, YB + 1.2, -0.3, 1.6)
block('body', M['rose'], -XW, XW, YF, YB, -0.3, EH)
block('band', M['trimT'], -XW - 0.3, XW + 0.3, YF - 0.3, YB + 0.3, 7.6, 8.4, bevel=0)
block('cornice', M['trimT'], -XW - 0.8, XW + 0.8, YF - 0.8, YB + 0.8, EH, EH + 1.0)
block('balustrade', M['trimT'], -XW - 0.2, XW + 0.2, YF - 0.2, YB + 0.2, EH + 1.0, EH + 2.2)
gable_roof('roof', M['roofT'], -XW * S + 0.6 * S, XW * S - 0.6 * S, (YF + 1.0 - FY) * S, (YB - 1.0 - FY) * S, Z0 + (EH + 1.0) * S, 5.0 * S, over=0.0, along='y')
for s in (-1, 1):
    for y in (-6.0, 1.0, 8.0, 15.0, 30.0, 37.0):
        c = P(s * (XW + 0.05), y, 0)
        WIN.append((c.x, c.y, Z0 + 2.2 * S, 2.6 * S, 4.4 * S, (s, 0), 'round'))
        WIN.append((c.x, c.y, Z0 + 9.6 * S, 2.6 * S, 5.0 * S, (s, 0), 'round'))
    for y in (-9.5, -2.5, 4.5, 11.5, 18.5, 26.5, 33.5, 40.5):
        block(f'pilaster{s}{y:+.0f}', M['trimT'], *sorted((s * XW, s * (XW + 0.5))), y - 0.5, y + 0.5, 1.6, EH)

# ------------------------------------------------------------------ the front: the loggia's arches, the balcony on paired columns, the windows, the pediment
LY = YF - 6.0
block('loggiaFloor', M['trimT'], -14.0, 14.0, LY - 1.0, YF, -0.3, 1.6)
for k in range(5):
    x = -11.2 + 5.6 * k
    c = P(x, YF - 0.05, 0)
    DOORS.append((c.x, c.y, Z0 + 1.6 * S, 2.8 * S, 4.8 * S, (0, -1), 'round'))
for k, x in enumerate((-13.0, -10.4, -4.0, -1.6, 1.6, 4.0, 10.4, 13.0)):
    column(f'loggiaColumn{k}', M['trimT'], x * S, (LY + 0.6 - FY) * S, Z0 + 1.6 * S, 6.4 * S, 0.55 * S, segs=14, cap_mat=M['trimT'])
block('balcony', M['trimT'], -14.0, 14.0, LY - 0.6, YF, 8.0, 8.8)
block('balconyRail', M['trimT'], -14.0, 14.0, LY - 0.6, LY - 0.2, 8.8, 9.8, bevel=0)
for k in range(5):
    x = -11.2 + 5.6 * k
    c = P(x, YF - 0.05, 0)
    WIN.append((c.x, c.y, Z0 + 9.2 * S, 2.6 * S, 5.4 * S, (0, -1), 'round'))
for x in (-14.0, -8.4, -2.8, 2.8, 8.4, 14.0):
    block(f'frontPilaster{x:+.0f}', M['trimT'], x - 0.45, x + 0.45, YF - 0.5, YF, 8.8, EH)
for s in (-1, 1):
    c = P(s * 18.0, YF - 0.05, 0)
    WIN.append((c.x, c.y, Z0 + 2.2 * S, 2.6 * S, 4.4 * S, (0, -1), 'round'))
    WIN.append((c.x, c.y, Z0 + 9.6 * S, 2.6 * S, 5.0 * S, (0, -1), 'round'))
bm = bmesh.new()
tri = [(-12.0, EH + 2.2), (12.0, EH + 2.2), (0.0, EH + 7.2)]
add_prism(bm, [bm.verts.new(P(x, YF - 0.6, z)) for x, z in tri], [bm.verts.new(P(x, YF + 1.0, z)) for x, z in tri])
finish('pediment', bm, M['rose'], smooth_sides=False)
for (xa, za), (xb, zb) in ((tri[0], tri[2]), (tri[2], tri[1])):
    bar(f'pedimentEdge{xa:+.0f}', M['trimT'], P(xa, YF - 0.8, za), P(xb, YF - 0.8, zb), 0.6 * S)
block('pedimentBase', M['trimT'], -12.4, 12.4, YF - 0.9, YF + 1.0, EH + 1.8, EH + 2.4, bevel=0)
for x in (-12.0, 0.0, 12.0):
    lathe(f'acroterion{x:+.0f}', M['trimT'], [(0.6 * S, 0.0), (0.8 * S, 0.6 * S), (0.4 * S, 1.4 * S), (0.0, 1.9 * S)], P(x, YF - 0.2, EH + (7.2 if x == 0 else 2.2)), segs=12)

# ------------------------------------------------------------------ the dome over the auditorium: drum, tiled shell between ribs, lantern
DC = (0.0, 24.0)
DZ = EH + 4.0          # the drum's height over the cornice: clear of the roof's ridge
cylinder('domeDrum', M['rose'], 11.0 * S, (DZ + 5.0 - EH) * S, P(*DC, EH), segs=64)
cylinder('domeDrumCap', M['trimT'], 11.6 * S, 0.8 * S, P(*DC, DZ + 5.0), segs=64)
for k in range(12):
    a = 2 * math.pi * (k + 0.5) / 12
    c = P(DC[0] + 11.02 * math.cos(a), DC[1] + 11.02 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + (DZ + 1.0) * S, 1.8 * S, 3.0 * S, (math.cos(a), math.sin(a)), 'round'))
prof = [(10.8 * math.cos(t), 12.0 * math.sin(t)) for t in [math.radians(a) for a in range(0, 91, 3)]]
prof[-1] = (0.0, prof[-1][1])
lathe('dome', M['domeTiles'], [(u * S, v * S) for u, v in prof], P(*DC, DZ + 5.8), segs=72, smooth=True)
for j in range(16):
    a = 2 * math.pi * j / 16
    tube(f'domeRib{j}', M['domeRib'], [P(DC[0] + (u + 0.15) * math.cos(a), DC[1] + (u + 0.15) * math.sin(a), DZ + 5.8 + v) for u, v in prof[:-3]], 0.24 * S)
cylinder('lantern', M['trimT'], 2.2 * S, 2.8 * S, P(*DC, DZ + 17.5), segs=24)
lathe('lanternCap', M['domeTiles'], [(2.5 * S, 0.0), (1.8 * S, 1.2 * S), (0.3 * S, 2.6 * S), (0.0, 3.4 * S)], P(*DC, DZ + 20.3), segs=24, smooth=True)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    c = P(DC[0] + 2.22 * math.cos(a), DC[1] + 2.22 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + (DZ + 18.0) * S, 0.9 * S, 1.6 * S, (math.cos(a), math.sin(a)), 'round'))

# ------------------------------------------------------------------ palms and mango trees round the square, people
FRONDS = []
for j, (x, y) in enumerate(((-30.0, -20.0), (30.0, -20.0), (-30.0, 6.0), (30.0, 6.0))):
    h = rng.uniform(13.0, 15.0)
    lathe(f'palm{j}', M['palmTrunkT'], [(0.55 * S, 0.0), (0.45 * S, h * 0.5 * S), (0.42 * S, h * S)], P(x, y, 0.0), segs=12, smooth=True)
    for f in range(9):
        a = 2 * math.pi * f / 9 + j
        tube(f'frond{j}{f}', M['frondT'], [P(x, y, h), P(x + 2.4 * math.cos(a), y + 2.4 * math.sin(a), h + 0.8), P(x + 4.4 * math.cos(a), y + 4.4 * math.sin(a), h - 1.4)], 0.35 * S)
for j, (x, y) in enumerate(((-34.0, 26.0), (34.0, 26.0), (-36.0, -6.0), (36.0, -6.0))):
    tube(f'mangoTrunk{j}', M['trunk'], [P(x, y, 0.0), P(x, y, 4.0)], 0.6 * S)
    blob_cloud(f'mango{j}', M['mango'], [(P(x + rng.uniform(-2.5, 2.5), y + rng.uniform(-2.5, 2.5), 6.5 + rng.uniform(-1.0, 1.5)).to_tuple(), rng.uniform(2.6, 3.6) * S, 0.8) for _ in range(7)])
glazed('windows', WIN, M['trimT'], glass=M['window'], depth=0.3 * S)
glazed('doors', DOORS, M['trimT'], glass=M['door'], depth=0.3 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-6.0, -28.0, 'red'), (5.0, -32.0, 'blue'), (-16.0, -36.0, 'yellow'), (14.0, -26.0, 'green'), (0.0, -22.0, 'red'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.85)

R = Matrix.Rotation(math.radians(-32.0 + 16.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('teatro-amazonas')
