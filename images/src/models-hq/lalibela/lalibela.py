# Lalibela in the high-quality look (hq.py), laid out in metres: the Church of St George, Bete Giyorgis,
# cut down into the rose-red rock: the deep square pit with its sheer walls (its front cut away to show it), and standing in it the
# church carved out of one block as a cross, on its stepped plinth, its lower row of plain windows and its
# upper row of ornate ones, the nested crosses carved on its flat roof; the trench sloping down into the
# pit; the rock round it with its grass and junipers, and pilgrims in white.
# Run: blender -b --factory-startup -P lalibela.py -- lalibela-1024.png 1024 lalibela.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1200)
M['tuff'] = material('lalibelaTuff', '#b57a5a', 0.9, vary='#a86d4e', vary_scale=20, bump=0.3, bump_scale=200)
M['tuffDark'] = material('lalibelaTuffDark', '#97614a', 0.9, vary='#8a5742', vary_scale=20, bump=0.3, bump_scale=200)
M['lichen'] = material('lalibelaLichen', '#8f7a5a', 0.9, vary='#7d8a5a', vary_scale=14, bump=0.3, bump_scale=200)
M['grassL'] = material('lalibelaGrass', '#8a9a52', 0.9, vary='#7c8c48', vary_scale=14, bump=0.3, bump_scale=200)
M['recessL'] = material('lalibelaWindow', '#3a2418', 0.9)
M['juniper'] = material('juniper', '#3f6a38', 0.85, vary='#4c7842', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.056               # metres to the tile's units
Z0 = G + 0.004
TOP = 12.0              # the rock's surface, above the pit's floor
PIT = 12.5              # the pit's half-width


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def cross(a, b):
    """A Greek cross's outline: arms of half-width a, reaching b from the middle."""
    return [(-a, -b), (a, -b), (a, -a), (b, -a), (b, a), (a, a), (a, b), (-a, b), (-a, a), (-b, a), (-b, -a), (-a, -a)]


def prism(name, mat, poly, z0, z1):
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x, y, z1)) for x, y in poly], [bm.verts.new(P(x, y, z0)) for x, y in poly])
    return finish(name, bm, mat, smooth_sides=False)


BEFORE = set(bpy.data.objects)
# ------------------------------------------------------------------ the rock round the pit (four slabs leaving the pit open), the trench
E = PIT
for k, (x0, y0, x1, y1, h) in enumerate(((-40.0, -40.0, 40.0, -E, 2.5), (-40.0, E, 40.0, 40.0, TOP), (-40.0, -E, -E, E, TOP), (E, -E, 40.0, E, TOP))):
    slab(f'rock{k}', M['tuff'], [(x0 * S, y0 * S), (x1 * S, y0 * S), (x1 * S, y1 * S), (x0 * S, y1 * S)], Z0 - 0.003, Z0 + h * S, margin=0.03)    # the front cut away
slab('pitFloor', M['tuffDark'], [(-E * S, -E * S), (E * S, -E * S), (E * S, E * S), (-E * S, E * S)], Z0 - 0.003, Z0, margin=0.03)
bm = bmesh.new()
sec = [(E - 0.01, 0.0), (E - 0.01, 0.6), (E + 12.0, TOP + 0.02), (E + 12.0, TOP - 0.6)]
a = [bm.verts.new(P(x, -3.0, z)) for x, z in sec]
b = [bm.verts.new(P(x, 3.0, z)) for x, z in sec]
add_prism(bm, a, b)
finish('trenchRamp', bm, M['tuffDark'], smooth_sides=False)
for s in (-1, 1):
    block(f'trenchWall{s}', M['tuff'], E, E + 12.0, *sorted((s * 3.0, s * 3.8)), 0.0, TOP + 0.01)
GRASS = []
for k in range(110):
    x, y = rng.uniform(-26.0, 26.0), rng.uniform(-26.0, 26.0)
    if max(abs(x), abs(y)) < E + 1.5 or math.hypot(x, y) * S > 1.38 or (x > E and abs(y) < 5.0) or y < -E:
        continue
    GRASS.append((P(x, y, TOP + 0.1).to_tuple(), rng.uniform(0.4, 0.9) * S, 0.6))
blob_cloud('grass', M['grassL'], GRASS)

# ------------------------------------------------------------------ the church: plinth, cross-shaped walls, windows, the carved roof
for k, (a, b, z0, z1) in enumerate(((5.2, 12.0, 0.0, 0.6), (4.8, 11.4, 0.6, 1.2), (4.4, 10.8, 1.2, 1.8))):
    prism(f'plinth{k}', M['tuffDark'] if k % 2 else M['tuff'], cross(a, b), z0, z1)
prism('church', M['tuff'], cross(4.0, 10.2), 1.8, 11.6)
prism('cornice', M['tuffDark'], cross(4.2, 10.4), 11.0, 11.6)
for k, (a, b, z) in enumerate(((3.4, 9.6, 11.6), (2.4, 8.6, 11.9), (1.2, 7.4, 12.2))):
    prism(f'roofCross{k}', M['lichen'] if k == 0 else M['tuff'], cross(a, b), z, z + 0.3)
WIN = []
for ang in (0.0, math.pi / 2, math.pi, -math.pi / 2):
    nx, ny = math.cos(ang), math.sin(ang)
    tx, ty = -ny, nx
    for u in (-2.0, 2.0):
        c = P(nx * 10.25 + tx * u, ny * 10.25 + ty * u, 0)
        WIN.append((c.x, c.y, Z0 + 3.4 * S, 1.2 * S, 2.0 * S, (nx, ny), 'rect'))
        WIN.append((c.x, c.y, Z0 + 7.0 * S, 1.2 * S, 2.6 * S, (nx, ny), 'round'))
    for s in (-1, 1):
        x, y = nx * 7.0 + tx * s * 4.05, ny * 7.0 + ty * s * 4.05
        c = P(x, y, 0)
        WIN.append((c.x, c.y, Z0 + 7.0 * S, 1.0 * S, 2.4 * S, (tx * s, ty * s), 'pointed'))
c = P(-10.25, 0.0, 0)
WIN.append((c.x, c.y, Z0 + 1.8 * S, 1.8 * S, 3.6 * S, (-1, 0), 'rect'))
glazed('windows', WIN, M['tuffDark'], glass=M['recessL'], depth=0.25 * S, bars=False)

# ------------------------------------------------------------------ junipers on the rock, pilgrims
TREES = []
for k, (x, y) in enumerate(((-18.0, 16.0), (-20.0, 2.0), (18.0, 16.0), (6.0, 20.0))):
    if math.hypot(x, y) * S > 1.34:
        continue
    tube(f'juniperTrunk{k}', M['trunk'], [P(x, y, TOP), P(x, y, TOP + 2.4)], 0.25 * S)
    TREES += [(P(x + rng.uniform(-1.2, 1.2), y + rng.uniform(-1.2, 1.2), TOP + 4.0 + rng.uniform(-0.4, 0.6)).to_tuple(), rng.uniform(1.4, 2.0) * S, 0.85) for _ in range(5)]
blob_cloud('junipers', M['juniper'], TREES)
for k, (x, y, z) in enumerate(((-6.0, -16.0, 2.5), (-3.0, -17.0, 2.5), (2.0, -16.4, 2.5), (-11.0, -11.0, 0.0), (11.5, 8.0, 0.0), (18.0, 0.0, 3.3))):
    c = P(x, y, z)
    person(f'pilgrim{k}', c.x, c.y, rng.random() * 6, 'white', z=c.z + 0.01 * S, scale=0.55)

R = Matrix.Rotation(math.radians(-32.0 + 22.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('lalibela')
