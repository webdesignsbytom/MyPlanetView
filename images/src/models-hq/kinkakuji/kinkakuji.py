# Kinkaku-ji in the high-quality look (hq.py), laid out in metres: Kyoto's Golden Pavilion at the edge
# of its Mirror Pond; the ground storey of natural wood and white plaster with its veranda, the upper two
# storeys sheathed in gold leaf, the dark shingled roofs flaring out at their eaves, the bronze phoenix on
# the top; the pond before it with its rocks and little islands of pines; maples and pines round the
# water, the hill's woods behind, and people on the far shore.
# Run: blender -b --factory-startup -P kinkakuji.py -- kinkakuji-1024.png 1024 kinkakuji.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1397)
M['goldLeaf'] = material('goldLeaf', '#e2b13c', 0.22, vary='#f0c552', vary_scale=40, metallic=0.95)
M['woodK'] = material('kinkakuWood', '#6b4f36', 0.75, vary='#5f452f', vary_scale=60)
M['plasterK'] = material('kinkakuPlaster', '#f1ece0', 0.6)
M['shingle'] = material('kinkakuShingle', '#3f3630', 0.8, vary='#4a4038', vary_scale=80, bump=0.2, bump_scale=300)
M['pond'] = material('mirrorPond', '#3f6a5a', 0.04, vary='#4a7666', vary_scale=6, coat=0.9)
M['rockK'] = material('pondRock', '#8a877d', 0.9, vary='#7a776e', vary_scale=20, bump=0.4, bump_scale=120)
M['pineK'] = material('kyotoPine', '#2f5d33', 0.85, vary='#3b6b3d', vary_scale=14, bump=0.3, bump_scale=90)
M['maple'] = material('kyotoMaple', '#6f9a3a', 0.85, vary='#7ea845', vary_scale=14, bump=0.3, bump_scale=90)
M['mapleRed'] = material('kyotoMapleRed', '#c8523a', 0.85, vary='#d4643f', vary_scale=14, bump=0.3, bump_scale=90)
M['mossK'] = material('kyotoMoss', '#5e8a3c', 0.9, vary='#6b9746', vary_scale=12, bump=0.3, bump_scale=200)
M['pathK'] = material('kyotoPath', '#cfc5b0', 0.9, vary='#c4b9a2', vary_scale=40)
M['bronzeK'] = material('phoenixBronze', '#c99b3c', 0.3, metallic=0.85)

S = 0.056               # metres to the tile's units
Z0 = G
PX, PY = 0.0, 8.0       # the pavilion's middle


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)




def pond_depth(x, y):
    d = 0.0
    for cx, cy, w in ((0.0, -6.0, 1.0),):
        e = math.hypot((x - cx) / 25.0, (y - cy) / 13.0)
        d = max(d, smooth((1.0 - e) / 0.12))
    return d


def ground(x, y):
    hill = 9.0 * smooth((y - 18.0) / 12.0)
    return 0.8 - 1.0 * pond_depth(x, y) + hill


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return max(0.0, ground(x / S, y / S)) * S * rim


land = terrain('garden', H, [M['mossK']], lambda z, nz, x, y: 0, rings=120, segs=300)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def skirt(name, cx, cy, w0, d0, w1, d1, z0, z1, curl=0.5):
    """A roof skirt flaring out at its eaves: from the eave's outline up to the wall's (with a lift at the corners)."""
    rings = []
    for i, (w, d, z) in enumerate(((w0, d0, z0), ((w0 + w1) / 2 + 0.1, (d0 + d1) / 2 + 0.1, z0 + (z1 - z0) * 0.35), (w1, d1, z1))):
        ring = []
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            lift = curl if i == 0 else 0.0
            ring.append(P(cx + sx * w / 2, cy + sy * d / 2, z + lift).to_tuple())
        rings.append(ring)
    return loft(name, M['shingle'], rings, cap=False, smooth=False)


slab('pond', M['pond'], [(x * S, y * S) for x, y in [(25.0 * math.cos(t), -6.0 + 13.0 * math.sin(t)) for t in [2 * math.pi * k / 48 for k in range(48)]]], Z0 + 0.25 * S, Z0 + 0.3 * S, margin=0.02)
WIN = []

# ------------------------------------------------------------------ the pavilion: ground storey of wood and plaster, two gilded storeys, roofs, phoenix
F0 = 1.2
box('platform', M['rockK'], P(PX, PY, F0 / 2), (16.0 * S, 12.0 * S, F0 * S), bevel=0)
box('ground', M['plasterK'], P(PX, PY, F0 + 2.0), (13.0 * S, 9.0 * S, 4.0 * S), bevel=0)
box('veranda', M['woodK'], P(PX, PY, F0 + 0.15), (15.0 * S, 11.0 * S, 0.3 * S), bevel=0)
for k in range(8):
    x = PX - 6.5 + 13.0 * k / 7
    for y in (PY - 4.5, PY + 4.5):
        cylinder(f'groundPost{k}{y:.0f}', M['woodK'], 0.18 * S, 4.0 * S, P(x, y - (0.05 if y < PY else -0.05), F0), segs=8)
for k in range(5):
    y = PY - 4.5 + 9.0 * k / 4
    for x in (PX - 6.5, PX + 6.5):
        cylinder(f'groundPostS{k}{x:.0f}', M['woodK'], 0.18 * S, 4.0 * S, P(x, y, F0), segs=8)
box('groundBeam', M['woodK'], P(PX, PY, F0 + 3.8), (13.4 * S, 9.4 * S, 0.4 * S), bevel=0)
skirt('roof1', PX, PY, 15.6, 11.6, 11.4, 8.0, F0 + 4.0, F0 + 5.0, curl=0.35)
Z2 = F0 + 5.0
box('storey2', M['goldLeaf'], P(PX, PY, Z2 + 2.2), (11.4 * S, 8.0 * S, 4.4 * S), bevel=0)
box('balcony2', M['goldLeaf'], P(PX, PY, Z2 + 0.2), (12.8 * S, 9.4 * S, 0.4 * S), bevel=0)
for k in range(5):
    x = PX - 4.5 + 2.25 * k
    c = P(x, PY - 4.02, 0)
    WIN.append((c.x, c.y, Z0 + (Z2 + 0.9) * S, 1.4 * S, 2.8 * S, (0, -1), 'rect'))
skirt('roof2', PX, PY, 13.8, 10.4, 8.0, 7.0, Z2 + 4.4, Z2 + 5.4, curl=0.35)
Z3 = Z2 + 5.4
box('storey3', M['goldLeaf'], P(PX, PY, Z3 + 1.9), (7.0 * S, 7.0 * S, 3.8 * S), bevel=0)
box('balcony3', M['goldLeaf'], P(PX, PY, Z3 + 0.2), (8.4 * S, 8.4 * S, 0.4 * S), bevel=0)
for k in range(3):
    x = PX - 2.2 + 2.2 * k
    c = P(x, PY - 3.52, 0)
    WIN.append((c.x, c.y, Z0 + (Z3 + 0.8) * S, 1.2 * S, 2.4 * S, (0, -1), 'round'))
skirt('roof3', PX, PY, 10.2, 10.2, 1.4, 1.4, Z3 + 3.8, Z3 + 6.6, curl=0.5)
box('roofTop', M['goldLeaf'], P(PX, PY, Z3 + 6.8), (1.4 * S, 1.4 * S, 0.5 * S), bevel=0)
# the phoenix: a small bird on its post, wings raised
c = P(PX, PY, Z3 + 7.05)
cylinder('phoenixPost', M['bronzeK'], 0.15 * S, 0.6 * S, (c.x, c.y, c.z), segs=8)
lathe('phoenixBody', M['bronzeK'], [(0.0, 0.0), (0.3 * S, 0.2 * S), (0.25 * S, 0.6 * S), (0.0, 0.9 * S)], (c.x, c.y, c.z + 0.6 * S), segs=10)
for s in (-1, 1):
    bar(f'phoenixWing{s}', M['bronzeK'], Vector((c.x, c.y, c.z + 1.1 * S)), Vector((c.x + s * 0.8 * S, c.y, c.z + 1.7 * S)), 0.12 * S)
glazed('windows', WIN, M['goldLeaf'], glass=M['woodK'], depth=0.12 * S, bars=False)

# ------------------------------------------------------------------ the pond's islands and rocks, trees round the water, people
ROCKS = [(P(x, y, 0.3).to_tuple(), rng.uniform(0.6, 1.2) * S, 0.55) for x, y in ((-14.0, -4.0), (-12.0, -9.0), (8.0, -10.0), (14.0, -3.0), (-3.0, -12.0), (18.0, -6.0), (-19.0, -7.0))]
blob_cloud('rocks', M['rockK'], ROCKS)
for k, (x, y, r) in enumerate(((-13.0, -6.0, 2.6), (12.0, -6.0, 2.2), (2.0, -11.0, 1.6))):
    lathe(f'island{k}', M['mossK'], [(r * S, 0.0), (r * 0.8 * S, 0.6 * S), (0.0, 0.9 * S)], P(x, y, 0.3), segs=24, smooth=True)
    tube(f'islandPineTrunk{k}', M['trunk'], [P(x, y, 1.0), P(x + 0.6, y, 2.6), P(x + 1.2, y, 3.2)], 0.15 * S)
    blob_cloud(f'islandPine{k}', M['pineK'], [(P(x + 1.0 + rng.uniform(-0.8, 0.8), y + rng.uniform(-0.8, 0.8), 3.2 + rng.uniform(0.0, 0.6)).to_tuple(), rng.uniform(0.7, 1.1) * S, 0.5) for _ in range(5)])
TREES = []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.34, seed=9):
    x, y = p.x / S, p.y / S
    if pond_depth(x, y) > 0.0 or (abs(x - PX) < 11.0 and abs(y - PY) < 9.0) or y < -12.0:
        continue
    TREES.append(((p.x, p.y, p.z + rng.uniform(3.0, 4.5) * S), rng.uniform(1.6, 2.6) * S, 0.85))
    if len(TREES) >= 110:
        break
blob_cloud('pines', M['pineK'], TREES[::3])
blob_cloud('maples', M['maple'], TREES[1::3])
blob_cloud('maplesRed', M['mapleRed'], TREES[2::9])
for k, (x, y, shirt) in enumerate(((-6.0, -21.0, 'red'), (-2.0, -22.0, 'blue'), (4.0, -21.0, 'yellow'))):
    c = P(x, y, 0.8)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.2)

R = Matrix.Rotation(math.radians(-32.0 + 18.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('kinkakuji')
