# The Palace of Versailles in the high-quality look (hq.py), seen from its gardens, laid out in metres
# (the gardens shortened): the long garden front in pale stone, the central block standing forward with
# the Hall of Mirrors' tall arched windows, its columns, the rows of windows on the wings, the attic and
# the balustrade along the top crowned with trophies, the flat roofs behind it; the Royal Chapel's tall
# slate roof with its gilded ridge rising behind the north wing, and the old château's slate roofs
# behind the middle; the Parterre d'Eau's two great pools, the parterres either side with their beds,
# the Latona Fountain's marble tiers, the Tapis Vert lined with statues (a scanned statue, UBICA.srl,
# CC BY 4.0, in _sources/, in white marble), the Apollo Fountain's basin and the Grand Canal running
# away, the bosquets' woods either side; people.
# Run: blender -b --factory-startup -P versailles.py -- versailles-1024.png 1024 versailles.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1682)
M['stoneV'] = material('versaillesStone', '#e9ddc2', 0.65, vary='#ded1b4', vary_scale=18, bump=0.08, bump_scale=200)
M['stoneTrim'] = material('versaillesTrim', '#f2eadb', 0.55)
M['leadV'] = material('versaillesLead', '#8e9296', 0.45, vary='#83878b', vary_scale=12, metallic=0.3)
M['slateV'] = banded(material('versaillesSlate', '#4d545b', 0.5, vary='#454b52', vary_scale=12, metallic=0.2), 'Z', 300.0, strength=0.2)
M['gravelV'] = material('versaillesGravel', '#d9cfb6', 0.95, vary='#cec3a8', vary_scale=40, bump=0.15, bump_scale=300)
M['lawnV'] = material('tapisVert', '#6a9842', 0.85, vary='#5f8c3a', vary_scale=20, bump=0.15, bump_scale=200)
M['boxwood'] = material('boxwood', '#3d6431', 0.85, vary='#36592c', vary_scale=40)
M['bosquet'] = material('bosquetTrees', '#44683a', 0.85, vary='#4f7642', vary_scale=16, bump=0.3, bump_scale=90)
M['poolV'] = material('versaillesWater', '#6a9db5', 0.04, vary='#79abc2', vary_scale=3, coat=0.7)
M['redMarble'] = material('languedocMarble', '#b2584b', 0.35, vary='#c46a5b', vary_scale=30)
M['statueV'] = material('statueWhiteV', '#ece7df', 0.5, vary='#ddd7ce', vary_scale=40)
M['flowersV'] = material('flowersV', '#d0544a', 0.8, vary='#e7a54a', vary_scale=60)

S = 0.0062              # metres to the tile's units
Y0 = 0.5                # the central block's garden front, along the axis on the tile


def P(x, y, z):
    """A point x metres across, y metres along the axis (the gardens below 0, the palace above), z up."""
    return Vector((x * S, Y0 + y * S, G + z * S))


def T(x, y):
    return (x * S, Y0 + y * S)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def rect_slab(name, mat, x0, x1, y0, y1, z1, margin=0.04):
    return slab(name, mat, [T(x0, y0), T(x1, y0), T(x1, y1), T(x0, y1)], G - 0.002, G + z1 * S, margin=margin)


BEFORE = set(bpy.data.objects)
rect_slab('grounds', M['gravelV'], -400.0, 400.0, -500.0, 300.0, 0.1, margin=0.02)

# ------------------------------------------------------------------ the garden front: the central block, the wings, their windows, attic and balustrade
WIN = []
TROPHIES = bmesh.new()


def front(key, x0, x1, y, depth, columns=(), top=22.0):
    """A stretch of the garden front from x0 to x1 at y, `top` metres to its balustrade, its three storeys
    of windows, its attic and balustrade with a trophy on every pier."""
    up = top - 22.0
    block(key, M['stoneV'], x0, x1, y, y + depth, -0.3, top)
    block(key + 'Plinth', M['stoneTrim'], x0 - 0.3, x1 + 0.3, y - 0.4, y + 0.3, -0.3, 1.2)
    block(key + 'Cornice', M['stoneTrim'], x0 - 0.3, x1 + 0.3, y - 0.5, y + 0.3, 16.6 + up, 17.4 + up)
    block(key + 'Balustrade', M['stoneTrim'], x0, x1, y - 0.1, y + 0.6, top - 0.1, top + 1.4)
    block(key + 'Roof', M['leadV'], x0 + 0.6, x1 - 0.6, y + 0.6, y + depth - 0.6, top - 0.1, top + 1.0)
    n = int((x1 - x0) / 5.6)
    for k in range(n):
        x = x0 + (k + 0.5) * (x1 - x0) / n
        c = P(x, y - 0.05, 0)
        WIN.append((c.x, c.y, G + 2.0 * S, 2.2 * S, 4.6 * S, (0, -1), 'round'))
        WIN.append((c.x, c.y, G + 8.4 * S, 2.4 * S, 6.8 * S, (0, -1), 'round'))
        WIN.append((c.x, c.y, G + (18.2 + up) * S, 1.6 * S, 2.2 * S, (0, -1), 'rect'))
        for xp in (x0 + k * (x1 - x0) / n, x0 + (k + 1) * (x1 - x0) / n):
            p = P(xp, y + 0.25, top + 1.4)
            bmesh.ops.create_cube(TROPHIES, size=1.0, matrix=Matrix.Translation(p + Vector((0, 0, 0.45 * S))) @ Matrix.Diagonal((0.9 * S, 0.9 * S, 0.9 * S, 1)))
            bmesh.ops.create_icosphere(TROPHIES, subdivisions=1, radius=0.65 * S, matrix=Matrix.Translation(p + Vector((0, 0, 1.4 * S))) @ Matrix.Diagonal((1, 1, 1.3, 1)))
    for x in columns:
        column(f'{key}Column{x}', M['stoneTrim'], *T(x, y - 1.2), G + 8.0 * S, (9.0 + up) * S, 0.55 * S)
        p = P(x, y - 1.2, top)
        bmesh.ops.create_cube(TROPHIES, size=1.0, matrix=Matrix.Translation(p + Vector((0, 0, 0.8 * S))) @ Matrix.Diagonal((1.2 * S, 1.2 * S, 1.6 * S, 1)))
    for x in columns:
        STATUES.append((P(x, y - 1.2, top + 1.6), 2.6))


STATUES = []
front('centralBlock', -42.0, 42.0, 0.0, 72.0, columns=(-14.0, -8.4, -2.8, 2.8, 8.4, 14.0))
block('centralColumnsEntablature', M['stoneTrim'], -16.0, 16.0, -1.9, -0.3, 16.6, 17.6)
for sx in (-1, 1):
    x0, x1 = sorted((sx * 42.0, sx * 150.0))
    front(f'wing{sx}', x0, x1, 22.0, 30.0)
    # the pavilions at each wing's end and where it meets the central block
    for xa, xb in ((42.0, 62.0), (130.0, 150.0)):
        a, b = sorted((sx * xa, sx * xb))
        front(f'pavilion{sx}{xa}', a, b, 18.0, 36.0, columns=(a + 4.0, b - 4.0), top=23.2)
    # the side faces of the central block, between it and the wings
    xs = sx * 42.0
    for k in range(4):
        c = P(xs + sx * 0.05, 3.0 + 5.0 * k, 0)
        for z, h, shape in ((2.0, 4.6, 'round'), (8.4, 6.8, 'round'), (18.2, 2.2, 'rect')):
            WIN.append((c.x, c.y, G + z * S, 2.2 * S, h * S, (sx, 0), shape))
glazed('frontWindows', WIN, M['stoneTrim'], depth=0.3 * S)
finish('trophies', TROPHIES, M['stoneTrim'], smooth_sides=False)

# ------------------------------------------------------------------ behind: the old château's slate roofs, the Royal Chapel's tall roof
for k, (x0, x1, y0, y1, h, rise) in enumerate(((-40.0, 40.0, 72.0, 92.0, 24.0, 9.0), (-40.0, -20.0, 92.0, 130.0, 24.0, 9.0), (20.0, 40.0, 92.0, 130.0, 24.0, 9.0), (-20.0, 20.0, 118.0, 130.0, 24.0, 9.0))):
    block(f'chateau{k}', M['stoneV'], x0, x1, y0, y1, -0.3, h)
    hip_roof(f'chateauRoof{k}', M['slateV'], (x0 + x1) / 2 * S, Y0 + (y0 + y1) / 2 * S, G + (h - 0.05) * S, (x1 - x0) * S, (y1 - y0) * S, rise * S, over=0.002)
block('chapel', M['stoneV'], -118.0, -96.0, 52.0, 100.0, -0.3, 26.0)
gable_roof('chapelRoof', M['slateV'], -118.0 * S, -96.0 * S, Y0 + 52.0 * S, Y0 + 100.0 * S, G + 25.95 * S, 17.0 * S, over=0.002, along='y')
tube('chapelRidge', M['gold'], [P(-107.0, 52.0 + 48.0 * k / 8, 43.2) for k in range(9)], 0.45 * S)
for k in range(5):
    lathe(f'chapelRidgeOrnament{k}', M['gold'], [(0.0, 0.0), (0.6 * S, 0.8 * S), (0.2 * S, 2.6 * S), (0.0, 3.2 * S)], P(-107.0, 56.0 + 10.0 * k, 42.8), segs=8, smooth=True)
c = P(-118.05, 76.0, 0)
glazed('chapelWindows', [(c.x, c.y + (y - 76.0) * S, G + 12.0 * S, 3.0 * S, 11.0 * S, (-1, 0), 'round') for y in (60.0, 68.0, 76.0, 84.0, 92.0)], M['stoneTrim'], depth=0.3 * S)

# ------------------------------------------------------------------ the Parterre d'Eau's two pools, and the parterres either side
for sx in (-1, 1):
    x0, x1 = sorted((sx * 4.0, sx * 54.0))
    pts = [(x0 + 4.0, -18.0), (x1 - 4.0, -18.0), (x1, -22.0), (x1, -64.0), (x1 - 4.0, -68.0), (x0 + 4.0, -68.0), (x0, -64.0), (x0, -22.0)]
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(x, y, 0.0)) for x, y in pts], [bm_.verts.new(P(x, y, 0.6)) for x, y in pts])
    finish(f'poolRim{sx}', bm_, M['stoneTrim'], smooth_sides=False)
    inner = [(x0 + 4.0, -19.0), (x1 - 4.0, -19.0), (x1 - 1.0, -22.0), (x1 - 1.0, -64.0), (x1 - 4.0, -67.0), (x0 + 4.0, -67.0), (x0 + 1.0, -64.0), (x0 + 1.0, -22.0)]
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(x, y, 0.3)) for x, y in inner], [bm_.verts.new(P(x, y, 0.72)) for x, y in inner])
    finish(f'pool{sx}', bm_, M['poolV'], smooth_sides=False)
    # the parterre beside it: beds edged with box, flowers in their borders
    for j in range(2):
        for i in range(2):
            bx0 = sx * (66.0 + 40.0 * i)
            bx1 = sx * (100.0 + 40.0 * i)
            a, b = sorted((bx0, bx1))
            y0, y1 = -20.0 - 26.0 * j, -42.0 - 26.0 * j
            rect_slab(f'bed{sx}{i}{j}', M['lawnV'], a, b, y1, y0, 0.35)
            rect_slab(f'bedBox{sx}{i}{j}', M['boxwood'], a + 1.0, b - 1.0, y1 + 1.0, y0 - 1.0, 0.75)
            rect_slab(f'bedLawn{sx}{i}{j}', M['lawnV'], a + 2.0, b - 2.0, y1 + 2.0, y0 - 2.0, 0.85)
            rect_slab(f'bedFlowers{sx}{i}{j}', M['flowersV'], a + 4.0, b - 4.0, (y0 + y1) / 2 - 1.0, (y0 + y1) / 2 + 1.0, 1.0)

# ------------------------------------------------------------------ the Latona Fountain: its basin and its marble tiers
LY = -110.0
c = P(0.0, LY, 0)
lathe('latonaBasin', M['stoneTrim'], [(r * S, z * S) for r, z in ((26.0, 0.0), (26.0, 0.8), (25.2, 0.8), (25.2, 0.4), (0.0, 0.4))], (c.x, c.y, G), segs=64, sy=0.8)
lathe('latonaWater', M['poolV'], [(25.2 * S, 0.0), (25.2 * S, 0.65 * S), (0.0, 0.65 * S)], (c.x, c.y, G + 0.05 * S), segs=64, sy=0.8)
for k, (r, z0, h, mat) in enumerate(((13.0, 0.5, 1.2, 'stoneTrim'), (10.0, 1.6, 1.2, 'stoneTrim'), (7.0, 2.7, 1.2, 'stoneTrim'), (4.2, 3.8, 1.4, 'stoneTrim'), (2.2, 5.1, 2.0, 'redMarble'))):
    lathe(f'latonaTier{k}', M[mat], [(r * S, 0.0), (r * S, h * S), ((r - 0.6) * S, h * S), ((r - 0.6) * S, (h - 0.3) * S), (0.0, (h - 0.3) * S)], (c.x, c.y, G + z0 * S), segs=48, sy=0.85)
STATUES.append((P(0.0, LY, 7.0), 3.4))

# ------------------------------------------------------------------ the Tapis Vert and its statues, the Apollo Fountain, the Grand Canal
TY0, TY1 = -135.0, -185.0
rect_slab('tapisVert', M['lawnV'], -20.0, 20.0, TY1, TY0, 0.3)
for sx in (-1, 1):
    for k in range(4):
        y = TY0 - 6.0 - 12.0 * k
        p = P(sx * 26.0, y, 0.1)
        STATUES.append((p + Vector((0, 0, 2.0 * S)), 2.8))
        block(f'tapisPedestal{sx}{k}', M['stoneTrim'], sx * 26.0 - 0.8, sx * 26.0 + 0.8, y - 0.8, y + 0.8, 0.0, 2.0)
AY = -212.0
c = P(0.0, AY, 0)
lathe('apolloBasin', M['stoneTrim'], [(r * S, z * S) for r, z in ((46.0, 0.0), (46.0, 0.7), (45.0, 0.7), (45.0, 0.3), (0.0, 0.3))], (c.x, c.y, G), segs=64, sx=1.0, sy=0.62)
lathe('apolloWater', M['poolV'], [(45.0 * S, 0.0), (45.0 * S, 0.55 * S), (0.0, 0.55 * S)], (c.x, c.y, G + 0.05 * S), segs=64, sy=0.62)
lathe('apolloGroup', M['gold'], [(r * S, z * S) for r, z in ((5.0, 0.0), (4.0, 1.2), (2.0, 2.4), (0.6, 4.0), (0.0, 4.4))], (c.x, c.y, G + 0.4 * S), segs=16, sx=1.6, sy=0.7)
slab('grandCanal', M['poolV'], [T(-31.0, -246.0), T(31.0, -246.0), T(31.0, -900.0), T(-31.0, -900.0)], G - 0.001, G + 0.65 * S, margin=0.03)
slab('canalEdge', M['stoneTrim'], [T(-32.5, -244.5), T(32.5, -244.5), T(32.5, -900.0), T(-32.5, -900.0)], G - 0.002, G + 0.5 * S, margin=0.025)

# ------------------------------------------------------------------ the bosquets' woods either side of the axis
WOOD = []
for k in range(22000):
    x, y = rng.uniform(-330.0, 330.0), rng.uniform(-460.0, -80.0)
    p = Vector(T(x, y))
    beyond_latona = y < -137.0 and abs(x) > 34.0 and not (abs(y - AY) < 34.0 and abs(x) < 58.0)
    beside_latona = -137.0 <= y < -80.0 and abs(x) > 64.0
    if p.length > 1.41 or not (beyond_latona or beside_latona):
        continue
    r = rng.uniform(0.011, 0.017)
    WOOD.append(((p.x, p.y, G + r * 0.8), r, 0.9))
blob_cloud('bosquets', M['bosquet'], WOOD)


def statue_mesh(cut, height):
    src = import_model('madonnina', 'statueSource')
    stand_sourced(src, cut=cut, turn=0.0, height=height, z=0.0, mat=None, report=False)
    mod = src.modifiers.new('decimate', 'DECIMATE')
    mod.ratio = min(1.0, 6000.0 / len(src.data.polygons))
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(src.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(src, do_unlink=True)
    me.materials.clear()
    me.materials.append(M['statueV'])
    for p in me.polygons:
        p.material_index = 0
        p.use_smooth = True
    return me


figure = statue_mesh(0.34, 1.0)
for k, (p, h) in enumerate(STATUES):
    ob = bpy.data.objects.new(f'statue{k}', figure)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(p) @ Matrix.Scale(h * S, 4)

for k, (x, y, shirt) in enumerate(((-10.0, -12.0, 'red'), (12.0, -10.0, 'blue'), (0.0, -80.0, 'yellow'), (-24.0, -100.0, 'green'), (20.0, -120.0, 'red'), (-6.0, -165.0, 'blue'),
                                   (8.0, -200.0, 'green'), (-4.0, -240.0, 'yellow'), (60.0, -90.0, 'red'), (-70.0, -14.0, 'blue'))):
    person(f'p{k}', *T(x, y), rng.random() * 6, shirt, z=G + 0.1 * S, scale=0.5)

# the whole layout turned so the axis runs straight into the view: the palace at the back, the canal in front
R = Matrix.Rotation(math.radians(-32.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('versailles')
