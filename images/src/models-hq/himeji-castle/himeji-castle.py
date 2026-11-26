# Himeji Castle in the high-quality look (hq.py), laid out in metres: the White Heron on its hill; the
# great keep on its curved, battered stone base, five storeys of white plaster walls with their small
# windows, the grey tiled roof skirts between them, the triangular gables and the curved cusped gable
# over the front, the crowning roof with its golden fish at the ridge's ends; two smaller keeps beside it
# joined by low corridors; the stone walls of the hill's terraces, cherry trees in blossom and pines, and
# people on the path.
# Run: blender -b --factory-startup -P himeji-castle.py -- himeji-castle-1024.png 1024 himeji-castle.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1609)
M['plaster'] = material('himejiPlaster', '#f6f5f0', 0.6, vary='#eeede7', vary_scale=30)
M['roofTile'] = material('himejiTile', '#6d7378', 0.5, vary='#62686d', vary_scale=60)
M['ishigaki'] = masonry('ishigaki', '#9c968a', '#77726a', scale=90, rough=0.9, vary='#8f897e')
M['windowH'] = material('himejiWindow', '#2c2b2a', 0.7)
M['goldFish'] = material('shachihoko', '#d9ad48', 0.3, metallic=0.85)
M['sakura'] = material('sakura', '#f4bccd', 0.8, vary='#f8cfdb', vary_scale=40, bump=0.3, bump_scale=120)
M['pine'] = material('himejiPine', '#2f5f34', 0.85, vary='#3a6d3e', vary_scale=14, bump=0.3, bump_scale=90)
M['hill'] = material('himejiHill', '#6c9a45', 0.85, vary='#79a750', vary_scale=12, bump=0.3, bump_scale=200)
M['gravelH'] = material('himejiGravel', '#d8cfbe', 0.9, vary='#cec4b2', vary_scale=60)

S = 0.042               # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    return 9.0 * smooth((26.0 - math.hypot(x * 0.9, y)) / 14.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.12)
    return ground(x / S, y / S) * S * rim


land = terrain('hill', H, [M['hill']], lambda z, nz, x, y: 0, rings=120, segs=300)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def frustum(name, mat, cx, cy, w0, d0, w1, d1, z0, z1, flare=0.0):
    """A block from a w0 x d0 foot to a w1 x d1 top (a battered base, or a roof skirt)."""
    bm = bmesh.new()
    lo = [bm.verts.new(P(cx + sx * w0 / 2, cy + sy * d0 / 2, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    hi = [bm.verts.new(P(cx + sx * w1 / 2, cy + sy * d1 / 2, z1)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    add_prism(bm, lo, hi)
    return finish(name, bm, mat, smooth_sides=False)


def curved_base(name, cx, cy, w, d, z0, z1, splay):
    """The stone base: its walls curving out towards the foot (the ishigaki's fan)."""
    rings = []
    for i in range(9):
        t = i / 8
        o = splay * (1.0 - t) ** 2
        z = z0 + (z1 - z0) * t
        rings.append([P(cx + sx * (w / 2 + o), cy + sy * (d / 2 + o), z).to_tuple() for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    return loft(name, M['ishigaki'], rings, smooth=False)


def storey(name, cx, cy, w, d, z0, h, eave, rise, wins):
    """A storey: white walls with a row of windows, then its grey tiled skirt flaring out as eaves."""
    box(name, M['plaster'], P(cx, cy, z0 + h / 2), (w * S, d * S, h * S), bevel=0)
    frustum(name + 'Skirt', M['roofTile'], cx, cy, w + 2 * eave, d + 2 * eave, w - 2.0, d - 2.0, z0 + h - 0.2, z0 + h + rise)
    for nx, ny, length in ((0, -1, w), (0, 1, w), (1, 0, d), (-1, 0, d)):
        for k in range(wins if nx == 0 else max(1, wins - 1)):
            u = -length / 2 + length * (k + 0.5) / (wins if nx == 0 else max(1, wins - 1))
            c = P(cx + nx * (w / 2 + 0.03) + (-ny) * u, cy + ny * (d / 2 + 0.03) + nx * u, 0)
            WIN.append((c.x, c.y, Z0 + (z0 + h * 0.35) * S, 0.9 * S, 1.2 * S, (nx, ny), 'rect'))


def gable(name, cx, y_face, z0, w, rise, depth):
    """A triangular gable on a roof's front: its white face and its two grey roof slopes."""
    bm = bmesh.new()
    tri = [(cx - w / 2, z0), (cx + w / 2, z0), (cx, z0 + rise)]
    add_prism(bm, [bm.verts.new(P(x, y_face, z)) for x, z in tri], [bm.verts.new(P(x, y_face + depth, z)) for x, z in tri])
    finish(name, bm, M['plaster'], smooth_sides=False)
    for s in (-1, 1):
        bm = bmesh.new()
        q = [(cx + s * (w / 2 + 0.6), z0 - 0.4), (cx, z0 + rise + 0.3)]
        a = [bm.verts.new(P(x, y_face - 0.6, z)) for x, z in q]
        b = [bm.verts.new(P(x, y_face + depth, z)) for x, z in q]
        bm.faces.new((a[0], a[1], b[1], b[0]))
        ob = finish(name + f'Slope{s}', bm, M['roofTile'], smooth_sides=False)
        mod = ob.modifiers.new('thick', 'SOLIDIFY')
        mod.thickness = 0.5 * S


WIN = []
# ------------------------------------------------------------------ the main keep: its stone base, five storeys, gables, the crowning roof
KX, KY = 0.0, 4.0
BASE = 9.0
curved_base('keepBase', KX, KY, 26.0, 22.0, BASE - 3.0, BASE + 12.0, 4.0)
TOP = BASE + 12.0
LEVELS = [(26.0, 22.0, 4.6, 2.6, 2.4, 7), (22.0, 18.0, 4.2, 2.4, 2.2, 6), (18.6, 15.0, 3.8, 2.2, 2.0, 5), (15.4, 12.4, 3.6, 2.0, 1.8, 4)]
z = TOP
for k, (w, d, h, eave, rise, wins) in enumerate(LEVELS):
    storey(f'storey{k}', KX, KY, w, d, z, h, eave, rise, wins)
    z += h + rise
gable('frontGable1', KX - 4.5, KY - LEVELS[1][1] / 2 - 2.0, TOP + LEVELS[0][2] + LEVELS[0][4] + 0.2, 7.0, 3.2, 3.0)
gable('frontGable2', KX + 4.5, KY - LEVELS[1][1] / 2 - 2.0, TOP + LEVELS[0][2] + LEVELS[0][4] + 0.2, 7.0, 3.2, 3.0)
gable('frontGable3', KX, KY - LEVELS[2][1] / 2 - 1.8, TOP + LEVELS[0][2] + LEVELS[0][4] + LEVELS[1][2] + LEVELS[1][4] + 0.2, 8.0, 3.4, 3.0)
# the curved, cusped gable (kara-hafu) over the front of the first roof
rings = []
for i in range(9):
    t = i / 8
    u = -5.0 + 10.0 * t
    zz = 1.8 * math.cos(math.pi * (t - 0.5)) ** 0.6 - 0.6 * (1.0 if abs(t - 0.5) > 0.3 else 0.0) * (abs(t - 0.5) - 0.3) * 3.0
    rings.append([P(KX + u, KY - LEVELS[0][1] / 2 - LEVELS[0][3] + dy, TOP + LEVELS[0][2] + 0.6 + zz + dz).to_tuple() for dy, dz in ((0.0, 0.0), (3.0, 0.6), (3.0, 1.1), (0.0, 0.5))])
loft('karaHafu', M['roofTile'], rings, smooth=True)
# the top storey and its crowning hip-and-gable roof, with the golden fish
TW, TD, TH = 12.4, 10.0, 3.6
box('topStorey', M['plaster'], P(KX, KY, z + TH / 2), (TW * S, TD * S, TH * S), bevel=0)
for nx, ny, length in ((0, -1, TW), (0, 1, TW), (1, 0, TD), (-1, 0, TD)):
    for k in range(3):
        u = -length / 2 + length * (k + 0.5) / 3
        c = P(KX + nx * (TW / 2 + 0.03) + (-ny) * u, KY + ny * (TD / 2 + 0.03) + nx * u, 0)
        WIN.append((c.x, c.y, Z0 + (z + 1.0) * S, 1.0 * S, 1.4 * S, (nx, ny), 'rect'))
z += TH
frustum('topSkirt', M['roofTile'], KX, KY, TW + 4.4, TD + 4.4, TW - 1.0, TD - 3.0, z - 0.2, z + 1.8)
gable_roof('topRoof', M['roofTile'], (KX - TW / 2 + 0.5) * S, (KX + TW / 2 - 0.5) * S, (KY - TD / 2 + 1.5) * S, (KY + TD / 2 - 1.5) * S, Z0 + (z + 1.8) * S, 3.2 * S, over=0.0)
for s in (-1, 1):
    bm = bmesh.new()
    tri = [(KY - TD / 2 + 1.5, z + 1.8), (KY + TD / 2 - 1.5, z + 1.8), (KY, z + 5.0)]
    add_prism(bm, [bm.verts.new(P(KX + s * (TW / 2 - 0.6), y, zz)) for y, zz in tri], [bm.verts.new(P(KX + s * (TW / 2 - 0.4), y, zz)) for y, zz in tri])
    finish(f'topGable{s}', bm, M['plaster'], smooth_sides=False)
    lathe(f'shachihoko{s}', M['goldFish'], [(0.35 * S, 0.0), (0.55 * S, 0.5 * S), (0.4 * S, 1.2 * S), (0.65 * S, 1.6 * S), (0.0, 1.9 * S)], P(KX + s * (TW / 2 - 0.6), KY, z + 5.0), segs=10)
box('ridge', M['plaster'], P(KX, KY, z + 5.05), ((TW - 1.0) * S, 0.5 * S, 0.3 * S), bevel=0)

# ------------------------------------------------------------------ the smaller keeps beside it and the corridors joining them
for s in (-1, 1):
    cx, cy = s * 19.0, 13.0
    curved_base(f'smallBase{s}', cx, cy, 12.0, 11.0, BASE - 3.0, BASE + 8.0, 2.4)
    zz = BASE + 8.0
    for k, (w, d, h) in enumerate(((12.0, 11.0, 4.0), (9.4, 8.4, 3.6))):
        storey(f'small{s}_{k}', cx, cy, w, d, zz, h, 1.8, 1.8, 4)
        zz += h + 1.8
    hip_roof(f'smallRoof{s}', M['roofTile'], cx * S, cy * S, Z0 + zz * S, 8.0 * S, 7.0 * S, 3.0 * S, over=0.8 * S)
    box(f'corridor{s}', M['plaster'], P(s * 11.5, 10.0, BASE + 6.0 + 2.0), (6.0 * S, 5.0 * S, 4.0 * S), bevel=0)
    gable_roof(f'corridorRoof{s}', M['roofTile'], (s * 11.5 - 3.4) * S, (s * 11.5 + 3.4) * S, (10.0 - 3.2) * S, (10.0 + 3.2) * S, Z0 + (BASE + 10.0) * S, 1.8 * S, over=0.0)
glazed('windows', WIN, M['plaster'], glass=M['windowH'], depth=0.12 * S, bars=False)

# ------------------------------------------------------------------ the hill's path, cherry trees in blossom, pines, people
slab('path', M['gravelH'], [(-3.0 * S, -32.0 * S), (3.0 * S, -32.0 * S), (3.0 * S, -16.0 * S), (-3.0 * S, -16.0 * S)], Z0, Z0 + 0.1 * S, margin=0.02)
SAKURA, PINES = [], []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.34, seed=6):
    x, y = p.x / S, p.y / S
    if abs(x) < 30.0 and -6.0 < y < 26.0 or (abs(x) < 5.0 and y < -14.0):
        continue
    if rng.random() < 0.65 and len(SAKURA) < 120:
        SAKURA.append(((p.x, p.y, p.z + 3.6 * S), rng.uniform(1.8, 2.8) * S, 0.8))
    elif len(PINES) < 50:
        PINES.append(((p.x, p.y, p.z + 4.0 * S), rng.uniform(1.6, 2.4) * S, 0.9))
blob_cloud('sakura', M['sakura'], SAKURA)
blob_cloud('pines', M['pine'], PINES)
for k, (x, y, shirt) in enumerate(((-1.0, -24.0, 'red'), (1.5, -28.0, 'blue'), (0.0, -19.0, 'yellow'))):
    c = P(x, y, 0.1)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.85)

R = Matrix.Rotation(math.radians(-32.0 + 18.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('himeji-castle')
