# The Pont du Gard in the high-quality look (hq.py), laid out in metres and seen from downstream: the
# Roman aqueduct bridge's three tiers of golden limestone arches, the six great ones below with the big
# arch over the river and the road bridge along their downstream side, eleven in the middle, and the
# long row of small ones along the top under the covered channel, its ends running into the hills; the
# green Gardon below between its pale rocky banks and pebble shores, the garrigue's holm oaks on the
# slopes, and people on the banks and the bridge.
# Run: blender -b --factory-startup -P pont-du-gard.py -- pont-du-gard-1024.png 1024 pont-du-gard.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(50)
M['romanStone'] = masonry('gardStone', '#d6b883', '#a98c5e', scale=95, rough=0.85, vary='#cbab74')
M['bankRock'] = material('gardonRock', '#cfc3a8', 0.9, vary='#bfb194', vary_scale=10, bump=0.6, bump_scale=60)
M['garrigue'] = material('garrigue', '#7e9150', 0.9, vary='#8e9c5c', vary_scale=12, bump=0.3, bump_scale=120)
M['pebbles'] = material('pebbleBeach', '#ddd3bf', 0.9, vary='#cfc3ab', vary_scale=200, bump=0.4, bump_scale=500)
M['gardon'] = material('gardon', '#3f8a78', 0.1, vary='#4c9783', vary_scale=8, bump=0.05, bump_scale=30)
M['holmOak'] = material('holmOak', '#4a6634', 0.85, vary='#567340', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.016               # metres to the tile's units (the bridge's long ends run off the base)
TURN = -32.0 + 22.0     # the bridge runs along x, turned so its tiers show their depth


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def bank(y):
    """The river's half width (metres), wandering a little as it flows towards us."""
    return 15.0 + 2.5 * math.sin(y / 24.0)


def ground(x, y):
    """The valley (metres above the river): its bed, the rocky banks, the hills either side."""
    d = abs(x) - bank(y)
    if d < 0:
        return -2.0 + 2.9 * smooth((d + 4.0) / 4.0)     # the bed shelving up to the bank, never a step
    rocks = 5.0 * smooth(d / 7.0)
    hills = 40.0 * smooth((abs(x) - 26.0) / 95.0) * (1.0 if x < 0 else 0.92)
    return max(rocks + hills, 0.9)                  # the banks clearly above the water


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return (ground(x / S, y / S) + 2.0) * S * rim


def pick(z, nz, x, y):
    mx, my = x / S, y / S
    g = ground(mx, my)          # the valley's own height, not the edge's fall
    if g < 1.5:
        return 2
    return 0 if (g < 5.5 or (nz < 0.55 and math.hypot(x, y) < 1.36)) else 1


land = terrain('valley', H, [M['bankRock'], M['garrigue'], M['pebbles']], pick, rings=420, segs=1100)     # fine enough that the materials' edges don't step
BEFORE = set(bpy.data.objects)
ZR = G + 2.0 * S        # the river's level


def P(x, y, z):
    return Vector((x * S, y * S, ZR + z * S))


def low(x0, x1, y):
    """The lowest ground under a stretch, to found a pier below it."""
    return min(ground(x0 + (x1 - x0) * k / 4, y) for k in range(5))


def tier(name, piers, top, depth, pier_w, crown_gap, y0=0.0, floor=None):
    """One tier of arches: piers at the given centres (metres), each bay's arch as wide as the gap
    between its piers, all their crowns `crown_gap` below the tier's top. The piers stand on `floor(x)`
    (the tier below), else on the ground."""
    rs = [(b - a - pier_w) / 2 for a, b in zip(piers, piers[1:])]
    springs = [top - crown_gap - r for r in rs]
    for k, x in enumerate(piers):
        base = floor(x) if floor is not None and floor(x) is not None else low(x - pier_w / 2, x + pier_w / 2, y0) - 1.5
        spring = max(springs[j] for j in (k - 1, k) if 0 <= j < len(springs))
        if base < spring:
            box(f'{name}Pier{k}', M['romanStone'], P(x, y0, (base + spring + 0.2) / 2), (pier_w * S, depth * S, (spring + 0.2 - base) * S), bevel=0)
    for k, (a, b) in enumerate(zip(piers, piers[1:])):
        arcade_path(f'{name}Arch{k}', M['romanStone'], [(a * S, (y0 - depth / 2) * S), (b * S, (y0 - depth / 2) * S)], depth * S, ZR + springs[k] * S, (top - springs[k]) * S, rs[k] * S)


def piers_from(start, bays):
    xs = [start]
    for b in bays:
        xs.append(xs[-1] + b)
    return xs


# ------------------------------------------------------------------ the three tiers and the channel along the top
TOP1, TOP2, TOP3, CANAL = 21.9, 41.4, 48.8, 47.0
low_piers = piers_from(-60.5, [20.5, 23.0, 29.0, 25.5, 21.0, 19.0])
tier('lower', low_piers, TOP1, 10.8, 4.6, 1.4, y0=-2.2)       # with the road bridge along its downstream side
L0, L1 = low_piers[0] - 2.3, low_piers[-1] + 2.3
box('lowerDeck', M['romanStone'], P((L0 + L1) / 2, -2.2, TOP1 + 0.25), ((L1 - L0) * S, 11.2 * S, 0.5 * S), bevel=0)
box('roadParapet', M['romanStone'], P((L0 + L1) / 2, -7.4, TOP1 + 1.0), ((L1 - L0) * S, 0.6 * S, 1.4 * S), bevel=0)
mid_piers = [x for x in piers_from(low_piers[0] - 2 * 19.5, [19.5, 19.5, 20.5, 23.0, 29.0, 25.5, 21.0, 19.0, 19.0, 19.0]) if abs(x) * S < 1.40]
tier('middle', mid_piers, TOP2, 4.6, 3.6, 1.2, floor=lambda x: TOP1 + 0.4 if L0 <= x <= L1 else None)
M0, M1 = mid_piers[0] - 1.8, mid_piers[-1] + 1.8
box('middleCornice', M['romanStone'], P((M0 + M1) / 2, 0.0, TOP2 + 0.2), ((M1 - M0) * S, 5.2 * S, 0.5 * S), bevel=0)
top_piers = [x for x in [-150.0 + 7.8 * k for k in range(40)] if abs(x) * S < 1.41]
tier('upper', top_piers, CANAL, 3.1, 2.9, 0.6, floor=lambda x: TOP2 + 0.4 if M0 <= x <= M1 else None)
box('channel', M['romanStone'], P((top_piers[0] + top_piers[-1]) / 2, 0.0, (CANAL + TOP3) / 2), ((top_piers[-1] - top_piers[0] + 2.9) * S, 3.1 * S, (TOP3 - CANAL + 0.05) * S), bevel=0)
box('channelSlabs', M['romanStone'], P((top_piers[0] + top_piers[-1]) / 2, 0.0, TOP3 + 0.2), ((top_piers[-1] - top_piers[0] + 2.9) * S, 3.6 * S, 0.4 * S), bevel=0)

# ------------------------------------------------------------------ the river, the holm oaks on the slopes, people
water = []
for k in range(41):
    y = -1.6 / S + (3.2 / S) * k / 40
    water.append((bank(y) * S + 0.004, y * S))
water += [(-bank(y / S) * S - 0.004, y) for x, y in reversed(water)]
slab('gardon', M['gardon'], water, G - 0.003, ZR + 0.3 * S, margin=0.02)
OAKS = []
for p in scatter_on(land, 6000, (-1.45, 1.45, -1.45, 1.45), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.36, seed=21):
    mx, my = p.x / S, p.y / S
    if abs(my) < 9.0 and abs(mx) < 125.0:
        continue
    if any(math.hypot(mx - a, my - b) < 7.0 for a, b, *_ in OAKS):
        continue
    OAKS.append((mx, my, p.z))
    if len(OAKS) >= 70:
        break
CROWNS = []
for k, (x, y, z) in enumerate(OAKS):
    r = rng.uniform(2.6, 3.6)
    cylinder(f'oakTrunk{k}', M['trunk'], 0.3 * S, 2.6 * S, (x * S, y * S, z - 0.3 * S), segs=6)
    CROWNS.append(((x * S, y * S, z + (2.2 + r * 0.8) * S), r * S, 0.85))
blob_cloud('holmOaks', M['holmOak'], CROWNS)
for k, (x, y, z, shirt) in enumerate(((24.0, -22.0, None, 'red'), (27.0, -30.0, None, 'blue'), (21.0, -40.0, None, 'yellow'), (-10.0, -4.0, TOP1 + 0.5, 'green'), (4.0, -3.5, TOP1 + 0.5, 'red'), (16.0, -4.5, TOP1 + 0.5, 'blue'))):
    zz = ZR + (ground(x, y) if z is None else z) * S
    person(f'p{k}', x * S, y * S, rng.random() * 6, shirt, z=zz, scale=0.7)

R = Matrix.Rotation(math.radians(TURN), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('pont-du-gard')
