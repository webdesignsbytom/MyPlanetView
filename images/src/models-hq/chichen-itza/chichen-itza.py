# Chichén Itzá (El Castillo, the Temple of Kukulcán) in the high-quality look (hq.py): the great
# plaza's lawn with the jungle round it, and the pyramid: nine sloping terraces, each with its rows of
# recessed panels, a staircase up the middle of each side between its balustrades, the feathered
# serpents' heads at the foot of the north stairs, and the temple on top with its doorways divided by
# serpent columns, its frieze and cornice; visitors on the plaza.
# Run: blender -b --factory-startup -P chichen-itza.py -- chichen-itza-1024.png 1024 chichen-itza.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1100)
M['maya'] = material('mayaStone', '#d4cab2', 0.8, vary='#bfb398', vary_scale=24, bump=0.35, bump_scale=160)
M['mayaShade'] = material('mayaShade', '#b2a78f', 0.85, vary='#a1967e', vary_scale=24, bump=0.35, bump_scale=160)
M['mayaDark'] = material('mayaDark', '#8e846f', 0.85, vary='#7c735f', vary_scale=24, bump=0.35, bump_scale=160)
M['jungle'] = material('jungle', '#3f8f3a', 0.85, vary='#357d31', vary_scale=8, bump=0.3, bump_scale=200)
SQ = math.sqrt(2)

# ------------------------------------------------------------------ the plaza and the jungle round it
slab('path', M['gravel'], rect(0.0, -1.05, 0.22, 0.6), G - 0.002, G + 0.004)
placed = 0
for k in range(600):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(1.12, 1.4)
    x, y = r * math.cos(a), r * math.sin(a)
    if abs(x) < 0.2 and y < 0:
        continue
    tree(f'jungle{k}', x, y, h=0.16 + 0.07 * rng.random(), r=0.07 + 0.03 * rng.random(), mat='leaf' if rng.random() < 0.6 else 'leafDark')
    placed += 1
    if placed > 70:
        break

# ------------------------------------------------------------------ the pyramid's nine terraces
B0, B1, HP = 0.92, 0.3, 0.72          # the half-widths at the foot and at the top, the height
N = 9
for k in range(N):
    z0 = G + HP * k / N
    z1 = G + HP * (k + 1) / N
    w0 = B0 - (B0 - B1) * k / N
    w1 = B0 - (B0 - B1) * (k + 1) / N + 0.022
    lathe(f'terrace{k}', M['maya'], [(w0 * SQ, 0), (w1 * SQ, z1 - z0)], (0, 0, 0), segs=4, matrix=Matrix.Translation((0, 0, z0)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
    # the recessed panels along each face, either side of the stairs
    specs = []
    for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
        tx, ty = -ny, nx
        wm = (w0 + w1) / 2 - 0.012
        n = max(2, int((wm - 0.16) / 0.07))
        for side in (-1, 1):
            for j in range(n):
                u = side * (0.17 + (j + 0.5) * (wm - 0.17) / n)
                specs.append((nx * (wm + 0.004) + tx * u, ny * (wm + 0.004) + ty * u, z0 + (z1 - z0) * 0.2, (wm - 0.17) / n * 0.62, (z1 - z0) * 0.55, (nx, ny), 'rect'))
    windows(f'panels{k}', M['mayaShade'], specs, depth=0.01)

# ------------------------------------------------------------------ the four staircases with their balustrades
for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
    tx, ty = -ny, nx
    bm = bmesh.new()
    NS = 36
    for j in range(NS):
        f0, f1 = j / NS, (j + 1) / NS
        out0 = B0 + 0.06 - (B0 + 0.06 - B1) * f0
        z = G + HP * f1
        c = Vector((nx * (out0 - 0.02), ny * (out0 - 0.02), (G + z) / 2))
        depth = (B0 - B1) / NS + 0.02
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((nx * (out0 - depth / 2), ny * (out0 - depth / 2), (G + z) / 2)) @ Matrix.Diagonal((0.24 if ny else depth, depth if ny else 0.24, z - G, 1)))
    finish(f'stairs{nx}{ny}', bm, M['maya'], smooth_sides=False)
    for side in (-1, 1):
        u = side * 0.135
        p0 = Vector((nx * (B0 + 0.07) + tx * u, ny * (B0 + 0.07) + ty * u, G + 0.02))
        p1 = Vector((nx * (B1 + 0.02) + tx * u, ny * (B1 + 0.02) + ty * u, G + HP + 0.02))
        d = p1 - p0
        rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        box_m(f'balustrade{nx}{ny}{side}', M['mayaShade'], Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Rotation(math.atan2(ty, tx), 4, 'Z'), (0.035, 0.035, d.length + 0.02), bevel=0.003)
# the feathered serpents' heads at the foot of the north (front) stairs
for side in (-1, 1):
    hx, hy = side * 0.135, -(B0 + 0.12)
    box(f'serpentHead{side}', M['mayaShade'], (hx, hy, G + 0.035), (0.06, 0.08, 0.06), bevel=0.012)
    box(f'serpentJaw{side}', M['mayaDark'], (hx, hy - 0.035, G + 0.022), (0.05, 0.02, 0.02), bevel=0.004)
    windows(f'serpentEyes{side}', M['shadow'], [(hx + e, hy - 0.04, G + 0.045, 0.01, 0.01, (0, -1), 'rect') for e in (-0.018, 0.018)], depth=0.004)

# ------------------------------------------------------------------ the temple on top
TZ = G + HP
box('templeBase', M['maya'], (0, 0, TZ + 0.012), (2 * B1 + 0.02, 2 * B1 + 0.02, 0.024), bevel=0.003)
TW = 0.22
box('temple', M['maya'], (0, 0, TZ + 0.024 + 0.08), (2 * TW, 2 * TW, 0.16), bevel=0.003)
box('templeFrieze', M['mayaShade'], (0, 0, TZ + 0.024 + 0.19), (2 * TW + 0.016, 2 * TW + 0.016, 0.06), bevel=0.002)
box('templeCornice', M['maya'], (0, 0, TZ + 0.024 + 0.227), (2 * TW + 0.03, 2 * TW + 0.03, 0.018), bevel=0.002)
box('templeRoof', M['maya'], (0, 0, TZ + 0.024 + 0.245), (2 * TW - 0.02, 2 * TW - 0.02, 0.02), bevel=0.002)
specs, frieze = [], []
for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
    tx, ty = -ny, nx
    doors = (-0.1, 0.0, 0.1) if ny == -1 else (0.0,)
    for u in doors:
        specs.append((nx * TW + tx * u, ny * TW + ty * u, TZ + 0.024, 0.06 if ny == -1 else 0.08, 0.12, (nx, ny), 'rect'))
    for j in range(7):
        u = -TW + (j + 0.5) * 2 * TW / 7
        frieze.append((nx * (TW + 0.009) + tx * u, ny * (TW + 0.009) + ty * u, TZ + 0.024 + 0.172, 0.034, 0.034, (nx, ny), 'rect'))
windows('templeDoors', M['shadow'], specs, depth=0.012)
windows('templeFriezeMasks', M['mayaDark'], frieze, depth=0.008)
for u in (-0.05, 0.05):
    cylinder(f'serpentColumn{u}', M['mayaShade'], 0.014, 0.12, (u, -TW - 0.004, TZ + 0.024), segs=10)

for k, (x, y, shirt) in enumerate(((-0.25, -1.08, 'red'), (0.08, -1.12, 'blue'), (0.3, -1.05, 'yellow'), (-0.55, -0.98, 'green'), (0.6, -0.95, 'red'), (-0.05, -0.98, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt)

render('chichen-itza')
