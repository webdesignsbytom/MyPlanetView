# The Château de Chambord in the high-quality look (hq.py), its great north-west front turned straight to
# the camera: the keep in the middle of the front with its round towers, the wings either side ending
# in their great round corner towers, the famous roofscape crowded with chimneys, dormers and turrets
# round the lantern of the double staircase, the low ranges round the courtyard behind (the modelled
# château in _sources/chambord/, Benjamin Bandić, CC BY 4.0, given the diorama's tuffeau and slate);
# the gravel round it, the lawns, the Cosson's canal before it, and the forest of the park beyond.
# Run: blender -b --factory-startup -P chambord.py -- chambord-1024.png 1024 chambord.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
BEFORE = set(bpy.data.objects)
rng = random.Random(1519)
M['tuffeau'] = material('tuffeau', '#ede5d1', 0.7, vary='#e2d8c1', vary_scale=18, bump=0.08, bump_scale=200)
M['tuffeauShade'] = material('tuffeauShade', '#ddd3bd', 0.75, vary='#d3c8b0', vary_scale=18, bump=0.08, bump_scale=200)
M['slateC'] = banded(material('chambordSlate', '#4c5560', 0.5, vary='#434b55', vary_scale=14, metallic=0.2), 'Z', 300.0, strength=0.2)
M['gravelC'] = material('chambordGravel', '#d6cdb6', 0.95, vary='#cbc1a8', vary_scale=40, bump=0.15, bump_scale=300)
M['lawnC'] = material('chambordLawn', '#73a14a', 0.85, vary='#679443', vary_scale=20, bump=0.15, bump_scale=200)
M['cosson'] = material('cosson', '#4f7f8a', 0.06, vary='#5b8b95', vary_scale=3, coat=0.6, bump=0.1, bump_scale=40)
M['forest'] = material('soloForest', '#3f6233', 0.85, vary='#4b7040', vary_scale=16, bump=0.3, bump_scale=90)
Z0 = G + 0.004

# ------------------------------------------------------------------ the grounds: lawns, the gravel round the château, the Cosson in front
slab('lawns', M['lawnC'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0 - 0.001, margin=0.02)
slab('gravel', M['gravelC'], rect(0.0, 0.02, 2.06, 1.86), G - 0.003, Z0, margin=0.05)
slab('cosson', M['cosson'], [(-2.0, -1.26), (2.0, -1.26), (2.0, -1.08), (-2.0, -1.08)], G - 0.003, Z0 - 0.0005, margin=0.03)
for k, y in enumerate((-1.275, -1.065)):
    slab(f'cossonBank{k}', M['tuffeauShade'], [(-2.0, y - 0.012), (2.0, y - 0.012), (2.0, y + 0.012), (-2.0, y + 0.012)], G - 0.003, Z0 + 0.002, margin=0.03)

# ------------------------------------------------------------------ the château: stone walls, slate roofs and cones, stone chimneys and lanterns
STONE, SHADE, SLATE = range(3)
src = import_model('chambord', 'chateau')
me = src.data
vs = [v.co for v in me.vertices]
xs, ys, zs = [v.x for v in vs], [v.y for v in vs], [v.z for v in vs]
cx, cy, zmin, zmax = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs), max(zs)
reach = max(math.hypot(v.x - cx, v.y - cy) for v in vs)
K = 1.18 / reach
me.transform(Matrix.Translation((0, 0, Z0 - 0.0005)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-cx, -cy, -zmin)))
H = (zmax - zmin) * K
for m in (M['tuffeau'], M['tuffeauShade'], M['slateC']):
    me.materials.append(m)
ROOFS_FROM = 0.42           # roofs and cones start above this share of the height
for p in me.polygons:
    nz = p.normal.z
    h = (p.center.z - Z0) / H
    if abs(nz) < 0.2:
        p.material_index = STONE
    elif nz > 0.2 and h > ROOFS_FROM and nz < 0.97:
        p.material_index = SLATE
    else:
        p.material_index = SHADE
print('CHATEAU', 'height', round(H, 3), 'scale', round(K, 5), 'faces', len(me.polygons))

# ------------------------------------------------------------------ the forest of the park behind and beside, clear of the château and its front
trees = []
for k in range(16000):
    x, y = rng.uniform(-1.5, 1.5), rng.uniform(-1.0, 1.5)
    r = math.hypot(x, y)
    if r > 1.42 or (abs(x) < 1.08 and y < 0.98) or y < -0.95:
        continue
    s = rng.uniform(0.016, 0.024)
    trees.append(((x, y, Z0 + s * 0.9), s, 0.9))
blob_cloud('parkForest', M['forest'], trees)
for k, (x, y, shirt) in enumerate(((-0.35, -0.95, 'red'), (0.1, -0.98, 'blue'), (0.5, -0.96, 'yellow'), (-0.75, -0.9, 'green'), (0.85, -0.92, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0, scale=0.8)

# the whole layout turned so the front faces the camera squarely
R = Matrix.Rotation(math.radians(-32.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('chambord')
