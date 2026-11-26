# Ephesus in the high-quality look (hq.py), laid out in metres: the Library of Celsus, its marble front
# on the wide steps of its podium, the lower storey's four pairs of columns on their pedestals under
# their jutting entablatures, the three doors, and the four Virtues standing in their niches (a scanned
# statue, UBICA.srl, CC BY 4.0, in _sources/madonnina/, standing in, in marble); the upper storey's
# paired columns, windows and pediments, triangular and curved; the ruined walls of the hall behind it;
# the triple arch of the Gate of Mazeus and Mithridates beside it; the marble street in front with
# fallen column drums and a few columns still standing; cypresses, the dry hillside, and people.
# Run: blender -b --factory-startup -P ephesus.py -- ephesus-1024.png 1024 ephesus.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(117)
M['marbleE'] = masonry('ephesusMarble', '#e6dccb', '#c3b8a5', scale=70, rough=0.6, vary='#ddd2bf')
M['marbleCol'] = material('columnMarbleE', '#ece4d4', 0.45, vary='#e2d9c6', vary_scale=40, bump=0.05, bump_scale=200)
M['marbleDark'] = material('marbleGreyE', '#a99f8e', 0.6, vary='#9e9483', vary_scale=30)
M['street'] = masonry('marbleStreet', '#ddd3c2', '#b8ad99', scale=60, rough=0.65, vary='#d2c7b4')
M['dryGrass'] = material('dryGrass', '#b8a874', 0.9, vary='#a89a66', vary_scale=12, bump=0.3, bump_scale=200)
M['ruinStone'] = masonry('ruinStone', '#c8b89a', '#9d8e73', scale=90, rough=0.9, vary='#bcac8e')
M['cypressE'] = material('cypressE', '#2d4d2c', 0.85, vary='#365a33', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.05                # metres to the tile's units
FY = -1.0               # the plan's middle on the tile's


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The site (metres): flat round the street and the library, the hill rising behind it."""
    return 6.0 * smooth((y - 18.0) / 10.0) + 1.5 * smooth((abs(x) - 18.0) / 8.0) * smooth((y + 4.0) / 6.0)


land = terrain('site', lambda x, y: ground(x / S, y / S - FY) * S * smooth((1.48 - math.hypot(x, y)) / 0.1), [M['dryGrass']], lambda z, nz, x, y: 0, rings=120, segs=300)
Z0 = G + 0.004
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, (y + FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def column(name, x, y, z0, h, r, cap=True):
    """A marble column: base, slightly tapering shaft, and a flaring capital under its abacus."""
    lathe(name + 'Base', M['marbleCol'], [(r * 1.35 * S, 0.0), (r * 1.35 * S, 0.2 * S), (r * 1.1 * S, 0.35 * S), (r * S, 0.4 * S)], P(x, y, z0), segs=20)
    cylinder(name, M['marbleCol'], r * S, (h - 1.1) * S, P(x, y, z0 + 0.35), segs=20, r2=r * 0.88 * S)
    if cap:
        lathe(name + 'Capital', M['marbleCol'], [(r * 0.88 * S, 0.0), (r * 1.0 * S, 0.35 * S), (r * 1.45 * S, 0.65 * S), (r * 1.5 * S, 0.75 * S)], P(x, y, z0 + h - 0.8), segs=20)
        block(name + 'Abacus', M['marbleCol'], x - r * 1.6, x + r * 1.6, y - r * 1.6, y + r * 1.6, z0 + h - 0.05, z0 + h + 0.15, bevel=0)


# ------------------------------------------------------------------ the street, the podium's steps, the façade's back wall
slab('street', M['street'], [(x * S, (y + FY) * S) for x, y in ((-40.0, -30.0), (40.0, -30.0), (40.0, -3.6), (-40.0, -3.6))], G - 0.003, Z0, margin=0.02)
W = 10.6
for k in range(9):
    block(f'step{k}', M['marbleE'], -W - 0.4, W + 0.4, -3.6 + 0.4 * k, 1.0, -0.3, 0.2 * (k + 1), bevel=0)
POD = 1.8
block('backWall', M['marbleE'], -W, W, 0.0, 1.4, POD, 18.0)
block('podiumFloor', M['marbleDark'], -W, W, -1.6, 1.0, POD - 0.1, POD, bevel=0)

# ------------------------------------------------------------------ the lower storey: four column pairs on pedestals, their entablatures, doors, niches with the Virtues
DOORS, WIN = [], []
PAIRS = (-8.2, -2.9, 2.9, 8.2)       # each pair wide enough to frame its Virtue
for k, px in enumerate(PAIRS):
    block(f'pedestal{k}', M['marbleE'], px - 1.75, px + 1.75, -1.5, 0.2, POD, POD + 1.8)
    for dx in (-1.1, 1.1):
        column(f'lowCol{k}{dx:+.1f}', px + dx, -0.9, POD + 1.8, 6.9, 0.38)
    block(f'lowEntablature{k}', M['marbleE'], px - 1.9, px + 1.9, -1.6, 0.4, POD + 8.85, POD + 10.2)
    block(f'lowCornice{k}', M['marbleCol'], px - 2.1, px + 2.1, -1.85, 0.4, POD + 10.2, POD + 10.6, bevel=0)
    # the niche in the back wall behind the pair, a Virtue standing in it
    block(f'nicheBack{k}', M['marbleDark'], px - 0.9, px + 0.9, -0.05, 0.1, POD + 1.8, POD + 6.4, bevel=0)
    arcade_path(f'nicheHood{k}', M['marbleCol'], [((px - 1.2) * S, (-0.35 + FY) * S), ((px + 1.2) * S, (-0.35 + FY) * S)], 0.3 * S, Z0 + (POD + 5.4) * S, 1.4 * S, 0.9 * S)
block('lowWallCornice', M['marbleCol'], -W, W, -0.4, 0.2, POD + 10.0, POD + 10.4, bevel=0)
src = import_model('madonnina', 'virtueSource')
stand_sourced(src, cut=0.34, turn=0.0, height=2.6 * S, z=0.0, mat=M['marbleCol'], report=False)
src.data.polygons.foreach_set('use_smooth', [True] * len(src.data.polygons))
figure = src.data
bpy.data.objects.remove(src, do_unlink=True)
for k, px in enumerate(PAIRS):
    ob = bpy.data.objects.new(f'virtue{k}', figure)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(P(px, -0.5, POD + 1.8))
for x, w, h in ((0.0, 2.6, 5.4), (-5.55, 1.9, 4.4), (5.55, 1.9, 4.4)):
    c = P(x, -0.05, 0)
    DOORS.append((c.x, c.y, Z0 + POD * S, w * S, h * S, (0, -1), 'rect'))
    block(f'doorFrame{x:+.0f}', M['marbleCol'], x - w / 2 - 0.35, x + w / 2 + 0.35, -0.25, 0.0, POD + h, POD + h + 0.6, bevel=0)

# ------------------------------------------------------------------ the upper storey: paired columns over the doors, windows, pediments triangular and curved
UP = POD + 10.6
UPAIRS = (-5.55, 0.0, 5.55)
for k, px in enumerate(UPAIRS):
    block(f'upPlinth{k}', M['marbleE'], px - 1.3, px + 1.3, -1.4, 0.2, UP, UP + 0.8)
    for dx in (-0.7, 0.7):
        column(f'upCol{k}{dx:+.1f}', px + dx, -0.8, UP + 0.8, 4.4, 0.3)
    block(f'upEntablature{k}', M['marbleE'], px - 1.45, px + 1.45, -1.4, 0.4, UP + 5.35, UP + 6.3)
    block(f'upCornice{k}', M['marbleCol'], px - 1.65, px + 1.65, -1.6, 0.4, UP + 6.3, UP + 6.65, bevel=0)
    c = P(px, -0.05, 0)
    WIN.append((c.x, c.y, Z0 + (UP + 1.0) * S, 1.4 * S, 3.4 * S, (0, -1), 'rect'))
    if k == 1:          # the middle one curved, the others triangular
        outline = [(1.65 * math.cos(math.pi * j / 12), 1.1 * math.sin(math.pi * j / 12)) for j in range(13)]
    else:
        outline = [(1.65, 0.0), (0.0, 1.2), (-1.65, 0.0)]
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(px + u, -1.6, UP + 6.65 + v)) for u, v in outline], [bm.verts.new(P(px + u, 0.4, UP + 6.65 + v)) for u, v in outline])
    finish(f'pediment{k}', bm, M['marbleCol'], smooth_sides=False)
for sx in (-1, 1):
    column(f'upEndCol{sx}', sx * 9.6, -0.6, UP + 0.8, 4.4, 0.3)
    block(f'upEndPlinth{sx}', M['marbleE'], sx * 9.6 - 0.7, sx * 9.6 + 0.7, -1.1, 0.2, UP, UP + 0.8)
    block(f'upEndEntablature{sx}', M['marbleE'], sx * 9.6 - 0.8, sx * 9.6 + 0.8, -1.0, 0.4, UP + 5.35, UP + 6.3)
block('topCornice', M['marbleCol'], -W - 0.2, W + 0.2, -0.3, 1.5, 17.6, 18.2, bevel=0)

# ------------------------------------------------------------------ the ruined hall behind, the Gate of Mazeus and Mithridates
for k, (x0, x1, y0, y1, h) in enumerate(((-W, -W + 1.2, 1.4, 17.0, 7.0), (W - 1.2, W, 1.4, 17.0, 9.0), (-W, W, 15.8, 17.0, 5.0), (-5.0, 5.0, 12.0, 13.0, 2.2))):
    block(f'ruin{k}', M['ruinStone'], x0, x1, y0, y1, -0.3, h, bevel=0.002)
    for j in range(int(max(x1 - x0, y1 - y0) / 1.6)):
        t = (j + 0.5) / int(max(x1 - x0, y1 - y0) / 1.6)
        bx, by = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        hh = rng.uniform(0.3, 1.4)
        if rng.random() < 0.7:
            block(f'ruinTop{k}_{j}', M['ruinStone'], bx - 0.65, bx + 0.65, by - 0.65, by + 0.65, h - 0.05, h + hh, bevel=0.002)


def gate():
    """The Gate of Mazeus and Mithridates, three arches under its attic, built facing -y about x = 0."""
    for u in (-8.0, -2.6, 2.6, 8.0):
        block(f'gatePier{u:+.0f}', M['marbleE'], u - 0.7, u + 0.7, 0.0, 2.4, -0.3, 4.05)
        column(f'gateColumn{u:+.0f}', u, -0.45, 0.0, 7.6, 0.3)
    arcade_path('gateArches', M['marbleE'], [(u * S, FY * S) for u in (-8.0, -2.6, 2.6, 8.0)], 2.4 * S, Z0 + 4.0 * S, 4.6 * S, 2.0 * S)
    block('gateAttic', M['marbleE'], -8.7, 8.7, -0.6, 2.4, 8.6, 11.2)
    block('gateCornice', M['marbleCol'], -8.9, 8.9, -0.9, 2.4, 11.2, 11.6, bevel=0)


before_gate = set(bpy.data.objects)
gate()
# stood beside the library, facing across the square to it
mg = Matrix.Translation((21.0 * S, (-2.0 + FY) * S, 0.0)) @ Matrix.Rotation(math.radians(-69.0), 4, 'Z') @ Matrix.Translation((0.0, -FY * S, 0.0))
for ob in set(bpy.data.objects) - before_gate:
    ob.matrix_world = mg @ ob.matrix_world

# ------------------------------------------------------------------ the street's fallen drums and standing columns, cypresses, people
for k, (x, y, ang, h) in enumerate(((-14.0, -10.0, 0.4, 2.2), (-9.0, -16.0, 1.3, 1.8), (6.0, -13.0, -0.6, 2.4), (13.0, -19.0, 0.9, 1.6), (-18.0, -20.0, -1.1, 2.0), (2.0, -22.0, 0.2, 1.4))):
    cylinder(f'drum{k}', M['marbleCol'], 0.45 * S, h * S, (0, 0, 0), segs=16, matrix=Matrix.Translation(P(x, y, 0.45)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Translation((0, 0, -h * S / 2)))
for k, (x, y, h) in enumerate(((-16.0, -6.0, 7.0), (-14.0, -19.0, 5.5), (14.0, -19.0, 7.0), (-23.0, -11.0, 1.2), (22.0, -12.0, 1.0))):
    column(f'streetColumn{k}', x, y, 0.0, h, 0.4, cap=h > 3.0)
for k, (x, y, h) in enumerate(((-15.0, 10.0, 11.0), (-19.0, 14.0, 9.0), (16.0, 12.0, 12.0), (21.0, 7.0, 10.0), (-25.0, 4.0, 8.0))):
    g = ground(x, y)
    lathe(f'cypress{k}', M['cypressE'], [(0.0, 0.0), (1.0 * S, 1.2 * S), (1.1 * S, h * 0.45 * S), (0.5 * S, h * 0.85 * S), (0.0, h * S)], P(x, y, g - 0.3), segs=12, smooth=True)
glazed('doors', DOORS, M['marbleCol'], glass=M['door'], depth=0.3 * S)
glazed('windows', WIN, M['marbleCol'], depth=0.3 * S)
for k, (x, y, shirt) in enumerate(((-6.0, -8.0, 'red'), (4.0, -10.0, 'blue'), (-2.0, -16.0, 'yellow'), (10.0, -6.0, 'green'), (-11.0, -4.5, 'red'), (1.0, -2.0, 'blue'))):
    z = 0.2 * min(9, int((y + 3.6) / 0.4) + 1) if y > -3.6 else 0.0     # on the street, or up the steps
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.85)

R = Matrix.Rotation(math.radians(-32.0 + 15.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('ephesus')
