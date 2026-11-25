# The Sagrada Família in the high-quality look (hq.py): the basilica's nave with its rows of fruit
# pinnacles, the transept, the apse; the Nativity façade in front with its three portals, its
# sculpture dripping down and the green cypress of the Tree of Life with white doves on top, between
# its four bell towers; the Passion façade's four behind; each bell tower a tall parabolic spire with
# its spiral of openings and a mosaic pinnacle in red, gold and white with its cross of balls; the
# four evangelists' towers, the Virgin Mary's with its star, and the tallest, Jesus Christ's, white
# at the top under its great cross; a tower crane at the Glory end, the square's trees and its pond.
# Run: blender -b --factory-startup -P sagrada-familia.py -- sagrada-familia-1024.png 1024 sagrada-familia.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1882)
M['sf'] = material('sf', '#cdb48c', 0.75, vary='#b9a07a', vary_scale=18, bump=0.3, bump_scale=120)
M['sfAged'] = material('sfAged', '#b39b76', 0.8, vary='#a08863', vary_scale=18, bump=0.35, bump_scale=120)
M['sfDark'] = material('sfDark', '#9f8865', 0.8, vary='#8c7656', vary_scale=18, bump=0.4, bump_scale=120)
M['sfWhite'] = material('sfWhite', '#f1ede4', 0.35, vary='#e4ded2', vary_scale=40, bump=0.08, bump_scale=200)
M['cypress'] = material('cypressGreen', '#3f8f4f', 0.4, vary='#357d43', vary_scale=40, bump=0.2, bump_scale=200, coat=0.4)
M['mosaic'] = striped('mosaic', ['#c8352b', '#f3d04a', '#f5f2ea', '#c8352b', '#2f8f5a'], 'Z', 30.0, rough=0.3)
M['fruit'] = striped('fruit', ['#e0402f', '#f2b232', '#f5f2ea', '#6aa84f'], 'Z', 50.0, rough=0.35)
M['craneYellow'] = material('craneYellow', '#f0b92a', 0.45, metallic=0.2)
M['starGlass'] = material('starGlass', '#eaf4ff', 0.1, emission=('#dfeeff', 1.4), transmission=0.3)
OPEN, BARS = [], bmesh.new()


def member(p0, p1, t, bm=None):
    bm = BARS if bm is None else bm
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t, t, d.length, 1)))


def spire_radius(prof, t):
    for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
        if t <= z1:
            return r0 + (r1 - r0) * (t - z0) / max(1e-6, z1 - z0)
    return prof[-1][0]


def bell_tower(name, x, y, z0, H, R, mat='sf'):
    """An apostle's bell tower: a parabolic spire with a spiral of openings, a mosaic pinnacle and a
    cross of white balls."""
    prof = [(R, 0.0), (R * 0.99, 0.18), (R * 0.93, 0.4), (R * 0.78, 0.6), (R * 0.56, 0.77), (R * 0.36, 0.88), (R * 0.24, 0.93)]
    lathe(name, M[mat], [(r, z * H) for r, z in prof], (x, y, z0), segs=40, smooth=True)
    for k in range(34):
        t = 0.1 + 0.74 * k / 34
        r = spire_radius(prof, t)
        a = k * 1.05 + x * 7
        OPEN.append((x + r * math.cos(a), y + r * math.sin(a), z0 + t * H, 0.02 * (1 - 0.55 * t), 0.055 * (1 - 0.45 * t), (math.cos(a), math.sin(a)), 'round'))
    zt = z0 + H * 0.93
    s = R * 1.55
    lathe(name + 'Pinnacle', M['mosaic'], [(s * 0.22, 0), (s * 0.34, 0.06), (s * 0.36, 0.13), (s * 0.28, 0.2), (s * 0.14, 0.27), (0.0, 0.31)], (x, y, zt), segs=8, smooth=False)
    bm = bmesh.new()
    zc = zt + 0.31 * s
    for dx, dy, dz in ((0, 0, 0.11), (0.07, 0, 0.05), (-0.07, 0, 0.05), (0, 0.07, 0.05), (0, -0.07, 0.05), (0, 0, 0.0)):
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=s * 0.075, matrix=Matrix.Translation((x + dx * s, y + dy * s, zc + dz * s + 0.02)))
    finish(name + 'Balls', bm, M['sfWhite'], smooth_all=True)
    member((x, y, zc - 0.01), (x, y, zc + 0.13 * s), s * 0.06)
    member((x - 0.07 * s, y, zc + 0.07 * s), (x + 0.07 * s, y, zc + 0.07 * s), s * 0.05)
    member((x, y - 0.07 * s, zc + 0.07 * s), (x, y + 0.07 * s, zc + 0.07 * s), s * 0.05)


# ------------------------------------------------------------------ the square, its trees and the pond
slab('plaza', M['paving'], rect(0.0, 0.0, 2.6, 1.9), G - 0.003, G + 0.006, margin=0.12)
bm = bmesh.new()
pond = [(-0.15 + 0.42 * math.cos(2 * math.pi * k / 48), -1.08 + 0.13 * math.sin(2 * math.pi * k / 48)) for k in range(48)]
add_prism(bm, [bm.verts.new((x, y, G - 0.004)) for x, y in pond], [bm.verts.new((x, y, G + 0.007)) for x, y in pond])
finish('pond', bm, M['water'], smooth_sides=False)
for k, (x, y) in enumerate(((-1.15, -0.55), (-1.25, -0.1), (1.18, -0.55), (1.0, -0.95), (-0.7, -1.05), (0.45, -1.15), (1.2, 0.45), (-1.1, 0.55))):
    tree(f'plane{k}', x, y, h=0.24, r=0.1)

# ------------------------------------------------------------------ the nave, the transept and the apse
NZ = G + 0.5          # the nave's walls
box('nave', M['sf'], (-0.2, 0.0, (G + NZ) / 2), (1.3, 0.42, NZ - G), bevel=0.004)
gable_roof('naveRoof', M['sfDark'], -0.85, 0.45, -0.21, 0.21, NZ, 0.24, over=0.015)
box('transept', M['sf'], (0.0, 0.0, (G + NZ) / 2), (0.44, 1.1, NZ - G), bevel=0.004)
gable_roof('transeptRoof', M['sfDark'], -0.22, 0.22, -0.55, 0.55, NZ, 0.24, over=0.015, along='y')
cylinder('apse', M['sf'], 0.26, NZ - G + 0.06, (0.55, 0.0, G), segs=40)
lathe('apseRoof', M['sfDark'], [(0.27, 0), (0.22, 0.1), (0.1, 0.2), (0.0, 0.24)], (0.55, 0.0, NZ + 0.06), segs=40, smooth=True)
for k in range(9):
    a = -math.pi / 2 + math.pi * k / 8
    px, py = 0.55 + 0.27 * math.cos(a), 0.27 * math.sin(a)
    lathe(f'apsePinnacle{k}', M['sf'], [(0.025, 0), (0.02, 0.12), (0.0, 0.2)], (px, py, NZ + 0.06), segs=10, smooth=True)
    OPEN.append((px, py, G + 0.12, 0.05, 0.26, (math.cos(a), math.sin(a)), 'round'))
# the fruit pinnacles along the nave's walls
for s in (-1, 1):
    for k in range(7):
        x = -0.8 + k * 0.18
        if abs(x) < 0.25:
            continue
        lathe(f'nPin{s}{k}', M['sf'], [(0.022, 0), (0.016, 0.07)], (x, s * 0.215, NZ), segs=10)
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.028, matrix=Matrix.Translation((x, s * 0.215, NZ + 0.09)))
        finish(f'nFruit{s}{k}', bm, M['fruit'], smooth_all=True)
        OPEN.append((x + 0.09, s * 0.211, G + 0.1, 0.07, 0.3, (0, s), 'round'))
# the Glory façade's end
box('gloryFront', M['sf'], (-0.86, 0.0, G + 0.3), (0.04, 0.5, 0.6), bevel=0.003)
OPEN += [(-0.883, u, G + 0.0, 0.1, 0.26, (-1, 0), 'round') for u in (-0.13, 0.0, 0.13)]

# ------------------------------------------------------------------ the Nativity façade (front) and the Passion façade (back)
for side, fy in ((-1, -0.56), (1, 0.56)):
    nm = 'nativity' if side < 0 else 'passion'
    box(nm + 'Wall', M['sf'], (0.0, fy, G + 0.36), (0.5, 0.06, 0.72), bevel=0.003)
    bm = bmesh.new()
    tri = [(-0.25, G + 0.72), (0.25, G + 0.72), (0.0, G + 1.0)]
    add_prism(bm, [bm.verts.new((u, fy - 0.03, z)) for u, z in tri], [bm.verts.new((u, fy + 0.03, z)) for u, z in tri])
    finish(nm + 'Gable', bm, M['sf'], smooth_sides=False)
    for u, w, h in ((0.0, 0.11, 0.34), (-0.15, 0.08, 0.26), (0.15, 0.08, 0.26)):
        OPEN.append((u, fy + side * 0.031, G, w, h, (0, side), 'pointed'))
    if side < 0:
        # the sculpture dripping down the Nativity façade
        bm = bmesh.new()
        for k in range(70):
            u = rng.uniform(-0.23, 0.23)
            z = G + rng.uniform(0.36, 0.95 - abs(u) * 1.1)
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=rng.uniform(0.012, 0.024), matrix=Matrix.Translation((u, fy - 0.035, z)) @ Matrix.Diagonal((1, 0.6, 1.6, 1)))
        finish('nativitySculpture', bm, M['sfDark'], smooth_all=True)
        lathe('cypress', M['cypress'], [(0.0, 0), (0.05, 0.02), (0.06, 0.08), (0.045, 0.16), (0.02, 0.22), (0.0, 0.25)], (0.0, fy - 0.03, G + 0.98), segs=20, smooth=True)
        bm = bmesh.new()
        for k in range(9):
            a = 2 * math.pi * k / 9
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.012, matrix=Matrix.Translation((0.055 * math.cos(a), fy - 0.03 + 0.055 * math.sin(a), G + 1.02 + 0.02 * k)))
        finish('doves', bm, M['sfWhite'], smooth_all=True)
    else:
        for u in (-0.2, -0.12, -0.04, 0.04, 0.12, 0.2):
            member((u, fy + 0.06, G), (u * 0.6, fy + 0.04, G + 0.4), 0.03)
    for k, (u, H) in enumerate(((-0.34, 1.55), (-0.13, 1.78), (0.13, 1.78), (0.34, 1.55))):
        bell_tower(f'{nm}Tower{k}', u, fy, G, H, 0.085 if abs(u) < 0.2 else 0.08, 'sfAged' if side < 0 else 'sf')

# ------------------------------------------------------------------ the evangelists, the Virgin Mary and Jesus Christ
for k, (x, y) in enumerate(((-0.24, -0.24), (0.24, -0.24), (-0.24, 0.24), (0.24, 0.24))):
    z0 = NZ + 0.1
    lathe(f'evangelist{k}', M['sf'], [(0.075, 0), (0.07, 0.6), (0.055, 1.05), (0.035, 1.38), (0.02, 1.48)], (x, y, z0), segs=32, smooth=True)
    for j in range(16):
        t = 0.08 + 0.8 * j / 16
        a = j * 1.3 + k
        r = 0.075 - 0.04 * t
        OPEN.append((x + r * math.cos(a), y + r * math.sin(a), z0 + t * 1.38, 0.018, 0.05, (math.cos(a), math.sin(a)), 'round'))
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.045, matrix=Matrix.Translation((x, y, z0 + 1.52)))
    finish(f'evangelistSymbol{k}', bm, M['gold'], smooth_all=True)
z0 = NZ + 0.12
lathe('mary', M['sf'], [(0.09, 0), (0.085, 0.55), (0.065, 1.05), (0.04, 1.42), (0.025, 1.52)], (0.55, 0.0, z0), segs=32, smooth=True)
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.05, matrix=Matrix.Translation((0.55, 0.0, z0 + 1.6)))
for k in range(12):
    a = 2 * math.pi * k / 12
    bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.022, radius2=0.0, depth=0.07, matrix=Matrix.Translation((0.55 + 0.07 * math.cos(a), 0.0, z0 + 1.6 + 0.07 * math.sin(a))) @ Matrix.Rotation(a - math.pi / 2, 4, 'Y'))
finish('maryStar', bm, M['starGlass'], smooth_sides=False)
z0 = NZ + 0.14
lathe('jesus', M['sf'], [(0.15, 0), (0.14, 0.6), (0.115, 1.2), (0.085, 1.6)], (0.0, 0.0, z0), segs=40, smooth=True)
lathe('jesusTop', M['sfWhite'], [(0.086, 0), (0.07, 0.25), (0.045, 0.5), (0.02, 0.62)], (0.0, 0.0, z0 + 1.6), segs=40, smooth=True)
for j in range(22):
    t = 0.06 + 0.88 * j / 22
    a = j * 0.9
    r = 0.15 - 0.06 * t
    OPEN.append((r * math.cos(a), r * math.sin(a), z0 + t * 1.55, 0.024, 0.07, (math.cos(a), math.sin(a)), 'round'))
ZX = z0 + 2.2
for p0, p1, t in (((0, 0, ZX - 0.02), (0, 0, ZX + 0.3), 0.05), ((-0.11, 0, ZX + 0.17), (0.11, 0, ZX + 0.17), 0.045), ((0, -0.11, ZX + 0.17), (0, 0.11, ZX + 0.17), 0.045)):
    box_m(f'cross{p0}', M['starGlass'], Matrix.Translation((Vector(p0) + Vector(p1)) / 2), (abs(p1[0] - p0[0]) or t, abs(p1[1] - p0[1]) or t, abs(p1[2] - p0[2]) or t), bevel=0.004)

# ------------------------------------------------------------------ a tower crane at the Glory end, and people
CX, CY = -1.0, 0.42
CB = bmesh.new()
for sx in (-1, 1):
    for sy in (-1, 1):
        member((CX + sx * 0.025, CY + sy * 0.025, G), (CX + sx * 0.025, CY + sy * 0.025, G + 1.7), 0.008, CB)
for k in range(17):
    z = G + k * 0.1
    for (a, b) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
        member((CX + a[0] * 0.025, CY + a[1] * 0.025, z), (CX + b[0] * 0.025, CY + b[1] * 0.025, z + 0.1), 0.004, CB)
member((CX - 0.25, CY, G + 1.72), (CX + 0.95, CY, G + 1.72), 0.03, CB)
member((CX, CY, G + 1.7), (CX, CY, G + 1.86), 0.02, CB)
member((CX, CY, G + 1.86), (CX + 0.9, CY, G + 1.73), 0.005, CB)
member((CX, CY, G + 1.86), (CX - 0.24, CY, G + 1.73), 0.005, CB)
finish('crane', CB, M['craneYellow'], smooth_sides=False)
box('craneCounterweight', M['pavingDark'], (CX - 0.2, CY, G + 1.69), (0.08, 0.05, 0.05), bevel=0.003)
member((CX + 0.6, CY, G + 1.7), (CX + 0.6, CY, G + 1.0), 0.002)
for k, (x, y, shirt) in enumerate(((-0.1, -0.78, 'red'), (0.08, -0.82, 'blue'), (0.3, -0.75, 'yellow'), (-0.4, -0.7, 'green'), (0.55, -0.6, 'red'), (-0.65, -0.4, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt)

windows('openings', M['shadow'], OPEN, depth=0.01)
finish('stoneBars', BARS, M['sf'], smooth_sides=False)
render('sagrada-familia')
