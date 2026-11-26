# The Giant's Causeway in the high-quality look (hq.py), laid out in metres on the Antrim coast: the
# honeycomb of hexagonal basalt columns stepping down from the cliff's foot into the sea, tall at the
# back and low at the water, their tops worn paler than their dark sides; the cliffs behind in bands of
# dark basalt and red laterite under their green tops; the sea, the surf round the outer columns, and
# visitors standing on the stones.
# Run: blender -b --factory-startup -P giants-causeway.py -- giants-causeway-1024.png 1024 giants-causeway.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1693)
M['basaltSide'] = material('basaltSide', '#3d3b39', 0.75, vary='#45423f', vary_scale=40, bump=0.15, bump_scale=200)
M['basaltTop'] = material('basaltTop', '#857f76', 0.85, vary='#777169', vary_scale=60, bump=0.2, bump_scale=300)
M['cliffBands'] = layered('antrimCliff', ['#3e3c3a', '#4a4440', '#8a4a32', '#423f3c', '#3a3836', '#5a4c42'], scale=5.0, distortion=1.5, rough=0.85, bump=0.4, bump_scale=60, axis='Z')
M['clifftop'] = material('antrimGrass', '#5f9a45', 0.85, vary='#6da550', vary_scale=12, bump=0.3, bump_scale=120)
M['shore'] = material('antrimShore', '#55524d', 0.9, vary='#4a4744', vary_scale=40, bump=0.5, bump_scale=200)
M['sea'] = material('northChannel', '#2f6478', 0.08, vary='#3a7287', vary_scale=8, bump=0.06, bump_scale=30)
M['foam'] = material('surf', '#eef3f2', 0.6)

S = 0.04                # metres to the tile's units


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The coast (metres above the sea): the sea floor, the stony shore, the cliffs behind with their top."""
    shore = -2.5 + 3.2 * smooth((y + 2.0 - 0.25 * x) / 10.0)
    cliff = 17.0 * smooth((y - 18.0 - 0.15 * x) / 10.0) + 1.5 * math.sin(x / 6.0) * smooth((y - 22.0) / 6.0)
    return max(shore, shore + cliff)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return (ground(x / S, y / S) + 3.0) * S * rim


def pick(z, nz, x, y):
    g = ground(x / S, y / S)
    if g > 13.0 and nz > 0.6:
        return 2
    return 1 if g > 3.0 else 0


land = terrain('coast', H, [M['shore'], M['cliffBands'], M['clifftop']], pick, rings=200, segs=500)
ZW = G + 3.0 * S        # the sea's level
sea = slab('sea', M['sea'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 16.0 * S), (-2.0, 16.0 * S)], G - 0.003, ZW, margin=0.015)     # the sea, out to the base's edge
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, ZW + z * S))


# ------------------------------------------------------------------ the columns: a hexagonal grid on the promontory, stepping down to the sea
R = 0.95                # a column's radius (to its corners), drawn larger than life to be seen
COLS = bmesh.new()
top_of = {}


def promontory(x, y):
    """How far inside the causeway's tongue a point is (metres; negative outside)."""
    ax, ay, bx, by = -16.0, 16.0, 16.0, -22.0
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
    width = 13.0 - 7.0 * t + 1.5 * math.sin(t * 9.0)
    return width - math.hypot(x - ax - dx * t, y - ay - dy * t), t


for i in range(-60, 61):
    for j in range(-60, 61):
        x = R * math.sqrt(3) * (i + j / 2.0)
        y = R * 1.5 * j
        inside, t = promontory(x, y)
        if inside < 0 or math.hypot(x, y) * S > 1.36 or ground(x, y) > 2.5:     # on the shore, not up the cliff
            continue
        h = 7.0 * (1.0 - t) ** 1.4 + 0.5 + rng.uniform(-0.6, 0.6)
        h = round(h / 0.5) * 0.5                        # each column a step up or down from its neighbours
        if inside < 2.0:
            h *= 0.55 + 0.225 * inside                    # lower at the tongue's edges
        h = max(h, ground(x, y) + 0.3, 0.35)
        ring = [(x + R * 0.93 * math.cos(math.pi / 6 + k * math.pi / 3), y + R * 0.93 * math.sin(math.pi / 6 + k * math.pi / 3)) for k in range(6)]
        bottom = [COLS.verts.new(P(u, v, -2.5)) for u, v in ring]
        top = [COLS.verts.new(P(u, v, h)) for u, v in ring]
        f = COLS.faces.new(top)
        f.material_index = 1
        COLS.faces.new(list(reversed(bottom))).material_index = 0
        for k in range(6):
            COLS.faces.new((bottom[k], bottom[(k + 1) % 6], top[(k + 1) % 6], top[k])).material_index = 0
        top_of[(i, j)] = (x, y, h)
multi('columns', COLS, [M['basaltSide'], M['basaltTop']], smooth=False)

# ------------------------------------------------------------------ the surf round the outer columns, visitors on the stones
FOAM = []
for (i, j), (x, y, h) in top_of.items():
    if h < 1.3 and promontory(x, y)[0] < 1.6 and rng.random() < 0.7:
        FOAM.append((P(x + rng.uniform(-0.6, 0.6), y + rng.uniform(-0.6, 0.6), 0.1).to_tuple(), rng.uniform(0.5, 0.9) * S, 0.25))
blob_cloud('surf', M['foam'], FOAM, subdivisions=1)
spots = sorted(top_of.values(), key=lambda c: rng.random())
VIS = []
for x, y, h in spots:
    if 1.5 < h < 6.0 and all(math.hypot(x - a, y - b) > 4.0 for a, b, _ in VIS):
        VIS.append((x, y, h))
    if len(VIS) >= 7:
        break
for k, (x, y, h) in enumerate(VIS):
    c = P(x, y, h)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k % 4], z=c.z, scale=1.3)

Rz = Matrix.Rotation(math.radians(-32.0 + 20.0), 4, 'Z')
for ob in [land, sea] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = Rz @ ob.matrix_world
render('giants-causeway')
