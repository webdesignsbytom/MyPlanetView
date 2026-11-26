# The Palacio de Bellas Artes in the high-quality look (hq.py), laid out in metres: Mexico City's white
# marble palace of the arts facing the Alameda; its front with the great deep arch over the glazed
# doors between paired columns, the arched windows of its two storeys, and the round colonnaded
# pavilions on its front corners; the tall drum behind with its arched windows and pinnacles, and the
# great dome on it tiled orange to gold in bands between its ribs, crowned by its lantern and the bronze
# group of four figures round the eagle; the four small tiled domes round it; the stage house behind;
# and on the marble esplanade in front, Agustí Querol's four Pegasus statues on their pedestals, and
# people.
# Sourced: the Pegasus, a CC BY photogrammetry scan of one of Querol's own statues here (_sources/
# bellas-artes-pegasus/); the eagle, a CC BY scan of a bank's stone eagle (_sources/bank-eagle/) and the
# four figures, the Madonnina scan (_sources/madonnina/), both standing in for Géza Maróti's bronzes.
# Run: blender -b --factory-startup -P bellas-artes.py -- bellas-artes-1024.png 1024 bellas-artes.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1934)
M['marbleW'] = material('bellasMarble', '#f1ece2', 0.55, vary='#e8e1d3', vary_scale=30, bump=0.06, bump_scale=200)
M['marbleT'] = material('bellasTrim', '#e1d9c8', 0.6, vary='#d8cfbd', vary_scale=30)
M['esplanade'] = masonry('bellasEsplanade', '#d9d1c2', '#bdb4a3', scale=140, rough=0.8, vary='#d1c8b8')
M['tileOrange'] = mosaic('domeOrange', [(1, '#c9662a'), (1, '#d9772e'), (1, '#e2853a'), (1, '#cf6d2c')], scale=130, mortar='#a9542a', rough=0.35)
M['tileAmber'] = mosaic('domeAmber', [(1, '#e09a35'), (1, '#e8a83e'), (1, '#dc8f30'), (1, '#eab24a')], scale=130, mortar='#b8762c', rough=0.35)
M['tileGold'] = mosaic('domeGold', [(1, '#efc444'), (1, '#f4d158'), (1, '#e8b83a'), (1, '#f6da6c')], scale=130, mortar='#c4962e', rough=0.3)
M['rib'] = material('domeRib', '#9a4b24', 0.5)
M['bronzeG'] = material('bronzePatina', '#4f6f5f', 0.45, vary='#5e8270', vary_scale=40, metallic=0.5)
M['leadRoof'] = material('bellasLeadRoof', '#aeb0ab', 0.6, vary='#a3a5a0', vary_scale=30)
M['glassB'] = material('bellasGlass', '#5d7d8c', 0.15, vary='#6a8a99', vary_scale=6, metallic=0.2)

S = 0.022               # metres to the tile's units
FY = 4.0                # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def T(x, y):
    return (x * S, (y - FY) * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def pinnacle(name, x, y, z0, h, w):
    """A marble pinnacle: a square shaft, then a pointed cap."""
    block(name, M['marbleT'], x - w / 2, x + w / 2, y - w / 2, y + w / 2, z0, z0 + h * 0.7)
    lathe(name + 'Cap', M['marbleW'], [(w * 0.75 * S, 0.0), (w * 0.6 * S, 0.06 * h * S), (0.0, 0.3 * h * S)], (0.0, 0.0, 0.0), segs=4,
          matrix=Matrix.Translation(P(x, y, z0 + h * 0.7)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))


BEFORE = set(bpy.data.objects)
slab('esplanade', M['esplanade'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
WIN, DOORS = [], []

# ------------------------------------------------------------------ the main block: two storeys of arched windows, cornice, attic and pinnacles
XW, YF, YB = 46.0, -24.0, 44.0
CORN = 20.0
block('plinth', M['marbleT'], -XW - 0.8, XW + 0.8, YF - 0.8, YB + 0.8, -0.3, 2.0)
block('main', M['marbleW'], -XW, XW, YF, YB, -0.3, CORN)
block('cornice', M['marbleT'], -XW - 0.9, XW + 0.9, YF - 0.9, YB + 0.9, CORN, CORN + 1.2)
block('attic', M['marbleW'], -XW + 0.4, XW - 0.4, YF + 0.4, YB - 0.4, CORN + 1.2, CORN + 3.4)
block('roof', M['leadRoof'], -XW + 1.6, XW - 1.6, YF + 1.6, YB - 1.6, CORN + 3.4, CORN + 3.6, bevel=0)
block('storeyBand', M['marbleT'], -XW - 0.3, XW + 0.3, YF - 0.3, YB + 0.3, 9.6, 10.4, bevel=0)
for x in (-38.0, -30.0, -22.0, 22.0, 30.0, 38.0):
    pinnacle(f'atticFront{x:+.0f}', x, YF + 0.6, CORN + 3.4, 4.0, 1.4)
# the front's side bays and the sides: tall arched windows on both storeys, pilasters between
for s in (-1, 1):
    for x in (21.0, 27.5, 34.0):
        c = P(s * x, YF - 0.05, 0)
        WIN.append((c.x, c.y, Z0 + 2.6 * S, 3.4 * S, 6.0 * S, (0, -1), 'round'))
        WIN.append((c.x, c.y, Z0 + 11.6 * S, 3.4 * S, 6.4 * S, (0, -1), 'round'))
    for x in (18.0, 24.2, 30.8, 37.2):
        block(f'pilaster{s}{x:.0f}', M['marbleT'], s * x - 0.6, s * x + 0.6, YF - 0.7, YF, 2.0, CORN)
    for y in (-14.0, -6.0, 2.0, 10.0, 18.0, 26.0, 34.0):
        c = P(s * (XW + 0.05), y, 0)
        WIN.append((c.x, c.y, Z0 + 2.6 * S, 3.4 * S, 6.0 * S, (s, 0), 'round'))
        WIN.append((c.x, c.y, Z0 + 11.6 * S, 3.4 * S, 6.4 * S, (s, 0), 'round'))
    for y in (-18.0, -10.0, -2.0, 6.0, 14.0, 22.0, 30.0, 38.0):
        block(f'sidePilaster{s}{y:+.0f}', M['marbleT'], *sorted((s * XW, s * (XW + 0.7))), y - 0.6, y + 0.6, 2.0, CORN)

# ------------------------------------------------------------------ the front's middle: the great deep arch, its glazed doors, the paired columns, the crown
YP = -33.0              # the middle pavilion's front
for s in (-1, 1):
    block(f'archPier{s}', M['marbleW'], *sorted((s * 9.0, s * 17.0)), YP, YF, -0.3, 26.0)
arcade_path('greatArch', M['marbleW'], [(-9.0 * S, (YP + 4.5 - FY) * S), (9.0 * S, (YP + 4.5 - FY) * S)], 9.0 * S, Z0 + 12.0 * S, 14.0 * S, 9.0 * S)
block('archBack', M['marbleW'], -9.0, 9.0, YF - 0.5, YF, -0.3, 26.0)
for x in (-5.5, 0.0, 5.5):
    c = P(x, YF - 0.55, 0)
    DOORS.append((c.x, c.y, Z0 + 2.0 * S, 3.6 * S, 6.4 * S, (0, -1), 'round'))
c = P(0.0, YF - 0.55, 0)
WIN.append((c.x, c.y, Z0 + 11.0 * S, 15.0 * S, 8.4 * S, (0, -1), 'round'))
block('archImpost', M['marbleT'], -9.0, 9.0, YF - 1.2, YF - 0.5, 10.0, 10.8, bevel=0)
arcade_path('archFrame', M['marbleT'], [(-10.2 * S, (YP - 0.35 - FY) * S), (10.2 * S, (YP - 0.35 - FY) * S)], 0.7 * S, Z0 + 12.0 * S, 11.8 * S, 9.2 * S)
for s in (-1, 1):
    for k, x in enumerate((11.2, 14.6)):
        block(f'pedestal{s}{k}', M['marbleT'], s * x - 1.3, s * x + 1.3, YP - 2.6, YP, -0.3, 2.6)
        column(f'column{s}{k}', M['marbleW'], s * x * S, (YP - 1.3 - FY) * S, Z0 + 2.6 * S, 15.0 * S, 0.95 * S, segs=16, cap_mat=M['marbleT'])
    block(f'entablature{s}', M['marbleT'], *sorted((s * 9.6, s * 16.2)), YP - 2.8, YP, 17.6, 19.4)
block('pavilionCornice', M['marbleT'], -17.8, 17.8, YP - 1.0, YF, 26.0, 27.2)
# the crown over the arch: a curved hood, and the group of figures on it (stand-ins: the Madonnina)
lathe('crownHood', M['marbleT'], [(7.0 * S, 0.0), (7.0 * S, 1.0 * S), (5.0 * S, 3.6 * S), (0.0, 4.4 * S)], P(0.0, YP + 2.0, 27.2), segs=32, sy=0.45)
src = import_model('madonnina', 'harmonySource')
if src is not None:
    stand_sourced(src, cut=0.34, turn=0.0, height=4.2 * S, z=0.0, mat=M['marbleW'], report=False)
    src.data.polygons.foreach_set('use_smooth', [True] * len(src.data.polygons))
    fig = src.data
    bpy.data.objects.remove(src, do_unlink=True)
    for k, (x, y, z, sc) in enumerate(((0.0, YP + 1.2, 31.2, 1.0), (-4.2, YP + 0.4, 28.0, 0.85), (4.2, YP + 0.4, 28.0, 0.85))):
        ob = bpy.data.objects.new(f'harmony{k}', fig)
        bpy.context.scene.collection.objects.link(ob)
        ob.matrix_world = Matrix.Translation(P(x, y, z)) @ Matrix.Rotation(math.radians(180.0), 4, 'Z') @ Matrix.Scale(sc, 4)
else:
    fig = None

# ------------------------------------------------------------------ the round colonnaded pavilions on the front corners
for s in (-1, 1):
    cx, cy = s * XW, YF
    cylinder(f'rotundaCore{s}', M['marbleW'], 6.6 * S, 15.0 * S, P(cx, cy, -0.3), segs=48)
    cylinder(f'rotundaStep{s}', M['marbleT'], 11.6 * S, 2.0 * S, P(cx, cy, -0.3), segs=64)
    for k in range(11):
        a = math.radians(-90.0) + k / 10.0 * math.radians(270.0) if s > 0 else math.radians(-90.0) - k / 10.0 * math.radians(270.0)
        column(f'rotundaCol{s}{k}', M['marbleW'], (cx + 10.2 * math.cos(a)) * S, (cy + 10.2 * math.sin(a) - FY) * S, Z0 + 1.7 * S, 12.6 * S, 0.75 * S, segs=12, cap_mat=M['marbleT'])
    annulus(f'rotundaBeam{s}', M['marbleT'], 11.2 * S, 6.0 * S, Z0 + 14.3 * S, Z0 + 16.3 * S, segs=64, center=T(cx, cy))
    lathe(f'rotundaRoof{s}', M['marbleW'], [(11.0 * S, 0.0), (10.6 * S, 0.8 * S), (7.0 * S, 2.6 * S), (0.0, 3.4 * S)], P(cx, cy, 16.3), segs=48)
    for k in range(8):
        a = math.radians(-90.0) + k / 7.0 * math.radians(270.0) if s > 0 else math.radians(-90.0) - k / 7.0 * math.radians(270.0)
        lathe(f'rotundaUrn{s}{k}', M['marbleT'], [(0.5 * S, 0.0), (0.7 * S, 0.6 * S), (0.3 * S, 1.2 * S), (0.0, 1.5 * S)], P(cx + 10.6 * math.cos(a), cy + 10.6 * math.sin(a), 16.3), segs=10)
    c = P(cx + s * 4.7, cy - 4.7, 0)
    DOORS.append((c.x, c.y, Z0 + 1.7 * S, 2.6 * S, 5.0 * S, (s * 0.7071, -0.7071), 'round'))

# ------------------------------------------------------------------ the drum: its arched windows and corner towers with pinnacles
DX0, DX1, DY0, DY1 = -19.0, 19.0, -14.0, 24.0
DCY = (DY0 + DY1) / 2
block('drum', M['marbleW'], DX0, DX1, DY0, DY1, CORN, 31.0)
block('drumCornice', M['marbleT'], DX0 - 0.6, DX1 + 0.6, DY0 - 0.6, DY1 + 0.6, 31.0, 32.0)
for k, x in enumerate((-8.5, 0.0, 8.5)):
    c = P(x, DY0 - 0.05, 0)
    WIN.append((c.x, c.y, Z0 + 23.4 * S, 4.6 * S, 6.2 * S, (0, -1), 'round'))
    for s in (-1, 1):
        c = P(s * (DX1 + 0.05), DCY + x, 0)
        WIN.append((c.x, c.y, Z0 + 23.4 * S, 4.6 * S, 6.2 * S, (s, 0), 'round'))
for sx in (-1, 1):
    for sy, y in ((-1, DY0), (1, DY1)):
        block(f'drumTower{sx}{sy}', M['marbleW'], sx * DX1 - 2.2, sx * DX1 + 2.2, y - 2.2, y + 2.2, CORN, 34.0)
        pinnacle(f'drumPinnacle{sx}{sy}', sx * DX1, y, 34.0, 6.0, 2.6)

# ------------------------------------------------------------------ the great dome: its ring, the tiled bands between ribs, the lantern and the bronze group


def tiled_dome(name, cx, cy, z, r, h, ribs, rib_r):
    """A dome tiled orange at its foot to gold at its crown, in three bands, with ribs over them."""
    prof = [(r * math.cos(t), h * math.sin(t)) for t in [math.radians(a) for a in range(0, 91, 3)]]
    cuts = (0, 7, 14, len(prof) - 1)
    for k, mat in enumerate(('tileOrange', 'tileAmber', 'tileGold')):
        part = prof[cuts[k]:cuts[k + 1] + 1]
        if k == 2:
            part[-1] = (0.0, part[-1][1])
        lathe(f'{name}Band{k}', M[mat], [(u * S, v * S) for u, v in part], P(cx, cy, z), segs=64, smooth=True)
    for j in range(ribs):
        a = 2 * math.pi * j / ribs
        pts = [P(cx + (u + rib_r * 0.6) * math.cos(a), cy + (u + rib_r * 0.6) * math.sin(a), z + v) for u, v in prof[:-3]]
        tube(f'{name}Rib{j}', M['rib'], pts, rib_r * S)


DOME_C = (0.0, DCY)
cylinder('domeRing', M['marbleW'], 16.0 * S, 3.6 * S, P(*DOME_C, 32.0), segs=64)
cylinder('domeRingCap', M['marbleT'], 16.6 * S, 0.8 * S, P(*DOME_C, 35.6), segs=64)
for k in range(16):
    a = 2 * math.pi * (k + 0.5) / 16
    c = P(DOME_C[0] + 16.02 * math.cos(a), DOME_C[1] + 16.02 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + 32.6 * S, 2.0 * S, 2.4 * S, (math.cos(a), math.sin(a)), 'round'))
tiled_dome('dome', *DOME_C, 36.4, 15.4, 17.0, 16, 0.5)
cylinder('lantern', M['glassB'], 3.4 * S, 3.0 * S, P(*DOME_C, 52.6), segs=24)
for k in range(8):
    a = 2 * math.pi * k / 8
    bar(f'lanternRib{k}', M['bronzeG'], P(DOME_C[0] + 3.45 * math.cos(a), DOME_C[1] + 3.45 * math.sin(a), 52.6), P(DOME_C[0] + 3.45 * math.cos(a), DOME_C[1] + 3.45 * math.sin(a), 55.6), 0.4 * S)
cylinder('lanternCap', M['bronzeG'], 3.8 * S, 0.7 * S, P(*DOME_C, 55.6), segs=24)
if fig is not None:
    bronze_fig = fig.copy()
    bronze_fig.materials.clear()
    bronze_fig.materials.append(M['bronzeG'])
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        ob = bpy.data.objects.new(f'muse{k}', bronze_fig)
        bpy.context.scene.collection.objects.link(ob)
        ob.matrix_world = Matrix.Translation(P(DOME_C[0] + 2.3 * math.cos(a), DOME_C[1] + 2.3 * math.sin(a), 56.3)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Scale(0.95, 4)
eagle = import_model('bank-eagle', 'eagleSource')
if eagle is not None:
    stand_sourced(eagle, cut=0.2, turn=-90.0, height=4.0 * S, z=Z0 + 56.3 * S, mat=M['bronzeG'], report=False)
    eagle.matrix_world = Matrix.Translation((DOME_C[0] * S, (DOME_C[1] - FY) * S, 0.0))

# ------------------------------------------------------------------ the four small domes, the stage house behind
for sx in (-1, 1):
    for y in (-12.0, 30.0):
        cylinder(f'smallDrum{sx}{y:+.0f}', M['marbleW'], 6.2 * S, 3.8 * S, P(sx * 31.0, y, CORN + 1.2), segs=48)
        cylinder(f'smallDrumCap{sx}{y:+.0f}', M['marbleT'], 6.7 * S, 0.6 * S, P(sx * 31.0, y, CORN + 5.0), segs=48)
        tiled_dome(f'smallDome{sx}{y:+.0f}', sx * 31.0, y, CORN + 5.6, 6.0, 6.0, 8, 0.3)
        lathe(f'smallLantern{sx}{y:+.0f}', M['bronzeG'], [(0.9 * S, 0.0), (0.9 * S, 1.2 * S), (0.0, 2.6 * S)], P(sx * 31.0, y, CORN + 11.5), segs=12)
SX0, SX1, SY0, SY1 = -22.0, 22.0, 30.0, 58.0
block('stageHouse', M['marbleW'], SX0, SX1, SY0, SY1, -0.3, 34.0)
block('stageCornice', M['marbleT'], SX0 - 0.7, SX1 + 0.7, SY0 - 0.7, SY1 + 0.7, 34.0, 35.2)
hip_roof('stageRoof', M['leadRoof'], 0.0, (SY0 + SY1) / 2 * S - FY * S, Z0 + 35.2 * S, (SX1 - SX0 - 1.0) * S, (SY1 - SY0 - 1.0) * S, 5.0 * S, over=0.0)
for s in (-1, 1):
    for y in (36.0, 44.0, 52.0):
        c = P(s * (SX1 + 0.05), y, 0)
        WIN.append((c.x, c.y, Z0 + 24.0 * S, 3.4 * S, 7.0 * S, (s, 0), 'round'))
    for y in (SY0, SY1):
        pinnacle(f'stagePinnacle{s}{y:.0f}', s * (SX1 - 1.0), y + (1.0 if y == SY0 else -1.0), 35.2, 5.0, 2.0)
for x in (-12.0, 0.0, 12.0):
    c = P(x, SY0 - 0.05, 0)
    WIN.append((c.x, c.y, Z0 + 24.0 * S, 3.4 * S, 7.0 * S, (0, -1), 'round'))

# ------------------------------------------------------------------ the Pegasus statues on their pedestals, the steps, people
block('frontSteps', M['marbleT'], -20.0, 20.0, YP - 6.0, YP - 2.6, -0.3, 0.7, bevel=0)
block('frontSteps2', M['marbleT'], -19.0, 19.0, YP - 4.6, YP - 2.6, 0.7, 1.4, bevel=0)
PEG = [(-36.0, -46.0), (-22.0, -50.0), (22.0, -50.0), (36.0, -46.0)]
peg = import_model('bellas-artes-pegasus', 'pegasusSource')
if peg is not None:
    stand_sourced(peg, cut=0.47, turn=0.0, height=8.5 * S, z=0.0, mat=M['bronzeG'], report=False)
    peg.data.polygons.foreach_set('use_smooth', [True] * len(peg.data.polygons))
    pdata = peg.data
    bpy.data.objects.remove(peg, do_unlink=True)
for k, (x, y) in enumerate(PEG):
    block(f'pegasusPlinth{k}', M['marbleT'], x - 2.4, x + 2.4, y - 2.4, y + 2.4, -0.3, 1.0)
    block(f'pegasusPedestal{k}', M['marbleW'], x - 1.8, x + 1.8, y - 1.8, y + 1.8, 1.0, 4.6)
    block(f'pegasusPedestalCap{k}', M['marbleT'], x - 2.1, x + 2.1, y - 2.1, y + 2.1, 4.6, 5.2)
    if peg is not None:
        ob = bpy.data.objects.new(f'pegasus{k}', pdata)
        bpy.context.scene.collection.objects.link(ob)
        ob.matrix_world = Matrix.Translation(P(x, y, 5.2)) @ Matrix.Rotation(math.radians(-90.0 if x < 0 else 90.0), 4, 'Z')
glazed('windows', WIN, M['marbleT'], glass=M['glassB'], depth=0.3 * S)
glazed('doors', DOORS, M['marbleT'], glass=M['door'], depth=0.3 * S)
for k, (x, y, shirt) in enumerate(((-6.0, -44.0, 'red'), (4.0, -48.0, 'blue'), (-14.0, -54.0, 'yellow'), (10.0, -40.0, 'green'), (0.0, -58.0, 'red'), (28.0, -40.0, 'blue'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.75)

R = Matrix.Rotation(math.radians(-32.0 + 15.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('bellas-artes')
