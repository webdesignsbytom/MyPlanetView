# The Statue of Liberty in the high-quality look (hq.py), made afresh in detail, on Liberty Island in
# New York Harbor: the island's lawns inside its granite seawall, the paths, a few trees, Fort Wood's
# eleven-pointed star; the granite pedestal with its rusticated base and portico, the loggias with
# their columns, the row of discs and the balcony at the top; and the copper-green figure: the robe
# falling in deep folds with the right knee stepping forward and the right foot showing, the broken
# chain at her feet, the stola crossing from the left shoulder to the right hip and its long drape
# down the left side, the right arm raised with the sleeve bunched at the shoulder, the torch with
# its balcony and the gilded flame, the keystone tablet held in the left arm with its date, the face,
# the wavy hair, the diadem with its windows and the seven rays. Turned to face the camera; a ferry
# at the pier and visitors.
# Run: blender -b --factory-startup -P statue-of-liberty.py -- statue-of-liberty-1024.png 1024 statue-of-liberty.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1886)
M['copper'] = material('copper', '#6aad93', 0.5, vary='#4f8f78', vary_scale=14, bump=0.15, bump_scale=220, coat=0.1)
M['copperDark'] = material('copperDark', '#4f8d76', 0.55, vary='#3f7a64', vary_scale=14, bump=0.15, bump_scale=220)
M['flame'] = material('flame', '#f2c04a', 0.22, metallic=1.0, emission=('#ffc94a', 0.5))
M['pedestal'] = banded(material('pedestal', '#cbbdaa', 0.6, vary='#b8aa95', vary_scale=24, bump=0.12, bump_scale=160), 'Z', 34.0, strength=0.35)
M['pedestalSmooth'] = material('pedestalSmooth', '#d3c6b4', 0.55, vary='#c2b4a0', vary_scale=24, bump=0.08, bump_scale=160)
M['seawall'] = material('seawall', '#a39b90', 0.7, vary='#918a80', vary_scale=24, bump=0.25, bump_scale=120)
M['ferryBlue'] = material('ferryBlue', '#2f5d9a', 0.45, coat=0.4)


def sweep(name, mat, path, widths, thicks, n=18, centre=(0.0, 0.0), bulge=None):
    """A tube or band along a path: at each point a cross-section `widths` across (sideways) by
    `thicks` deep (outwards from the figure's axis through `centre`)."""
    rings = []
    for i, p in enumerate(path):
        P = Vector(p)
        T = (Vector(path[min(i + 1, len(path) - 1)]) - Vector(path[max(i - 1, 0)])).normalized()
        Nh = Vector((P.x - centre[0], P.y - centre[1], 0.0))
        if Nh.length < 1e-6:
            Nh = Vector((0.0, -1.0, 0.0))
        N = (Nh - T * Nh.dot(T)).normalized()
        B = T.cross(N).normalized()
        ring = []
        for k in range(n):
            phi = 2 * math.pi * k / n
            w = widths[i] * (1 + (bulge(i, phi) if bulge else 0.0))
            ring.append(tuple(P + B * (w * math.cos(phi)) + N * (thicks[i] * math.sin(phi))))
        rings.append(ring)
    return loft(name, mat, rings)


# ------------------------------------------------------------------ Liberty Island
isle = [((1.12 + 0.12 * math.sin(2 * a + 0.6) + 0.05 * math.sin(5 * a)) * math.cos(a), (1.02 + 0.1 * math.sin(2 * a + 0.6)) * math.sin(a)) for a in [2 * math.pi * k / 96 for k in range(96)]]
slab('seawall', M['seawall'], isle, G - 0.01, G + 0.035, bevel=0.004, margin=0.12)
slab('lawn', M['grass'], [(x * 0.985, y * 0.985) for x, y in isle], G + 0.03, G + 0.04, margin=0.14)
annulus('fortPath', M['paving'], 0.74, 0.56, G + 0.036, G + 0.046, segs=96)
slab('pierPath', M['paving'], rect(0.62, -0.72, 0.16, 0.5, rot=math.radians(-40)), G + 0.036, G + 0.046, margin=0.14)
box('pier', M['pavingDark'], (0.86, -0.98, G + 0.02), (0.3, 0.1, 0.04), rot_z=math.radians(-40), bevel=0.003)
for k in range(14):
    a = 2 * math.pi * k / 14 + 0.3
    x, y = 0.9 * 1.02 * math.cos(a), 0.9 * 0.92 * math.sin(a)
    if 0.2 < x < 1.0 and -1.0 < y < -0.3:
        continue
    tree(f'tree{k}', x, y, h=0.16, r=0.07, z=G + 0.04)
before = set(bpy.data.objects)

# ------------------------------------------------------------------ Fort Wood
ZF = G + 0.04
star = []
for k in range(22):
    a = 2 * math.pi * k / 22 + math.pi / 2
    r = 0.55 if k % 2 == 0 else 0.41
    star.append((r * math.cos(a), r * math.sin(a)))
bm = bmesh.new()
add_prism(bm, [bm.verts.new((x, y, ZF)) for x, y in star], [bm.verts.new((x, y, ZF + 0.12)) for x, y in star])
finish('fortWood', bm, M['seawall'], bevel=0.004, smooth_sides=False)
bm = bmesh.new()
add_prism(bm, [bm.verts.new((x * 1.01, y * 1.01, ZF + 0.115)) for x, y in star], [bm.verts.new((x * 1.01, y * 1.01, ZF + 0.13)) for x, y in star])
finish('fortCoping', bm, M['pedestalSmooth'], bevel=0.002, smooth_sides=False)
bm = bmesh.new()
add_prism(bm, [bm.verts.new((x * 0.96, y * 0.96, ZF + 0.128)) for x, y in star], [bm.verts.new((x * 0.96, y * 0.96, ZF + 0.133)) for x, y in star])
finish('fortTop', bm, M['paving'], smooth_sides=False)
windows('fortGate', M['shadow'], [(0.0, -0.55 * math.cos(math.pi / 11) - 0.002, ZF, 0.07, 0.08, (0, -1), 'round')], depth=0.01)

# ------------------------------------------------------------------ the pedestal
ZP = ZF + 0.13
OPEN, DISCS = [], []
box('step1', M['pedestalSmooth'], (0, 0, ZP + 0.015), (0.6, 0.6, 0.03), bevel=0.003)
box('step2', M['pedestalSmooth'], (0, 0, ZP + 0.04), (0.56, 0.56, 0.025), bevel=0.003)
ZP += 0.05
lathe('dado', M['pedestal'], [(0.25 * math.sqrt(2), 0), (0.235 * math.sqrt(2), 0.31)], (0, 0, 0), segs=4, matrix=Matrix.Translation((0, 0, ZP)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
    tx, ty = -ny, nx
    box_m(f'portico{nx}{ny}', M['pedestal'], Matrix.Translation((nx * 0.25, ny * 0.25, ZP + 0.15)) @ Matrix.Rotation(math.atan2(ny, nx), 4, 'Z'), (0.04, 0.2, 0.3), bevel=0.003)
    if ny == -1:
        OPEN.append((0, -0.271, ZP, 0.08, 0.14, (0, -1), 'round'))
    box_m(f'porticoCap{nx}{ny}', M['pedestalSmooth'], Matrix.Translation((nx * 0.262, ny * 0.262, ZP + 0.27)) @ Matrix.Rotation(math.atan2(ny, nx), 4, 'Z'), (0.03, 0.22, 0.025), bevel=0.002)
ZP += 0.31
box('cornice1', M['pedestalSmooth'], (0, 0, ZP + 0.015), (0.53, 0.53, 0.03), bevel=0.003)
ZP += 0.03
box('loggiaLevel', M['pedestalSmooth'], (0, 0, ZP + 0.1), (0.45, 0.45, 0.2), bevel=0.003)
COLS = bmesh.new()
for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
    tx, ty = -ny, nx
    OPEN.append((nx * 0.226, ny * 0.226, ZP + 0.03, 0.2, 0.15, (nx, ny), 'rect'))
    for u in (-0.075, -0.025, 0.025, 0.075):
        x, y = nx * 0.22 + tx * u, ny * 0.22 + ty * u
        bmesh.ops.create_cone(COLS, cap_ends=True, segments=10, radius1=0.011, radius2=0.009, depth=0.14, matrix=Matrix.Translation((x, y, ZP + 0.1)))
        bmesh.ops.create_cube(COLS, size=1.0, matrix=Matrix.Translation((x, y, ZP + 0.175)) @ Matrix.Diagonal((0.026, 0.026, 0.01, 1)))
    box_m(f'balustrade{nx}{ny}', M['pedestalSmooth'], Matrix.Translation((nx * 0.224, ny * 0.224, ZP + 0.045)) @ Matrix.Rotation(math.atan2(ny, nx), 4, 'Z'), (0.02, 0.2, 0.03), bevel=0.002)
    for u in (-0.17, 0.17):
        box_m(f'pilaster{nx}{ny}{u}', M['pedestalSmooth'], Matrix.Translation((nx * 0.228 + tx * u, ny * 0.228 + ty * u, ZP + 0.1)) @ Matrix.Rotation(math.atan2(ny, nx), 4, 'Z'), (0.012, 0.04, 0.2), bevel=0.002)
finish('loggiaColumns', COLS, M['pedestalSmooth'], smooth_sides=False)
ZP += 0.2
box('cornice2', M['pedestalSmooth'], (0, 0, ZP + 0.015), (0.49, 0.49, 0.03), bevel=0.003)
ZP += 0.03
box('attic', M['pedestal'], (0, 0, ZP + 0.085), (0.42, 0.42, 0.17), bevel=0.003)
for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
    tx, ty = -ny, nx
    for k in range(8):
        u = -0.165 + k * 0.047
        DISCS.append((nx * 0.211 + tx * u, ny * 0.211 + ty * u, ZP + 0.06, 0.032, 0.032, (nx, ny), 'round'))
ZP += 0.17
box('topCornice', M['pedestalSmooth'], (0, 0, ZP + 0.015), (0.46, 0.46, 0.03), bevel=0.003)
ZP += 0.03
loop = [(-0.22, -0.22), (0.22, -0.22), (0.22, 0.22), (-0.22, 0.22), (-0.22, -0.22)]
tube('balconyRail', M['pedestalSmooth'], [(x, y, ZP + 0.03) for x, y in loop], 0.004)
bm = bmesh.new()
for (ax, ay), (bx, by) in zip(loop, loop[1:]):
    for j in range(12):
        f = j / 12
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((ax + (bx - ax) * f, ay + (by - ay) * f, ZP + 0.015)) @ Matrix.Diagonal((0.006, 0.006, 0.03, 1)))
finish('balconyBalusters', bm, M['pedestalSmooth'], smooth_sides=False)
windows('pedestalOpenings', M['shadow'], OPEN, depth=0.01)
windows('discs', M['pedestalSmooth'], DISCS, depth=0.012)

# ------------------------------------------------------------------ the figure
# the sculpted model in _sources/statue-of-liberty/ (Gravity Jack, CC BY 4.0), cut free of its own
# base, stood on the pedestal and given the copper's green
SOURCE_CUT = 0.03         # where the model's own base ends, a share of its height
SOURCE_TURN = 270.0       # the turn (degrees) that makes her face -y
STATUE_H = 1.12           # her height on the pedestal, the foot of the robe to the top of the flame
lathe('statueBase', M['copperDark'], [(0.2, 0), (0.2, 0.02), (0.18, 0.03)], (0, 0, ZP), segs=40, sy=0.85)
src = import_model('statue-of-liberty', 'liberty')
stand_sourced(src, cut=SOURCE_CUT, turn=SOURCE_TURN, height=STATUE_H, z=ZP + 0.02, mat=M['copper'])

R = Matrix.Rotation(math.radians(-32), 4, 'Z')
for ob in bpy.data.objects:
    if ob not in before:
        ob.matrix_world = R @ ob.matrix_world

# ------------------------------------------------------------------ a ferry and visitors
m = Matrix.Translation((0.99, -0.88, G)) @ Matrix.Rotation(math.radians(48), 4, 'Z')
bm = bmesh.new()
hull = [(-0.13, -0.035), (0.09, -0.04), (0.14, 0.0), (0.09, 0.04), (-0.13, 0.035)]
add_prism(bm, [bm.verts.new(m @ Vector((u, v, -0.005))) for u, v in hull], [bm.verts.new(m @ Vector((u, v, 0.03))) for u, v in hull])
finish('ferryHull', bm, M['white'], bevel=0.003, smooth_sides=False)
box_m('ferryBand', M['ferryBlue'], m @ Matrix.Translation((-0.01, 0, 0.022)), (0.22, 0.078, 0.012))
box_m('ferryDeck1', M['white'], m @ Matrix.Translation((-0.02, 0, 0.048)), (0.19, 0.064, 0.035), bevel=0.003)
box_m('ferryDeck2', M['white'], m @ Matrix.Translation((-0.03, 0, 0.078)), (0.13, 0.058, 0.026), bevel=0.003)
for s in (-1, 1):
    box_m(f'ferryWindows{s}', M['glass'], m @ Matrix.Translation((-0.02, s * 0.0325, 0.05)), (0.17, 0.002, 0.014))
for k, (x, y, shirt) in enumerate(((0.5, -0.6, 'red'), (0.42, -0.5, 'blue'), (-0.62, -0.25, 'yellow'), (-0.4, -0.55, 'green'), (0.15, -0.68, 'red'), (0.68, 0.2, 'blue'), (-0.2, 0.66, 'yellow'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.046)

render('statue-of-liberty')
