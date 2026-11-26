# Casa Batlló in the high-quality look (hq.py), turned to face the camera on the Passeig de Gràcia:
# Gaudí's house with its own colours (the modelled house in _sources/casa-batllo/, Roberto Domínguez,
# CC BY 4.0: its tiled front shimmering blue, green and lilac, the bone-like columns of the first floor,
# the mask balconies, the dragon's-back roof of coloured scales and the tower with its four-armed cross
# kept as its author made them, the mosaic being the landmark); the avenue's grey-green pavement, its
# modernista lamp posts, the road in front, and people.
# Run: blender -b --factory-startup -P casa-batllo.py -- casa-batllo-1024.png 1024 casa-batllo.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1906)
M['panot'] = masonry('panotGaudi', '#a3aa9d', '#7e857a', scale=150, rough=0.8, vary='#979e91')
M['asphaltG'] = material('asphaltGracia', '#4f4e53', 0.8, vary='#46454a', vary_scale=40, bump=0.1, bump_scale=300)
M['kerbG'] = material('kerbGracia', '#c9c3b6', 0.7)
M['lampIron'] = material('lampIronG', '#2b2f2c', 0.45, metallic=0.5)
Z0 = G + 0.012
TURN = math.radians(-32.0)
FRONT = -0.12             # the house's front on the tile, before the turn

# ------------------------------------------------------------------ the pavement and the avenue
BEFORE = set(bpy.data.objects)
slab('pavement', M['panot'], [(-2, -0.75), (2, -0.75), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.03)
slab('kerb', M['kerbG'], [(-2, -0.79), (2, -0.79), (2, -0.75), (-2, -0.75)], G - 0.004, Z0 - 0.001, margin=0.03)
slab('road', M['asphaltG'], [(-2, -2), (2, -2), (2, -0.79), (-2, -0.79)], G - 0.004, Z0 - 0.008, margin=0.03)
LINES = bmesh.new()
for k in range(-4, 5):
    bmesh.ops.create_cube(LINES, size=1.0, matrix=Matrix.Translation((k * 0.22, -1.08, Z0 - 0.0075)) @ Matrix.Diagonal((0.12, 0.012, 0.002, 1)))
finish('roadLines', LINES, M['white'], smooth_sides=False)
for k, x in enumerate((-0.78, 0.78)):
    base = Vector((x, -0.62, Z0))
    cylinder(f'lampBench{k}', M['kerbG'], 0.09, 0.03, base, segs=24)
    cylinder(f'lampPost{k}', M['lampIron'], 0.012, 0.36, base + Vector((0, 0, 0.03)), segs=10, r2=0.008)
    for j in range(4):
        a = math.pi / 2 * j + math.pi / 4
        tip = base + Vector((0.07 * math.cos(a), 0.07 * math.sin(a), 0.36))
        bar(f'lampArm{k}{j}', M['lampIron'], base + Vector((0, 0, 0.33)), tip, 0.0035)
        lathe(f'lampGlobe{k}{j}', M['white'], [(0.0, 0.0), (0.018, 0.012), (0.014, 0.03), (0.0, 0.036)], tip, segs=12, smooth=True)

# ------------------------------------------------------------------ the house, with its own materials
path = os.path.join(SOURCES, 'casa-batllo', 'casa-batllo.glb')
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=path)
new = [o for o in bpy.data.objects if o not in before]
for o in [o for o in new if o.type in ('CAMERA', 'LIGHT')]:
    bpy.data.objects.remove(o, do_unlink=True)
new = [o for o in bpy.data.objects if o not in before]
bpy.context.view_layer.update()
pts = [o.matrix_world @ v.co for o in new if o.type == 'MESH' for v in o.data.vertices]
xs, ys, zs = [p.x for p in pts], [p.y for p in pts], [p.z for p in pts]
cx, cy, z0 = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)
HEIGHT = 1.55
K = HEIGHT / (max(zs) - z0)
root = bpy.data.objects.new('casaBatllo', None)
bpy.context.scene.collection.objects.link(root)
for o in new:
    if o.parent is None:
        mw = o.matrix_world.copy()
        o.parent = root
        o.matrix_world = mw
root.matrix_world = Matrix.Translation((0.0, FRONT + (cy - min(ys)) * K, Z0 - 0.001)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-cx, -cy, -z0))
print('HOUSE', 'width', round((max(xs) - min(xs)) * K, 3), 'depth', round((max(ys) - min(ys)) * K, 3), 'height', HEIGHT)

for k, (x, y, shirt) in enumerate(((-0.45, -0.4, 'red'), (-0.2, -0.55, 'blue'), (0.3, -0.45, 'yellow'), (0.55, -0.62, 'green'), (0.05, -0.68, 'red'), (-0.62, -0.25, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0, scale=0.9)

R = Matrix.Rotation(TURN, 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    if ob.parent is None:
        ob.matrix_world = R @ ob.matrix_world
render('casa-batllo')
