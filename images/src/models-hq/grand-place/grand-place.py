# The Grand-Place in Brussels in the high-quality look (hq.py), laid out in metres and seen across the
# square: the Town Hall along the back, its arcade, its rows of pointed windows, its steep slate roof with
# dormers, and its tall Gothic tower, square up to the roof then narrowing in open octagonal stages with
# their pinnacles to the spire and the gilded St Michael on the dragon on top (a scanned statue, CUNO
# jiannibang, CC BY 4.0, in _sources/st-michael/); the guild houses down both sides of the square, tall and narrow,
# their ornate Baroque gables picked out in gold; the square's cobbles, and people.
# Run: blender -b --factory-startup -P grand-place.py -- grand-place-1024.png 1024 grand-place.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1402)
M['brabant'] = material('brabantStone', '#cfc4ad', 0.75, vary='#c0b49c', vary_scale=18, bump=0.15, bump_scale=160)
M['brabantShade'] = material('brabantShade', '#b8ac94', 0.8, vary='#aa9e86', vary_scale=18, bump=0.15, bump_scale=160)
M['slateGP'] = banded(material('grandPlaceSlate', '#4a5157', 0.5, vary='#41484e', vary_scale=14, metallic=0.2), 'Z', 380.0, strength=0.2)
M['cobblesGP'] = masonry('grandPlaceCobbles', '#7e776e', '#5c5650', scale=220, rough=0.85, vary='#746d64')
HOUSE_COLOURS = [material(f'guild{k}', c, 0.75, vary=c, vary_scale=30, bump=0.12, bump_scale=200) for k, c in enumerate(('#d9cfb9', '#bfae8f', '#e2d6bd', '#a99a80', '#d4c09a', '#cbbfa8'))]

S = 0.021               # metres to the tile's units
FY = 24.0 * S           # the Town Hall's front on the tile, before the turn (the square's middle on the tile's)
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, FY + y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


slab('square', M['cobblesGP'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.02)
BEFORE = set(bpy.data.objects)    # everything after this turns and moves with the square's view
WIN = []
PIN = bmesh.new()


def pinnacle(x, y, z, h, r):
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * S, radius2=r * S, depth=h * 0.4 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.2)))
    bmesh.ops.create_cone(PIN, cap_ends=True, segments=8, radius1=r * 1.1 * S, radius2=0.0, depth=h * 0.62 * S, matrix=Matrix.Translation(P(x, y, z + h * 0.4 + h * 0.31 - 0.05)))


# ------------------------------------------------------------------ the Town Hall: its two wings, arcade, windows, roof and dormers
for name, x0, x1 in (('left', -44.0, -5.0), ('right', 5.0, 40.0)):
    block(name + 'Wing', M['brabant'], x0, x1, 0.0, 14.0, -0.3, 19.0)
    gable_roof(name + 'Roof', M['slateGP'], x0 * S, x1 * S, FY + 0.0 * S, FY + 14.0 * S, Z0 + 18.95 * S, 12.0 * S, over=0.002)
    arcade_path(name + 'Arcade', M['brabantShade'], [((x0 + (x1 - x0) * k / int((x1 - x0) / 4.4)) * S, FY - 3.5 * S) for k in range(int((x1 - x0) / 4.4) + 1)], 3.4 * S, Z0 + 3.4 * S, 3.0 * S, 1.6 * S, pointed=1.2)
    for k in range(int((x1 - x0) / 4.4) + 1):
        x = x0 + (x1 - x0) * k / int((x1 - x0) / 4.4)
        cylinder(f'{name}ArcadeColumn{k}', M['brabantShade'], 0.45 * S, 3.85 * S, P(x, -1.8, -0.3), segs=10)
    block(name + 'ArcadeRoof', M['brabantShade'], x0, x1, -3.7, 0.1, 6.35, 7.0)
    for k in range(int((x1 - x0) / 3.3)):
        x = x0 + 1.65 + 3.3 * k
        c = P(x, -0.05, 0)
        for z in (8.5, 13.4):
            WIN.append((c.x, c.y, Z0 + z * S, 1.6 * S, 3.6 * S, (0, -1), 'pointed'))
        pinnacle(x - 1.65, -0.2, 19.0, 3.5, 0.35)
    # two rows of dormers in the steep slate roof (the roof rises 12 m over 7 m)
    for row, (ya, yb, z0, z1, hw, step, off, wz, wh) in enumerate(((1.5, 3.6, 19.0, 24.0, 1.3, 7.0, 3.5, 21.8, 1.8), (4.6, 6.2, 25.0, 29.4, 0.9, 7.0, 7.0, 27.1, 1.5))):
        for k in range(int((x1 - x0 - off + 3.5) / step)):
            x = x0 + off + step * k
            if x > x1 - 2.0:
                break
            block(f'{name}Dormer{row}{k}', M['brabant'], x - hw, x + hw, ya, yb, z0, z1)
            gable_roof(f'{name}DormerRoof{row}{k}', M['slateGP'], (x - hw - 0.3) * S, (x + hw + 0.3) * S, FY + (ya - 0.3) * S, FY + (yb + 0.3) * S, Z0 + (z1 - 0.05) * S, hw * 1.7 * S, over=0.001, along='y')
            c = P(x, ya - 0.05, 0)
            WIN.append((c.x, c.y, Z0 + wz * S, hw * 0.92 * S, wh * S, (0, -1), 'rect'))

# ------------------------------------------------------------------ the tower: square to the roof, then open octagonal stages, the spire and the gilded figure
block('towerBase', M['brabant'], -5.5, 5.5, -2.0, 9.0, -0.3, 36.0)
c = P(0.0, -2.05, 0)
glazed('towerGate', [(c.x, c.y, Z0 - 0.2 * S, 3.4 * S, 7.0 * S, (0, -1), 'pointed')], M['brabantShade'], glass=M['door'], depth=0.4 * S)
for z in (12.0, 19.0, 26.0):
    WIN.append((c.x, c.y, Z0 + z * S, 2.2 * S, 4.8 * S, (0, -1), 'pointed'))
for sx in (-1, 1):
    for sy in (-2.0, 9.0):
        pinnacle(sx * 5.3, sy + (0.2 if sy > 0 else -0.2), 36.0, 6.0, 0.6)
STAGES = ((36.0, 47.0, 5.2), (47.0, 57.0, 4.4), (57.0, 66.0, 3.6))
for k, (z0, z1, r) in enumerate(STAGES):
    ring = [(r * S * math.cos(math.pi / 8 + 2 * math.pi * j / 8), FY + 3.5 * S + r * S * math.sin(math.pi / 8 + 2 * math.pi * j / 8)) for j in range(9)]
    arcade_path(f'stage{k}', M['brabant'], ring, 0.6 * S, Z0 + (z0 + (z1 - z0) * 0.55) * S, (z1 - z0) * 0.45 * S, r * 0.32 * S, inward=True, closed_center=(0.0, FY + 3.5 * S), pointed=1.3)
    for j in range(8):
        x, y = ring[j]
        cylinder(f'stage{k}Pier{j}', M['brabant'], 0.35 * S, (z1 - z0) * 0.56 * S, (x, y, Z0 + z0 * S), segs=8)
        pinnacle(x / S, (y - FY) / S, z1, 4.0 if j % 2 == 0 else 3.0, 0.3)
    lathe(f'stage{k}Core', M['brabantShade'], [(r * 0.72 * S, 0.0), (r * 0.72 * S, (z1 - z0) * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 3.5, z0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    lathe(f'stage{k}Floor', M['brabantShade'], [((r + 0.6) * S, 0.0), ((r + 0.6) * S, 0.7 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 3.5, z0 - 0.35)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('spire', M['brabant'], [(3.0 * S, 0.0), (0.4 * S, 20.0 * S), (0.0, 20.6 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, 3.5, 65.9)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
finish('pinnacles', PIN, M['brabant'], smooth_sides=False)
src = import_model('st-michael', 'stMichaelSource')
stand_sourced(src, cut=0.33, turn=0.0, height=8.0 * S, z=0.0, mat=M['gold'], report=False)
src.matrix_world = Matrix.Translation(P(0.0, 3.5, 86.2))
glazed('townHallWindows', WIN, M['brabantShade'], depth=0.3 * S)


# ------------------------------------------------------------------ the guild houses of the north-west side, their gilded gables to the square
def gable_outline(kind, w, g):
    """A house's gable seen from the square, (across, up) from its eaves: Baroque scrolls, stepped, or a bell."""
    if kind == 'stepped':
        half = [(-w / 2, 0.0), (-w / 2, g * 0.3), (-w * 0.36, g * 0.3), (-w * 0.36, g * 0.55), (-w * 0.22, g * 0.55), (-w * 0.22, g * 0.8), (-w * 0.1, g * 0.8), (-w * 0.1, g)]
    elif kind == 'bell':
        half = [(-w / 2, 0.0), (-w / 2, g * 0.2), (-w * 0.42, g * 0.3), (-w * 0.32, g * 0.45), (-w * 0.3, g * 0.62), (-w * 0.25, g * 0.8), (-w * 0.14, g * 0.94), (0.0, g)]
    else:
        half = [(-w / 2, 0.0), (-w / 2, g * 0.25), (-w * 0.32, g * 0.38), (-w * 0.3, g * 0.6), (-w * 0.18, g * 0.72), (-w * 0.16, g * 0.92), (0.0, g)]
    other = [(-u, v) for u, v in reversed(half) if u < 0]
    return half + other


def guild_house(name, x, y, w, d, h, gable, kind, colour, rich):
    """A tall narrow guild house at (x, y), its front to the square (facing -x), its gable gilded."""
    block(name, HOUSE_COLOURS[colour], x - d / 2, x + d / 2, y - w / 2, y + w / 2, -0.3, h)
    gable_roof(name + 'Roof', M['slateGP'], (x - d / 2) * S, (x + d / 2) * S, FY + (y - w / 2) * S, FY + (y + w / 2) * S, Z0 + (h - 0.05) * S, gable * 0.85 * S, over=0.001)
    pts = gable_outline(kind, w, gable)
    xf = x - d / 2
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(xf + 1.2, y + u, h - 0.05 + v)) for u, v in pts], [bm_.verts.new(P(xf - 0.1, y + u, h - 0.05 + v)) for u, v in pts])
    finish(name + 'Gable', bm_, HOUSE_COLOURS[colour], smooth_sides=False)
    tube(name + 'Gilt', M['gold'], [P(xf - 0.2, y + u, h - 0.05 + v) for u, v in pts[1:-1]], 0.2 * S)
    lathe(name + 'Finial', M['gold'], [(0.0, 0.0), (0.6 * S, 0.6 * S), (0.0, 2.2 * S)], P(xf - 0.1, y, h + gable - 0.1), segs=8, smooth=True)
    bands = (h - 0.6,) + ((4.6, 9.2, 13.8) if rich else ())
    for j, z in enumerate(bands):
        if z + 0.4 < h:
            block(f'{name}Band{j}', M['gold'] if rich or j == 0 else M['brabantShade'], xf - 0.12, xf + 0.05, y - w / 2, y + w / 2, z, z + 0.4, bevel=0)
    across = 3 if w >= 8.5 else 2
    for z in (5.4, 10.0, 14.6):
        if z + 3.2 < h:
            for i in range(across):
                u = (i - (across - 1) / 2) * w / across
                c = P(xf - 0.05, y + u, 0)
                WIN.append((c.x, c.y, Z0 + z * S, w / across * 0.62 * S, 3.0 * S, (-1, 0), 'rect'))
    c = P(xf - 0.05, y, 0)
    WIN.append((c.x, c.y, Z0 + 0.2 * S, w * 0.6 * S, 3.6 * S, (-1, 0), 'round'))
    c = P(xf - 0.15, y, 0)
    WIN.append((c.x, c.y, Z0 + (h + gable * 0.3) * S, 1.3 * S, 2.2 * S, (-1, 0), 'round'))


WIN = []
HOUSES = ((9.0, 'scroll', True), (7.0, 'bell', False), (8.0, 'stepped', False), (9.5, 'scroll', True), (6.5, 'bell', True), (8.0, 'stepped', False), (8.5, 'scroll', True))
y = -8.0
for k, (w, kind, rich) in enumerate(HOUSES):
    guild_house(f'guild{k}', 40.0, y - w / 2, w, 16.0, rng.uniform(15.0, 18.5), rng.uniform(7.5, 9.5), kind, k % len(HOUSE_COLOURS), rich)
    y -= w
glazed('guildWindows', WIN, M['white'], depth=0.25 * S)
# café terraces in front of the guild houses, under their parasols, and people crossing the square
M['parasol'] = material('parasol', '#e9dfc8', 0.8, vary='#ddd2b8', vary_scale=40)
for k, y in enumerate((-12.5, -24.0, -40.0, -55.0)):
    for j, dy in enumerate((-2.6, 2.6)):
        c = P(28.0, y + dy, 0)
        cylinder(f'parasolPole{k}{j}', M['iron'], 0.08 * S, 2.6 * S, (c.x, c.y, Z0), segs=6)
        lathe(f'parasol{k}{j}', M['red'] if k % 2 == 0 else M['parasol'], [(2.2 * S, 0.0), (1.4 * S, 0.45 * S), (0.0, 0.8 * S)], (c.x, c.y, Z0 + 2.3 * S), segs=8)
        cylinder(f'table{k}{j}', M['wood'], 0.7 * S, 0.12 * S, (c.x, c.y, Z0 + 0.8 * S), segs=12)
        cylinder(f'tableLeg{k}{j}', M['iron'], 0.07 * S, 0.8 * S, (c.x, c.y, Z0), segs=6)
WALKERS = ((-12.0, -20.0), (-4.0, -30.0), (6.0, -14.0), (16.0, -36.0), (-20.0, -42.0), (2.0, -50.0), (12.0, -22.0), (-30.0, -16.0), (-26.0, -32.0),
           (-8.0, -58.0), (10.0, -44.0), (20.0, -55.0), (-36.0, -50.0), (24.0, -30.0))
for k, (x, y) in enumerate(WALKERS):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k % 4], z=Z0, scale=0.75)

# seen from the square's south-east corner, as most photos are: the Town Hall at an angle on the left, the guild houses on the right
R = Matrix.Rotation(math.radians(-32.0 + 35.0), 4, 'Z') @ Matrix.Translation((-2.0 * S, 0.0, 0.0))
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('grand-place')
