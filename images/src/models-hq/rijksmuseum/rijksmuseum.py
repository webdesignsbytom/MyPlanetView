# The Rijksmuseum in the high-quality look (hq.py), laid out in metres and seen from the Museumplein:
# Cuypers' great red-brick museum with its bands of pale stone, its two tall towers and their slate
# spires either side of the central block and the arched passage cyclists ride through, the long wings
# with their rows of tall arched windows and steep slate roofs with dormers, the corner pavilions under
# their high pyramid roofs; the Museumplein in front, its long mirror pond on the axis and its lawns,
# rows of trees, bicycles parked by the passage, and people.
# Run: blender -b --factory-startup -P rijksmuseum.py -- rijksmuseum-1024.png 1024 rijksmuseum.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='gravel')
rng = random.Random(1885)
M['brickR'] = masonry('rijksBrick', '#9a4b32', '#7a3a26', scale=260, rough=0.85, vary='#8c432c')
M['slateR'] = banded(material('rijksSlate', '#4b5560', 0.5, vary='#434c57', vary_scale=14, metallic=0.15), 'Z', 300.0, strength=0.2)
M['pond'] = material('mirrorPond', '#5f8ea3', 0.06, vary='#6c9ab0', vary_scale=6, bump=0.03, bump_scale=30)
M['plane'] = material('planeTree', '#5a8a3a', 0.85, vary='#679944', vary_scale=14, bump=0.3, bump_scale=90)
M['louvre'] = material('louvre', '#3c4650', 0.6)

S = 0.019               # metres to the tile's units
FY = 0.33               # the wings' front on the tile, before the turn
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, FY + y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def wires(name, mat, lines, radius):
    """Many thin round rods as one curve: bicycles."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 1
    for pts in lines:
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        for i, q in enumerate(pts):
            sp.points[i].co = (*q, 1)
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    return ob


BEFORE = set(bpy.data.objects)
WIN, LOUVRES = [], []


def bands(name, x0, x1, y0, y1, levels):
    """Pale stone bands round a brick block, a little proud of its walls."""
    for k, (z, t) in enumerate(levels):
        block(f'{name}Band{k}', M['whiteStone'], x0 - 0.15, x1 + 0.15, y0 - 0.15, y1 + 0.15, z, z + t, bevel=0)


def front_windows(x0, x1, y, rows, step=4.2):
    n = int((x1 - x0) / step)
    for k in range(n):
        x = x0 + (x1 - x0) * (k + 0.5) / n
        c = P(x, y - 0.05, 0)
        for z, w, h, shape in rows:
            WIN.append((c.x, c.y, Z0 + z * S, w * S, h * S, (0, -1), shape))


# ------------------------------------------------------------------ the wings, their windows, bands, roofs and dormers
for side in (-1, 1):
    xa, xb = sorted((side * 18.5, side * 52.0))
    block(f'wing{side}', M['brickR'], xa, xb, 0.0, 16.0, -0.3, 21.0)
    bands(f'wing{side}', xa, xb, 0.0, 16.0, ((1.4, 0.5), (7.6, 0.4), (18.4, 0.4), (20.6, 0.7)))
    gable_roof(f'wingRoof{side}', M['slateR'], xa * S, xb * S, FY + 0.0 * S, FY + 16.0 * S, Z0 + 21.25 * S, 10.5 * S, over=0.004)
    front_windows(xa, xb, -0.15, ((2.6, 1.6, 4.0, 'round'), (9.2, 1.9, 7.6, 'round')))
    for k in range(int((xb - xa) / 6.6)):
        x = xa + 3.3 + 6.6 * k
        block(f'dormer{side}{k}', M['brickR'], x - 1.0, x + 1.0, 2.0, 4.0, 21.0, 26.6)
        gable_roof(f'dormerRoof{side}{k}', M['slateR'], (x - 1.3) * S, (x + 1.3) * S, FY + 1.7 * S, FY + 4.3 * S, Z0 + 26.55 * S, 1.8 * S, over=0.001, along='y')
        c = P(x, 1.95, 0)
        WIN.append((c.x, c.y, Z0 + 24.3 * S, 1.0 * S, 1.6 * S, (0, -1), 'round'))

# ------------------------------------------------------------------ the corner pavilions under their high pyramid roofs
for side in (-1, 1):
    xa, xb = sorted((side * 52.0, side * 66.0))
    block(f'pavilion{side}', M['brickR'], xa, xb, -3.0, 13.0, -0.3, 24.0)
    bands(f'pavilion{side}', xa, xb, -3.0, 13.0, ((1.4, 0.5), (7.6, 0.4), (18.4, 0.4), (23.4, 0.8)))
    hip_roof(f'pavilionRoof{side}', M['slateR'], (xa + xb) / 2 * S, FY + 5.0 * S, Z0 + 24.15 * S, 14.6 * S, 16.6 * S, 14.0 * S, over=0.0)
    lathe(f'pavilionFinial{side}', M['gold'], [(0.0, 0.0), (0.35 * S, 0.6 * S), (0.0, 3.0 * S)], P((xa + xb) / 2, 5.0, 37.9), segs=8, smooth=True)
    front_windows(xa + 1.0, xb - 1.0, -3.15, ((2.6, 1.6, 4.0, 'round'), (9.2, 1.9, 7.6, 'round'), (19.4, 1.4, 3.0, 'round')), step=4.0)

# ------------------------------------------------------------------ the central block and its passage
CY0, CY1 = -2.0, 18.0
for side in (-1, 1):
    xa, xb = sorted((side * 4.4, side * 9.5))
    block(f'passagePier{side}', M['brickR'], xa, xb, CY0, CY1, -0.3, 5.5)
arcade_path('passageArch', M['brickR'], [(-9.5 * S, FY + CY0 * S), (9.5 * S, FY + CY0 * S)], (CY1 - CY0) * S, Z0 + 5.5 * S, 20.5 * S, 4.4 * S)
arcade_path('passageRing', M['whiteStone'], [(-5.4 * S, FY + (CY0 - 0.25) * S), (5.4 * S, FY + (CY0 - 0.25) * S)], 0.3 * S, Z0 + 5.5 * S, 5.5 * S, 4.4 * S)
block('passageFloor', M['pavingDark'], -4.4, 4.4, CY0, CY1, -0.3, 0.02, bevel=0)
bands('central', -9.5, 9.5, CY0, CY1, ((18.4, 0.4), (25.5, 0.6)))
gable_roof('centralRoof', M['slateR'], -9.5 * S, 9.5 * S, FY + CY0 * S, FY + CY1 * S, Z0 + 26.05 * S, 12.0 * S, over=0.001, along='y')
# its front gable, stepped, with stone copings and a round window
steps = [(-9.5, 0.0), (-9.5, 3.0), (-7.6, 3.0), (-7.6, 6.0), (-5.2, 6.0), (-5.2, 8.8), (-2.8, 8.8), (-2.8, 11.6), (-1.2, 11.6), (-1.2, 13.6)]
outline = steps + [(-u, v) for u, v in reversed(steps)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(u, CY0 - 0.2, 26.0 + v)) for u, v in outline], [bm.verts.new(P(u, CY0 + 1.4, 26.0 + v)) for u, v in outline])
finish('centralGable', bm, M['brickR'], smooth_sides=False)
tube('centralGableCoping', M['whiteStone'], [P(u, CY0 - 0.3, 26.0 + v + 0.1) for u, v in outline[1:-1]], 0.25 * S)
for x in (-5.0, 0.0, 5.0):
    c = P(x, CY0 - 0.05, 0)
    WIN.append((c.x, c.y, Z0 + 11.8 * S, 2.4 * S, 6.2 * S, (0, -1), 'round'))
c = P(0.0, CY0 - 0.25, 0)
WIN.append((c.x, c.y, Z0 + 28.0 * S, 3.4 * S, 4.4 * S, (0, -1), 'round'))
WIN.append((c.x, c.y, Z0 + 19.4 * S, 6.0 * S, 4.6 * S, (0, -1), 'round'))

# ------------------------------------------------------------------ the two towers and their spires
for side in (-1, 1):
    tx = side * 14.0
    block(f'tower{side}', M['brickR'], tx - 4.5, tx + 4.5, CY0 - 1.0, CY0 + 8.0, -0.3, 40.0)
    bands(f'tower{side}', tx - 4.5, tx + 4.5, CY0 - 1.0, CY0 + 8.0, ((1.4, 0.5), (7.6, 0.4), (18.4, 0.4), (26.0, 0.5), (32.0, 0.6), (39.4, 0.9)))
    ty = CY0 + 3.5
    for nx, ny in ((0, -1), (-1, 0), (1, 0)):
        cx, cy = tx + nx * 4.55, ty + ny * 4.55
        c = P(cx, cy, 0)
        for u in (-1.6, 1.6):
            cu = P(cx + (u if ny else 0.0), cy + (u if nx else 0.0), 0)
            LOUVRES.append((cu.x, cu.y, Z0 + 33.2 * S, 1.8 * S, 5.4 * S, (nx, ny), 'round'))
        for z, h in ((9.2, 7.6), (20.0, 4.6)) if ny else ():
            WIN.append((c.x, c.y, Z0 + z * S, 1.9 * S, h * S, (nx, ny), 'round'))
    c = P(tx, CY0 - 1.05, 0)
    WIN.append((c.x, c.y, Z0 + 1.0 * S, 2.6 * S, 4.6 * S, (0, -1), 'round'))
    # the spire: a tall slate pyramid flared at its foot, with corner turrets, a lantern and a gilded vane
    lathe(f'spire{side}', M['slateR'], [(6.6 * S, 0.0), (5.0 * S, 1.6 * S), (2.0 * S, 14.0 * S), (1.2 * S, 18.0 * S)], (0, 0, 0), segs=4,
          matrix=Matrix.Translation(P(tx, ty, 40.2)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
    lathe(f'lantern{side}', M['whiteStone'], [(0.95 * S, 0.0), (0.95 * S, 2.2 * S), (1.2 * S, 2.4 * S), (1.2 * S, 2.7 * S)], P(tx, ty, 58.1), segs=8)
    lathe(f'lanternSpire{side}', M['slateR'], [(1.2 * S, 0.0), (0.0, 6.0 * S)], P(tx, ty, 60.75), segs=8)
    lathe(f'vane{side}', M['gold'], [(0.0, 0.0), (0.3 * S, 0.4 * S), (0.0, 2.6 * S)], P(tx, ty, 66.6), segs=8, smooth=True)
    for sx in (-1, 1):
        for sy in (-1, 1):
            px, py = tx + sx * 4.0, ty + sy * 4.0
            cylinder(f'turret{side}{sx}{sy}', M['brickR'], 0.75 * S, 3.4 * S, P(px, py, 40.0), segs=10)
            lathe(f'turretCap{side}{sx}{sy}', M['slateR'], [(0.95 * S, 0.0), (0.0, 3.6 * S)], P(px, py, 43.35), segs=10)
glazed('windows', WIN, M['whiteStone'], depth=0.3 * S)
glazed('louvres', LOUVRES, M['whiteStone'], glass=M['louvre'], depth=0.3 * S)

# ------------------------------------------------------------------ the Museumplein: the mirror pond on the axis, lawns, paths and trees
slab('pondRim', M['whiteStone'], [(x * S, FY + y * S) for x, y in ((-10.0, -17.0), (10.0, -17.0), (10.0, -86.0), (-10.0, -86.0))], G - 0.002, Z0 + 0.5 * S, margin=0.03)
slab('pond', M['pond'], [(x * S, FY + y * S) for x, y in ((-9.0, -18.0), (9.0, -18.0), (9.0, -86.0), (-9.0, -86.0))], G - 0.002, Z0 + 0.62 * S, margin=0.035)
for side in (-1, 1):
    xa, xb = sorted((side * 18.0, side * 90.0))
    slab(f'lawn{side}', M['lawn'], [(x * S, FY + y * S) for x, y in ((xa, -14.0), (xb, -14.0), (xb, -100.0), (xa, -100.0))], G - 0.002, Z0 + 0.12 * S, margin=0.03)
TREES = []
for side in (-1, 1):
    for k in range(5):
        for j in range(2):
            x, y = side * (56.0 + 8.0 * j), -36.0 - 10.0 * k
            p = P(x, y, 0)
            if math.hypot(p.x, p.y) > 1.35:
                continue
            cylinder(f'treeTrunk{side}{k}{j}', M['trunk'], 0.35 * S, 5.5 * S, (p.x, p.y, Z0), segs=8)
            TREES.append(((p.x, p.y, Z0 + 8.5 * S), 3.8 * S, 1.1))
blob_cloud('trees', M['plane'], TREES)

BIKES = {}


def bicycle(x, y, ang, colour):
    """A city bike standing at (x, y) metres, pointing along ang (radians)."""
    d = Vector((math.cos(ang), math.sin(ang), 0.0))

    def at(u, v):
        return P(x + d.x * u, y + d.y * u, v)
    rw = 0.55
    lines = BIKES.setdefault(colour, [])
    for cu in (-0.85, 0.85):
        lines.append([at(cu + rw * math.cos(2 * math.pi * k / 14), rw + rw * math.sin(2 * math.pi * k / 14)) for k in range(15)])
    lines.append([at(-0.85, rw), at(-0.1, rw), at(0.55, 1.25), at(-0.25, 1.25), at(-0.1, rw)])
    lines.append([at(0.55, 1.25), at(0.85, rw)])
    lines.append([at(0.5, 1.25), at(0.62, 1.55), at(0.45, 1.62)])
    lines.append([at(-0.35, 1.45), at(-0.05, 1.45)])


COLOURS = ('black', 'red', 'black', 'blue', 'black', 'green', 'black', 'yellow', 'black')
for side in (-1, 1):
    for k in range(9):
        bicycle(side * (22.0 + 1.2 * k), -5.5, math.pi / 2, COLOURS[(k + (side > 0) * 4) % len(COLOURS)])
bicycle(-1.6, 3.0, math.pi / 2, 'red')
bicycle(1.8, -9.0, -math.pi / 2, 'black')
for colour, lines in BIKES.items():
    wires('bikes' + colour.title(), M['iron'] if colour == 'black' else M[colour], lines, 0.05 * S)
for k, (x, y, shirt) in enumerate(((-15.0, -12.0, 'red'), (-1.5, 1.5, 'blue'), (16.0, -10.0, 'yellow'), (-30.0, -30.0, 'green'), (32.0, -45.0, 'red'),
                                   (-14.0, -50.0, 'blue'), (15.0, -28.0, 'green'), (-40.0, -64.0, 'yellow'), (40.0, -18.0, 'blue'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0 + (0.12 * S if abs(x) > 18 else 0.0), scale=0.7)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('rijksmuseum')
