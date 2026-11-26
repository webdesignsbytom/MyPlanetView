# The Angel of Independence in the high-quality look (hq.py), laid out in metres on its roundabout on
# Paseo de la Reforma: the round steps; the square pedestal with its bronze allegories seated on the
# corners and the marble group of the heroes before its front; the tall column with its bronze rings and
# gilded capital; and on top the gilded winged Victory; round it, the roundabout's lawn and flower beds,
# and people.
# Sourced stand-ins (the real sculptures have no open scan): the Victory, the St Michael scan (_sources/
# st-michael/); the four allegories, the Madonnina scan (_sources/madonnina/); the heroes, the St Cyril
# and St John of Nepomuk scans (_sources/st-cyril/, _sources/nepomuk/).
# Run: blender -b --factory-startup -P angel-of-independence.py -- angel-of-independence-1024.png 1024 angel-of-independence.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1910)
M['quarry'] = material('angelQuarry', '#dcd5c6', 0.7, vary='#d1c9b8', vary_scale=40, bump=0.08, bump_scale=200)
M['quarryDark'] = material('angelQuarryDark', '#c4bcab', 0.75, vary='#bab1a0', vary_scale=40)
M['marbleA'] = material('angelMarble', '#f1ede4', 0.5, vary='#e8e3d8', vary_scale=30)
M['bronzeA'] = material('angelBronze', '#5a7f6c', 0.45, vary='#6a917c', vary_scale=40, metallic=0.5)
M['plaza'] = masonry('angelPlaza', '#cfc6b5', '#b2a995', scale=120, rough=0.8, vary='#c6bdab')
M['lawnA'] = material('reformaLawn', '#6f9f45', 0.85, vary='#7cab50', vary_scale=12, bump=0.3, bump_scale=200)
M['flowersR'] = material('flowersRed', '#c8323a', 0.8, vary='#e0504a', vary_scale=60, bump=0.4, bump_scale=300)
M['flowersY'] = material('flowersYellow', '#e8b62e', 0.8, vary='#f2c94a', vary_scale=60, bump=0.4, bump_scale=300)

S = 2.9 / 50.5          # metres to the tile's units: the Victory's head about 2.9 units up
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def figure(folder, cut, height, mat):
    """A sourced statue as reusable mesh data: cut from its base, scaled, standing at 0."""
    src = import_model(folder, folder + 'Source')
    if src is None:
        return None
    stand_sourced(src, cut=cut, turn=0.0, height=height * S, z=0.0, mat=mat, report=False)
    src.data.polygons.foreach_set('use_smooth', [True] * len(src.data.polygons))
    data = src.data
    bpy.data.objects.remove(src, do_unlink=True)
    return data


def place(name, data, x, y, z, turn, scale=1.0):
    if data is None:
        return
    ob = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(P(x, y, z)) @ Matrix.Rotation(math.radians(turn), 4, 'Z') @ Matrix.Scale(scale, 4)


BEFORE = set(bpy.data.objects)
# ------------------------------------------------------------------ the roundabout: paving, the lawn and flower beds round it
annulus('lawnRing', M['lawnA'], 1.47, 18.5 * S, Z0, Z0 + 0.15 * S, segs=128)
annulus('bedRed', M['flowersR'], 20.6 * S, 19.2 * S, Z0 + 0.15 * S, Z0 + 0.55 * S, segs=128)
annulus('bedYellow', M['flowersY'], 21.8 * S, 20.6 * S, Z0 + 0.15 * S, Z0 + 0.45 * S, segs=128)

# ------------------------------------------------------------------ the round steps, the square pedestal, its corner seats and allegories
for k, r in enumerate((14.0, 12.9, 11.8)):
    cylinder(f'step{k}', M['quarryDark'] if k % 2 else M['quarry'], r * S, (0.45 * (k + 1)) * S, P(0, 0, 0), segs=96)
TOP = 1.35
block('podium', M['quarry'], -7.0, 7.0, -7.0, 7.0, TOP, TOP + 3.0)
block('podiumCornice', M['quarryDark'], -7.3, 7.3, -7.3, 7.3, TOP + 3.0, TOP + 3.5, bevel=0)
CORNER = 7.6
for sx in (-1, 1):
    for sy in (-1, 1):
        block(f'seat{sx}{sy}', M['quarry'], sx * CORNER - 2.2, sx * CORNER + 2.2, sy * CORNER - 2.2, sy * CORNER + 2.2, TOP, TOP + 2.4)
        block(f'seatCap{sx}{sy}', M['quarryDark'], sx * CORNER - 2.4, sx * CORNER + 2.4, sy * CORNER - 2.4, sy * CORNER + 2.4, TOP + 2.4, TOP + 2.8, bevel=0)
UP0 = TOP + 3.5
block('pedestal', M['quarry'], -5.0, 5.0, -5.0, 5.0, UP0, UP0 + 7.5)
block('pedestalBase', M['quarryDark'], -5.4, 5.4, -5.4, 5.4, UP0, UP0 + 0.8, bevel=0)
block('pedestalCornice', M['quarryDark'], -5.6, 5.6, -5.6, 5.6, UP0 + 7.5, UP0 + 8.3, bevel=0)
for s in (-1, 1):
    block(f'panelFB{s}', M['marbleA'], -3.4, 3.4, s * 5.0 - 0.15, s * 5.0 + 0.15, UP0 + 2.4, UP0 + 6.2, bevel=0)
    block(f'panelLR{s}', M['marbleA'], s * 5.0 - 0.15, s * 5.0 + 0.15, -3.4, 3.4, UP0 + 2.4, UP0 + 6.2, bevel=0)
# the front's platform for the heroes
block('heroesStage', M['quarry'], -4.6, 4.6, -9.6, -5.0, TOP + 3.5, TOP + 4.1)
allegory = figure('madonnina', 0.34, 4.8, M['bronzeA'])
for sx in (-1, 1):
    for sy in (-1, 1):
        place(f'allegory{sx}{sy}', allegory, sx * CORNER, sy * CORNER, TOP + 2.8, math.degrees(math.atan2(sy, sx)) + 90.0)
hero = figure('st-cyril', 0.2, 3.6, M['marbleA'])
companion = figure('nepomuk', 0.2, 3.0, M['marbleA'])
place('hidalgo', hero, 0.0, -7.6, TOP + 4.1, 0.0)
for k, x in enumerate((-2.8, 2.8)):
    place(f'hero{k}', companion, x, -7.9, TOP + 4.1, 0.0)
for k, x in enumerate((-3.9, 3.9)):
    place(f'heroBack{k}', companion, x, -6.0, TOP + 4.1, 0.0, scale=0.9)

# ------------------------------------------------------------------ the column: its base, shaft and rings, the gilded capital, the Victory
C0 = UP0 + 8.3
lathe('columnBase', M['quarry'], [(3.4 * S, 0.0), (3.4 * S, 0.8 * S), (3.0 * S, 1.0 * S), (2.7 * S, 1.6 * S), (2.4 * S, 2.0 * S), (2.4 * S, 2.6 * S)], P(0, 0, C0), segs=48)
C1 = C0 + 2.6
SH = 23.0
lathe('shaft', M['quarry'], [(2.15 * S, 0.0), (2.1 * S, SH * 0.3 * S), (1.95 * S, SH * 0.7 * S), (1.8 * S, SH * S)], P(0, 0, C1), segs=48, smooth=True)
for k, f in enumerate((0.08, 0.35, 0.62, 0.9)):
    r = 2.15 - 0.35 * f + 0.06
    lathe(f'ring{k}', M['gold'], [(r * S, 0.0), ((r + 0.15) * S, 0.3 * S), ((r + 0.15) * S, 0.9 * S), (r * S, 1.2 * S)], P(0, 0, C1 + f * SH - 0.6), segs=48, smooth=True)
for k in range(16):
    a = 2 * math.pi * k / 16
    pts = [P(1.95 * math.cos(a) * (1.0 - 0.08 * t), 1.95 * math.sin(a) * (1.0 - 0.08 * t), C1 + 2.0 + t * (SH - 4.0)) for t in (0.0, 0.5, 1.0)]
    tube(f'flute{k}', M['quarryDark'], pts, 0.12 * S)
C2 = C1 + SH
lathe('capital', M['gold'], [(1.8 * S, 0.0), (2.0 * S, 0.6 * S), (2.5 * S, 1.6 * S), (3.0 * S, 2.4 * S), (3.0 * S, 2.8 * S)], P(0, 0, C2), segs=48, smooth=True)
block('abacus', M['quarryDark'], -3.1, 3.1, -3.1, 3.1, C2 + 2.8, C2 + 3.4, bevel=0)
lathe('drum', M['quarry'], [(2.0 * S, 0.0), (2.0 * S, 1.4 * S), (2.3 * S, 1.6 * S), (2.3 * S, 1.9 * S)], P(0, 0, C2 + 3.4), segs=48)
lathe('drumGarland', M['gold'], [(2.08 * S, 0.0), (2.18 * S, 0.3 * S), (2.08 * S, 0.6 * S)], P(0, 0, C2 + 3.8), segs=48, smooth=True)
victory = figure('st-michael', 0.33, 8.4, M['gold'])
place('victory', victory, 0.0, 0.0, C2 + 5.3, -90.0)

# ------------------------------------------------------------------ people
for k, (x, y, shirt) in enumerate(((-3.0, -15.5, 'red'), (2.6, -16.0, 'blue'), (9.0, -13.0, 'yellow'), (-10.0, -12.5, 'green'), (13.0, 7.0, 'red'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 8.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('angel-of-independence')
