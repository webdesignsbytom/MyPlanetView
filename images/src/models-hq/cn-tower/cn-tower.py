# The CN Tower in the high-quality look (hq.py), drawn to its real proportions (laid out in metres):
# Toronto's concrete tower, its three curving legs rising round the hexagonal core, the main pod with
# its outdoor deck, the glass bands of its observation levels and the revolving restaurant, the
# SkyPod higher up, and the antenna mast stepping up to the tip; the glass pavilion round its foot,
# the park round it with its trees and paths, the shore of Lake Ontario, and people.
# Run: blender -b --factory-startup -P cn-tower.py -- cn-tower-1024.png 1024 cn-tower.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1976)
M['concrete'] = material('cnConcrete', '#d3d0c9', 0.6, vary='#c4c1ba', vary_scale=30, bump=0.08, bump_scale=200)
M['concreteShade'] = material('cnConcreteShade', '#bcb9b2', 0.65, vary='#adaaa3', vary_scale=30, bump=0.08, bump_scale=200)
M['podGlass'] = material('podGlass', '#5d7f99', 0.15, vary='#6f92ab', vary_scale=4, metallic=0.5, coat=0.4)
M['mast'] = material('mastSteel', '#b9bcc0', 0.35, metallic=0.7)
M['ontario'] = material('ontario', '#2f7fae', 0.06, vary='#3a8cba', vary_scale=3, coat=0.6, bump=0.1, bump_scale=40)
M['parkPath'] = material('parkPath', '#d8cfbf', 0.7, vary='#cbc1b0', vary_scale=40, bump=0.1, bump_scale=200)

S = 3.0 / 553.0         # metres to the tile's units: the tip 3 units up
Z0 = G + 0.006


def P(x, y, z):
    return (x * S, y * S, Z0 + z * S)


# ------------------------------------------------------------------ the park, its paths and the lake
SHORE = [(x, -0.92 + 0.05 * math.sin(2.7 * x + 1.0)) for x in [-1.6 + 0.1 * k for k in range(33)]]
slab('lake', M['ontario'], SHORE + [(1.6, -1.6), (-1.6, -1.6)], G - 0.004, G + 0.002, margin=0.02)
slab('park', M['lawn'], [(-1.6, 1.6), (1.6, 1.6)] + list(reversed(SHORE)), G - 0.004, Z0, margin=0.02)
slab('quay', M['paving'], [(x, y + 0.06) for x, y in SHORE] + list(reversed(SHORE)), G - 0.004, Z0 + 0.003, margin=0.02)   # tops at different heights: faces lying on each other render black
cylinder('plaza', M['paving'], 0.36, 0.0055, (0, 0, Z0 - 0.002), segs=96)
for a in (math.radians(-90), math.radians(30), math.radians(150)):
    slab(f'path{a:.2f}', M['parkPath'], rect(0.85 * math.cos(a), 0.85 * math.sin(a), 1.1, 0.07, rot=a), Z0 - 0.002, Z0 + 0.002, margin=0.05)
for k in range(30):
    a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0.5, 1.35)
    x, y = r * math.cos(a), r * math.sin(a)
    if y < -0.8 or any(abs(((a - b + math.pi) % (2 * math.pi)) - math.pi) < 0.12 for b in (math.radians(-90), math.radians(30), math.radians(150))):
        continue
    tree(f'tree{k}', x, y, h=rng.uniform(0.1, 0.15), r=0.05, z=Z0)

# ------------------------------------------------------------------ the tower: legs, core, pods, mast
LEGS = (math.radians(90), math.radians(210), math.radians(330))
bm = bmesh.new()
for a in LEGS:
    d = Vector((math.cos(a), math.sin(a), 0))
    side = Vector((-d.y, d.x, 0))
    rings = []
    for j in range(17):
        t = j / 16
        z = 335.0 * t
        r_out = 7.0 + 26.0 * (1 - t) ** 1.7           # the leg's outer edge, curving in to the core
        half = 4.6 - 1.8 * t                           # its thickness
        c0, c1 = d * 4.0, d * r_out
        ring = [c0 - side * half, c1 - side * half, c1 + side * half, c0 + side * half]
        rings.append([bm.verts.new(P(v.x, v.y, z)) for v in ring])
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(4):
            bm.faces.new((r0[k], r0[(k + 1) % 4], r1[(k + 1) % 4], r1[k]))
finish('legs', bm, M['concrete'], smooth_sides=False)
lathe('core', M['concrete'], [(r * S, z * S) for r, z in ((8.0, 0), (7.5, 200), (6.6, 335), (6.0, 450), (5.0, 458))], P(0, 0, 0), segs=6)
# the glass lifts up the legs' outer faces
for a in LEGS:
    d = Vector((math.cos(a), math.sin(a), 0))
    pts = [P(*(d * (7.0 + 26.0 * (1 - t) ** 1.7 + 0.25)).xy, 335.0 * t) for t in (j / 12 for j in range(13))]
    tube(f'lift{a:.2f}', M['podGlass'], [p for p in pts[1:-1]], 1.6 * S)
# the main pod: the outdoor deck, the observation levels' glass, the restaurant, the roof
POD = [(7.0, 330), (14.0, 334), (19.5, 340), (20.5, 342.5), (21.5, 346), (21.5, 351), (20.5, 354), (21.0, 356), (20.5, 360), (18.0, 364), (12.0, 367), (7.0, 368)]
lathe('pod', M['concrete'], [(r * S, (z - 330) * S) for r, z in POD], P(0, 0, 330), segs=96, smooth=True)
for z0, z1, r in ((346.0, 350.5, 21.7), (355.8, 359.0, 21.2)):
    lathe(f'podGlass{z0}', M['podGlass'], [(r * S, 0), ((r + 0.3) * S, (z1 - z0) * 0.5 * S), (r * S, (z1 - z0) * S)], P(0, 0, z0), segs=96, smooth=True)
annulus('deckRail', M['mast'], 21.0 * S, 20.6 * S, Z0 + 342.2 * S, Z0 + 343.4 * S, segs=96)
# the SkyPod
lathe('skyPod', M['concrete'], [(r * S, (z - 440) * S) for r, z in ((6.0, 440), (8.5, 444), (9.0, 448), (8.0, 452), (5.5, 454))], P(0, 0, 440), segs=64, smooth=True)
lathe('skyPodGlass', M['podGlass'], [(9.1 * S, 0), (9.3 * S, 1.5 * S), (9.1 * S, 3.0 * S)], P(0, 0, 445), segs=64, smooth=True)
# the antenna mast, stepping in to the tip
lathe('mast', M['mast'], [(r * S, (z - 454) * S) for r, z in ((4.2, 454), (4.0, 480), (3.2, 482), (3.0, 505), (2.2, 507), (2.0, 528), (1.2, 530), (1.0, 545), (0.4, 553), (0.0, 553.5))], P(0, 0, 454), segs=24)
# the glass pavilion round the foot
for a in LEGS:
    a2 = a + math.pi / 3
    box(f'pavilion{a:.2f}', M['podGlass'], P(18 * math.cos(a2), 18 * math.sin(a2), 4.0), (20 * S, 14 * S, 8 * S), rot_z=a2, bevel=0.002)
    box(f'pavilionRoof{a:.2f}', M['concreteShade'], P(18 * math.cos(a2), 18 * math.sin(a2), 8.4), (22 * S, 16 * S, 1.2 * S), rot_z=a2, bevel=0.001)

for k, (x, y, shirt) in enumerate(((-0.2, -0.3, 'red'), (0.15, -0.35, 'blue'), (0.3, -0.12, 'yellow'), (-0.32, 0.05, 'green'), (0.05, -0.62, 'red'), (-0.45, -0.7, 'blue'), (0.5, -0.78, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0)

render('cn-tower')
