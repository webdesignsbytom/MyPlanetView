# Prague Castle in the high-quality look (hq.py), seen from the south as from the river, laid out in
# metres: the castle hill with its terraced gardens and vineyard falling away in front, the long cream
# palace along the brow with its rows of windows, its pavilions and its tiled roofs; behind it St Vitus
# Cathedral in blackened sandstone, its twin west spires and rose window, the steep dark roofs of its
# nave, transept and choir, the flying buttresses and pinnacles round them, the Golden Gate's porch and
# mosaic, and the great south tower with its golden grille, its clocks and its green copper Renaissance
# helmet; St George's Basilica, red-fronted with its two white towers, beyond the choir; the courtyards,
# the trees, and people.
# Run: blender -b --factory-startup -P prague-castle.py -- prague-castle-1024.png 1024 prague-castle.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *
from mathutils.bvhtree import BVHTree

setup()
rng = random.Random(870)
M['vitus'] = material('vitusSandstone', '#7f7a71', 0.85, vary='#6c675f', vary_scale=16, bump=0.25, bump_scale=150)
M['vitusLight'] = material('vitusLight', '#9a958b', 0.8, vary='#8a857b', vary_scale=16, bump=0.2, bump_scale=150)
M['vitusRoof'] = banded(material('vitusRoof', '#3e4548', 0.55, vary='#353b3e', vary_scale=14, metallic=0.2), 'Z', 260.0, strength=0.25)
M['palace'] = material('palaceCream', '#eadfc2', 0.75, vary='#e1d4b5', vary_scale=18, bump=0.08, bump_scale=200)
M['palaceTrim'] = material('palaceTrim', '#f6f1e4', 0.6)
M['tiles'] = banded(material('pragueTiles', '#a8553a', 0.7, vary='#94492f', vary_scale=12, bump=0.12, bump_scale=200), 'X', 240.0, strength=0.3)
M['georgeRed'] = material('georgeRed', '#c2643c', 0.75, vary='#b55a35', vary_scale=18)
M['courtyard'] = masonry('castleCobbles', '#a29b90', '#7a746b', scale=150, rough=0.85, vary='#958e83')
M['bastion'] = masonry('castleWall', '#9b917f', '#716959', scale=60, rough=0.9, vary='#8c826f')
M['garden'] = material('castleGarden', '#6f8f45', 0.9, vary='#5f7e3a', vary_scale=14, bump=0.2, bump_scale=200)
M['vineSoil'] = material('vineSoil', '#8c7a55', 0.95, vary='#7d6c4a', vary_scale=20)
M['vines'] = material('vines', '#5b7a35', 0.85, vary='#4d6a2d', vary_scale=30)
M['mosaic'] = material('goldenGateMosaic', '#d6a34a', 0.35, vary='#b5463a', vary_scale=90, metallic=0.6, bump=0.1, bump_scale=400)
M['grille'] = material('goldenGrille', '#d8a845', 0.3, metallic=0.9)

S = 0.012                           # metres to the tile's units
PLATEAU = 0.36                      # the castle hill's top above the turf (tile units)
OX, OY = -0.05, -0.06               # where the cathedral's x = 0, y = 0 falls on the tile
ZH = G + PLATEAU


def P(x, y, z):
    """A point x metres east and y north (of the south transept's corner), z above the courtyards."""
    return Vector((OX + x * S, OY + y * S, ZH + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------------ the castle hill: the courtyards on top, the bastion wall, the gardens and vineyard below
EDGE = OY - 13.0 * S                # the brow, just in front of the palace


def step_at(x):
    """How far the brow drops behind its wall: all of it along the palace, none on the hill's flanks."""
    return 0.07 * smooth((1.2 - abs(x)) / 0.2)


def H(x, y):
    rim = smooth((1.47 - math.hypot(x, y)) / 0.2)
    drop = step_at(x)
    if y >= EDGE:
        h = PLATEAU
    elif y >= EDGE - 0.014:
        h = PLATEAU - drop * (EDGE - y) / 0.014
    else:
        h = (PLATEAU - drop) * smooth((y + 1.32) / (EDGE - 0.014 + 1.32))
    return h * rim


def pick(z, nz, x, y):
    if nz < 0.55:
        return 2
    if y >= EDGE - 0.002 and z > PLATEAU * 0.97:
        return 0
    return 3 if x > 0.35 and y < EDGE - 0.05 else 2


ground = terrain('hill', H, [M['courtyard'], M['bastion'], M['garden'], M['vineSoil']], pick, rings=240, segs=600)
# the bastion wall along the brow, its top just over the courtyards, its foot in the garden, following the hill
WALL = bmesh.new()
front, back = [], []
for k in range(301):
    x = -1.5 + 3.0 * k / 300
    if step_at(x) < 0.012:
        continue
    top = G + H(x, EDGE + 0.002) + 0.004
    foot = G + H(x, EDGE - 0.016) - 0.01
    front.append((WALL.verts.new((x, EDGE - 0.016, foot)), WALL.verts.new((x, EDGE - 0.016, top))))
    back.append((WALL.verts.new((x, EDGE + 0.002, foot)), WALL.verts.new((x, EDGE + 0.002, top))))
for (a0, a1), (b0, b1), (c0, c1), (d0, d1) in zip(front, front[1:], back, back[1:]):
    WALL.faces.new((a0, b0, b1, a1))
    WALL.faces.new((c1, d1, d0, c0))
    WALL.faces.new((a1, b1, d1, c1))
    WALL.faces.new((a0, c0, d0, b0))
for (f0, f1), (g0, g1) in ((front[0], back[0]), (front[-1], back[-1])):
    WALL.faces.new((f0, f1, g1, g0))
finish('bastionWall', WALL, M['bastion'], smooth_sides=False)
bm = bmesh.new()
bm.from_mesh(ground.data)
bm.faces.ensure_lookup_table()
hits = BVHTree.FromBMesh(bm)


def ground_at(x, y):
    hit = hits.ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)), 5.0)
    return (hit[0].z, bm.faces[hit[2]].material_index) if hit[0] is not None else (G, -1)


# the vineyard's rows down the slope, and the gardens' trees
VINES = bmesh.new()
for k in range(14):
    y = EDGE - 0.1 - 0.065 * k
    for j in range(40):
        x = 0.38 + 0.025 * j
        z, m = ground_at(x, y)
        if m == 3 and math.hypot(x, y) < 1.38:
            bmesh.ops.create_cube(VINES, size=1.0, matrix=Matrix.Translation((x, y, z + 0.006)) @ Matrix.Diagonal((0.026, 0.012, 0.014, 1)))
finish('vineyard', VINES, M['vines'], bevel=0.002, smooth_sides=False)
n = 0
for k in range(400):
    x, y = rng.uniform(-1.3, 0.32), rng.uniform(-1.3, EDGE - 0.08)
    z, m = ground_at(x, y)
    if m != 2 or math.hypot(x, y) > 1.32 or n >= 34:
        continue
    tree(f'gardenTree{n}', x, y, h=rng.uniform(0.12, 0.17), r=rng.uniform(0.05, 0.07), mat=rng.choice(('leaf', 'leaf', 'leafDark')), z=z - 0.004)
    n += 1

# ------------------------------------------------------------------ the palace along the brow: its long front, pavilions, windows and tiled roofs
PX0, PX1, PY0, PY1, PH = -88.0, 78.0, -12.0, 8.0, 22.0
block('palace', M['palace'], PX0, PX1, PY0, PY1, -0.3, PH)
hip_roof('palaceRoof', M['tiles'], OX + (PX0 + PX1) / 2 * S, OY + (PY0 + PY1) / 2 * S, ZH + (PH - 0.05) * S, (PX1 - PX0) * S, (PY1 - PY0) * S, 7.0 * S, over=0.004)
PAVILIONS = ((-88.6, -74.0), (-9.0, 9.0), (64.0, 78.6))
for x0, x1 in PAVILIONS:
    block(f'pavilion{x0}', M['palace'], x0, x1, PY0 - 0.9, PY1 + 0.5, -0.3, PH + 2.5)
    hip_roof(f'pavilionRoof{x0}', M['tiles'], OX + (x0 + x1) / 2 * S, OY + (PY0 - 0.2 + PY1) / 2 * S, ZH + (PH + 2.45) * S, (x1 - x0) * S, (PY1 - PY0 + 1.4) * S, 7.5 * S, over=0.004)
block('palaceCornice', M['palaceTrim'], PX0 - 0.2, PX1 + 0.2, PY0 - 0.4, PY0 + 0.2, PH - 0.9, PH - 0.2)
block('palacePlinth', M['bastion'], PX0 - 0.3, PX1 + 0.3, PY0 - 0.5, PY0 + 0.2, -0.3, 2.0)
bm_ = bmesh.new()
tri = [(-10.5, PH + 2.4), (10.5, PH + 2.4), (0.0, PH + 7.6)]
add_prism(bm_, [bm_.verts.new(P(u, PY0 - 1.3, z)) for u, z in tri], [bm_.verts.new(P(u, PY0 + 1.0, z)) for u, z in tri])
finish('pediment', bm_, M['palaceTrim'], smooth_sides=False)
PWIN = []
x = PX0 + 2.4
while x < PX1 - 2.0:
    pav = next(((a, b) for a, b in PAVILIONS if a - 0.8 < x < b + 0.8), None)
    if pav is None or (pav[0] + 1.6 < x < pav[1] - 1.6):
        front = PY0 - (0.95 if pav else 0.05)
        for z, h in ((3.0, 2.2), (7.2, 2.7), (11.4, 2.7), (15.6, 2.3), (19.0, 1.4)):
            c = P(x, front, 0)
            PWIN.append((c.x, c.y, ZH + z * S, 1.4 * S, h * S, (0, -1), 'rect'))
    x += 3.55
glazed('palaceWindows', PWIN, M['palaceTrim'], depth=0.25 * S)

# ------------------------------------------------------------------ St Vitus: the nave, transept and choir under steep dark roofs
NAVE_Y0, NAVE_Y1, AISLE = 32.0, 48.0, 8.0          # the nave between y 32 and 48, an aisle either side
WALL, AISLE_H = 33.0, 20.0
for name, x0, x1 in (('west', -62.0, 0.2), ('choir', 17.8, 48.0)):
    block(name + 'AisleS', M['vitus'], x0, x1, NAVE_Y0 - AISLE, NAVE_Y0 + 0.1, -0.3, AISLE_H)
    block(name + 'AisleN', M['vitus'], x0, x1, NAVE_Y1 - 0.1, NAVE_Y1 + AISLE, -0.3, AISLE_H)
    block(name + 'Nave', M['vitus'], x0, x1, NAVE_Y0, NAVE_Y1, -0.3, WALL)
block('transept', M['vitus'], 0.0, 18.0, 16.0, 64.0, -0.3, WALL - 0.1)
apse = [(48.0 + 8.0 * math.cos(a), 40.0 + 8.0 * math.sin(a)) for a in [-math.pi / 2 + math.pi * k / 4 for k in range(5)]]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new(P(x, y, -0.3)) for x, y in apse], [bm_.verts.new(P(x, y, WALL - 0.05)) for x, y in apse])
finish('apse', bm_, M['vitus'], smooth_sides=False)
chapels = [(48.0 + 16.0 * math.cos(a), 40.0 + 16.0 * math.sin(a)) for a in [-math.pi / 2 + math.pi * k / 6 for k in range(7)]]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new(P(x, y, -0.3)) for x, y in chapels], [bm_.verts.new(P(x, y, 14.0)) for x, y in chapels])
finish('chapels', bm_, M['vitus'], smooth_sides=False)
lathe('chapelRoof', M['vitusRoof'], [(16.4 * S, 0.0), (8.2 * S, 6.0 * S)], (0, 0, 0), segs=12, matrix=Matrix.Translation(P(48.0, 40.0, 13.95)) @ Matrix.Rotation(-math.pi / 2, 4, 'Z'))
# the roofs: the nave's and the choir's ridges along it, meeting the transept's under its ridge
gable_roof('naveRoof', M['vitusRoof'], OX - 62.0 * S, OX + 9.0 * S, OY + NAVE_Y0 * S, OY + NAVE_Y1 * S, ZH + (WALL - 0.05) * S, 15.0 * S, over=0.004)
gable_roof('choirRoof', M['vitusRoof'], OX + 9.0 * S, OX + 48.0 * S, OY + NAVE_Y0 * S, OY + NAVE_Y1 * S, ZH + (WALL - 0.05) * S, 15.0 * S, over=0.004)
gable_roof('transeptRoof', M['vitusRoof'], OX + 0.0 * S, OX + 18.0 * S, OY + 16.0 * S, OY + 64.0 * S, ZH + (WALL - 0.15) * S, 15.0 * S, over=0.004, along='y')
lathe('apseRoof', M['vitusRoof'], [(8.6 * S, 0.0), (0.0, 15.0 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(48.0, 40.0, WALL - 0.05)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
for side, y0, y1 in (('S', NAVE_Y0 - AISLE, NAVE_Y0), ('N', NAVE_Y1, NAVE_Y1 + AISLE)):
    for name, x0, x1 in (('west', -62.0, 0.0), ('choir', 18.0, 48.0)):
        gable_roof(f'{name}AisleRoof{side}', M['vitusRoof'], OX + x0 * S, OX + x1 * S, OY + y0 * S, OY + y1 * S, ZH + (AISLE_H - 0.05) * S, 3.0 * S, over=0.003)

# the windows: the aisles', the clerestory's, the transept's great one; flying buttresses and pinnacles between the bays
VWIN = []
PIERS, PINNACLES, FLYERS = bmesh.new(), bmesh.new(), []
BAYS = [x for x in range(-58, 0, 8)] + [x for x in range(22, 48, 8)]
for x in BAYS:
    for sy, wall_y, out_y in ((-1, NAVE_Y0 - AISLE, NAVE_Y0 - AISLE - 2.2), (1, NAVE_Y1 + AISLE, NAVE_Y1 + AISLE + 2.2)):
        VWIN.append(((OX + (x + 4.0) * S), OY + (wall_y + sy * 0.05) * S, ZH + 4.5 * S, 2.8 * S, 10.0 * S, (0, sy), 'pointed'))
        VWIN.append(((OX + (x + 4.0) * S), OY + ((NAVE_Y0 if sy < 0 else NAVE_Y1) + sy * 0.05) * S, ZH + (AISLE_H + 3.0) * S, 3.6 * S, 8.5 * S, (0, sy), 'pointed'))
        bmesh.ops.create_cube(PIERS, size=1.0, matrix=Matrix.Translation(P(x, out_y, 13.0)) @ Matrix.Diagonal((1.8 * S, 2.6 * S, 26.6 * S, 1)))
        bmesh.ops.create_cone(PINNACLES, cap_ends=True, segments=8, radius1=0.9 * S, radius2=0.1 * S, depth=7.0 * S, matrix=Matrix.Translation(P(x, out_y, 29.75)))
        FLYERS.append((P(x, out_y, 23.0), P(x, NAVE_Y0 if sy < 0 else NAVE_Y1, 28.5)))
for k in range(7):
    a = -math.pi / 2 + math.pi * k / 6
    c = (48.0 + 18.0 * math.cos(a), 40.0 + 18.0 * math.sin(a))
    bmesh.ops.create_cube(PIERS, size=1.0, matrix=Matrix.Translation(P(c[0], c[1], 13.0)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Diagonal((2.6 * S, 1.8 * S, 26.6 * S, 1)))
    bmesh.ops.create_cone(PINNACLES, cap_ends=True, segments=8, radius1=0.9 * S, radius2=0.1 * S, depth=7.0 * S, matrix=Matrix.Translation(P(c[0], c[1], 29.75)))
    FLYERS.append((P(c[0], c[1], 23.0), P(48.0 + 8.0 * math.cos(a), 40.0 + 8.0 * math.sin(a), 29.0)))
finish('buttressPiers', PIERS, M['vitusLight'], smooth_sides=False)
finish('pinnacles', PINNACLES, M['vitusLight'], smooth_sides=False)
for k, (a, b) in enumerate(FLYERS):
    bar(f'flyer{k}', M['vitusLight'], a, b, 0.6 * S)
VWIN.append((OX + 9.0 * S, OY + 15.95 * S, ZH + 21.0 * S, 7.0 * S, 11.0 * S, (0, -1), 'pointed'))
glazed('vitusWindows', VWIN, M['vitusLight'], depth=0.3 * S)
# the Golden Gate: its open porch of three arches and the gold mosaic above it
arcade_path('goldenGatePorch', M['vitusLight'], [(OX + x * S, OY + 11.5 * S) for x in (2.0, 6.67, 11.33, 16.0)], 4.4 * S, ZH + 5.0 * S, 6.0 * S, 1.9 * S, pointed=1.4)
for x in (2.0, 6.67, 11.33, 16.0):
    column(f'porchColumn{x}', M['vitusLight'], OX + x * S, OY + 13.7 * S, ZH - 0.3 * S, 5.35 * S, 0.5 * S)
block('porchRoof', M['vitus'], 1.4, 16.6, 11.2, 16.1, 10.95, 11.6)
block('goldenMosaic', M['mosaic'], 3.0, 15.0, 15.7, 16.05, 12.2, 19.5)

# ------------------------------------------------------------------ the west front: its twin spires and the rose window between them
for y0, y1 in ((24.0, 32.0), (48.0, 56.0)):
    block(f'westTower{y0}', M['vitus'], -70.0, -62.0, y0, y1, -0.3, 50.0)
    block(f'westTowerGallery{y0}', M['vitusLight'], -70.6, -61.4, y0 - 0.6, y1 + 0.6, 49.9, 51.2)
    lathe(f'westSpire{y0}', M['copperGreen'], [(5.4 * S, 0.0), (4.6 * S, 4.0 * S), (0.3 * S, 30.5 * S), (0.0, 31.5 * S)], (0, 0, 0), segs=8,
          matrix=Matrix.Translation(P(-66.0, (y0 + y1) / 2, 51.1)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    for sx in (-1, 1):
        for sy in (-1, 1):
            c = P(-66.0 + sx * 3.6, (y0 + y1) / 2 + sy * 3.6, 51.1)
            spire(f'westTurret{y0}{sx}{sy}', M['vitusLight'], c.x, c.y, c.z, 0.7 * S, 6.0 * S, segs=8)
block('westGable', M['vitus'], -70.0, -61.9, 31.9, 48.1, -0.3, 36.0)
bm_ = bmesh.new()
tri = [(31.9, 35.9), (48.1, 35.9), (40.0, 45.0)]
add_prism(bm_, [bm_.verts.new(P(-70.0, y, z)) for y, z in tri], [bm_.verts.new(P(-62.0, y, z)) for y, z in tri])
finish('westGableTop', bm_, M['vitus'], smooth_sides=False)
rose = P(-70.25, 40.0, 25.0)
turn = Vector((0, 0, 1)).rotation_difference(Vector((-1, 0, 0))).to_matrix().to_4x4()
annulus('roseFrame', M['vitusLight'], 5.0 * S, 4.2 * S, 0.0, 0.4 * S, segs=32, matrix=Matrix.Translation(rose) @ turn)
cylinder('roseGlass', M['window'], 4.3 * S, 0.3 * S, (0, 0, 0), segs=32, matrix=Matrix.Translation(rose) @ turn)
glazed('westPortals', [(OX - 70.05 * S, OY + y * S, ZH - 0.2 * S, w * S, h * S, (-1, 0), 'pointed') for y, w, h in ((40.0, 4.4, 11.0), (28.0, 3.2, 8.0), (52.0, 3.2, 8.0))],
       M['vitusLight'], glass=M['door'], depth=0.5 * S)

# ------------------------------------------------------------------ the great south tower: the golden grille, the clocks, the gallery and the copper helmet
TX, TY = -7.0, 18.0
block('southTower', M['vitus'], TX - 6.0, TX + 6.0, TY - 6.0, TY + 6.0, -0.3, 56.0)
block('towerGallery', M['vitusLight'], TX - 6.8, TX + 6.8, TY - 6.8, TY + 6.8, 55.9, 57.4)
c = P(TX, TY - 6.05, 0)
glazed('towerWindow', [(c.x, c.y, ZH + 22.0 * S, 5.0 * S, 20.0 * S, (0, -1), 'pointed')], M['vitusLight'], depth=0.4 * S)
GRILLE = bmesh.new()
for k in range(9):
    z = 23.0 + 2.0 * k
    bmesh.ops.create_cube(GRILLE, size=1.0, matrix=Matrix.Translation(P(TX, TY - 6.45, z)) @ Matrix.Diagonal((4.6 * S, 0.12 * S, 0.18 * S, 1)))
for k in range(5):
    bmesh.ops.create_cube(GRILLE, size=1.0, matrix=Matrix.Translation(P(TX - 1.8 + 0.9 * k, TY - 6.45, 31.0)) @ Matrix.Diagonal((0.18 * S, 0.12 * S, 16.0 * S, 1)))
finish('goldenGrille', GRILLE, M['grille'], smooth_sides=False)
turn = Vector((0, 0, 1)).rotation_difference(Vector((0, -1, 0))).to_matrix().to_4x4()
for k, z in enumerate((46.0, 51.5)):
    cylinder(f'clockFace{k}', M['palaceTrim'], 1.9 * S, 0.25 * S, (0, 0, 0), segs=24, matrix=Matrix.Translation(P(TX, TY - 6.05, z)) @ turn)
    annulus(f'clockRing{k}', M['gold'], 2.1 * S, 1.8 * S, 0.0, 0.35 * S, segs=24, matrix=Matrix.Translation(P(TX, TY - 6.05, z)) @ turn)
    box(f'clockHand{k}', M['gold'], P(TX + 0.5, TY - 6.4, z + 0.5), (0.25 * S, 0.1 * S, 1.6 * S), rot_z=0.0, bevel=0)
lathe('towerHelmet', M['copperGreen'], [(r * S, z * S) for r, z in ((6.6, 0.0), (7.0, 1.8), (6.0, 6.5), (3.2, 10.5), (2.5, 11.5), (2.5, 16.5), (3.4, 18.5), (2.2, 22.0), (0.9, 24.0), (0.45, 32.0), (0.0, 38.5))],
      P(TX, TY, 57.3), segs=32, smooth=True)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = TX + sx * 5.6, TY + sy * 5.6
        lathe(f'helmetTurret{sx}{sy}', M['copperGreen'], [(r * S, z * S) for r, z in ((1.2, 0.0), (1.2, 2.5), (1.5, 3.2), (0.8, 5.0), (0.0, 7.0))], P(x, y, 57.3), segs=12, smooth=True)
lathe('towerFinial', M['gold'], [(0.0, 0.0), (0.7 * S, 0.6 * S), (0.0, 1.6 * S)], P(TX, TY, 95.6), segs=10, smooth=True)

# ------------------------------------------------------------------ St George's Basilica: its red front, its two white towers
block('georgeNave', M['palace'], 66.0, 92.0, 32.0, 48.0, -0.3, 17.0)
block('georgeFront', M['georgeRed'], 65.4, 66.2, 31.6, 48.4, -0.3, 19.0)
bm_ = bmesh.new()
tri = [(31.6, 18.9), (48.4, 18.9), (40.0, 26.0)]
add_prism(bm_, [bm_.verts.new(P(65.4, y, z)) for y, z in tri], [bm_.verts.new(P(66.2, y, z)) for y, z in tri])
finish('georgeGable', bm_, M['georgeRed'], smooth_sides=False)
gable_roof('georgeRoof', M['tiles'], OX + 66.0 * S, OX + 92.0 * S, OY + 32.0 * S, OY + 48.0 * S, ZH + 16.95 * S, 6.5 * S, over=0.003)
for y in (29.0, 51.0):
    block(f'georgeTower{y}', M['palaceTrim'], 86.0, 91.0, y - 2.5, y + 2.5, -0.3, 40.0)
    lathe(f'georgeTowerRoof{y}', M['vitusRoof'], [(3.7 * S, 0.0), (0.0, 9.0 * S)], (0, 0, 0), segs=4, matrix=Matrix.Translation(P(88.5, y, 39.95)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
glazed('georgeDoor', [(OX + 65.35 * S, OY + 40.0 * S, ZH - 0.2 * S, 3.0 * S, 5.0 * S, (-1, 0), 'round')], M['palaceTrim'], glass=M['door'], depth=0.4 * S)

for k, (x, y, shirt) in enumerate(((-30.0, 14.0, 'red'), (-20.0, 4.0, 'blue'), (25.0, 12.0, 'yellow'), (40.0, 6.0, 'green'), (-50.0, 18.0, 'red'), (55.0, 20.0, 'blue'), (-75.0, 30.0, 'yellow'), (10.0, 72.0, 'green'))):
    person(f'p{k}', OX + x * S, OY + y * S, rng.random() * 6, shirt, z=ZH, scale=0.6)

render('prague-castle')
