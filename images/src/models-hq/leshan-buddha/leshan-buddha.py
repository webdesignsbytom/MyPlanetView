# The Leshan Giant Buddha in the high-quality look (hq.py), laid out in metres: the great Buddha carved
# deep into the red sandstone cliff where three rivers meet, seated in his niche with the cliff rising on
# either side, the forest on its top; the zigzag plank stairway clinging to
# the face beside him; the rivers at his feet with a tour boat, and people.
# Sourced stand-in: the Buddha is a CC0 scan of a seated Burmese Buddha (_sources/artsmia-buddha/), in the
# cliff's sandstone; no open scan of Leshan's own was found.
# Run: blender -b --factory-startup -P leshan-buddha.py -- leshan-buddha-1024.png 1024 leshan-buddha.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(803)
M['sandstoneL'] = layered('leshanSandstone', ['#9b5a3f', '#a8664a', '#8a4f37', '#b0705a'], scale=14.0, distortion=1.6, rough=0.9, bump=0.4, bump_scale=120, axis='Z')
M['buddhaStone'] = material('buddhaStone', '#a66548', 0.85, vary='#8f553c', vary_scale=40, bump=0.25, bump_scale=200)
M['moss'] = material('leshanMoss', '#4f7a38', 0.9, vary='#5a8541', vary_scale=14)
M['riverL'] = material('minRiver', '#3f6b5c', 0.08, vary='#4a7666', vary_scale=6, coat=0.7)
M['forestL'] = material('leshanForest', '#3f7a36', 0.85, vary='#4c8a40', vary_scale=14, bump=0.3, bump_scale=90)
M['forestL2'] = material('leshanForestLight', '#5c923d', 0.85, vary='#69a046', vary_scale=14, bump=0.3, bump_scale=90)
M['plank'] = material('plankRoad', '#6b4a30', 0.8)
M['boatL'] = material('tourBoatL', '#e9e3d6', 0.5)
M['boatRoof'] = material('tourBoatRoof', '#c8423a', 0.6)

S = 0.0265              # metres to the tile's units
Z0 = G
TOP = 80.0              # the cliff's top
NW, ND = 24.0, 28.0     # the niche's half-width and depth


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def face(x):
    return -6.0 + 2.5 * math.sin(x / 11.0) + 1.2 * math.sin(x / 4.1)


def ground(x, y):
    f = face(x)
    cliff = TOP * smooth((y - f) / 2.0) + 4.0 * math.sin(x / 9.0) * smooth((y - f - 6.0) / 10.0)
    # the niche: cut down to the Buddha's floor, narrowing a little towards the top
    inside = smooth((NW - abs(x)) / 1.5) * smooth((f + ND - y) / 1.5)
    floor = 2.0 + 2.0 * smooth((y - f - ND + 6.0) / 6.0)
    return cliff * (1.0 - inside) + floor * inside


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.14)
    return max(0.0, ground(x / S, y / S)) * S * rim


def pick(z, nz, x, y):
    if nz < 0.6:
        return 0
    return 1 if z > 40.0 * S else 0


land = terrain('cliff', H, [M['sandstoneL'], M['moss']], pick, rings=260, segs=720)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


slab('river', M['riverL'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (-16.0) * S), (-2.0, (-16.0) * S)], Z0 - 0.003, Z0 + 1.2 * S, margin=0.02)

# ------------------------------------------------------------------ the Buddha in his niche
src = import_model('artsmia-buddha', 'buddhaSource')
if src is not None:
    # turned to face out of the cliff, and drawn three-quarters as deep: carved in high relief into the rock
    stand_sourced(src, cut=0.06, turn=32.0, height=60.0 * S, z=0.0, mat=M['buddhaStone'], report=False)
    src.data.transform(Matrix.Diagonal((1.0, 0.75, 1.0, 1.0)))
    src.data.polygons.foreach_set('use_smooth', [True] * len(src.data.polygons))
    src.matrix_world = Matrix.Translation(P(0.0, face(0.0) + 12.0, 2.0))
box('nicheFloor', M['sandstoneL'], P(0.0, face(0.0) + ND / 2 - 5.0, 1.0), (2.0 * NW * S, (ND + 10.0) * S, 2.0 * S), bevel=0)

# ------------------------------------------------------------------ the plank stairway zigzagging down the face beside him
x0, flights = NW + 4.0, 7
for k in range(flights):
    za, zb = TOP - 4.0 - k * 10.6, TOP - 4.0 - (k + 1) * 10.6
    xa, xb = (x0, x0 + 9.0) if k % 2 == 0 else (x0 + 9.0, x0)
    ya = face((xa + xb) / 2) - 1.2
    n = 8
    for j in range(n):
        t = (j + 0.5) / n
        box(f'step{k}{j}', M['plank'], P(xa + (xb - xa) * t, ya, za + (zb - za) * t), (1.3 * S, 1.6 * S, 0.3 * S), bevel=0)
    tube(f'stairRail{k}', M['plank'], [P(xa, ya - 0.8, za + 1.0), P(xb, ya - 0.8, zb + 1.0)], 0.12 * S)
    box(f'landing{k}', M['plank'], P(xb, ya, zb), (2.4 * S, 2.2 * S, 0.3 * S), bevel=0)

# ------------------------------------------------------------------ the forest on top, the boat, people
CROWNS = []
for p in scatter_on(land, 9000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.34, seed=6):
    CROWNS.append(((p.x, p.y, p.z + rng.uniform(3.0, 6.0) * S), rng.uniform(2.6, 4.2) * S, 0.85))
    if len(CROWNS) >= 240:
        break
blob_cloud('forest', M['forestL'], CROWNS[::2])
blob_cloud('forestLight', M['forestL2'], CROWNS[1::2])
bm = bmesh.new()
hull = [(-12.0, -26.0), (8.0, -26.0), (12.0, -23.0), (8.0, -20.0), (-12.0, -20.0)]
add_prism(bm, [bm.verts.new(P(x, y, 3.0)) for x, y in hull], [bm.verts.new(P(x, y, 0.6)) for x, y in hull])
finish('boat', bm, M['boatL'], smooth_sides=False)
box('boatDeck', M['boatL'], P(-2.0, -23.0, 4.6), (16.0 * S, 5.0 * S, 3.2 * S), bevel=0)
box('boatRoof', M['boatRoof'], P(-2.0, -23.0, 6.4), (17.0 * S, 5.6 * S, 0.4 * S), bevel=0)
for k, (x, z) in enumerate(((x0 + 2.0, TOP - 10.0), (x0 + 6.0, TOP - 31.0), (x0 + 4.0, TOP - 52.0))):
    c = P(x, face(x) - 1.2, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow')[k], z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('leshan-buddha')
