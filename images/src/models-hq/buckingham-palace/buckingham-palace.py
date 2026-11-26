# Buckingham Palace in the high-quality look (hq.py), drawn to its real proportions (laid out in
# metres): the east front of Portland stone, its rusticated ground floor and three floors of framed
# windows with their pediments, the giant Corinthian columns and pediment of the middle and end
# pavilions, the balcony, the balustrade along the roof and the Royal Standard flying; the wings round
# the quadrangle behind; the forecourt's black and gilt railings and gates, the guards in their sentry
# boxes; the Victoria Memorial on its round of marble, its gilded Victory on top (the scanned Winged
# Victory of Samothrace in _sources/winged-victory/, CosmoWenman, CC BY 4.0); the red Mall between its
# plane trees, the parks' lawns either side, and people.
# Run: blender -b --factory-startup -P buckingham-palace.py -- buckingham-palace-1024.png 1024 buckingham-palace.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1837)
M['portland'] = material('portlandBP', '#e6e1d5', 0.6, vary='#d8d2c4', vary_scale=22, bump=0.1, bump_scale=160)
M['rustic'] = banded(material('rusticBP', '#ddd7c9', 0.65, vary='#cfc8b9', vary_scale=22, bump=0.1, bump_scale=160), 'Z', 300.0, strength=0.6)
M['bpRoof'] = material('bpRoof', '#8a9399', 0.5, vary='#7e878d', vary_scale=14, metallic=0.3)
M['railing'] = material('railingBlack', '#1f2124', 0.45, metallic=0.5)
M['mall'] = material('mallRed', '#b4553f', 0.85, vary='#a54b36', vary_scale=40, bump=0.1, bump_scale=300)
M['gravel'] = material('forecourtGravel', '#d8c9b0', 0.9, vary='#cbbba0', vary_scale=60, bump=0.3, bump_scale=600)
M['memorialMarble'] = material('memorialMarble', '#f3f1ec', 0.35, vary='#e7e4dd', vary_scale=18, bump=0.05, bump_scale=120, sss=0.04)
M['standardRed'] = material('standardRed', '#c8202f', 0.6)
M['standardGold'] = material('standardGold', '#f0c22e', 0.6)
M['standardBlue'] = material('standardBlue', '#2c4fa3', 0.6)
M['guardRed'] = material('guardRed', '#c21f2a', 0.6)

S = 0.0136              # metres to the tile's units
OY = -0.24              # everything moved this far forward on the tile
Z0 = G + 0.006
FY = 22.0               # the east front's face (metres, the front looking -y)
OPEN, DOORS = [], []


def P(x, y, z):
    return Vector((x * S, OY + y * S, Z0 + z * S))


# ------------------------------------------------------------------ the parks, the Mall, the forecourt
slab('parks', M['lawn'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.04)
slab('mall', M['mall'], [(-0.12, -2.0), (0.12, -2.0), (0.12, -0.7), (-0.12, -0.7)], Z0 - 0.002, Z0 + 0.003, margin=0.04)
annulus('memorialRoad', M['mall'], 0.42, 0.2, Z0 - 0.002, Z0 + 0.0028, segs=96, center=(0, P(0, -44, 0).y))
slab('forecourt', M['gravel'], [P(-62, FY, 0).xy[:], P(62, FY, 0).xy[:], P(62, -12, 0).xy[:], P(-62, -12, 0).xy[:]], Z0 - 0.002, Z0 + 0.0035, margin=0.04)
for k in range(7):
    y = -0.98 - k * 0.1
    for sx in (-1, 1):
        x = sx * 0.2
        if math.hypot(x, y) < 1.4 and math.hypot(x, y - P(0, -44, 0).y) > 0.46:
            tree(f'mallTree{k}{sx}', x, y, h=0.14, r=0.055, z=Z0)
for k, (x, y) in enumerate(((-1.0, -0.4), (-1.15, 0.1), (1.0, -0.45), (1.15, 0.05), (-0.75, -0.95), (0.78, -0.95), (-1.1, 0.55), (1.1, 0.6))):
    tree(f'parkTree{k}', x, y, h=0.16, r=0.065, z=Z0)

# ------------------------------------------------------------------ the east front
W, H = 108.0, 24.0
box('eastFront', M['portland'], P(0, FY + 10, H / 2), (W * S, 20 * S, H * S), bevel=0.002)
box('rusticBand', M['rustic'], P(0, FY + 0.25, 4.0), ((W + 0.4) * S, 0.6 * S, 8.0 * S), bevel=0.001)   # its face just behind the ground floor's windows
for sx, w, proj in ((0, 30.0, 2.2), (-1, 14.0, 1.4), (1, 14.0, 1.4)):         # the middle and end pavilions, stepped forward
    cx = sx * (W / 2 - w / 2)
    box(f'pavilion{sx}', M['portland'], P(cx, FY - proj / 2, H / 2 + 0.5), (w * S, proj * S, (H + 1) * S), bevel=0.002)
    ncol = 8 if sx == 0 else 4
    for k in range(ncol):
        x = cx - w / 2 + 2.0 + (w - 4.0) * k / (ncol - 1)
        lathe(f'column{sx}{k}', M['portland'], [(r * S, z * S) for r, z in ((0.75, 0), (0.7, 0.3), (0.62, 1.0), (0.56, 13.0), (0.75, 13.4), (0.85, 14.0))], P(x, FY - proj - 0.6, 8.5), segs=12, smooth=True)
    if sx == 0:
        bm = bmesh.new()
        tri = [(-w / 2, H + 1.0), (w / 2, H + 1.0), (0.0, H + 6.0)]
        add_prism(bm, [bm.verts.new(P(cx + u, FY - proj - 0.2, z)) for u, z in tri], [bm.verts.new(P(cx + u, FY + 2, z)) for u, z in tri])
        finish('pediment', bm, M['portland'], bevel=0.001, smooth_sides=False)
        lathe('arms', M['standardGold'], [(0.0, 0), (1.4 * S, 0.4 * S), (1.3 * S, 2.2 * S), (0.0, 2.6 * S)], P(0, FY - proj - 0.4, H + 1.6), segs=16, smooth=True, sy=0.3)
box('cornice', M['portland'], P(0, FY - 0.4, H - 1.0), ((W + 1.0) * S, 3.0 * S, 1.2 * S), bevel=0.001)
# the balustrade along the roof, and the roof behind it
bm = bmesh.new()
for k in range(int(W / 0.9)):
    x = -W / 2 + 0.45 + 0.9 * k
    bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.22 * S, radius2=0.16 * S, depth=1.2 * S, matrix=Matrix.Translation(P(x, FY - 0.2, H + 0.6)))
finish('balusters', bm, M['portland'], smooth_all=True)
box('balustradeRail', M['portland'], P(0, FY - 0.2, H + 1.3), (W * S, 0.8 * S, 0.3 * S), bevel=0)
box('roof', M['bpRoof'], P(0, FY + 10, H + 0.6), ((W - 2) * S, 18 * S, 1.0 * S), bevel=0)
# the windows: three floors, framed; pediments over the first floor's; the doors in the middle
for k in range(21):
    x = -W / 2 + W * (k + 0.5) / 21
    for z0, h in ((2.0, 4.0), (9.5, 5.0), (17.0, 3.5)):
        OPEN.append((x * S, OY + (FY - (2.4 if abs(x) < 15 else (1.6 if abs(x) > W / 2 - 14 else 0.1))) * S, Z0 + z0 * S, 2.0 * S, h * S, (0, -1), 'rect'))
    zt = 15.0
    yy = FY - (2.4 if abs(x) < 15 else (1.6 if abs(x) > W / 2 - 14 else 0.1)) - 0.3
    if k % 2 == 0:
        bm = bmesh.new()
        tri = [(-1.4, zt), (1.4, zt), (0, zt + 0.9)]
        add_prism(bm, [bm.verts.new(P(x + u, yy - 0.4, z)) for u, z in tri], [bm.verts.new(P(x + u, yy + 0.2, z)) for u, z in tri])
        finish(f'windowPediment{k}', bm, M['portland'], smooth_sides=False)
    else:
        box(f'windowCornice{k}', M['portland'], P(x, yy - 0.1, zt + 0.25), (3.0 * S, 0.6 * S, 0.5 * S), bevel=0)
# the balcony over the middle arch
box('balcony', M['portland'], P(0, FY - 3.8, 8.6), (14.0 * S, 3.0 * S, 0.8 * S), bevel=0.001)
box('balconyRail', M['portland'], P(0, FY - 5.1, 9.6), (14.0 * S, 0.4 * S, 1.1 * S), bevel=0)
for u in (-6.0, 0.0, 6.0):
    DOORS.append((u * S, OY + (FY - 2.5) * S, Z0, 3.4 * S, 6.0 * S, (0, -1), 'round'))
# the Royal Standard on its staff
cylinder('flagstaff', M['white'], 0.18 * S, 12.0 * S, P(0, FY + 6, H + 1.0), segs=8)
for k, (u, v, mat) in enumerate(((0, 0, 'standardRed'), (1, 0, 'standardGold'), (0, 1, 'standardBlue'), (1, 1, 'standardRed'))):
    box(f'standard{k}', M[mat], P(0.2 + 2.0 * u + 1.0, FY + 6, H + 11.0 - 1.4 * v - 0.7), (2.0 * S, 0.12 * S, 1.4 * S), bevel=0)

# ------------------------------------------------------------------ the quadrangle's wings behind
for sx in (-1, 1):
    box(f'sideWing{sx}', M['portland'], P(sx * (W / 2 - 9), FY + 38, H / 2), (18 * S, 36 * S, H * S), bevel=0.002)
    box(f'sideWingRoof{sx}', M['bpRoof'], P(sx * (W / 2 - 9), FY + 38, H + 0.4), (16 * S, 34 * S, 0.8 * S), bevel=0)
box('westWing', M['portland'], P(0, FY + 50, H / 2), ((W - 36) * S, 12 * S, H * S), bevel=0.002)
box('westWingRoof', M['bpRoof'], P(0, FY + 50, H + 0.4), ((W - 38) * S, 10 * S, 0.8 * S), bevel=0)
slab('quadrangle', M['gravel'], [P(-W / 2 + 18, FY + 20, 0).xy[:], P(W / 2 - 18, FY + 20, 0).xy[:], P(W / 2 - 18, FY + 44, 0).xy[:], P(-W / 2 + 18, FY + 44, 0).xy[:]], Z0 - 0.002, Z0 + 0.003, margin=0.04)

# ------------------------------------------------------------------ the forecourt's railings and gates, the sentry boxes and guards
bm = bmesh.new()
RY = -12.0
for k in range(int(124 / 0.8)):
    x = -62 + 0.8 * k
    if any(abs(x - g) < 2.6 for g in (-30.0, 0.0, 30.0)):
        continue
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(x, RY, 1.4)) @ Matrix.Diagonal((0.12 * S, 0.12 * S, 2.8 * S, 1)))
for sx in (-1, 1):
    for k in range(int(34 / 0.8)):
        y = RY + 0.8 * k
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(P(sx * 62, y, 1.4)) @ Matrix.Diagonal((0.12 * S, 0.12 * S, 2.8 * S, 1)))
finish('railings', bm, M['railing'], smooth_sides=False)
box('railTop', M['railing'], P(0, RY, 2.7), (124 * S, 0.2 * S, 0.2 * S), bevel=0)
for g in (-30.0, 0.0, 30.0):
    for sx in (-1, 1):
        box(f'gatePier{g}{sx}', M['portland'], P(g + sx * 3.0, RY, 2.5), (1.4 * S, 1.4 * S, 5.0 * S), bevel=0.001)
    box(f'gate{g}', M['railing'], P(g, RY, 1.6), (4.6 * S, 0.2 * S, 3.2 * S), bevel=0)
    lathe(f'gateCrest{g}', M['gold'], [(0.0, 0), (0.9 * S, 0.3 * S), (0.7 * S, 1.4 * S), (0.0, 1.8 * S)], P(g, RY, 3.2), segs=12, smooth=True, sy=0.3)
for k, x in enumerate((-16.0, 16.0)):
    box(f'sentryBox{k}', M['white'], P(x, FY - 6, 1.5), (1.4 * S, 1.4 * S, 3.0 * S), bevel=0.001)
    gable_roof(f'sentryRoof{k}', M['railing'], (x - 0.8) * S, (x + 0.8) * S, OY + (FY - 6.8) * S, OY + (FY - 5.2) * S, Z0 + 3.0 * S, 0.006, over=0.001)
    person(f'guard{k}', x * S, OY + (FY - 7.6) * S, 0.0, 'guardRed', z=Z0 + 0.0035)
    cylinder(f'bearskin{k}', M['railing'], 0.0075, 0.012, (x * S, OY + (FY - 7.6) * S, Z0 + 0.0035 + 0.068), segs=12)

# ------------------------------------------------------------------ the Victoria Memorial
MY = -44.0
cylinder('memorialPlatform', M['memorialMarble'], 0.19, 0.012, P(0, MY, -0.2), segs=64)
annulus('memorialPool', M['water'], 0.16, 0.12, Z0 + 0.004, Z0 + 0.012, segs=48, center=(0, P(0, MY, 0).y))
lathe('memorial', M['memorialMarble'], [(r * S, z * S) for r, z in ((7.0, 0), (7.0, 3.0), (5.2, 3.2), (5.0, 8.0), (3.4, 8.4), (3.0, 14.0), (1.8, 14.5), (1.6, 18.0), (2.0, 18.4), (0.0, 18.5))], P(0, MY, 1.0), segs=8)
src = import_model('winged-victory', 'victory')
if src is not None:
    stand_sourced(src, cut=0.1, turn=0.0, height=7.0 * S, z=Z0 + 19.4 * S, mat=M['gold'], report=False)
    src.data.transform(Matrix.Translation(P(0, MY, 0) - Vector((0, 0, Z0))))
lathe('victoryGlobe', M['gold'], [(0.0, 0), (1.2 * S, 0.3 * S), (1.3 * S, 0.9 * S), (0.0, 1.0 * S)], P(0, MY, 18.5), segs=16, smooth=True)

for k, (x, y, shirt) in enumerate(((-0.35, -0.48, 'red'), (0.25, -0.5, 'blue'), (0.5, -0.55, 'yellow'), (-0.6, -0.55, 'green'), (0.3, -1.1, 'red'), (-0.28, -1.15, 'blue'), (0.62, -0.8, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0 + 0.003)

glazed('windows', OPEN, M['whiteStone'], depth=0.4 * S)
glazed('doors', DOORS, M['portland'], glass=M['door'], depth=0.4 * S)
render('buckingham-palace')
