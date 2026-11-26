# The Galata Tower in the high-quality look (hq.py): Istanbul's round Genoese tower of rubble stone, its
# rows of small windows climbing it, the arched gallery round the top with its iron railing, the upper
# arcade, the conical lead roof and its gilded finial (the modelled tower in _sources/galata-tower/,
# mikaillbayramm18, CC BY 4.0, given the diorama's stone, lead and glass); its cobbled square, the trees
# and lamps, and people.
# Run: blender -b --factory-startup -P galata-tower.py -- galata-tower-1024.png 1024 galata-tower.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1348)
M['galataStone'] = material('galataStone', '#cfc3ad', 0.7, vary='#bfb29b', vary_scale=18, bump=0.2, bump_scale=140)
M['galataRubble'] = masonry('galataRubble', '#b9ab93', '#8f826d', scale=60, rough=0.85, vary='#ab9c84')
M['galataLead'] = banded(material('galataLead', '#5f6f7e', 0.45, vary='#566573', vary_scale=12, metallic=0.4), 'Z', 70.0, strength=0.2)
M['ironG'] = material('ironG', '#2b2c2f', 0.5, metallic=0.5)
M['cobbles'] = masonry('galataCobbles', '#9c958b', '#6f6a63', scale=140, rough=0.85, vary='#8f887e')
Z0 = G + 0.006

slab('square', M['cobbles'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.04)
annulus('towerApron', M['paving'], 0.55, 0.0, Z0 - 0.002, Z0 + 0.003, segs=96)
for k, (x, y) in enumerate(((-0.95, -0.75), (0.95, -0.7), (-1.1, 0.4), (1.1, 0.45), (-0.5, 1.15), (0.55, 1.12))):
    tree(f'tree{k}', x, y, h=0.17, r=0.07, z=Z0)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    x, y = 0.7 * math.cos(a), 0.7 * math.sin(a)
    cylinder(f'lampPost{k}', M['ironG'], 0.004, 0.1, (x, y, Z0), segs=8)
    lathe(f'lamp{k}', M['white'], [(0.0, 0), (0.01, 0.004), (0.009, 0.016), (0.0, 0.02)], (x, y, Z0 + 0.1), segs=10, smooth=True)

STONE, RUBBLE, LEAD, GOLD, IRON, GLASS, DOOR = range(7)
GROUPS = {'frame': STONE, 'niche': STONE, 'rubble': RUBBLE, 'lead': LEAD, 'gold': GOLD, 'iron': IRON, 'glass': GLASS, 'door': DOOR}
TOWER_H = 2.35          # the finial's tip above the square
src = import_model('galata-tower', 'tower', group=lambda names: next((GROUPS[n] for n in names if n in GROUPS), STONE))
if src is not None:
    me = src.data
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    K = TOWER_H / (max(zs) - min(zs))
    me.transform(Matrix.Translation((0, 0, Z0 - 0.002)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
    for m in (M['galataStone'], M['galataRubble'], M['galataLead'], M['gold'], M['ironG'], M['window'], M['door']):
        me.materials.append(m)
    top = max(v.co.z for v in me.vertices)
    for p in me.polygons:
        # the cone over the gallery is lead all over (the model marks only some of it)
        if p.center.z > Z0 + (top - Z0) * 0.755 and p.normal.z > 0.2 and p.material_index != GOLD:
            p.material_index = LEAD
        p.use_smooth = p.material_index in (LEAD, GOLD)
    print('TOWER width', round((max(xs) - min(xs)) * K, 3))

for k, (x, y, shirt) in enumerate(((-0.45, -0.62, 'red'), (0.3, -0.65, 'blue'), (0.6, -0.4, 'yellow'), (-0.7, -0.3, 'green'), (0.1, -0.95, 'red'), (-0.3, -1.05, 'blue'), (0.75, 0.2, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0)

render('galata-tower')
