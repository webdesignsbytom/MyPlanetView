# The Alamo in the high-quality look (hq.py), laid out in metres on Alamo Plaza: the old mission chapel's
# pale limestone front, the famous curved hump of its parapet with the scrolls at its shoulders, the
# round-arched doorway between its pairs of columns, the empty niches on both storeys, the arched choir
# window over the door and the cornice between them; the chapel's thick-walled body behind; the Long
# Barrack's low wall beside it; the plaza's paving, the spreading live oaks, and people.
# Run: blender -b --factory-startup -P alamo.py -- alamo-1024.png 1024 alamo.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1836)
M['limestoneA'] = masonry('alamoLimestone', '#cdbf9c', '#a99b7c', scale=220, rough=0.85, vary='#c3b592')
M['limestoneSmooth'] = material('alamoSmooth', '#e2d9c0', 0.8, vary='#d8ceb4', vary_scale=24, bump=0.1, bump_scale=200)
M['niche'] = material('alamoNiche', '#b3a68b', 0.9, vary='#a89b80', vary_scale=24)
M['flatRoof'] = material('chapelRoof', '#87827a', 0.85, vary='#7c776f', vary_scale=24)
M['plaza'] = masonry('alamoPlaza', '#cbbfa6', '#a99d86', scale=180, rough=0.85, vary='#c1b59c')
M['liveOak'] = material('liveOak', '#4b6e33', 0.85, vary='#587b3d', vary_scale=14, bump=0.3, bump_scale=90)
M['oakBark'] = material('oakBark', '#5d4c3d', 0.9, vary='#4f4134', vary_scale=30)
M['lawnA'] = material('alamoLawn', '#7aa64f', 0.85, vary='#86b05a', vary_scale=12, bump=0.3, bump_scale=200)

S = 0.05                # metres to the tile's units
FY = 6.0                # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def T(x, y):
    return (x * S, (y - FY) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
slab('plaza', M['plaza'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
slab('lawn', M['lawnA'], [T(12.0, -2.0), T(40.0, -2.0), T(40.0, 30.0), T(12.0, 30.0)], Z0, Z0 + 0.08 * S, margin=0.03)
DOORS, NICHES = [], []

# ------------------------------------------------------------------ the chapel's front: its storeys, cornice, columns, niches, doorway, choir window
W = 9.6
block('front', M['limestoneA'], -W, W, -0.6, 1.2, -0.3, 9.0)
block('frontCornice', M['limestoneSmooth'], -W - 0.2, W + 0.2, -0.9, 1.2, 4.8, 5.3, bevel=0)
block('frontTopCornice', M['limestoneSmooth'], -W - 0.2, W + 0.2, -0.9, 1.2, 8.7, 9.1, bevel=0)
for side in (-1, 1):
    for k, x in enumerate((side * 2.6, side * 5.2)):
        block(f'pedestal{side}{k}', M['limestoneSmooth'], x - 0.5, x + 0.5, -1.3, -0.6, -0.3, 0.9, bevel=0)
        cylinder(f'column{side}{k}', M['limestoneSmooth'], 0.32 * S, 3.6 * S, P(x, -0.95, 0.9), segs=16)
        lathe(f'capital{side}{k}', M['limestoneSmooth'], [(0.32 * S, 0.0), (0.5 * S, 0.3 * S), (0.55 * S, 0.4 * S)], P(x, -0.95, 4.5), segs=16)
    xn = side * 3.9
    c = P(xn, -0.62, 0)
    NICHES.append((c.x, c.y, Z0 + 1.6 * S, 1.2 * S, 2.6 * S, (0, -1), 'round'))
    NICHES.append((c.x, c.y, Z0 + 5.8 * S, 1.1 * S, 2.2 * S, (0, -1), 'round'))
    for k, x in enumerate((side * 2.6, side * 5.2)):
        block(f'upperPilaster{side}{k}', M['limestoneSmooth'], x - 0.35, x + 0.35, -0.9, -0.6, 5.3, 8.7, bevel=0)
arcade_path('doorArch', M['limestoneSmooth'], [(-2.0 * S, (-1.0 - FY) * S), (2.0 * S, (-1.0 - FY) * S)], 0.4 * S, Z0 + 3.0 * S, 1.8 * S, 1.6 * S)
c = P(0.0, -0.65, 0)
DOORS.append((c.x, c.y, Z0 - 0.3 * S, 3.2 * S, 4.9 * S, (0, -1), 'round'))
NICHES.append((c.x, c.y, Z0 + 5.6 * S, 1.6 * S, 2.6 * S, (0, -1), 'round'))
# the curved parapet: shoulders with their scrolls, and the hump rising between them
hump = [(-W, 0.0), (-6.6, 0.0), (-6.6, 0.5), (-6.0, 0.9), (-5.6, 0.7), (-5.2, 0.9), (-4.6, 1.6), (-3.6, 2.4), (-2.6, 3.0), (-1.4, 3.6), (0.0, 3.9)]
outline = hump + [(-u, v) for u, v in reversed(hump) if u < 0]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(u, -0.6, 9.0 + v)) for u, v in outline], [bm.verts.new(P(u, 1.0, 9.0 + v)) for u, v in outline])
finish('parapet', bm, M['limestoneA'], smooth_sides=False)
tube('parapetCoping', M['limestoneSmooth'], [P(u, -0.7, 9.0 + v + 0.12) for u, v in outline[1:-1]], 0.16 * S)
for side in (-1, 1):
    tube(f'scroll{side}', M['limestoneSmooth'], [P(side * (6.3 + 0.5 * math.cos(a)), -0.75, 9.7 + 0.5 * math.sin(a)) for a in [math.pi * k / 8 for k in range(13)]], 0.14 * S)

# ------------------------------------------------------------------ the chapel's body behind, the Long Barrack beside it
block('nave', M['limestoneA'], -6.0, 6.0, 1.2, 22.0, -0.3, 8.2)
block('transept', M['limestoneA'], -11.0, 11.0, 12.0, 18.0, -0.3, 7.4)
block('naveRoof', M['flatRoof'], -6.3, 6.3, 1.2, 22.2, 8.2, 8.6, bevel=0)
block('transeptRoof', M['flatRoof'], -11.3, 11.3, 11.8, 18.2, 7.4, 7.8, bevel=0)
for side in (-1, 1):
    block(f'frontWall{side}', M['limestoneA'], *sorted((side * W, side * 12.0)), 0.0, 1.2, -0.3, 7.0)
block('longBarrack', M['limestoneA'], -21.0, -13.0, -4.0, 6.0, -0.3, 6.4)
block('longBarrackParapet', M['flatRoof'], -21.3, -12.7, -4.3, 6.3, 6.4, 6.9, bevel=0)
for k in range(2):
    x = -19.0 + 4.0 * k
    c = P(x, -4.05, 0)
    DOORS.append((c.x, c.y, Z0 - 0.3 * S, 1.4 * S, 2.6 * S, (0, -1), 'round'))
    NICHES.append((c.x, c.y, Z0 + 3.6 * S, 0.9 * S, 1.3 * S, (0, -1), 'rect'))
block('barrackWall', M['limestoneA'], -13.0, -12.0, -4.0, 1.2, -0.3, 4.2)

# ------------------------------------------------------------------ the live oaks, people
for k, (x, y, r) in enumerate(((-14.0, -10.0, 5.0), (16.0, -10.0, 5.0), (20.0, 14.0, 5.0), (-18.0, 16.0, 5.0))):
    if math.hypot(x, y - FY) * S > 1.25:
        continue
    for j in range(3):
        a = j * 2.1 + k
        tube(f'oakLimb{k}{j}', M['oakBark'], [P(x, y, 0.0), P(x + 0.4 * math.cos(a), y + 0.4 * math.sin(a), 2.0), P(x + 2.6 * math.cos(a), y + 2.6 * math.sin(a), 4.0)], 0.35 * S)
    blob_cloud(f'oakCrown{k}', M['liveOak'], [(P(x + r * 0.55 * math.cos(2 * math.pi * j / 7 + k), y + r * 0.55 * math.sin(2 * math.pi * j / 7 + k), 5.2 + rng.uniform(-0.4, 0.4)).to_tuple(), r * 0.55 * S, 0.6) for j in range(7)]
               + [(P(x, y, 5.8).to_tuple(), r * 0.6 * S, 0.6)])
glazed('doors', DOORS, M['limestoneSmooth'], glass=M['door'], depth=0.3 * S)
glazed('niches', NICHES, M['limestoneSmooth'], glass=M['niche'], depth=0.3 * S)
for k, (x, y, shirt) in enumerate(((-3.0, -6.0, 'red'), (2.0, -8.0, 'blue'), (-7.0, -11.0, 'yellow'), (6.0, -5.0, 'green'), (-10.0, -6.0, 'red'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('alamo')
