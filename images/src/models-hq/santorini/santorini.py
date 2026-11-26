# Santorini's Oia in the high-quality look (hq.py), laid out in metres (the cliff lowered): the rim of the
# caldera rising sheer from the deep blue Aegean, its volcanic strata banded red, brown, black and
# pumice white; the white cave houses stacked down its upper slopes, flat-roofed and barrel-vaulted,
# with blue doors; the blue-domed churches and their white bell walls on the edge; the windmills on the
# ridge at the end of the village; the path zigzagging down to the water, a sailing boat in the caldera;
# people.
# Run: blender -b --factory-startup -P santorini.py -- santorini-1024.png 1024 santorini.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1956)
M['strata'] = layered('calderaStrata', ['#7c4a39', '#5a4b45', '#a59784', '#8d5a3f', '#d3c7b1', '#6b3f33', '#4a403c'], scale=4.2, distortion=3.2, rough=0.9, bump=0.5, bump_scale=70, axis='Z', detail=4.0)
M['scrubS'] = material('cycladicScrub', '#b8a682', 0.95, vary='#a89571', vary_scale=14, bump=0.3, bump_scale=160)
M['whitewash'] = material('whitewash', '#f7f5f0', 0.6, vary='#efece4', vary_scale=30)
M['pastel'] = material('pastelHouse', '#efd9a8', 0.7, vary='#f2c9b8', vary_scale=4)
M['blueDome'] = material('cycladicBlue', '#2b63b5', 0.35, coat=0.3)
M['aegean'] = material('aegean', '#1c4f8c', 0.05, vary='#24609e', vary_scale=3, coat=0.7, bump=0.12, bump_scale=40)
M['millCap'] = material('millThatchS', '#8a6f4a', 0.9, vary='#7a613f', vary_scale=40, bump=0.4, bump_scale=200)
M['sailCloth'] = material('sailCloth', '#f2efe6', 0.8)

S = 0.0095              # metres to the tile's units
SEA = G + 0.002


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------------ the caldera's rim: sheer from the sea, easing at the top where the village sits
TOP = 0.46


def edge_y(x):
    return 0.12 + 0.06 * math.sin(2.6 * x + 0.5) + 0.03 * math.sin(6.1 * x)


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.2)
    e = edge_y(x)
    foot = e - 0.66
    if y < foot:
        h = 0.0
    elif y < e:
        t = (y - foot) / (e - foot)
        h = TOP * (1.0 - (1.0 - t) ** 1.7)
    else:
        h = TOP - (y - e) * 0.42
    return max(0.0, h) * rim


def pick(z, nz, x, y):
    if z < 0.004:
        return 0
    return 0 if (nz < 0.7 and y < edge_y(x) - 0.02) else 1


ground = terrain('caldera', H, [M['strata'], M['scrubS']], pick, rings=240, segs=600)
slab('aegean', M['aegean'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, SEA + 0.004, margin=0.02)


def GZ(x, y):
    return G + H(x, y)


# ------------------------------------------------------------------ the village: white cave houses down the upper slope and along the top
HOUSES, PASTEL, VAULTS = bmesh.new(), bmesh.new(), bmesh.new()
DOORS = []
CHURCHES = [-0.7, -0.15, 0.35, 0.62]
MILLS = [0.92, 1.03, 1.14]
y_lo = lambda x: edge_y(x) - 0.34
for gx in range(-17, 18):
    x = gx * 0.068 + rng.uniform(-0.01, 0.01)
    if x > 0.86 or math.hypot(x, 0.0) > 1.3:
        continue
    yy = y_lo(x)
    while yy < edge_y(x) + 0.16:
        w, d, h = rng.uniform(5.0, 8.5) * S, rng.uniform(5.0, 8.0) * S, rng.uniform(3.6, 5.6) * S
        if math.hypot(x, yy) > 1.32 or rng.random() < 0.22 or any(abs(x - cx) < 0.07 and abs(yy - edge_y(cx) + 0.02) < 0.07 for cx in CHURCHES):
            yy += d * 1.15
            continue
        front = GZ(x, yy - d / 2)
        back = GZ(x, yy + d / 2)
        z0 = min(front, back)
        top = max(front, back) + h * 0.6 if back > front else z0 + h
        bm = PASTEL if rng.random() < 0.08 else HOUSES
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x + rng.uniform(-0.002, 0.002), yy, (z0 - 0.01 + top) / 2)) @ Matrix.Diagonal((w, d, top - z0 + 0.01, 1)))
        if rng.random() < 0.4:
            bmesh.ops.create_cone(VAULTS, cap_ends=True, segments=10, radius1=w * 0.48, radius2=w * 0.48, depth=d * 0.98,
                                  matrix=Matrix.Translation((x, yy, top)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        if rng.random() < 0.55:
            DOORS.append((x, yy - d / 2 - 0.0004, z0 + 0.2 * S if back <= front else front + 0.1 * S, 1.1 * S, 2.0 * S, (0, -1), 'round'))
        yy += d * rng.uniform(1.05, 1.3)
finish('houses', HOUSES, M['whitewash'], bevel=0.0012, segments=2, smooth_sides=False)
finish('pastelHouses', PASTEL, M['pastel'], bevel=0.0012, segments=2, smooth_sides=False)
finish('vaults', VAULTS, M['whitewash'], smooth_all=True)
glazed('doors', DOORS, M['whitewash'], glass=M['blueDome'], depth=0.3 * S, bars=False)

# ------------------------------------------------------------------ the blue-domed churches and their bell walls on the edge
for k, cx in enumerate(CHURCHES):
    cy = edge_y(cx) - 0.02
    z0 = min(GZ(cx, cy - 0.03), GZ(cx, cy + 0.03))
    z1 = max(GZ(cx, cy - 0.03), GZ(cx, cy + 0.03))
    box(f'church{k}', M['whitewash'], Vector((cx, cy, (z0 + z1) / 2 + 3.5 * S)), (9.0 * S, 13.0 * S, z1 - z0 + 7.0 * S), bevel=0.001)
    top = z1 + 7.0 * S
    cylinder(f'church{k}Drum', M['whitewash'], 3.2 * S, 2.0 * S, (cx, cy + 1.0 * S, top - 0.2 * S), segs=24)
    lathe(f'church{k}Dome', M['blueDome'], [(r * S, z * S) for r, z in ((3.4, 0.0), (3.2, 1.4), (2.2, 3.0), (0.0, 3.8))], (cx, cy + 1.0 * S, top + 1.7 * S), segs=24, smooth=True)
    cylinder(f'church{k}Cross', M['iron'], 0.1 * S, 1.6 * S, (cx, cy + 1.0 * S, top + 5.4 * S), segs=6)
    bell = Vector((cx + 4.8 * S, cy - 4.0 * S, top))
    box(f'belfry{k}', M['whitewash'], bell + Vector((0, 0, 2.6 * S)), (4.0 * S, 1.0 * S, 5.2 * S), bevel=0.0008)
    glazed(f'belfry{k}Arches', [(bell.x + u * S, bell.y - 0.52 * S, bell.z + 1.8 * S, 1.1 * S, 2.2 * S, (0, -1), 'round') for u in (-1.0, 1.0)], M['whitewash'], glass=M['blueDome'], depth=0.2 * S)
    cylinder(f'belfry{k}Cross', M['iron'], 0.08 * S, 1.2 * S, (bell.x, bell.y, bell.z + 5.2 * S), segs=6)

# ------------------------------------------------------------------ the windmills on the ridge at the end of the village
for k, mx in enumerate(MILLS):
    my = edge_y(mx) + 0.05
    if math.hypot(mx, my) > 1.3:
        continue
    z0 = GZ(mx, my) - 0.01
    cylinder(f'mill{k}', M['whitewash'], 4.2 * S, 0.01 + 9.0 * S, (mx, my, z0), segs=20, r2=3.8 * S)
    lathe(f'mill{k}Cap', M['millCap'], [(4.2 * S, 0.0), (2.8 * S, 2.2 * S), (0.0, 4.0 * S)], (mx, my, z0 + 0.01 + 8.9 * S), segs=20, smooth=True)
    hub = Vector((mx, my - 4.2 * S, z0 + 0.01 + 9.8 * S))
    face = Matrix.Translation(hub) @ Matrix.Rotation(math.radians(-32.0), 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X')
    SAIL = bmesh.new()
    for j in range(8):
        a = 2 * math.pi * j / 8 + k * 0.3
        tip = Vector((math.cos(a) * 9.0 * S, math.sin(a) * 9.0 * S, 0))
        bar(f'mill{k}Spar{j}', M['trunk'], face @ Vector((0, 0, 0)), face @ tip, 0.16 * S)
        b = Vector((math.cos(a + 0.42) * 7.2 * S, math.sin(a + 0.42) * 7.2 * S, 0))
        m_ = Vector((math.cos(a) * 1.4 * S, math.sin(a) * 1.4 * S, 0))
        v = [SAIL.verts.new(face @ p) for p in (m_, tip, b)]
        SAIL.faces.new(v)
    finish(f'mill{k}Sails', SAIL, M['sailCloth'], smooth_sides=False)

# ------------------------------------------------------------------ the path down to the water, a sailing boat, people
PATH = bmesh.new()
px = -0.42
for k in range(9):
    y0 = edge_y(px) - 0.04 - 0.055 * k
    xa, xb = (px - 0.08, px + 0.08) if k % 2 == 0 else (px + 0.08, px - 0.08)
    for j in range(6):
        t0, t1 = j / 6, (j + 1) / 6
        a = Vector((xa + (xb - xa) * t0, y0 - 0.055 * t0, 0))
        b = Vector((xa + (xb - xa) * t1, y0 - 0.055 * t1, 0))
        a.z, b.z = GZ(a.x, a.y) + 0.002, GZ(b.x, b.y) + 0.002
        if a.z < SEA + 0.01:
            continue
        d = b - a
        bmesh.ops.create_cube(PATH, size=1.0, matrix=Matrix.Translation((a + b) / 2) @ d.normalized().to_track_quat('X', 'Z').to_matrix().to_4x4() @ Matrix.Diagonal((d.length, 2.6 * S, 0.6 * S, 1)))
finish('path', PATH, M['whitewash'], smooth_sides=False)
m = Matrix.Translation((0.25, -0.95, SEA + 0.004)) @ Matrix.Rotation(0.4, 4, 'Z')
bm_ = bmesh.new()
rings = []
for j in range(11):
    t = -1 + 2 * j / 10
    w = 0.022 * (1 - t * t) ** 0.5 + 0.002
    rings.append([bm_.verts.new(m @ Vector((t * 0.09, u * w, v))) for u, v in ((-1, 0.008), (-0.6, -0.004), (0.6, -0.004), (1, 0.008))])
for a, b in zip(rings, rings[1:]):
    for i in range(3):
        bm_.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
finish('boatHull', bm_, M['white'], smooth_all=True)
cylinder('boatMast', M['trunk'], 0.0012, 0.1, (0, 0, 0), segs=6, matrix=m @ Matrix.Translation((0.01, 0, 0.006)))
bm_ = bmesh.new()
v = [bm_.verts.new(m @ p) for p in (Vector((0.012, 0, 0.012)), Vector((0.012, 0, 0.1)), Vector((-0.06, 0, 0.014)))]
bm_.faces.new(v)
finish('boatSail', bm_, M['sailCloth'], smooth_sides=False)
for k, (x, shirt) in enumerate(((-0.55, 'red'), (-0.3, 'blue'), (0.1, 'yellow'), (0.5, 'green'), (0.75, 'red'))):
    y = edge_y(x) + 0.02
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=GZ(x, y), scale=0.6)

render('santorini')
