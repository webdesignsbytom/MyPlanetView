# Independence Hall in the high-quality look (hq.py), laid out in metres and seen from Independence Mall:
# Philadelphia's red-brick State House, its white cornice, window frames and keystones, its two rows of
# tall windows and its doorway, the roof's balustrade and end chimneys; the tower rising behind with its
# clock faces, the white wooden belfry, the octagonal stages and the spire; the arcaded links to the
# two smaller wings with their cupolas; the Liberty Bell on its stand on the lawn, the brick paths, the
# shade trees, and people.
# Run: blender -b --factory-startup -P independence-hall.py -- independence-hall-1024.png 1024 independence-hall.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='lawn')
rng = random.Random(1776)
M['brickPH'] = masonry('flemishBond', '#8f3f2c', '#dccbb6', scale=460, rough=0.85, vary='#823826')
M['trim'] = material('whiteTrim', '#f2efe8', 0.6)
M['slatePH'] = banded(material('statehouseSlate', '#4a4d52', 0.55, vary='#42454a', vary_scale=14, metallic=0.15), 'Z', 380.0, strength=0.2)
M['bellBronze'] = material('libertyBell', '#5c4a34', 0.4, vary='#6a5640', vary_scale=40, metallic=0.85)
M['crack'] = material('bellCrack', '#1d1712', 0.8)
M['mallBrick'] = masonry('mallBrick', '#a9664c', '#d0b9a4', scale=300, rough=0.85, vary='#9c5c44')
M['shadeTree'] = material('shadeTree', '#4f7f37', 0.85, vary='#5c8c42', vary_scale=14, bump=0.3, bump_scale=90)
M['clockFace'] = material('clockFace', '#f6f3ea', 0.4)

S = 0.025               # metres to the tile's units
Z0 = G + 0.004
FY = 8.0                # the plan's middle on the tile's


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def T(x, y):
    return (x * S, (y - FY) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
slab('walk', M['mallBrick'], [T(-52, -4), T(52, -4), T(52, -0.2), T(-52, -0.2)], Z0 - 0.002, Z0 + 0.06 * S, margin=0.03)
slab('path', M['mallBrick'], [T(-3, -80), T(3, -80), T(3, -4), T(-3, -4)], Z0 - 0.002, Z0 + 0.06 * S, margin=0.03)
WIN, DOORS = [], []


def georgian(name, x0, x1, y0, y1, h, roof, windows_per_floor, floors, cupola=False):
    """A Georgian block: red brick, white cornice and string course, its windows with white frames and
    keystones, a slate roof, end chimneys; a cupola on the smaller wings."""
    block(name, M['brickPH'], x0, x1, y0, y1, -0.3, h)
    block(name + 'Cornice', M['trim'], x0 - 0.35, x1 + 0.35, y0 - 0.35, y1 + 0.35, h - 0.6, h, bevel=0)
    block(name + 'String', M['trim'], x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, h / floors - 0.3, h / floors, bevel=0)
    gable_roof(name + 'Roof', M['slatePH'], (x0 - 0.35) * S, (x1 + 0.35) * S, (y0 - 0.35 - FY) * S, (y1 + 0.35 - FY) * S, Z0 + (h - 0.05) * S, roof * S, over=0.0)
    for x in (x0 + 1.2, x1 - 1.2):
        block(f'{name}Chimney{x:.0f}', M['brickPH'], x - 0.9, x + 0.9, (y0 + y1) / 2 - 1.4, (y0 + y1) / 2 + 1.4, h, h + roof + 1.4)
    for k in range(windows_per_floor):
        x = x0 + (x1 - x0) * (k + 0.5) / windows_per_floor
        for f in range(floors):
            z = 1.4 + f * h / floors
            c = P(x, y0 - 0.05, 0)
            WIN.append((c.x, c.y, Z0 + z * S, 1.3 * S, 2.6 * S, (0, -1), 'rect'))
            block(f'{name}Key{k}{f}', M['trim'], x - 0.25, x + 0.25, y0 - 0.2, y0, z + 2.7, z + 3.2, bevel=0)
    if cupola:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        lathe(name + 'Cupola', M['trim'], [(1.5 * S, 0.0), (1.5 * S, 2.2 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(cx, cy, h + roof - 0.6)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
        lathe(name + 'CupolaRoof', M['trim'], [(1.8 * S, 0.0), (1.2 * S, 0.8 * S), (0.0, 1.8 * S)], P(cx, cy, h + roof + 1.6), segs=16, smooth=True)


# ------------------------------------------------------------------ the State House, its doorway and the balustrade on its roof
georgian('stateHouse', -16.0, 16.0, 0.0, 14.0, 12.0, 6.0, 9, 2)
block('roofBalustradeBase', M['trim'], -10.0, 10.0, 6.6, 7.4, 17.4, 17.8, bevel=0)
for k in range(41):
    x = -10.0 + 20.0 * k / 40
    cylinder(f'baluster{k}', M['trim'], 0.07 * S, 0.8 * S, P(x, 7.0, 17.8), segs=6)
block('roofBalustradeRail', M['trim'], -10.0, 10.0, 6.7, 7.3, 18.6, 18.8, bevel=0)
block('doorFrame', M['trim'], -1.8, 1.8, -0.4, 0.0, -0.3, 4.6)
c = P(0.0, -0.45, 0)
DOORS.append((c.x, c.y, Z0 - 0.1 * S, 2.0 * S, 3.6 * S, (0, -1), 'round'))
block('doorPediment', M['trim'], -2.2, 2.2, -0.6, 0.0, 4.6, 5.2, bevel=0)

# ------------------------------------------------------------------ the tower behind: brick, clock faces, the white belfry, octagonal stages and spire
block('towerBase', M['brickPH'], -5.0, 5.0, 14.0, 24.0, -0.3, 21.0)
block('towerCornice', M['trim'], -5.4, 5.4, 13.6, 24.4, 20.4, 21.2, bevel=0)
for nx, ny in ((0, -1), (-1, 0), (1, 0)):
    lathe(f'clock{nx}{ny}', M['clockFace'], [(0.0, 0.0), (1.6 * S, 0.0), (1.6 * S, 0.15 * S), (0.0, 0.15 * S)], (0, 0, 0), segs=24,
          matrix=Matrix.Translation(P(nx * 5.02, 19.0 + ny * 5.02, 17.6)) @ Matrix.Rotation(math.atan2(ny, nx), 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    tube(f'clockHands{nx}{ny}', M['crack'], [P(nx * 5.2, 19.0 + ny * 5.2, 17.6 + 1.1), P(nx * 5.2, 19.0 + ny * 5.2, 17.6), P(nx * 5.2 + (0.8 if ny else 0.0), 19.0 + ny * 5.2 + (0.8 if nx else 0.0), 17.6 + 0.2)], 0.07 * S)
    c = P(nx * 5.05, 19.0 + ny * 5.05, 0)
    WIN.append((c.x, c.y, Z0 + 10.0 * S, 1.6 * S, 3.6 * S, (nx, ny), 'round'))
block('belfry', M['trim'], -4.2, 4.2, 14.8, 23.2, 21.2, 28.0)
for nx, ny in ((0, -1), (-1, 0), (1, 0)):
    c = P(nx * 4.25, 19.0 + ny * 4.25, 0)
    WIN.append((c.x, c.y, Z0 + 22.2 * S, 2.2 * S, 4.8 * S, (nx, ny), 'round'))
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'urn{sx}{sy}', M['trim'], [(0.2 * S, 0.0), (0.5 * S, 0.4 * S), (0.3 * S, 1.0 * S), (0.0, 1.2 * S)], P(sx * 3.9, 19.0 + sy * 3.9, 28.0), segs=10, smooth=True)
lathe('octagon1', M['trim'], [(3.6 * S, 0.0), (3.6 * S, 5.0 * S), (3.9 * S, 5.0 * S), (3.9 * S, 5.5 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 19.0, 28.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('octagon2', M['trim'], [(2.6 * S, 0.0), (2.6 * S, 4.0 * S), (2.9 * S, 4.0 * S), (2.9 * S, 4.4 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 19.0, 33.5)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for k in range(8):
    a = 2 * math.pi * k / 8
    c = P(3.35 * math.cos(a), 19.0 + 3.35 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + 29.0 * S, 1.2 * S, 3.0 * S, (math.cos(a), math.sin(a)), 'round'))
lathe('spire', M['trim'], [(2.4 * S, 0.0), (1.4 * S, 2.2 * S), (0.6 * S, 4.0 * S), (0.4 * S, 9.0 * S), (0.0, 12.0 * S)], P(0.0, 19.0, 37.9), segs=8)
lathe('spireBall', M['gold'], [(0.0, 0.0), (0.35 * S, 0.3 * S), (0.0, 0.7 * S)], P(0.0, 19.0, 49.8), segs=8, smooth=True)

# ------------------------------------------------------------------ the arcaded links and the two wings
for side in (-1, 1):
    xa, xb = sorted((side * 16.0, side * 30.0))
    block(f'link{side}', M['brickPH'], xa, xb, 4.0, 10.0, -0.3, 5.5)
    bays = [xa + (xb - xa) * k / 5 for k in range(6)]
    arcade_path(f'linkArcade{side}', M['trim'], [(x * S, (1.6 - FY) * S) for x in bays], 2.4 * S, Z0 + 2.8 * S, 2.7 * S, 1.0 * S, normal_side=1)
    for k, x in enumerate(bays):
        block(f'linkPier{side}{k}', M['trim'], x - 0.4, x + 0.4, 1.6, 4.0, -0.3, 2.9, bevel=0)
    gable_roof(f'linkRoof{side}', M['slatePH'], (xa - 0.2) * S, (xb + 0.2) * S, (1.2 - FY) * S, (10.4 - FY) * S, Z0 + 5.45 * S, 2.0 * S, over=0.0)
    xa2, xb2 = sorted((side * 30.0, side * 44.0))
    georgian(f'wing{side}', xa2, xb2, 0.0, 14.0, 11.0, 5.0, 4, 2, cupola=True)

# ------------------------------------------------------------------ the Liberty Bell on its stand, the shade trees, people
BX, BY = 0.0, -22.0
for sx in (-1, 1):
    block(f'bellPost{sx}', M['wood'], BX + sx * 1.6 - 0.2, BX + sx * 1.6 + 0.2, BY - 0.2, BY + 0.2, -0.3, 3.6, bevel=0)
block('bellYoke', M['wood'], BX - 1.9, BX + 1.9, BY - 0.35, BY + 0.35, 3.4, 4.0, bevel=0)
lathe('libertyBell', M['bellBronze'], [(1.1 * S, 0.0), (1.05 * S, 0.12 * S), (0.75 * S, 0.5 * S), (0.62 * S, 1.2 * S), (0.55 * S, 1.6 * S), (0.3 * S, 1.75 * S), (0.0, 1.78 * S)], P(BX, BY, 1.6), segs=32, smooth=True)
tube('bellCrack', M['crack'], [P(BX + 0.1, BY - 1.06, 1.65), P(BX + 0.02, BY - 0.85, 2.1), P(BX + 0.08, BY - 0.7, 2.6), P(BX - 0.02, BY - 0.64, 2.95)], 0.05 * S)
CROWNS = []
for k, (x, y) in enumerate(((-36.0, -20.0), (-24.0, -34.0), (24.0, -34.0), (36.0, -20.0), (-44.0, -40.0), (44.0, -40.0), (-14.0, -46.0), (14.0, -46.0))):
    if math.hypot(x, y - FY) * S > 1.3:
        continue
    cylinder(f'trunk{k}', M['trunk'], 0.35 * S, 4.0 * S, P(x, y, 0.0), segs=8)
    CROWNS.append((P(x, y, 7.5).to_tuple(), 4.2 * S, 0.95))
blob_cloud('shadeTrees', M['shadeTree'], CROWNS)
glazed('windows', WIN, M['trim'], depth=0.25 * S)
glazed('doors', DOORS, M['trim'], glass=M['door'], depth=0.25 * S)
for k, (x, y, shirt) in enumerate(((-2.5, -19.0, 'red'), (2.6, -20.0, 'blue'), (1.0, -10.0, 'yellow'), (-8.0, -3.0, 'green'), (10.0, -2.5, 'red'), (-1.4, -30.0, 'blue'))):
    c = P(x, y, 0.06)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.75)

R = Matrix.Rotation(math.radians(-32.0 + 16.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('independence-hall')
