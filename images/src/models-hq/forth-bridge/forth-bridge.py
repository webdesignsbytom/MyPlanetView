# The Forth Bridge in the high-quality look (hq.py), laid out in metres (one of its three cantilevers):
# the great double diamond of the railway bridge over the Firth of Forth, painted Forth Bridge red; the
# four tubular legs rising from the granite piers and leaning together to the top; the curved
# compression tubes sweeping out and up from the piers to the arms' tips, the straight top chords running
# down to meet them, the lattice of struts and ties between; the rail deck running through it, a train
# crossing, and the sea below.
# Run: blender -b --factory-startup -P forth-bridge.py -- forth-bridge-1024.png 1024 forth-bridge.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1890)
M['forthRed'] = material('forthRed', '#b2412c', 0.55, vary='#a63a27', vary_scale=40, metallic=0.2)
M['granite'] = material('forthGranite', '#9d968b', 0.85, vary='#8f887e', vary_scale=30, bump=0.2, bump_scale=200)
M['sea'] = material('firthOfForth', '#4a7488', 0.06, vary='#557f92', vary_scale=6, bump=0.04, bump_scale=60, coat=0.8)
M['train'] = material('trainLivery', '#2f4f7a', 0.5)
M['trainRoof'] = material('trainRoof', '#c9ccd0', 0.5)

S = 0.0083              # metres to the tile's units
Z0 = G
L = 160.0               # the cantilever's half-length shown
TOPZ = 106.0            # the towers' top
DECK = 48.0


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


slab('sea', M['sea'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0 + 0.2 * S, margin=0.02)
BEFORE = set(bpy.data.objects)
TUBE = 2.6              # the big tubes' radius


def bottom(x, side):
    """The compression tube: from the pier's foot curving out and up to the arm's tip."""
    t = min(1.0, abs(x) / L)
    return Vector((x, side * (18.0 - 13.0 * t), 6.0 + (DECK - 6.0) * t ** 1.7))


def top(x, side):
    """The top chord: from the tower's top straight down to the arm's tip."""
    t = min(1.0, max(0.0, (abs(x) - 6.0) / (L - 6.0)))
    return Vector((x, side * (5.0 + 0.0 * t), TOPZ - (TOPZ - DECK - 2.0) * t))


def tubeP(name, pts, r):
    tube(name, M['forthRed'], [P(p.x, p.y, p.z) for p in pts], r * S)


# ------------------------------------------------------------------ the piers and the tower's four legs, their bracing
for sx in (-1, 1):
    for sy in (-1, 1):
        cylinder(f'pier{sx}{sy}', M['granite'], 7.0 * S, 6.0 * S, P(sx * 10.0, sy * 18.0, 0.0), segs=24, r2=6.0 * S)
        tubeP(f'leg{sx}{sy}', [Vector((sx * 10.0, sy * 18.0, 6.0)), Vector((sx * 6.0, sy * 5.0, TOPZ))], TUBE)
for z in (30.0, 56.0, 82.0):
    f = (z - 6.0) / (TOPZ - 6.0)
    for sx in (-1, 1):
        y0 = 18.0 - 13.0 * f
        tubeP(f'legTieY{sx}{z:.0f}', [Vector((sx * (10.0 - 4.0 * f), -y0, z)), Vector((sx * (10.0 - 4.0 * f), y0, z))], 1.0)
    for sy in (-1, 1):
        y0 = sy * (18.0 - 13.0 * f)
        tubeP(f'legTieX{sy}{z:.0f}', [Vector((-(10.0 - 4.0 * f), y0, z)), Vector((10.0 - 4.0 * f, y0, z))], 1.0)
box('towerTop', M['forthRed'], P(0.0, 0.0, TOPZ + 1.5), (16.0 * S, 14.0 * S, 3.0 * S), bevel=0)

# ------------------------------------------------------------------ the two cantilever arms: compression tubes, top chords, the lattice between
for sx in (-1, 1):
    for sy in (-1, 1):
        xs = [sx * (10.0 + (L - 10.0) * k / 24) for k in range(25)]
        tubeP(f'bottom{sx}{sy}', [bottom(x, sy) for x in xs], TUBE)
        tubeP(f'topChord{sx}{sy}', [top(sx * 6.0, sy), top(sx * L, sy)], 1.5)
        n = 7
        for k in range(1, n + 1):
            x = sx * (10.0 + (L - 10.0) * k / (n + 0.4))
            b, t = bottom(x, sy), top(x, sy)
            tubeP(f'post{sx}{sy}{k}', [b, t], 1.2)
            xn = sx * (10.0 + (L - 10.0) * (k - 1) / (n + 0.4))
            tubeP(f'diag{sx}{sy}{k}', [bottom(xn, sy), t], 0.85)
        for k in range(1, n + 1):
            x = sx * (10.0 + (L - 10.0) * k / (n + 0.4))
            tubeP(f'crossBottom{sx}{k}', [bottom(x, -1), bottom(x, 1)], 0.8)
            tubeP(f'crossTop{sx}{k}', [top(x, -1), top(x, 1)], 0.8)

# ------------------------------------------------------------------ the deck running through, the train on it
box('deck', M['forthRed'], P(0.0, 0.0, DECK), (2 * L * S, 9.0 * S, 4.0 * S), bevel=0)
for s in (-1, 1):
    tubeP(f'deckRail{s}', [Vector((-L, s * 4.4, DECK + 2.8)), Vector((L, s * 4.4, DECK + 2.8))], 0.3)
for k in range(6):
    x = -60.0 + 22.0 * k
    box(f'carriage{k}', M['train'], P(x, -1.6, DECK + 4.0), (20.0 * S, 3.0 * S, 3.6 * S), bevel=0.002)
    box(f'carriageRoof{k}', M['trainRoof'], P(x, -1.6, DECK + 6.0), (20.0 * S, 2.8 * S, 0.5 * S), bevel=0)

R = Matrix.Rotation(math.radians(-32.0 + 8.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('forth-bridge')
