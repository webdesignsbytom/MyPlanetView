# The Forbidden City in the high-quality look (hq.py): its heart, the Hall of Supreme Harmony, drawn to
# its real proportions (laid out in metres): eleven bays of red columns and gilded lattice doors under
# the painted brackets, the double-eaved hipped roof of yellow glazed tiles curving up at its corners,
# its tile rolls, ridges and dragon finials; the three tiers of white marble terrace with their carved
# balustrades, the stairs and the dragon carving up the middle, the bronze vats; the great courtyard's
# bricks and the imperial way across them, the long red galleries either side under their yellow roofs,
# and people.
# Run: blender -b --factory-startup -P forbidden-city.py -- forbidden-city-1024.png 1024 forbidden-city.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1420)
M['qMarble'] = material('fcMarble', '#f1ede4', 0.4, vary='#e5dfd2', vary_scale=18, bump=0.06, bump_scale=120, sss=0.03)
M['qMarbleShade'] = material('fcMarbleShade', '#ddd6c9', 0.45, vary='#d0c9bb', vary_scale=18, bump=0.06, bump_scale=120)
M['lacquer'] = material('fcLacquer', '#a3232a', 0.35, vary='#902027', vary_scale=20, coat=0.4)
M['gilt'] = material('fcGilt', '#b48632', 0.4, metallic=0.5)
M['dougong'] = striped('fcDougong', ['#1e6f90', '#2f8a58', '#e2b33d', '#1e6f90', '#3a5fa8', '#2f8a58'], 'Z', 140.0, rough=0.45)
M['yellowTile'] = banded(material('yellowTile', '#e0a821', 0.25, vary='#d29a1a', vary_scale=10, coat=0.6), 'Z', 140.0, strength=0.45)
M['courtBrick'] = masonry('fcCourtBrick', '#a7a199', '#827d76', scale=90, rough=0.85, vary='#9b958c')
M['imperialWay'] = masonry('imperialWay', '#d9d3c6', '#b5ae9f', scale=40, rough=0.7, vary='#cec7b9')
M['bronzeVat'] = material('bronzeVat', '#6d5530', 0.4, vary='#5d4828', vary_scale=20, metallic=0.85)

S = 0.0215              # metres to the tile's units
Z0 = G + 0.006          # the courtyard
HY = 0.22               # the hall's middle, a little back so the courtyard shows


def P(x, y, z):
    return Vector((x * S, HY + y * S, Z0 + z * S))


# ------------------------------------------------------------------ the courtyard, the imperial way, the galleries
slab('courtyard', M['courtBrick'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.04)
slab('imperialWay', M['imperialWay'], rect(0, -1.0, 0.2, 1.2), Z0 - 0.002, Z0 + 0.0025, margin=0.04)
for sx in (-1, 1):      # the long galleries either side: red walls under yellow tiled roofs
    gx = sx * 1.24
    box(f'gallery{sx}', M['lacquer'], (gx, 0.0, Z0 + 0.06), (0.1, 1.3, 0.12), bevel=0.002)
    box(f'galleryBase{sx}', M['qMarbleShade'], (gx, 0.0, Z0 + 0.008), (0.13, 1.33, 0.016), bevel=0.001)
    gable_roof(f'galleryRoof{sx}', M['yellowTile'], gx - 0.075, gx + 0.075, -0.67, 0.67, Z0 + 0.12, 0.06, over=0.01, along='y')
    box(f'galleryBrackets{sx}', M['dougong'], (gx, 0.0, Z0 + 0.112), (0.112, 1.31, 0.014), bevel=0)


def roof_point(t, edge, u, w, d, ridge, h, z0, kick):
    """A point on a Chinese hipped roof: t from the eave (0) to the ridge (1); edge 0..3 (front, right,
    back, left); u along that edge, -1 to 1. Its slopes curve hollow and its corners turn up."""
    hw = w / 2 - (w / 2 - ridge / 2) * t
    hd = max(0.3, d / 2 * (1 - t))
    z = z0 + h * t ** 1.55 + kick * (1 - t) ** 3 * abs(u) ** 3
    if edge == 0:
        return Vector((u * hw, -hd, z))
    if edge == 1:
        return Vector((hw, u * hd, z))
    if edge == 2:
        return Vector((-u * hw, hd, z))
    return Vector((-hw, -u * hd, z))


def cn_roof(name, cx, cy, z0, w, d, ridge, h, kick):
    """The roof's tiled surface, its tile rolls and its ridges, in metres about (cx, cy)."""
    NU, NT = 16, 14
    bm = bmesh.new()
    rings = []
    for i in range(NT + 1):
        t = i / NT
        ring = []
        for e in range(4):
            for j in range(NU):
                u = -1 + 2 * j / NU
                q = roof_point(t, e, u, w, d, ridge, h, z0, kick)
                ring.append(bm.verts.new(P(cx + q.x, cy + q.y, q.z)))
        rings.append(ring)
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
    bm.faces.new(list(reversed(rings[0])))
    finish(name, bm, M['yellowTile'], smooth_all=True)
    # tile rolls down each slope
    rolls = bmesh.new()
    for e in range(4):
        count = int((w if e % 2 == 0 else d) / 1.4)
        for j in range(count):
            u = -0.97 + 1.94 * (j + 0.5) / count
            pts = [roof_point(i / 10, e, u, w, d, ridge, h, z0 + 0.25, kick) for i in range(11)]
            for p0, p1 in zip(pts, pts[1:]):
                if (e % 2 == 1 and abs(p0.y) < 0.4) or (e % 2 == 0 and p0.y == p1.y):
                    continue
                a, b = P(cx + p0.x, cy + p0.y, p0.z), P(cx + p1.x, cy + p1.y, p1.z)
                dv = b - a
                if dv.length < 1e-6:
                    continue
                rot = dv.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
                bmesh.ops.create_cone(rolls, cap_ends=True, segments=6, radius1=0.22 * S, radius2=0.22 * S, depth=dv.length, matrix=Matrix.Translation((a + b) / 2) @ rot)
    finish(name + 'Rolls', rolls, M['yellowTile'], smooth_all=True)
    # the main ridge, the four hip ridges and the dragon finials at the ridge's ends
    top = z0 + h
    box(name + 'Ridge', M['yellowTile'], P(cx, cy, top + 0.6), (ridge * S, 1.0 * S, 1.6 * S), bevel=0.001)
    for sx in (-1, 1):
        for sy in (-1, 1):
            a = roof_point(0.0, 1 if sx > 0 else 3, sy * (1 if sx > 0 else -1), w, d, ridge, h, z0 + 0.5, kick)
            b = Vector((sx * ridge / 2, 0, top + 0.5))
            tube(f'{name}Hip{sx}{sy}', M['yellowTile'], [P(cx + a.x + (b.x - a.x) * k / 8, cy + a.y + (b.y - a.y) * k / 8, a.z + (b.z - a.z) * (k / 8) ** 1.55 + kick * (1 - k / 8) ** 3) for k in range(9)], 0.5 * S)
        lathe(f'{name}Chiwen{sx}', M['yellowTile'], [(r * S, z * S) for r, z in ((0.9, 0), (1.0, 1.5), (0.7, 3.0), (1.1, 3.4), (0.0, 3.6))], P(cx + sx * ridge / 2, cy, top + 1.2), segs=8, smooth=True, sy=0.5)


def body(name, cx, cy, z0, z1, w, d, bays_w, bays_d):
    """Red columns round the hall, red walls, and gilded lattice doors in the front bays."""
    box(name + 'Wall', M['lacquer'], P(cx, cy, (z0 + z1) / 2), ((w - 1.6) * S, (d - 1.6) * S, (z1 - z0) * S), bevel=0)
    cols, gold = bmesh.new(), bmesh.new()
    for i in range(bays_w + 1):
        x = -w / 2 + w * i / bays_w
        for y in (-d / 2, d / 2):
            bmesh.ops.create_cone(cols, cap_ends=True, segments=12, radius1=0.55 * S, radius2=0.5 * S, depth=(z1 - z0) * S, matrix=Matrix.Translation(P(cx + x, cy + y, (z0 + z1) / 2)))
    for j in range(1, bays_d):
        y = -d / 2 + d * j / bays_d
        for x in (-w / 2, w / 2):
            bmesh.ops.create_cone(cols, cap_ends=True, segments=12, radius1=0.55 * S, radius2=0.5 * S, depth=(z1 - z0) * S, matrix=Matrix.Translation(P(cx + x, cy + y, (z0 + z1) / 2)))
    finish(name + 'Columns', cols, M['lacquer'], smooth_all=True)
    # each front bay: a gilded frame round a lattice of bars
    bw = w / bays_w
    for i in range(bays_w):
        x = -w / 2 + bw * (i + 0.5)
        f0 = P(cx + x, cy - d / 2 + 0.75, z0 + 0.4)
        hh, ww = (z1 - z0) - 2.6, bw - 1.3
        for u in (-ww / 2, ww / 2):
            bmesh.ops.create_cube(gold, size=1.0, matrix=Matrix.Translation(f0 + Vector((u * S, 0, hh / 2 * S))) @ Matrix.Diagonal((0.25 * S, 0.2 * S, hh * S, 1)))
        for zz in (0.0, hh * 0.45, hh):
            bmesh.ops.create_cube(gold, size=1.0, matrix=Matrix.Translation(f0 + Vector((0, 0, zz * S))) @ Matrix.Diagonal((ww * S, 0.2 * S, 0.25 * S, 1)))
        for j in range(1, 6):
            bmesh.ops.create_cube(gold, size=1.0, matrix=Matrix.Translation(f0 + Vector(((-ww / 2 + ww * j / 6) * S, 0, hh * 0.725 * S))) @ Matrix.Diagonal((0.1 * S, 0.12 * S, hh * 0.55 * S, 1)))
        for j in range(1, 5):
            bmesh.ops.create_cube(gold, size=1.0, matrix=Matrix.Translation(f0 + Vector((0, 0, (hh * 0.45 + hh * 0.55 * j / 5) * S))) @ Matrix.Diagonal((ww * S, 0.12 * S, 0.1 * S, 1)))
    finish(name + 'Lattice', gold, M['gilt'], smooth_sides=False)
    box(name + 'Brackets', M['dougong'], P(cx, cy, z1 + 0.3), ((w + 1.5) * S, (d + 1.5) * S, 2.2 * S), bevel=0)


# ------------------------------------------------------------------ the three-tiered marble terrace
TIERS = [(92.0, 66.0, 0.0, 2.7), (86.0, 60.0, 2.7, 5.4), (80.0, 54.0, 5.4, 8.1)]
POSTS, PANELS = bmesh.new(), bmesh.new()
for i, (w, d, z0, z1) in enumerate(TIERS):
    box(f'tier{i}', M['qMarble'], P(0, 0, (z0 + z1) / 2 - 0.05), ((w - 0.01 * i) * S, (d - 0.01 * i) * S, (z1 - z0 + 0.1) * S), bevel=0.002)
    box(f'tierLip{i}', M['qMarbleShade'], P(0, 0, z1 - 0.3), ((w + 0.5) * S, (d + 0.5) * S, 0.5 * S), bevel=0.001)
    # the balustrade round the tier's edge, broken at the front stairs
    for e in range(4):
        L = w if e % 2 == 0 else d
        n = int(L / 2.0)
        for k in range(n + 1):
            u = -L / 2 + L * k / n
            x, y = (u, -d / 2 + 0.6) if e == 0 else ((w / 2 - 0.6, u) if e == 1 else ((u, d / 2 - 0.6) if e == 2 else (-w / 2 + 0.6, u)))
            if e == 0 and abs(x) < 12.5:
                continue
            bmesh.ops.create_cube(POSTS, size=1.0, matrix=Matrix.Translation(P(x, y, z1 + 0.6)) @ Matrix.Diagonal((0.32 * S, 0.32 * S, 1.2 * S, 1)))
            bmesh.ops.create_icosphere(POSTS, subdivisions=1, radius=0.24 * S, matrix=Matrix.Translation(P(x, y, z1 + 1.32)))
            if k < n:
                u2 = u + L / n / 2
                x2, y2 = (u2, y) if e % 2 == 0 else (x, u2)
                if e == 0 and abs(x2) < 12.5:
                    continue
                bmesh.ops.create_cube(PANELS, size=1.0, matrix=Matrix.Translation(P(x2, y2, z1 + 0.45)) @ Matrix.Diagonal(((L / n - 0.4) * S if e % 2 == 0 else 0.18 * S, 0.18 * S if e % 2 == 0 else (L / n - 0.4) * S, 0.8 * S, 1)))
    # the front stairs down to the tier below (or the courtyard), either side of the dragon carving
    below = TIERS[i - 1][1] / 2 if i else d / 2 + 7.0
    steps = 9
    for j in range(steps):
        y0 = d / 2 + (below - d / 2) * j / steps
        y1 = d / 2 + (below - d / 2) * (j + 1) / steps
        ztop = z1 - (z1 - z0) * (j + 0.5) / steps
        for sx in (-1, 1):
            box(f'stair{i}{j}{sx}', M['qMarble'], P(sx * 7.5, -(y0 + y1) / 2 + 0.3, (ztop + z0 - 0.05) / 2), ((9.0 - 0.04 * j) * S, (y1 - y0 + 0.6) * S, (ztop - z0 + 0.05) * S), bevel=0)
    c0, c1 = d / 2 - 0.3, below
    m = Matrix.Translation(P(0, -(c0 + c1) / 2, (z0 + z1) / 2 + 0.2)) @ Matrix.Rotation(math.atan2(z1 - z0, c1 - c0), 4, 'X')
    box_m(f'dragonCarving{i}', M['qMarbleShade'], m, (5.5 * S, math.hypot(c1 - c0, z1 - z0) * S, 0.4 * S), bevel=0.001)
finish('balusterPosts', POSTS, M['qMarble'], smooth_sides=False)
finish('balusterPanels', PANELS, M['qMarbleShade'], smooth_sides=False)
ZT = TIERS[-1][3]
for sx in (-1, 1):          # the bronze vats on the terrace
    for y in (-24.0, 22.0):
        lathe(f'vat{sx}{y}', M['bronzeVat'], [(r * S, z * S) for r, z in ((1.2, 0), (1.6, 0.4), (1.8, 1.4), (1.7, 2.0), (1.8, 2.1), (0.0, 2.1))], P(sx * 36.0, y, ZT), segs=24, smooth=True)

# ------------------------------------------------------------------ the hall
W, D = 60.0, 33.0
box('hallPlinth', M['qMarbleShade'], P(0, 0, ZT + 0.6), ((W + 4) * S, (D + 4) * S, 1.2 * S), bevel=0.001)
body('hall', 0, 0, ZT + 1.2, ZT + 12.5, W, D, 11, 5)
cn_roof('lowerRoof', 0, 0, ZT + 12.8, W + 12, D + 12, W - 6, 4.0, 1.6)
box('upperBody', M['lacquer'], P(0, 0, ZT + 17.0), ((W - 8) * S, (D - 8) * S, 6.0 * S), bevel=0)
box('upperBrackets', M['dougong'], P(0, 0, ZT + 19.6), ((W - 6) * S, (D - 6) * S, 2.0 * S), bevel=0)
cn_roof('upperRoof', 0, 0, ZT + 20.4, W + 6, D + 6, 40.0, 10.5, 2.0)

for k, (x, y, shirt) in enumerate(((-0.3, -1.2, 'red'), (0.05, -1.3, 'blue'), (0.3, -1.15, 'yellow'), (-0.6, -1.0, 'green'), (0.65, -1.05, 'red'), (0.1, -0.95, 'blue'), (-0.15, -1.38, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0)

render('forbidden-city')
