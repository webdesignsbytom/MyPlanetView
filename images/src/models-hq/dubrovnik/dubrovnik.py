# Dubrovnik's old town in the high-quality look (hq.py), laid out in metres on the Adriatic: the mass of
# orange-red roofs climbing the slope inside the massive pale walls, crenellated, with their towers; the
# Stradun straight through the middle from the Pile gate to the bell tower; the round Minčeta tower at the
# high north-west corner, the Bokar and St John forts on the sea, the Revelin by the land gate, the
# domes of St Blaise and the cathedral, the Franciscans' bell tower; Fort Lovrijenac on its own rock to
# the west; the old port with its breakwater and boats; the scrubby slopes of Srđ rising behind; people.
# Run: blender -b --factory-startup -P dubrovnik.py -- dubrovnik-1024.png 1024 dubrovnik.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1667)
M['limeD'] = material('dubrovnikStone', '#ddd3bd', 0.8, vary='#cfc4ab', vary_scale=18, bump=0.25, bump_scale=150)
M['limeDark'] = material('dubrovnikStoneDark', '#c4b89d', 0.85, vary='#b6a98d', vary_scale=18, bump=0.25, bump_scale=150)
M['rock'] = material('dalmatianRock', '#b3aa98', 0.9, vary='#9c9382', vary_scale=14, bump=0.5, bump_scale=80)
M['scrub'] = material('srdScrub', '#7d8a55', 0.9, vary='#6d7a4a', vary_scale=14, bump=0.3, bump_scale=160)
M['adriatic'] = material('adriatic', '#1f6e96', 0.06, vary='#2a7ea6', vary_scale=3, coat=0.7, bump=0.12, bump_scale=40)
M['stradun'] = material('stradun', '#e9e3d4', 0.4, vary='#ddd6c5', vary_scale=40, coat=0.3)
M['plaster'] = material('dubrovnikPlaster', '#e3d6bb', 0.85, vary='#d6c8aa', vary_scale=18)
TILES = [banded(material(f'tiles{k}', c, 0.7, vary=c, vary_scale=12, bump=0.12, bump_scale=200), 'Z', 300.0, strength=0.25) for k, c in enumerate(('#c1653d', '#b5572f', '#cf7444', '#a9532f', '#c96a3c'))]
M['greenShutter'] = material('dubrovnikShutters', '#4b6b44', 0.6)
M['cypressD'] = material('cypressD', '#30502c', 0.85, vary='#3a5c33', vary_scale=20)

S = 0.0048              # metres to the tile's units
OX, OY = 0.1, 0.15      # where the town's middle falls on the tile
SEA = G + 0.002


def T(x, y):
    return (OX + x * S, OY + y * S)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


WALLS = [(-225.0, -60.0), (-200.0, -110.0), (-80.0, -125.0), (60.0, -118.0), (170.0, -100.0), (215.0, -60.0), (215.0, 40.0), (190.0, 95.0),
         (100.0, 120.0), (-60.0, 128.0), (-170.0, 130.0), (-230.0, 60.0)]
EDGES = list(zip(WALLS, WALLS[1:] + WALLS[:1]))
LOVRIJENAC = (-270.0, -95.0)


def outside(px, py):
    inside = False
    best = 1e9
    for (ax, ay), (bx, by) in EDGES:
        if (ay > py) != (by > py) and px < ax + (py - ay) * (bx - ax) / (by - ay):
            inside = not inside
        dx, dy = bx - ax, by - ay
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(px - ax - t * dx, py - ay - t * dy))
    return -best if inside else best


def town_m(y):
    """The town's ground (metres above the sea) at y metres north: the rock above the sea in the south,
    climbing to the land walls in the north."""
    return 9.0 + 24.0 * smooth((y + 110.0) / 240.0)


def ground_m(x, y):
    d = outside(x, y)
    if d <= 0:
        return town_m(y)
    land = (26.0 + max(0.0, y - 135.0) * 0.42) * smooth((y - 55.0) / 40.0)       # Srđ's foot, climbing beyond the land walls
    coast = town_m(y) * (1.0 - smooth(d / 16.0))
    lx, ly = LOVRIJENAC
    rock = 34.0 * smooth(2.2 * (1.0 - math.hypot(x - lx, y - ly) / 40.0))
    return max(land, coast, rock)


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.2)
    return ground_m((x - OX) / S, (y - OY) / S) * S * rim


def pick(z, nz, x, y):
    mx, my = (x - OX) / S, (y - OY) / S
    if outside(mx, my) <= 0:
        return 0
    if z < 0.003:
        return 2
    return 1 if (my < 40.0 or nz < 0.45) else 3


ground = terrain('ground', H, [M['limeDark'], M['rock'], M['rock'], M['scrub']], pick, rings=230, segs=600)
slab('adriatic', M['adriatic'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, SEA + 0.004, margin=0.02)


def Z(x, y):
    return G + H(*T(x, y))


def P(x, y, z):
    """A point x metres east and y north of the town's middle, z metres above the ground there."""
    tx, ty = T(x, y)
    return Vector((tx, ty, Z(x, y) + z * S))


# ------------------------------------------------------------------ the walls round the town and their towers
WALLBM, MERLONS = bmesh.new(), bmesh.new()
for k, ((ax, ay), (bx, by)) in enumerate(EDGES):
    L = math.hypot(bx - ax, by - ay)
    ang = math.atan2(by - ay, bx - ax)
    land = (ay + by) / 2 > 60.0
    n = max(1, int(L / 6.0))
    for j in range(n):
        u0, u1 = j / n, (j + 1) / n
        mx, my = ax + (bx - ax) * (u0 + u1) / 2, ay + (by - ay) * (u0 + u1) / 2
        top = G + town_m(my) * S + (16.0 if land else 10.0) * S
        bottom = SEA - 0.01
        c = Vector((*T(mx, my), (top + bottom) / 2))
        bmesh.ops.create_cube(WALLBM, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((L / n * S + 0.0004, 6.0 * S, top - bottom, 1)))
        if j % 2 == 0:
            bmesh.ops.create_cube(MERLONS, size=1.0, matrix=Matrix.Translation(Vector((c.x, c.y, top + 0.7 * S))) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Translation((0, -2.6 * S, 0)) @ Matrix.Diagonal((2.4 * S, 0.9 * S, 1.6 * S, 1)))
finish('walls', WALLBM, M['limeD'], smooth_sides=False)


def tower(name, x, y, r, h, square=False):
    base = SEA - 0.01
    top = G + town_m(y) * S + h * S
    c = Vector((*T(x, y), base))
    if square:
        box(name, M['limeD'], Vector((c.x, c.y, (base + top) / 2)), (2 * r * S, 2 * r * S, top - base), bevel=0.0005)
    else:
        cylinder(name, M['limeD'], r * S, top - base, (c.x, c.y, base), segs=28)
    for k in range(int(2 * math.pi * r / 3.0)):
        a = 2 * math.pi * k / int(2 * math.pi * r / 3.0)
        bmesh.ops.create_cube(MERLONS, size=1.0, matrix=Matrix.Translation((c.x + (r - 0.5) * S * math.cos(a), c.y + (r - 0.5) * S * math.sin(a), top + 0.7 * S)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Diagonal((0.9 * S, 1.6 * S, 1.6 * S, 1)))


for k, (x, y) in enumerate(WALLS):
    if (x, y) != (-170.0, 130.0):                                      # Minčeta stands there
        tower(f'wallTower{k}', x, y, 7.0, 15.0 if y > 60 else 12.0, square=(k % 2 == 1))
tower('mincetaBase', -170.0, 130.0, 17.0, 14.0)
tower('minceta', -170.0, 130.0, 11.0, 30.0)
tower('bokar', -212.0, -88.0, 12.0, 14.0)
tower('stJohn', 200.0, -82.0, 16.0, 16.0)
tower('revelin', 205.0, 82.0, 18.0, 17.0, square=True)

# ------------------------------------------------------------------ Fort Lovrijenac on its rock outside the west wall
lx, ly = LOVRIJENAC
ltop = G + 36.0 * S
tri = [T(lx - 22.0, ly - 14.0), T(lx + 18.0, ly - 18.0), T(lx + 8.0, ly + 22.0)]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new((x, y, ltop - 6.0 * S)) for x, y in tri], [bm_.verts.new((x, y, ltop + 16.0 * S)) for x, y in tri])
finish('lovrijenac', bm_, M['limeD'], smooth_sides=False)
for (x0, y0), (x1, y1) in zip(tri, tri[1:] + tri[:1]):
    L = math.hypot(x1 - x0, y1 - y0)
    ang = math.atan2(y1 - y0, x1 - x0)
    for k in range(int(L / (2.6 * S))):
        u = (k + 0.5) / int(L / (2.6 * S))
        bmesh.ops.create_cube(MERLONS, size=1.0, matrix=Matrix.Translation((x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, ltop + 16.7 * S)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((1.4 * S, 1.0 * S, 1.5 * S, 1)))

# ------------------------------------------------------------------ the Stradun, the houses in their lanes, the churches and the bell tower
slab('stradunSlab', M['stradun'], [T(-215.0, -6.0), T(175.0, -6.0), T(175.0, 6.0), T(-215.0, 6.0)], G, G + (town_m(0.0) + 0.4) * S, margin=0.05)
LANDMARKS = [(158.0, 0.0, 24.0, 30.0), (120.0, -20.0, 40.0, 26.0), (110.0, -70.0, 56.0, 44.0), (-185.0, 18.0, 36.0, 30.0)]
HOUSES = bmesh.new()
ROOFB = [bmesh.new() for _ in TILES]
WIN = []
for gx in range(-30, 31):
    for gy in range(-18, 19):
        x, y = gx * 7.4, gy * 7.4
        if abs(y) < 9.0 or gx % 4 == 0 or (gy % 5 == 0 and y < 0) or outside(x, y) > -11.0:
            continue
        if any(abs(x - lx_) < w / 2 + 4 and abs(y - ly_) < d / 2 + 4 for lx_, ly_, w, d in LANDMARKS):
            continue
        w, d, h = rng.uniform(6.2, 7.0), rng.uniform(6.2, 7.0), rng.uniform(11.0, 17.0)
        z0 = G + town_m(y) * S
        bmesh.ops.create_cube(HOUSES, size=1.0, matrix=Matrix.Translation((*T(x, y), z0 + (h - 3.0) / 2 * S)) @ Matrix.Diagonal((w * S, d * S, (h + 3.0) * S, 1)))
        rb = ROOFB[rng.randrange(len(TILES))]
        top = z0 + h * S
        cx, cy = T(x, y)
        hw, hd, rise = (w / 2 + 0.4) * S, (d / 2 + 0.4) * S, 2.6 * S
        v = [rb.verts.new(p) for p in ((cx - hw, cy - hd, top), (cx + hw, cy - hd, top), (cx + hw, cy + hd, top), (cx - hw, cy + hd, top), (cx, cy, top + rise))]
        for f in ((v[0], v[1], v[4]), (v[1], v[2], v[4]), (v[2], v[3], v[4]), (v[3], v[0], v[4]), (v[3], v[2], v[1], v[0])):
            rb.faces.new(f)
        if gy < 0 and rng.random() < 0.7:
            WIN.append((cx, cy - d / 2 * S - 0.05 * S, z0 + (h - 5.0) * S, 1.0 * S, 1.6 * S, (0, -1), 'rect'))
finish('houses', HOUSES, M['plaster'], smooth_sides=False)
for k, rb in enumerate(ROOFB):
    finish(f'roofs{k}', rb, TILES[k], smooth_sides=False)
glazed('houseWindows', WIN, M['greenShutter'], depth=0.3 * S, bars=False)


def church(name, x, y, w, d, h, dome_r, dome_h):
    z0 = G + town_m(y) * S
    box(name, M['limeD'], Vector((*T(x, y), z0 + (h - 3.0) / 2 * S)), (w * S, d * S, (h + 3.0) * S), bevel=0.0005)
    c = T(x, y)
    cylinder(name + 'Drum', M['limeD'], dome_r * S, 4.0 * S, (c[0], c[1], z0 + (h - 0.1) * S), segs=24)
    lathe(name + 'Dome', TILES[3], [(r * S, z * S) for r, z in ((dome_r + 0.3, 0.0), (dome_r, dome_h * 0.4), (dome_r * 0.55, dome_h * 0.85), (0.0, dome_h))], (c[0], c[1], z0 + (h + 3.8) * S), segs=24, smooth=True)


church('stBlaise', 120.0, -20.0, 22.0, 30.0, 16.0, 6.0, 7.0)
church('cathedral', 110.0, -70.0, 26.0, 44.0, 20.0, 8.0, 10.0)
for name, x, y, h, cap in (('bellTower', 158.0, 0.0, 31.0, 'dome'), ('franciscan', -185.0, 18.0, 40.0, 'spire')):
    z0 = G + town_m(y) * S
    box(name, M['limeD'], Vector((*T(x, y), z0 + (h - 3.0) / 2 * S)), (7.0 * S, 7.0 * S, (h + 3.0) * S), bevel=0.0005)
    c = T(x, y)
    if cap == 'dome':
        lathe(name + 'Cap', M['copperGreen'], [(4.0 * S, 0.0), (3.6 * S, 2.0 * S), (1.5 * S, 4.5 * S), (0.0, 5.5 * S)], (c[0], c[1], z0 + (h - 0.1) * S), segs=16, smooth=True)
    else:
        lathe(name + 'Cap', M['limeDark'], [(4.0 * S, 0.0), (0.0, 9.0 * S)], (c[0], c[1], z0 + (h - 0.1) * S), segs=8)
    WIN_ = [(c[0], c[1] - 3.55 * S, z0 + (h - 8.0) * S, 2.0 * S, 4.5 * S, (0, -1), 'round')]
    glazed(name + 'Opening', WIN_, M['limeDark'], glass=M['bronze'], depth=0.3 * S)
finish('battlements', MERLONS, M['limeD'], smooth_sides=False)

# ------------------------------------------------------------------ the old port: its breakwater and boats; cypresses; people
pts = [T(225.0, -30.0), T(275.0, -40.0), T(290.0, -20.0), T(281.0, -14.0), T(270.0, -28.0), T(225.0, -21.0)]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new((x, y, SEA - 0.01)) for x, y in pts], [bm_.verts.new((x, y, SEA + 5.0 * S)) for x, y in pts])
finish('breakwater', bm_, M['limeDark'], smooth_sides=False)
for k, (x, y, rot) in enumerate(((240.0, 10.0, 0.3), (255.0, 30.0, -0.4), (232.0, 45.0, 0.9), (265.0, 0.0, 0.1))):
    m = Matrix.Translation((*T(x, y), SEA)) @ Matrix.Rotation(rot, 4, 'Z')
    box_m(f'boat{k}', M['white'], m @ Matrix.Translation((0, 0, 0.8 * S)), (10.0 * S, 3.4 * S, 1.8 * S), bevel=0.001)
    box_m(f'boatCabin{k}', M['limeDark'], m @ Matrix.Translation((-1.0 * S, 0, 2.4 * S)), (4.0 * S, 2.4 * S, 1.6 * S), bevel=0.001)
for k, (x, y) in enumerate(((-120.0, 150.0), (-40.0, 155.0), (60.0, 150.0), (150.0, 135.0), (-200.0, 150.0))):
    c = T(x, y)
    if math.hypot(*c) < 1.35:
        cypress(f'cypress{k}', c[0], c[1], h=0.07, r=0.012, z=Z(x, y) - 0.002)
for k, (x, y, shirt) in enumerate(((-150.0, 0.0, 'red'), (-80.0, 2.0, 'blue'), (0.0, -2.0, 'yellow'), (80.0, 3.0, 'green'), (140.0, -3.0, 'red'))):
    c = T(x, y)
    person(f'p{k}', c[0], c[1], rng.random() * 6, shirt, z=G + (town_m(y) + 0.4) * S, scale=0.55)

render('dubrovnik')
