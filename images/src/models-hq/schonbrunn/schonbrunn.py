# Schönbrunn Palace in the high-quality look (hq.py), seen from its courtyard, laid out in metres (the
# gardens shortened): the long Baroque palace in Schönbrunn yellow, its central block and corner
# pavilions standing forward, its rows of white-framed windows and white pilasters, the grey-green roofs
# and their chimneys, the courtyard's wings; the courtyard with its two fountains; behind the palace the
# Great Parterre, its flower beds in patterns, gravel walks and the statues along them (a scanned
# statue, UBICA.srl, CC BY 4.0, in _sources/, in white marble), framed by its walls of clipped trees; the
# Neptune Fountain's basin and grotto at the foot of the hill; and on the hilltop the Gloriette, its
# open arches and colonnades over their pool, the wooded slopes either side of the zigzag paths; people.
# Run: blender -b --factory-startup -P schonbrunn.py -- schonbrunn-1024.png 1024 schonbrunn.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1743)
M['yellow'] = material('schonbrunnYellow', '#e9c45a', 0.75, vary='#e0b94e', vary_scale=18, bump=0.06, bump_scale=200)
M['trim'] = material('schonbrunnTrim', '#f4efe3', 0.6, vary='#ebe5d8', vary_scale=18)
M['roofGG'] = banded(material('schonbrunnRoof', '#7b8985', 0.55, vary='#6f7c78', vary_scale=12, metallic=0.25), 'Z', 240.0, strength=0.2)
M['gloriette'] = material('gloriette', '#ece6d6', 0.6, vary='#e1dac8', vary_scale=18, bump=0.08, bump_scale=200)
M['gravelS'] = material('schonbrunnGravel', '#d8cdb3', 0.95, vary='#cbbfa3', vary_scale=40, bump=0.15, bump_scale=300)
M['parterre'] = material('parterreLawn', '#5d8a3a', 0.85, vary='#538033', vary_scale=20, bump=0.15, bump_scale=200)
M['hedge'] = material('clippedHedge', '#3b5f2c', 0.85, vary='#33552a', vary_scale=40, bump=0.35, bump_scale=120)
M['flowersR'] = material('flowersRed', '#c0393b', 0.8, vary='#d65a3a', vary_scale=60)
M['flowersW'] = material('flowersWhite', '#f1ece0', 0.8, vary='#e8d9e3', vary_scale=60)
M['hillGrass'] = material('gloriettHill', '#78a04a', 0.9, vary='#6b9242', vary_scale=14, bump=0.2, bump_scale=200)
M['fountainWater'] = material('fountainWater', '#5a9aa8', 0.05, vary='#6aa8b4', vary_scale=3, coat=0.6)
M['grotto'] = material('grottoRock', '#a7a092', 0.9, vary='#8f897c', vary_scale=14, bump=0.5, bump_scale=60)
M['statueWhite'] = material('statueWhiteS', '#ece7df', 0.5, vary='#ddd7ce', vary_scale=40)

S = 0.007               # metres to the tile's units
YF = -0.55              # the palace's courtyard front on the tile


def P(x, y, z):
    """A point x metres along the palace, y metres from its courtyard front towards the Gloriette."""
    return Vector((x * S, YF + y * S, G + z * S))


def T(x, y):
    return (x * S, YF + y * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def rect_slab(name, mat, x0, x1, y0, y1, z1, margin=0.04):
    return slab(name, mat, [T(x0, y0), T(x1, y0), T(x1, y1), T(x0, y1)], G - 0.002, G + z1 * S, margin=margin)


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------------ the ground: level gardens, and the Gloriette's hill behind
HILL_FOOT, HILL_TOP, HILL_H = 168.0, 244.0, 38.0        # where the hill starts and ends (metres back), how high


def H(x, y):
    m = (y - YF) / S
    rim = smooth((1.47 - math.hypot(x, y)) / 0.18)
    return HILL_H * S * smooth((m - HILL_FOOT) / (HILL_TOP - HILL_FOOT)) * rim


def pick(z, nz, x, y):
    m = (y - YF) / S
    if m > HILL_FOOT and abs(x / S) > 22.0 and z > 0.004:
        return 2
    if abs(x / S) > 104.0 and m > -64.0:
        return 2
    return 1 if m > HILL_FOOT - 4.0 else 0


# the whole layout is turned so its axis runs straight into the view (palace in front, Gloriette at the
# back): the ground is made turned, everything else is built straight and turned at the end
TURN = math.radians(-32.0)


def unturn(x, y):
    c, s_ = math.cos(-TURN), math.sin(-TURN)
    return x * c - y * s_, x * s_ + y * c


ground = terrain('ground', lambda x, y: H(*unturn(x, y)), [M['gravelS'], M['hillGrass'], M['hedge']], lambda z, nz, x, y: pick(z, nz, *unturn(x, y)), rings=200, segs=520)
wood_rng = random.Random(29)
blob_cloud('parkWoods', M['hedge'], [(p + Vector((0, 0, r * 0.7)), r, 0.9) for p in scatter_on(ground, 14000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 2 and math.hypot(p.x, p.y) < 1.42)
                                     for r in (wood_rng.uniform(0.014, 0.022),)])
BEFORE = set(bpy.data.objects)


def hill_z(m):
    return HILL_H * smooth((m - HILL_FOOT) / (HILL_TOP - HILL_FOOT))


# ------------------------------------------------------------------ the palace: its long block, the central block and pavilions, windows and pilasters
W2, D, HTOP = 87.5, 25.0, 21.0
block('palace', M['yellow'], -W2, W2, 0.0, D, -0.3, HTOP)
hip_roof('palaceRoof', M['roofGG'], 0.0, YF + D / 2 * S, G + (HTOP - 0.05) * S, 2 * W2 * S, D * S, 9.0 * S, over=0.004)
block('centralBlock', M['yellow'], -27.0, 27.0, -4.0, D + 4.0, -0.3, HTOP + 3.0)
hip_roof('centralRoof', M['roofGG'], 0.0, YF + D / 2 * S, G + (HTOP + 2.95) * S, 54.0 * S, (D + 8.0) * S, 9.5 * S, over=0.004)
for sx in (-1, 1):
    x0, x1 = sorted((sx * 68.0, sx * (W2 + 0.6)))
    block(f'pavilion{sx}', M['yellow'], x0, x1, -3.0, D + 3.0, -0.3, HTOP + 1.0)
    hip_roof(f'pavilionRoof{sx}', M['roofGG'], (x0 + x1) / 2 * S, YF + D / 2 * S, G + (HTOP + 0.95) * S, (x1 - x0) * S, (D + 6.0) * S, 8.5 * S, over=0.004)
    # the courtyard's long low wings
    x0, x1 = sorted((sx * 78.0, sx * 92.0))
    block(f'courtWing{sx}', M['yellow'], x0, x1, -62.0, -3.05, -0.3, 11.0)
    gable_roof(f'courtWingRoof{sx}', M['roofGG'], x0 * S, x1 * S, YF - 62.0 * S, YF + 4.0 * S, G + 10.95 * S, 5.5 * S, over=0.003, along='y')
for name, x0, x1, y0, z1 in (('base', -W2 - 0.4, W2 + 0.4, -0.4, 1.4), ('centralBase', -27.4, 27.4, -4.4, 1.4)):
    block(name, M['trim'], x0, x1, y0, y0 + 0.6, -0.3, z1)
for name, x0, x1, y0, z0 in (('cornice', -W2 - 0.3, W2 + 0.3, -0.35, HTOP - 1.0), ('centralCornice', -27.3, 27.3, -4.35, HTOP + 2.0)):
    block(name, M['trim'], x0, x1, y0, y0 + 0.6, z0, z0 + 0.9)
WIN = []
PILASTERS = bmesh.new()


def front_row(x0, x1, y, nx_ny, wings_z_top):
    """The windows and the white pilasters between them along one stretch of front."""
    n = int((x1 - x0) / 4.5)
    for k in range(n):
        x = x0 + (k + 0.5) * (x1 - x0) / n
        c = P(x, y - 0.05, 0)
        for z, h in ((2.4, 2.6), (7.6, 3.6), (13.6, 2.8), (17.6, 1.4)):
            if z + h < wings_z_top - 1.0:
                WIN.append((c.x, c.y, G + z * S, 1.7 * S, h * S, nx_ny, 'rect'))
        xp = x0 + k * (x1 - x0) / n
        bmesh.ops.create_cube(PILASTERS, size=1.0, matrix=Matrix.Translation(P(xp, y - 0.2, wings_z_top / 2)) @ Matrix.Diagonal((0.9 * S, 0.4 * S, wings_z_top * S, 1)))


front_row(-68.0, -27.0, 0.0, (0, -1), HTOP)
front_row(27.0, 68.0, 0.0, (0, -1), HTOP)
front_row(-27.0, 27.0, -4.0, (0, -1), HTOP + 3.0)
front_row(-W2 - 0.6, -68.0, -3.0, (0, -1), HTOP + 1.0)
front_row(68.0, W2 + 0.6, -3.0, (0, -1), HTOP + 1.0)
for k in range(5):
    y = 1.0 + k * 5.0
    c = P(-W2 - 0.65, y + 2.5, 0)
    for z, h in ((2.4, 2.6), (7.6, 3.6), (13.6, 2.8)):
        WIN.append((c.x, c.y, G + z * S, 1.7 * S, h * S, (-1, 0), 'rect'))
for sx in (-1, 1):
    xw = sx * 78.0
    for k in range(11):
        y = -58.0 + 5.0 * k
        c = P(xw - sx * 0.05, y, 0)
        for z, h in ((2.2, 2.4), (6.6, 2.8)):
            WIN.append((c.x, c.y, G + z * S, 1.5 * S, h * S, (-sx, 0), 'rect'))
glazed('palaceWindows', WIN, M['trim'], depth=0.25 * S)
finish('pilasters', PILASTERS, M['trim'], smooth_sides=False)
CHIMNEYS = bmesh.new()
for x in (-75.0, -55.0, -40.0, 40.0, 55.0, 75.0, -15.0, 15.0):
    bmesh.ops.create_cube(CHIMNEYS, size=1.0, matrix=Matrix.Translation(P(x, 6.0, HTOP + 6.5)) @ Matrix.Diagonal((1.2 * S, 1.2 * S, 4.0 * S, 1)))
    bmesh.ops.create_cube(CHIMNEYS, size=1.0, matrix=Matrix.Translation(P(x, D - 6.0, HTOP + 6.5)) @ Matrix.Diagonal((1.2 * S, 1.2 * S, 4.0 * S, 1)))
finish('chimneys', CHIMNEYS, M['trim'], smooth_sides=False)

# ------------------------------------------------------------------ the courtyard and its two fountains
rect_slab('courtyard', M['gravelS'], -78.0, 78.0, -62.0, -0.5, 0.15)
for sx in (-1, 1):
    c = P(sx * 42.0, -34.0, 0)
    lathe(f'courtFountain{sx}', M['trim'], [(r * S, z * S) for r, z in ((7.5, 0.0), (7.5, 0.9), (6.9, 0.9), (6.9, 0.4), (0.0, 0.4))], (c.x, c.y, G), segs=40)
    cylinder(f'courtFountainWater{sx}', M['fountainWater'], 6.9 * S, 0.7 * S, (c.x, c.y, G + 0.1 * S), segs=40)
    lathe(f'courtFountainPedestal{sx}', M['trim'], [(r * S, z * S) for r, z in ((1.6, 0.0), (1.2, 1.0), (1.0, 2.6), (1.8, 2.9), (0.0, 3.2))], (c.x, c.y, G + 0.5 * S), segs=16, smooth=True)

# ------------------------------------------------------------------ the Great Parterre: its beds, walks and statues, framed by clipped trees
PY0, PY1 = 28.0, 152.0
rect_slab('parterreWalks', M['gravelS'], -96.0, 96.0, PY0, PY1, 0.12)
BEDS_G, BEDS_R, BEDS_W = [], [], []
for sx in (-1, 1):
    for j in range(4):
        y0, y1 = PY0 + 6.0 + 30.0 * j, PY0 + 30.0 * (j + 1)
        x0, x1 = sorted((sx * 8.0, sx * 44.0))
        BEDS_G.append((x0, x1, y0, y1))
        x0, x1 = sorted((sx * 52.0, sx * 88.0))
        BEDS_G.append((x0, x1, y0, y1))
for k, (x0, x1, y0, y1) in enumerate(BEDS_G):
    rect_slab(f'bed{k}', M['parterre'], x0, x1, y0, y1, 0.3)
    rect_slab(f'bedBorder{k}', M['flowersR'], x0 + 1.0, x1 - 1.0, y0 + 1.0, y0 + 2.4, 0.55)
    rect_slab(f'bedBorderB{k}', M['flowersR'], x0 + 1.0, x1 - 1.0, y1 - 2.4, y1 - 1.0, 0.55)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    lathe(f'bedRound{k}', M['flowersW'], [(r * S, z * S) for r, z in ((5.0, 0.0), (5.0, 0.6), (0.0, 0.6))], P(cx, cy, 0.0), segs=24)
    for dx in (-11.0, 11.0):
        rect_slab(f'bedStrip{k}{dx}', M['flowersW'], cx + dx - 1.0, cx + dx + 1.0, y0 + 4.0, y1 - 4.0, 0.5)
for sx in (-1, 1):
    x0, x1 = sorted((sx * 96.0, sx * 104.0))
    block(f'treeWall{sx}', M['hedge'], x0, x1, PY0 - 2.0, PY1 + 12.0, -0.3, 13.0, bevel=0.002)


def statue_mesh(cut, height):
    src = import_model('madonnina', 'statueSource')
    stand_sourced(src, cut=cut, turn=0.0, height=height, z=0.0, mat=None, report=False)
    mod = src.modifiers.new('decimate', 'DECIMATE')
    mod.ratio = min(1.0, 6000.0 / len(src.data.polygons))
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(src.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(src, do_unlink=True)
    me.materials.clear()
    me.materials.append(M['statueWhite'])
    for p in me.polygons:
        p.material_index = 0
        p.use_smooth = True
    return me


figure = statue_mesh(0.34, 1.0)
PEDESTALS = bmesh.new()
for sx in (-1, 1):
    for j in range(9):
        y = PY0 + 4.0 + 15.0 * j
        p = P(sx * 93.0, y, 0)
        bmesh.ops.create_cube(PEDESTALS, size=1.0, matrix=Matrix.Translation(p + Vector((0, 0, 1.1 * S))) @ Matrix.Diagonal((1.4 * S, 1.4 * S, 2.2 * S, 1)))
        ob = bpy.data.objects.new(f'statue{sx}{j}', figure)
        bpy.context.scene.collection.objects.link(ob)
        ob.matrix_world = Matrix.Translation(p + Vector((0, 0, 2.2 * S))) @ Matrix.Rotation(-sx * math.pi / 2, 4, 'Z') @ Matrix.Scale(3.2 * S, 4)
finish('pedestals', PEDESTALS, M['trim'], smooth_sides=False)

# ------------------------------------------------------------------ the Neptune Fountain at the hill's foot
NY = 160.0
c = P(0.0, NY, 0)
lathe('neptuneBasin', M['trim'], [(r * S, z * S) for r, z in ((20.0, 0.0), (20.0, 1.0), (19.2, 1.0), (19.2, 0.4), (0.0, 0.4))], (c.x, c.y, G), segs=48, sy=0.5)
lathe('neptuneWater', M['fountainWater'], [(19.2 * S, 0.0), (19.2 * S, 0.75 * S), (0.0, 0.75 * S)], (c.x, c.y, G + 0.05 * S), segs=48, sy=0.5)
bm_ = bmesh.new()
for k in range(14):
    a = math.pi * k / 13
    r = rng.uniform(2.0, 3.6)
    bmesh.ops.create_icosphere(bm_, subdivisions=2, radius=r * S, matrix=Matrix.Translation(P(14.0 * math.cos(a) * 0.6, NY + 5.0 * math.sin(a) * 0.5 + 2.0, rng.uniform(1.0, 4.0))) @ Matrix.Diagonal((1.2, 1.0, 0.9, 1)))
bmesh.ops.create_icosphere(bm_, subdivisions=3, radius=6.0 * S, matrix=Matrix.Translation(P(0.0, NY + 3.0, 2.5)) @ Matrix.Diagonal((1.5, 0.8, 1.0, 1)))
finish('neptuneGrotto', bm_, M['grotto'], smooth_all=True)
for k, dx in enumerate((-6.0, 0.0, 6.0)):
    ob = bpy.data.objects.new(f'neptuneFigure{k}', figure)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(P(dx, NY + 3.0, 6.5 if dx == 0.0 else 4.8)) @ Matrix.Scale((4.2 if dx == 0.0 else 3.0) * S, 4)

# ------------------------------------------------------------------ the zigzag paths up the hill, and the Gloriette on top with its pool
PATHS = bmesh.new()
for k in range(5):
    m0, m1 = HILL_FOOT + 4.0 + (HILL_TOP - HILL_FOOT - 8.0) * k / 5, HILL_FOOT + 4.0 + (HILL_TOP - HILL_FOOT - 8.0) * (k + 1) / 5
    xa, xb = (-18.0, 18.0) if k % 2 == 0 else (18.0, -18.0)
    for j in range(12):
        t0, t1 = j / 12, (j + 1) / 12
        pa = P(xa + (xb - xa) * t0, m0 + (m1 - m0) * t0, hill_z(m0 + (m1 - m0) * t0) + 0.15)
        pb = P(xa + (xb - xa) * t1, m0 + (m1 - m0) * t1, hill_z(m0 + (m1 - m0) * t1) + 0.15)
        d = pb - pa
        bmesh.ops.create_cube(PATHS, size=1.0, matrix=Matrix.Translation((pa + pb) / 2) @ d.normalized().to_track_quat('X', 'Z').to_matrix().to_4x4() @ Matrix.Diagonal((d.length, 3.0 * S, 0.4 * S, 1)))
finish('hillPaths', PATHS, M['gravelS'], smooth_sides=False)
GY = HILL_TOP + 8.0
GZ = hill_z(GY) - 0.3
rect_slab('glorietteTerrace', M['gravelS'], -84.0, 84.0, HILL_TOP - 16.0, GY + 10.0, hill_z(HILL_TOP) + 0.12, margin=0.05)
rect_slab('gloriettePoolRim', M['trim'], -18.0, 18.0, HILL_TOP - 13.0, HILL_TOP - 3.0, hill_z(HILL_TOP) + 0.55, margin=0.05)
rect_slab('glorettePool', M['fountainWater'], -17.0, 17.0, HILL_TOP - 12.0, HILL_TOP - 4.0, hill_z(HILL_TOP) + 0.75, margin=0.05)


def gz(z):
    return GZ + z


# the central arch: three great open arches under an attic
out = [(-22.0, gz(22.0)), (-22.0, gz(0.0))]
for xc, half in ((-12.5, 4.5), (0.0, 5.5), (12.5, 4.5)):
    spring = 8.0 if half < 5 else 9.0
    out += [(xc - half, gz(0.0)), (xc - half, gz(spring))] + [(xc - half * math.cos(math.pi * k / 10), gz(spring + half * math.sin(math.pi * k / 10))) for k in range(1, 10)] + [(xc + half, gz(spring)), (xc + half, gz(0.0))]
out += [(22.0, gz(0.0)), (22.0, gz(22.0))]
bm_ = bmesh.new()
add_prism(bm_, [bm_.verts.new(P(x, GY, z)) for x, z in out], [bm_.verts.new(P(x, GY + 9.0, z)) for x, z in out])
finish('glorietteCentre', bm_, M['gloriette'], smooth_sides=False)
block('glorietteAttic', M['gloriette'], -22.5, 22.5, GY - 0.5, GY + 9.5, gz(21.9), gz(24.5))
block('glorietteTrophy', M['statueWhite'], -2.0, 2.0, GY + 3.5, GY + 5.5, gz(24.4), gz(28.0))
for sx in (-1, 1):
    pts = [((sx * (22.0 + 4.0 * k)) * S, YF + GY * S) for k in range(15)]
    arcade_path(f'glorietteColonnade{sx}', M['gloriette'], pts if sx > 0 else list(reversed(pts)), 1.4 * S, G + gz(9.0) * S, 4.5 * S, 1.5 * S)
    arcade_path(f'glorietteColonnadeBack{sx}', M['gloriette'], [(x, y + 7.6 * S) for x, y in (pts if sx > 0 else list(reversed(pts)))], 1.4 * S, G + gz(9.0) * S, 4.5 * S, 1.5 * S)
    for k in range(15):
        for dy in (0.7, 8.3):
            column(f'glorietteColumn{sx}{k}{dy}', M['gloriette'], sx * (22.0 + 4.0 * k) * S, YF + (GY + dy) * S, G + gz(0.0) * S, 9.05 * S, 0.45 * S)
    x0, x1 = sorted((sx * 22.0, sx * 80.0))
    block(f'glorietteRoof{sx}', M['gloriette'], x0, x1, GY - 0.3, GY + 9.3, gz(13.45), gz(14.4))
    block(f'glorietteBalustrade{sx}', M['trim'], x0, x1, GY - 0.3, GY + 0.4, gz(14.35), gz(15.4))

for k, (x, y, shirt) in enumerate(((-20.0, -20.0, 'red'), (15.0, -28.0, 'blue'), (-5.0, -45.0, 'yellow'), (50.0, -15.0, 'green'), (0.0, 60.0, 'red'), (-4.0, 90.0, 'blue'),
                                   (48.0, 100.0, 'yellow'), (-48.0, 70.0, 'green'), (5.0, 130.0, 'red'), (-30.0, -50.0, 'blue'))):
    person(f'p{k}', *T(x, y), rng.random() * 6, shirt, z=G + 0.15 * S, scale=0.5)

R = Matrix.Rotation(TURN, 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('schonbrunn')
