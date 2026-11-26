# The Tower of London in the high-quality look (hq.py), drawn to its real proportions (laid out in
# metres): the White Tower in the middle, the Conqueror's keep of pale stone, its three square turrets
# and one round one under their lead caps and gilded vanes, its battlements and round-headed windows;
# the inner curtain wall and its towers round the green of the inner ward, the long Waterloo Barracks
# and the Tudor houses by the green; the outer wall, the grassy moat round it all and the Thames along
# the front with Traitors' Gate; and people (Yeoman Warders among them).
# Run: blender -b --factory-startup -P tower-of-london.py -- tower-of-london-1024.png 1024 tower-of-london.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1078)
M['caen'] = material('caenStone', '#e6e0d2', 0.65, vary='#d7d0c0', vary_scale=22, bump=0.2, bump_scale=140)
M['ragstone'] = masonry('ragstone', '#bcb19f', '#958b7b', scale=110, rough=0.85, vary='#ada291')
M['leadCap'] = material('leadCap', '#7c868d', 0.45, vary='#707a82', vary_scale=12, metallic=0.3)
M['brickRed'] = material('barracksBrick', '#b98f6a', 0.75, vary='#a98060', vary_scale=20, bump=0.12, bump_scale=160)
M['timber'] = material('timberDark', '#4a3526', 0.7)
M['plaster'] = material('plasterWhite', '#efe9dc', 0.7)
M['thames'] = material('thames', '#4f7a85', 0.08, vary='#5a8690', vary_scale=3, coat=0.5, bump=0.1, bump_scale=40)
M['slateRoof'] = M['slate']

S = 0.0111              # metres to the tile's units
F = 1.35                # the White Tower drawn this much bigger than the walls round it, so it leads
Z0 = G + 0.006


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def battlements(name, mat, pts, z, size=1.2, closed=True):
    """Merlons along a wall's top, from point to point (metres)."""
    bm = bmesh.new()
    segs = list(zip(pts, pts[1:] + ([pts[0]] if closed else [])))
    for (x0, y0), (x1, y1) in segs:
        L = math.hypot(x1 - x0, y1 - y0)
        n = max(1, int(L / (2 * size)))
        a = math.atan2(y1 - y0, x1 - x0)
        for k in range(n):
            t = (k + 0.25) / n
            bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z + size * 0.5)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Diagonal((size * S, 1.4 * S, size * S, 1)))
    finish(name, bm, mat, smooth_sides=False)


def wall(name, mat, pts, h, thick, closed=True):
    """A curtain wall along a path (metres), with battlements."""
    for k, ((x0, y0), (x1, y1)) in enumerate(zip(pts, pts[1:] + ([pts[0]] if closed else []))):
        L = math.hypot(x1 - x0, y1 - y0)
        a = math.atan2(y1 - y0, x1 - x0)
        box(f'{name}{k}', mat, P((x0 + x1) / 2, (y0 + y1) / 2, h / 2), ((L + thick) * S, thick * S, h * S), rot_z=a, bevel=0.002)
    battlements(name + 'Merlons', mat, pts, h, closed=closed)


def round_tower(name, mat, x, y, r, h):
    cylinder(name, mat, r * S, h * S, P(x, y, -0.2), segs=32)
    bm = bmesh.new()
    for k in range(int(2 * math.pi * r / 2.4)):
        a = 2 * math.pi * k / int(2 * math.pi * r / 2.4)
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(x + (r - 0.6) * math.cos(a), y + (r - 0.6) * math.sin(a), h + 0.6)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Diagonal((1.4 * S, 1.2 * S, 1.2 * S, 1)))
    finish(name + 'Merlons', bm, mat, smooth_sides=False)


# ------------------------------------------------------------------ the moat, the river, the wards
slab('thames', M['thames'], [(-2, -2), (2, -2), (2, -1.22), (-2, -1.22)], G - 0.004, G + 0.002, margin=0.02)
slab('wharf', M['paving'], [(-2, -1.22), (2, -1.22), (2, -1.1), (-2, -1.1)], G - 0.004, Z0 + 0.004, margin=0.02)
slab('moat', M['lawn'], [(-2, -1.1), (2, -1.1), (2, 2), (-2, 2)], G - 0.004, Z0 - 0.002, margin=0.02)
OUT = [(-88, -84), (88, -84), (92, 80), (-92, 84)]
slab('outerWard', M['paving'], [P(x, y, 0).xy[:] for x, y in [(-86, -82), (86, -82), (90, 78), (-90, 82)]], G - 0.004, Z0 + 0.001, margin=0.03)
INNER = [(-60, -58), (62, -58), (64, 56), (-62, 58)]
slab('innerGreen', M['lawn'], [P(x, y, 0).xy[:] for x, y in INNER], G - 0.004, Z0 + 0.003, margin=0.03)

# ------------------------------------------------------------------ the outer and inner walls and their towers
wall('outerWall', M['ragstone'], OUT, 6.0, 3.0)
for k, (x, y) in enumerate(OUT):
    round_tower(f'outerBastion{k}', M['ragstone'], x, y, 7.0, 8.0)
wall('innerWall', M['ragstone'], INNER, 11.0, 3.5)
for k, (x, y) in enumerate(INNER + [(0, -58), (63, 0), (0, 57), (-61, 0)]):
    round_tower(f'innerTower{k}', M['ragstone'], x, y, 7.5 if k < 4 else 6.0, 15.0 if k < 4 else 13.5)
# Traitors' Gate: the river arch through St Thomas's Tower on the outer wall
box('stThomasTower', M['ragstone'], P(-20, -86, 6.0), (26 * S, 9 * S, 12 * S), bevel=0.002)
windows('traitorsGate', M['door'], [((-20) * S, (-90.6) * S, Z0 - 0.002, 12 * S, 7 * S, (0, -1), 'round')], depth=0.5 * S)
gable_roof('stThomasRoof', M['slateRoof'], -33 * S, -7 * S, (-90.5) * S, (-81.5) * S, Z0 + 12 * S, 0.06, over=0.004)

# ------------------------------------------------------------------ the White Tower
W, D, H = 36.0 * F, 32.6 * F, 27.5 * F
box('whiteTower', M['caen'], P(0, 6, H / 2), (W * S, D * S, H * S), bevel=0.002)
for sx in (-1, 1):          # its pilaster buttresses
    for k in range(5):
        x = -W / 2 + W * k / 4
        box(f'pilasterS{sx}{k}', M['caen'], P(x, 6 + sx * (D / 2 + 0.4), H / 2), (1.6 * F * S, 0.8 * S, H * S), bevel=0)
battlements('whiteMerlons', M['caen'], [(-W / 2 + 0.7, 6 - D / 2 + 0.7), (W / 2 - 0.7, 6 - D / 2 + 0.7), (W / 2 - 0.7, 6 + D / 2 - 0.7), (-W / 2 + 0.7, 6 + D / 2 - 0.7)], H, size=1.1)
TUR = [(-W / 2, 6 - D / 2, 'square'), (W / 2, 6 - D / 2, 'square'), (-W / 2, 6 + D / 2, 'square'), (W / 2, 6 + D / 2, 'round')]
for k, (x, y, kind) in enumerate(TUR):
    if kind == 'round':
        cylinder(f'turret{k}', M['caen'], 4.2 * F * S, (H + 8.0 * F) * S, P(x, y, 0), segs=24)
    else:
        box(f'turret{k}', M['caen'], P(x, y, (H + 8.0 * F) / 2), (7.4 * F * S, 7.4 * F * S, (H + 8.0 * F) * S), bevel=0.002)
    # the lead ogee cap and its gilded vane
    lathe(f'turretCap{k}', M['leadCap'], [(r * F * S, z * F * S) for r, z in ((4.6, 0), (4.8, 1.0), (4.0, 2.6), (2.2, 4.2), (0.8, 5.6), (0.6, 6.4), (0.0, 6.8))], P(x, y, H + 8.0 * F), segs=8 if kind == 'square' else 24, smooth=kind != 'square', matrix=None)
    cylinder(f'vaneRod{k}', M['gold'], 0.15 * F * S, 3.0 * F * S, P(x, y, H + 14.6 * F), segs=6)
    lathe(f'vaneCrown{k}', M['gold'], [(0.0, 0), (0.7 * F * S, 0.3 * F * S), (0.5 * F * S, 1.0 * F * S), (0.0, 1.2 * F * S)], P(x, y, H + 17.2 * F), segs=10, smooth=True)
# its round-headed windows, two rows round all four sides, framed in pale stone
OPEN = []
for z0, h in ((9.0 * F, 3.6 * F), (17.0 * F, 4.2 * F)):
    for k in range(4):
        x = -W / 2 + W * (k + 0.5) / 4
        OPEN.append((x * S, (6 - D / 2 - 0.05) * S, Z0 + z0 * S, 1.8 * F * S, h * S, (0, -1), 'round'))
        OPEN.append((x * S, (6 + D / 2 + 0.05) * S, Z0 + z0 * S, 1.8 * F * S, h * S, (0, 1), 'round'))
    for k in range(4):
        y = 6 - D / 2 + D * (k + 0.5) / 4
        OPEN.append(((-W / 2 - 0.05) * S, y * S, Z0 + z0 * S, 1.8 * F * S, h * S, (-1, 0), 'round'))
        OPEN.append(((W / 2 + 0.05) * S, y * S, Z0 + z0 * S, 1.8 * F * S, h * S, (1, 0), 'round'))
glazed('whiteWindows', OPEN, M['whiteStone'], depth=0.5 * S, bars=False)
# the wooden stair up to its door on the south side
box('forebuilding', M['caen'], P(-8 * F, 6 - D / 2 - 3.5, 5.0), (12 * S, 7 * S, 10 * S), bevel=0.002)
box('stairWood', M['wood'], P(-8 * F - 8, 6 - D / 2 - 4.5, 2.5), (6 * S, 2.6 * S, 5 * S), bevel=0)

# ------------------------------------------------------------------ the Waterloo Barracks and the Tudor houses by the green
box('barracks', M['ragstone'], P(0, 44, 7.0), (78 * S, 13 * S, 14 * S), bevel=0.002)
gable_roof('barracksRoof', M['slateRoof'], -39 * S, 39 * S, 37.5 * S, 50.5 * S, Z0 + 14 * S, 0.06, over=0.004)
BW = []
for k in range(13):
    x = -36 + 6 * k
    for z0 in (2.0, 8.0):
        BW.append((x * S, 37.4 * S, Z0 + z0 * S, 1.6 * S, 3.2 * S, (0, -1), 'pointed'))
glazed('barracksWindows', BW, M['whiteStone'], depth=0.4 * S, bars=False)
for k in range(4):
    y = -30 + 14 * k
    box(f'tudor{k}', M['plaster'], P(-50, y, 5.0), (8 * S, 12 * S, 10 * S), bevel=0.001)
    for j in range(4):
        box(f'tudorBeam{k}{j}', M['timber'], P(-45.9, y - 4.5 + 3 * j, 5.0), (0.3 * S, 0.5 * S, 10 * S), bevel=0)
    box(f'tudorBeamH{k}', M['timber'], P(-45.9, y, 5.0), (0.3 * S, 12 * S, 0.5 * S), bevel=0)
    gable_roof(f'tudorRoof{k}', M['terracotta'], -54 * S, -46 * S, (y - 6) * S, (y + 6) * S, Z0 + 10 * S, 0.05, over=0.003, along='y')

# ------------------------------------------------------------------ people: visitors, and Yeoman Warders in red and black
for k, (x, y, shirt) in enumerate(((-0.3, -0.25, 'red'), (0.25, -0.3, 'blue'), (0.4, 0.2, 'yellow'), (-0.4, 0.15, 'green'), (0.1, -0.85, 'red'), (-0.5, -0.88, 'blue'), (0.55, -0.9, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0 + 0.003)

render('tower-of-london')
