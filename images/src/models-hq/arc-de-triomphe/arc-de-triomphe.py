# The Arc de Triomphe in the high-quality look (hq.py): the great arch in the middle of the Étoile,
# open through its tall central vault and its side arches, with its four sculpted groups, reliefs,
# frieze, cornice and attic (the scanned arch in _sources/arc-de-triomphe/, HoangHiepVu, CC BY 4.0,
# given the diorama's limestone), the Tomb of the Unknown Soldier's flame under the vault; its island
# of grey granite ringed by stone bollards and chains; the cobbled roundabout full of traffic going
# round; the twelve avenues leading off, the Champs-Élysées the widest, with their crossings and rows
# of trees; and between them the Hôtels des Maréchaux, cream stone under zinc mansard roofs, with
# their gardens behind; and people.
# Run: blender -b --factory-startup -P arc-de-triomphe.py -- arc-de-triomphe-1024.png 1024 arc-de-triomphe.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1836)
M['arc'] = material('arcStone', '#e6dcc6', 0.6, vary='#d8ccb3', vary_scale=22, bump=0.12, bump_scale=150)
M['islandSetts'] = masonry('islandSetts', '#aaa59c', '#7d786f', scale=90, rough=0.8, vary='#9d978d')
M['roundSetts'] = masonry('roundSetts', '#7c7872', '#57534e', scale=150, rough=0.85, vary='#716d67')
M['asphalt'] = material('asphalt', '#55545a', 0.8, vary='#4b4a50', vary_scale=40, bump=0.1, bump_scale=300)
M['kerb'] = material('kerb', '#c9c3b6', 0.6, vary='#bab3a5', vary_scale=30, bump=0.1, bump_scale=200)
M['hotelStone'] = material('hotelStone', '#ebe1cb', 0.6, vary='#ddd1b8', vary_scale=20, bump=0.1, bump_scale=160)
M['zinc'] = material('zinc', '#7e8b98', 0.45, vary='#72808d', vary_scale=14, bump=0.08, bump_scale=220, metallic=0.3)
M['iron'] = material('ironBlack', '#2c2d30', 0.5, metallic=0.5)
M['flame'] = material('flame', '#f2b23a', 0.3, emission=('#ffb43a', 3.0))
M['silver'] = material('carSilver', '#b9bcc0', 0.35, metallic=0.4, coat=0.5)
M['black'] = material('carBlack', '#2a2b2e', 0.35, coat=0.5)
M['tyre'] = material('tyre', '#1f1f21', 0.7)
M['busRed'] = material('busRed', '#c8261e', 0.35, coat=0.5)
OPEN = []

RI = 0.7            # the island's edge
RR = 1.0            # the roundabout's outer edge
ZI = G + 0.012      # the island's top
ZR = G + 0.004      # the roundabout's top
ZA = G + 0.005      # the avenues' top
ZP = G + 0.009      # the pavements' top
# the twelve avenues: the Champs-Élysées towards the camera, the Grande Armée behind
AVENUES = [(math.radians(-90 + 30 * k), 0.2 if k == 0 else (0.17 if k == 6 else 0.12)) for k in range(12)]


def wedge(k, r0, r1, ins, n=14):
    """The ground between avenue k and the next, from radius r0 to r1, kept `ins` back from both roads."""
    a0, w0 = AVENUES[k]
    a1, w1 = AVENUES[(k + 1) % 12]
    if a1 < a0:
        a1 += 2 * math.pi
    lo = lambda r: a0 + math.asin(min(1.0, (w0 / 2 + ins) / r))
    hi = lambda r: a1 - math.asin(min(1.0, (w1 / 2 + ins) / r))
    inner = [(r0 * math.cos(t), r0 * math.sin(t)) for t in (lo(r0) + (hi(r0) - lo(r0)) * j / n for j in range(n + 1))]
    outer = [(r1 * math.cos(t), r1 * math.sin(t)) for t in (hi(r1) + (lo(r1) - hi(r1)) * j / n for j in range(n + 1))]
    return inner + outer


def prism(name, mat, poly, z0, z1, top=None, bevel=0.0):
    """An upright solid from a polygon (its top another polygon of as many points, for a roof's slope)."""
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new((x, y, z0)) for x, y in poly], [bm.verts.new((x, y, z1)) for x, y in (top or poly)])
    return finish(name, bm, mat, bevel=bevel, smooth_sides=False)


# ------------------------------------------------------------------ the island, its bollards and chains
cylinder('island', M['islandSetts'], RI, ZI - G + 0.004, (0, 0, G - 0.004), segs=128)
annulus('islandKerb', M['kerb'], RI + 0.012, RI - 0.004, G - 0.003, ZI + 0.002, segs=128)
NB = 56
posts = []
for k in range(NB):
    a = 2 * math.pi * (k + 0.5) / NB
    x, y = (RI - 0.035) * math.cos(a), (RI - 0.035) * math.sin(a)
    posts.append((x, y))
    lathe(f'bollard{k}', M['kerb'], [(0.007, 0), (0.007, 0.024), (0.0085, 0.027), (0.0, 0.031)], (x, y, ZI - 0.001), segs=10, smooth=True)
for k in range(NB):
    (x0, y0), (x1, y1) = posts[k], posts[(k + 1) % NB]
    pts = [(x0 + (x1 - x0) * j / 6, y0 + (y1 - y0) * j / 6, ZI + 0.022 - 0.008 * math.sin(math.pi * j / 6)) for j in range(7)]
    tube(f'chain{k}', M['iron'], pts, 0.0014)

# ------------------------------------------------------------------ the roundabout and its traffic
cylinder('roundabout', M['roundSetts'], RR, ZR - G + 0.004, (0, 0, G - 0.004), segs=160)


def car(name, x, y, heading, colour, z=ZR, k=1.3):
    m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(heading, 4, 'Z') @ Matrix.Scale(k, 4)
    box_m(name, M[colour], m @ Matrix.Translation((0, 0, 0.011)), (0.052, 0.024, 0.012), bevel=0.004)
    box_m(name + 'Cabin', M['glass'], m @ Matrix.Translation((-0.004, 0, 0.02)), (0.028, 0.021, 0.011), bevel=0.003)
    box_m(name + 'Roof', M[colour], m @ Matrix.Translation((-0.004, 0, 0.0262)), (0.024, 0.019, 0.003), bevel=0.001)
    for u in (-0.017, 0.017):
        for v in (-0.0115, 0.0115):
            cylinder(name + f'Wheel{u}{v}', M['tyre'], 0.0055, 0.004, (0, 0, -0.002), segs=12,
                     matrix=m @ Matrix.Translation((u, v, 0.0055)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


placed = []
a = math.radians(205)
BUS = (0.86 * math.cos(a), 0.86 * math.sin(a), a)
COLOURS = ('white', 'silver', 'black', 'blue', 'red', 'silver', 'white', 'black', 'denim', 'yellow')
for lane, (r, n) in enumerate(((0.765, 14), (0.83, 16), (0.895, 17), (0.955, 18))):
    for j in range(n):
        a = 2 * math.pi * (j + rng.uniform(-0.25, 0.25) + 0.37 * lane) / n
        x, y = r * math.cos(a), r * math.sin(a)
        if any(math.hypot(x - px, y - py) < 0.085 for px, py in placed) or math.hypot(x - BUS[0], y - BUS[1]) < 0.13:
            continue
        placed.append((x, y))
        # anticlockwise, as the traffic goes round the Étoile
        car(f'car{lane}_{j}', x, y, a + math.pi / 2 + rng.uniform(-0.08, 0.08), rng.choice(COLOURS))
# an open-top sightseeing bus
m = Matrix.Translation((BUS[0], BUS[1], ZR)) @ Matrix.Rotation(BUS[2] + math.pi / 2, 4, 'Z')
box_m('bus', M['busRed'], m @ Matrix.Translation((0, 0, 0.03)), (0.15, 0.04, 0.05), bevel=0.005)
for s in (-1, 1):
    box_m(f'busWindows{s}', M['glass'], m @ Matrix.Translation((0, s * 0.0202, 0.035)), (0.135, 0.002, 0.018))
    box_m(f'busRail{s}', M['busRed'], m @ Matrix.Translation((0, s * 0.019, 0.06)), (0.145, 0.002, 0.01))

# ------------------------------------------------------------------ the avenues, their pavements, crossings and trees
for k, (a, w) in enumerate(AVENUES):
    c, s = math.cos(a), math.sin(a)
    slab(f'avenue{k}', M['asphalt'], rect(1.4 * c, 1.4 * s, 0.8, w, rot=a), G - 0.004, ZA, margin=0.03)   # from the roundabout's edge out
    # the centre line's dashes, and a zebra crossing where the avenue meets the roundabout
    for j in range(5):
        r = 1.12 + j * 0.07
        if r < 1.43:
            box(f'dash{k}_{j}', M['white'], (r * c, r * s, ZA - 0.0005), (0.035, 0.005, 0.002), rot_z=a, bevel=0)
    for j in range(int(w / 0.022)):
        v = -w / 2 + 0.011 + j * 0.022
        box(f'zebra{k}_{j}', M['white'], (1.05 * c - v * s, 1.05 * s + v * c, ZA - 0.0005), (0.05, 0.011, 0.002), rot_z=a, bevel=0)
    for sd in (-1, 1):
        off = sd * (w / 2 + 0.034)
        for j in range(5):
            r = 1.1 + j * 0.085
            x, y = r * c - off * s, r * s + off * c
            if math.hypot(x, y) < 1.41:
                tree(f'avTree{k}_{sd}_{j}', x, y, h=0.15, r=0.045, z=ZP)
for k in range(12):
    slab(f'pavement{k}', M['paving'], wedge(k, RR - 0.004, 1.8, 0.0), G - 0.004, ZP, margin=0.03)
annulus('outerKerb', M['kerb'], RR + 0.006, RR - 0.006, G - 0.003, ZP + 0.001, segs=160)

# ------------------------------------------------------------------ the Hôtels des Maréchaux and their gardens
R0, R1 = 1.1, 1.3       # each hôtel's front, facing the arch, and back
HB, HM = 0.12, 0.055    # its walls' height and its mansard's
for k in range(12):
    poly = wedge(k, R0, R1, 0.075, n=10)
    prism(f'hotel{k}', M['hotelStone'], poly, ZP - 0.002, ZP + HB, bevel=0.002)
    prism(f'hotelPlinth{k}', M['kerb'], wedge(k, R0 - 0.004, R1 + 0.004, 0.071, n=10), ZP - 0.002, ZP + 0.02)
    prism(f'hotelCornice{k}', M['hotelStone'], wedge(k, R0 - 0.007, R1 + 0.007, 0.068, n=10), ZP + HB - 0.008, ZP + HB + 0.002)
    prism(f'hotelRoof{k}', M['zinc'], wedge(k, R0 - 0.002, R1 + 0.002, 0.073, n=10), ZP + HB + 0.002, ZP + HB + HM, top=wedge(k, R0 + 0.028, R1 - 0.028, 0.103, n=10))
    # windows on the front, round-headed below, tall with iron balconies above, and dormers in the roof
    a0, w0 = AVENUES[k]
    a1, w1 = AVENUES[(k + 1) % 12]
    if a1 < a0:
        a1 += 2 * math.pi
    t0 = a0 + math.asin((w0 / 2 + 0.075) / R0)
    t1 = a1 - math.asin((w1 / 2 + 0.075) / R0)
    n = max(3, int((t1 - t0) * R0 / 0.045))
    for j in range(n):
        t = t0 + (t1 - t0) * (j + 0.5) / n
        nx, ny = -math.cos(t), -math.sin(t)
        x, y = R0 * math.cos(t), R0 * math.sin(t)
        OPEN.append((x, y, ZP + 0.024, 0.02, 0.034, (nx, ny), 'round'))
        OPEN.append((x, y, ZP + 0.07, 0.018, 0.032, (nx, ny), 'rect'))
        box_m(f'balcony{k}_{j}', M['iron'], Matrix.Translation((x + nx * 0.004, y + ny * 0.004, ZP + 0.072)) @ Matrix.Rotation(t, 4, 'Z'), (0.004, 0.026, 0.009))
        if j % 2 == 0:
            rd = R0 + 0.014
            dx, dy = rd * math.cos(t), rd * math.sin(t)
            box_m(f'dormer{k}_{j}', M['hotelStone'], Matrix.Translation((dx, dy, ZP + HB + 0.024)) @ Matrix.Rotation(t, 4, 'Z'), (0.02, 0.018, 0.026), bevel=0.002)
            box_m(f'dormerCap{k}_{j}', M['zinc'], Matrix.Translation((dx, dy, ZP + HB + 0.039)) @ Matrix.Rotation(t, 4, 'Z'), (0.024, 0.022, 0.006), bevel=0.002)
            OPEN.append((dx + nx * 0.01, dy + ny * 0.01, ZP + HB + 0.014, 0.011, 0.016, (nx, ny), 'rect'))
    # windows down the sides, along the avenues
    for ta, wa, sd in ((a0, w0, 1), (a1, w1, -1)):
        c, s = math.cos(ta), math.sin(ta)
        off = sd * (wa / 2 + 0.075)
        nrm = (sd * s, -sd * c)
        for j in range(4):
            r = R0 + 0.03 + j * 0.047
            x, y = r * c - off * s, r * s + off * c
            OPEN.append((x, y, ZP + 0.026, 0.018, 0.03, nrm, 'rect'))
            OPEN.append((x, y, ZP + 0.07, 0.016, 0.03, nrm, 'rect'))
    # chimneys on the roof's flat top
    for j in (0.3, 0.7):
        t = t0 + (t1 - t0) * j
        r = (R0 + R1) / 2
        box_m(f'chimney{k}_{j}', M['hotelStone'], Matrix.Translation((r * math.cos(t), r * math.sin(t), ZP + HB + HM + 0.012)) @ Matrix.Rotation(t, 4, 'Z'), (0.05, 0.022, 0.03), bevel=0.002)
        for u in (-0.012, 0.0, 0.012):
            cylinder(f'pot{k}_{j}_{u}', M['terracotta'], 0.004, 0.01, (r * math.cos(t) + u * math.cos(t), r * math.sin(t) + u * math.sin(t), ZP + HB + HM + 0.027), segs=8)
    # the garden behind, with trees
    slab(f'garden{k}', M['lawn'], wedge(k, R1 + 0.03, 1.8, 0.075), ZP - 0.002, ZP + 0.003, margin=0.035)
    tm = (t0 + t1) / 2
    for j, (dt, r) in enumerate(((-0.05, 1.39), (0.06, 1.38))):
        tree(f'garden{k}Tree{j}', r * math.cos(tm + dt), r * math.sin(tm + dt), h=0.13, r=0.04, z=ZP + 0.003, mat='leafDark' if j else 'leaf')

# ------------------------------------------------------------------ the arch
SOURCE_TURN = 20.1      # turns the scan square: its wide faces then face -y and +y
SOURCE_CUT = 0.3        # the scan's own ground, in its metres, cut away
ARCH_W = 1.05           # the arch's width across its front
src = import_model('arc-de-triomphe', 'arch')
if src is not None:
    me = src.data
    me.transform(Matrix.Rotation(math.radians(SOURCE_TURN), 4, 'Z'))
    bm = bmesh.new()
    bm.from_mesh(me)
    zmin = min(v.co.z for v in bm.verts)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, zmin + SOURCE_CUT), plane_no=(0, 0, 1), clear_inner=True)
    bm.to_mesh(me)
    bm.free()
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    K = ARCH_W / (max(xs) - min(xs))
    me.transform(Matrix.Translation((0, 0, ZI - 0.002)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
    print('ARCH size', round(ARCH_W, 3), round((max(ys) - min(ys)) * K, 3), round((max(zs) - min(zs)) * K, 3))
    me.materials.clear()
    me.materials.append(M['arc'])
    for p in me.polygons:
        p.use_smooth = True
# the Tomb of the Unknown Soldier under the vault, and its flame
box('tomb', M['kerb'], (0, 0.03, ZI + 0.003), (0.05, 0.085, 0.006), bevel=0.002)
lathe('flameBowl', M['bronze'], [(0.0, 0), (0.012, 0.004), (0.014, 0.008), (0.0, 0.008)], (0, -0.04, ZI + 0.001), segs=16)
lathe('flame', M['flame'], [(0.0, 0), (0.008, 0.006), (0.006, 0.018), (0.0, 0.032)], (0, -0.04, ZI + 0.008), segs=12, smooth=True)

for k, (x, y, shirt) in enumerate(((-0.58, -0.12, 'red'), (0.6, 0.05, 'blue'), (0.28, -0.42, 'yellow'), (-0.3, -0.45, 'green'),
                                     (0.05, -0.16, 'red'), (-0.06, -0.2, 'blue'), (0.2, 0.44, 'green'), (-0.45, 0.38, 'yellow'),
                                     (0.12, -1.1, 'red'), (-0.98, 0.62, 'blue'), (1.02, -0.5, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=ZI if math.hypot(x, y) < RI else ZP)

windows('openings', M['glass'], OPEN, depth=0.008)
render('arc-de-triomphe')
