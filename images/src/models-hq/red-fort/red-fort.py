# The Red Fort in the high-quality look (hq.py), laid out in metres: Delhi's Lahori Gate in the red
# sandstone walls of Shah Jahan's fort; the gate's deep pointed arch with its rows of little arched
# niches, flanked by its two octagonal towers, each crowned by a pavilion with a white marble dome; the
# row of seven white-domed kiosks along the top between them; the high battlemented walls running off to
# either side to their round bastions; the dry moat with its grass before them and the causeway over it;
# the plaza, and people.
# Run: blender -b --factory-startup -P red-fort.py -- red-fort-1024.png 1024 red-fort.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1648)
M['redStone'] = material('redFortStone', '#b4503a', 0.85, vary='#a54632', vary_scale=30, bump=0.1, bump_scale=200)
M['redDeep'] = material('redFortDeep', '#8f3a29', 0.85, vary='#833424', vary_scale=30)
M['marbleR'] = material('redFortMarble', '#f4f1ea', 0.45)
M['moatGrass'] = material('moatGrass', '#6fa046', 0.85, vary='#7cad51', vary_scale=12, bump=0.3, bump_scale=200)
M['plazaR'] = masonry('redFortPlaza', '#d4c7b0', '#b6a990', scale=110, rough=0.8, vary='#cbbea6')
M['arch'] = material('gateRecess', '#5a2a20', 0.85)

S = 0.0235              # metres to the tile's units
FY = 14.0               # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def merlons(name, xa, ya, xb, yb, z, step=2.4):
    """Battlements along a wall top: rounded-topped merlons."""
    n = int(math.hypot(xb - xa, yb - ya) / step)
    ang = math.atan2(yb - ya, xb - xa)
    for k in range(n):
        t = (k + 0.5) / n
        x, y = xa + (xb - xa) * t, ya + (yb - ya) * t
        box(f'{name}{k}', M['redStone'], P(x, y, z + 0.75), (1.4 * S, 0.8 * S, 1.5 * S), rot_z=ang, bevel=0.0012)


def chhatri(name, x, y, z, r, h):
    """A little domed pavilion: four (or eight) posts, an eave, a white marble dome and finial."""
    for j in range(8):
        a = 2 * math.pi * (j + 0.5) / 8
        bar(f'{name}Post{j}', M['redStone'], P(x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z), P(x + r * 0.8 * math.cos(a), y + r * 0.8 * math.sin(a), z + h), 0.22 * r * S)
    cylinder(f'{name}Floor', M['redDeep'], r * S, 0.3 * S, P(x, y, z - 0.3), segs=16)
    cylinder(f'{name}Eave', M['redDeep'], r * 1.15 * S, 0.35 * S, P(x, y, z + h), segs=16)
    lathe(f'{name}Dome', M['marbleR'], [(r * 0.95 * S, 0.0), (r * 1.0 * S, r * 0.35 * S), (r * 0.7 * S, r * 0.9 * S), (r * 0.2 * S, r * 1.25 * S), (0.0, r * 1.35 * S)], P(x, y, z + h + 0.35), segs=20, smooth=True)
    lathe(f'{name}Finial', M['marbleR'], [(0.12 * r * S, 0.0), (0.18 * r * S, 0.2 * r * S), (0.0, 0.7 * r * S)], P(x, y, z + h + 0.35 + r * 1.35), segs=8)


BEFORE = set(bpy.data.objects)
slab('plaza', M['plazaR'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (-1.0 - FY) * S), (-2.0, (-1.0 - FY) * S)], Z0 - 0.003, Z0, margin=0.02)
WIN = []
# ------------------------------------------------------------------ the walls: battered, battlemented, round bastions
WH = 22.0
WALLS = [(-52.0, 6.0, -30.0, 0.0), (30.0, 0.0, 52.0, 6.0)]
for k, (xa, ya, xb, yb) in enumerate(WALLS):
    bm = bmesh.new()
    sec = [(0.0, 0.0), (10.0, 0.0), (10.0, WH), (2.0, WH)]
    ang = math.atan2(yb - ya, xb - xa)
    nx, ny = -math.sin(ang), math.cos(ang)
    a = [bm.verts.new(P(xa + nx * u, ya + ny * u, z)) for u, z in sec]
    b = [bm.verts.new(P(xb + nx * u, yb + ny * u, z)) for u, z in sec]
    add_prism(bm, a, b)
    finish(f'wall{k}', bm, M['redStone'], smooth_sides=False)
    merlons(f'merlon{k}_', xa + nx * 2.2, ya + ny * 2.2, xb + nx * 2.2, yb + ny * 2.2, WH)
for s, (bx, by) in ((-1, (-52.0, 10.0)), (1, (52.0, 10.0))):
    cylinder(f'bastion{s}', M['redStone'], 9.0 * S, WH * S, P(bx, by, 0.0), segs=40, r2=8.2 * S)
    for j in range(14):
        a = 2 * math.pi * j / 14
        box(f'bastionMerlon{s}{j}', M['redStone'], P(bx + 7.8 * math.cos(a), by + 7.8 * math.sin(a), WH + 0.75), (1.4 * S, 0.8 * S, 1.5 * S), rot_z=a + math.pi / 2, bevel=0.0012)
    chhatri(f'bastionKiosk{s}', bx, by, WH + 0.3, 3.0, 3.4)

# ------------------------------------------------------------------ the Lahori Gate: the block with its deep arch, the niches, the octagonal towers, the kiosks
GX, GY0, GY1 = 22.0, -8.0, 10.0
GH = 30.0
block('gate', M['redStone'], -GX, GX, GY0, GY1, -0.3, GH - 0.1)     # under its cornice's top: no faces in one plane
block('gateBand1', M['redDeep'], -GX - 0.2, GX + 0.2, GY0 - 0.3, GY1, GH - 7.0, GH - 6.4, bevel=0)
block('gateCornice', M['redDeep'], -GX - 0.4, GX + 0.4, GY0 - 0.6, GY1, GH - 0.6, GH, bevel=0)
arcade_path('gateArchFrame', M['redDeep'], [(-8.6 * S, (GY0 - 0.2 - FY) * S), (8.6 * S, (GY0 - 0.2 - FY) * S)], 0.4 * S, Z0 + 12.0 * S, 10.0 * S, 7.6 * S, pointed=0.6)
c = P(0.0, GY0 - 0.05, 0)
WIN.append((c.x, c.y, Z0 + 0.0, 14.6 * S, 20.0 * S, (0, -1), 'pointed'))
for row, (z, w, h, n) in enumerate(((GH - 6.0, 1.6, 4.0, 9), (3.0, 1.8, 6.0, 2))):
    for j in range(n):
        if row == 0:
            x = -GX + 2.4 + (2 * GX - 4.8) * (j + 0.5) / n
        else:
            x = (-12.6, 12.6)[j]
        c = P(x, GY0 - 0.05, 0)
        WIN.append((c.x, c.y, Z0 + z * S, w * S, h * S, (0, -1), 'pointed'))
merlons('gateMerlon', -GX + 1.0, GY0 + 1.0, GX - 1.0, GY0 + 1.0, GH)
for j in range(7):
    x = -15.0 + 5.0 * j
    chhatri(f'gateKiosk{j}', x, GY0 + 3.0, GH + 0.3, 1.5, 2.2)
for s in (-1, 1):
    tx = s * (GX + 4.0)
    lathe(f'tower{s}', M['redStone'], [(6.2 * S, 0.0), (5.8 * S, (GH + 4.0) * S)], (0, 0, 0), segs=8,
          matrix=Matrix.Translation(P(tx, GY0 + 4.0, -0.3)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    for z in (10.0, 20.0, GH - 2.0):
        lathe(f'towerBand{s}{z:.0f}', M['redDeep'], [(6.3 * S, 0.0), (6.3 * S, 0.6 * S)], (0, 0, 0), segs=8,
              matrix=Matrix.Translation(P(tx, GY0 + 4.0, z)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    chhatri(f'towerKiosk{s}', tx, GY0 + 4.0, GH + 4.0, 3.6, 4.0)
for s in (-1, 1):
    chhatri(f'backKiosk{s}', s * 12.0, GY1 - 3.0, GH + 0.3, 2.2, 3.0)

# ------------------------------------------------------------------ the dry moat, the causeway, the plaza, people
for k, (x0, x1) in enumerate(((-70.0, -6.0), (6.0, 70.0))):
    slab(f'moat{k}', M['moatGrass'], [(x0 * S, (-22.0 - FY) * S), (x1 * S, (-22.0 - FY) * S), (x1 * S, (-10.0 - FY) * S), (x0 * S, (-10.0 - FY) * S)], Z0 - 0.003, Z0 + 0.15 * S, margin=0.02)
block('causeway', M['redDeep'], -6.0, 6.0, -24.0, GY0, -0.3, 0.6, bevel=0)
for s in (-1, 1):
    block(f'causewayWall{s}', M['redStone'], *sorted((s * 6.0, s * 5.2)), -24.0, GY0, 0.6, 1.6, bevel=0)
glazed('recesses', WIN, M['redDeep'], glass=M['arch'], depth=0.6 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-3.0, -30.0, 'red'), (2.0, -33.0, 'blue'), (-12.0, -34.0, 'yellow'), (14.0, -31.0, 'green'), (0.0, -18.0, 'red'))):
    c = P(x, y, 0.6 if k == 4 else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 16.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('red-fort')
