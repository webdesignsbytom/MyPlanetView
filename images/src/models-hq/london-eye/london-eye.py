# The London Eye in the high-quality look (hq.py), drawn to its real proportions (laid out in metres):
# the great wheel on the South Bank, its rim a triangular steel truss, the cables spoking in to the hub,
# its 32 egg-shaped glass capsules round the outside, the A-frame leaning out from the bank that holds
# it, its backstay cables; the boarding pier over the Thames, the Queen's Walk with its plane trees and
# lamps, Jubilee Gardens behind, a river boat, and people.
# Run: blender -b --factory-startup -P london-eye.py -- london-eye-1024.png 1024 london-eye.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(2000)
M['eyeWhite'] = material('eyeWhite', '#eef0f2', 0.35, metallic=0.4)
M['capsule'] = material('capsuleGlass', '#a9c6d6', 0.08, vary='#bcd3e0', vary_scale=4, metallic=0.4, coat=0.6)
M['cableSteel'] = material('cableSteel', '#b9bec4', 0.4, metallic=0.7)
M['thames'] = material('thames', '#4f7a85', 0.08, vary='#5a8690', vary_scale=3, coat=0.5, bump=0.1, bump_scale=40)
M['embankment'] = material('embankment', '#b8b1a3', 0.75, vary='#a9a294', vary_scale=24, bump=0.2, bump_scale=120)
M['boatHull'] = material('boatHull', '#2f4f7a', 0.5, coat=0.3)

S = 0.0172              # metres to the tile's units
R = 60.0                # the wheel's radius
HUB = (0.0, -30.8, 72.0)  # the hub above the river's edge (metres): the wheel turns in the plane y = HUB y, over the pier
ZB = G + 0.03           # the Queen's Walk


def P(x, y, z):
    return Vector((x * S, y * S, ZB + z * S))


# ------------------------------------------------------------------ the river, the embankment, the walk and the gardens
RIVER_Y = -0.45
slab('thames', M['thames'], [(-2, -2), (2, -2), (2, RIVER_Y), (-2, RIVER_Y)], G - 0.004, G + 0.002, margin=0.02)
slab('embankment', M['embankment'], [(-2, RIVER_Y), (2, RIVER_Y), (2, RIVER_Y + 0.03), (-2, RIVER_Y + 0.03)], G - 0.004, ZB + 0.006, margin=0.02)
slab('walk', M['paving'], [(-2, RIVER_Y + 0.03), (2, RIVER_Y + 0.03), (2, 0.3), (-2, 0.3)], G - 0.004, ZB, margin=0.02)
slab('gardens', M['lawn'], [(-2, 0.3), (2, 0.3), (2, 2), (-2, 2)], G - 0.004, ZB + 0.002, margin=0.02)
for k in range(13):
    x = -1.35 + k * 0.225
    if abs(x) > 0.18 and math.hypot(x + 0.11, RIVER_Y + 0.12) < 1.38:
        tree(f'plane{k}', x, RIVER_Y + 0.12, h=0.16, r=0.06, z=ZB)
        cylinder(f'lamp{k}', M['iron'], 0.003, 0.05, (x + 0.11, RIVER_Y + 0.05, ZB), segs=6)
for k, (x, y) in enumerate(((-0.9, 0.65), (-0.45, 0.95), (0.3, 0.8), (0.75, 0.55), (1.0, 0.95), (-1.1, 0.35), (0.0, 1.25))):
    tree(f'garden{k}', x, y, h=0.15, r=0.065, z=ZB + 0.002)

# ------------------------------------------------------------------ the boarding pier
slab('pier', M['embankment'], rect(0.0, RIVER_Y - 0.12, 0.62, 0.24), G - 0.004, ZB + 0.004, bevel=0.003, margin=0.02)
for k in range(6):
    cylinder(f'pierPile{k}', M['embankment'], 0.012, ZB - G + 0.004, (-0.25 + k * 0.1, RIVER_Y - 0.22, G - 0.004), segs=10)

# ------------------------------------------------------------------ the wheel
hx, hy, hz = HUB
BARS = bmesh.new()


def member(p0, p1, t):
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(BARS, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t * S, t * S, d.length, 1)))


def rim(a, off, dr=0.0):
    return P(hx + (R + dr) * math.cos(a), hy + off, hz + (R + dr) * math.sin(a))


NR = 64
for k in range(NR):
    a0, a1 = 2 * math.pi * k / NR, 2 * math.pi * (k + 1) / NR
    for off, dr in ((-2.5, -3.5), (2.5, -3.5), (0.0, 0.0)):      # the truss's three chords
        member(rim(a0, off, dr), rim(a1, off, dr), 0.9)
    for off in (-2.5, 2.5):
        member(rim(a0, off, -3.5), rim(a0, 0.0, 0.0), 0.5)
        member(rim(a0, off, -3.5), rim(a1, 0.0, 0.0), 0.35)
    member(rim(a0, -2.5, -3.5), rim(a0, 2.5, -3.5), 0.5)
# the spoke cables, crossing in to either end of the hub
for k in range(64):
    a = 2 * math.pi * k / 64
    member(P(hx, hy + (6.0 if k % 2 else -6.0), hz), rim(a, -2.5 if k % 2 else 2.5, -3.5), 0.22)
lathe('hub', M['eyeWhite'], [(r * S, z * S) for r, z in ((1.0, 0), (3.2, 1), (3.2, 13), (1.0, 14))], (0, 0, 0), segs=24,
      matrix=Matrix.Translation(P(hx, hy - 7.0, hz)) @ Matrix.Rotation(-math.pi / 2, 4, 'X'))
# the 32 capsules, egg-shaped, held on the outside of the rim and kept level
for k in range(32):
    a = 2 * math.pi * (k + 0.5) / 32
    c = P(hx + (R + 5.0) * math.cos(a), hy, hz + (R + 5.0) * math.sin(a))
    lathe(f'capsule{k}', M['capsule'], [(r * S, z * S) for r, z in ((0.0, -2.0), (2.2, -1.5), (3.6, 0.0), (2.2, 1.6), (0.0, 2.1))], (0, 0, 0), segs=20, smooth=True,
          matrix=Matrix.Translation(c) @ Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Diagonal((1.0, 0.62, 1.0, 1)))
    member(c, P(hx + (R + 1.0) * math.cos(a), hy, hz + (R + 1.0) * math.sin(a)), 0.6)
finish('wheel', BARS, M['eyeWhite'], smooth_sides=False)
# the A-frame leaning from the bank to the hub, and its backstay cables
LEGS = bmesh.new()
for sx in (-1, 1):
    foot = P(hx + sx * 20.0, hy + 58.0, -4.0)
    top = P(hx + sx * 2.0, hy + 7.0, hz)
    d = top - foot
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cone(LEGS, cap_ends=True, segments=16, radius1=2.4 * S, radius2=1.6 * S, depth=d.length, matrix=Matrix.Translation((foot + top) / 2) @ rot)
finish('aFrame', LEGS, M['eyeWhite'], smooth_all=True)
CABLES = bmesh.new()
for sx in (-1, 1):
    for k in range(3):
        a, b = P(hx + sx * 2.0, hy + 8.0, hz - 2.0 * k), P(hx + sx * (26.0 + 6 * k), hy + 95.0, -2.0)
        d = b - a
        rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        bmesh.ops.create_cone(CABLES, cap_ends=True, segments=6, radius1=0.25 * S, radius2=0.25 * S, depth=d.length, matrix=Matrix.Translation((a + b) / 2) @ rot)
finish('backstays', CABLES, M['cableSteel'], smooth_all=True)

# ------------------------------------------------------------------ a river boat, and people
m = Matrix.Translation((-0.75, -0.95, G + 0.002)) @ Matrix.Rotation(math.radians(5), 4, 'Z')
box_m('boatHull', M['boatHull'], m @ Matrix.Translation((0, 0, 0.008)), (0.26, 0.06, 0.018), bevel=0.008)
box_m('boatCabin', M['white'], m @ Matrix.Translation((0.01, 0, 0.024)), (0.18, 0.05, 0.018), bevel=0.004)
box_m('boatWindows', M['window'], m @ Matrix.Translation((0.01, 0, 0.026)), (0.17, 0.052, 0.008), bevel=0)
for k, (x, y, shirt) in enumerate(((-0.3, -0.3, 'red'), (0.25, -0.33, 'blue'), (0.45, -0.25, 'yellow'), (-0.55, -0.22, 'green'), (0.05, -0.62, 'red'), (-0.1, -0.55, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=ZB if y > RIVER_Y else ZB + 0.004)

render('london-eye')
