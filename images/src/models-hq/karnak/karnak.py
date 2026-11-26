# Karnak in the high-quality look (hq.py), laid out in metres (drawn smaller than it is, to fit): the
# temple of Amun at Luxor; the great pylon behind, its two battered towers and the gateway between
# them; before it the Great Hypostyle Hall's forest of carved sandstone columns, the tall central aisle
# with its open papyrus capitals, the rest with their closed buds, some still carrying their stone beams;
# Hatshepsut's obelisk rising beyond; the sacred lake to one side, palms, and people.
# Run: blender -b --factory-startup -P karnak.py -- karnak-1024.png 1024 karnak.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1290)
M['sandK'] = material('karnakSandstone', '#d2b384', 0.85, vary='#c4a576', vary_scale=24, bump=0.2, bump_scale=200)
M['reliefK'] = material('karnakRelief', '#c9a979', 0.85, vary='#a88b60', vary_scale=160, bump=0.6, bump_scale=300)
M['paintK'] = material('karnakPaint', '#d6b688', 0.8, vary='#8fa6a0', vary_scale=90)
M['groundK'] = material('karnakGround', '#d9c49a', 0.95, vary='#cdb88d', vary_scale=10, bump=0.3, bump_scale=200)
M['lakeK'] = material('sacredLake', '#3f7f8a', 0.06, coat=0.8)
M['palmTrunkK'] = material('palmTrunkKa', '#a49a86', 0.8, vary='#968c78', vary_scale=40)
M['frondKa'] = material('palmFrondKa', '#4f8f36', 0.8, vary='#5c9c40', vary_scale=20)
M['graniteK'] = material('obeliskGranite', '#a06e5a', 0.6, vary='#8f6150', vary_scale=40)

S = 0.0255              # metres to the tile's units
FY = 4.0
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def battered(name, mat, x0, x1, y0, y1, z1, lean):
    bm = bmesh.new()
    lo = [bm.verts.new(P(x, y, 0.0)) for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
    hi = [bm.verts.new(P(x, y, z1)) for x, y in ((x0 + lean, y0 + lean * 0.5), (x1 - lean, y0 + lean * 0.5), (x1 - lean, y1 - lean * 0.5), (x0 + lean, y1 - lean * 0.5))]
    add_prism(bm, lo, hi)
    return finish(name, bm, mat, smooth_sides=False)


def papyrus(name, x, y, r, h, open_cap):
    """A papyrus column: the carved shaft swelling a little at its foot, and its capital, open or in bud."""
    lathe(name + 'Base', M['sandK'], [(r * 1.35 * S, 0.0), (r * 1.35 * S, 0.8 * S), (r * 1.1 * S, 1.0 * S)], P(x, y, 0.0), segs=24)
    lathe(name + 'Shaft', M['reliefK'], [(r * 1.08 * S, 0.0), (r * S, h * 0.15 * S), (r * 0.94 * S, h * 0.8 * S)], P(x, y, 1.0), segs=24, smooth=True)
    hz = 1.0 + h * 0.8
    if open_cap:
        lathe(name + 'Capital', M['paintK'], [(r * 0.94 * S, 0.0), (r * 1.2 * S, 1.2 * S), (r * 1.9 * S, 3.0 * S), (r * 2.1 * S, 3.6 * S), (0.0, 3.6 * S)], P(x, y, hz), segs=24, smooth=True)
        top = hz + 3.6
    else:
        lathe(name + 'Capital', M['paintK'], [(r * 0.94 * S, 0.0), (r * 1.15 * S, 1.0 * S), (r * 1.1 * S, 2.0 * S), (r * 0.8 * S, 2.8 * S), (0.0, 3.0 * S)], P(x, y, hz), segs=24, smooth=True)
        top = hz + 3.0
    box(name + 'Abacus', M['sandK'], P(x, y, top + 0.5), (r * 1.7 * S, r * 1.7 * S, 1.0 * S), bevel=0)
    return top + 1.0


BEFORE = set(bpy.data.objects)
slab('ground', M['groundK'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
WIN = []
# ------------------------------------------------------------------ the pylon: two battered towers, the gateway
PY0, PY1 = 26.0, 34.0      # the pylon behind the hall, seen from the hall's side
for s in (-1, 1):
    battered(f'pylon{s}', M['reliefK'], *sorted((s * 5.0, s * 27.0)), PY0, PY1, 30.0, 2.6)
    box(f'pylonCornice{s}', M['sandK'], P(s * 15.6, (PY0 + PY1) / 2 + 0.7, 30.4), (20.0 * S, 6.8 * S, 0.8 * S), bevel=0)
box('gateway', M['sandK'], P(0.0, (PY0 + PY1) / 2, 11.0), (10.0 * S, 9.0 * S, 22.0 * S), bevel=0)
c = P(0.0, PY0 - 0.05, 0)
WIN.append((c.x, c.y, Z0 + 0.0, 5.0 * S, 14.0 * S, (0, -1), 'rect'))
box('gatewayLintel', M['sandK'], P(0.0, PY0 - 0.3, 20.6), (11.0 * S, 1.0 * S, 2.0 * S), bevel=0)
glazed('doorway', WIN, M['sandK'], glass=M['door'], depth=0.4 * S, bars=False)

# ------------------------------------------------------------------ the hypostyle hall: the tall central aisle, the forest of bud columns, beams
HY0 = -22.0
ROWS, COLS = 6, 8
SP = 6.0
tops = {}
for j in range(ROWS):
    y = HY0 + SP * j
    for i in range(COLS):
        x = -SP * (COLS - 1) / 2 + SP * i
        central = abs(x) < SP * 0.6 + 0.1
        if central:
            continue
        if math.hypot(x, y - FY) * S > 1.34:
            continue
        tops[(i, j)] = papyrus(f'col{i}{j}', x, y, 1.25, 15.0, False)
for j in range(ROWS):
    y = HY0 + SP * j
    for s in (-1, 1):
        tops[('c', j, s)] = papyrus(f'central{j}{s}', s * 3.0, y, 1.7, 21.0, True)
# beams: along the central aisle, and over some of the side rows
for s in (-1, 1):
    z = tops[('c', 0, s)]
    box(f'centralBeam{s}', M['sandK'], P(s * 3.0, HY0 + SP * (ROWS - 1) / 2, z + 0.8), (2.6 * S, (SP * (ROWS - 1) + 4.0) * S, 1.6 * S), bevel=0)
for k, (i, j0, j1) in enumerate(((1, 0, 3), (2, 1, 4), (5, 0, 2), (6, 2, 5), (0, 3, 5))):
    if (i, j0) not in tops:
        continue
    x = -SP * (COLS - 1) / 2 + SP * i
    z = tops[(i, j0)]
    box(f'sideBeam{k}', M['sandK'], P(x, HY0 + SP * (j0 + j1) / 2, z + 0.6), (2.2 * S, (SP * (j1 - j0) + 3.0) * S, 1.2 * S), bevel=0)
box('clerestory', M['reliefK'], P(0.0, HY0 + SP * (ROWS - 1) / 2, 23.2), (9.0 * S, (SP * (ROWS - 1) + 4.0) * S, 0.8 * S), bevel=0)

# ------------------------------------------------------------------ the obelisk, the sacred lake, palms, people
OX, OY = -30.0, 8.0
box('obeliskBase', M['sandK'], P(OX, OY, 1.0), (4.0 * S, 4.0 * S, 2.0 * S), bevel=0)
bm = bmesh.new()
lo = [bm.verts.new(P(OX + sx * 1.3, OY + sy * 1.3, 2.0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
hi = [bm.verts.new(P(OX + sx * 0.9, OY + sy * 0.9, 28.0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
add_prism(bm, lo, hi)
finish('obelisk', bm, M['graniteK'], smooth_sides=False)
pyramid('obeliskTip', M['gold'], OX * S, (OY - FY) * S, Z0 + 28.0 * S, 1.8 * S, 1.8 * S)
slab('lake', M['lakeK'], [(28.0 * S, (-26.0 - FY) * S), (44.0 * S, (-26.0 - FY) * S), (44.0 * S, (-4.0 - FY) * S), (28.0 * S, (-4.0 - FY) * S)], Z0, Z0 + 0.15 * S, margin=0.03)
for j, (x, y) in enumerate(((-38.0, -14.0), (-36.0, 22.0), (34.0, 10.0), (38.0, 22.0), (-22.0, -36.0))):
    h = 12.0
    lathe(f'palm{j}', M['palmTrunkK'], [(0.45 * S, 0.0), (0.35 * S, h * 0.5 * S), (0.32 * S, h * S)], P(x, y, 0.0), segs=10, smooth=True)
    for f in range(8):
        b = 2 * math.pi * f / 8 + j
        tube(f'frond{j}{f}', M['frondKa'], [P(x, y, h), P(x + 2.0 * math.cos(b), y + 2.0 * math.sin(b), h + 0.7), P(x + 3.8 * math.cos(b), y + 3.8 * math.sin(b), h - 1.2)], 0.3 * S)
for k, (x, y, shirt) in enumerate(((-2.0, -32.0, 'red'), (3.0, -34.0, 'blue'), (0.0, -10.0, 'yellow'), (-10.0, 2.0, 'green'), (-24.0, 4.0, 'red'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('karnak')
