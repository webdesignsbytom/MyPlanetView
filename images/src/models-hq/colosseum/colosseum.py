# The Colosseum in the high-quality look (hq.py): the travertine ellipse, its outer ring standing to
# the attic at the back (three storeys of arches between engaged half-columns, cornices, the attic's
# windows and pilasters) and broken away at the front, stepping down at its ends, so the inner
# ring's two storeys of arches, the radial walls between the rings, the stepped seating and the
# arena show, with the hypogeum's passages under a part-rebuilt floor; the Arch of Constantine on
# the paving in front, and umbrella pines.
# Run: blender -b --factory-startup -P colosseum.py -- colosseum-1024.png 1024 colosseum.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(80)
M['arenaWood'] = material('arenaWood', '#a07a52', 0.7, vary='#8a6844', vary_scale=40, bump=0.1, bump_scale=200)
M['pineCrown'] = material('pineCrown', '#3f7a3a', 0.8, vary='#346a30', vary_scale=12, bump=0.4, bump_scale=90)

CX, CY = 0.0, 0.14
A, B = 1.0, 0.8          # the outer ellipse's half axes
N = 40                    # bays round the outside
H = 0.19                  # a storey's height
Z0 = G + 0.015


def ell(a, b, t):
    return (CX + a * math.cos(t), CY + b * math.sin(t))


def ellip_ring(name, mat, a_in, b_in, a_out, b_out, z0, z1, segs=96, t0=0.0, t1=2 * math.pi, closed=True):
    bm = bmesh.new()
    n = segs if closed else segs + 1
    ts = [t0 + (t1 - t0) * k / segs for k in range(n)]
    ob_ = [bm.verts.new((*ell(a_out, b_out, t), z0)) for t in ts]
    ot = [bm.verts.new((*ell(a_out, b_out, t), z1)) for t in ts]
    ib = [bm.verts.new((*ell(a_in, b_in, t), z0)) for t in ts]
    it = [bm.verts.new((*ell(a_in, b_in, t), z1)) for t in ts]
    rng_ = range(segs) if closed else range(segs)
    for k in rng_:
        j = (k + 1) % n if closed else k + 1
        bm.faces.new((ob_[k], ob_[j], ot[j], ot[k]))
        bm.faces.new((ib[j], ib[k], it[k], it[j]))
        bm.faces.new((ot[k], ot[j], it[j], it[k]))
        bm.faces.new((ib[k], ib[j], ob_[j], ob_[k]))
    if not closed:
        bm.faces.new((ob_[0], ot[0], it[0], ib[0]))
        bm.faces.new((ib[-1], it[-1], ot[-1], ob_[-1]))
    return finish(name, bm, mat, smooth_sides=False)


def level(t):
    """How many storeys of the outer ring stand at angle t: all four (the attic too) at the back,
    stepping down at the ends of the break, none at the front."""
    s = math.sin(t)
    if s > 0.05:
        return 4
    if s > -0.12:
        return 3
    if s > -0.3:
        return 2
    if s > -0.42:
        return 1
    return 0


def ring_storeys(prefix, a, b, n, levels, thick, col_r):
    for i in range(n):
        t0, t1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
        p0, p1 = Vector((*ell(a, b, t0), 0)), Vector((*ell(a, b, t1), 0))
        lv = levels((t0 + t1) / 2)
        half = (p1 - p0).length / 2
        arch_a = half * 0.6
        tan = (p1 - p0).normalized()
        for s in range(min(lv, 3)):
            zb = Z0 + s * H
            spring = zb + H * 0.56
            arcade_path(f'{prefix}Arcade{s}_{i}', M['travertine'], [p0.xy[:], p1.xy[:]], thick, spring, zb + H - spring, arch_a, inward=True, closed_center=(CX, CY))
            for p in (p0, p1):
                box_m(f'{prefix}Pier{s}_{i}_{p.x:.3f}', M['travertine'], Matrix.Translation((p.x, p.y, (zb + spring) / 2)) @ Matrix.Rotation(math.atan2(tan.y, tan.x), 4, 'Z'), (2 * (half - arch_a), thick * 1.6, spring - zb))
            # the engaged half-column on the pier, and the storey's cornice over the bay
            out = Vector((p0.x - CX, p0.y - CY, 0)).normalized()
            col = p0 + out * 0.006
            cylinder(f'{prefix}Col{s}_{i}', M['travertineDark'] if s == 0 else M['travertine'], col_r, H * 0.86, (col.x, col.y, zb + 0.01), segs=10)
            box_m(f'{prefix}Cornice{s}_{i}', M['travertineDark'], Matrix.Translation(((p0.x + p1.x) / 2 + out.x * 0.004, (p0.y + p1.y) / 2 + out.y * 0.004, zb + H - 0.006)) @ Matrix.Rotation(math.atan2(tan.y, tan.x), 4, 'Z'), (2 * half + 0.004, thick + 0.02, 0.014))
        if lv == 4:
            zb = Z0 + 3 * H
            box_m(f'{prefix}Attic{i}', M['travertine'], Matrix.Translation(((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, zb + 0.08)) @ Matrix.Rotation(math.atan2(tan.y, tan.x), 4, 'Z'), (2 * half + 0.003, thick, 0.16))
            out = Vector((p0.x - CX, p0.y - CY, 0)).normalized()
            if i % 2 == 0:
                mid = (p0 + p1) / 2
                windows(f'{prefix}AtticWin{i}', M['shadow'], [(mid.x + out.x * thick / 2, mid.y + out.y * thick / 2, zb + 0.06, 0.04, 0.045, (out.x, out.y), 'rect')])
            box_m(f'{prefix}Pilaster{i}', M['travertineDark'], Matrix.Translation((p0.x + out.x * 0.008, p0.y + out.y * 0.008, zb + 0.08)) @ Matrix.Rotation(math.atan2(tan.y, tan.x), 4, 'Z'), (0.02, 0.012, 0.16))
            box_m(f'{prefix}AtticTop{i}', M['travertineDark'], Matrix.Translation(((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, zb + 0.165)) @ Matrix.Rotation(math.atan2(tan.y, tan.x), 4, 'Z'), (2 * half + 0.004, thick + 0.02, 0.014))


# ------------------------------------------------------------------ the paving round it
lathe('paving', M['paving'], [(1.0, 0), (1.0, 0.01), (0.0, 0.01)], (CX, CY, G - 0.004), segs=96, sx=1.26, sy=1.22)

# ------------------------------------------------------------------ the outer ring, broken at the front
ring_storeys('outer', A, B, N, level, 0.05, 0.013)
# the broken ends' rubble
for k in range(14):
    t = math.radians(-20 - 140 * rng.random())
    x, y = ell(A + 0.05 * rng.random(), B + 0.05 * rng.random(), t)
    box(f'rubble{k}', M['travertineDark'], (x, y, G + 0.012), (0.03 + 0.03 * rng.random(), 0.03, 0.02 + 0.02 * rng.random()), rot_z=rng.random() * 3, bevel=0.004)

# ------------------------------------------------------------------ the inner ring and the radial walls
AI, BI = A - 0.14, B - 0.14
ring_storeys('inner', AI, BI, 36, lambda t: 2, 0.04, 0.0)
for i in range(N):
    t = 2 * math.pi * (i + 0.5) / N
    if level(t) >= 3:
        continue
    p_out, p_in = Vector((*ell(A, B, t), 0)), Vector((*ell(AI, BI, t), 0))
    d = p_in - p_out
    h = 0.12 + 0.22 * rng.random()
    box_m(f'radial{i}', M['travertineDark'], Matrix.Translation(((p_out.x + p_in.x) / 2, (p_out.y + p_in.y) / 2, Z0 + h / 2)) @ Matrix.Rotation(math.atan2(d.y, d.x), 4, 'Z'), (d.length, 0.025, h))
ellip_ring('corridorFloor', M['travertineDark'], AI, BI, A, B, G - 0.004, Z0, segs=96)

# ------------------------------------------------------------------ the seating, stepping down to the arena
AR, BR = 0.5, 0.31
STEPS = 7
for k in range(STEPS):
    f0, f1 = k / STEPS, (k + 1) / STEPS
    a_out, b_out = AI - (AI - AR) * f0, BI - (BI - BR) * f0
    a_in, b_in = AI - (AI - AR) * f1, BI - (BI - BR) * f1
    zt = Z0 + 2 * H * (1 - f0) * 0.92
    ellip_ring(f'seats{k}', M['travertine'] if k % 2 else M['travertineDark'], a_in, b_in, a_out, b_out, G - 0.004, zt, segs=96)
# the podium wall round the arena
ellip_ring('podium', M['whiteStone'], AR - 0.02, BR - 0.02, AR, BR, G - 0.004, Z0 + 0.07, segs=96)

# ------------------------------------------------------------------ the arena: the hypogeum, half under a new floor
lathe('arenaPit', M['travertineDark'], [(1.0, 0), (1.0, 0.004), (0.0, 0.004)], (CX, CY, G - 0.004), segs=96, sx=AR - 0.02, sy=BR - 0.02)
for k in range(7):
    y = CY - BR * 0.8 + k * BR * 1.6 / 6
    w = 2 * (AR - 0.04) * math.sqrt(max(0.0, 1 - ((y - CY) / (BR - 0.02)) ** 2))
    box(f'hypogeumWall{k}', M['travertine'], (CX - w * 0.15, y, G + 0.03), (w * 0.7, 0.014, 0.05), bevel=0.002)
for k in range(9):
    x = CX - AR * 0.7 + k * AR * 1.4 / 8
    hh = 2 * (BR - 0.04) * math.sqrt(max(0.0, 1 - ((x - CX) / (AR - 0.02)) ** 2))
    box(f'hypogeumCross{k}', M['travertine'], (x, CY, G + 0.025), (0.012, hh * 0.85, 0.04), bevel=0.002)
deck_x0 = CX + 0.12
bm = bmesh.new()
pts = [ell(AR - 0.025, BR - 0.025, t) for t in [math.radians(a) for a in range(-75, 76, 5)]]
pts = [(max(x, deck_x0), y) for x, y in pts]
add_prism(bm, [bm.verts.new((x, y, Z0 + 0.04)) for x, y in pts], [bm.verts.new((x, y, Z0 + 0.052)) for x, y in pts])
finish('arenaFloor', bm, M['arenaWood'], smooth_sides=False)

# ------------------------------------------------------------------ the Arch of Constantine and the pines
AX, AY, ROT = -0.9, -0.82, math.radians(-15)
arch_m = Matrix.Translation((AX, AY, G)) @ Matrix.Rotation(ROT, 4, 'Z')
box_m('constantineBody', M['marble'], arch_m @ Matrix.Translation((0, 0, 0.11)), (0.34, 0.09, 0.22), bevel=0.003)
box_m('constantineAttic', M['marble'], arch_m @ Matrix.Translation((0, 0, 0.255)), (0.34, 0.09, 0.07), bevel=0.003)
box_m('constantineCornice', M['marbleShade'], arch_m @ Matrix.Translation((0, 0, 0.222)), (0.36, 0.1, 0.014), bevel=0.002)
for u, w, h in ((0.0, 0.08, 0.15), (-0.11, 0.045, 0.09), (0.11, 0.045, 0.09)):
    p = arch_m @ Vector((u, 0, 0))
    windows(f'constantineArch{u}', M['shadow'], [(p.x, p.y, G, w, h, (math.sin(ROT), -math.cos(ROT)), 'round')], depth=0.094)
for u in (-0.15, -0.065, 0.065, 0.15):
    for side in (-1, 1):
        p = arch_m @ Vector((u, side * 0.05, 0))
        cylinder(f'constantineCol{u}{side}', M['marbleShade'], 0.008, 0.17, (p.x, p.y, G + 0.04), segs=10)


def stone_pine(name, x, y, h=0.25, r=0.14, seed=0):
    """A Roman stone pine: a leaning trunk forking into bare branches under a wide, flat-topped
    umbrella of soft clumps."""
    lr = random.Random(seed)
    lean = lr.uniform(0, 2 * math.pi)
    lx, ly = math.cos(lean) * 0.03, math.sin(lean) * 0.03
    fork = (x + lx, y + ly, G + h * 0.62)
    tube(name + 'Trunk', M['trunk'], [(x, y, G), (x + lx * 0.4, y + ly * 0.4, G + h * 0.3), fork], 0.011)
    bm = bmesh.new()
    for k in range(3):
        a = lean + 2 * math.pi * k / 3 + lr.uniform(-0.4, 0.4)
        end = (fork[0] + math.cos(a) * r * 0.55, fork[1] + math.sin(a) * r * 0.55, G + h * 0.9)
        tube(f'{name}Branch{k}', M['trunk'], [fork, end], 0.006)
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=Matrix.Translation(Vector(end) + Vector((0, 0, h * 0.06))) @ Matrix.Diagonal((r * 0.6, r * 0.6, r * 0.28, 1)))
    for k in range(6):
        a = 2 * math.pi * k / 6 + lr.random()
        c = Vector((fork[0] + math.cos(a) * r * 0.62, fork[1] + math.sin(a) * r * 0.62, G + h * 0.97 + lr.uniform(-0.01, 0.01)))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((r * 0.48, r * 0.48, r * 0.24, 1)))
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=Matrix.Translation((fork[0], fork[1], G + h * 1.02)) @ Matrix.Diagonal((r * 0.62, r * 0.62, r * 0.3, 1)))
    finish(name, bm, M['pineCrown'], smooth_all=True)


for k, (x, y) in enumerate(((1.02, -0.62), (1.12, -0.22), (-1.16, -0.22), (-0.52, -1.08), (0.72, -0.98))):
    stone_pine(f'pine{k}', x, y, seed=k)
for k, (x, y, shirt) in enumerate(((-0.55, -0.78, 'red'), (-0.45, -0.85, 'blue'), (0.35, -0.95, 'yellow'), (-0.2, -1.0, 'green'))):
    person(f'p{k}', x, y, 0.5 * k, shirt)

render('colosseum')
