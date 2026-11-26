# Cappadocia in the high-quality look (hq.py), laid out in metres: the valley of fairy chimneys, cones of
# soft pale tuff standing alone and in clusters, each wearing its cap of dark basalt, doors and windows
# cut into them where people made their homes and chapels; the valley's soft ridges banded cream and
# pink, orchards on its floor; a great rock honeycombed with dwellings at the back, like Uçhisar's; and
# hot-air balloons drifting over it all.
# Run: blender -b --factory-startup -P cappadocia.py -- cappadocia-1024.png 1024 cappadocia.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1985)
M['tuffC'] = layered('cappadociaTuff', ['#e6d3b3', '#dcc3a0', '#e9c9b0', '#d8b694'], scale=18.0, distortion=0.8, rough=0.95, bump=0.3, bump_scale=120)
M['capC'] = material('basaltCap', '#6e6258', 0.9, vary='#5f554c', vary_scale=20, bump=0.4, bump_scale=120)
M['caveC'] = material('caveOpening', '#3b2c22', 0.9)
M['orchard'] = material('cappadociaOrchard', '#7fa64e', 0.85, vary='#8db35a', vary_scale=14, bump=0.3, bump_scale=90)
M['floorC'] = material('valleyFloor', '#c9b48f', 0.95, vary='#bda784', vary_scale=12)
BALLOONS = [material(f'balloonC{k}', c, 0.5) for k, c in enumerate(('#d9442e', '#eab32f', '#2f6fa8', '#3f9a4a', '#c0408a'))]

S = 0.0205              # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """Soft ridges round the valley, the rock of Uçhisar rising at the back."""
    ridge = 9.0 * smooth((abs(x) - 30.0) / 30.0) + 6.0 * smooth((y - 20.0) / 30.0)
    rock = 34.0 * smooth((22.0 - math.hypot(x + 6.0, (y - 50.0) * 1.2)) / 14.0)
    waves = 1.6 * math.sin(x / 9.0) * math.sin(y / 11.0)
    return max(0.0, ridge + rock + waves + 1.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.14)
    return ground(x / S, y / S) * S * rim


land = terrain('valley', H, [M['tuffC'], M['floorC']], lambda z, nz, x, y: 1 if (nz > 0.92 and z < 3.0 * S) else 0, rings=200, segs=500)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


WIN = []


def chimney(name, x, y, h, r):
    """A fairy chimney: a wide cone of tuff narrowing to a neck, its basalt cap, and caves cut in it."""
    z = ground(x, y) - 0.6
    prof = [(r, 0.0), (r * 0.8, h * 0.25), (r * 0.48, h * 0.6), (r * 0.3, h * 0.88), (r * 0.26, h)]
    lathe(name, M['tuffC'], [(u * S, v * S) for u, v in prof], P(x, y, z), segs=28, smooth=True)
    lathe(name + 'Cap', M['capC'], [(r * 0.3 * S, 0.0), (r * 0.55 * S, r * 0.25 * S), (r * 0.5 * S, r * 0.45 * S), (r * 0.2 * S, r * 0.7 * S), (0.0, r * 0.78 * S)], P(x, y, z + h), segs=20, smooth=True)
    for k in range(rng.randint(1, 3)):
        f = rng.uniform(0.12, 0.5)
        rr = r * (1.0 - 0.9 * f) - 0.05
        a = -math.pi / 2 + rng.uniform(-0.7, 0.7)
        c = P(x + rr * math.cos(a), y + rr * math.sin(a), 0)
        WIN.append((c.x, c.y, Z0 + (z + h * f) * S, 0.9 * S, 1.6 * S, (math.cos(a), math.sin(a)), 'round'))


# ------------------------------------------------------------------ the fairy chimneys, alone and in clusters
CH = [(-20.0, -18.0, 16.0, 5.0), (-14.0, -10.0, 12.0, 4.0), (-24.0, -6.0, 10.0, 3.6), (4.0, -24.0, 14.0, 4.6), (10.0, -16.0, 18.0, 5.4),
      (16.0, -26.0, 9.0, 3.4), (24.0, -8.0, 13.0, 4.4), (-4.0, 4.0, 15.0, 5.0), (8.0, 8.0, 11.0, 3.8), (30.0, 10.0, 12.0, 4.2),
      (-32.0, 14.0, 13.0, 4.4), (-10.0, 20.0, 10.0, 3.6), (18.0, 24.0, 14.0, 4.6), (-38.0, -24.0, 9.0, 3.2), (36.0, -22.0, 11.0, 3.8)]
CH = [(x, y, h * 1.4, r * 1.3) for x, y, h, r in CH]
for k, (x, y, h, r) in enumerate(CH):
    if math.hypot(x, y) * S + r * S > 1.36:
        continue
    chimney(f'chimney{k}', x, y, h, r)
    if k % 4 == 0:
        chimney(f'chimneyTwin{k}', x + r * 0.9, y + r * 0.6, h * 0.75, r * 0.7)
# the honeycombed rock at the back
for k in range(34):
    x = -6.0 + rng.uniform(-12.0, 12.0)
    zz = rng.uniform(8.0, 28.0)
    y = 50.0
    while y > 26.0 and ground(x, y) > zz + 1.0:   # down the rock's front until its surface is at this height
        y -= 0.25
    if y <= 26.0 or ground(x, y + 1.0) < zz:
        continue
    c = P(x, y - 0.2, 0)
    WIN.append((c.x, c.y, Z0 + zz * S, 1.0 * S, 1.4 * S, (0, -1), 'round'))
glazed('caves', WIN, M['tuffC'], glass=M['caveC'], depth=0.3 * S, bars=False)

# ------------------------------------------------------------------ orchards on the valley floor, balloons over it
TREES = []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.32, seed=7):
    x, y = p.x / S, p.y / S
    if any(math.hypot(x - cx, y - cy) < r + 2.0 for cx, cy, h, r in CH):
        continue
    TREES.append(((p.x, p.y, p.z + 1.6 * S), rng.uniform(1.2, 2.0) * S, 0.8))
    if len(TREES) >= 120:
        break
blob_cloud('orchards', M['orchard'], TREES)
for k, (x, y, z, sc) in enumerate(((-30.0, -34.0, 34.0, 1.0), (0.0, 30.0, 52.0, 1.1), (30.0, -6.0, 44.0, 0.9), (-36.0, 30.0, 58.0, 0.8), (20.0, 40.0, 64.0, 0.85))):
    prof = [(0.0, 0.0), (2.0, 0.6), (4.4, 3.0), (6.8, 7.4), (7.4, 10.6), (6.6, 14.0), (4.2, 16.4), (0.0, 17.4)]
    lathe(f'balloon{k}', BALLOONS[k], [(r * sc * S, h * sc * S) for r, h in prof], P(x, y, z), segs=24, smooth=True)
    box(f'basket{k}', M['capC'], P(x, y, z - 2.6 * sc), (1.6 * sc * S, 1.6 * sc * S, 1.2 * sc * S), bevel=0)
    for j in range(4):
        a = j * math.pi / 2 + math.pi / 4
        bar(f'rope{k}{j}', M['capC'], P(x + 0.7 * sc * math.cos(a), y + 0.7 * sc * math.sin(a), z - 2.0 * sc), P(x + 1.8 * sc * math.cos(a), y + 1.8 * sc * math.sin(a), z + 0.5 * sc), 0.08 * S)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('cappadocia')
