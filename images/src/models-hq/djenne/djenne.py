# The Great Mosque of Djenné in the high-quality look (hq.py), laid out in metres: the largest building of
# mud brick in the world, on its raised platform; the three great towers of its front, their buttresses
# rising to cone-topped pinnacles and the ostrich eggs on their tops; the walls ribbed all round with
# buttresses ending in cones above the parapet; the palm-wood beams (toron) bristling from every wall;
# the stairs up to the platform; the market's stalls before it under their awnings, and people.
# Run: blender -b --factory-startup -P djenne.py -- djenne-1024.png 1024 djenne.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='sand')
rng = random.Random(1907)
M['mud'] = material('djenneMud', '#b98b5c', 0.95, vary='#ab7d50', vary_scale=14, bump=0.4, bump_scale=160)
M['mudDark'] = material('djenneMudDark', '#9e7449', 0.95, vary='#916a42', vary_scale=14, bump=0.4, bump_scale=160)
M['toron'] = material('toron', '#6f5133', 0.8)
M['egg'] = material('ostrichEgg', '#f2ece0', 0.5)
M['awning'] = [material(f'awning{k}', c, 0.8) for k, c in enumerate(('#d9442e', '#2f6fa8', '#eab32f', '#3f9a4a'))]
M['groundD'] = material('djenneGround', '#c9a77a', 0.95, vary='#bd9b6e', vary_scale=10, bump=0.3, bump_scale=200)
M['doorD'] = material('djenneDoor', '#4a3220', 0.8)

S = 0.0275              # metres to the tile's units
FY = 8.0
Z0 = G + 0.004
PLAT = 3.0


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.002):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def cone(name, x, y, z, r, h, mat='mud'):
    lathe(name, M[mat], [(r * S, 0.0), (r * 0.85 * S, h * 0.4 * S), (r * 0.4 * S, h * 0.85 * S), (0.0, h * S)], P(x, y, z), segs=10, smooth=True)


TORON = []


def torons(x0, x1, y_face, z0, z1, ny, step=2.2):
    """Rows of palm-wood beams sticking out of a wall facing ny (0, ±1)."""
    for z in [z0 + 1.6 + 2.6 * k for k in range(int((z1 - z0 - 1.6) / 2.6) + 1)]:
        n = int((x1 - x0) / step)
        for k in range(n):
            x = x0 + step * (k + 0.5) + (0.8 if int(z) % 2 else 0.0)
            if x > x1:
                continue
            TORON.append((P(x, y_face, z), P(x, y_face + ny * 1.2, z)))


def torons_side(y0, y1, x_face, z0, z1, nx, step=2.2):
    """The same on a wall facing nx (±1, 0)."""
    for z in [z0 + 1.6 + 2.6 * k for k in range(int((z1 - z0 - 1.6) / 2.6) + 1)]:
        n = int((y1 - y0) / step)
        for k in range(n):
            y = y0 + step * (k + 0.5) + (0.8 if int(z) % 2 else 0.0)
            if y > y1:
                continue
            TORON.append((P(x_face, y, z), P(x_face + nx * 1.2, y, z)))


BEFORE = set(bpy.data.objects)
slab('ground', M['groundD'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
# ------------------------------------------------------------------ the platform and its stairs
block('platform', M['mudDark'], -36.0, 36.0, -26.0, 30.0, -0.3, PLAT)
for j in range(5):
    block(f'stairs{j}', M['mudDark'], -9.0, 9.0, -26.0 - 1.0 * (j + 1), -26.0 - 1.0 * j, -0.3, PLAT - 0.6 * (j + 1))
# ------------------------------------------------------------------ the prayer hall's walls, ribbed with buttresses and pinnacles
YF, YB, XW = -20.0, 26.0, 32.0
WH = 8.5
block('hall', M['mud'], -XW, XW, YF, YB, PLAT, PLAT + WH)
for x in [-XW + 2.0 + 3.0 * k for k in range(21)]:
    if abs(x) < 9.0 or abs(abs(x) - 22.0) < 4.0:
        continue
    block(f'frontButtress{x:+.0f}', M['mud'], x - 0.6, x + 0.6, YF - 1.2, YF, PLAT, PLAT + WH + 1.6)
    cone(f'frontPinnacle{x:+.0f}', x, YF - 0.6, PLAT + WH + 1.6, 0.9, 2.4)
for s in (-1, 1):
    for y in [YF + 2.0 + 3.0 * k for k in range(15)]:
        block(f'sideButtress{s}{y:+.0f}', M['mud'], *sorted((s * XW, s * (XW + 1.2))), y - 0.6, y + 0.6, PLAT, PLAT + WH + 1.6)
        cone(f'sidePinnacle{s}{y:+.0f}', s * (XW + 0.6), y, PLAT + WH + 1.6, 0.9, 2.4)
    torons_side(YF + 1.0, YB - 1.0, s * (XW + 1.2), PLAT, PLAT + WH, s, step=3.0)
block('parapet', M['mudDark'], -XW + 0.6, XW - 0.6, YF + 0.6, YB - 0.6, PLAT + WH, PLAT + WH + 0.8)
for i in range(9):
    for j in range(6):
        vx, vy = -26.0 + 6.5 * i, YF + 6.0 + 6.5 * j
        cylinder(f'vent{i}{j}', M['mudDark'], 0.6 * S, 0.6 * S, P(vx, vy, PLAT + WH + 0.8), segs=10)
        cylinder(f'ventLid{i}{j}', M['egg'], 0.7 * S, 0.2 * S, P(vx, vy, PLAT + WH + 1.4), segs=10)
torons(-XW, XW, YF - 1.2, PLAT, PLAT + WH, -1)
# ------------------------------------------------------------------ the three great towers on the front
for k, (x, w, h) in enumerate(((-22.0, 7.0, 22.0), (0.0, 9.0, 26.0), (22.0, 7.0, 22.0))):
    bm = bmesh.new()
    lo = [bm.verts.new(P(x + sx * w / 2, YF - 3.0 + sy * 3.0, PLAT)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    hi = [bm.verts.new(P(x + sx * w * 0.38, YF - 3.0 + sy * 2.2, PLAT + h)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    add_prism(bm, lo, hi)
    finish(f'tower{k}', bm, M['mud'], smooth_sides=False)
    for j, u in enumerate((-0.42, -0.14, 0.14, 0.42)):
        bx = x + u * w
        block(f'towerRib{k}{j}', M['mud'], bx - 0.55, bx + 0.55, YF - 6.6, YF - 5.2, PLAT, PLAT + h + 1.6)
        cone(f'towerPinnacle{k}{j}', bx, YF - 5.9, PLAT + h + 1.6, 0.8, 2.8)
        lathe(f'egg{k}{j}', M['egg'], [(0.0, 0.0), (0.35 * S, 0.3 * S), (0.3 * S, 0.7 * S), (0.0, 0.9 * S)], P(bx, YF - 5.9, PLAT + h + 4.3), segs=10, smooth=True)
    cone(f'towerTop{k}', x, YF - 3.0, PLAT + h, w * 0.3, 4.0)
    lathe(f'towerEgg{k}', M['egg'], [(0.0, 0.0), (0.45 * S, 0.4 * S), (0.4 * S, 0.9 * S), (0.0, 1.2 * S)], P(x, YF - 3.0, PLAT + h + 3.9), segs=12, smooth=True)
    torons(x - w / 2, x + w / 2, YF - 5.2 - 1.4, PLAT, PLAT + h, -1, step=1.8)
WIN = []
for x in (-11.0, 11.0):
    c = P(x, YF - 1.25, 0)
    WIN.append((c.x, c.y, Z0 + PLAT * S, 2.4 * S, 4.4 * S, (0, -1), 'rect'))
glazed('doors', WIN, M['mudDark'], glass=M['doorD'], depth=0.3 * S, bars=False)
for k, (a, b) in enumerate(TORON):
    bar(f'toron{k}', M['toron'], a, b, 0.18 * S)

# ------------------------------------------------------------------ the market before it: stalls under their awnings, people
for k in range(10):
    x = -32.0 + 7.0 * k
    y = -38.0 - (k % 2) * 6.0
    if math.hypot(x, y - FY) * S > 1.32:
        continue
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'stallPole{k}{sx}{sy}', M['toron'], P(x + sx * 2.2, y + sy * 1.6, 0.0), P(x + sx * 2.2, y + sy * 1.6, 2.4), 0.1 * S)
    box(f'awning{k}', M['awning'][k % 4], P(x, y, 2.5), (5.2 * S, 4.0 * S, 0.15 * S), bevel=0)
    box(f'goods{k}', M['awning'][(k + 2) % 4], P(x, y, 0.5), (3.4 * S, 2.4 * S, 1.0 * S), bevel=0)
for k, (x, y, shirt) in enumerate(((-12.0, -32.0, 'blue'), (-6.0, -40.0, 'yellow'), (4.0, -34.0, 'red'), (14.0, -40.0, 'green'), (0.0, -28.0, 'blue'), (24.0, -34.0, 'red'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 16.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('djenne')
