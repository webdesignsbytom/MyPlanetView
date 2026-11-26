# Aït Benhaddou in the high-quality look (hq.py), laid out in metres: the ksar's earthen houses climbing
# their hill above the Ounila, flat-roofed and parapeted, stacked one above another; the tall kasbah
# towers among them, their walls tapering, their tops patterned and crenellated, their small dark
# windows; the old granary on the hilltop; the river at the foot with its stepping stones, palms and
# green fields on the near bank, and people.
# Run: blender -b --factory-startup -P ait-benhaddou.py -- ait-benhaddou-1024.png 1024 ait-benhaddou.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1987)
M['earth'] = material('ksarEarth', '#bb7a52', 0.95, vary='#ad6d48', vary_scale=14, bump=0.4, bump_scale=160)
M['earthLight'] = material('ksarEarthLight', '#c98c62', 0.95, vary='#bd7f56', vary_scale=14, bump=0.4, bump_scale=160)
M['earthDark'] = material('ksarEarthDark', '#9b6342', 0.95, vary='#8f5a3c', vary_scale=14)
M['pattern'] = chequer('towerPattern', '#c98c62', '#8a5536', scale=120.0, rough=0.9)
M['hillA'] = material('ksarHill', '#a8794f', 0.95, vary='#9a6d46', vary_scale=10, bump=0.4, bump_scale=120)
M['riverA'] = material('ounila', '#6f8a6a', 0.08, vary='#7a9474', vary_scale=6, coat=0.6)
M['fieldA'] = material('ounilaFields', '#7aa04a', 0.85, vary='#87ad54', vary_scale=12, bump=0.3, bump_scale=200)
M['bed'] = material('riverBed', '#c4a982', 0.95, vary='#b89d76', vary_scale=20)
M['windowA'] = material('ksarWindow', '#3a2418', 0.9)
M['palmTrunkA'] = material('palmTrunkA', '#8f7a5a', 0.8)
M['frondA'] = material('palmFrondA', '#4f8f36', 0.8, vary='#5c9c40', vary_scale=20)

S = 0.026               # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The hill rising behind the ksar to the granary, the river's bed at the foot."""
    hill = 30.0 * smooth((40.0 - math.hypot((x + 4.0) * 0.9, y - 22.0)) / 40.0)
    bed = -0.6 * smooth((4.0 - abs(y + 30.0 + 4.0 * math.sin(x / 15.0))) / 4.0)
    return max(0.0, hill) + 0.6 + bed


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.12)
    return max(0.0, ground(x / S, y / S)) * S * rim


def pick(z, nz, x, y):
    xm, ym = x / S, y / S
    river = abs(ym + 30.0 + 4.0 * math.sin(xm / 15.0))
    if river < 3.0:
        return 2
    if ym < -34.0:
        return 1
    return 0


land = terrain('hill', H, [M['hillA'], M['fieldA'], M['bed']], pick, rings=200, segs=500)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


WIN = []


def house(name, x, y, w, d, h, mat):
    z = ground(x, y) - 1.5
    box(name, M[mat], P(x, y, z + h / 2), (w * S, d * S, h * S), bevel=0.0015)
    box(name + 'Parapet', M['earthDark'], P(x, y, z + h + 0.3), ((w + 0.2) * S, (d + 0.2) * S, 0.6 * S), bevel=0)
    for k in range(max(1, int(w / 3.0))):
        u = -w / 2 + w * (k + 0.5) / max(1, int(w / 3.0))
        if rng.random() < 0.6:
            c = P(x + u, y - d / 2 - 0.03, 0)
            WIN.append((c.x, c.y, Z0 + (z + h - 2.4) * S, 0.6 * S, 0.9 * S, (0, -1), 'rect'))
    return z + h


def tower(name, x, y, w, h):
    """A kasbah tower: tapering walls, a patterned band and battlements at the top, small windows."""
    z = ground(x, y) - 1.5
    bm = bmesh.new()
    lo = [bm.verts.new(P(x + sx * w / 2, y + sy * w / 2, z)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    hi = [bm.verts.new(P(x + sx * w * 0.4, y + sy * w * 0.4, z + h)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    add_prism(bm, lo, hi)
    finish(name, bm, M['earthLight'], smooth_sides=False)
    box(name + 'Band', M['pattern'], P(x, y, z + h - 1.6), (w * 0.82 * S, w * 0.82 * S, 2.4 * S), bevel=0)
    for sx in (-1, 0, 1):
        for sy in (-1, 1):
            box(f'{name}Merlon{sx}{sy}', M['earthLight'], P(x + sx * w * 0.32, y + sy * w * 0.38, z + h + 0.5), (0.7 * S, 0.5 * S, 1.0 * S), bevel=0)
            box(f'{name}MerlonS{sx}{sy}', M['earthLight'], P(x + sy * w * 0.38, y + sx * w * 0.32, z + h + 0.5), (0.5 * S, 0.7 * S, 1.0 * S), bevel=0)
    for zz in (z + h * 0.35, z + h * 0.62):
        c = P(x, y - w * 0.5 + (zz - z) / h * w * 0.1 - 0.05, 0)
        WIN.append((c.x, c.y, Z0 + zz * S, 0.7 * S, 1.1 * S, (0, -1), 'rect'))


# ------------------------------------------------------------------ the houses climbing the hill, the towers among them, the granary on top
SPOTS = []
for ring in range(6):
    r = 34.0 - ring * 5.4
    n = max(3, int(r * 0.42))
    for k in range(n):
        a = math.radians(-160.0 + 140.0 * (k + 0.5) / n) + rng.uniform(-0.06, 0.06)
        x, y = -4.0 + r * math.cos(a) / 0.9, 22.0 + r * math.sin(a)
        if y < -24.0:
            continue
        SPOTS.append((x, y, ring))
for k, (x, y, ring) in enumerate(SPOTS):
    w, d = rng.uniform(5.0, 7.5), rng.uniform(4.5, 6.5)
    house(f'house{k}', x, y, w, d, rng.uniform(6.0, 9.0), 'earth' if k % 3 else 'earthLight')
TOWERS = [SPOTS[i] for i in range(0, len(SPOTS), 4)]
for k, (x, y, ring) in enumerate(TOWERS):
    tower(f'tower{k}', x + 2.6, y - 1.6, 4.4, rng.uniform(11.0, 14.0))
gz = ground(-4.0, 22.0)
box('granary', M['earthDark'], P(-4.0, 22.0, gz + 2.5), (12.0 * S, 9.0 * S, 7.0 * S), bevel=0.002)
for s in (-1, 1):
    tower(f'granaryTower{s}', -4.0 + s * 6.0, 18.0, 3.6, 9.0)
glazed('windows', WIN, M['earthDark'], glass=M['windowA'], depth=0.15 * S, bars=False)

# ------------------------------------------------------------------ the stepping stones, palms on the near bank, people
STONES = [(P(6.0 + 0.4 * k, -30.0 - 3.0 + 1.5 * k + 4.0 * math.sin(6.0 / 15.0), 0.3).to_tuple(), 0.7 * S, 0.5) for k in range(5)]
blob_cloud('steppingStones', M['bed'], STONES)
for j, (x, y) in enumerate(((-30.0, -40.0), (-16.0, -44.0), (20.0, -42.0), (34.0, -36.0), (-38.0, -30.0))):
    if math.hypot(x, y) * S > 1.34:
        continue
    h = 9.0
    lathe(f'palm{j}', M['palmTrunkA'], [(0.4 * S, 0.0), (0.32 * S, h * 0.5 * S), (0.3 * S, h * S)], P(x, y, 0.6), segs=10, smooth=True)
    for f in range(8):
        b = 2 * math.pi * f / 8 + j
        tube(f'frond{j}{f}', M['frondA'], [P(x, y, h + 0.6), P(x + 1.8 * math.cos(b), y + 1.8 * math.sin(b), h + 1.2), P(x + 3.2 * math.cos(b), y + 3.2 * math.sin(b), h - 0.6)], 0.26 * S)
for k, (x, y, shirt) in enumerate(((4.0, -36.0, 'blue'), (8.0, -24.0, 'red'), (-8.0, -38.0, 'yellow'))):
    c = P(x, y, ground(x, y))
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('ait-benhaddou')
