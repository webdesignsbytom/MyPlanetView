# Bagan in the high-quality look (hq.py), laid out in metres (the temples drawn closer together than on
# the plain): the plain of temples by the Irrawaddy; a great temple in the manner of Ananda, white with
# its porches and receding terraces and its curving gilded spire; the Shwesandaw's five brick terraces
# with stairs up their middles and the bell stupa on top; brick stupas and little temples of every size
# among the trees and the dusty paths; hot-air balloons drifting over it all.
# Run: blender -b --factory-startup -P bagan.py -- bagan-1024.png 1024 bagan.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1044)
M['brickB'] = material('baganBrick', '#a65a3c', 0.9, vary='#94503a', vary_scale=20, bump=0.3, bump_scale=200)
M['brickBDark'] = material('baganBrickDark', '#874a33', 0.9, vary='#7a432f', vary_scale=20)
M['whiteB'] = material('ananda', '#f2ede2', 0.6, vary='#e8e2d4', vary_scale=30)
M['goldB'] = material('baganGold', '#e2b23e', 0.3, metallic=0.85)
M['plain'] = material('baganPlain', '#b7a170', 0.95, vary='#a9935f', vary_scale=10, bump=0.3, bump_scale=200)
M['scrub'] = material('baganScrub', '#7d9445', 0.9, vary='#6f8a3c', vary_scale=14)
M['treeB'] = material('baganTrees', '#4f8a3a', 0.85, vary='#5c9744', vary_scale=14, bump=0.3, bump_scale=90)
M['pathB'] = material('baganPath', '#cdb88e', 0.95)
BALLOONS = [material('balloonRed', '#d9442e', 0.5), material('balloonYellow', '#eab32f', 0.5), material('balloonStripe', '#2f6fa8', 0.5)]

S = 0.017               # metres to the tile's units
Z0 = G


def ground(x, y):
    return 1.0 + 0.6 * math.sin(x / 23.0) * math.sin(y / 31.0)


def H(x, y):
    r = math.hypot(x, y)
    rim = min(1.0, max(0.0, (1.48 - r) / 0.08))
    return ground(x / S, y / S) * S * rim


land = terrain('plain', H, [M['plain'], M['scrub']], lambda z, nz, x, y: 1 if (math.sin(x * 37.0) * math.sin(y * 29.0)) > 0.55 else 0, rings=120, segs=300)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def stupa(name, x, y, z, r, mat='brickB', spire=True):
    """A brick stupa: its rings, the bell, the stacked umbrella rings and spire."""
    cylinder(name + 'Base', M['brickBDark'], r * 1.25 * S, r * 0.5 * S, P(x, y, z), segs=8)
    cylinder(name + 'Base2', M[mat], r * 1.1 * S, r * 0.4 * S, P(x, y, z + r * 0.5), segs=24)
    lathe(name + 'Bell', M[mat], [(r * S, 0.0), (r * 1.02 * S, r * 0.5 * S), (r * 0.8 * S, r * 1.2 * S), (r * 0.45 * S, r * 1.6 * S), (r * 0.3 * S, r * 1.75 * S)], P(x, y, z + r * 0.9), segs=24, smooth=True)
    if spire:
        lathe(name + 'Spire', M['goldB'] if mat == 'whiteB' else M[mat], [(r * 0.3 * S, 0.0), (r * 0.25 * S, r * 0.8 * S), (r * 0.12 * S, r * 1.6 * S), (0.0, r * 2.2 * S)], P(x, y, z + r * 2.65), segs=12, smooth=True)


def terraces(name, x, y, z, sizes, h, mat):
    for k, w in enumerate(sizes):
        box(f'{name}{k}', M[mat], P(x, y, z + h * (k + 0.5)), (w * S, w * S, h * S), bevel=0)
    return z + h * len(sizes)


# ------------------------------------------------------------------ the great white temple: porches, receding terraces, the gilded spire
AX, AY = -18.0, 14.0
box('anandaBody', M['whiteB'], P(AX, AY, 1.0 + 6.0), (30.0 * S, 30.0 * S, 12.0 * S), bevel=0)
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    box(f'anandaPorch{nx}{ny}', M['whiteB'], P(AX + nx * 18.0, AY + ny * 18.0, 1.0 + 4.5), ((10.0 if nx == 0 else 8.0) * S, (8.0 if nx == 0 else 10.0) * S, 9.0 * S), bevel=0)
    gable_roof(f'anandaPorchRoof{nx}{ny}', M['whiteB'], (AX + nx * 18.0 - (5.0 if nx == 0 else 4.0)) * S, (AX + nx * 18.0 + (5.0 if nx == 0 else 4.0)) * S,
               (AY + ny * 18.0 - (4.0 if nx == 0 else 5.0)) * S, (AY + ny * 18.0 + (4.0 if nx == 0 else 5.0)) * S, Z0 + 10.0 * S, 3.0 * S, over=0.0, along='y' if nx == 0 else 'x')
top = terraces('anandaTerrace', AX, AY, 13.0, [26.0, 22.0, 18.0, 14.0], 2.2, 'whiteB')
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    for k in range(4):
        stupa(f'anandaCorner{nx}{ny}{k}', AX + nx * (12.0 - 2.0 * k) + ny * (12.0 - 2.0 * k), AY + ny * (12.0 - 2.0 * k) - nx * (12.0 - 2.0 * k), 13.0 + 2.2 * (k + 1), 0.8, 'whiteB', spire=False)
rings = [(6.4, 0.0), (6.2, 3.0), (5.4, 7.0), (4.2, 10.0), (2.6, 12.6), (1.2, 14.0), (0.0, 14.6)]
lathe('anandaSikhara', M['whiteB'], [(r * S, z * S) for r, z in rings], (0.0, 0.0, 0.0), segs=4, matrix=Matrix.Translation(P(AX, AY, top)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
lathe('anandaFinial', M['goldB'], [(1.0 * S, 0.0), (0.8 * S, 1.4 * S), (0.4 * S, 3.4 * S), (0.0, 5.6 * S)], P(AX, AY, top + 14.2), segs=16, smooth=True)

# ------------------------------------------------------------------ the Shwesandaw: five brick terraces, stairs, the bell stupa
SX, SY = 30.0, -6.0
t = terraces('shwesandaw', SX, SY, 1.0, [30.0, 25.0, 20.0, 16.0, 12.0], 2.8, 'brickB')
for nx, ny in ((0, -1), (1, 0), (-1, 0)):
    for j in range(14):
        z1 = 1.0 + (j + 1) * 1.0
        d = 16.0 - j * 0.65
        if nx == 0:
            box(f'swStair{nx}{ny}{j}', M['brickBDark'], P(SX, SY + ny * d, z1 - 0.5), (3.0 * S, 0.65 * S, 1.0 * S), bevel=0)
        else:
            box(f'swStair{nx}{ny}{j}', M['brickBDark'], P(SX + nx * d, SY, z1 - 0.5), (0.65 * S, 3.0 * S, 1.0 * S), bevel=0)
stupa('shwesandawStupa', SX, SY, t, 4.6, 'whiteB')

# ------------------------------------------------------------------ brick stupas and little temples across the plain, trees, paths
SPOTS = []
for k in range(40):
    x, y = rng.uniform(-75.0, 75.0), rng.uniform(-75.0, 75.0)
    if math.hypot(x, y) > 74.0 or math.hypot(x - AX, y - AY) < 26.0 or math.hypot(x - SX, y - SY) < 22.0:
        continue
    if any(math.hypot(x - a, y - b) < 9.0 for a, b in SPOTS):
        continue
    SPOTS.append((x, y))
for k, (x, y) in enumerate(SPOTS):
    r = rng.uniform(1.4, 3.4)
    z = ground(x, y)
    if k % 3 == 0:
        box(f'shrine{k}', M['brickB'], P(x, y, z + r * 1.2), (r * 2.4 * S, r * 2.4 * S, r * 2.4 * S), bevel=0)
        stupa(f'shrineTop{k}', x, y, z + r * 2.4, r * 0.7)
    else:
        stupa(f'stupa{k}', x, y, z, r)
TREES = []
for p in scatter_on(land, 4000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.36, seed=5):
    x, y = p.x / S, p.y / S
    if math.hypot(x - AX, y - AY) < 26.0 or math.hypot(x - SX, y - SY) < 20.0 or any(math.hypot(x - a, y - b) < 5.0 for a, b in SPOTS):
        continue
    TREES.append(((p.x, p.y, p.z + 3.0 * S), rng.uniform(2.2, 3.6) * S, 0.75))
    if len(TREES) >= 70:
        break
blob_cloud('trees', M['treeB'], TREES)

# ------------------------------------------------------------------ hot-air balloons over the plain
for k, (x, y, z, sc) in enumerate(((-50.0, -30.0, 46.0, 1.0), (10.0, 40.0, 58.0, 0.9), (52.0, 30.0, 40.0, 0.85))):
    prof = [(0.0, 0.0), (2.0, 0.6), (4.4, 3.0), (6.8, 7.4), (7.4, 10.6), (6.6, 14.0), (4.2, 16.4), (0.0, 17.4)]
    lathe(f'balloon{k}', BALLOONS[k], [(r * sc * S, h * sc * S) for r, h in prof], P(x, y, z), segs=24, smooth=True)
    box(f'basket{k}', M['brickBDark'], P(x, y, z - 2.6 * sc), (1.6 * sc * S, 1.6 * sc * S, 1.2 * sc * S), bevel=0)
    for j in range(4):
        a = j * math.pi / 2 + math.pi / 4
        bar(f'rope{k}{j}', M['brickBDark'], P(x + 0.7 * sc * math.cos(a), y + 0.7 * sc * math.sin(a), z - 2.0 * sc), P(x + 1.8 * sc * math.cos(a), y + 1.8 * sc * math.sin(a), z + 0.5 * sc), 0.08 * S)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('bagan')
