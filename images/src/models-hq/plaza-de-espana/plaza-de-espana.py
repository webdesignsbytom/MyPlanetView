# Seville's Plaza de España in the high-quality look (hq.py), laid out in metres and seen from the park
# across the square: the great half-circle of red brick round it, the arcade along its ground floor with
# the terrace above, its rows of arched windows and its tiled roofs; the central building with its
# portico and crest, and the two tall baroque towers at its ends rising in stages to their lanterns; the
# canal following the curve with its four bridges and balustrades of blue and white tiles and rowing
# boats on it, the tiled benches of the provinces along the wall, the fountain in the middle, and people.
# Run: blender -b --factory-startup -P plaza-de-espana.py -- plaza-de-espana-1024.png 1024 plaza-de-espana.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1929)
M['brickS'] = masonry('sevilleBrick', '#b9603e', '#e2cfae', scale=300, rough=0.85, vary='#a9553a')
M['roofS'] = banded(material('sevilleRoof', '#b5583a', 0.7, vary='#a24c30', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 320.0, strength=0.25)
M['plazaFloor'] = masonry('plazaFloor', '#d9b98f', '#c19c72', scale=120, rough=0.8, vary='#d0ad80')
M['azulejo'] = chequer('azulejo', '#f2efe6', '#2f5fa8', scale=140.0)
M['benchTiles'] = mosaic('provinceTiles', ((3, '#f2efe6'), (2.4, '#2f5fa8'), (1.4, '#e8b84a'), (0.8, '#3f8a5a'), (0.6, '#c9463d')), scale=160.0, mortar='#e9e4d8')
M['canalS'] = material('plazaCanal', '#4f8a8c', 0.1, vary='#5a9799', vary_scale=8, bump=0.04, bump_scale=30)
M['orange'] = material('orangeTree', '#3f6e2e', 0.8, vary='#4a7d36', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.013               # metres to the tile's units
Z0 = G + 0.02           # the square's floor, above the base so the canal can sink into it
C = Vector((0.0, -27.0))    # the middle of the half-circle (metres, before the turn)
R_IN, R_OUT = 95.0, 110.0   # the building's inner and outer faces
END = 84.0                  # the half-circle runs from -END to END degrees round


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def on_ring(r, a):
    return C + r * Vector((math.sin(math.radians(a)), math.cos(math.radians(a))))


def degs(a0, a1, step):
    n = max(1, int(round((a1 - a0) / step)))
    return [a0 + (a1 - a0) * k / n for k in range(n + 1)]


def sector(name, mat, r0, r1, a0, a1, z0, z1, step=1.0):
    """A curved block on the half-circle: from radius r0 to r1, a0 to a1 degrees round, z0 to z1 high."""
    outline = [on_ring(r1, a) for a in degs(a0, a1, step)] + [on_ring(r0, a) for a in reversed(degs(a0, a1, step))]
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(p.x, p.y, z0)) for p in outline], [bm_.verts.new(P(p.x, p.y, z1)) for p in outline])
    return finish(name, bm_, mat, smooth_sides=False)


def curved_roof(name, r0, r1, a0, a1, z0, rise, step=1.0):
    """A pitched roof along the curve, its ridge midway between r0 and r1."""
    rm = (r0 + r1) / 2
    bm_ = bmesh.new()
    arcs = [[bm_.verts.new(P(*on_ring(r, a), z)) for a in degs(a0, a1, step)] for r, z in ((r0, z0), (rm, z0 + rise), (r1, z0))]
    for k in range(len(arcs[0]) - 1):
        bm_.faces.new((arcs[0][k], arcs[0][k + 1], arcs[1][k + 1], arcs[1][k]))
        bm_.faces.new((arcs[1][k], arcs[1][k + 1], arcs[2][k + 1], arcs[2][k]))
        bm_.faces.new((arcs[2][k], arcs[2][k + 1], arcs[0][k + 1], arcs[0][k]))
    for k in (0, -1):
        bm_.faces.new((arcs[0][k], arcs[1][k], arcs[2][k]))
    return finish(name, bm_, M['roofS'], smooth_sides=False)


def frame_at(p, a):
    """Stands a thing built facing -y at point p (metres), facing the half-circle's middle from `a` degrees round."""
    return Matrix.Translation((p.x * S, p.y * S, 0.0)) @ Matrix.Rotation(-math.radians(a), 4, 'Z')


def placed(matrix, build):
    before = set(bpy.data.objects)
    build()
    for ob in set(bpy.data.objects) - before:
        ob.matrix_world = matrix @ ob.matrix_world


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def facing(a):
    """The outward normal of the building's inner face at a degrees (towards the square)."""
    return (-math.sin(math.radians(a)), -math.cos(math.radians(a)))


BEFORE = set(bpy.data.objects)
WIN = []
MID = 9.0               # the central building's half width, in degrees round

# ------------------------------------------------------------------ the half-circle: its wings, arcade and terrace, windows and roofs
for a0, a1 in ((-END, -MID), (MID, END)):
    sector(f'wing{a0:+.0f}', M['brickS'], R_IN, R_OUT, a0, a1, -0.3, 18.0)
    for z, t in ((8.6, 0.5), (17.4, 0.7)):
        sector(f'band{a0:+.0f}{z:.0f}', M['whiteStone'], R_IN - 0.15, R_OUT + 0.15, a0, a1, z, z + t)
    curved_roof(f'roof{a0:+.0f}', R_IN - 0.8, R_OUT + 0.8, a0, a1, 18.05, 5.0)
    bays = degs(a0, a1, 2.5)
    arcade_path(f'arcade{a0:+.0f}', M['brickS'], [tuple(on_ring(R_IN - 3.6, a) * S) for a in bays], 3.45 * S, Z0 + 3.4 * S, 4.4 * S, 1.65 * S)
    for k, a in enumerate(bays):
        p = on_ring(R_IN - 3.3, a)
        cylinder(f'column{a0:+.0f}{k}', M['whiteStone'], 0.32 * S, 3.75 * S, P(p.x, p.y, -0.3), segs=10)
    sector(f'terrace{a0:+.0f}', M['whiteStone'], R_IN - 3.8, R_IN + 0.1, a0, a1, 7.8, 8.3)
    BAL = []
    for a in degs(a0, a1, 0.6):
        p = on_ring(R_IN - 3.65, a)
        BAL.append(P(p.x, p.y, 9.2))
    tube(f'balustradeRail{a0:+.0f}', M['azulejo'], BAL, 0.45 * S)
    sector(f'balustrade{a0:+.0f}', M['azulejo'], R_IN - 3.8, R_IN - 3.5, a0, a1, 8.3, 9.2)
    for j, a in enumerate(bays[:-1]):
        am = a + 1.25
        p = on_ring(R_IN - 0.05, am)
        n = facing(am)
        for z, h in ((10.2, 4.0), (14.2, 2.6)) + (((0.6, 2.6),) if j % 2 == 0 else ()):
            WIN.append((p.x * S, p.y * S, Z0 + z * S, (1.8 if z < 1 else 1.6) * S, h * S, n, 'round'))


# ------------------------------------------------------------------ the central building: its portico, loggia and crest
def central():
    w, d = 30.0, 21.0
    block('central', M['brickS'], -w / 2, w / 2, 0.0, d, -0.3, 24.0)
    for z, t in ((8.6, 0.5), (17.4, 0.7), (23.4, 0.8)):
        block(f'centralBand{z:.0f}', M['whiteStone'], -w / 2 - 0.15, w / 2 + 0.15, -0.15, d + 0.15, z, z + t, bevel=0)
    hip_roof('centralRoof', M['roofS'], 0.0, d / 2 * S, Z0 + 24.15 * S, (w + 1.0) * S, (d + 1.0) * S, 7.0 * S, over=0.0)
    for side in (-1, 1):
        block(f'portalPier{side}', M['whiteStone'], *sorted((side * 3.2, side * 5.0)), -1.2, 0.0, -0.3, 6.5)
    arcade_path('portalArch', M['whiteStone'], [(-5.0 * S, -1.2 * S), (5.0 * S, -1.2 * S)], 1.2 * S, Z0 + 6.5 * S, 3.5 * S, 3.2 * S)
    block('portalDoor', M['door'], -3.2, 3.2, -0.25, 0.05, -0.3, 9.0, bevel=0)
    block('crest', M['whiteStone'], -6.0, 6.0, -0.6, 0.6, 24.0, 29.0)
    bm_ = bmesh.new()
    tri = [(-7.0, 29.0), (7.0, 29.0), (0.0, 33.0)]
    add_prism(bm_, [bm_.verts.new(P(u, -0.8, v)) for u, v in tri], [bm_.verts.new(P(u, 0.8, v)) for u, v in tri])
    finish('crestPediment', bm_, M['whiteStone'], smooth_sides=False)
    lathe('crestShield', M['azulejo'], [(0.0, 0.0), (2.2 * S, 0.0), (2.2 * S, 0.3 * S), (0.0, 0.3 * S)], (0, 0, 0), segs=24,
          matrix=Matrix.Translation(P(0.0, -0.75, 26.5)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for side in (-1, 1):
        for x in (side * 6.5, side * 14.0):
            cylinder(f'pinnacle{x:.0f}', M['whiteStone'], 0.45 * S, 2.6 * S, P(x, 0.2, 24.2), segs=8)
            lathe(f'pinnacleTop{x:.0f}', M['azulejo'], [(0.6 * S, 0.0), (0.0, 1.8 * S)], P(x, 0.2, 26.75), segs=8)


p = on_ring(R_IN - 6.0, 0.0)
mc = frame_at(p, 0.0)
placed(mc, central)
for u in (-11.0, -7.5, 7.5, 11.0):
    for z, h in ((1.0, 4.4), (10.2, 4.0), (14.2, 2.6), (19.4, 2.8)):
        q = mc @ P(u, -0.05, z)
        WIN.append((q.x, q.y, q.z, 2.0 * S, h * S, (0, -1), 'round'))
for u in (-1.8, 0.0, 1.8):
    q = mc @ P(u, -0.05, 10.4)
    WIN.append((q.x, q.y, q.z, 1.4 * S, 5.6 * S, (0, -1), 'round'))


# ------------------------------------------------------------------ the two baroque towers at the ends
def tower(name):
    block(name, M['brickS'], -5.5, 5.5, -5.5, 5.5, -0.3, 38.0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            block(f'{name}Quoin{sx}{sy}', M['whiteStone'], sx * 5.5 - 0.6, sx * 5.5 + 0.6, sy * 5.5 - 0.6, sy * 5.5 + 0.6, -0.3, 38.0, bevel=0)
    for z, t in ((8.6, 0.5), (17.4, 0.7), (28.0, 0.6), (37.4, 1.0)):
        block(f'{name}Band{z:.0f}', M['whiteStone'], -5.75, 5.75, -5.75, 5.75, z, z + t, bevel=0)
    block(name + 'Stage', M['brickS'], -4.5, 4.5, -4.5, 4.5, 38.0, 48.0)
    block(name + 'StageTop', M['whiteStone'], -5.0, 5.0, -5.0, 5.0, 47.6, 48.4, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            cylinder(f'{name}Pin{sx}{sy}', M['whiteStone'], 0.5 * S, 3.0 * S, P(sx * 5.0, sy * 5.0, 38.4), segs=8)
            lathe(f'{name}PinTop{sx}{sy}', M['azulejo'], [(0.65 * S, 0.0), (0.0, 2.0 * S)], P(sx * 5.0, sy * 5.0, 41.35), segs=8)
            cylinder(f'{name}Pin2{sx}{sy}', M['whiteStone'], 0.4 * S, 2.4 * S, P(sx * 4.4, sy * 4.4, 48.4), segs=8)
            lathe(f'{name}Pin2Top{sx}{sy}', M['azulejo'], [(0.5 * S, 0.0), (0.0, 1.6 * S)], P(sx * 4.4, sy * 4.4, 50.75), segs=8)
    lathe(name + 'Lantern', M['brickS'], [(3.9 * S, 0.0), (3.9 * S, 8.0 * S)], P(0, 0, 48.4), segs=8)
    lathe(name + 'LanternTop', M['whiteStone'], [(4.3 * S, 0.0), (4.3 * S, 0.7 * S), (3.0 * S, 0.7 * S), (3.0 * S, 6.0 * S), (3.4 * S, 6.0 * S), (3.4 * S, 6.6 * S)], P(0, 0, 56.3), segs=8)
    lathe(name + 'Dome', M['azulejo'], [(3.2 * S, 0.0), (3.0 * S, 1.6 * S), (2.2 * S, 3.4 * S), (1.0 * S, 4.6 * S), (0.0, 5.0 * S)], P(0, 0, 62.8), segs=24, smooth=True)
    lathe(name + 'Spire', M['whiteStone'], [(0.8 * S, 0.0), (0.8 * S, 2.0 * S), (0.3 * S, 2.4 * S), (0.0, 6.0 * S)], P(0, 0, 67.6), segs=8)
    lathe(name + 'Finial', M['gold'], [(0.0, 0.0), (0.4 * S, 0.4 * S), (0.0, 1.4 * S)], P(0, 0, 73.4), segs=8, smooth=True)


TWIN = []
for side in (-1, 1):
    a = side * 85.5
    p = on_ring((R_IN + R_OUT) / 2, a)
    mt = frame_at(p, a)
    placed(mt, lambda: tower(f'tower{side}'))
    for nx, ny in ((0, -1), (-1, 0), (1, 0)):
        for z, h in ((12.0, 3.4), (20.0, 4.0), (30.0, 4.4)):
            q = mt @ P(nx * 5.55, ny * 5.55, z)
            nv = mt.to_3x3() @ Vector((nx, ny, 0))
            WIN.append((q.x, q.y, q.z, 1.8 * S, h * S, (nv.x, nv.y), 'round'))
        for u in (-1.8, 1.8):
            q = mt @ P(nx * 4.55 + (u if ny else 0.0), ny * 4.55 + (u if nx else 0.0), 40.6)
            nv = mt.to_3x3() @ Vector((nx, ny, 0))
            TWIN.append((q.x, q.y, q.z, 1.6 * S, 5.0 * S, (nv.x, nv.y), 'round'))
glazed('windows', WIN, M['whiteStone'], depth=0.3 * S)
glazed('belfries', TWIN, M['whiteStone'], depth=0.3 * S)

# ------------------------------------------------------------------ the canal, its tiled balustrades and bridges, the rowing boats
C0, C1, CEND = 62.0, 73.0, 78.0
sector('canal', M['canalS'], C0, C1, -CEND, CEND, -1.2, -0.7)
for r0, r1 in ((C0 - 1.0, C0), (C1, C1 + 1.0)):
    sector(f'canalKerb{r0:.0f}', M['whiteStone'], r0, r1, -CEND, CEND, -1.2, 0.25)
for r0, r1 in ((C0 - 0.95, C0 - 0.45), (C1 + 0.45, C1 + 0.95)):
    sector(f'canalBalustrade{r0:.0f}', M['azulejo'], r0, r1, -CEND, CEND, 0.25, 1.15)
for k, a in enumerate((-CEND, CEND)):
    sector(f'canalEnd{k}', M['whiteStone'], C0 - 1.0, C1 + 1.0, a - 0.9 if a > 0 else a, a if a > 0 else a + 0.9, -1.2, 1.15)
# the square's floor round the sunk canal: inside it, outside it, and the park side across the front
CY = C.y * S
slab('floorInside', M['plazaFloor'], [tuple(on_ring(C0 - 1.0, a) * S) for a in degs(-90.0, 90.0, 2)], G - 0.004, Z0, margin=0.02)
slab('floorOutside', M['plazaFloor'], [tuple(on_ring(C1 + 1.0, a) * S) for a in degs(-90.0, 90.0, 2)] + [(2.0, CY), (2.0, 2.0), (-2.0, 2.0), (-2.0, CY)], G - 0.004, Z0, margin=0.02)
slab('floorFront', M['plazaFloor'], [(-2.0, CY), (2.0, CY), (2.0, -2.0), (-2.0, -2.0)], G - 0.004, Z0, margin=0.02)
for k, (a0, a1) in enumerate(((-90.0, -CEND), (CEND, 90.0))):
    sector(f'floorCanalEnd{k}', M['plazaFloor'], C0 - 1.0, C1 + 1.0, a0, a1, -1.6, 0.0)


def bridge():
    span, rise = 9.0, 2.0
    prof = []
    for k in range(17):
        y = -span + 2 * span * k / 16
        prof.append((y, 0.25 + rise * (1 - (y / span) ** 2)))
    arch = []
    for k in range(13):
        t = math.pi * k / 12
        arch.append((4.8 * math.cos(t), -1.2 + 1.9 * math.sin(t)))
    outline = [(-span, -1.2)] + [(-4.8, -1.2)] + list(reversed(arch))[1:-1] + [(4.8, -1.2), (span, -1.2)] + list(reversed(prof))
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(-3.0, y, z)) for y, z in outline], [bm_.verts.new(P(3.0, y, z)) for y, z in outline])
    finish('bridge', bm_, M['brickS'], smooth_sides=False)
    for x in (-3.0, 3.0):
        bm_ = bmesh.new()
        rail = [(y, z) for y, z in prof] + [(y, z + 1.0) for y, z in reversed(prof)]
        add_prism(bm_, [bm_.verts.new(P(x - 0.3, y, z)) for y, z in rail], [bm_.verts.new(P(x + 0.3, y, z)) for y, z in rail])
        finish(f'bridgeRail{x:.0f}', bm_, M['azulejo'], smooth_sides=False)
        for y in (-span, span):
            cylinder(f'bridgeLamp{x:.0f}{y:.0f}', M['whiteStone'], 0.35 * S, 3.2 * S, P(x, y, 0.25), segs=8)
            lathe(f'bridgeLampTop{x:.0f}{y:.0f}', M['azulejo'], [(0.6 * S, 0.0), (0.0, 1.2 * S)], P(x, y, 3.4), segs=8)


for a in (-48.0, -16.0, 16.0, 48.0):
    p = on_ring((C0 + C1) / 2, a)
    placed(frame_at(p, a), bridge)


def rowing_boat(colour):
    hull = [(-2.2, 0.0), (-1.2, -0.8), (1.6, -0.8), (2.4, 0.0), (1.6, 0.8), (-1.2, 0.8)]
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(x, y, -1.05)) for x, y in hull], [bm_.verts.new(P(x, y, -0.55)) for x, y in hull])
    finish('boat', bm_, colour, smooth_sides=False)
    block('boatSeat', M['wood'], -0.3, 0.3, -0.7, 0.7, -0.75, -0.5, bevel=0)


for k, (a, r, colour) in enumerate(((-33.0, 66.0, M['white']), (-2.0, 69.0, M['blue']), (31.0, 66.5, M['white']), (64.0, 68.5, M['blue']))):
    p = on_ring(r, a)
    placed(frame_at(p, a + rng.uniform(-12, 12)), lambda: rowing_boat(colour))

# ------------------------------------------------------------------ the provinces' tiled benches along the wall, the fountain, the square's floor
for k, a in enumerate(degs(-END + 3.0, END - 3.0, 4.0)):
    if abs(a) < MID + 2.0:
        continue
    p = on_ring(R_IN - 6.0, a)

    def bench():
        block('benchSeat', M['benchTiles'], -2.4, 2.4, -0.6, 0.6, -0.3, 0.5)
        block('benchBack', M['benchTiles'], -2.4, 2.4, 0.6, 1.0, -0.3, 2.2)
    placed(frame_at(p, a), bench)
c = P(C.x, C.y, 0)
lathe('fountainRim', M['whiteStone'], [(10.0 * S, 0.0), (10.0 * S, 0.8 * S), (9.4 * S, 0.8 * S), (9.4 * S, 0.3 * S), (0.0, 0.3 * S)], c, segs=48)
cylinder('fountainWater', M['water'], 9.4 * S, 0.62 * S, c, segs=48)
lathe('fountainTiers', M['whiteStone'], [(r * S, z * S) for r, z in ((2.4, 0.3), (1.2, 1.2), (1.0, 3.0), (3.6, 3.4), (3.4, 3.8), (0.8, 4.0), (0.6, 5.6), (2.0, 6.0), (1.8, 6.3), (0.4, 6.4), (0.3, 7.6), (0.0, 8.0))], c, segs=32, smooth=True)
cylinder('fountainBowlWater', M['water'], 3.35 * S, 0.12 * S, P(C.x, C.y, 3.75), segs=32)
for k in range(8):
    t = 2 * math.pi * k / 8
    tube(f'jet{k}', M['water'], [P(C.x + 3.4 * math.cos(t), C.y + 3.4 * math.sin(t), 3.8), P(C.x + 5.6 * math.cos(t), C.y + 5.6 * math.sin(t), 4.6), P(C.x + 7.2 * math.cos(t), C.y + 7.2 * math.sin(t), 0.7)], 0.12 * S)

# ------------------------------------------------------------------ the park side: orange trees and palms, and people
TREES = []
SPOTS = [(-90.0, -24.0), (90.0, -24.0)]
for side in (-1, 1):
    xa, xb = sorted((side * 12.0, side * 120.0))
    slab(f'parkLawn{side}', M['lawn'], [(xa * S, -36.0 * S), (xb * S, -36.0 * S), (xb * S, -130.0 * S), (xa * S, -130.0 * S)], Z0 - 0.002, Z0 + 0.15 * S, margin=0.04)
    for j, y in enumerate((-44.0, -58.0, -72.0, -86.0, -100.0)):
        for i in range(7):
            x = side * (22.0 + 13.0 * i + (6.5 if j % 2 else 0.0))
            if math.hypot(x, y) * S < 1.36:
                SPOTS.append((x, y))
for k, (x, y) in enumerate(SPOTS):
    q = P(x, y, 0)
    cylinder(f'treeTrunk{k}', M['trunk'], 0.3 * S, 2.4 * S, (q.x, q.y, Z0), segs=6)
    TREES.append(((q.x, q.y, Z0 + 4.4 * S), 3.0 * S, 0.9))
blob_cloud('orangeTrees', M['orange'], TREES)
for k, (r, a, shirt) in enumerate(((40.0, -30.0, 'red'), (30.0, 20.0, 'blue'), (48.0, 5.0, 'yellow'), (20.0, -55.0, 'green'), (52.0, 40.0, 'red'), (80.0, -40.0, 'blue'),
                                   (83.0, 25.0, 'yellow'), (84.0, -10.0, 'green'), (45.0, -70.0, 'red'), (35.0, 65.0, 'blue'))):
    p = on_ring(r, a)
    person(f'p{k}', p.x * S, p.y * S, rng.random() * 6, shirt, z=Z0, scale=0.6)

R = Matrix.Rotation(math.radians(-32.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('plaza-de-espana')
