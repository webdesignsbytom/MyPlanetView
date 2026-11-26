# Agra Fort in the high-quality look (hq.py), laid out in metres (a stretch of the fort, drawn closer
# together, to fit): the high red sandstone walls with their rounded battlements and round bastions,
# the lower outer wall and the dry moat before them; the Amar Singh Gate between its two great round
# towers, its pointed arch and its bands of blue glazed tiles, kiosks on top; inside, the white
# arcade of the Diwan-i-Am across its courtyard, the Anguri Bagh's lawns, and on the river wall at
# the back the white marble Khas Mahal with its two golden Bangla roofs and the octagonal Musamman Burj
# with its dome; and people.
# Run: blender -b --factory-startup -P agra-fort.py -- agra-fort-1024.png 1024 agra-fort.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1565)
M['redStone'] = material('agraStone', '#b4503a', 0.85, vary='#a54632', vary_scale=30, bump=0.1, bump_scale=200)
M['redDeep'] = material('agraDeep', '#8f3a29', 0.85, vary='#833424', vary_scale=30)
M['marbleA'] = material('agraMarble', '#f4f1ea', 0.4, vary='#e9e4da', vary_scale=18, sss=0.04)
M['plaster'] = material('diwanPlaster', '#efe8da', 0.6, vary='#e5ddce', vary_scale=24)
M['tiles'] = chequer('agraTiles', '#2a64ad', '#ece4cf', scale=110.0, rough=0.3)
M['goldRoof'] = material('bangla', '#d9a83e', 0.25, vary='#c8962f', vary_scale=20, metallic=0.85)
M['moatGrass'] = material('agraMoat', '#6fa046', 0.85, vary='#7cad51', vary_scale=12, bump=0.3, bump_scale=200)
M['court'] = masonry('agraCourt', '#d4c7b0', '#b6a990', scale=110, rough=0.8, vary='#cbbea6')
M['arch'] = material('agraRecess', '#5a2a20', 0.85)
M['lawnA'] = material('anguriBagh', '#66ad42', 0.85, vary='#71b84c', vary_scale=10)

S = 0.0195              # metres to the tile's units
FY = 8.0                # the plan's middle on the tile's
Z0 = G + 0.004
WH = 20.0               # the high wall


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def merlons(name, xa, ya, xb, yb, z, step=2.4):
    """Battlements along a wall top: rounded-topped merlons."""
    n = max(1, int(math.hypot(xb - xa, yb - ya) / step))
    ang = math.atan2(yb - ya, xb - xa)
    bm = bmesh.new()
    for k in range(n):
        t = (k + 0.5) / n
        x, y = xa + (xb - xa) * t, ya + (yb - ya) * t
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(x, y, z + 0.7)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((1.4 * S, 0.8 * S, 1.4 * S, 1)))
        bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.7 * S, radius2=0.7 * S, depth=0.8 * S,
                              matrix=Matrix.Translation(P(x, y, z + 1.4)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    finish(name, bm, M['redStone'], smooth_sides=False)


def chhatri(name, x, y, z, r, h, dome='marbleA'):
    """A little domed pavilion: eight posts, an eave, a dome and finial."""
    for j in range(8):
        a = 2 * math.pi * (j + 0.5) / 8
        bar(f'{name}Post{j}', M['redStone'], P(x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z), P(x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z + h), 0.22 * r * S)
    cylinder(f'{name}Floor', M['redDeep'], r * S, 0.3 * S, P(x, y, z - 0.3), segs=16)
    cylinder(f'{name}Eave', M['redDeep'], r * 1.15 * S, 0.35 * S, P(x, y, z + h), segs=16)
    lathe(f'{name}Dome', M[dome], [(r * 0.95 * S, 0.0), (r * 1.0 * S, r * 0.35 * S), (r * 0.7 * S, r * 0.9 * S), (r * 0.2 * S, r * 1.25 * S), (0.0, r * 1.35 * S)], P(x, y, z + h + 0.35), segs=20, smooth=True)
    lathe(f'{name}Finial', M['goldRoof'], [(0.12 * r * S, 0.0), (0.18 * r * S, 0.2 * r * S), (0.0, 0.7 * r * S)], P(x, y, z + h + 0.35 + r * 1.35), segs=8)


def wall(name, xa, ya, xb, yb, h, thick, battle=True):
    """A battered stretch of wall from a to b, its outer face on the line, thickening inwards (to the left)."""
    bm = bmesh.new()
    sec = [(0.0, 0.0), (thick, 0.0), (thick, h), (1.2, h)]
    ang = math.atan2(yb - ya, xb - xa)
    nx, ny = -math.sin(ang), math.cos(ang)
    a = [bm.verts.new(P(xa + nx * u, ya + ny * u, z)) for u, z in sec]
    b = [bm.verts.new(P(xb + nx * u, yb + ny * u, z)) for u, z in sec]
    add_prism(bm, a, b)
    finish(name, bm, M['redStone'], smooth_sides=False)
    if battle:
        merlons(name + 'Merlons', xa + nx * 1.8, ya + ny * 1.8, xb + nx * 1.8, yb + ny * 1.8, h)


def bastion(name, x, y, r, h, kiosk=True):
    cylinder(name, M['redStone'], r * S, h * S, P(x, y, 0.0), segs=40, r2=(r - 0.8) * S)
    bm = bmesh.new()
    n = int(2 * math.pi * r / 2.6)
    for j in range(n):
        a = 2 * math.pi * j / n
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(x + (r - 1.4) * math.cos(a), y + (r - 1.4) * math.sin(a), h + 0.7)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Diagonal((1.4 * S, 0.8 * S, 1.4 * S, 1)))
    finish(name + 'Merlons', bm, M['redStone'], smooth_sides=False)
    if kiosk:
        chhatri(name + 'Kiosk', x, y, h + 0.3, 2.6, 3.0)


BEFORE = set(bpy.data.objects)
WIN = []
# ------------------------------------------------------------------ the ground: the plaza before the moat, the moat, the courtyard and the garden inside
FRONT = -20.0           # the high wall's outer face
slab('plaza', M['court'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (-40.0 - FY) * S), (-2.0, (-40.0 - FY) * S)], Z0 - 0.003, Z0, margin=0.02)
slab('moat', M['moatGrass'], [(-2.0, (-40.0 - FY) * S), (2.0, (-40.0 - FY) * S), (2.0, (FRONT - FY) * S), (-2.0, (FRONT - FY) * S)], Z0 - 0.003, Z0 + 0.1 * S, margin=0.02)
slab('court', M['court'], [(-2.0, (FRONT + 4.0 - FY) * S), (2.0, (FRONT + 4.0 - FY) * S), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
for k, (cx, cy) in enumerate(((-30.0, 26.0), (-10.0, 26.0))):
    slab(f'garden{k}', M['lawnA'], rect(cx * S, (cy - FY) * S, 16.0 * S, 10.0 * S), Z0, Z0 + 0.15 * S, margin=0.03)
    slab(f'gardenPath{k}', M['court'], rect(cx * S, (cy - FY) * S, 16.0 * S, 1.2 * S), Z0 + 0.1 * S, Z0 + 0.2 * S, margin=0.03)
    slab(f'gardenPathX{k}', M['court'], rect(cx * S, (cy - FY) * S, 1.2 * S, 10.0 * S), Z0 + 0.1 * S, Z0 + 0.2 * S, margin=0.03)

# ------------------------------------------------------------------ the walls: the high wall round three sides, the river wall at the back, the bastions
BACK = 38.0
wall('wallFrontL', -50.0, FRONT, -17.0, FRONT, WH, 9.0)
wall('wallFrontR', 17.0, FRONT, 50.0, FRONT, WH, 9.0)
wall('wallLeft', -56.0, BACK - 4.0, -56.0, FRONT + 6.0, WH, 9.0)
wall('wallRight', 56.0, FRONT + 6.0, 56.0, BACK - 4.0, WH, 9.0)
wall('wallBack', 50.0, BACK, -50.0, BACK, WH - 2.0, 9.0, battle=False)
for k, (bx, by) in enumerate(((-54.0, FRONT + 2.0), (54.0, FRONT + 2.0), (-54.0, BACK - 1.0), (54.0, BACK - 1.0))):
    bastion(f'bastion{k}', bx, by, 8.0, WH + 1.0)
# the lower outer wall in front, broken for the gate's way
wall('outerL', -48.0, FRONT - 7.0, -10.0, FRONT - 7.0, 9.0, 3.0)
wall('outerR', 10.0, FRONT - 7.0, 48.0, FRONT - 7.0, 9.0, 3.0)
for s in (-1, 1):
    cylinder(f'outerTower{s}', M['redStone'], 3.0 * S, 10.0 * S, P(s * 10.5, FRONT - 6.0, 0.0), segs=24)

# ------------------------------------------------------------------ the Amar Singh Gate: two round towers, the arch, the tiled bands, the kiosks
GH = 26.0
block('gate', M['redStone'], -9.0, 9.0, FRONT - 2.0, FRONT + 9.0, -0.3, GH - 0.1)
block('gateCornice', M['redDeep'], -9.4, 9.4, FRONT - 2.4, FRONT + 9.0, GH - 0.6, GH, bevel=0)
for z in (GH - 5.5, GH - 9.5):
    block(f'gateTiles{z:.0f}', M['tiles'], -8.8, 8.8, FRONT - 2.15, FRONT + 8.0, z, z + 2.2, bevel=0)
arcade_path('gateArchFrame', M['redDeep'], [(-5.6 * S, (FRONT - 2.2 - FY) * S), (5.6 * S, (FRONT - 2.2 - FY) * S)], 0.4 * S, Z0 + 7.0 * S, 6.0 * S, 4.6 * S, pointed=0.6)
c = P(0.0, FRONT - 2.05, 0)
WIN.append((c.x, c.y, Z0 + 0.0, 8.6 * S, 12.6 * S, (0, -1), 'pointed'))
for s in (-1, 1):
    tx = s * 12.0
    cylinder(f'gateTower{s}', M['redStone'], 6.4 * S, (GH + 2.0) * S, P(tx, FRONT + 1.0, -0.3), segs=40, r2=5.8 * S)
    for z in (GH - 9.5, GH - 5.5):
        rz = lambda zz: 6.4 - 0.6 * (zz + 0.3) / (GH + 2.0) + 0.08
        cylinder(f'gateTowerTiles{s}{z:.0f}', M['tiles'], rz(z) * S, 2.2 * S, P(tx, FRONT + 1.0, z), segs=40, r2=rz(z + 2.2) * S)
    cylinder(f'gateTowerTop{s}', M['redDeep'], 6.1 * S, 0.6 * S, P(tx, FRONT + 1.0, GH + 1.7), segs=40)
    chhatri(f'gateTowerKiosk{s}', tx, FRONT + 1.0, GH + 2.3, 3.4, 3.8)
for j in range(3):
    chhatri(f'gateKiosk{j}', -5.0 + 5.0 * j, FRONT + 2.0, GH + 0.3, 1.5, 2.2)
merlons('gateMerlons', -8.6, FRONT - 1.0, 8.6, FRONT - 1.0, GH)

# ------------------------------------------------------------------ the Diwan-i-Am: its white arcade of cusped arches across the courtyard
DX0, DX1, DY0, DY1, DH = -24.0, 20.0, 6.0, 18.0, 11.0
block('diwanBack', M['plaster'], DX0, DX1, DY1 - 2.0, DY1, 0.0, DH)
block('diwanRoof', M['plaster'], DX0 - 0.4, DX1 + 0.4, DY0 - 0.4, DY1, DH, DH + 1.2, bevel=0)
block('diwanFloor', M['plaster'], DX0 - 0.6, DX1 + 0.6, DY0 - 1.2, DY1, -0.3, 0.9, bevel=0)
for row, y in enumerate((DY0, DY0 + 5.0)):
    pts = [(x * S, (y - FY) * S) for x in [DX0 + (DX1 - DX0) * k / 9 for k in range(10)]]
    arcade_path(f'diwanArcade{row}', M['plaster'], pts, 0.9 * S, Z0 + 6.4 * S, (DH - 6.4) * S, 1.9 * S, pointed=0.35)
    for k in range(10):
        x = DX0 + (DX1 - DX0) * k / 9
        cylinder(f'diwanPier{row}{k}', M['plaster'], 0.55 * S, 5.6 * S, P(x, y + 0.45, 0.9), segs=12)
for x in (DX0, DX1):
    chhatri(f'diwanKiosk{x:.0f}', x, DY0 + 1.0, DH + 1.5, 1.6, 2.4)

# ------------------------------------------------------------------ the white marble palaces on the river wall: Khas Mahal, the golden pavilions, the Musamman Burj
TZ = WH - 2.0
block('palaceTerrace', M['marbleA'], -26.0, 34.0, BACK - 6.0, BACK + 1.0, TZ - 0.4, TZ + 0.3, bevel=0)
# the Khas Mahal between its two golden pavilions
block('khasMahal', M['marbleA'], -8.0, 8.0, BACK - 5.0, BACK, TZ, TZ + 8.0)
block('khasMahalCornice', M['marbleA'], -8.5, 8.5, BACK - 5.5, BACK + 0.2, TZ + 7.6, TZ + 8.4, bevel=0)
arcade_path('khasMahalArches', M['marbleA'], [(x * S, (BACK - 5.6 - FY) * S) for x in (-7.5, -4.5, -1.5, 1.5, 4.5, 7.5)], 0.6 * S, Z0 + (TZ + 3.2) * S, 3.8 * S, 1.2 * S, pointed=0.35)
for x in (-7.5, -4.5, -1.5, 1.5, 4.5, 7.5):
    cylinder(f'khasPier{x:.0f}', M['marbleA'], 0.35 * S, 3.2 * S, P(x, BACK - 5.3, TZ), segs=10)
for s in (-1, 1):
    px = s * 14.5
    block(f'goldenPavilion{s}', M['marbleA'], px - 3.5, px + 3.5, BACK - 5.0, BACK, TZ, TZ + 5.5)
    bm = bmesh.new()
    # the curved Bangla roof: a vault arched along its length, drooping at the ends
    rows = []
    for i in range(13):
        u = -1 + 2 * i / 12
        row = []
        for j in range(9):
            v = -1 + 2 * j / 8
            x = px + 4.2 * u
            y = BACK - 2.5 + 3.2 * v
            z = TZ + 5.5 + 2.6 * (1 - v * v) - 0.9 * u * u
            row.append(bm.verts.new(P(x, y, z)))
        rows.append(row)
    for a, b in zip(rows, rows[1:]):
        for j in range(8):
            bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
    finish(f'banglaRoof{s}', bm, M['goldRoof'], smooth_all=True)
    lathe(f'banglaFinial{s}', M['goldRoof'], [(0.3 * S, 0.0), (0.2 * S, 1.0 * S), (0.0, 1.6 * S)], P(px, BACK - 2.5, TZ + 8.0), segs=8)
# the octagonal Musamman Burj on its bastion, its arcade and dome
MX, MY = 30.0, BACK - 2.0
lathe('burjBastion', M['redStone'], [(9.0 * S, 0.0), (8.4 * S, TZ * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(MX, MY, 0.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('burj', M['marbleA'], [(6.4 * S, 0.0), (6.4 * S, 6.5 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(MX, MY, TZ)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for j in range(8):
    a = 2 * math.pi * j / 8
    c = P(MX + 6.45 * math.cos(a), MY + 6.45 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + (TZ + 0.5) * S, 2.6 * S, 4.4 * S, (math.cos(a), math.sin(a)), 'pointed'))
lathe('burjCornice', M['marbleA'], [(7.0 * S, 0.0), (7.0 * S, 0.7 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(MX, MY, TZ + 6.5)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
cylinder('burjDrum', M['marbleA'], 3.6 * S, 1.6 * S, P(MX, MY, TZ + 7.2), segs=24)
lathe('burjDome', M['goldRoof'], [(3.8 * S, 0.0), (4.0 * S, 1.4 * S), (3.0 * S, 3.4 * S), (1.0 * S, 4.6 * S), (0.0, 4.8 * S)], P(MX, MY, TZ + 8.8), segs=24, smooth=True)
lathe('burjFinial', M['goldRoof'], [(0.35 * S, 0.0), (0.25 * S, 1.0 * S), (0.0, 1.8 * S)], P(MX, MY, TZ + 13.6), segs=8)
glazed('recesses', WIN, M['redDeep'], glass=M['arch'], depth=0.6 * S, bars=False)

# ------------------------------------------------------------------ the causeway over the moat, people
block('causeway', M['redDeep'], -5.0, 5.0, -40.0, FRONT - 2.0, -0.3, 0.6, bevel=0)
for s in (-1, 1):
    block(f'causewayWall{s}', M['redStone'], *sorted((s * 5.0, s * 4.2)), -38.0, FRONT - 8.0, 0.6, 1.6, bevel=0)
for k, (x, y, shirt) in enumerate(((-2.0, -46.0, 'red'), (2.5, -48.0, 'blue'), (-14.0, -50.0, 'yellow'), (-6.0, 10.0, 'green'), (8.0, -2.0, 'red'), (-30.0, 0.0, 'blue'))):
    c = P(x, y, 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.95)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('agra-fort')
