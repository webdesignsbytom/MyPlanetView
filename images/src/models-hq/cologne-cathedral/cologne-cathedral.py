# Cologne Cathedral in the high-quality look (hq.py): the great Gothic cathedral, its west front's twin
# openwork spires soaring over the portals, the forest of pinnacles and flying buttresses round the
# nave and the choir, the transept fronts, the ridge turret over the crossing (the modelled cathedral in
# _sources/cologne-cathedral/, Shahriar Shahrabi, CC BY 4.0, given the diorama's weathered dark
# sandstone); the Domplatte's paving round it, its trees, and people.
# Run: blender -b --factory-startup -P cologne-cathedral.py -- cologne-cathedral-1024.png 1024 cologne-cathedral.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1248)
M['cologne'] = material('cologneStone', '#837b70', 0.8, vary='#6f685f', vary_scale=14, bump=0.3, bump_scale=160)
M['domplatte'] = masonry('domplatte', '#c9c3b8', '#a9a397', scale=70, rough=0.75, vary='#bdb7ab')
Z0 = G + 0.006

slab('domplatte', M['domplatte'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.04)
for k, (x, y) in enumerate(((-1.15, -0.55), (-1.2, 0.35), (1.15, -0.6), (1.2, 0.4), (-0.9, 0.95), (0.9, 0.95), (0.0, 1.3))):
    tree(f'tree{k}', x, y, h=0.15, r=0.06, z=Z0)

SOURCE_TURN = 0.0       # its west front, the twin spires, then faces the camera
SOURCE_CUT = 0.02       # the model's own ground plate, a share of its height
LENGTH = 2.35           # the cathedral's length on the tile
src = import_model('cologne-cathedral', 'cathedral')
if src is not None:
    me = src.data
    me.transform(Matrix.Rotation(math.radians(SOURCE_TURN), 4, 'Z'))
    bm = bmesh.new()
    bm.from_mesh(me)
    zs = [v.co.z for v in bm.verts]
    z0, z1 = min(zs), max(zs)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, z0 + (z1 - z0) * SOURCE_CUT), plane_no=(0, 0, 1), clear_inner=True)
    bm.to_mesh(me)
    bm.free()
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    K = LENGTH / (max(ys) - min(ys))
    me.transform(Matrix.Translation((0, 0.05, Z0 - 0.002)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
    me.materials.append(M['cologne'])
    for p in me.polygons:
        p.use_smooth = False
    print('CATHEDRAL', round((max(xs) - min(xs)) * K, 3), round(LENGTH, 3), round((max(zs) - min(zs)) * K, 3))

for k, (x, y, shirt) in enumerate(((-0.3, -1.25, 'red'), (0.1, -1.3, 'blue'), (0.35, -1.2, 'yellow'), (-0.6, -1.05, 'green'), (0.65, -1.0, 'red'), (-0.75, -0.3, 'blue'), (0.75, 0.2, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0)

render('cologne-cathedral')
