# The Hawa Mahal in the high-quality look (hq.py), laid out in metres: Jaipur's Palace of Winds, its
# pink sandstone screen five storeys high over the shop arches of the street, rank on rank of little
# bay windows (jharokhas), each with its latticed window, white edging and small curved dome, stepping in
# storey by storey to the crown of pinnacles at its top; the shallow palace behind; the street in front,
# and people.
# Run: blender -b --factory-startup -P hawa-mahal.py -- hawa-mahal-1024.png 1024 hawa-mahal.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1799)
M['pinkStone'] = material('hawaPink', '#e2896d', 0.8, vary='#d97c61', vary_scale=40, bump=0.08, bump_scale=200)
M['pinkDeep'] = material('hawaPinkDeep', '#c8664f', 0.8, vary='#bd5d47', vary_scale=40)
M['whiteLine'] = material('hawaWhite', '#f7efe4', 0.6)
M['lattice'] = chequer('jaliLattice', '#6b3b30', '#2e1b17', scale=420.0, rough=0.7)
M['street'] = material('jaipurStreet', '#7d7a74', 0.85, vary='#75726c', vary_scale=40)
M['footway'] = material('jaipurFootway', '#c9b9a2', 0.85, vary='#bfae96', vary_scale=40)
M['shopFront'] = material('shopFront', '#4c3a30', 0.8)

S = 0.056               # metres to the tile's units
FY = 3.0                # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0003):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def instance(name, data, at):
    ob = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(at)


BEFORE = set(bpy.data.objects)
slab('street', M['street'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (-6.0 - FY) * S), (-2.0, (-6.0 - FY) * S)], Z0 - 0.003, Z0, margin=0.02)
slab('footway', M['footway'], [(-2.0, (-6.0 - FY) * S), (2.0, (-6.0 - FY) * S), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0 + 0.15 * S, margin=0.02)

# ------------------------------------------------------------------ the bay window: a half-hexagon, its lattice, white edging, its little dome
BW, BD, BH = 2.3, 1.0, 3.3      # a bay's width, its depth out from the wall, its height
bm = bmesh.new()
plan = [(-BW / 2, 0.0), (-BW / 2 + 0.45, -BD), (BW / 2 - 0.45, -BD), (BW / 2, 0.0)]
add_prism(bm, [bm.verts.new((x * S, y * S, 0.35 * S)) for x, y in plan], [bm.verts.new((x * S, y * S, (BH - 0.5) * S)) for x, y in plan])
bay = finish('baySource', bm, M['pinkStone'], smooth_sides=False)
bm = bmesh.new()
for (xa, ya), (xb, yb) in zip(plan, plan[1:]):
    q = [bm.verts.new(((xa + (xb - xa) * 0.12) * S, (ya + (yb - ya) * 0.12 - 0.03) * S, 0.85 * S)), bm.verts.new(((xb - (xb - xa) * 0.12) * S, (yb - (yb - ya) * 0.12 - 0.03) * S, 0.85 * S)),
         bm.verts.new(((xb - (xb - xa) * 0.12) * S, (yb - (yb - ya) * 0.12 - 0.03) * S, (BH - 0.95) * S)), bm.verts.new(((xa + (xb - xa) * 0.12) * S, (ya + (yb - ya) * 0.12 - 0.03) * S, (BH - 0.95) * S))]
    bm.faces.new(q)
jali = finish('jaliSource', bm, M['lattice'], smooth_sides=False)
bm = bmesh.new()
for z0, z1 in ((0.0, 0.35), (BH - 0.5, BH - 0.32)):
    ledge = [(x * 1.08, y * 1.15 - 0.02) for x, y in plan]
    add_prism(bm, [bm.verts.new((x * S, y * S, z0 * S)) for x, y in ledge], [bm.verts.new((x * S, y * S, z1 * S)) for x, y in ledge])
edging = finish('edgingSource', bm, M['whiteLine'], smooth_sides=False)
dome = lathe('domeSource', M['pinkDeep'], [(0.95 * S, 0.0), (0.9 * S, 0.25 * S), (0.65 * S, 0.62 * S), (0.25 * S, 0.88 * S), (0.0, 0.95 * S)], (0, -0.5 * S, (BH - 0.32) * S), segs=16, smooth=True, sy=0.62)
tip = lathe('tipSource', M['whiteLine'], [(0.12 * S, 0.0), (0.16 * S, 0.12 * S), (0.0, 0.42 * S)], (0, -0.5 * S, (BH + 0.6) * S), segs=8)
PARTS = [bay.data, jali.data, edging.data, dome.data, tip.data]
for ob in (bay, jali, edging, dome, tip):
    bpy.data.objects.remove(ob, do_unlink=True)

# ------------------------------------------------------------------ the screen: storeys stepping in, a bay in every place, the crown of pinnacles
WALL_Y = 0.0
STOREYS = [(4.6, 15), (7.9, 15), (11.2, 11), (14.5, 7), (17.8, 3)]
TOPZ = [z + BH for z, n in STOREYS]
for k, (z, n) in enumerate(STOREYS):
    half = n * BW / 2 + 0.6
    block(f'wall{k}', M['pinkStone'], -half, half, WALL_Y, WALL_Y + 7.0 - k * 1.0, 0.0 if k == 0 else z, z + BH)
    block(f'floorBand{k}', M['whiteLine'], -half - 0.1, half + 0.1, WALL_Y - 0.15, WALL_Y + 0.3, z - 0.12, z + 0.05, bevel=0)
    for j in range(n):
        x = -n * BW / 2 + BW * (j + 0.5)
        for d, data in enumerate(PARTS):
            instance(f'bay{k}_{j}_{d}', data, P(x, WALL_Y, z))
    if k > 0:
        prev = STOREYS[k - 1][1] * BW / 2 + 0.6
        for s in (-1, 1):
            block(f'terraceRail{k}{s}', M['whiteLine'], *sorted((s * half, s * prev)), WALL_Y - 0.1, WALL_Y + 0.2, z, z + 0.9, bevel=0)
for k, x in enumerate((-4.2, -1.4, 1.4, 4.2)):
    block(f'crownPier{k}', M['pinkStone'], x - 0.4, x + 0.4, WALL_Y - 0.2, WALL_Y + 0.6, TOPZ[-1], TOPZ[-1] + 2.2)
    lathe(f'crownCap{k}', M['pinkDeep'], [(0.7 * S, 0.0), (0.6 * S, 0.3 * S), (0.3 * S, 0.9 * S), (0.0, 1.3 * S)], P(x, WALL_Y + 0.2, TOPZ[-1] + 2.2), segs=12, smooth=True)
block('crownArch', M['pinkStone'], -4.6, 4.6, WALL_Y, WALL_Y + 0.4, TOPZ[-1] + 1.8, TOPZ[-1] + 2.6, bevel=0)
lathe('crownDome', M['pinkDeep'], [(1.6 * S, 0.0), (1.5 * S, 0.5 * S), (1.0 * S, 1.3 * S), (0.3 * S, 1.8 * S), (0.0, 2.0 * S)], P(0.0, WALL_Y + 0.2, TOPZ[-1] + 2.6), segs=20, smooth=True)
lathe('crownFinial', M['whiteLine'], [(0.2 * S, 0.0), (0.3 * S, 0.3 * S), (0.0, 1.1 * S)], P(0.0, WALL_Y + 0.2, TOPZ[-1] + 4.6), segs=8)
for s in (-1, 1):
    for k in range(1, len(STOREYS)):
        z = STOREYS[k][0]
        half = STOREYS[k][1] * BW / 2 + 0.6
        lathe(f'cornerKiosk{s}{k}', M['pinkDeep'], [(0.7 * S, 0.0), (0.6 * S, 0.3 * S), (0.3 * S, 0.9 * S), (0.0, 1.3 * S)], P(s * (half + 0.2), WALL_Y + 0.4, z + BH + 0.1), segs=12, smooth=True)

# ------------------------------------------------------------------ the shop arches along the street, people
GH = 4.6
half0 = STOREYS[0][1] * BW / 2 + 0.6
block('ground', M['pinkStone'], -half0, half0, WALL_Y - 1.2, WALL_Y + 7.0, -0.3, GH)
DOORS = []
for j in range(9):
    x = -half0 + (2 * half0) * (j + 0.5) / 9
    c = P(x, WALL_Y - 1.25, 0)
    DOORS.append((c.x, c.y, Z0 + 0.15 * S, 2.4 * S, 3.4 * S, (0, -1), 'round'))
block('groundCornice', M['whiteLine'], -half0 - 0.2, half0 + 0.2, WALL_Y - 1.5, WALL_Y - 0.9, GH - 0.4, GH, bevel=0)
glazed('shops', DOORS, M['whiteLine'], glass=M['shopFront'], depth=0.25 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-12.0, -4.0, 'red'), (-5.0, -3.0, 'yellow'), (3.0, -4.5, 'blue'), (9.0, -3.2, 'green'), (15.0, -4.0, 'red'), (-2.0, -10.0, 'yellow'))):
    c = P(x, y, 0.15 if y > -6.0 else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.3)

R = Matrix.Rotation(math.radians(-32.0 + 18.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('hawa-mahal')
