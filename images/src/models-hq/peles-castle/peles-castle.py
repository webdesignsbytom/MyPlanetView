# Peleș Castle in the high-quality look (hq.py), laid out in metres and turned to face the camera: the
# royal castle in the Carpathian forest, its stone ground floor and half-timbered upper storeys (white
# plaster between dark timbers), its steep slate roofs and dormers, the tall main tower over the front,
# stone then timber then a clock stage, narrowing to its pointed spire, the round tower and the corner
# turrets under their own spires; the terrace in front with its balustrade, stairs, fountain and statues
# (a scanned statue, UBICA.srl, CC BY 4.0, in _sources/, in white marble); the fir forest on the hills
# round it; people.
# Run: blender -b --factory-startup -P peles-castle.py -- peles-castle-1024.png 1024 peles-castle.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1883)
S = 0.0175              # metres to the tile's units
TURN = math.radians(-32.0)
FY = -0.2               # the castle's front on the tile, before the turn


def timbered(name, plaster, timber, cell=1.7):
    """Half-timbering: dark posts, rails and braces over white plaster, on any face along x or y."""
    mat = material(name, plaster, 0.75, bump=0.06, bump_scale=200)
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    coord = n.new('ShaderNodeTexCoord')
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(coord.outputs['Object'], sep.inputs['Vector'])

    def op(kind, a, b):
        m = n.new('ShaderNodeMath')
        m.operation = kind
        for k, v in enumerate((a, b)):
            if isinstance(v, float):
                m.inputs[k].default_value = v
            else:
                l.new(v, m.inputs[k])
        return m.outputs[0]

    u = op('ADD', sep.outputs['X'], sep.outputs['Y'])
    posts = op('LESS_THAN', op('FRACT', op('MULTIPLY', u, 1.0 / (cell * S)), 0.0), 0.12)
    rails = op('LESS_THAN', op('FRACT', op('MULTIPLY', sep.outputs['Z'], 1.0 / (cell * 1.7 * S)), 0.0), 0.1)
    braces = op('LESS_THAN', op('FRACT', op('MULTIPLY', op('ADD', u, op('MULTIPLY', sep.outputs['Z'], 1.1)), 1.0 / (cell * 2.0 * S)), 0.0), 0.07)
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].color = lin(plaster)
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = lin(timber)
    l.new(op('MAXIMUM', op('MAXIMUM', posts, rails), braces), ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], n['Principled BSDF'].inputs['Base Color'])
    return mat


M['timber'] = timbered('pelesTimber', '#f1ebdc', '#4a3426')
M['stoneP'] = masonry('pelesStone', '#b9ad96', '#8f8571', scale=140, rough=0.85, vary='#aba08a')
M['slateP'] = banded(material('pelesSlate', '#3d4a49', 0.5, vary='#354140', vary_scale=14, metallic=0.25), 'Z', 380.0, strength=0.2)
M['terraceP'] = masonry('pelesTerrace', '#cfc6b3', '#a79e8b', scale=110, rough=0.85, vary='#c3baa6')
M['lawnP'] = material('pelesLawn', '#6a9640', 0.85, vary='#5e8a39', vary_scale=14, bump=0.2, bump_scale=200)
M['fir'] = material('carpathianFir', '#2c4a2c', 0.85, vary='#365634', vary_scale=16, bump=0.3, bump_scale=90)
M['statueP'] = material('statueWhiteP', '#ece7df', 0.5, vary='#ddd7ce', vary_scale=40)
Z0 = G + 0.03


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def unturn(x, y):
    c, s_ = math.cos(-TURN), math.sin(-TURN)
    return x * c - y * s_, x * s_ + y * c


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.2)
    hills = 0.03 + 0.38 * smooth((y - (FY + 0.9)) / 0.6) + 0.05 * math.sin(4.0 * x + 1.0) * smooth((y - FY - 0.9) / 0.4)
    side = 0.18 * smooth((abs(x) - 0.95) / 0.4)
    return max(0.03, hills, 0.03 + side) * rim


ground = terrain('hills', lambda x, y: H(*unturn(x, y)), [M['lawnP']], lambda z, nz, x, y: 0, rings=200, segs=520)
firs = []
for p in scatter_on(ground, 24000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.42, seed=6):
    lx, ly = unturn(p.x, p.y)
    if (lx / 0.98) ** 2 + ((ly - FY - 0.12) / 0.9) ** 2 < 1.0 or (ly < FY - 0.45 and abs(lx) < 0.6):
        continue
    r = rng.uniform(0.016, 0.024)
    firs.append(((p.x, p.y, p.z + r * 1.5), r, 2.3))
blob_cloud('firForest', M['fir'], firs, subdivisions=1)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, FY + y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def spire(name, x, y, z0, r, h, segs=8, mat=None):
    lathe(name, mat or M['slateP'], [(r * S * 1.15, 0.0), (r * S * 0.95, 0.8 * S), (0.1 * S, h * S), (0.0, (h + 0.4) * S)], (0, 0, 0), segs=segs,
          matrix=Matrix.Translation(P(x, y, z0 - 0.05)) @ Matrix.Rotation(math.pi / segs, 4, 'Z'))
    lathe(name + 'Finial', M['gold'], [(0.0, 0.0), (0.4 * S, 0.4 * S), (0.0, 1.4 * S)], P(x, y, z0 + h + 0.2), segs=8, smooth=True)


# ------------------------------------------------------------------ the castle's ranges: stone below, timber above, steep slate roofs
WIN = []
RANGES = (('front', -30.0, 30.0, 0.0, 12.0, 21.0, 'x'), ('back', -30.0, 30.0, 25.0, 36.0, 20.0, 'x'), ('west', -30.0, -18.0, 11.9, 25.1, 19.0, 'y'), ('east', 18.0, 30.0, 11.9, 25.1, 19.0, 'y'))
for name, x0, x1, y0, y1, h, way in RANGES:
    block(name + 'Stone', M['stoneP'], x0, x1, y0, y1, -0.3, 8.0)
    block(name + 'Timber', M['timber'], x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, 7.95, h)
    if way == 'x':
        gable_roof(name + 'Roof', M['slateP'], x0 * S, x1 * S, FY + y0 * S, FY + y1 * S, Z0 + (h - 0.05) * S, 10.0 * S, over=0.003)
    else:
        gable_roof(name + 'Roof', M['slateP'], x0 * S, x1 * S, FY + 6.0 * S, FY + 30.5 * S, Z0 + (h - 0.1) * S, 9.0 * S, over=0.003, along='y')
for x in [-27.0 + 4.5 * k for k in range(13)]:
    if abs(x) < 6.0:
        continue
    c = P(x, -0.05, 0)
    WIN.append((c.x, c.y, Z0 + 2.4 * S, 1.6 * S, 3.0 * S, (0, -1), 'round'))
    WIN.append((c.x, c.y, Z0 + 10.0 * S, 1.6 * S, 2.6 * S, (0, -1), 'rect'))
    WIN.append((c.x, c.y, Z0 + 15.4 * S, 1.4 * S, 2.2 * S, (0, -1), 'rect'))
for k, x in enumerate((-22.0, -12.0, 12.0, 22.0)):
    block(f'dormer{k}', M['timber'], x - 2.0, x + 2.0, 1.5, 4.5, 20.5, 25.0)
    gable_roof(f'dormerRoof{k}', M['slateP'], (x - 2.4) * S, (x + 2.4) * S, FY + 1.0 * S, FY + 5.0 * S, Z0 + 24.95 * S, 2.6 * S, over=0.001, along='y')
    c = P(x, 1.45, 0)
    WIN.append((c.x, c.y, Z0 + 21.4 * S, 1.6 * S, 2.4 * S, (0, -1), 'rect'))

# ------------------------------------------------------------------ the main tower over the front, the round tower, the corner turrets
TX, TY = 0.0, -1.0
block('towerStone', M['stoneP'], TX - 5.0, TX + 5.0, TY - 5.0, TY + 5.0, -0.3, 22.0)
block('towerTimber', M['timber'], TX - 4.6, TX + 4.6, TY - 4.6, TY + 4.6, 21.95, 36.0)
block('towerBelfry', M['stoneP'], TX - 5.0, TX + 5.0, TY - 5.0, TY + 5.0, 35.95, 44.0)
for nx, ny in ((0, -1), (-1, 0)):
    c = P(TX + nx * 5.05, TY + ny * 5.05, 0)
    WIN.append((c.x, c.y, Z0 + 37.0 * S, 2.0 * S, 4.4 * S, (nx, ny), 'round'))
    WIN.append((c.x, c.y, Z0 + 14.0 * S, 1.8 * S, 4.0 * S, (nx, ny), 'round'))
cylinder('clock', M['white'], 1.6 * S, 0.3 * S, (0, 0, 0), segs=20, matrix=Matrix.Translation(P(TX, TY - 4.7, 30.0)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
annulus('clockRing', M['gold'], 1.8 * S, 1.5 * S, -0.2 * S, 0.2 * S, segs=20, matrix=Matrix.Translation(P(TX, TY - 4.75, 30.0)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
spire('mainSpire', TX, TY, 44.0, 6.4, 22.0)
for sx in (-1, 1):
    for sy in (-1, 1):
        cylinder(f'towerPinnacle{sx}{sy}', M['stoneP'], 0.7 * S, 3.0 * S, P(TX + sx * 4.6, TY + sy * 4.6, 43.9), segs=8)
        spire(f'towerPinnacleSpire{sx}{sy}', TX + sx * 4.6, TY + sy * 4.6, 46.8, 0.8, 4.0)
cylinder('roundTower', M['stoneP'], 5.2 * S, 18.3 * S, P(-30.0, 2.0, -0.3), segs=28)
cylinder('roundTowerTimber', M['timber'], 5.0 * S, 12.0 * S, P(-30.0, 2.0, 17.95), segs=28)
spire('roundTowerCone', -30.0, 2.0, 29.9, 5.6, 14.0, segs=28)
for k, (x, y, z) in enumerate(((30.0, 0.0, 21.0), (30.0, 36.0, 20.0), (-30.0, 36.0, 20.0), (18.0, 12.0, 19.0))):
    cylinder(f'turret{k}', M['timber'], 2.2 * S, 6.0 * S, P(x, y, z - 3.0), segs=16)
    spire(f'turretSpire{k}', x, y, z + 2.95, 2.4, 9.0, segs=16)
glazed('windows', WIN, M['stoneP'], depth=0.3 * S)

# ------------------------------------------------------------------ the terrace: its paving, balustrade, stairs, fountain and statues
block('terrace', M['terraceP'], -36.0, 36.0, -26.0, -0.2, -0.3, 1.6, bevel=0.001)
block('balustradeW', M['terraceP'], -36.0, -5.0, -26.6, -26.0, 1.55, 2.6)
block('balustradeE', M['terraceP'], 5.0, 36.0, -26.6, -26.0, 1.55, 2.6)
for k in range(5):
    block(f'stair{k}', M['terraceP'], -5.0, 5.0, -29.0 + 0.6 * k, -26.0, -0.3, 0.32 * (k + 1))
lathe('fountain', M['terraceP'], [(r * S, z * S) for r, z in ((5.0, 0.0), (5.0, 0.8), (4.4, 0.8), (4.4, 0.4), (0.0, 0.4))], P(0.0, -14.0, 1.55), segs=32)
cylinder('fountainWater', M['water'], 4.4 * S, 0.6 * S, P(0.0, -14.0, 1.7), segs=32)
lathe('fountainBowl', M['terraceP'], [(r * S, z * S) for r, z in ((0.6, 0.0), (0.5, 2.2), (2.0, 2.6), (1.8, 3.0), (0.0, 3.0))], P(0.0, -14.0, 1.9), segs=24, smooth=True)
src = import_model('madonnina', 'statueSource')
stand_sourced(src, cut=0.34, turn=0.0, height=1.0, z=0.0, mat=M['statueP'], report=False)
src.data.polygons.foreach_set('use_smooth', [True] * len(src.data.polygons))
figure = src.data
bpy.data.objects.remove(src, do_unlink=True)
for k, x in enumerate((-30.0, -20.0, -10.0, 10.0, 20.0, 30.0)):
    block(f'pedestal{k}', M['terraceP'], x - 0.9, x + 0.9, -26.6, -24.8, 2.55, 4.0)
    ob = bpy.data.objects.new(f'statue{k}', figure)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(P(x, -25.7, 3.95)) @ Matrix.Scale(3.0 * S, 4)
for k, (x, y, shirt) in enumerate(((-14.0, -20.0, 'red'), (-6.0, -8.0, 'blue'), (8.0, -18.0, 'yellow'), (20.0, -10.0, 'green'), (27.0, -21.0, 'red'))):
    c = P(x, y, 1.6)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.75)

R = Matrix.Rotation(TURN, 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('peles-castle')
