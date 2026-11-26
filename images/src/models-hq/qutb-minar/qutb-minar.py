# The Qutb Minar in the high-quality look (hq.py), laid out in metres: Delhi's tower of victory, 72.5 m of
# red and buff sandstone tapering in five storeys; the first fluted in round and angular flutes by turns,
# the second in round flutes, the third in angular ones, the fourth and fifth round and banded with white
# marble; the balconies between them on their corbels, and the bands of carved inscription; at its foot
# the ruined arched screen of the Quwwat-ul-Islam mosque, the domed Alai Darwaza gateway, the Iron
# Pillar, lawns, and people.
# Run: blender -b --factory-startup -P qutb-minar.py -- qutb-minar-1024.png 1024 qutb-minar.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1199)
M['redQ'] = material('qutbRed', '#b45a3e', 0.85, vary='#a65036', vary_scale=24, bump=0.1, bump_scale=200)
M['buffQ'] = material('qutbBuff', '#d9b388', 0.85, vary='#cea77b', vary_scale=24, bump=0.15, bump_scale=300)
M['marbleQ'] = material('qutbMarble', '#efe9de', 0.5, vary='#e4ddd0', vary_scale=24)
M['ruin'] = material('qutbRuin', '#a89279', 0.9, vary='#988470', vary_scale=24, bump=0.3, bump_scale=200)
M['ironQ'] = material('ironPillar', '#3d3833', 0.4, metallic=0.7)
M['recessQ'] = material('qutbRecess', '#4e2c22', 0.85)
M['lawnQ'] = material('qutbLawn', '#6aa443', 0.85, vary='#78b14e', vary_scale=12, bump=0.3, bump_scale=200)
M['pathQ'] = material('qutbPath', '#cbbfa7', 0.85, vary='#c0b39a', vary_scale=40)

S = 2.75 / 75.0         # metres to the tile's units: the top about 2.75 units up
Z0 = G + 0.004
MX, MY = 0.0, 6.0       # the minaret's place


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def fluted(name, mat, z0, z1, r0, r1, n, kind, depth):
    """A storey's shaft: its radius rippled round by n flutes (round, angular, or both by turns)."""
    rings = []
    for i in range(13):
        t = i / 12
        z = z0 + (z1 - z0) * t
        r = r0 + (r1 - r0) * t
        ring = []
        for q in range(n * 8):
            a = 2 * math.pi * q / (n * 8)
            f = (a * n / (2 * math.pi)) % 1.0
            k = int(a * n / (2 * math.pi))
            style = kind if kind != 'both' else ('round' if k % 2 == 0 else 'angular')
            bump = math.sin(math.pi * f) if style == 'round' else 1.0 - abs(2.0 * f - 1.0)
            rr = r * (1.0 + depth * bump)
            ring.append(P(MX + rr * math.cos(a), MY + rr * math.sin(a), z).to_tuple())
        rings.append(ring)
    return loft(name, mat, rings, smooth=False)


def balcony(name, z, r):
    """A balcony on its corbels: a stepped ring flaring out, its floor and parapet."""
    lathe(name + 'Corbels', M['buffQ'], [(r * S, 0.0), ((r + 0.4) * S, 0.6 * S), ((r + 0.9) * S, 1.1 * S), ((r + 1.5) * S, 1.6 * S), ((r + 1.6) * S, 1.9 * S), (0.0, 1.9 * S)], P(MX, MY, z - 1.9), segs=64)
    annulus(name + 'Parapet', M['redQ'], (r + 1.6) * S, (r + 1.3) * S, Z0 + z * S, Z0 + (z + 1.0) * S, segs=64, center=(MX * S, MY * S))


BEFORE = set(bpy.data.objects)
slab('lawn', M['lawnQ'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
slab('paving', M['pathQ'], [((MX - 14.0) * S, (MY - 22.0) * S), ((MX + 14.0) * S, (MY - 22.0) * S), ((MX + 14.0) * S, (MY + 12.0) * S), ((MX - 14.0) * S, (MY + 12.0) * S)], Z0, Z0 + 0.2 * S, margin=0.02)
WIN = []

# ------------------------------------------------------------------ the minaret: five storeys, the balconies, the bands of inscription
cylinder('plinth', M['buffQ'], 8.4 * S, 1.2 * S, P(MX, MY, 0.0), segs=48)
STAGES = [(1.2, 30.0, 7.2, 5.6, 24, 'both', 0.07, 'redQ'), (32.0, 46.0, 5.0, 4.2, 20, 'round', 0.07, 'redQ'),
          (48.0, 58.0, 3.9, 3.4, 20, 'angular', 0.08, 'redQ'), (60.0, 66.0, 3.2, 2.9, 1, 'round', 0.0, 'marbleQ'), (67.8, 72.0, 2.7, 2.5, 1, 'round', 0.0, 'redQ')]
for k, (z0, z1, r0, r1, n, kind, depth, mat) in enumerate(STAGES):
    if n > 1:
        fluted(f'stage{k}', M[mat], z0, z1, r0, r1, n, kind, depth)
        for f in (0.22, 0.55, 0.85):
            z = z0 + (z1 - z0) * f
            r = r0 + (r1 - r0) * f
            cylinder(f'band{k}{f}', M['buffQ'], r * (1.0 + depth * 1.05) * S, 0.9 * S, P(MX, MY, z), segs=n * 8)
    else:
        cylinder(f'stage{k}', M[mat], r0 * S, (z1 - z0) * S, P(MX, MY, z0), segs=48, r2=r1 * S)
        for f in (0.3, 0.7):
            cylinder(f'band{k}{f}', M['redQ' if mat == 'marbleQ' else 'marbleQ'], (r0 + (r1 - r0) * f + 0.05) * S, 0.8 * S, P(MX, MY, z0 + (z1 - z0) * f), segs=48)
    if k < len(STAGES) - 1:
        balcony(f'balcony{k}', z1 + 2.0 if k < 3 else z1 + 1.8, r1)
lathe('cupolaBase', M['buffQ'], [(2.7 * S, 0.0), (2.7 * S, 0.6 * S), (0.0, 0.6 * S)], P(MX, MY, 72.0), segs=32)
for j in range(8):
    a = 2 * math.pi * j / 8
    bar(f'topPost{j}', M['buffQ'], P(MX + 2.2 * math.cos(a), MY + 2.2 * math.sin(a), 72.6), P(MX + 2.2 * math.cos(a), MY + 2.2 * math.sin(a), 73.8), 0.15 * S)
cylinder('topRail', M['buffQ'], 2.4 * S, 0.25 * S, P(MX, MY, 73.8), segs=32)
c = P(MX, MY - 7.6, 0)
WIN.append((c.x, c.y, Z0 + 1.2 * S, 1.4 * S, 2.6 * S, (0, -1), 'pointed'))

# ------------------------------------------------------------------ the mosque's arched screen, the Alai Darwaza, the Iron Pillar
SX0 = -21.0
block('screen', M['ruin'], SX0 - 10.0, SX0 + 10.0, 10.0, 13.0, 0.0, 15.0)
for x, w, h in ((SX0, 6.0, 12.4), (SX0 - 7.0, 3.6, 8.2), (SX0 + 7.0, 3.6, 8.2)):
    for y, n in ((9.95, (0, -1)), (13.05, (0, 1))):
        c = P(x, y, 0)
        WIN.append((c.x, c.y, Z0 + 0.0, w * S, h * S, n, 'pointed'))
for k in range(7):
    x = SX0 - 9.0 + 3.0 * k
    cylinder(f'colonnade{k}', M['ruin'], 0.45 * S, 5.4 * S, P(x, 18.0, 0.0), segs=10)
block('colonnadeBeam', M['ruin'], SX0 - 9.4, SX0 + 9.4, 17.4, 18.6, 5.4, 6.0, bevel=0)
AX, AY = 24.0, 14.0
block('alaiDarwaza', M['redQ'], AX - 8.0, AX + 8.0, AY - 8.0, AY + 8.0, 0.0, 14.0)
block('alaiCornice', M['marbleQ'], AX - 8.3, AX + 8.3, AY - 8.3, AY + 8.3, 13.4, 14.2, bevel=0)
for nx, ny in ((0, -1), (-1, 0)):
    c = P(AX + nx * 8.05, AY + ny * 8.05, 0)
    WIN.append((c.x, c.y, Z0 + 0.0, 5.2 * S, 9.0 * S, (nx, ny), 'pointed'))
cylinder('alaiDrum', M['redQ'], 6.0 * S, 1.6 * S, P(AX, AY, 14.2), segs=48)
lathe('alaiDome', M['ruin'], [(6.0 * S, 0.0), (5.8 * S, 1.8 * S), (4.4 * S, 4.2 * S), (2.0 * S, 5.6 * S), (0.0, 6.0 * S)], P(AX, AY, 15.8), segs=48, smooth=True)
cylinder('ironPillarBase', M['ruin'], 1.2 * S, 0.6 * S, P(-14.0, -8.0, 0.0), segs=24)
cylinder('ironPillar', M['ironQ'], 0.22 * S, 7.2 * S, P(-14.0, -8.0, 0.6), segs=16, r2=0.18 * S)
lathe('ironCapital', M['ironQ'], [(0.25 * S, 0.0), (0.45 * S, 0.4 * S), (0.3 * S, 0.8 * S), (0.0, 1.0 * S)], P(-14.0, -8.0, 7.8), segs=16)
for j in range(4):
    bar(f'pillarRail{j}', M['ironQ'], P(-14.0 + 2.0 * math.cos(j * math.pi / 2), -8.0 + 2.0 * math.sin(j * math.pi / 2), 0.0), P(-14.0 + 2.0 * math.cos(j * math.pi / 2), -8.0 + 2.0 * math.sin(j * math.pi / 2), 1.0), 0.08 * S)
glazed('arches', WIN, M['buffQ'], glass=M['recessQ'], depth=0.4 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-4.0, -10.0, 'red'), (3.0, -13.0, 'blue'), (-10.0, -4.0, 'yellow'), (12.0, -6.0, 'green'), (-22.0, 2.0, 'red'))):
    c = P(x, y, 0.2)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.6)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('qutb-minar')
