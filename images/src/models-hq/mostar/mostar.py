# Mostar in the high-quality look (hq.py), laid out in metres: the Stari Most, the old bridge's single
# slender arch of pale limestone leaping the Neretva high above the emerald water, its parapets and the
# hump of its deck; the two towers that guard its ends; the old stone houses with their grey stone-slab
# roofs on the rocky banks; the river below, the trees, a diver on the parapet, and people.
# Run: blender -b --factory-startup -P mostar.py -- mostar-1024.png 1024 mostar.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1566)
M['tenelija'] = material('tenelija', '#e3d8c2', 0.8, vary='#d6cab2', vary_scale=24, bump=0.15, bump_scale=200)
M['stoneM'] = masonry('mostarStone', '#c9bca2', '#9d917a', scale=90, rough=0.9, vary='#beb197')
M['slabRoof'] = material('stoneSlabRoof', '#7d7a74', 0.85, vary='#6f6c66', vary_scale=40, bump=0.3, bump_scale=200)
M['neretva'] = material('neretva', '#2f9a8a', 0.06, vary='#3aa695', vary_scale=6, bump=0.04, bump_scale=60, coat=0.8)
M['rockM'] = layered('mostarRock', ['#b8ab92', '#a89b82', '#c2b59c'], scale=20.0, distortion=1.5, rough=0.9, bump=0.4, bump_scale=120)
M['grassM'] = material('mostarGrass', '#6a9a40', 0.85, vary='#77a74a', vary_scale=12)
M['treeM'] = material('mostarTrees', '#3f7a36', 0.85, vary='#4c8a40', vary_scale=14, bump=0.3, bump_scale=90)
M['windowM'] = material('mostarWindow', '#3a2a20', 0.8)

S = 0.032               # metres to the tile's units
Z0 = G
WATER = 1.0
BANK = 22.0             # the banks' top, where the bridge lands


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The gorge: the river between rocky banks rising to the old town on either side."""
    d = abs(x - 2.0 * math.sin(y / 9.0))
    return 0.0 + BANK * smooth((d - 13.0) / 9.0) + 2.0 * smooth((d - 24.0) / 10.0) * math.sin(y / 7.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.14)
    return ground(x / S, y / S) * S * rim


def pick(z, nz, x, y):
    if z < 1.2 * S:
        return 2
    if nz < 0.75:
        return 0
    return 1


land = terrain('gorge', H, [M['rockM'], M['grassM'], M['rockM']], pick, rings=220, segs=560)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


slab('river', M['neretva'], [(-1.0, -2.0), (1.0, -2.0), (1.0, 2.0), (-1.0, 2.0)], Z0 - 0.003, Z0 + WATER * S, margin=0.02)
WIN = []

# ------------------------------------------------------------------ the bridge: the arch, its spandrels, the humped deck and parapets
SPAN, RISE = 29.0, 20.0
YB = 0.0
rings = []
for k in range(25):
    t = k / 24
    x = -SPAN / 2 - 2.0 + (SPAN + 4.0) * t
    u = (x / (SPAN / 2))
    arch = RISE * max(0.0, 1.0 - u * u) ** 0.6 if abs(u) <= 1.0 else 0.0
    deck = BANK + 1.0 + 2.6 * (1.0 - (2 * t - 1) ** 2)
    rings.append((x, arch, deck))
bm = bmesh.new()
outline = [(x, a + 0.0) for x, a, d in rings] + [(x, d) for x, a, d in reversed(rings)]
add_prism(bm, [bm.verts.new(P(x, YB - 2.2, z)) for x, z in outline], [bm.verts.new(P(x, YB + 2.2, z)) for x, z in outline])
finish('bridge', bm, M['tenelija'], smooth_sides=False)
for s in (-1, 1):
    tube(f'parapet{s}', M['tenelija'], [P(x, YB + s * 2.0, d + 0.6) for x, a, d in rings], 0.35 * S)
    tube(f'archRing{s}', M['stoneM'], [P(x, YB + s * 2.25, a + 0.4) for x, a, d in rings if a > 0.3], 0.3 * S)
# the towers at its ends
for s, (h, w) in ((-1, (24.0, 7.0)), (1, (20.0, 6.0))):
    tx = s * (SPAN / 2 + 6.0)
    z0 = ground(tx, YB) - 2.0
    box(f'tower{s}', M['stoneM'], P(tx, YB + s * 2.0, z0 + h / 2), (w * S, w * S, h * S), bevel=0.002)
    hip_roof(f'towerRoof{s}', M['slabRoof'], tx * S, (YB + s * 2.0) * S, Z0 + (z0 + h) * S, (w + 1.2) * S, (w + 1.2) * S, 3.0 * S, over=0.0)
    for z in (z0 + h - 5.0, z0 + h - 10.0):
        c = P(tx - s * (w / 2 + 0.03), YB + s * 2.0, 0)
        WIN.append((c.x, c.y, Z0 + z * S, 1.0 * S, 1.6 * S, (-s, 0), 'round'))

# ------------------------------------------------------------------ the old stone houses on the banks
for k in range(16):
    s = 1 if k % 2 else -1
    y = rng.uniform(-34.0, 34.0)
    x = s * rng.uniform(26.0, 36.0)
    if abs(y - YB) < 7.0 or math.hypot(x, y) * S > 1.3:
        continue
    w, d, h = rng.uniform(6.0, 9.0), rng.uniform(5.0, 7.0), rng.uniform(5.0, 8.0)
    z0 = ground(x, y) - 1.0
    box(f'house{k}', M['stoneM'], P(x, y, z0 + h / 2), (w * S, d * S, h * S), bevel=0.0015)
    hip_roof(f'houseRoof{k}', M['slabRoof'], x * S, y * S, Z0 + (z0 + h) * S, (w + 1.0) * S, (d + 1.0) * S, 2.6 * S, over=0.0)
    for u in (-w / 4, w / 4):
        c = P(x + u, y - d / 2 - 0.03, 0)
        WIN.append((c.x, c.y, Z0 + (z0 + h - 2.6) * S, 0.8 * S, 1.2 * S, (0, -1), 'rect'))
glazed('windows', WIN, M['stoneM'], glass=M['windowM'], depth=0.15 * S, bars=False)

# ------------------------------------------------------------------ trees on the banks, the diver, people
TREES = []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.34, seed=5):
    x, y = p.x / S, p.y / S
    if abs(y - YB) < 8.0:
        continue
    TREES.append(((p.x, p.y, p.z + 2.6 * S), rng.uniform(1.6, 2.6) * S, 0.85))
    if len(TREES) >= 70:
        break
blob_cloud('trees', M['treeM'], TREES)
c = P(2.0, YB - 2.0, rings[12][2] + 0.9)
person('diver', c.x, c.y, 0.0, 'red', z=c.z, scale=0.5)
for k, (x, shirt) in enumerate(((-8.0, 'blue'), (6.0, 'yellow'))):
    t = (x + SPAN / 2 + 2.0) / (SPAN + 4.0)
    d = BANK + 1.0 + 2.6 * (1.0 - (2 * t - 1) ** 2)
    c = P(x, YB + 0.6, d)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.5)

R = Matrix.Rotation(math.radians(-32.0 + 22.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('mostar')
