# The Parthenon in the high-quality look (hq.py): the Acropolis rock with its cliffs and the pines
# and olives below, its pale top; on it the Parthenon as it stands today, roofless: the three steps,
# the Doric colonnade of 8 by 17 fluted columns with their capitals, the architrave, the frieze of
# triglyphs and metopes and the cornice, a pediment at each end, the porch columns inside and the
# stubs of the cella walls; behind it the Erechtheion with its Porch of the Caryatids, at the west end
# the Propylaea's gateway, olive trees and visitors.
# Run: blender -b --factory-startup -P parthenon.py -- parthenon-1024.png 1024 parthenon.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(438)
M['pm'] = material('pentelic', '#eadfc6', 0.55, vary='#dccdaa', vary_scale=14, bump=0.12, bump_scale=160)
M['pmShade'] = material('pentelicShade', '#cbbd9c', 0.6, vary='#bcad8b', vary_scale=14, bump=0.12, bump_scale=160)
M['acroTop'] = material('acroTop', '#ddd3bf', 0.85, vary='#cfc3aa', vary_scale=12, bump=0.25, bump_scale=200)
M['acroRock'] = layered('acroRock', ['#b8a68a', '#a89478', '#c4b394', '#9c8a70'], scale=9.0, distortion=3.0, bump=0.5, bump_scale=30)
M['olive'] = material('olive', '#86a062', 0.85, vary='#748f52', vary_scale=14, bump=0.4, bump_scale=90)
COLS = bmesh.new()


def doric(bm, x, y, z0, h, r):
    """A fluted Doric column: the shaft (16 facets, tapering), the echinus and the abacus."""
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=r, radius2=r * 0.8, depth=h * 0.92, matrix=Matrix.Translation((x, y, z0 + h * 0.46)))
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=r * 0.82, radius2=r * 1.3, depth=h * 0.05, matrix=Matrix.Translation((x, y, z0 + h * 0.945)))
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x, y, z0 + h * 0.985)) @ Matrix.Diagonal((r * 2.7, r * 2.7, h * 0.035, 1)))


# ------------------------------------------------------------------ the rock
Z0 = G + 0.3
N, SEG = 10, 96
bm = bmesh.new()
rings = []
for i in range(N + 1):
    t = i / N
    A = 1.18 + 0.24 * (1 - t) ** 1.6
    B = 0.72 + 0.34 * (1 - t) ** 1.6
    e = 2.2 + 1.3 * t
    z = G - 0.012 + (Z0 - G + 0.012) * t
    ring = []
    for k in range(SEG):
        a = 2 * math.pi * k / SEG
        c, s = math.cos(a), math.sin(a)
        j = 1 + (rng.uniform(-0.035, 0.035) if 0.2 < t < 0.99 else 0.0)
        ring.append(bm.verts.new((A * math.copysign(abs(c) ** (2 / e), c) * j, B * math.copysign(abs(s) ** (2 / e), s) * j, z)))
    rings.append(ring)
for i in range(N):
    for k in range(SEG):
        f = bm.faces.new((rings[i][k], rings[i][(k + 1) % SEG], rings[i + 1][(k + 1) % SEG], rings[i + 1][k]))
        f.material_index = 0 if i < 3 else 1
bm.faces.new(rings[-1]).material_index = 2
ring_co = [[v.co.copy() for v in r] for r in rings]
multi('acropolis', bm, [M['grass'], M['acroRock'], M['acroTop']], smooth=False)
for k in range(0, SEG, 2):
    if rng.random() < 0.45:
        continue
    p = ring_co[1 + rng.randint(0, 1)][k]
    (cypress if rng.random() < 0.4 else tree)(f'slope{k}', p.x * 1.02, p.y * 1.02, h=0.14, r=0.05 if rng.random() < 0.5 else 0.03, z=p.z - 0.01)

# ------------------------------------------------------------------ the Parthenon
TX, TY = 0.08, -0.05
L, W = 1.38, 0.6
for k in range(3):
    box(f'step{k}', M['pmShade'] if k < 2 else M['pm'], (TX, TY, Z0 + 0.0125 + 0.025 * k), (L + 0.12 - 0.04 * k, W + 0.12 - 0.04 * k, 0.025), bevel=0.002)
ZS = Z0 + 0.075
CH, CR = 0.36, 0.026
xs = [TX - L / 2 + 0.04 + i * (L - 0.08) / 16 for i in range(17)]
ys = [TY - W / 2 + 0.04 + i * (W - 0.08) / 7 for i in range(8)]
for x in xs:
    for y in (ys[0], ys[-1]):
        doric(COLS, x, y, ZS, CH, CR)
for y in ys[1:-1]:
    for x in (xs[0], xs[-1]):
        doric(COLS, x, y, ZS, CH, CR)
# the porches' columns inside, and the cella's stubs
for x in (TX - L / 2 + 0.19, TX + L / 2 - 0.19):
    for y in ys[1:-1]:
        doric(COLS, x, y, ZS, CH * (0.92 if x < TX else 0.6), CR * 0.9)
finish('columns', COLS, M['pm'], smooth_sides=False)
box('cellaN', M['pmShade'], (TX, TY + W / 2 - 0.15, ZS + 0.04), (L - 0.5, 0.03, 0.08), bevel=0.002)
box('cellaS', M['pmShade'], (TX, TY - W / 2 + 0.15, ZS + 0.06), (L - 0.5, 0.03, 0.12), bevel=0.002)
box('cellaFloor', M['acroTop'], (TX, TY, ZS + 0.001), (L - 0.1, W - 0.1, 0.002), bevel=0)
ZE = ZS + CH
# the entablature, as a frame round the top: architrave, frieze, cornice
for (cx, cy, sx, sy) in ((TX, TY - W / 2 + 0.04, L, 0.07), (TX, TY + W / 2 - 0.04, L, 0.07), (TX - L / 2 + 0.04, TY, 0.07, W), (TX + L / 2 - 0.04, TY, 0.07, W)):
    box(f'architrave{cx:.2f}{cy:.2f}', M['pm'], (cx, cy, ZE + 0.022), (sx, sy, 0.044), bevel=0.002)
    box(f'frieze{cx:.2f}{cy:.2f}', M['pm'], (cx, cy, ZE + 0.066), (sx - 0.006, sy - 0.006, 0.044), bevel=0.001)
    box(f'cornice{cx:.2f}{cy:.2f}', M['pm'], (cx, cy, ZE + 0.096), (sx + 0.016, sy + 0.016, 0.016), bevel=0.002)
TRI = []
for x in xs + [(a + b) / 2 for a, b in zip(xs, xs[1:])]:
    for y, nrm in ((TY - W / 2 + 0.004, (0, -1)), (TY + W / 2 - 0.004, (0, 1))):
        TRI.append((x, y, ZE + 0.048, 0.022, 0.036, nrm, 'rect'))
for y in ys + [(a + b) / 2 for a, b in zip(ys, ys[1:])]:
    for x, nrm in ((TX - L / 2 + 0.004, (-1, 0)), (TX + L / 2 - 0.004, (1, 0))):
        TRI.append((x, y, ZE + 0.048, 0.022, 0.036, nrm, 'rect'))
windows('triglyphs', M['pmShade'], TRI, depth=0.008)
# the pediments: the west one nearly whole, the east one broken
for k, (x, keep) in enumerate(((TX - L / 2 + 0.04, 1.0), (TX + L / 2 - 0.04, 0.7))):
    bm = bmesh.new()
    half = W / 2 + 0.008
    tri = [(-half, 0), (half * (2 * keep - 1), 0), (half * (2 * keep - 1), 0.13 * (1 - abs(2 * keep - 1)) if keep < 1 else 0), (0, 0.13)] if keep < 1 else [(-half, 0), (half, 0), (0, 0.13)]
    add_prism(bm, [bm.verts.new((x - 0.035, TY + u, ZE + 0.104 + z)) for u, z in tri], [bm.verts.new((x + 0.035, TY + u, ZE + 0.104 + z)) for u, z in tri])
    finish(f'pediment{k}', bm, M['pm'], bevel=0.002, smooth_sides=False)
bm = bmesh.new()
for k in range(7):
    u = -0.2 + k * 0.066
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.017, matrix=Matrix.Translation((TX - L / 2 + 0.002, TY + u, ZE + 0.118 + 0.08 * (1 - abs(u) / 0.3))) @ Matrix.Diagonal((0.6, 1, 1.4, 1)))
finish('pedimentFigures', bm, M['pmShade'], smooth_all=True)

# ------------------------------------------------------------------ the Erechtheion and its caryatids
EX, EY = -0.45, 0.5
box('erechtheion', M['pm'], (EX, EY, Z0 + 0.12), (0.34, 0.18, 0.24), bevel=0.003)
gable_roof('erechtheionRoof', M['pmShade'], EX - 0.17, EX + 0.17, EY - 0.09, EY + 0.09, Z0 + 0.24, 0.05, over=0.01)
EC = bmesh.new()
for k in range(6):
    doric(EC, EX + 0.2, EY - 0.08 + k * 0.032, Z0, 0.24, 0.011)
finish('erechtheionColumns', EC, M['pm'], smooth_sides=False)
box('caryatidPlinth', M['pm'], (EX - 0.08, EY - 0.135, Z0 + 0.04), (0.14, 0.08, 0.08), bevel=0.002)
for k in range(4):
    x = EX - 0.13 + k * 0.034
    cylinder(f'caryatid{k}', M['pm'], 0.009, 0.09, (x, EY - 0.16, Z0 + 0.08), segs=10, r2=0.007)
    cylinder(f'caryatidHead{k}', M['pm'], 0.007, 0.016, (x, EY - 0.16, Z0 + 0.17), segs=10)
box('caryatidRoof', M['pm'], (EX - 0.08, EY - 0.135, Z0 + 0.195), (0.16, 0.09, 0.02), bevel=0.002)

# ------------------------------------------------------------------ the Propylaea at the west end
PX = -0.98
box('propylaeaBase', M['pmShade'], (PX, 0.0, Z0 + 0.015), (0.2, 0.5, 0.03), bevel=0.002)
PC = bmesh.new()
for k in range(6):
    doric(PC, PX - 0.06, -0.19 + k * 0.076, Z0 + 0.03, 0.22, 0.018)
finish('propylaeaColumns', PC, M['pm'], smooth_sides=False)
box('propylaeaHall', M['pm'], (PX + 0.05, 0.0, Z0 + 0.13), (0.1, 0.48, 0.2), bevel=0.002)
box('propylaeaEntablature', M['pm'], (PX - 0.02, 0.0, Z0 + 0.27), (0.2, 0.5, 0.05), bevel=0.002)
bm = bmesh.new()
tri = [(-0.25, 0), (0.25, 0), (0, 0.08)]
add_prism(bm, [bm.verts.new((PX - 0.12, u, Z0 + 0.295 + z)) for u, z in tri], [bm.verts.new((PX + 0.08, u, Z0 + 0.295 + z)) for u, z in tri])
finish('propylaeaPediment', bm, M['pm'], smooth_sides=False)
windows('propylaeaDoor', M['shadow'], [(PX + 0.0, 0.0, Z0 + 0.03, 0.08, 0.15, (-1, 0), 'rect')], depth=0.01)

# ------------------------------------------------------------------ olives and visitors
for k, (x, y) in enumerate(((-0.75, -0.45), (0.85, 0.48), (-0.15, 0.55), (0.6, 0.55), (-0.85, 0.35))):
    tree(f'olive{k}', x, y, h=0.13, r=0.065, mat='olive', z=Z0)
for k, (x, y, shirt) in enumerate(((-0.5, -0.42, 'red'), (-0.42, -0.48, 'blue'), (-0.2, -0.45, 'yellow'), (0.4, -0.48, 'green'), (0.6, -0.45, 'red'), (-0.7, 0.0, 'blue'), (0.95, 0.0, 'yellow'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, scale=0.9, z=Z0)

render('parthenon')
