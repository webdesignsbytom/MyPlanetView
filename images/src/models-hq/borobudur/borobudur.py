# Borobudur in the high-quality look (hq.py), laid out in metres: the great Buddhist monument in Java, its
# grey andesite rising from the broad foot in five square terraces, each with the stepped corners of its
# plan, the galleries' balustrades crowned with little stupas, and the stairs climbing the middle of every
# side; then the three round terraces with their seventy-two latticed bell stupas, and the great stupa
# crowning it all; the lawns round it, palms, and people.
# Run: blender -b --factory-startup -P borobudur.py -- borobudur-1024.png 1024 borobudur.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(825)
M['andesite'] = material('andesite', '#77726a', 0.9, vary='#5f5b55', vary_scale=14, bump=0.3, bump_scale=200)
M['andesiteLight'] = material('andesiteLight', '#8c867c', 0.9, vary='#77716a', vary_scale=14, bump=0.3, bump_scale=200)
M['relief'] = masonry('reliefPanels', '#7c766d', '#5a5650', scale=60, rough=0.9, vary='#6f6a62')
M['lattice'] = chequer('stupaLattice', '#8a847a', '#2f2c29', scale=44.0, rough=0.85)
M['lawnB'] = material('borobudurLawn', '#6ea443', 0.85, vary='#7cb24e', vary_scale=12, bump=0.3, bump_scale=200)
M['pathB'] = material('borobudurPath', '#c9bfa8', 0.85, vary='#bdb39b', vary_scale=40)
M['palmTrunkB'] = material('palmTrunkB', '#a49a86', 0.8, vary='#968c78', vary_scale=40)
M['frondB'] = material('palmFrondB', '#4f8f36', 0.8, vary='#5c9c40', vary_scale=20)

S = 0.0158              # metres to the tile's units
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def stepped_square(h, d):
    """A square plan of half-width h with its corners stepped in twice by d (Borobudur's mandala)."""
    q = [(h, -h + 2 * d), (h, h - 2 * d), (h - d, h - 2 * d), (h - d, h - d), (h - 2 * d, h - d), (h - 2 * d, h)]
    pts = []
    for k in range(4):
        c, s_ = math.cos(k * math.pi / 2), math.sin(k * math.pi / 2)
        pts += [(x * c - y * s_, x * s_ + y * c) for x, y in q]
    return pts


def prism(name, mat, poly, z0, z1):
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x, y, z1)) for x, y in poly], [bm.verts.new(P(x, y, z0)) for x, y in poly])
    return finish(name, bm, mat, smooth_sides=False)


def balustrade(name, poly, z, h, t):
    """A wall along every edge of a stepped plan, just inside it (axis-aligned pieces)."""
    pts = []
    for (xa, ya), (xb, yb) in zip(poly, poly[1:] + poly[:1]):
        x0, x1, y0, y1 = min(xa, xb), max(xa, xb), min(ya, yb), max(ya, yb)
        if x0 == x1:
            inward = -1 if x0 > 0 else 1
            x0, x1 = sorted((x0, x0 + inward * t))
        else:
            inward = -1 if y0 > 0 else 1
            y0, y1 = sorted((y0, y0 + inward * t))
        box(f'{name}{len(pts)}', M['andesiteLight'], P((x0 + x1) / 2, (y0 + y1) / 2, z + h / 2), ((x1 - x0) * S, (y1 - y0) * S, h * S), bevel=0)
        length = max(x1 - x0, y1 - y0)
        n = int(length / 3.4)
        for k in range(n):
            f = (k + 0.5) / n
            pts.append(((x0 + x1) / 2 if x1 - x0 < y1 - y0 else x0 + f * (x1 - x0), (y0 + y1) / 2 if y1 - y0 < x1 - x0 else y0 + f * (y1 - y0), z + h))
    return pts


def instance(name, data, at, scale=1.0):
    ob = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(at) @ Matrix.Scale(scale, 4)
    return ob


BEFORE = set(bpy.data.objects)
slab('lawn', M['lawnB'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
for k in range(4):
    c, s_ = math.cos(k * math.pi / 2), math.sin(k * math.pi / 2)
    poly = [(x * c - y * s_, x * s_ + y * c) for x, y in ((-3.0, -100.0), (3.0, -100.0), (3.0, -62.0), (-3.0, -62.0))]
    slab(f'path{k}', M['pathB'], [(x * S, y * S) for x, y in poly], Z0, Z0 + 0.1 * S, margin=0.02)

# ------------------------------------------------------------------ the foot and the five square terraces, their balustrades with little stupas
LEVELS = [(62.0, 5.0, 0.0, 4.0), (54.0, 4.6, 4.0, 8.6), (47.0, 4.0, 8.6, 12.8), (40.5, 3.5, 12.8, 16.6), (34.5, 3.0, 16.6, 20.0), (29.0, 2.6, 20.0, 23.0)]
FINIALS = []
for k, (h, d, z0, z1) in enumerate(LEVELS):
    poly = stepped_square(h, d)
    prism(f'terrace{k}', M['relief'] if 0 < k < 5 else M['andesite'], poly, z0 - (0.3 if k == 0 else 0.0), z1)
    prism(f'terraceCap{k}', M['andesiteLight'], stepped_square(h + 0.4, d), z1 - 0.5, z1 + 0.06)     # its top above the terrace's: no faces in one plane
    if k < 5:
        FINIALS += balustrade(f'balustrade{k}_', stepped_square(h - 0.2, d), z1 + 0.06, 1.6, 1.0)
# the stairs up the middle of every side
for k in range(4):
    c, s_ = math.cos(k * math.pi / 2), math.sin(k * math.pi / 2)
    rot = Matrix.Rotation(k * math.pi / 2, 4, 'Z')
    for j in range(23):
        y0 = -64.0 + j * 1.54
        z1 = (j + 1) * 1.0
        if z1 > 23.0:
            break
        m = rot @ Matrix.Translation(((0.0) * S, (y0 + 0.77) * S, Z0 + (z1 - 0.5) * S))
        box_m(f'stair{k}_{j}', M['andesiteLight'], m, (4.2 * S, 1.54 * S, 1.0 * S))
    for side in (-1, 1):
        bm = bmesh.new()
        sec = [(-64.0, 0.0), (-64.0, 1.6), (-64.0 + 22 * 1.54, 23.6), (-64.0 + 22 * 1.54, 22.0)]
        a = [bm.verts.new(rot @ P(side * 2.1, y, z)) for y, z in sec]
        b = [bm.verts.new(rot @ P(side * 2.9, y, z)) for y, z in sec]
        add_prism(bm, a, b)
        finish(f'stairWall{k}{side}', bm, M['andesite'], smooth_sides=False)
# the little stupas on the balustrades
fin = lathe('finialSource', M['andesiteLight'], [(0.6 * S, 0.0), (0.7 * S, 0.3 * S), (0.55 * S, 0.9 * S), (0.2 * S, 1.3 * S), (0.08 * S, 1.9 * S), (0.0, 2.1 * S)], (0, 0, 0), segs=10)
fin_data = fin.data
bpy.data.objects.remove(fin, do_unlink=True)
for k, (x, y, z) in enumerate(FINIALS):
    instance(f'finial{k}', fin_data, P(x, y, z))

# ------------------------------------------------------------------ the three round terraces and their seventy-two latticed stupas, the great stupa
stupa = lathe('stupaSource', M['lattice'], [(1.75 * S, 0.0), (1.8 * S, 0.8 * S), (1.55 * S, 2.0 * S), (1.0 * S, 2.8 * S), (0.35 * S, 3.1 * S), (0.0, 3.15 * S)], (0, 0, 0.7 * S), segs=24, smooth=True)
stupa_base = lathe('stupaBaseSource', M['andesite'], [(1.95 * S, 0.0), (1.95 * S, 0.5 * S), (1.75 * S, 0.7 * S)], (0, 0, 0), segs=24)
stupa_top = box('stupaTopSource', M['andesite'], (0, 0, 4.15 * S), (0.9 * S, 0.9 * S, 0.8 * S), bevel=0)
stupa_spire = lathe('stupaSpireSource', M['andesite'], [(0.3 * S, 0.0), (0.12 * S, 1.2 * S), (0.0, 1.5 * S)], (0, 0, 4.55 * S), segs=8)
SOURCES = [stupa, stupa_base, stupa_top, stupa_spire]
for k, (r_ring, r_stupas, n, z0, z1) in enumerate(((27.0, 24.0, 32, 23.0, 24.6), (20.8, 17.8, 24, 24.6, 26.2), (14.6, 11.8, 16, 26.2, 27.8))):
    cylinder(f'ring{k}', M['andesiteLight'], r_ring * S, (z1 - z0) * S, P(0, 0, z0), segs=96)
    annulus(f'ringRail{k}', M['andesite'], r_ring * S, (r_ring - 0.8) * S, Z0 + z1 * S, Z0 + (z1 + 1.0) * S, segs=96)
    for j in range(n):
        a = 2 * math.pi * (j + 0.5) / n
        at = P(r_stupas * math.cos(a), r_stupas * math.sin(a), z1)
        for src in SOURCES:
            instance(f'stupa{k}_{j}_{src.name}', src.data, at)
for src in SOURCES:
    bpy.data.objects.remove(src, do_unlink=True)
lathe('mainBase', M['andesiteLight'], [(8.6 * S, 0.0), (8.6 * S, 1.0 * S), (7.8 * S, 1.6 * S), (7.6 * S, 2.2 * S)], P(0, 0, 27.8), segs=64)
lathe('mainStupa', M['andesite'], [(7.4 * S, 0.0), (7.6 * S, 1.6 * S), (6.8 * S, 4.4 * S), (5.0 * S, 6.6 * S), (2.6 * S, 7.8 * S), (0.0, 8.1 * S)], P(0, 0, 30.0), segs=64, smooth=True)
box('mainHarmika', M['andesiteLight'], P(0, 0, 38.6), (2.6 * S, 2.6 * S, 1.6 * S), bevel=0)
lathe('mainSpire', M['andesite'], [(0.9 * S, 0.0), (0.7 * S, 1.6 * S), (0.3 * S, 4.0 * S), (0.0, 4.8 * S)], P(0, 0, 39.4), segs=16)

# ------------------------------------------------------------------ palms round the lawns, people
for j in range(14):
    a = 2 * math.pi * (j + 0.5) / 14 + 0.2
    x, y = 80.0 * math.cos(a), 80.0 * math.sin(a)
    if abs(x) < 10.0 or abs(y) < 10.0:
        continue
    h = rng.uniform(12.0, 15.0)
    lathe(f'palm{j}', M['palmTrunkB'], [(0.5 * S, 0.0), (0.4 * S, h * 0.5 * S), (0.38 * S, h * S)], P(x, y, 0.0), segs=10, smooth=True)
    for f in range(8):
        b = 2 * math.pi * f / 8 + j
        tube(f'frond{j}{f}', M['frondB'], [P(x, y, h), P(x + 2.2 * math.cos(b), y + 2.2 * math.sin(b), h + 0.7), P(x + 4.0 * math.cos(b), y + 4.0 * math.sin(b), h - 1.3)], 0.32 * S)
for k, (x, y, z, shirt) in enumerate(((0.0, -70.0, 0.0, 'red'), (2.0, -80.0, 0.0, 'blue'), (-1.5, -55.0, 8.6, 'yellow'), (30.0, -45.0, 12.8, 'green'), (-20.0, -38.0, 16.6, 'red'), (8.0, -26.0, 23.0, 'blue'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z + 0.06 * S, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('borobudur')
