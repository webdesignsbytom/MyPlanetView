# The Ponte Vecchio in the high-quality look (hq.py), drawn to its real proportions (laid out in
# metres): Florence's old bridge of three low arches over the Arno, the cutwaters on its piers, the
# goldsmiths' shops crowding both sides in ochre, orange, yellow and pink with green shutters and tiled
# roofs, jutting out over the river on wooden brackets, the open terrace in the middle, and Vasari's
# corridor running along the top of the upstream side; the river, the embankments and their roads, and
# people.
# Run: blender -b --factory-startup -P ponte-vecchio.py -- ponte-vecchio-1024.png 1024 ponte-vecchio.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1345)
M['arno'] = material('arno', '#5f8a70', 0.08, vary='#6a957a', vary_scale=3, coat=0.5, bump=0.1, bump_scale=40)
M['pietraP'] = material('pietraForteP', '#bba78a', 0.75, vary='#ab977a', vary_scale=20, bump=0.2, bump_scale=140)
M['pietraShade'] = material('pietraShadeP', '#a5927a', 0.8, vary='#97856d', vary_scale=20, bump=0.2, bump_scale=140)
M['lungarno'] = masonry('lungarno', '#b5ab9c', '#8d8477', scale=80, rough=0.8, vary='#a99f90')
M['tilesP'] = banded(material('tilesP', '#bf6a43', 0.7, vary='#ab5c38', vary_scale=12, bump=0.15, bump_scale=200), 'X', 220.0, strength=0.35)
M['shutter'] = material('shutterGreen', '#3f6b4a', 0.6)
M['bracket'] = material('bracketWood', '#5a3e28', 0.7)
COLOURS = [material(f'facade{k}', c, 0.8, vary=c, vary_scale=20, bump=0.12, bump_scale=200) for k, c in enumerate(('#d9a25a', '#d98a4c', '#e6c27a', '#d49a86', '#c98a5a', '#e2b26e'))]
M['asphalt'] = material('asphaltP', '#55545a', 0.8, vary='#4b4a50', vary_scale=40, bump=0.1, bump_scale=300)
M['vasari'] = material('vasariOchre', '#d6a764', 0.8, vary='#c99a58', vary_scale=20, bump=0.12, bump_scale=200)

S = 0.0288              # metres to the tile's units
Z0 = G + 0.002          # the river
DZ = 8.0                # the roadway's height above the river
HALF = 42.0             # half the bridge's length, bank to bank
RW = 4.5                # half the roadway's width
OPEN = []


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


# ------------------------------------------------------------------ the river and the embankments
slab('arno', M['arno'], [(-HALF * S, -2), (HALF * S, -2), (HALF * S, 2), (-HALF * S, 2)], G - 0.004, Z0, margin=0.02)
for sx in (-1, 1):
    slab(f'lungarno{sx}', M['lungarno'], [(sx * HALF * S, -2), (sx * 2.0, -2), (sx * 2.0, 2), (sx * HALF * S, 2)], G - 0.004, Z0 + DZ * S, bevel=0.003, margin=0.02)
    slab(f'road{sx}', M['asphalt'], [((sx * (HALF + 4)) * S, -2), ((sx * (HALF + 14)) * S, -2), ((sx * (HALF + 14)) * S, 2), ((sx * (HALF + 4)) * S, 2)], Z0 + DZ * S - 0.001, Z0 + DZ * S + 0.0015, margin=0.03)

# ------------------------------------------------------------------ the bridge: three low arches, the piers and their cutwaters
SPANS = [(-29.0, 12.0), (0.0, 14.0), (29.0, 12.0)]          # each arch's middle and half-span: 3 m piers between
BWID = 16.0                                                 # half the bridge's own width (the stone)
prof = [(-HALF, DZ), (-HALF, -0.5)]
for cx, hs in SPANS:
    prof.append((cx - hs, -0.5))
    for k in range(1, 12):
        t = -1 + 2 * k / 12
        prof.append((cx + t * hs, 4.2 * (1 - t * t) ** 0.5))
    prof.append((cx + hs, -0.5))
prof += [(HALF, -0.5), (HALF, DZ)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(x, -BWID, z)) for x, z in prof], [bm.verts.new(P(x, BWID, z)) for x, z in prof])
finish('bridge', bm, M['pietraP'], bevel=0.003, smooth_sides=False)
for px in (-15.5, 15.5):
    for sy in (-1, 1):
        bm = bmesh.new()
        tri = [(px - 2.0, sy * BWID), (px + 2.0, sy * BWID), (px, sy * (BWID + 4.0))]
        add_prism(bm, [bm.verts.new(P(x, y, -0.5)) for x, y in tri], [bm.verts.new(P(x, y, 5.0)) for x, y in tri])
        finish(f'cutwater{px}{sy}', bm, M['pietraShade'], smooth_sides=False)
slab('roadway', M['lungarno'], [(-HALF * S, -RW * S), (HALF * S, -RW * S), (HALF * S, RW * S), (-HALF * S, RW * S)], Z0 + DZ * S - 0.001, Z0 + DZ * S + 0.002, margin=0.02)

# ------------------------------------------------------------------ the shops along both sides, jutting over the river on brackets
BRACK = bmesh.new()
for sy in (-1, 1):
    x = -HALF + 3.0
    k = 0
    while x < HALF - 3.0:
        w = rng.uniform(3.0, 5.2)
        if abs(x + w / 2) < 9.5:          # the open terrace in the middle
            x += w
            continue
        out = rng.uniform(1.0, 3.0)        # how far it juts over the river
        y0, y1 = sy * RW, sy * (BWID + out)
        h = rng.choice((6.0, 7.5, 9.0))
        mat = COLOURS[k % len(COLOURS)]
        box(f'shop{sy}{k}', mat, P(x + w / 2, (y0 + y1) / 2, DZ + h / 2), ((w - 0.15) * S, abs(y1 - y0) * S, h * S), bevel=0.001)
        gable_roof(f'shopRoof{sy}{k}', M['tilesP'], x * S, (x + w) * S, min(y0, y1) * S, max(y0, y1) * S, Z0 + (DZ + h) * S, 1.6 * S, over=0.004, along='y')
        for z in (DZ + 1.5, DZ + 4.3) + ((DZ + 7.0,) if h > 8 else ()):
            OPEN.append(((x + w / 2) * S, (y1 + sy * 0.05) * S, Z0 + z * S, 1.1 * S, 1.6 * S, (0, sy), 'rect'))
            for u in (-0.95, 0.95):
                box(f'shutter{sy}{k}{z}{u}', M['shutter'], P(x + w / 2 + u, y1 + sy * 0.15, z + 0.8), (0.6 * S, 0.2 * S, 1.6 * S), bevel=0)
        if out > 1.2:                    # the wooden brackets under the jutting part
            for u in (0.4, w - 0.4):
                a = P(x + u, sy * (BWID - 0.2), DZ - 2.8)
                b = P(x + u, sy * (BWID + out - 0.3), DZ - 0.1)
                d = b - a
                rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
                bmesh.ops.create_cube(BRACK, size=1.0, matrix=Matrix.Translation((a + b) / 2) @ rot @ Matrix.Diagonal((0.35 * S, 0.35 * S, d.length, 1)))
        x += w
        k += 1
finish('brackets', BRACK, M['bracket'], smooth_sides=False)
# the open terrace in the middle: its arcade looking down the river
for sy in (-1, 1):
    for u in (-6.0, 0.0, 6.0):
        box(f'terracePier{sy}{u}', M['pietraP'], P(u, sy * (BWID - 0.6), DZ + 2.5), (1.2 * S, 1.2 * S, 5.0 * S), bevel=0.001)

# ------------------------------------------------------------------ Vasari's corridor, along the top of the upstream shops
VY = BWID - 2.5
box('vasari', M['vasari'], P(0, VY, DZ + 11.5), ((2 * HALF - 4) * S, 5.0 * S, 4.0 * S), bevel=0.002)
gable_roof('vasariRoof', M['tilesP'], (-HALF + 2) * S, (HALF - 2) * S, (VY - 2.6) * S, (VY + 2.6) * S, Z0 + (DZ + 13.5) * S, 1.4 * S, over=0.003)
for k in range(30):
    x = -HALF + 4 + (2 * HALF - 8) * k / 29
    OPEN.append((x * S, (VY + 2.55) * S, Z0 + (DZ + 10.6) * S, 0.9 * S, 1.0 * S, (0, 1), 'rect'))
    OPEN.append((x * S, (VY - 2.55) * S, Z0 + (DZ + 10.6) * S, 0.9 * S, 1.0 * S, (0, -1), 'rect'))
for u in (-6.0, 6.0):              # its piers down over the terrace
    box(f'vasariPier{u}', M['vasari'], P(u, VY, DZ + 4.8), (1.4 * S, 4.6 * S, 9.6 * S), bevel=0.001)

for k, (x, y, shirt) in enumerate(((-0.15, -0.05, 'red'), (0.1, 0.06, 'blue'), (-0.5, 0.02, 'yellow'), (0.55, -0.04, 'green'), (-1.4 + 0.12, -0.5, 'red'), (1.3, 0.5, 'blue'))):
    zz = Z0 + (DZ * S + 0.002)
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=zz, scale=0.9)

glazed('windows', OPEN, M['pietraShade'], depth=0.25 * S, bars=False)
render('ponte-vecchio')
