# The Hungarian Parliament in the high-quality look (hq.py), seen across the Danube, laid out in metres:
# the long white Gothic Revival front on the river, its rows of pointed windows and pinnacles, the
# central block with its open arcade, the pavilions with their steep roofs and corner turrets, the two
# slender towers by the middle; behind it the great sixteen-sided dome with its ribs, its ring of
# pinnacles, its lantern and spire, the two chamber halls under their steep red roofs and the wings round
# the courtyards; the embankment with its lawns and road, the river, and people.
# Run: blender -b --factory-startup -P hungarian-parliament.py -- hungarian-parliament-1024.png 1024 hungarian-parliament.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1904)


def ribbed(name, base, rib, period, width=0.18):
    """Stone walls run with thin upright ribs of `rib` every `period` metres, on any face along x or y."""
    mat = material(name, base, 0.55, bump=0.06, bump_scale=160)
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


S = 0.0085              # metres to the tile's units
YF = -0.32              # the river front's line on the tile
Z0 = G + 0.002          # the Danube
ZE = G + 0.03           # the embankment

M['limestone'] = ribbed('parliamentStone', '#ece5d7', '#ddd4c3', 4.2)
M['limestonePlain'] = material('parliamentPlain', '#efe9dc', 0.55, vary='#e3dccd', vary_scale=18, bump=0.06, bump_scale=160)
M['limestoneShade'] = material('parliamentShade', '#ddd5c6', 0.6, vary='#d1c8b8', vary_scale=18, bump=0.06, bump_scale=160)
M['roofRed'] = banded(material('parliamentRoof', '#a2483a', 0.65, vary='#8f3f33', vary_scale=12, bump=0.1, bump_scale=200), 'Z', 260.0, strength=0.25)
M['domeRed'] = material('parliamentDome', '#a8503c', 0.55, vary='#954636', vary_scale=14, bump=0.08, bump_scale=200)
M['danube'] = material('danube', '#4a7d8a', 0.07, vary='#568a96', vary_scale=3, coat=0.5, bump=0.12, bump_scale=40)
M['quay'] = masonry('danubeQuay', '#a39d92', '#7a756d', scale=70, rough=0.85, vary='#968f84')
M['asphaltB'] = material('asphaltB', '#58575b', 0.8, vary='#4e4d51', vary_scale=40, bump=0.1, bump_scale=300)


def P(x, y, z):
    """A point x metres along the river front, y metres back from it, z above the embankment."""
    return Vector((x * S, YF + y * S, ZE + z * S))


def T(x, y):
    return (x * S, YF + y * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


# ------------------------------------------------------------------ the Danube, the embankment, its road and lawns
slab('danube', M['danube'], [(-2, -2), (2, -2), (2, YF - 30.0 * S), (-2, YF - 30.0 * S)], G - 0.004, Z0, margin=0.02)
slab('embankment', M['quay'], [(-2, YF - 30.0 * S), (2, YF - 30.0 * S), (2, 2), (-2, 2)], G - 0.004, ZE, bevel=0.002, margin=0.02)
slab('road', M['asphaltB'], [T(-300.0, -26.0), T(300.0, -26.0), T(300.0, -17.0), T(-300.0, -17.0)], ZE - 0.001, ZE + 0.0012, margin=0.03)
slab('lawn', M['lawn'], [T(-300.0, -14.0), T(300.0, -14.0), T(300.0, -7.0), T(-300.0, -7.0)], ZE - 0.001, ZE + 0.0015, margin=0.03)
slab('squareBehind', M['paving'], [T(-300.0, 104.0), T(300.0, 104.0), T(300.0, 200.0), T(-300.0, 200.0)], ZE - 0.001, ZE + 0.0008, margin=0.03)

# ------------------------------------------------------------------ the river front: the long wing, the central block, the pavilions
WIN = []
PINS = []
block('riverWing', M['limestone'], -122.0, 122.0, 0.0, 18.0, -0.3, 23.0)
gable_roof('riverWingRoof', M['roofRed'], -122.0 * S, 122.0 * S, YF, YF + 18.0 * S, ZE + 22.95 * S, 13.0 * S, over=0.003)
block('riverCornice', M['limestonePlain'], -122.0, 122.0, -0.5, 0.4, 22.3, 23.3)
x = -118.0
while x < 119.0:
    if abs(x) > 50.0 and abs(x) < 120.0:
        for z, h, w in ((3.0, 4.2, 1.8), (9.6, 5.0, 1.8), (16.4, 3.6, 1.6)):
            c = P(x, -0.05, 0)
            WIN.append((c.x, c.y, ZE + z * S, w * S, h * S, (0, -1), 'pointed'))
        PINS.append((x - 2.1, -0.2, 23.2, 7.0, 0.45))
    x += 4.2
block('centralBlock', M['limestone'], -34.0, 34.0, -5.0, 18.0, -0.3, 27.0)
gable_roof('centralRoof', M['roofRed'], -34.0 * S, 34.0 * S, YF - 5.0 * S, YF + 18.0 * S, ZE + 26.95 * S, 12.0 * S, over=0.003)
arcade_path('centralArcade', M['limestonePlain'], [((-24.5 + 7.0 * k) * S, YF - 5.2 * S) for k in range(8)], 2.0 * S, ZE + 4.5 * S, 3.5 * S, 2.6 * S, pointed=1.2)
for k in range(8):
    column(f'arcadeColumn{k}', M['limestonePlain'], (-24.5 + 7.0 * k) * S, YF - 4.2 * S, ZE - 0.3 * S, 4.6 * S, 0.5 * S)
for k in range(7):
    c = P(-21.0 + 7.0 * k, -5.05, 0)
    WIN.append((c.x, c.y, ZE + 10.5 * S, 3.2 * S, 12.0 * S, (0, -1), 'pointed'))
for sx in (-1, 1):
    for name, xa, xb, top in (('inner', 34.0, 48.0, 30.0), ('end', 122.0, 136.0, 30.0)):
        x0, x1 = sorted((sx * xa, sx * xb))
        block(f'{name}Pavilion{sx}', M['limestone'], x0, x1, -4.0, 22.0, -0.3, top)
        hip_roof(f'{name}PavilionRoof{sx}', M['roofRed'], (x0 + x1) / 2 * S, YF + 9.0 * S, ZE + (top - 0.05) * S, (x1 - x0) * S, 26.0 * S, 13.0 * S, over=0.003)
        for cx in (x0 + 0.6, x1 - 0.6):
            for cy in (-3.4, 21.4):
                PINS.append((cx, cy, top - 0.2, 10.0, 0.9))
        for k in range(3):
            c = P(x0 + (x1 - x0) * (k + 0.5) / 3, -4.05, 0)
            for z, h in ((3.5, 5.0), (11.5, 7.0), (20.5, 5.0)):
                WIN.append((c.x, c.y, ZE + z * S, 2.0 * S, h * S, (0, -1), 'pointed'))
    # the two slender towers by the middle
    tx = sx * 31.0
    block(f'slenderTower{sx}', M['limestonePlain'], tx - 3.0, tx + 3.0, -8.0, -2.0, -0.3, 44.0)
    lathe(f'slenderSpire{sx}', M['roofRed'], [(r * S, z * S) for r, z in ((3.9, 0.0), (3.4, 2.0), (0.3, 22.0), (0.0, 23.0))], (0, 0, 0), segs=8,
          matrix=Matrix.Translation(P(tx, -5.0, 43.95)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    for cx in (tx - 2.6, tx + 2.6):
        for cy in (-7.6, -2.4):
            PINS.append((cx, cy, 43.8, 8.0, 0.6))
    c = P(tx, -8.05, 0)
    WIN.append((c.x, c.y, ZE + 28.0 * S, 2.2 * S, 10.0 * S, (0, -1), 'pointed'))
glazed('frontWindows', WIN, M['limestonePlain'], depth=0.3 * S)

# ------------------------------------------------------------------ behind: the chamber halls, the wings round the courtyards
SIDE_WIN = []
for sx in (-1, 1):
    x0, x1 = sorted((sx * 55.0, sx * 95.0))
    for y in [24.0 + 6.0 * k for k in range(7)]:
        PINS.append((x0 + 0.5, y, 26.8, 8.0, 0.55))
        PINS.append((x1 - 0.5, y, 26.8, 8.0, 0.55))
        for xo, n in ((x0 - 0.05, -1), (x1 + 0.05, 1)):
            SIDE_WIN.append((xo * S, YF + (y + 3.0) * S, ZE + 8.0 * S, 2.4 * S, 12.0 * S, (n, 0), 'pointed'))
    block(f'chamber{sx}', M['limestone'], x0, x1, 17.9, 64.0, -0.3, 27.0)
    gable_roof(f'chamberRoof{sx}', M['roofRed'], x0 * S, x1 * S, YF + 9.0 * S, YF + 64.0 * S, ZE + 26.95 * S, 16.0 * S, over=0.003, along='y')
    for cx in (x0 + 0.8, x1 - 0.8, (x0 + x1) / 2):
        PINS.append((cx, 18.5, 27.0 if cx != (x0 + x1) / 2 else 42.0, 9.0, 0.8))
    # the wings round the courtyards: each block, and its roof's run (its ends under the roofs it meets)
    for name, a, b, c_, d, top, r0, r1, way in (('endWing', 122.0, 136.0, 21.9, 100.0, 23.0, 9.0, 93.0, 'y'), ('midWing', 95.0, 108.0, 17.9, 100.0, 23.0, 9.0, 93.0, 'y'),
                                                 ('domeWing', 20.0, 55.0, 70.0, 86.0, 25.0, 70.0, 86.0, 'x')):
        x0, x1 = sorted((sx * a, sx * b))
        block(f'{name}{sx}', M['limestone'], x0, x1, c_, d, -0.3, top)
        gable_roof(f'{name}Roof{sx}', M['roofRed'], x0 * S, x1 * S, YF + r0 * S, YF + r1 * S, ZE + (top - 0.1) * S, 9.0 * S, over=0.003, along=way)
        if name == 'endWing':
            xo = x0 if sx < 0 else x1
            for y in [26.0 + 4.2 * k for k in range(18)]:
                for z, h in ((3.0, 4.2), (9.6, 5.0), (16.4, 3.6)):
                    SIDE_WIN.append((xo * S + sx * 0.05 * S, YF + y * S, ZE + z * S, 1.8 * S, h * S, (sx, 0), 'pointed'))
                PINS.append((xo, y + 2.1, top - 0.1, 6.0, 0.4))
glazed('sideWindows', SIDE_WIN, M['limestonePlain'], depth=0.3 * S)
block('backWing', M['limestone'], -122.0, 122.0, 86.0, 100.0, -0.3, 23.0)
gable_roof('backWingRoof', M['roofRed'], -129.0 * S, 129.0 * S, YF + 86.0 * S, YF + 100.0 * S, ZE + 22.95 * S, 9.0 * S, over=0.003)

# ------------------------------------------------------------------ the dome: its sixteen-sided drum, its ribs, its pinnacles, lantern and spire
DX, DY, DR = 0.0, 46.0, 17.0
c = P(DX, DY, 0)
lathe('domeDrum', M['limestone'], [(DR * S, 0.0), (DR * S, 52.0 * S)], (0, 0, 0), segs=16, matrix=Matrix.Translation(P(DX, DY, -0.3)) @ Matrix.Rotation(math.pi / 16, 4, 'Z'))
DRUM_WIN = []
for k in range(16):
    a = 2 * math.pi * k / 16
    n = Vector((math.cos(a), math.sin(a), 0))
    p = c + n * DR * math.cos(math.pi / 16) * S * 1.002
    DRUM_WIN.append((p.x, p.y, ZE + 37.0 * S, 2.6 * S, 10.0 * S, (n.x, n.y), 'pointed'))
    PINS.append((DX + (DR + 0.6) * math.cos(a + math.pi / 16), DY + (DR + 0.6) * math.sin(a + math.pi / 16), 51.8, 11.0, 0.9))
glazed('drumWindows', DRUM_WIN, M['limestonePlain'], depth=0.3 * S)
annulus('drumBalustrade', M['limestonePlain'], (DR + 1.6) * S, (DR - 0.4) * S, ZE + 51.7 * S, ZE + 53.0 * S, segs=16, center=(c.x, c.y))
PROFILE = [(DR - 0.2, 0.0), (DR - 1.0, 8.0), (DR - 4.0, 16.5), (DR - 8.5, 23.5), (3.6, 28.0)]
lathe('dome', M['domeRed'], [(r * S, z * S) for r, z in PROFILE], (0, 0, 0), segs=16, smooth=True, matrix=Matrix.Translation(P(DX, DY, 52.9)) @ Matrix.Rotation(math.pi / 16, 4, 'Z'))
for k in range(16):
    a = 2 * math.pi * k / 16
    pts = [P(DX + (r + 0.25) * math.cos(a), DY + (r + 0.25) * math.sin(a), 52.9 + z) for r, z in PROFILE]
    tube(f'domeRib{k}', M['limestonePlain'], pts, 0.45 * S)
lathe('lantern', M['limestonePlain'], [(r * S, z * S) for r, z in ((3.6, 0.0), (3.6, 6.0), (4.2, 6.6), (3.0, 7.4))], (0, 0, 0), segs=16, matrix=Matrix.Translation(P(DX, DY, 80.8)) @ Matrix.Rotation(math.pi / 16, 4, 'Z'))
lathe('domeSpire', M['domeRed'], [(r * S, z * S) for r, z in ((3.0, 0.0), (2.4, 2.0), (0.25, 13.5), (0.0, 14.0))], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(DX, DY, 88.1)))
lathe('domeFinial', M['gold'], [(0.0, 0.0), (0.5 * S, 0.5 * S), (0.0, 1.4 * S)], P(DX, DY, 101.9), segs=8, smooth=True)

# ------------------------------------------------------------------ every pinnacle: a slender stone spire on a little shaft
PINNACLES = bmesh.new()
for x, y, z, h, r in PINS:
    p = P(x, y, z)
    bmesh.ops.create_cone(PINNACLES, cap_ends=True, segments=8, radius1=r * S, radius2=r * S, depth=h * 0.35 * S, matrix=Matrix.Translation(p + Vector((0, 0, h * 0.175 * S))))
    bmesh.ops.create_cone(PINNACLES, cap_ends=True, segments=8, radius1=r * 1.15 * S, radius2=0.0, depth=h * 0.68 * S, matrix=Matrix.Translation(p + Vector((0, 0, (h * 0.35 + h * 0.34 - 0.05) * S))))
finish('pinnacles', PINNACLES, M['limestonePlain'], smooth_sides=False)

for k, (x, y, shirt) in enumerate(((-60.0, -10.0, 'red'), (-20.0, -12.0, 'blue'), (15.0, -9.0, 'yellow'), (70.0, -11.0, 'green'), (110.0, -10.0, 'red'), (-100.0, -9.0, 'blue'), (40.0, -28.0, 'green'), (-40.0, -29.0, 'yellow'))):
    person(f'p{k}', *T(x, y), rng.random() * 6, shirt, z=ZE + 0.0015, scale=0.55)

render('hungarian-parliament')
