# The Verona Arena in the high-quality look (hq.py), laid out in metres (drawn smaller than it is, to
# fit): the Roman amphitheatre of pink and white limestone in the Piazza Bra; its inner ring of two
# storeys of arches all the way round; the Ala, the one stretch left of the taller outer ring, standing
# three storeys high on its north side; the stepped seating of the cavea falling to the sandy arena;
# the piazza's paving round it, and people.
# Run: blender -b --factory-startup -P verona-arena.py -- verona-arena-1024.png 1024 verona-arena.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(30)
M['veronaStone'] = material('veronaStone', '#e2c8b2', 0.85, vary='#d6b8a0', vary_scale=24, bump=0.25, bump_scale=200)
M['veronaPink'] = material('veronaPink', '#d6a890', 0.85, vary='#c99a82', vary_scale=24, bump=0.25, bump_scale=200)
M['seats'] = material('arenaSeats', '#cdbba6', 0.85, vary='#c0ad97', vary_scale=40, bump=0.2, bump_scale=200)
M['sandV'] = material('arenaSand', '#d9c08e', 0.95, vary='#cdb383', vary_scale=20)
M['piazza'] = masonry('piazzaBra', '#d8cbb5', '#b8ab95', scale=90, rough=0.85, vary='#cfc2ac')

S = 0.0215              # metres to the tile's units
Z0 = G + 0.004
AX, AY = 58.0, 46.0     # the inner ring's half-axes
H1, H2 = 9.5, 8.5       # its two storeys


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def ellipse(a, b, n=96):
    return [(a * math.cos(2 * math.pi * k / n), b * math.sin(2 * math.pi * k / n)) for k in range(n)]


BEFORE = set(bpy.data.objects)
slab('piazza', M['piazza'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)

# ------------------------------------------------------------------ the inner ring: two storeys of arches all round, the attic
mat_ = Matrix.Translation((0, 0, Z0)) @ Matrix.Diagonal((S, S, S, 1.0))
NB = 72
for st, (z0, spring, top, mat) in enumerate(((0.0, 5.6, H1, 'veronaPink'), (H1, H1 + 4.4, H1 + H2, 'veronaStone'))):
    # the piers up to the springing line, then the band with its arches over them
    for k in range(NB):
        t = 2 * math.pi * k / NB
        x, y = AX * math.cos(t), AY * math.sin(t)
        nx, ny = math.cos(t) / AX, math.sin(t) / AY
        box(f'pier{st}_{k}', M[mat], P(x * 0.975, y * 0.975, (z0 + spring) / 2), (1.6 * S, 3.0 * S, (spring - z0) * S), rot_z=math.atan2(ny, nx), bevel=0)
    arcade_ring(f'ring{st}', M[mat], AX, 3.0, spring, top - spring, NB, 2.0, sx=1.0, sy=AY / AX, matrix=mat_)
for k, (z0, z1, mat) in enumerate(((H1 - 0.6, H1, 'veronaStone'), (H1 + H2, H1 + H2 + 1.6, 'veronaPink'))):
    rings = []
    for z in (z0, z1):
        rings.append([P(x * 1.002, y * 1.002, z).to_tuple() for x, y in ellipse(AX, AY)])
    rings.append([P(x * 0.95, y * 0.95, z1).to_tuple() for x, y in ellipse(AX, AY)])
    rings.append([P(x * 0.95, y * 0.95, z0).to_tuple() for x, y in ellipse(AX, AY)])
    loft(f'cornice{k}', M[mat], rings, cap=False, smooth=False)

# ------------------------------------------------------------------ the Ala: four bays of the outer ring, three storeys high
OA, OB = AX + 9.0, AY + 9.0
bays = [(OA * math.cos(t), OB * math.sin(t)) for t in [math.radians(a) for a in (100.0, 104.5, 109.0, 113.5, 118.0)]]
for st, (z0, h, mat) in enumerate(((0.0, 10.0, 'veronaPink'), (10.0, 9.0, 'veronaStone'), (19.0, 8.0, 'veronaPink'))):
    spring = z0 + h - 3.6
    arcade_path(f'ala{st}', M[mat], [(x * S, y * S) for x, y in bays], 2.4 * S, Z0 + spring * S, 3.6 * S, 2.6 * S if st < 2 else 1.6 * S, inward=True, closed_center=(0.0, 0.0))
for x, y in bays:
    box(f'alaPier{x:+.0f}', M['veronaPink'], P(x, y, 13.5), (1.6 * S, 2.6 * S, 27.0 * S), rot_z=math.atan2(y, x), bevel=0)

# ------------------------------------------------------------------ the cavea's stepped seating, the arena's sand
rings = []
n_steps = 16
for k in range(n_steps + 1):
    f = 1.0 - 0.52 * k / n_steps
    z = (H1 + H2 - 1.0) * (1.0 - k / n_steps) + 0.8
    a, b = (AX - 3.2) * f, (AY - 3.2) * f
    rings.append([P(x, y, z).to_tuple() for x, y in ellipse(a, b)])
    if k < n_steps:
        z2 = (H1 + H2 - 1.0) * (1.0 - (k + 1) / n_steps) + 0.8
        rings.append([P(x, y, z2).to_tuple() for x, y in ellipse(a, b)])
loft('cavea', M['seats'], rings, cap=False, smooth=False)
slab('arena', M['sandV'], [(x * S, y * S) for x, y in ellipse((AX - 3.2) * 0.48, (AY - 3.2) * 0.48, 64)], Z0, Z0 + 0.8 * S, margin=0.03)
for k, (x, y, shirt) in enumerate(((-10.0, -60.0, 'red'), (6.0, -62.0, 'blue'), (-30.0, -50.0, 'yellow'), (24.0, -54.0, 'green'), (0.0, -2.0, 'red'))):
    c = P(x, y, 0.8 if k == 4 else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('verona-arena')
