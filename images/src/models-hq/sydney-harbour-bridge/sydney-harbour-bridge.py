# The Sydney Harbour Bridge in the high-quality look (hq.py), drawn to its real proportions (laid out
# in metres): the great steel arch across the harbour, its two trusses deepening towards their ends,
# their verticals, diagonals and the bracing between them, the deck hanging from the arch on its
# hangers with the road, the railway and the walkways, the four granite pylons standing on the shores;
# the harbour with a green-and-cream Sydney ferry, the parks of Dawes Point and Milsons Point at the
# ends, and people.
# Run: blender -b --factory-startup -P sydney-harbour-bridge.py -- sydney-harbour-bridge-1024.png 1024 sydney-harbour-bridge.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1932)
M['bridgeSteel'] = material('bridgeSteel', '#8d949b', 0.45, vary='#80878e', vary_scale=40, metallic=0.5)
M['pylonGranite'] = masonry('pylonGranite', '#c9c0b0', '#a39a8a', scale=70, rough=0.75, vary='#bcb3a2')
M['pylonDark'] = material('pylonDark', '#a69c8b', 0.8)
M['harbour'] = material('harbour', '#1f6d9e', 0.06, vary='#2a7cab', vary_scale=3, coat=0.6, bump=0.1, bump_scale=40)
M['asphalt'] = material('asphalt', '#55545a', 0.8, vary='#4b4a50', vary_scale=40, bump=0.1, bump_scale=300)
M['sandstoneSea'] = material('seawallSandstone', '#c9a877', 0.8, vary='#b9986a', vary_scale=20, bump=0.25, bump_scale=120)
M['ferryGreen'] = material('ferryGreen', '#1f5b3a', 0.5, coat=0.3)
M['ferryCream'] = material('ferryCream', '#efe5c8', 0.5)

S = 0.0041              # metres to the tile's units
ZW = G + 0.002          # the water
HALF = 251.5            # half the arch's span
DECK = 49.0             # the deck's height above the water
DW = 24.5               # half the deck's width
TY = DW + 1.5           # each truss's plane


def P(x, y, z):
    return Vector((x * S, y * S, ZW + z * S))


BARS = bmesh.new()


def member(p0, p1, t):
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(BARS, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t * S, t * S, d.length, 1)))


# ------------------------------------------------------------------ the shores and their parks
for s_ in (-1, 1):
    x0 = s_ * (HALF + 22.0)
    shore = [(s_ * 2.0, -2.0), (x0 * S, -2.0), (x0 * S, 2.0), (s_ * 2.0, 2.0)]
    slab(f'seawall{s_}', M['sandstoneSea'], shore, G - 0.004, ZW + 14 * S, bevel=0.003, margin=0.02)
    slab(f'park{s_}', M['lawn'], [((x0 + s_ * 6) * S, -2.0), (s_ * 2.0, -2.0), (s_ * 2.0, 2.0), ((x0 + s_ * 6) * S, 2.0)], ZW + 14 * S - 0.002, ZW + 14 * S + 0.003, margin=0.03)
    for k, y in enumerate((-0.95, -0.6, 0.55, 0.85, 1.1)):
        x = s_ * rng.uniform(1.2, 1.32)
        if math.hypot(x, y) < 1.38:
            tree(f'parkTree{s_}{k}', x, y, h=0.13, r=0.05, z=ZW + 14 * S + 0.003)

# ------------------------------------------------------------------ the arch: two trusses, deepening to their ends
N = 28                  # panels across the span


def z_bottom(x):
    return 12.0 + (118.0 - 12.0) * (1 - (x / HALF) ** 2)


def z_top(x):
    return z_bottom(x) + 18.0 + (57.0 - 18.0) * (x / HALF) ** 2


xs = [-HALF + 2 * HALF * k / N for k in range(N + 1)]
for ty in (-TY, TY):
    for k in range(N):
        xa, xb = xs[k], xs[k + 1]
        member(P(xa, ty, z_bottom(xa)), P(xb, ty, z_bottom(xb)), 4.0)
        member(P(xa, ty, z_top(xa)), P(xb, ty, z_top(xb)), 3.2)
        member(P(xa, ty, z_bottom(xa)), P(xa, ty, z_top(xa)), 1.6)
        if (k < N / 2) == (k % 2 == 0):
            member(P(xa, ty, z_bottom(xa)), P(xb, ty, z_top(xb)), 1.3)
        else:
            member(P(xa, ty, z_top(xa)), P(xb, ty, z_bottom(xb)), 1.3)
    member(P(xs[-1], ty, z_bottom(xs[-1])), P(xs[-1], ty, z_top(xs[-1])), 1.6)
# the bracing between the trusses, top and bottom
for k in range(N):
    xa, xb = xs[k], xs[k + 1]
    for zf in (z_top, z_bottom):
        member(P(xa, -TY, zf(xa)), P(xa, TY, zf(xa)), 1.2)
        member(P(xa, -TY, zf(xa)), P(xb, TY, zf(xb)), 0.8)
        member(P(xa, TY, zf(xa)), P(xb, -TY, zf(xb)), 0.8)
# the hangers from the arch down to the deck
for x in xs:
    if z_bottom(x) > DECK + 3:
        for ty in (-TY, TY):
            member(P(x, ty, DECK), P(x, ty, z_bottom(x)), 0.9)
finish('arch', BARS, M['bridgeSteel'], smooth_sides=False)

# ------------------------------------------------------------------ the deck: road, railway, walkways, railings
box('deck', M['bridgeSteel'], P(0, 0, DECK - 2.5), (2.9 / 1.0, (2 * DW) * S, 5.0 * S), bevel=0)
slab('road', M['asphalt'], [(-2.0, -18.0 * S), (2.0, -18.0 * S), (2.0, 18.0 * S), (-2.0, 18.0 * S)], ZW + DECK * S - 0.001, ZW + DECK * S + 0.0015, margin=0.02)
for k in range(9):      # the road's lane lines
    y = (-16.0 + 4.0 * k) * S
    for j in range(-12, 13):
        x = j * 0.11
        if abs(x) < 1.42:
            box(f'lane{k}_{j}', M['white'], (x, y, ZW + DECK * S + 0.0016), (0.05, 0.0025, 0.0008), bevel=0)
for ty in (-DW, DW):
    slab(f'walk{ty}', M['paving'], [(-2.0, (ty - 3.5 * (1 if ty > 0 else -1)) * S), (2.0, (ty - 3.5 * (1 if ty > 0 else -1)) * S), (2.0, ty * S), (-2.0, ty * S)],
         ZW + DECK * S - 0.001, ZW + DECK * S + 0.003, margin=0.02)
    box(f'railing{ty}', M['bridgeSteel'], (0, ty * S, ZW + DECK * S + 0.008), (2.88, 0.002, 0.01), bevel=0)

# ------------------------------------------------------------------ the four granite pylons
for sx in (-1, 1):
    for sy in (-1, 1):
        cx, cy = sx * (HALF + 30.0), sy * (DW + 10.0)
        lathe(f'pylon{sx}{sy}', M['pylonGranite'], [(r * S, z * S) for r, z in ((19.0, 0), (17.5, 10), (15.5, 70), (16.5, 72), (16.5, 76), (14.0, 77), (14.0, 85), (12.0, 89), (0.0, 89.5))],
              (0, 0, 0), segs=4, matrix=Matrix.Translation(P(cx, cy, 0)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))   # square, its sides along the axes
        # the lookouts' arched openings near the top, recessed in darker granite
        specs = []
        for nx, ny in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            specs.append(((cx + nx * 9.9) * S, (cy + ny * 9.9) * S, ZW + 78 * S, 6.0 * S, 6.0 * S, (nx, ny), 'round'))
        windows(f'pylonArches{sx}{sy}', M['pylonDark'], specs, depth=1.4 * S)

# ------------------------------------------------------------------ a Sydney ferry, and people
m = Matrix.Translation((-0.35, -0.85, ZW)) @ Matrix.Rotation(math.radians(8), 4, 'Z')
box_m('ferryHull', M['ferryGreen'], m @ Matrix.Translation((0, 0, 0.008)), (0.2, 0.06, 0.02), bevel=0.008)
box_m('ferryDeck', M['ferryCream'], m @ Matrix.Translation((0, 0, 0.026)), (0.16, 0.05, 0.02), bevel=0.004)
box_m('ferryWindows', M['window'], m @ Matrix.Translation((0, 0, 0.028)), (0.15, 0.052, 0.008), bevel=0)
box_m('ferryWheelhouse', M['ferryCream'], m @ Matrix.Translation((0, 0, 0.042)), (0.05, 0.035, 0.014), bevel=0.003)
cylinder('ferryFunnel', M['ferryGreen'], 0.006, 0.02, m @ Vector((0.02, 0, 0.048)), segs=12)
for k, (x, y) in enumerate(((-0.7, -0.03), (-0.2, 0.04), (0.35, -0.04), (0.8, 0.05))):
    person(f'walker{k}', x, (DW - 1.8) * S * (1 if y > 0 else -1), rng.random() * 6, rng.choice(('red', 'blue', 'yellow', 'green')), z=ZW + DECK * S + 0.003, scale=0.8)

render('sydney-harbour-bridge')
