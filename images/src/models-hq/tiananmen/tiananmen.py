# Tiananmen, the Gate of Heavenly Peace, in the high-quality look (hq.py), laid out in metres: the long
# red platform on its white marble base with its five arched passages, the middle one the widest, a
# yellow-tiled coping and a white marble balustrade round its top; on it the gate tower, nine bays of
# red columns under painted brackets and a double roof of yellow glazed tiles, its upper roof gabled at
# the ends; before it the Outer Golden Water River in its marble banks, crossed by five white marble
# bridges, the two carved marble columns (huabiao, their crowning beasts left out: sculpture) and
# Chang'an Avenue with its lamps; pines behind the walls, and people. (The portrait over the middle
# passage and the stone lions are left out: a painting and sculpture.)
# Run: blender -b --factory-startup -P tiananmen.py -- tiananmen-1024.png 1024 tiananmen.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1420)
M['tMarble'] = material('tMarble', '#f1ede4', 0.4, vary='#e5dfd2', vary_scale=18, bump=0.06, bump_scale=120, sss=0.03)
M['tMarbleShade'] = material('tMarbleShade', '#ddd6c9', 0.45, vary='#d0c9bb', vary_scale=18, bump=0.06, bump_scale=120)
M['gateRed'] = material('gateRed', '#a8302a', 0.7, vary='#9a2a25', vary_scale=24, bump=0.06, bump_scale=200)
M['lacquer'] = material('tLacquer', '#a3232a', 0.35, vary='#902027', vary_scale=20, coat=0.4)
M['gilt'] = material('tGilt', '#b48632', 0.4, metallic=0.5)
M['dougong'] = striped('tDougong', ['#1e6f90', '#2f8a58', '#e2b33d', '#1e6f90', '#3a5fa8', '#2f8a58'], 'Z', 140.0, rough=0.45)
M['yellowTile'] = banded(material('tYellowTile', '#e0a821', 0.25, vary='#d29a1a', vary_scale=10, coat=0.6), 'Z', 140.0, strength=0.45)
M['square'] = masonry('tSquare', '#b9b4ab', '#9a958c', scale=70, rough=0.85, vary='#aea89e')
M['avenue'] = material('changAn', '#55585c', 0.8, vary='#4c4f53', vary_scale=40)
M['canal'] = material('goldenWater', '#3e7f86', 0.06, coat=0.8)
M['passage'] = material('tPassage', '#4a2b24', 0.9)
M['pine'] = material('tPine', '#2d5b34', 0.85, vary='#386a3d', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.023               # metres to the tile's units (the platform's ends drawn a little shorter, to fit)
Z0 = G + 0.004          # the square's paving
YO = 10.0               # the platform's middle, back from the tile's middle (metres)


def P(x, y, z):
    return Vector((x * S, (y + YO) * S, Z0 + z * S))


BEFORE = set(bpy.data.objects)
slab('avenue', M['avenue'], rect(0, (-55.0 + YO) * S, 4.0, 13.0 * S), Z0, Z0 + 0.1 * S, margin=0.03)
for k, x in enumerate(range(-70, 71, 8)):
    for y in (-58.0, -52.0):
        slab(f'laneMark{k}{y:.0f}', M['white'], rect(x * S, (y + YO) * S, 4.0 * S, 0.3 * S), Z0 + 0.1 * S, Z0 + 0.16 * S, margin=0.05)

# ------------------------------------------------------------------ the platform: marble base, red walls with five passages cut through
PW, PD, PH = 106.0, 40.0, 13.0
BASE = 1.6
GATES = [(0.0, 3.3, 6.5), (-13.0, 2.6, 5.4), (13.0, 2.6, 5.4), (-25.0, 2.0, 4.4), (25.0, 2.0, 4.4)]


def gate_outline(x0, x1, z0, z1, gates, steps=12):
    """The platform's end-on outline in (x, z): its bottom notched by each passage's round-headed arch."""
    pts = [(x0, z0)]
    for cx, hw, spring in sorted(gates):
        pts += [(cx - hw, z0), (cx - hw, spring)]
        for k in range(1, steps):
            t = math.pi - math.pi * k / steps
            pts.append((cx + hw * math.cos(t), spring + hw * math.sin(t)))
        pts += [(cx + hw, spring), (cx + hw, z0)]
    pts += [(x1, z0), (x1, z1), (x0, z1)]
    return pts


def through(name, mat, outline, y0, y1):
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x, y0, z)) for x, z in outline], [bm.verts.new(P(x, y1, z)) for x, z in outline])
    return finish(name, bm, mat, smooth_sides=False)


# the marble base: a piece between each pair of passages (it is lower than their arches)
edges = [-PW / 2 - 0.4] + [v for cx, hw, _ in sorted(GATES) for v in (cx - hw, cx + hw)] + [PW / 2 + 0.4]
for k in range(0, len(edges), 2):
    x0, x1 = edges[k], edges[k + 1]
    box(f'platformBase{k}', M['tMarbleShade'], P((x0 + x1) / 2, 0.0, BASE / 2), ((x1 - x0) * S, (PD + 0.8) * S, BASE * S), bevel=0)
through('platform', M['gateRed'], gate_outline(-PW / 2, PW / 2, BASE - 0.1, PH, GATES), -PD / 2, PD / 2)
# the passages, open right through, lined in shadow (a hair inside the platform's own faces)
for k, (cx, hw, spring) in enumerate(GATES):
    box(f'passageFloor{k}', M['passage'], P(cx, 0.0, 0.05), (2 * (hw - 0.05) * S, (PD + 0.6) * S, 0.1 * S), bevel=0)
    a, b = hw - 0.04, hw - 0.3
    outer = [(cx - a, 0.1), (cx - a, spring)] + [(cx + a * math.cos(math.pi - math.pi * j / 12), spring + a * math.sin(math.pi - math.pi * j / 12)) for j in range(1, 12)] + [(cx + a, spring), (cx + a, 0.1)]
    inner = [(cx + b, 0.1), (cx + b, spring)] + [(cx + b * math.cos(math.pi * j / 12), spring + b * math.sin(math.pi * j / 12)) for j in range(1, 12)] + [(cx - b, spring), (cx - b, 0.1)]
    through(f'passageLining{k}', M['passage'], outer + inner, -PD / 2 + 0.6, PD / 2 - 0.6)
# the coping of yellow tiles along the top, the terrace, the balustrade round it
for s in (-1, 1):
    bm = bmesh.new()
    sec = [(s * (PD / 2 + 0.9), PH - 0.6), (s * (PD / 2 - 0.5), PH + 0.5), (s * (PD / 2 - 0.5), PH - 0.6)]
    add_prism(bm, [bm.verts.new(P(-PW / 2 - 0.9, y, z)) for y, z in sec], [bm.verts.new(P(PW / 2 + 0.9, y, z)) for y, z in sec])
    finish(f'coping{s}', bm, M['yellowTile'], smooth_sides=False)
for s in (-1, 1):
    bm = bmesh.new()
    sec = [(s * (PW / 2 + 0.9), PH - 0.6), (s * (PW / 2 - 0.5), PH + 0.5), (s * (PW / 2 - 0.5), PH - 0.6)]
    add_prism(bm, [bm.verts.new(P(x, -PD / 2 - 0.9, z)) for x, z in sec], [bm.verts.new(P(x, PD / 2 + 0.9, z)) for x, z in sec])
    finish(f'copingEnd{s}', bm, M['yellowTile'], smooth_sides=False)
box('terrace', M['square'], P(0.0, 0.0, PH + 0.25), ((PW - 1.2) * S, (PD - 1.2) * S, 0.5 * S), bevel=0)
POSTS, PANELS = bmesh.new(), bmesh.new()
for e in range(4):
    L = PW - 2.4 if e % 2 == 0 else PD - 2.4
    n = int(L / 2.2)
    for k in range(n + 1):
        u = -L / 2 + L * k / n
        x, y = (u, -(PD / 2 - 1.2)) if e == 0 else ((PW / 2 - 1.2, u) if e == 1 else ((u, PD / 2 - 1.2) if e == 2 else (-(PW / 2 - 1.2), u)))
        bmesh.ops.create_cube(POSTS, size=1.0, matrix=Matrix.Translation(P(x, y, PH + 0.5 + 0.6)) @ Matrix.Diagonal((0.32 * S, 0.32 * S, 1.2 * S, 1)))
        if k < n:
            u2 = u + L / n / 2
            x2, y2 = (u2, y) if e % 2 == 0 else (x, u2)
            bmesh.ops.create_cube(PANELS, size=1.0, matrix=Matrix.Translation(P(x2, y2, PH + 0.5 + 0.45)) @ Matrix.Diagonal(((L / n - 0.4) * S if e % 2 == 0 else 0.18 * S, 0.18 * S if e % 2 == 0 else (L / n - 0.4) * S, 0.8 * S, 1)))
finish('balusterPosts', POSTS, M['tMarble'], smooth_sides=False)
finish('balusterPanels', PANELS, M['tMarbleShade'], smooth_sides=False)


# ------------------------------------------------------------------ the gate tower: red columns, brackets, two roofs of yellow tiles
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


def cn_roof(name, z0, w, d, ridge, h, kick, gabled=False):
    """The roof's tiled surface, its tile rolls, its ridges and finials; `gabled`: the ends of its upper
    part stood up as red gables, as on a hip-and-gable roof."""
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
                ring.append(bm.verts.new(P(q.x, q.y, q.z)))
        rings.append(ring)
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
    bm.faces.new(list(reversed(rings[0])))
    finish(name, bm, M['yellowTile'], smooth_all=True)
    rolls = bmesh.new()
    for e in (0, 2):
        count = int(w / 1.4)
        for j in range(count):
            u = -0.97 + 1.94 * (j + 0.5) / count
            pts = [roof_point(i / 10, e, u, w, d, ridge, h, z0 + 0.25, kick) for i in range(11)]
            for p0, p1 in zip(pts, pts[1:]):
                a, b = P(p0.x, p0.y, p0.z), P(p1.x, p1.y, p1.z)
                dv = b - a
                if dv.length < 1e-6:
                    continue
                rot = dv.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
                bmesh.ops.create_cone(rolls, cap_ends=True, segments=6, radius1=0.22 * S, radius2=0.22 * S, depth=dv.length, matrix=Matrix.Translation((a + b) / 2) @ rot)
    finish(name + 'Rolls', rolls, M['yellowTile'], smooth_all=True)
    top = z0 + h
    box(name + 'Ridge', M['yellowTile'], P(0.0, 0.0, top + 0.6), (ridge * S, 1.0 * S, 1.6 * S), bevel=0.001)
    for sx in (-1, 1):
        lathe(f'{name}Chiwen{sx}', M['yellowTile'], [(r * S, z * S) for r, z in ((0.9, 0), (1.0, 1.5), (0.7, 3.0), (1.1, 3.4), (0.0, 3.6))], P(sx * ridge / 2, 0.0, top + 1.2), segs=8, smooth=True, sy=0.5)
        if gabled:
            # the red gable standing at the ridge's end, over the hipped part below it
            tg = 0.45
            q0 = roof_point(tg, 1 if sx > 0 else 3, 1.0, w, d, ridge, h, z0, kick)
            q1 = roof_point(tg, 1 if sx > 0 else 3, -1.0, w, d, ridge, h, z0, kick)
            x = sx * (ridge / 2 - 0.4)
            gb = bmesh.new()
            tri = [(q0.y, q0.z), (q1.y, q1.z), (0.0, top + 0.2)]
            add_prism(gb, [gb.verts.new(P(x, y, z)) for y, z in tri], [gb.verts.new(P(x - sx * 0.4, y, z)) for y, z in tri])
            finish(f'{name}Gable{sx}', gb, M['lacquer'], smooth_sides=False)
            box(f'{name}GableTrim{sx}', M['gilt'], P(x + sx * 0.05, 0.0, (q0.z + top) / 2), (0.15 * S, 2.0 * S, (top - q0.z) * 0.5 * S), bevel=0)


def body(name, z0, z1, w, d, bays_w, bays_d):
    """Red columns round the hall, red walls, and gilded lattice doors in the front bays."""
    box(name + 'Wall', M['lacquer'], P(0.0, 0.0, (z0 + z1) / 2), ((w - 1.6) * S, (d - 1.6) * S, (z1 - z0) * S), bevel=0)
    cols, gold = bmesh.new(), bmesh.new()
    for i in range(bays_w + 1):
        x = -w / 2 + w * i / bays_w
        for y in (-d / 2, d / 2):
            bmesh.ops.create_cone(cols, cap_ends=True, segments=12, radius1=0.55 * S, radius2=0.5 * S, depth=(z1 - z0) * S, matrix=Matrix.Translation(P(x, y, (z0 + z1) / 2)))
    for j in range(1, bays_d):
        y = -d / 2 + d * j / bays_d
        for x in (-w / 2, w / 2):
            bmesh.ops.create_cone(cols, cap_ends=True, segments=12, radius1=0.55 * S, radius2=0.5 * S, depth=(z1 - z0) * S, matrix=Matrix.Translation(P(x, y, (z0 + z1) / 2)))
    finish(name + 'Columns', cols, M['lacquer'], smooth_all=True)
    bw = w / bays_w
    for i in range(bays_w):
        x = -w / 2 + bw * (i + 0.5)
        f0 = P(x, -d / 2 + 0.75, z0 + 0.4)
        hh, ww = (z1 - z0) - 2.0, bw - 1.3
        for u in (-ww / 2, ww / 2):
            bmesh.ops.create_cube(gold, size=1.0, matrix=Matrix.Translation(f0 + Vector((u * S, 0, hh / 2 * S))) @ Matrix.Diagonal((0.25 * S, 0.2 * S, hh * S, 1)))
        for zz in (0.0, hh * 0.45, hh):
            bmesh.ops.create_cube(gold, size=1.0, matrix=Matrix.Translation(f0 + Vector((0, 0, zz * S))) @ Matrix.Diagonal((ww * S, 0.2 * S, 0.25 * S, 1)))
        for j in range(1, 6):
            bmesh.ops.create_cube(gold, size=1.0, matrix=Matrix.Translation(f0 + Vector(((-ww / 2 + ww * j / 6) * S, 0, hh * 0.725 * S))) @ Matrix.Diagonal((0.1 * S, 0.12 * S, hh * 0.55 * S, 1)))
        for j in range(1, 5):
            bmesh.ops.create_cube(gold, size=1.0, matrix=Matrix.Translation(f0 + Vector((0, 0, (hh * 0.45 + hh * 0.55 * j / 5) * S))) @ Matrix.Diagonal((ww * S, 0.12 * S, 0.1 * S, 1)))
    finish(name + 'Lattice', gold, M['gilt'], smooth_sides=False)
    box(name + 'Brackets', M['dougong'], P(0.0, 0.0, z1 + 0.3), ((w + 1.5) * S, (d + 1.5) * S, 2.0 * S), bevel=0)


TZ = PH + 0.5
W, D = 62.0, 27.0
box('towerBase', M['tMarbleShade'], P(0.0, 0.0, TZ + 0.6), ((W + 5) * S, (D + 5) * S, 1.2 * S), bevel=0.001)
body('tower', TZ + 1.2, TZ + 9.5, W, D, 9, 5)
cn_roof('lowerRoof', TZ + 9.8, W + 11, D + 11, W - 6, 3.2, 1.5)
box('upperBody', M['lacquer'], P(0.0, 0.0, TZ + 13.4), ((W - 7) * S, (D - 7) * S, 4.4 * S), bevel=0)
box('upperBrackets', M['dougong'], P(0.0, 0.0, TZ + 15.7), ((W - 5) * S, (D - 5) * S, 1.6 * S), bevel=0)
cn_roof('upperRoof', TZ + 16.4, W + 5, D + 5, W - 12, 8.0, 1.8, gabled=True)
# the great red lanterns hung along the tower's front, a gilded cap and tassel on each
M['lanternRed'] = material('lanternRed', '#d8302a', 0.45, vary='#c4271f', vary_scale=20, sss=0.2)
for i in range(9):
    if i == 4:
        continue
    x = -W / 2 + W * (i + 0.5) / 9
    ly = -D / 2 - 1.2
    lathe(f'lantern{i}', M['lanternRed'], [(0.6 * S, 0.0), (1.2 * S, 0.5 * S), (1.35 * S, 1.2 * S), (1.2 * S, 1.9 * S), (0.6 * S, 2.4 * S)], P(x, ly, TZ + 5.6), segs=16, smooth=True)
    cylinder(f'lanternCap{i}', M['gilt'], 0.65 * S, 0.3 * S, P(x, ly, TZ + 8.0), segs=12)
    cylinder(f'lanternFoot{i}', M['gilt'], 0.65 * S, 0.3 * S, P(x, ly, TZ + 5.3), segs=12)
    cylinder(f'lanternTassel{i}', M['yellow'], 0.25 * S, 1.2 * S, P(x, ly, TZ + 4.1), segs=8, r2=0.4 * S)
    cylinder(f'lanternCord{i}', M['gilt'], 0.06 * S, 1.6 * S, P(x, ly, TZ + 8.3), segs=6)

# ------------------------------------------------------------------ the Outer Golden Water River, its five marble bridges, the columns, the lamps
RY0, RY1 = -34.0, -25.0
slab('squareBack', M['square'], [(-2.0, (RY1 + 0.4 + YO) * S), (2.0, (RY1 + 0.4 + YO) * S), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
slab('squareFront', M['square'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (RY0 - 0.4 + YO) * S), (-2.0, (RY0 - 0.4 + YO) * S)], Z0 - 0.003, Z0, margin=0.02)
slab('canal', M['canal'], rect(0.0, ((RY0 + RY1) / 2 + YO) * S, 4.0, (RY1 - RY0) * S), Z0 - 1.4 * S, Z0 - 0.6 * S, margin=0.03)
for s, y in ((-1, RY0), (1, RY1)):
    slab(f'bank{s}', M['tMarble'], rect(0.0, (y + YO) * S, 4.0, 0.8 * S), Z0 - 1.4 * S, Z0 + 0.3 * S, margin=0.03)
    n = 0
    for k in range(-60, 61, 3):
        x = float(k)
        if math.hypot(x * S, (y + YO) * S) > 1.42 or any(abs(x - bx) < hw + 1.2 for bx, hw in ((0.0, 4.2), (-11.0, 3.0), (11.0, 3.0), (-20.0, 2.4), (20.0, 2.4))):
            continue
        box(f'bankPost{s}{n}', M['tMarble'], P(x, y, 0.9), (0.35 * S, 0.35 * S, 1.2 * S), bevel=0)
        n += 1
for k, (bx, hw) in enumerate(((0.0, 4.2), (-11.0, 3.0), (11.0, 3.0), (-20.0, 2.4), (20.0, 2.4))):
    # a white marble bridge humped over the water, its balustrades either side
    bm = bmesh.new()
    sec = []
    for j in range(13):
        y = RY0 - 3.0 + (RY1 - RY0 + 6.0) * j / 12
        t = (j / 12) * 2 - 1
        sec.append((y, 0.3 + 1.3 * (1 - t * t)))
    prof = sec + [(sec[-1][0], -1.0), (sec[0][0], -1.0)]
    add_prism(bm, [bm.verts.new(P(bx - hw, y, z)) for y, z in prof], [bm.verts.new(P(bx + hw, y, z)) for y, z in prof])
    finish(f'bridge{k}', bm, M['tMarble'], smooth_sides=False)
    for sx in (-1, 1):
        rail = [P(bx + sx * (hw - 0.2), y, z + 0.6) for y, z in sec]
        tube(f'bridgeRail{k}{sx}', M['tMarble'], rail, 0.25 * S)
        for y, z in sec[::2]:
            box(f'bridgePost{k}{sx}{y:.0f}', M['tMarble'], P(bx + sx * (hw - 0.2), y, z + 0.5), (0.35 * S, 0.35 * S, 1.0 * S), bevel=0)
for sx in (-1, 1):
    hx, hy = sx * 30.0, -39.0
    box(f'huabiaoBase{sx}', M['tMarbleShade'], P(hx, hy, 0.8), (3.0 * S, 3.0 * S, 1.6 * S), bevel=0.001)
    lathe(f'huabiao{sx}', M['tMarble'], [(0.6 * S, 0.0), (0.55 * S, 7.6 * S), (0.0, 7.6 * S)], P(hx, hy, 1.6), segs=8)
    box(f'huabiaoCloud{sx}', M['tMarble'], P(hx, hy, 7.6), (3.2 * S, 0.4 * S, 1.0 * S), bevel=0.001)
    lathe(f'huabiaoCap{sx}', M['tMarbleShade'], [(1.1 * S, 0.0), (1.2 * S, 0.6 * S), (0.0, 0.8 * S)], P(hx, hy, 9.2), segs=16)
for k, x in enumerate(range(-44, 45, 22)):
    lx, ly = float(x), -46.0
    if math.hypot(lx * S, (ly + YO) * S) > 1.38:
        continue
    cylinder(f'lampPost{k}', M['tMarble'], 0.18 * S, 7.0 * S, P(lx, ly, 0.0), segs=8)
    for s in (-1, 1):
        lathe(f'lamp{k}{s}', M['white'], [(0.0, 0.0), (0.5 * S, 0.3 * S), (0.45 * S, 0.9 * S), (0.0, 1.1 * S)], P(lx + s * 0.9, ly, 6.4), segs=10, smooth=True)
    box(f'lampArm{k}', M['tMarble'], P(lx, ly, 6.6), (2.0 * S, 0.12 * S, 0.12 * S), bevel=0)

# ------------------------------------------------------------------ pines behind the walls, people
PINES = []
for k in range(26):
    x = rng.uniform(-54.0, 54.0)
    y = rng.uniform(PD / 2 + 3.0, 36.0)
    if math.hypot(x * S, (y + YO) * S) > 1.38:
        continue
    PINES.append((P(x, y, 11.0 + rng.uniform(-1.0, 3.0)).to_tuple(), rng.uniform(3.2, 4.4) * S, 0.8))
blob_cloud('pines', M['pine'], PINES)
for k, (x, y, shirt) in enumerate(((-4.0, -40.0, 'red'), (3.0, -41.0, 'blue'), (-14.0, -38.0, 'yellow'), (15.0, -39.0, 'green'), (0.5, -22.0, 'red'), (-24.0, -42.0, 'blue'), (7.0, -44.0, 'yellow'))):
    c = P(x, y, 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('tiananmen')
