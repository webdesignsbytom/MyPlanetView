# Toledo in the high-quality look (hq.py), laid out in metres (the city drawn smaller than it is, to
# fit): the old city on its hill in the tight bend of the Tagus, the river deep in its rocky gorge
# round three sides; the city's houses packed close in their beige stone under terracotta roofs; at the
# top the Alcázar, its great square block and its four corner towers under pointed slate spires; the
# cathedral's long Gothic nave and its tall tower crowned with its spire; the scrubby slopes across the
# gorge, and people.
# Run: blender -b --factory-startup -P toledo.py -- toledo-1024.png 1024 toledo.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1085)
M['alcazar'] = material('alcazarStone', '#d9c49b', 0.75, vary='#ccb68c', vary_scale=24, bump=0.08, bump_scale=200)
M['slateT'] = material('toledoSlate', '#4f5966', 0.5, vary='#46505c', vary_scale=14, bump=0.1, bump_scale=200)
M['cathedral'] = material('cathedralStone', '#e2d6bd', 0.7, vary='#d6c9ae', vary_scale=24, bump=0.08, bump_scale=200)
M['leadT'] = material('cathedralLead', '#8a939a', 0.5, vary='#7f888f', vary_scale=14, metallic=0.3)
M['roofT'] = banded(material('toledoRoof', '#bd6a47', 0.7, vary='#aa5b3c', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
M['rockT'] = material('toledoRock', '#9a8a72', 0.9, vary='#877862', vary_scale=8, bump=0.6, bump_scale=60)
M['slopeT'] = material('cigarrales', '#a8a060', 0.9, vary='#96904f', vary_scale=10, bump=0.3, bump_scale=120)
M['streetT'] = material('toledoStreet', '#bfae90', 0.85, vary='#b2a183', vary_scale=60)
M['tagus'] = material('tagus', '#4e7a6c', 0.1, vary='#5a8778', vary_scale=8, bump=0.05, bump_scale=30)
M['scrub'] = material('toledoScrub', '#61773a', 0.85, vary='#6f8543', vary_scale=14, bump=0.3, bump_scale=90)
WALLS = [material(f'toledoWall{k}', c, 0.8, vary=c, vary_scale=30, bump=0.06, bump_scale=200) for k, c in enumerate(('#e0cda6', '#d6be92', '#e8dabc', '#cdb388', '#ead7b0', '#d9c6a4'))]

S = 0.0135              # metres to the tile's units
RIVER = [(-140.0, 40.0), (-100.0, -20.0), (-50.0, -60.0), (10.0, -72.0), (70.0, -52.0), (110.0, -8.0), (140.0, 50.0)]
HALFW = 11.0
CITY = (0.0, 26.0)
ALC = (30.0, 40.0)      # the Alcázar's middle
CAT = (-30.0, 18.0)     # the cathedral's middle


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def river_dist(x, y):
    best = 1e9
    for (ax, ay), (bx, by) in zip(RIVER, RIVER[1:]):
        dx, dy = bx - ax, by - ay
        t = max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(x - ax - dx * t, y - ay - dy * t))
    return best


def city_dist(x, y):
    """How far out from the city's hill: northwards it runs on as a ridge."""
    return abs(x - CITY[0]) if y > CITY[1] else math.hypot(x - CITY[0], y - CITY[1])


def ground(x, y):
    """Metres above the river: the gorge, the city's hill, the Alcázar's crown, the slopes across the river."""
    d = river_dist(x, y)
    bed = -3.0 + 5.0 * smooth((d - HALFW + 2.0) / 5.0)
    cd = city_dist(x, y)
    hill = 36.0 * smooth((84.0 - cd) / 30.0) + 5.0 * smooth((26.0 - math.hypot(x - ALC[0], y - ALC[1])) / 18.0)
    across = 14.0 * smooth((cd - 112.0) / 40.0) + 1.0 + 1.5 * math.sin(x * 0.05) * math.cos(y * 0.06)
    return bed + max(0.0, max(hill, across)) * smooth((d - HALFW) / 7.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return (ground(x / S, y / S) + 3.5) * S * rim


def pick(z, nz, x, y):
    mx, my = x / S, y / S
    if nz < 0.42 and math.hypot(x, y) < 1.3:
        return 1
    if city_dist(mx, my) < 70.0 and river_dist(mx, my) > HALFW + 10.0:
        return 2
    return 0


land = terrain('ground', H, [M['slopeT'], M['rockT'], M['streetT']], pick, rings=220, segs=540)
ZW = G + 3.5 * S        # the river's level
river = cylinder('tagus', M['tagus'], 1.40, 0.004, (0.0, 0.0, ZW - 0.004), segs=128)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, ZW + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def footing(x0, x1, y0, y1):
    """The lowest and highest ground under a rectangle."""
    hs = [ground(x, y) for x in (x0, (x0 + x1) / 2, x1) for y in (y0, (y0 + y1) / 2, y1)]
    return min(hs) - 1.0, max(hs)


WIN = []
# ------------------------------------------------------------------ the Alcázar: the great square block, four corner towers, slate spires
AW = 46.0
ag, agt = footing(ALC[0] - AW / 2, ALC[0] + AW / 2, ALC[1] - AW / 2, ALC[1] + AW / 2)
AH = agt + 20.0
block('alcazar', M['alcazar'], ALC[0] - AW / 2, ALC[0] + AW / 2, ALC[1] - AW / 2, ALC[1] + AW / 2, ag, AH)
block('alcazarCornice', M['alcazar'], ALC[0] - AW / 2 - 0.5, ALC[0] + AW / 2 + 0.5, ALC[1] - AW / 2 - 0.5, ALC[1] + AW / 2 + 0.5, AH - 1.2, AH - 0.4, bevel=0)
hip_roof('alcazarRoof', M['slateT'], ALC[0] * S, ALC[1] * S, ZW + (AH - 0.05) * S, (AW + 0.6) * S, (AW + 0.6) * S, 5.0 * S, over=0.0)
box('alcazarCourtRoof', M['streetT'], P(ALC[0], ALC[1], AH + 4.6), (14.0 * S, 14.0 * S, 1.0 * S), bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        tx, ty = ALC[0] + sx * (AW / 2 - 4.0), ALC[1] + sy * (AW / 2 - 4.0)
        block(f'alcazarTower{sx}{sy}', M['alcazar'], tx - 5.0, tx + 5.0, ty - 5.0, ty + 5.0, ag, AH + 10.0)
        pyramid(f'alcazarSpire{sx}{sy}', M['slateT'], tx * S, ty * S, ZW + (AH + 9.95) * S, 10.6 * S, 11.0 * S)
        lathe(f'alcazarFinial{sx}{sy}', M['gold'], [(0.25 * S, 0.0), (0.15 * S, 2.0 * S), (0.0, 2.6 * S)], P(tx, ty, AH + 20.9), segs=8)
for nx, ny, x0, x1, y in ((0, -1, ALC[0] - AW / 2 + 10.0, ALC[0] + AW / 2 - 10.0, ALC[1] - AW / 2 - 0.05),):
    n = 7
    for j in range(n):
        x = x0 + (x1 - x0) * (j + 0.5) / n
        c = P(x, y, 0)
        for z in (agt + 3.0, agt + 8.0, agt + 13.0):
            WIN.append((c.x, c.y, ZW + z * S, 1.6 * S, 2.6 * S, (0, -1), 'rect'))
for j in range(7):
    y = ALC[1] - AW / 2 + 10.0 + (AW - 20.0) * (j + 0.5) / 7
    c = P(ALC[0] - AW / 2 - 0.05, y, 0)
    for z in (agt + 3.0, agt + 8.0, agt + 13.0):
        WIN.append((c.x, c.y, ZW + z * S, 1.6 * S, 2.6 * S, (-1, 0), 'rect'))

# ------------------------------------------------------------------ the cathedral: its nave and apse, the tall tower and spire
CW, CD = 58.0, 24.0
cg, cgt = footing(CAT[0] - CW / 2, CAT[0] + CW / 2, CAT[1] - CD / 2, CAT[1] + CD / 2)
NH = cgt + 22.0
block('nave', M['cathedral'], CAT[0] - CW / 2, CAT[0] + CW / 2, CAT[1] - CD / 2, CAT[1] + CD / 2, cg, NH)
gable_roof('naveRoof', M['leadT'], (CAT[0] - CW / 2 - 0.3) * S, (CAT[0] + CW / 2 + 0.3) * S, (CAT[1] - CD / 2 - 0.3) * S, (CAT[1] + CD / 2 + 0.3) * S, ZW + (NH - 0.05) * S, 8.0 * S, over=0.0, along='x')
lathe('apse', M['cathedral'], [(CD / 2 * S, 0.0), (CD / 2 * S, (NH - cg) * S)], P(CAT[0] + CW / 2, CAT[1], cg), segs=24)
lathe('apseRoof', M['leadT'], [(CD / 2 * S + 0.002, 0.0), (0.0, 7.0 * S)], P(CAT[0] + CW / 2, CAT[1], NH), segs=24)
for k in range(8):
    x = CAT[0] - CW / 2 + 4.0 + (CW - 8.0) * k / 7
    for sy in (-1, 1):
        block(f'buttress{k}{sy}', M['cathedral'], x - 1.0, x + 1.0, *sorted((CAT[1] + sy * CD / 2, CAT[1] + sy * (CD / 2 + 3.0))), cg, NH - 4.0, bevel=0)
        lathe(f'pinnacle{k}{sy}', M['cathedral'], [(0.9 * S, 0.0), (0.0, 5.0 * S)], P(x, CAT[1] + sy * (CD / 2 + 1.5), NH - 4.0), segs=4)
    c = P(x, CAT[1] - CD / 2 - 0.05, 0)
    WIN.append((c.x, c.y, ZW + (cgt + 8.0) * S, 2.2 * S, 9.0 * S, (0, -1), 'pointed'))
# the tower at the west front's corner: square stages, an octagon, the spire with its crowns
TX, TY = CAT[0] - CW / 2 - 4.0, CAT[1] - CD / 2 + 2.0
tg, tgt = footing(TX - 6.0, TX + 6.0, TY - 6.0, TY + 6.0)
block('towerShaft', M['cathedral'], TX - 6.0, TX + 6.0, TY - 6.0, TY + 6.0, tg, tgt + 32.0)
for z in (tgt + 12.0, tgt + 22.0, tgt + 32.0):
    block(f'towerBand{z:.0f}', M['cathedral'], TX - 6.4, TX + 6.4, TY - 6.4, TY + 6.4, z - 0.6, z, bevel=0)
for nx, ny in ((0, -1), (-1, 0)):
    c = P(TX + nx * 6.05, TY + ny * 6.05, 0)
    WIN.append((c.x, c.y, ZW + (tgt + 24.0) * S, 3.0 * S, 6.0 * S, (nx, ny), 'pointed'))
lathe('towerOctagon', M['cathedral'], [(5.0 * S, 0.0), (5.0 * S, 10.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(TX, TY, tgt + 32.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for j in range(8):
    a = 2 * math.pi * (j + 0.5) / 8
    lathe(f'octPinnacle{j}', M['cathedral'], [(0.8 * S, 0.0), (0.0, 6.0 * S)], P(TX + 5.6 * math.cos(a), TY + 5.6 * math.sin(a), tgt + 32.0), segs=4)
lathe('spire', M['leadT'], [(4.4 * S, 0.0), (0.3 * S, 18.0 * S), (0.0, 20.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(TX, TY, tgt + 42.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for z, r in ((tgt + 47.0, 3.4), (tgt + 51.0, 2.4), (tgt + 55.0, 1.5)):
    for j in range(8):
        a = 2 * math.pi * j / 8
        lathe(f'crown{z:.0f}{j}', M['gold'], [(0.25 * S, 0.0), (0.0, 1.4 * S)], P(TX + r * math.cos(a), TY + r * math.sin(a), z), segs=4)

# ------------------------------------------------------------------ the houses packed over the hill, under terracotta roofs
HOUSES = []
for i in range(-12, 13):
    for j in range(-10, 12):
        x = i * 8.6 + rng.uniform(-1.6, 1.6)
        y = CITY[1] + j * 8.6 + rng.uniform(-1.6, 1.6)
        if city_dist(x, y) > 74.0 or river_dist(x, y) < HALFW + 13.0 or math.hypot(x * S, y * S) > 1.3:
            continue
        if abs(x - ALC[0]) < AW / 2 + 7.0 and abs(y - ALC[1]) < AW / 2 + 7.0:
            continue
        if abs(x - CAT[0]) < CW / 2 + 12.0 and abs(y - CAT[1]) < CD / 2 + 7.0:
            continue
        if math.hypot(x - TX, y - TY) < 11.0 or rng.random() < 0.12:
            continue
        HOUSES.append((x, y, rng.uniform(6.5, 8.0), rng.uniform(6.5, 8.0), rng.uniform(6.0, 11.0)))
for k, (x, y, w, d, h) in enumerate(HOUSES):
    g, gt = footing(x - w / 2, x + w / 2, y - d / 2, y + d / 2)
    block(f'house{k}', WALLS[k % len(WALLS)], x - w / 2, x + w / 2, y - d / 2, y + d / 2, g, gt + h)
    if k % 3:
        gable_roof(f'houseRoof{k}', M['roofT'], (x - w / 2 - 0.4) * S, (x + w / 2 + 0.4) * S, (y - d / 2 - 0.4) * S, (y + d / 2 + 0.4) * S, ZW + (gt + h - 0.05) * S, 2.6 * S, over=0.0, along='x' if k % 2 else 'y')
    else:
        hip_roof(f'houseRoof{k}', M['roofT'], x * S, y * S, ZW + (gt + h - 0.05) * S, (w + 0.8) * S, (d + 0.8) * S, 2.4 * S, over=0.0)
    if y < CITY[1] + 10.0:
        c = P(x, y - d / 2 - 0.05, 0)
        WIN.append((c.x, c.y, ZW + (gt + 2.4) * S, 1.0 * S, 1.6 * S, (0, -1), 'rect'))
glazed('windows', WIN, M['cathedral'], depth=0.3 * S)

# ------------------------------------------------------------------ the scrub on the slopes across the gorge, people
SCRUB = []
for p in scatter_on(land, 9000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 0 and math.hypot(p.x, p.y) < 1.36, seed=23):
    mx, my = p.x / S, p.y / S
    if river_dist(mx, my) < HALFW + 3.0 or city_dist(mx, my) < 75.0:
        continue
    SCRUB.append(((p.x, p.y, p.z + 1.2 * S), rng.uniform(1.6, 2.8) * S, 0.8))
    if len(SCRUB) >= 220:
        break
blob_cloud('scrub', M['scrub'], SCRUB)
for k, (x, y, shirt) in enumerate(((-6.0, -6.0, 'red'), (8.0, -2.0, 'blue'), (40.0, 8.0, 'yellow'), (-56.0, 40.0, 'green'))):
    c = P(x, y, ground(x, y))
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.4)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in [land, river] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('toledo')
