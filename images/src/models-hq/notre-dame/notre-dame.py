# Notre-Dame de Paris in the high-quality look (hq.py), restored: the cathedral on the Île de la Cité,
# its west front facing the camera with the three portals, the gallery of kings, the rose window, the
# open gallery and the two square towers with their open belfries; the long nave and choir under lead
# roofs, the transept with its roses, the flying buttresses round the choir and the apse, the spire over
# the crossing (the modelled cathedral in _sources/notre-dame/, pacopozo, CC BY 4.0, given the
# diorama's limestone and its roofs and spire lead); the parvis, the island's quay and the Seine on the
# cathedral's south side only, the Left Bank's quay across it with its plane trees and the
# bouquinistes' green boxes, the Petit-Pont's stone arch, the trees of the square behind, and people.
# Run: blender -b --factory-startup -P notre-dame.py -- notre-dame-1024.png 1024 notre-dame.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1163)
M['nd'] = material('ndStone', '#e3d8c0', 0.65, vary='#d3c6aa', vary_scale=20, bump=0.12, bump_scale=150)
M['leadRoof'] = material('leadRoof', '#7d8790', 0.45, vary='#717b84', vary_scale=14, metallic=0.4)
M['quay'] = material('quay', '#c2b8a4', 0.75, vary='#b0a690', vary_scale=24, bump=0.25, bump_scale=120)
M['parvis'] = masonry('parvis', '#a9a59d', '#83807a', scale=70, rough=0.8, vary='#9d998f')
M['bouquiniste'] = material('bouquiniste', '#2f6b4a', 0.55)
M['seine'] = material('seine', '#4f8f8a', 0.08, vary='#5c9c95', vary_scale=4, coat=0.5)

SOUTH = 0.62         # the island's south quay: the Seine beyond it
BANK = 1.12          # the Left Bank's quay
Z = G + 0.078        # the island's top

# ------------------------------------------------------------------ the island, the Seine, the Left Bank
slab('river', M['seine'], [(SOUTH - 0.02, -2), (BANK + 0.02, -2), (BANK + 0.02, 2), (SOUTH - 0.02, 2)], G - 0.004, G + 0.004, margin=0.02)
slab('islandQuay', M['quay'], [(-2, -2), (SOUTH, -2), (SOUTH, 2), (-2, 2)], G - 0.004, Z - 0.008, bevel=0.003, margin=0.02)
slab('parvis', M['parvis'], [(-2, -2), (SOUTH - 0.012, -2), (SOUTH - 0.012, 2), (-2, 2)], Z - 0.008, Z, margin=0.03)
slab('bankQuay', M['quay'], [(BANK, -2), (2, -2), (2, 2), (BANK, 2)], G - 0.004, Z - 0.008, bevel=0.003, margin=0.02)
slab('bankWalk', M['paving'], [(BANK + 0.012, -2), (2, -2), (2, 2), (BANK + 0.012, 2)], Z - 0.008, Z, margin=0.03)
# the quays' parapets, the bouquinistes' green boxes on the Left Bank's, and its plane trees
for x0, nx in ((SOUTH - 0.006, 1), (BANK + 0.006, -1)):
    for y0, y1 in ((-1.6, 1.6),):
        pts = clip_to_plinth([(x0 - 0.006, y0), (x0 + 0.006, y0), (x0 + 0.006, y1), (x0 - 0.006, y1)], 0.03)
        if pts:
            ys = [p[1] for p in pts]
            box(f'parapet{nx}', M['quay'], (x0, (min(ys) + max(ys)) / 2, Z + 0.012), (0.012, max(ys) - min(ys), 0.024), bevel=0.002)
for k in range(9):
    y = -0.85 + k * 0.2
    if math.hypot(BANK + 0.02, y) < 1.44:
        box(f'bouquiniste{k}', M['bouquiniste'], (BANK + 0.02, y, Z + 0.034), (0.02, 0.075, 0.02), bevel=0.003)
for k in range(8):
    y = -0.95 + k * 0.26
    x = BANK + 0.13
    if math.hypot(x, y) < 1.38:
        tree(f'quayTree{k}', x, y, h=0.22, r=0.07, z=Z)
# the Petit-Pont: one stone arch over the Seine, by the parvis
BY = -0.74
prof = [(SOUTH - 0.02, G - 0.004), (SOUTH + 0.06, G - 0.004)]
for j in range(17):
    a = math.pi - math.pi * j / 16
    prof.append(((SOUTH + BANK) / 2 + 0.19 * math.cos(a), G + 0.002 + 0.05 * math.sin(a)))
prof += [(BANK - 0.06, G - 0.004), (BANK + 0.02, G - 0.004), (BANK + 0.02, Z + 0.004), (SOUTH - 0.02, Z + 0.004)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new((x, BY - 0.07, z)) for x, z in prof], [bm.verts.new((x, BY + 0.07, z)) for x, z in prof])
finish('petitPont', bm, M['quay'], bevel=0.003, smooth_sides=False)
for s_ in (-1, 1):
    box(f'bridgeParapet{s_}', M['quay'], ((SOUTH + BANK) / 2, BY + s_ * 0.064, Z + 0.016), (BANK - SOUTH + 0.04, 0.012, 0.024), bevel=0.002)
# the island's lawns: along the north side and the square behind the apse, with their trees
slab('northLawn', M['lawn'], [(-2, -0.62), (-0.98, -0.62), (-0.98, 2), (-2, 2)], Z - 0.002, Z + 0.003, margin=0.05)
slab('squareLawn', M['lawn'], [(-0.98, 1.12), (SOUTH - 0.06, 1.12), (SOUTH - 0.06, 2), (-0.98, 2)], Z - 0.002, Z + 0.003, margin=0.05)
for k, (x, y) in enumerate(((-0.25, 1.24), (0.05, 1.3), (0.32, 1.2), (-1.1, 0.75), (-1.22, 0.3), (-1.25, -0.2), (-0.8, 1.15))):
    tree(f'tree{k}', x, y, h=0.2, r=0.08, z=Z + 0.003)

# ------------------------------------------------------------------ the cathedral
SOURCE_TURN = 58.4      # squares the model, its west front then facing -y
K = 0.11                # the model's units to the tile's
CX = -0.1               # the cathedral's middle across the island
src = import_model('notre-dame', 'cathedral', skip=lambda names: 'color_6383466' in names)    # its base plate: the island is ours
if src is not None:
    me = src.data
    # small structures standing apart from the cathedral (past the apse's north side, off the south side,
    # a marker cone at each front corner; the model's own units, before the turn): not part of Notre-Dame
    bm = bmesh.new()
    bm.from_mesh(me)
    stray = [f for f in bm.faces if (lambda c: c.y > -43.3 or (c.x > 5.1 and c.y < -49.9) or (c.x < -12.45 and c.z < -48.9) or (c.y < -58.25 and c.z < -48.9))(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=stray, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(me)
    bm.free()
    me.transform(Matrix.Rotation(math.radians(SOURCE_TURN), 4, 'Z'))
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    me.transform(Matrix.Translation((CX, 0, Z - 0.002)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
    me.materials.append(M['nd'])
    me.materials.append(M['leadRoof'])
    # the lead: the roofs' slopes above the eaves behind the towers, and the spire above the ridge
    top = max(me.vertices, key=lambda v: v.co.z).co.copy()
    yfront = min(v.co.y for v in me.vertices)
    EAVES, RIDGE = Z + 3.0 * K, Z + 4.05 * K
    for p in me.polygons:
        c = p.center
        # (only over the nave and choir, or the transept: the flying buttresses' slopes stay stone)
        roof = 0.3 < p.normal.z < 0.97 and c.z > EAVES and c.y > yfront + 4.3 * K and (abs(c.x - CX) < 0.14 or abs(c.y - top.y) < 0.14)
        spire = c.z > RIDGE and math.hypot(c.x - top.x, c.y - top.y) < 0.9 * K
        p.material_index = 1 if (roof or spire) else 0
        p.use_smooth = False
    print('CATHEDRAL', [round(v, 3) for v in (min(v.co.x for v in me.vertices), max(v.co.x for v in me.vertices), yfront, max(v.co.y for v in me.vertices), max(v.co.z for v in me.vertices))],
          'lead faces', sum(1 for p in me.polygons if p.material_index == 1))

for k, (x, y, shirt) in enumerate(((-0.35, -1.2, 'red'), (-0.1, -1.25, 'blue'), (0.12, -1.18, 'yellow'), (-0.55, -1.12, 'green'), (0.3, -1.25, 'red'), (-0.2, -1.34, 'blue'),
                                     (1.25, -0.5, 'green'), (1.22, 0.2, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z)

render('notre-dame')
