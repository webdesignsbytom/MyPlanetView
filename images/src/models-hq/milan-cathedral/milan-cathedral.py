# Milan Cathedral in the high-quality look (hq.py), laid out in metres as it stands: the Duomo's front
# of pink-white Candoglia marble, its six buttresses rising into spires, the stepped gable with its
# little pinnacles, five bronze portals under their pediments, the great Gothic windows; behind it the
# five aisles stepping up to the nave, every buttress crowned with a pinnacle and a statue (the forest of
# spires), the flying buttresses between them, the tall traceried windows, the transept, the choir and
# its polygonal apse, the marble roofs; the octagonal tiburio over the crossing and the main spire with
# the gilded Virgin on top (a scanned Madonna, UBICA.srl, CC BY 4.0, in _sources/, gilded on the spire
# and in white marble on every pinnacle); the Piazza del Duomo's paving, lamps and people.
# Run: blender -b --factory-startup -P milan-cathedral.py -- milan-cathedral-1024.png 1024 milan-cathedral.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1386)
S = 0.0135              # metres to the tile's units
FY = -0.85              # the front's place on the tile


def P(x, y, z):
    """A point x metres across the cathedral, y metres in from its front, z above the piazza."""
    return Vector((x * S, FY + y * S, G + z * S))


def T(x, y):
    return (x * S, FY + y * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def ribbed(name, base, rib, period, width=0.18):
    """Marble walls run with thin upright ribs of `rib` every `period` metres, on any face along x or y
    (the blind tracery the Duomo is covered in)."""
    mat = material(name, base, 0.55, vary=None, bump=0.06, bump_scale=160)
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    coord = n.new('ShaderNodeTexCoord')
    sep = n.new('ShaderNodeSeparateXYZ')
    l.new(coord.outputs['Object'], sep.inputs['Vector'])
    add = n.new('ShaderNodeMath')
    add.operation = 'ADD'
    l.new(sep.outputs['X'], add.inputs[0])
    l.new(sep.outputs['Y'], add.inputs[1])
    mul = n.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    l.new(add.outputs[0], mul.inputs[0])
    mul.inputs[1].default_value = 1.0 / (period * S)
    fr = n.new('ShaderNodeMath')
    fr.operation = 'FRACT'
    l.new(mul.outputs[0], fr.inputs[0])
    lt = n.new('ShaderNodeMath')
    lt.operation = 'LESS_THAN'
    l.new(fr.outputs[0], lt.inputs[0])
    lt.inputs[1].default_value = width
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].color = lin(base)
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = lin(rib)
    l.new(lt.outputs[0], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], n['Principled BSDF'].inputs['Base Color'])
    return mat


M['candoglia'] = ribbed('candoglia', '#f0e5dc', '#ddd0c6', 1.4)
M['candogliaPlain'] = material('candogliaPlain', '#efe4db', 0.5, vary='#e6d8ce', vary_scale=18, bump=0.06, bump_scale=160)
M['candogliaShade'] = material('candogliaShade', '#ddd0c5', 0.55, vary='#d2c4b8', vary_scale=18, bump=0.06, bump_scale=160)
M['roofMarble'] = material('roofMarble', '#e2d9d0', 0.6, vary='#d6ccc2', vary_scale=30, bump=0.08, bump_scale=200)
M['statueMarble'] = material('statueMarble', '#e8e3dc', 0.5, vary='#d9d3cb', vary_scale=40)
M['piazzaPaving'] = masonry('piazzaDuomo', '#9a948c', '#cfc8bd', scale=36, rough=0.8, vary='#8f8980')
M['lampIron'] = material('lampIron', '#2a2b2e', 0.45, metallic=0.5)

# ------------------------------------------------------------------ the Piazza del Duomo
slab('piazza', M['piazzaPaving'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, G + 0.004, margin=0.03)
for k, x in enumerate(range(-90, 91, 15)):
    slab(f'lineNS{k}', M['candogliaPlain'], [T(x - 0.4, -80.0), T(x + 0.4, -80.0), T(x + 0.4, -3.0), T(x - 0.4, -3.0)], G + 0.003, G + 0.0045, margin=0.04)
for k, y in enumerate(range(-63, -2, 15)):
    slab(f'lineEW{k}', M['candogliaPlain'], [T(-100.0, y - 0.4), T(100.0, y - 0.4), T(100.0, y + 0.4), T(-100.0, y + 0.4)], G + 0.003, G + 0.0045, margin=0.04)
for k, (x, y) in enumerate(((-40.0, -12.0), (40.0, -12.0), (-25.0, -35.0), (25.0, -35.0), (-52.0, 5.0), (52.0, 5.0))):
    c = P(x, y, 0)
    cylinder(f'lampPost{k}', M['lampIron'], 0.15 * S, 6.0 * S, (c.x, c.y, G), segs=8)
    lathe(f'lamp{k}', M['white'], [(0.0, 0.0), (0.45 * S, 0.3 * S), (0.4 * S, 1.1 * S), (0.0, 1.4 * S)], (c.x, c.y, G + 6.0 * S), segs=10, smooth=True)

# ------------------------------------------------------------------ the body: five aisles stepping up to the nave, the transept, the choir and the apse
OUTER, INNER, NAVE = 24.0, 34.0, 46.0          # the heights of the outer aisles, the inner aisles and the nave
for sx in (-1, 1):
    for name, y0, y1 in (('body', 3.0, 92.0), ('choir', 120.0, 145.0)):
        xa, xb = sorted((sx * 29.5, sx * 19.9))
        block(f'{name}Outer{sx}', M['candoglia'], xa, xb, y0, y1, -0.05, OUTER)
        xa, xb = sorted((sx * 20.0, sx * 7.9))
        block(f'{name}Inner{sx}', M['candoglia'], xa, xb, y0, y1, -0.05, INNER)
block('nave', M['candoglia'], -8.0, 8.0, 3.0, 99.5, -0.05, NAVE)
block('choirNave', M['candoglia'], -8.0, 8.0, 112.5, 145.0, -0.05, NAVE)
block('transept', M['candoglia'], -46.0, 46.0, 92.0, 120.0, -0.05, INNER - 0.1)
block('transeptNave', M['candoglia'], -45.9, 45.9, 99.0, 113.0, -0.05, NAVE + 0.1)
apse = [(-29.5, 145.0), (-29.5, 150.5), (-18.0, 158.0), (18.0, 158.0), (29.5, 150.5), (29.5, 145.0)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, y, -0.05)) for x, y in apse], [bm.verts.new(P(x, y, INNER - 0.05)) for x, y in apse])
finish('apse', bm, M['candoglia'], smooth_sides=False)
inner_apse = [(-8.0, 144.9), (-8.0, 150.0), (0.0, 155.0), (8.0, 150.0), (8.0, 144.9)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, y, INNER - 0.1)) for x, y in inner_apse], [bm.verts.new(P(x, y, NAVE - 0.05)) for x, y in inner_apse])
finish('innerApse', bm, M['candoglia'], smooth_sides=False)
# the marble roofs: low pitched over the nave, the transept and the choir
gable_roof('naveRoof', M['roofMarble'], -8.0 * S, 8.0 * S, FY + 3.0 * S, FY + 106.0 * S, G + NAVE * S, 4.5 * S, over=0.0, along='y')
gable_roof('choirRoof', M['roofMarble'], -8.0 * S, 8.0 * S, FY + 106.0 * S, FY + 145.0 * S, G + NAVE * S, 4.5 * S, over=0.0, along='y')
gable_roof('transeptRoof', M['roofMarble'], -45.9 * S, 45.9 * S, FY + 99.0 * S, FY + 113.0 * S, G + (NAVE + 0.1) * S, 4.4 * S, over=0.0, along='x')

# ------------------------------------------------------------------ the windows: tall traceried ones down the outer walls, the clerestories above
WIN = []
BAYS = [3.0 + 8.9 * k for k in range(11)]
for sx in (-1, 1):
    for y0, y1 in zip(BAYS, BAYS[1:]):
        ym = (y0 + y1) / 2
        WIN.append((sx * 29.55 * S, FY + ym * S, G + 6.0 * S, 4.4 * S, 14.0 * S, (sx, 0), 'pointed'))
        WIN.append((sx * 20.05 * S, FY + ym * S, G + (OUTER + 1.8) * S, 3.6 * S, 6.6 * S, (sx, 0), 'pointed'))
        WIN.append((sx * 8.05 * S, FY + ym * S, G + (INNER + 2.0) * S, 3.4 * S, 8.0 * S, (sx, 0), 'pointed'))
    for x0 in (30.0, 38.5):
        WIN.append((sx * (x0 + 3.2) * S, FY + 91.95 * S, G + 6.0 * S, 4.4 * S, 14.0 * S, (0, -1), 'pointed'))
    WIN.append((sx * 46.05 * S, FY + 106.0 * S, G + 8.0 * S, 7.0 * S, 24.0 * S, (sx, 0), 'pointed'))
    for ym in (124.5, 133.5, 141.0):
        WIN.append((sx * 29.55 * S, FY + ym * S, G + 6.0 * S, 4.4 * S, 14.0 * S, (sx, 0), 'pointed'))

# ------------------------------------------------------------------ the front: its stepped gable, buttresses, portals and windows
front = [(-34.0, -0.05), (34.0, -0.05), (34.0, 34.0), (20.0, 40.0), (8.0, 46.0), (0.0, 56.5), (-8.0, 46.0), (-20.0, 40.0), (-34.0, 34.0)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, 0.0, z)) for x, z in front], [bm.verts.new(P(x, 3.2, z)) for x, z in front])
finish('front', bm, M['candoglia'], smooth_sides=False)
SPIKES = bmesh.new()
for (xa, za), (xb, zb) in zip(front[2:], front[3:]):
    n = max(1, int(math.hypot(xb - xa, zb - za) / 2.2))
    for k in range(1, n):
        t = k / n
        c = P(xa + (xb - xa) * t, 1.6, za + (zb - za) * t)
        bmesh.ops.create_cone(SPIKES, cap_ends=True, segments=6, radius1=0.45 * S, radius2=0.0, depth=2.6 * S, matrix=Matrix.Translation(c + Vector((0, 0, 1.2 * S))))
DOORS, FRAMES = [], []
for x, w, h in ((0.0, 5.6, 11.0), (-14.0, 4.0, 8.4), (14.0, 4.0, 8.4), (-27.0, 3.6, 7.6), (27.0, 3.6, 7.6)):
    c = P(x, -0.05, 0)
    DOORS.append((c.x, c.y, G - 0.05 * S, w * S, h * S, (0, -1), 'rect'))
    bm = bmesh.new()
    tri = [(x - w / 2 - 1.4, h + 0.9), (x + w / 2 + 1.4, h + 0.9), (x, h + 3.2)]
    add_prism(bm, [bm.verts.new(P(u, -0.7, z)) for u, z in tri], [bm.verts.new(P(u, 0.3, z)) for u, z in tri])
    finish(f'pediment{x}', bm, M['candogliaPlain'], smooth_sides=False)
    block(f'lintel{x}', M['candogliaPlain'], x - w / 2 - 1.4, x + w / 2 + 1.4, -0.7, 0.3, h + 0.2, h + 0.95)
    FRAMES.append((c.x, c.y, G + (h + 4.4) * S, w * 0.7 * S, 4.0 * S, (0, -1), 'rect'))
glazed('portals', DOORS, M['candogliaPlain'], glass=M['bronze'], depth=0.5 * S)
glazed('baroqueWindows', FRAMES, M['candogliaPlain'], depth=0.4 * S)
GOTHIC = [(P(0.0, -0.05, 0), 24.0, 7.6, 17.0), (P(-14.0, -0.05, 0), 22.0, 4.6, 12.0), (P(14.0, -0.05, 0), 22.0, 4.6, 12.0), (P(-27.0, -0.05, 0), 18.5, 3.6, 10.0), (P(27.0, -0.05, 0), 18.5, 3.6, 10.0)]
glazed('frontWindows', [(c.x, c.y, G + z * S, w * S, h * S, (0, -1), 'pointed') for c, z, w, h in GOTHIC], M['candogliaPlain'], depth=0.4 * S)
glazed('sideWindows', WIN, M['candogliaShade'], depth=0.3 * S)

# ------------------------------------------------------------------ the forest of spires: a pier, a pinnacle and a statue on every buttress
PIERS, PINNACLES, FLYERS, STATUES = bmesh.new(), bmesh.new(), [], []


def spire_on(x, y, z0, z1, w=2.0, pin=8.0, r=0.95):
    """A buttress pier from z0 to z1 (metres), its octagonal pinnacle and the statue on top."""
    bmesh.ops.create_cube(PIERS, size=1.0, matrix=Matrix.Translation(P(x, y, (z0 + z1) / 2)) @ Matrix.Diagonal((w * S, w * S, (z1 - z0) * S, 1)))
    bmesh.ops.create_cone(PINNACLES, cap_ends=True, segments=8, radius1=r * S, radius2=0.18 * S, depth=pin * S, matrix=Matrix.Translation(P(x, y, z1 + pin / 2 - 0.05)))
    STATUES.append((P(x, y, z1 + pin - 0.1), 2.6))


for sx in (-1, 1):
    for y in BAYS:
        spire_on(sx * 30.3, y, -0.05, 32.0, w=2.2, pin=8.5)
        spire_on(sx * 21.0, y, OUTER - 0.1, 40.0, w=1.8, pin=8.0, r=0.85)
        spire_on(sx * 9.0, y, INNER - 0.1, 50.0, w=1.6, pin=7.5, r=0.8)
        FLYERS.append((P(sx * 30.3, y, 28.0), P(sx * 20.0, y, 31.5)))
        FLYERS.append((P(sx * 21.0, y, 37.0), P(sx * 8.0, y, 43.0)))
    for y in (120.0, 128.5, 137.0, 145.0):
        spire_on(sx * 30.3, y, -0.05, 32.0, w=2.2, pin=8.5)
        spire_on(sx * 21.0, y, OUTER - 0.1, 40.0, w=1.8, pin=8.0, r=0.85)
    for x in (38.0, 46.0):
        for y in (92.0, 120.0):
            spire_on(sx * x, y, -0.05, 38.0, w=2.2, pin=8.5)
for x, y in ((-18.0, 158.0), (18.0, 158.0), (-24.0, 154.5), (24.0, 154.5)):
    spire_on(x, y, -0.05, 32.0, w=2.2, pin=8.5)
# the front's six buttresses, standing out from it and rising highest
for x, top in ((-33.0, 44.0), (33.0, 44.0), (-20.5, 50.0), (20.5, 50.0), (-8.0, 58.0), (8.0, 58.0)):
    block(f'frontButtress{x}', M['candogliaPlain'], x - 1.3, x + 1.3, -2.2, 1.0, -0.05, top, bevel=0.0005)
    bmesh.ops.create_cone(PINNACLES, cap_ends=True, segments=8, radius1=1.25 * S, radius2=0.2 * S, depth=10.0 * S, matrix=Matrix.Translation(P(x, -0.6, top + 4.95)))
    STATUES.append((P(x, -0.6, top + 9.9), 3.0))
    for z in (14.0, 24.0, 34.0):
        if z < top - 6.0:
            block(f'corbel{x}{z}', M['candogliaShade'], x - 0.8, x + 0.8, -3.0, -2.15, z - 0.4, z)
            STATUES.append((P(x, -2.55, z), 2.8))
finish('gableSpikes', SPIKES, M['candogliaShade'], smooth_sides=False)
for k, (a, b) in enumerate(FLYERS):
    bar(f'flyingButtress{k}', M['candogliaPlain'], a, b, 0.7 * S)

# ------------------------------------------------------------------ the tiburio over the crossing and the main spire
CX, CY = 0.0, 106.0
c = P(CX, CY, 0)
lathe('tiburio', M['candoglia'], [(r * S, z * S) for r, z in ((10.5, 0.0), (10.5, 12.0), (9.0, 12.0), (9.0, 20.5), (8.2, 20.5), (8.2, 21.5))], (0, 0, 0), segs=8,
      matrix=Matrix.Translation(P(CX, CY, NAVE - 0.2)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
TIBURIO_WIN = []
for k in range(8):
    a = math.pi / 8 + 2 * math.pi * k / 8 + math.pi / 8
    n = Vector((math.cos(a), math.sin(a), 0))
    p = c + n * 10.5 * math.cos(math.pi / 8) * S * 1.002
    TIBURIO_WIN.append((p.x, p.y, G + (NAVE + 2.0) * S, 3.4 * S, 8.0 * S, (n.x, n.y), 'pointed'))
glazed('tiburioWindows', TIBURIO_WIN, M['candogliaShade'], depth=0.3 * S)
for sx in (-1, 1):
    for sy in (-1, 1):
        spire_on(CX + sx * 9.5, CY + sy * 9.5, INNER - 0.2, 66.0, w=1.8, pin=9.0, r=0.9)
finish('piers', PIERS, M['candogliaPlain'], smooth_sides=False)
finish('pinnacles', PINNACLES, M['candogliaShade'], smooth_sides=False)
lathe('mainSpire', M['candogliaShade'], [(r * S, z * S) for r, z in ((4.2, 0.0), (3.7, 9.0), (3.9, 9.6), (2.6, 21.0), (2.8, 21.6), (1.3, 31.0), (0.55, 37.5), (0.0, 38.2))],
      (0, 0, 0), segs=8, matrix=Matrix.Translation(P(CX, CY, NAVE + 20.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))


# ------------------------------------------------------------------ the statues: the gilded Virgin on the main spire, a marble saint on every pinnacle
def statue_mesh(cut, height):
    """The scanned Madonna cut from her rock, stood `height` tile units tall at the origin, thinned to a
    light mesh shared by every copy."""
    src = import_model('madonnina', 'madonninaSource')
    stand_sourced(src, cut=cut, turn=0.0, height=height, z=0.0, mat=None, report=False)
    mod = src.modifiers.new('decimate', 'DECIMATE')
    mod.ratio = min(1.0, 8000.0 / len(src.data.polygons))
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(src.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(src, do_unlink=True)
    me.materials.clear()
    for p in me.polygons:
        p.material_index = 0
        p.use_smooth = True
    return me


saint = statue_mesh(0.34, 1.0)
saint.materials.append(M['statueMarble'])
for k, (p, h) in enumerate(STATUES):
    ob = bpy.data.objects.new(f'saint{k}', saint)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(p) @ Matrix.Scale(h * S, 4)
virgin = statue_mesh(0.34, 1.0)
virgin.materials.append(M['gold'])
ob = bpy.data.objects.new('madonnina', virgin)
bpy.context.scene.collection.objects.link(ob)
ob.matrix_world = Matrix.Translation(P(CX, CY, NAVE + 20.0 + 38.0)) @ Matrix.Scale(4.2 * S, 4)

for k, (x, y, shirt) in enumerate(((-12.0, -20.0, 'red'), (6.0, -14.0, 'blue'), (-30.0, -32.0, 'yellow'), (25.0, -28.0, 'green'), (0.0, -38.0, 'red'), (40.0, -22.0, 'blue'),
                                   (-50.0, -15.0, 'green'), (15.0, -40.0, 'yellow'), (-8.0, -8.0, 'blue'), (52.0, 10.0, 'red'), (-55.0, 30.0, 'yellow'))):
    person(f'p{k}', *T(x, y), rng.random() * 6, shirt, z=G + 0.004, scale=0.6)

render('milan-cathedral')
