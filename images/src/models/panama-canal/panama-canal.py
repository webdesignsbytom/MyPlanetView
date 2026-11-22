# A cartoon Panama Canal (the Miraflores Locks) for the country maps, built in the set's shared
# look (../toon.py): the two concrete lock chambers side by side, the water a step higher on one
# side of the mitre gates than the other, a container ship stacked with coloured boxes filling one
# chamber as it waits to go down, the "mules" on their rails holding it on cables, a tug in the
# other chamber, the white control house with its red roof on the centre wall, and the green
# hills behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P panama-canal.py -- panama-canal-1024.png 1024 panama-canal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'concrete': toon('concrete', '#cdc9c0', shadow_mul=(0.8, 0.8, 0.88)),
    'rail': flat('rail', '#5d6670'),
    'water': toon('water', '#4a9fc8', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'gate': toon('gate', '#5d6670', shadow_mul=(0.78, 0.78, 0.88)),
    'hull': toon('hull', '#2b4a7a', shadow_mul=(0.72, 0.74, 0.86)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#2f3f5a'),
    'funnel': toon('funnel', '#d9483b'),
    'c1': toon('c1', '#d9534f'), 'c2': toon('c2', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)), 'c3': toon('c3', '#3aa56b', shadow_mul=(0.7, 0.78, 0.8)),
    'c4': toon('c4', '#f0a040', shadow_mul=(0.8, 0.68, 0.55)), 'c5': toon('c5', '#9aa3ad', shadow_mul=(0.78, 0.78, 0.88)),
    'c6': toon('c6', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'mule': toon('mule', '#c9ccd2', shadow_mul=(0.78, 0.8, 0.9)),
    'muleStripe': flat('muleStripe', '#2f8a5a'),
    'cable': flat('cable', '#3a3a3a'),
    'roof': toon('roof', '#b5533c'),
    'tug': toon('tug', '#c8402f'),
    'hill': toon('hill', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'jungle': toon('jungle', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(127)

X0, X1 = -1.2, 1.2            # the locks' length across the tile
WALL = 0.22                   # the walls' height
GATE_X = 0.1
UPPER, LOWER = 0.17, 0.07     # the water's two levels
NEAR = (-0.46, -0.08)         # the chambers, across y
FAR = (0.08, 0.46)

# ---------- the walls, their rails, and the water at its two levels ----------
for name, y0, y1 in (('nearwall', -0.56, NEAR[0]), ('centrewall', NEAR[1], FAR[0]), ('farwall', FAR[1], 0.56)):
    box(name, M['concrete'], (X0 + X1) / 2, (y0 + y1) / 2, G - 0.005, X1 - X0, y1 - y0, WALL, outline=0.022, bevel=0.003)
    for dy in (-0.022, 0.022):
        box(f'{name}rail{dy}', M['rail'], (X0 + X1) / 2, (y0 + y1) / 2 + dy, G + WALL - 0.004, X1 - X0, 0.008, 0.008, outline=0, bevel=0)
for name, (y0, y1), left, right in (('near', NEAR, UPPER, LOWER), ('far', FAR, LOWER, UPPER)):
    box(f'{name}waterL', M['water'], (X0 + GATE_X) / 2, (y0 + y1) / 2, G - 0.005, GATE_X - X0, y1 - y0, left + 0.005, outline=0, bevel=0)
    box(f'{name}waterR', M['water'], (GATE_X + X1) / 2, (y0 + y1) / 2, G - 0.005, X1 - GATE_X, y1 - y0, right + 0.005, outline=0, bevel=0)
    # the mitre gates, two leaves meeting in a V that points to the higher water
    apex = GATE_X + (-0.07 if left > right else 0.07)
    mid = (y0 + y1) / 2
    for ya in (y0, y1):
        p0, p1 = (GATE_X, ya), (apex, mid)
        a = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
        box(f'{name}gate{ya}', M['gate'], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, G - 0.005, math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.01, 0.03,
            WALL - 0.01, rot_z=a, outline=0.01, bevel=0)

# ---------- the container ship waiting in the near chamber, bow to the gates ----------
L0, L1, B = -1.05, -0.02, 0.3
SY = (NEAR[0] + NEAR[1]) / 2


def hull_ring(beam, z):
    return [(L0, SY - beam / 2, z), (L1 - 0.18, SY - beam / 2, z), (L1, SY, z), (L1 - 0.18, SY + beam / 2, z), (L0, SY + beam / 2, z)]


DECK = G + 0.3
loft('hull', M['hull'], [hull_ring(B * 0.85, G + 0.09), hull_ring(B, DECK)], outline=0.018)
box('hullstripe', M['white'], (L0 + L1 - 0.18) / 2, SY - B / 2 - 0.003, DECK - 0.03, L1 - 0.18 - L0, 0.008, 0.012, outline=0, bevel=0)
COLOURS = ('c1', 'c2', 'c3', 'c4', 'c5', 'c6')
for bay in range(10):
    x = -0.74 + bay * 0.066
    for row in range(3):
        y = SY - 0.085 + row * 0.085
        height = rng.choice((2, 3, 3, 4))
        if x > -0.2:
            height = min(height, 2)
        for level in range(height):
            box(f'box{bay}{row}{level}', M[rng.choice(COLOURS)], x, y, DECK + level * 0.044, 0.062, 0.08, 0.042, outline=0.004, bevel=0)
# the superstructure at the stern, its bridge and funnel
box('house', M['white'], -0.88, SY, DECK, 0.13, 0.24, 0.2, outline=0.016, bevel=0.003)
box('bridge', M['white'], -0.86, SY, DECK + 0.2, 0.09, 0.32, 0.045, outline=0.014, bevel=0)
box('bridgewindows', M['window'], -0.86 + 0.046, SY, DECK + 0.21, 0.01, 0.3, 0.022, outline=0, bevel=0)
for k in range(3):
    box(f'housewin{k}', M['window'], -0.88 + 0.066, SY - 0.07 + k * 0.07, DECK + 0.12, 0.01, 0.04, 0.025, outline=0, bevel=0)
box('funnel', M['funnel'], -0.97, SY, DECK + 0.1, 0.06, 0.08, 0.16, outline=0.012, bevel=0.003)
box('funneltop', M['hull'], -0.97, SY, DECK + 0.26, 0.062, 0.082, 0.025, outline=0.008, bevel=0)

# ---------- the mules on the walls, holding the ship on cables ----------
for k, x in enumerate((-0.72, -0.18)):
    for side, y in ((-1, -0.51), (1, -0.03)):
        box(f'mule{k}{side}', M['mule'], x, y, G + WALL, 0.11, 0.05, 0.055, outline=0.01, bevel=0.006)
        box(f'mulestripe{k}{side}', M['muleStripe'], x, y, G + WALL + 0.02, 0.112, 0.052, 0.012, outline=0, bevel=0)
        box(f'mulecab{k}{side}', M['mule'], x, y, G + WALL + 0.055, 0.05, 0.04, 0.03, outline=0.008, bevel=0.004)
        rod(f'cable{k}{side}', M['cable'], (x + 0.03, y - side * 0.02, G + WALL + 0.04), (x + 0.08, SY + side * B / 2, DECK), 0.003, segs=4, outline=0)

# ---------- a tug in the far chamber, down at the lower level ----------
TY = (FAR[0] + FAR[1]) / 2
loft('tughull', M['tug'], [[(-0.62, TY - 0.05, G + LOWER - 0.03), (-0.42, TY - 0.05, G + LOWER - 0.03), (-0.36, TY, G + LOWER - 0.03),
                            (-0.42, TY + 0.05, G + LOWER - 0.03), (-0.62, TY + 0.05, G + LOWER - 0.03)],
                           [(-0.63, TY - 0.07, G + LOWER + 0.05), (-0.42, TY - 0.07, G + LOWER + 0.05), (-0.34, TY, G + LOWER + 0.05),
                            (-0.42, TY + 0.07, G + LOWER + 0.05), (-0.63, TY + 0.07, G + LOWER + 0.05)]], outline=0.012)
box('tugcabin', M['white'], -0.5, TY, G + LOWER + 0.05, 0.1, 0.08, 0.06, outline=0.01, bevel=0)
box('tugwheelhouse', M['white'], -0.48, TY, G + LOWER + 0.11, 0.06, 0.07, 0.04, outline=0.008, bevel=0)

# ---------- the control house on the centre wall ----------
CX = 0.45
box('control', M['white'], CX, 0, G + WALL - 0.005, 0.32, 0.15, 0.13, outline=0.018, bevel=0.003)
for k in range(5):
    box(f'controlwin{k}', M['window'], CX - 0.12 + k * 0.06, -0.078, G + WALL + 0.05, 0.03, 0.01, 0.04, outline=0, bevel=0)
loft('controlroof', M['roof'], [[(CX - 0.18, -0.09, G + WALL + 0.125), (CX + 0.18, -0.09, G + WALL + 0.125), (CX + 0.18, 0.09, G + WALL + 0.125),
                                 (CX - 0.18, 0.09, G + WALL + 0.125)],
                                [(CX - 0.1, -0.005, G + WALL + 0.19), (CX + 0.1, -0.005, G + WALL + 0.19), (CX + 0.1, 0.005, G + WALL + 0.19),
                                 (CX - 0.1, 0.005, G + WALL + 0.19)]], outline=0.016)
box('clocktower', M['white'], CX, 0, G + WALL + 0.17, 0.06, 0.06, 0.08, outline=0.01, bevel=0)
cyl('clock', M['gold'], 0.018, 0.008, segs=16, outline=0, matrix=Matrix.Translation((CX, -0.032, G + WALL + 0.215)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
pyramid('clockroof', M['roof'], CX, 0, G + WALL + 0.25, 0.08, 0.06, outline=0.008)

# ---------- green hills and jungle behind, palms in front ----------
for k, (cx, cy, rx, ry, h) in enumerate(((-0.5, 0.88, 0.5, 0.28, 0.4), (0.3, 0.95, 0.55, 0.28, 0.5), (0.8, 0.8, 0.3, 0.22, 0.32))):
    ring = lambda sx, sy, z, j: [(cx + rx * sx * (1 + rng.uniform(-j, j)) * math.cos(2 * math.pi * i / 14),
                                  cy + ry * sy * (1 + rng.uniform(-j, j)) * math.sin(2 * math.pi * i / 14), G + z) for i in range(14)]
    hill = loft(f'hill{k}', M['hill'], [ring(1, 1, -0.01, 0.0), ring(0.7, 0.7, h * 0.6, 0.08), ring(0.3, 0.3, h, 0.1)], outline=0.03)
    hill.visible_shadow = False
for k, (x, y, z) in enumerate(((-0.75, 0.85, 0.3), (-0.4, 1.05, 0.33), (0.15, 0.95, 0.38), (0.5, 1.1, 0.4), (0.95, 0.72, 0.28),
                               (-1.0, 0.7, 0.12), (1.15, 0.45, 0.06))):
    ball(f'jungle{k}', M['jungle'], x, y, G + z, 0.11, outline=0.018)
for k, x in enumerate((-0.85, -0.3, 0.3, 0.85)):
    y = -0.72 - 0.06 * (k % 2)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.24), 0.016, r2=0.012, segs=8, outline=0.008)
    for f in range(6):
        a = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.24), (x + 0.02 + 0.1 * math.cos(a), y + 0.1 * math.sin(a), G + 0.19), 0.02, outline=0.006)

turn(before, 25)   # looking along the locks a little, so the chambers show over the near wall
render(G)
