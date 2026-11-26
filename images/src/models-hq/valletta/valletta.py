# Valletta in the high-quality look (hq.py), laid out in metres and seen from the harbour: the honey-
# coloured bastions rising sheer from the water, battered back, their arrowhead points, cordon and
# parapet, little domed sentry boxes at their corners; the town packed on top in its grid, terraces of
# honey limestone with their bright closed wooden balconies; the great dome of the Carmelite church and
# the slender spire of St Paul's on the skyline; a luzzu in the water, painted in its stripes with the
# eye on its bow, and people on the walls.
# Run: blender -b --factory-startup -P valletta.py -- valletta-1024.png 1024 valletta.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1566)
M['globigerina'] = masonry('globigerina', '#d9b77c', '#b3925c', scale=180, rough=0.85, vary='#cfac70')
M['honey'] = material('honeyStone', '#e3c48c', 0.8, vary='#d8b77d', vary_scale=24, bump=0.08, bump_scale=200)
M['honeyPale'] = material('honeyPale', '#ead2a2', 0.8, vary='#e1c792', vary_scale=24, bump=0.08, bump_scale=200)
M['harbour'] = material('harbour', '#2f6f8f', 0.08, vary='#3a7d9c', vary_scale=8, bump=0.05, bump_scale=30)
M['domeGrey'] = material('carmeliteDome', '#b9b6ae', 0.5, vary='#aeaba3', vary_scale=24)
BALCONY = [material(f'gallarija{k}', c, 0.55) for k, c in enumerate(('#2e7d4f', '#b0352c', '#2d5d9a', '#e1b93a', '#7a4a2a', '#2e7d4f'))]

S = 0.02                # metres to the tile's units
FY = -18.0              # the plan's middle on the tile's
TOP = 24.0              # the bastions' top, above the water


def P(x, y, z):
    return Vector((x * S, (y + FY) * S, G + 0.004 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


slab('harbourWater', M['harbour'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], G - 0.003, G + 0.004, margin=0.02)
BEFORE = set(bpy.data.objects)

# ------------------------------------------------------------------ the bastions: the town's platform, its battered front with two arrowhead points
RAD, CY = 67.0, -FY                       # the base's edge, in metres, about the tile's middle
FRONT = [(-46.0, 0.0), (-46.0, -4.0), (-35.0, -18.0), (-24.0, -4.0), (-24.0, 0.0), (19.0, 0.0), (19.0, -4.0), (30.0, -16.0), (41.0, -4.0), (41.0, 0.0)]
x_edge = math.sqrt(RAD ** 2 - CY ** 2)
front = [(-x_edge, 0.0)] + FRONT + [(x_edge, 0.0)]
a0, a1 = math.atan2(0.0 - CY, x_edge), math.atan2(0.0 - CY, -x_edge) + 2 * math.pi
back = [(RAD * math.cos(a0 + (a1 - a0) * k / 24), CY + RAD * math.sin(a0 + (a1 - a0) * k / 24)) for k in range(1, 24)]
TOPLINE = front + back


def offset(poly, d, fixed):
    """The polygon pushed out by d along its corners' bisectors (corners in `fixed` stay put)."""
    out = []
    n = len(poly)
    for i, (x, y) in enumerate(poly):
        if i in fixed:
            out.append((x, y))
            continue
        (ax, ay), (bx, by) = poly[i - 1], poly[(i + 1) % n]
        e1 = Vector((x - ax, y - ay)).normalized()
        e2 = Vector((bx - x, by - y)).normalized()
        n1, n2 = Vector((e1.y, -e1.x)), Vector((e2.y, -e2.x))
        m = (n1 + n2).normalized()
        k = min(2.5, 1.0 / max(0.3, m.dot(n1)))
        out.append((x + m.x * d * k, y + m.y * d * k))
    return out


fixed = set(range(len(front), len(TOPLINE))) | {0, len(front) - 1}
BASE = offset(TOPLINE, 4.5, fixed)
loft('bastions', M['globigerina'], [[P(x, y, -1.5) for x, y in BASE], [P(x, y, TOP) for x, y in TOPLINE]], cap=True, smooth=False)
tube('cordon', M['honeyPale'], [P(x, y, TOP - 3.0) for x, y in offset(TOPLINE, 0.9, fixed)[:len(front)]], 0.45 * S)     # on the battered face, 3 m down
for (ax, ay), (bx, by) in zip(front, front[1:]):
    L = math.hypot(bx - ax, by - ay)
    box(f'parapet{ax:.0f}{ay:.0f}', M['globigerina'], P((ax + bx) / 2, (ay + by) / 2, TOP + 0.7), ((L + 0.4) * S, 1.0 * S, 1.6 * S), rot_z=math.atan2(by - ay, bx - ax), bevel=0)
for k, (x, y) in enumerate(((-46.0, -4.0), (-35.0, -18.0), (-24.0, -4.0), (19.0, -4.0), (30.0, -16.0), (41.0, -4.0))):
    lathe(f'sentryCorbel{k}', M['honeyPale'], [(0.3 * S, 0.0), (1.4 * S, 1.6 * S)], P(x, y - 0.6, TOP - 1.6), segs=6)
    lathe(f'sentryBox{k}', M['honey'], [(1.4 * S, 0.0), (1.4 * S, 2.6 * S)], P(x, y - 0.6, TOP), segs=6)
    lathe(f'sentryDome{k}', M['honeyPale'], [(1.55 * S, 0.0), (1.2 * S, 0.8 * S), (0.4 * S, 1.4 * S), (0.0, 1.5 * S)], P(x, y - 0.6, TOP + 2.6), segs=12, smooth=True)

# ------------------------------------------------------------------ the town on top: its blocks of terraced houses with their closed wooden balconies
WIN, BAL = [], {k: bmesh.new() for k in range(len(BALCONY))}
BLOCKS_X = ((-60.0, -40.0), (-34.0, -12.0), (-6.0, 16.0), (22.0, 44.0), (50.0, 62.0))
BLOCKS_Y = ((5.0, 21.0), (27.0, 43.0), (49.0, 63.0))
CHURCH = ((-6.0, 16.0), (27.0, 43.0))


def inside(x, y, margin=2.0):
    return math.hypot(x, y - CY) < RAD - margin and y > 2.0


for bx0, bx1 in BLOCKS_X:
    for by0, by1 in BLOCKS_Y:
        if (bx0, bx1) == CHURCH[0] and (by0, by1) == CHURCH[1]:
            continue
        x = bx0
        while x < bx1 - 3.0:
            w = min(rng.uniform(5.5, 8.5), bx1 - x)
            if not (inside(x, by0) and inside(x + w, by0) and inside(x, by1) and inside(x + w, by1)):
                x += w
                continue
            h = rng.uniform(11.0, 19.0)
            block(f'house{x:.0f}_{by0:.0f}', [M['honey'], M['honeyPale'], M['globigerina']][rng.randrange(3)], x, x + w, by0, by1, TOP - 0.5, TOP + h, bevel=0.0006)
            block(f'parapetH{x:.0f}_{by0:.0f}', M['honeyPale'], x, x + w, by0 - 0.1, by1 + 0.1, TOP + h, TOP + h + 0.7, bevel=0)
            floors = int((h - 2.0) / 3.6)
            for f in range(floors):
                z = TOP + 1.2 + 3.6 * f
                c = P(x + w / 2, by0 - 0.05, 0)
                if f >= 1 and rng.random() < 0.8:
                    col = rng.randrange(len(BALCONY))
                    bm_ = BAL[col]
                    bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation(P(x + w / 2, by0 - 0.55, z + 1.2)) @ Matrix.Diagonal((min(w - 1.0, 3.4) * S, 1.1 * S, 2.4 * S, 1)))
                    bmesh.ops.create_cube(bm_, size=1.0, matrix=Matrix.Translation(P(x + w / 2, by0 - 0.55, z + 2.55)) @ Matrix.Diagonal(((min(w - 1.0, 3.4) + 0.3) * S, 1.3 * S, 0.3 * S, 1)))
                    for u in (-0.8, 0.8):
                        c2 = P(x + w / 2 + u * min(w - 1.0, 3.4) / 3.4, by0 - 1.12, 0)
                        WIN.append((c2.x, c2.y, G + 0.004 + (z + 0.7) * S, 0.9 * S, 1.3 * S, (0, -1), 'rect'))
                else:
                    WIN.append((c.x, c.y, G + 0.004 + (z + 0.3) * S, 1.1 * S, 2.0 * S, (0, -1), 'rect'))
            x += w
for k, bm_ in BAL.items():
    finish(f'balconies{k}', bm_, BALCONY[k], smooth_sides=False)

# ------------------------------------------------------------------ the Carmelite church and its great dome, St Paul's spire
block('carmeliteNave', M['honey'], -4.0, 14.0, 29.0, 43.0, TOP - 0.5, TOP + 20.0)
block('carmeliteFront', M['honeyPale'], -4.0, 14.0, 27.5, 29.5, TOP - 0.5, TOP + 22.0)
gable_roof('carmeliteRoof', M['honeyPale'], -4.0 * S, 14.0 * S, (29.0 + FY) * S, (43.0 + FY) * S, G + 0.004 + (TOP + 19.95) * S, 3.0 * S, over=0.002, along='y')
DX, DY = 5.0, 36.0
cylinder('domeDrum', M['honeyPale'], 8.2 * S, 8.0 * S, P(DX, DY, TOP + 20.0), segs=32)
for k in range(12):
    a = 2 * math.pi * k / 12
    c = P(DX + 8.25 * math.cos(a), DY + 8.25 * math.sin(a), 0)
    WIN.append((c.x, c.y, G + 0.004 + (TOP + 21.6) * S, 1.4 * S, 3.6 * S, (math.cos(a), math.sin(a)), 'round'))
lathe('dome', M['domeGrey'], [(8.6 * S, 0.0), (8.4 * S, 2.6 * S), (7.2 * S, 6.2 * S), (4.8 * S, 9.2 * S), (2.0 * S, 10.8 * S), (1.6 * S, 11.0 * S)], P(DX, DY, TOP + 28.0), segs=40, smooth=True)
for k in range(8):
    a = 2 * math.pi * k / 8
    tube(f'domeRib{k}', M['honeyPale'], [P(DX + r * math.cos(a), DY + r * math.sin(a), TOP + 28.0 + z) for r, z in ((8.62, 0.0), (8.42, 2.6), (7.22, 6.2), (4.82, 9.2), (2.02, 10.8))], 0.25 * S)
cylinder('lantern', M['honeyPale'], 1.6 * S, 3.4 * S, P(DX, DY, TOP + 39.0), segs=12)
lathe('lanternCap', M['domeGrey'], [(1.9 * S, 0.0), (1.4 * S, 1.0 * S), (0.3 * S, 2.2 * S), (0.0, 3.4 * S)], P(DX, DY, TOP + 42.4), segs=12, smooth=True)
SX, SY = 30.0, 33.0
block('stPaulsTower', M['honeyPale'], SX - 3.5, SX + 3.5, SY - 3.5, SY + 3.5, TOP - 0.5, TOP + 26.0)
lathe('stPaulsBelfry', M['honey'], [(3.6 * S, 0.0), (3.6 * S, 6.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(SX, SY, TOP + 26.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('stPaulsSpire', M['honeyPale'], [(3.2 * S, 0.0), (0.0, 26.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(SX, SY, TOP + 32.0)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for k in range(8):
    a = 2 * math.pi * k / 8
    c = P(SX + 3.35 * math.cos(a), SY + 3.35 * math.sin(a), 0)
    WIN.append((c.x, c.y, G + 0.004 + (TOP + 27.0) * S, 1.0 * S, 3.6 * S, (math.cos(a), math.sin(a)), 'round'))
glazed('windows', WIN, M['honeyPale'], depth=0.25 * S)


# ------------------------------------------------------------------ the luzzu with its painted eye, and people on the walls
def luzzu(x, y, ang):
    hull = [(-4.5, 0.0), (-3.6, -1.3), (3.6, -1.3), (4.5, 0.0), (3.6, 1.3), (-3.6, 1.3)]
    m = Matrix.Translation(P(x, y, 0.0)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Scale(1.6, 4)     # drawn a little large, to be seen
    for name, mat, z0, z1, k in (('luzzuHull', M['blue'], -0.5, 0.5, 1.0), ('luzzuStripeY', M['yellow'], 0.5, 0.8, 1.01), ('luzzuStripeR', M['red'], 0.8, 1.0, 1.02), ('luzzuGunwale', M['green'], 1.0, 1.2, 1.03)):
        bm_ = bmesh.new()
        add_prism(bm_, [bm_.verts.new(m @ Vector((u * k * S, v * k * S, z0 * S))) for u, v in hull], [bm_.verts.new(m @ Vector((u * k * S, v * k * S, z1 * S))) for u, v in hull])
        finish(name, bm_, mat, smooth_sides=False)
    for sx in (-1, 1):
        box(f'luzzuPost{sx}', M['red'], m @ Vector((sx * 4.5 * S, 0.0, 1.6 * S)), (0.3 * S, 0.3 * S, 1.4 * S), bevel=0)
    for sy in (-1, 1):
        lathe(f'luzzuEye{sy}', M['white'], [(0.0, 0.0), (0.35 * S, 0.0), (0.35 * S, 0.06 * S), (0.0, 0.06 * S)], (0, 0, 0), segs=16,
              matrix=m @ Matrix.Translation((3.3 * S, sy * 1.36 * S, 0.65 * S)) @ Matrix.Rotation(-sy * math.pi / 2, 4, 'X'))
        lathe(f'luzzuPupil{sy}', M['hair'], [(0.0, 0.0), (0.16 * S, 0.0), (0.16 * S, 0.08 * S), (0.0, 0.08 * S)], (0, 0, 0), segs=12,
              matrix=m @ Matrix.Translation((3.35 * S, sy * 1.38 * S, 0.65 * S)) @ Matrix.Rotation(-sy * math.pi / 2, 4, 'X'))


luzzu(-4.0, -34.0, 0.35)
for k, (x, y, shirt) in enumerate(((-30.0, 2.5, 'red'), (-14.0, 2.5, 'blue'), (4.0, 2.5, 'yellow'), (26.0, 2.5, 'green'), (-36.0, -6.0, 'red'))):
    c = P(x, y, TOP)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.65)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('valletta')
