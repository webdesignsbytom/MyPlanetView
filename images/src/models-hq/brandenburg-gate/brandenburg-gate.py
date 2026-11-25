# The Brandenburg Gate in the high-quality look (hq.py): Berlin's sandstone gate, its twelve Doric
# columns making five passages under the entablature and the attic, the copper-green Quadriga on top,
# the two guardhouses with their colonnades and green roofs reaching forward on Pariser Platz (the
# gate itself is the model in _sources/brandenburg-gate/, Res1n, CC BY 4.0, given the diorama's
# sandstone and copper); the square's paving, the Tiergarten's trees behind, and people.
# Run: blender -b --factory-startup -P brandenburg-gate.py -- brandenburg-gate-1024.png 1024 brandenburg-gate.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1791)
M['sandstoneBG'] = material('sandstoneBG', '#ddd0b3', 0.65, vary='#cdbf9f', vary_scale=24, bump=0.15, bump_scale=160)
M['copperBG'] = material('copperBG', '#5f9f86', 0.5, vary='#4d8a72', vary_scale=18, bump=0.1, bump_scale=200, metallic=0.2)

# ------------------------------------------------------------------ Pariser Platz and the Tiergarten
slab('platz', M['paving'], rect(0.0, -0.35, 2.7, 1.5), G - 0.004, G + 0.006, margin=0.08)
for k in range(9):
    x = -1.05 + k * 0.26
    if math.hypot(x, 0.95) + 0.1 < 1.45:
        tree(f'tiergarten{k}', x, 0.95 + 0.06 * (k % 2), h=0.24, r=0.1)
for k, x in enumerate((-0.6, -0.3, 0.3, 0.6)):
    tree(f'linden{k}', x, 0.72, h=0.2, r=0.08)

# ------------------------------------------------------------------ the gate
SCALE = 0.9
src = import_model('brandenburg-gate', 'gate')
if src is not None:
    me = src.data
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    me.transform(Matrix.Translation((0, 0, G + 0.004)) @ Matrix.Scale(SCALE, 4) @ Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
    zmax = G + 0.004 + (max(zs) - min(zs)) * SCALE
    me.materials.clear()
    me.materials.append(M['sandstoneBG'])
    me.materials.append(M['copperBG'])
    for p in me.polygons:
        c = p.center
        quadriga = c.z > G + (zmax - G) * 0.88 and abs(c.x) < 0.3
        roof = p.normal.z > 0.35 and c.z > G + (zmax - G) * 0.4 and abs(c.x) > 0.62
        p.material_index = 1 if (quadriga or roof) else 0
        p.use_smooth = False

for k, (x, y, shirt) in enumerate(((-0.25, -0.5, 'red'), (0.05, -0.62, 'blue'), (0.3, -0.45, 'yellow'), (-0.45, -0.85, 'green'), (0.2, -0.95, 'red'), (-0.05, -0.3, 'blue'), (0.55, -0.8, 'yellow'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.006)

render('brandenburg-gate')
