# The Church of the Savior on Spilled Blood in Saint Petersburg in the high-quality look (hq.py), laid out
# in metres and seen down the Griboyedov Canal: the red brick church trimmed in white stone, the
# kokoshnik gables with their gold mosaics, the onion domes twisted in stripes of blue and white, green
# and yellow, gold and green, the tall tented spire in coloured tiles over the middle with its own little
# gold onion, the bell tower at the canal's end under its gilded dome, the gold domes over the apses; the
# canal's granite embankments and railings, the iron footbridge across it, a tour boat, and people.
# Run: blender -b --factory-startup -P saint-petersburg.py -- saint-petersburg-1024.png 1024 saint-petersburg.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
BEFORE = set(bpy.data.objects)
rng = random.Random(1907)
M['brickSPb'] = masonry('spilledBloodBrick', '#a4452f', '#7d3424', scale=420, rough=0.8, vary='#963f2b')
M['whiteSPb'] = material('spbWhite', '#efe9dd', 0.6, vary='#e2dccf', vary_scale=20)
M['mosaicSPb'] = material('kokoshnikMosaic', '#d4a64a', 0.35, vary='#3a6d8a', vary_scale=80, metallic=0.6, bump=0.1, bump_scale=400)
M['granite'] = material('nevaGranite', '#8b6f62', 0.6, vary='#7a6156', vary_scale=40, bump=0.15, bump_scale=200)
M['canal'] = material('griboyedov', '#3e5c66', 0.05, vary='#4a6973', vary_scale=3, coat=0.7, bump=0.1, bump_scale=40)
M['pavingSPb'] = masonry('spbPaving', '#a29e98', '#7d7a75', scale=120, rough=0.85, vary='#96928c')
M['railing'] = material('canalRailing', '#25292b', 0.45, metallic=0.5)


def spiral(name, c1, c2, n=8, twist=0.8):
    """Stripes winding round an onion dome made at its own origin: n bands, shifting `twist` bands a metre up."""
    mat = material(name, c1, 0.35, coat=0.3)
    nt = mat.node_tree
    nd, l = nt.nodes, nt.links
    coord = nd.new('ShaderNodeTexCoord')
    sep = nd.new('ShaderNodeSeparateXYZ')
    l.new(coord.outputs['Object'], sep.inputs['Vector'])
    at = nd.new('ShaderNodeMath')
    at.operation = 'ARCTAN2'
    l.new(sep.outputs['Y'], at.inputs[0])
    l.new(sep.outputs['X'], at.inputs[1])
    a = nd.new('ShaderNodeMath')
    a.operation = 'MULTIPLY'
    l.new(at.outputs[0], a.inputs[0])
    a.inputs[1].default_value = n / (2 * math.pi)
    b = nd.new('ShaderNodeMath')
    b.operation = 'MULTIPLY'
    l.new(sep.outputs['Z'], b.inputs[0])
    b.inputs[1].default_value = twist / S
    c = nd.new('ShaderNodeMath')
    c.operation = 'ADD'
    l.new(a.outputs[0], c.inputs[0])
    l.new(b.outputs[0], c.inputs[1])
    f = nd.new('ShaderNodeMath')
    f.operation = 'FRACT'
    l.new(c.outputs[0], f.inputs[0])
    ramp = nd.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].color = lin(c1)
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = lin(c2)
    l.new(f.outputs[0], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], nd['Principled BSDF'].inputs['Base Color'])
    return mat


S = 0.0185              # metres to the tile's units
FY = -0.05              # the church's front on the tile, before the turn
Z0 = G + 0.03

M['tent'] = banded(material('tentTiles', '#3e8a6a', 0.4, vary='#d8b84a', vary_scale=60, coat=0.3), 'Z', 900.0, strength=0.5)
DOMES = {'blueWhite': spiral('domeBlueWhite', '#2f62a8', '#f2efe6'), 'greenYellow': spiral('domeGreenYellow', '#2f8a5a', '#e8c43c'),
         'goldGreen': spiral('domeGoldGreen', '#d9ab3a', '#3a7d52', n=10, twist=-0.7), 'blueWhite2': spiral('domeBlueWhite2', '#3a73b8', '#f2efe6', n=10, twist=-0.8)}


def P(x, y, z):
    return Vector((x * S, FY + y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def onion(name, mat, x, y, z0, r, h, cross=True):
    """An onion dome made at its own origin (so its stripes wind round it) and set at (x, y, z0)."""
    ob = lathe(name, mat, [(rr * S, zz * S) for rr, zz in ((r * 0.82, 0.0), (r * 1.08, h * 0.22), (r * 1.0, h * 0.42), (r * 0.55, h * 0.72), (r * 0.16, h * 0.92), (r * 0.08, h))], (0, 0, 0), segs=32, smooth=True)
    ob.matrix_world = Matrix.Translation(P(x, y, z0))
    if cross:
        c = P(x, y, z0 + h - 0.2)
        cylinder(name + 'Cross', M['gold'], 0.14 * S, 3.2 * S, (c.x, c.y, c.z), segs=6)
        box(name + 'CrossArm', M['gold'], Vector((c.x, c.y, c.z + 2.2 * S)), (1.6 * S, 0.2 * S, 0.2 * S), bevel=0)


# ------------------------------------------------------------------ the canal, its embankments, railings and footbridge
CANAL_END = FY - 13.0 * S
for name, pts in (('pavementW', [(-2.0, -2.0), (-9.0 * S, -2.0), (-9.0 * S, CANAL_END), (-2.0, CANAL_END)]), ('pavementE', [(9.0 * S, -2.0), (2.0, -2.0), (2.0, CANAL_END), (9.0 * S, CANAL_END)]),
                  ('pavementBack', [(-2.0, CANAL_END), (2.0, CANAL_END), (2.0, 2.0), (-2.0, 2.0)])):
    slab(name, M['pavingSPb'], pts, G - 0.004, Z0, margin=0.02)
slab('canal', M['canal'], [(-9.0 * S, -2.0), (9.0 * S, -2.0), (9.0 * S, FY - 13.0 * S), (-9.0 * S, FY - 13.0 * S)], G - 0.003, Z0 - 1.0 * S, margin=0.025)
for sx in (-1, 1):
    a, b = sorted((sx * 9.0 * S, sx * 10.2 * S))
    slab(f'embankment{sx}', M['granite'], [(a, -2.0), (b, -2.0), (b, FY - 12.4 * S), (a, FY - 12.4 * S)], G - 0.003, Z0 + 0.3 * S, margin=0.025)
    RAIL = bmesh.new()
    y = FY - 13.0 * S
    while y > -1.45:
        x = sx * 9.6 * S
        if math.hypot(x, y) < 1.42:
            bmesh.ops.create_cube(RAIL, size=1.0, matrix=Matrix.Translation((x, y, Z0 + 1.0 * S)) @ Matrix.Diagonal((0.15 * S, 0.15 * S, 1.6 * S, 1)))
        y -= 2.0 * S
    finish(f'railPosts{sx}', RAIL, M['railing'], smooth_sides=False)
    y0 = FY - 13.0 * S
    y1 = -math.sqrt(max(0.0, 1.42 ** 2 - (9.6 * S) ** 2))
    box(f'railTop{sx}', M['railing'], Vector((sx * 9.6 * S, (y0 + y1) / 2, Z0 + 1.8 * S)), (0.2 * S, y0 - y1, 0.2 * S), bevel=0)
BY = -44.0
deck = lambda x: 1.4 * math.cos(math.pi * x / 26.0)
prof = [(-13.0, -0.2)] + [(x, deck(x)) for x in [-13.0 + 26.0 * k / 16 for k in range(17)]] + [(13.0, -0.2)]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new(P(x, BY - 2.0, z)) for x, z in prof], [bm_.verts.new(P(x, BY + 2.0, z)) for x, z in prof])
finish('footbridge', bm_, M['railing'], smooth_sides=False)
for yy in (BY - 2.0, BY + 1.85):
    tube(f'bridgeRail{yy}', M['railing'], [P(x, yy, deck(x) + 1.1) for x in [-13.0 + 26.0 * k / 16 for k in range(17)]], 0.12 * S)

# ------------------------------------------------------------------ the church: its body and white trim, kokoshnik gables, apses
block('body', M['brickSPb'], -14.0, 14.0, 0.0, 30.0, -0.3, 22.0)
for z0, z1 in ((6.0, 6.8), (14.0, 14.8), (21.4, 22.6)):
    block(f'trim{z0}', M['whiteSPb'], -14.4, 14.4, -0.4, 30.4, z0, z1)
for sx in (-1, 1):
    for sy in (0.0, 30.0):
        block(f'corner{sx}{sy}', M['whiteSPb'], sx * 14.0 - 0.6, sx * 14.0 + 0.6, sy - 0.6, sy + 0.6, -0.3, 22.0)
KOKO = []
for side, (nx, ny, cx, cy, run) in enumerate(((0, -1, 0.0, -0.05, 'x'), (-1, 0, -14.05, 15.0, 'y'), (1, 0, 14.05, 15.0, 'y'))):
    for u in (-9.0, 0.0, 9.0):
        x, y = (cx + u, cy) if run == 'x' else (cx, cy + u)
        m = Matrix.Translation(P(x, y, 22.4)) @ Matrix.Rotation(math.atan2(-nx, ny) if run == 'y' else 0.0, 4, 'Z')
        bm_ = bmesh.new()
        arc = [(-4.2, 0.0)] + [(-4.2 * math.cos(math.pi * k / 12), 4.2 * math.sin(math.pi * k / 12)) for k in range(1, 12)] + [(4.2, 0.0)]
        add_prism(bm_, [bm_.verts.new(m @ Vector((u_ * S, -0.6 * S, z_ * S))) for u_, z_ in arc], [bm_.verts.new(m @ Vector((u_ * S, 0.6 * S, z_ * S))) for u_, z_ in arc])
        finish(f'kokoshnik{side}{u}', bm_, M['whiteSPb'], smooth_sides=False)
        p = P(x + nx * 0.7, y + ny * 0.7, 0)
        KOKO.append((p.x, p.y, Z0 + 22.6 * S, 6.2 * S, 3.6 * S, (nx, ny), 'round'))
glazed('kokoshnikMosaics', KOKO, M['whiteSPb'], glass=M['mosaicSPb'], depth=0.3 * S)
WIN = []
for nx, ny, cx, cy, run in ((0, -1, 0.0, -0.05, 'x'), (-1, 0, -14.05, 15.0, 'y')):
    for u in (-9.0, 0.0, 9.0):
        x, y = (cx + u, cy) if run == 'x' else (cx, cy + u)
        p = P(x, y, 0)
        WIN.append((p.x, p.y, Z0 + 8.4 * S, 2.4 * S, 5.0 * S, (nx, ny), 'round'))
        WIN.append((p.x, p.y, Z0 + 15.8 * S, 1.8 * S, 4.0 * S, (nx, ny), 'round'))
glazed('windows', WIN, M['whiteSPb'], depth=0.3 * S)
for k, x in enumerate((-8.5, 0.0, 8.5)):
    lathe(f'apse{k}', M['brickSPb'], [(4.6 * S, 0.0), (4.6 * S, 17.0 * S)], P(x, 30.0, -0.3), segs=24)
    onion(f'apseDome{k}', M['gold'], x, 30.0, 16.6, 3.0, 7.0)

# ------------------------------------------------------------------ the tented spire over the middle and the four striped onions round it
cylinder('tentDrum', M['brickSPb'], 7.4 * S, 15.5 * S, P(0.0, 15.0, 21.9), segs=8)
annulus('tentDrumTrim', M['whiteSPb'], 7.9 * S, 7.0 * S, Z0 + 36.8 * S, Z0 + 37.7 * S, segs=8, center=(0.0, FY + 15.0 * S))
lathe('tent', M['tent'], [(r * S, z * S) for r, z in ((7.6, 0.0), (6.9, 2.0), (1.4, 30.0), (1.1, 31.0))], P(0.0, 15.0, 37.4), segs=8)
onion('tentOnion', M['gold'], 0.0, 15.0, 68.0, 2.0, 6.0)
for name, (x, y) in zip(('blueWhite', 'greenYellow', 'goldGreen', 'blueWhite2'), ((-9.5, 4.5), (9.5, 4.5), (-9.5, 25.5), (9.5, 25.5))):
    cylinder(f'{name}Drum', M['brickSPb'], 3.4 * S, 9.0 * S, P(x, y, 21.9), segs=24)
    annulus(f'{name}DrumTrim', M['whiteSPb'], 3.8 * S, 3.2 * S, Z0 + 30.2 * S, Z0 + 31.0 * S, segs=24, center=(x * S, FY + y * S))
    onion(f'{name}Dome', DOMES[name], x, y, 30.8, 4.6, 10.5)

# ------------------------------------------------------------------ the bell tower at the canal's end, under its gilded dome
block('bellTower', M['brickSPb'], -5.6, 5.6, -12.0, 0.2, -0.3, 40.0)
for z0, z1 in ((9.0, 9.8), (20.0, 20.8), (30.0, 30.8), (39.4, 40.6)):
    block(f'bellTrim{z0}', M['whiteSPb'], -6.0, 6.0, -12.4, 0.4, z0, z1)
c = P(0.0, -12.05, 0)
glazed('bellPanel', [(c.x, c.y, Z0 + 11.0 * S, 6.6 * S, 8.0 * S, (0, -1), 'round')], M['whiteSPb'], glass=M['mosaicSPb'], depth=0.3 * S)
glazed('bellOpening', [(c.x, c.y, Z0 + 31.5 * S, 3.4 * S, 6.6 * S, (0, -1), 'round')], M['whiteSPb'], glass=M['bronze'], depth=0.3 * S)
onion('bellDome', M['gold'], 0.0, -6.0, 40.4, 4.6, 10.0)

for k, (x, y, shirt) in enumerate(((-13.0, -18.0, 'red'), (-12.5, -32.0, 'blue'), (13.0, -22.0, 'yellow'), (12.5, -36.0, 'green'), (-2.0, -44.0, 'red'), (4.0, -43.5, 'blue'))):
    c = P(x, y, deck(x) if abs(y - BY) < 2.5 else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.75)
m = Matrix.Translation(P(0.0, -28.0, -1.0)) @ Matrix.Rotation(math.pi / 2, 4, 'Z')
box_m('tourBoat', M['white'], m @ Matrix.Translation((0, 0, 0.6 * S)), (18.0 * S, 5.4 * S, 1.6 * S), bevel=0.002)
box_m('tourBoatGlass', M['window'], m @ Matrix.Translation((0, 0, 2.0 * S)), (14.0 * S, 4.6 * S, 1.6 * S), bevel=0.002)

M['gardenTrees'] = material('mikhailovskyTrees', '#4b6e38', 0.85, vary='#587b41', vary_scale=16, bump=0.3, bump_scale=90)
trees = []
for k in range(5000):
    x, y = rng.uniform(-1.5, 1.5), rng.uniform(-1.5, 1.5)
    if math.hypot(x, y) > 1.4 or rng.random() > 0.4:
        continue
    behind = y > FY + 40.0 * S
    beside = x > 20.0 * S and y > FY - 14.0 * S
    if not (behind or beside) or (abs(x) < 16.0 * S and y < FY + 44.0 * S):
        continue
    r = rng.uniform(0.024, 0.036)
    trees.append(((x, y, Z0 + r * 1.1), r, 1.0))
blob_cloud('mikhailovskyGarden', M['gardenTrees'], trees)
R = Matrix.Rotation(math.radians(-32.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('saint-petersburg')
