# The Spasskaya Tower in the high-quality look (hq.py), laid out in metres and turned to face the camera
# from Red Square: the Kremlin's red brick gate tower, its gate arch open through it, white-stone lace on
# its upper tiers with their corner pinnacles, the great clock on every side with its gold rim, numerals
# and hands, the open octagonal belfry, the green tented spire and the glowing ruby star on top; the
# Kremlin wall running off either side with its swallowtail merlons to the little towers at its ends,
# the blue spruces along it; Red Square's cobbles, and people.
# Run: blender -b --factory-startup -P spasskaya-tower.py -- spasskaya-tower-1024.png 1024 spasskaya-tower.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
BEFORE = set(bpy.data.objects)
rng = random.Random(1491)
M['kremlinBrick'] = masonry('kremlinBrick', '#a8392b', '#7f2a20', scale=420, rough=0.8, vary='#9a3428')
M['whiteStoneK'] = material('kremlinWhite', '#f0ece2', 0.6, vary='#e4ded2', vary_scale=20, bump=0.06, bump_scale=200)
M['spireGreen'] = banded(material('kremlinSpire', '#3f7a5b', 0.5, vary='#356b4f', vary_scale=14, metallic=0.2), 'Z', 400.0, strength=0.25)
M['dial'] = material('clockDial', '#1d2a3a', 0.4)
M['ruby'] = material('rubyStar', '#a80d1c', 0.25, emission=('#c8101e', 0.9))
M['cobblesR'] = masonry('redSquareCobbles', '#6d6660', '#4b4642', scale=260, rough=0.85, vary='#625c56')
M['spruceBlue'] = material('blueSpruce', '#3f5e5a', 0.85, vary='#4a6b66', vary_scale=16, bump=0.3, bump_scale=90)

S = 0.0235              # metres to the tile's units
FY = 0.12               # the wall's front on the tile, before the turn
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, FY + y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


slab('redSquare', M['cobblesR'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.02)

# ------------------------------------------------------------------ the tower: the gate stage, the white lace, the clocks, the belfry, the spire and star
TY = 0.0                # the tower's middle stands on the wall's line, its front out in the square
gate = [(-6.6, 22.0), (-6.6, -0.3), (-2.3, -0.3), (-2.3, 5.5)] + [(-2.3 * math.cos(math.pi * k / 10), 5.5 + 2.3 * math.sin(math.pi * k / 10)) for k in range(1, 10)] + [(2.3, 5.5), (2.3, -0.3), (6.6, -0.3), (6.6, 22.0)]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new(P(u, TY - 6.6, z)) for u, z in gate], [bm_.verts.new(P(u, TY + 6.6, z)) for u, z in gate])
finish('gateStage', bm_, M['kremlinBrick'], smooth_sides=False)
PIN = bmesh.new()


def pinnacle(x, y, z, h, r):
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * S, radius2=r * S, depth=h * 0.45 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.225)))
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * 1.15 * S, radius2=0.0, depth=h * 0.6 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.45 + h * 0.3 - 0.05)))


for z0, z1 in ((7.5, 8.2), (14.5, 15.2), (21.6, 22.6)):
    block(f'band{z0}', M['whiteStoneK'], -6.9, 6.9, TY - 6.9, TY + 6.9, z0, z1)
for sx in (-1, 1):
    for sy in (-1, 1):
        block(f'cornerPilaster{sx}{sy}', M['whiteStoneK'], sx * 6.6 - 0.5, sx * 6.6 + 0.5, TY + sy * 6.6 - 0.5, TY + sy * 6.6 + 0.5, -0.3, 22.0)
        pinnacle(sx * 6.4, TY + sy * 6.4, 22.5, 6.0, 0.7)
block('laceStage', M['kremlinBrick'], -5.4, 5.4, TY - 5.4, TY + 5.4, 22.5, 30.5)
ARCADE = []
for nx, ny in ((0, -1), (-1, 0), (1, 0), (0, 1)):
    for u in (-2.8, 0.0, 2.8):
        c = P(nx * 5.45 + (u if ny else 0), TY + ny * 5.45 + (u if nx else 0), 0)
        ARCADE.append((c.x, c.y, Z0 + 23.6 * S, 1.6 * S, 5.2 * S, (nx, ny), 'pointed'))
glazed('laceArcade', ARCADE, M['whiteStoneK'], glass=M['kremlinBrick'], depth=0.4 * S)
block('laceTop', M['whiteStoneK'], -5.8, 5.8, TY - 5.8, TY + 5.8, 30.4, 31.2)
# the clock stage and its four clocks
block('clockStage', M['kremlinBrick'], -5.0, 5.0, TY - 5.0, TY + 5.0, 31.1, 44.0)
for sx in (-1, 1):
    for sy in (-1, 1):
        block(f'clockCorner{sx}{sy}', M['whiteStoneK'], sx * 5.0 - 0.45, sx * 5.0 + 0.45, TY + sy * 5.0 - 0.45, TY + sy * 5.0 + 0.45, 31.1, 44.0)
        pinnacle(sx * 4.9, TY + sy * 4.9, 44.0, 5.0, 0.55)
MARKS = bmesh.new()
for k, (nx, ny) in enumerate(((0, -1), (-1, 0), (1, 0), (0, 1))):
    n = Vector((nx, ny, 0))
    c = P(nx * 5.05, TY + ny * 5.05, 37.5)
    turn = Vector((0, 0, 1)).rotation_difference(n).to_matrix().to_4x4()
    cylinder(f'dial{k}', M['dial'], 3.1 * S, 0.25 * S, (0, 0, 0), segs=40, matrix=Matrix.Translation(c) @ turn)
    annulus(f'dialRim{k}', M['gold'], 3.4 * S, 3.0 * S, 0.0, 0.4 * S, segs=40, matrix=Matrix.Translation(c) @ turn)
    side = Vector((-ny, nx, 0))
    for j in range(12):
        a = 2 * math.pi * j / 12
        p = c + n * 0.3 * S + (side * math.cos(a) + Vector((0, 0, 1)) * math.sin(a)) * 2.55 * S
        bmesh.ops.create_cube(MARKS, size=1.0, matrix=Matrix.Translation(p) @ Matrix.Diagonal((0.45 * S, 0.45 * S, 0.45 * S, 1)))
    for length, ang, w in ((2.2, 1.1, 0.28), (1.5, 2.6, 0.36)):
        tip = c + n * 0.35 * S + (side * math.cos(ang) + Vector((0, 0, 1)) * math.sin(ang)) * length * S
        bar(f'hand{k}{length}', M['gold'], c + n * 0.35 * S, tip, w * S)
finish('clockMarks', MARKS, M['gold'], smooth_sides=False)
# the open octagonal belfry, the tented spire, the star
lathe('belfryBase', M['whiteStoneK'], [(5.2 * S, 0.0), (5.2 * S, 0.8 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, TY, 43.95)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
ring = [((4.6 * S) * math.cos(math.pi / 8 + 2 * math.pi * k / 8), FY + TY * S + (4.6 * S) * math.sin(math.pi / 8 + 2 * math.pi * k / 8)) for k in range(9)]
arcade_path('belfryArches', M['whiteStoneK'], ring, 0.7 * S, Z0 + 47.5 * S, 4.0 * S, 1.3 * S, inward=True, closed_center=(0.0, FY + TY * S), pointed=0.8)
for k in range(8):
    x, y = ring[k]
    cylinder(f'belfryPier{k}', M['whiteStoneK'], 0.45 * S, 3.0 * S, (x, y, Z0 + 44.7 * S), segs=8)
lathe('belfryBell', M['bronze'], [(1.6 * S, 0.0), (1.2 * S, 1.4 * S), (0.0, 2.0 * S)], P(0.0, TY, 45.2), segs=16, smooth=True)
lathe('spire', M['spireGreen'], [(r * S, z * S) for r, z in ((5.6, 0.0), (4.8, 1.0), (0.7, 14.0), (0.5, 14.6))], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, TY, 51.4)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
cylinder('starStem', M['gold'], 0.25 * S, 2.6 * S, P(0.0, TY, 65.8), segs=8)
STAR = bmesh.new()
pts = [(math.cos(math.pi / 2 + math.pi * k / 5) * (1.9 if k % 2 == 0 else 0.8), math.sin(math.pi / 2 + math.pi * k / 5) * (1.9 if k % 2 == 0 else 0.8)) for k in range(10)]
star_m = Matrix.Translation(P(0.0, TY, 70.0)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
add_prism(STAR, [STAR.verts.new(star_m @ Vector((u * S, v * S, 0.35 * S))) for u, v in pts], [STAR.verts.new(star_m @ Vector((u * S, v * S, -0.35 * S))) for u, v in pts])
finish('rubyStar', STAR, M['ruby'], smooth_sides=False)

# ------------------------------------------------------------------ the Kremlin wall either side, its swallowtail merlons, the little end towers
WALL_END = 42.0
MERLON = bmesh.new()
fork = [(-1.0, 0.0), (1.0, 0.0), (1.0, 2.4), (0.55, 2.4), (0.0, 1.5), (-0.55, 2.4), (-1.0, 2.4)]
for sx in (-1, 1):
    x0, x1 = sorted((sx * 6.0, sx * WALL_END))
    block(f'wall{sx}', M['kremlinBrick'], x0, x1, 4.0, 10.0, -0.3, 12.0)
    x = x0 + 1.6
    while x < x1 - 1.0:
        for y0 in (4.0, 9.3):
            add_prism(MERLON, [MERLON.verts.new(P(x + u, y0, 11.95 + v)) for u, v in fork], [MERLON.verts.new(P(x + u, y0 + 0.7, 11.95 + v)) for u, v in fork])
        x += 3.2
    tx = sx * (WALL_END + 3.0)
    block(f'endTower{sx}', M['kremlinBrick'], tx - 4.0, tx + 4.0, 3.0, 11.0, -0.3, 17.0)
    lathe(f'endTowerRoof{sx}', M['spireGreen'], [(5.4 * S, 0.0), (0.0, 9.0 * S)], (0, 0, 0), segs=4, matrix=Matrix.Translation(P(tx, 7.0, 16.95)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
finish('merlons', MERLON, M['kremlinBrick'], smooth_sides=False)
spruces = []
for sx in (-1, 1):
    for k in range(5):
        x = sx * (11.0 + 6.5 * k)
        spruces.append(((x * S, FY + 1.6 * S, Z0 + 5.4 * S), 1.5 * S, 3.6))
blob_cloud('spruces', M['spruceBlue'], spruces, subdivisions=2)
for k, (x, y, shirt) in enumerate(((-14.0, -14.0, 'red'), (-5.0, -20.0, 'blue'), (8.0, -16.0, 'yellow'), (18.0, -22.0, 'green'), (-22.0, -24.0, 'red'), (2.0, -28.0, 'blue'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('spasskaya-tower')
