# The moai of Ahu Tongariki in the high-quality look (hq.py): Rapa Nui's fifteen moai standing in a row
# on their long stone platform, their backs to the Pacific, looking inland over the grass, one wearing
# its red pukao (each moai the scanned moai in _sources/moai/, Museo Nacional de Historia Natural de
# Chile, CC BY 4.0, cut from its museum plinth, each a little taller, broader or turned than the next,
# given the diorama's volcanic tuff); the platform's paved ramp, the basalt boulders of the shore, the
# surf and the ocean behind, and people.
# Run: blender -b --factory-startup -P moai.py -- moai-1024.png 1024 moai.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1995)
M['tuff'] = material('tuff', '#7f7268', 0.85, vary='#6c6158', vary_scale=7, bump=0.45, bump_scale=110)
M['scoria'] = material('scoria', '#9a4b35', 0.85, vary='#87402d', vary_scale=8, bump=0.4, bump_scale=120)
M['ahu'] = masonry('ahuStone', '#6e6a65', '#4b4844', scale=55, rough=0.85, vary='#625e59')
M['poro'] = masonry('poro', '#8f8a83', '#66625d', scale=120, rough=0.85, vary='#827d76')
M['basalt'] = material('basalt', '#4a4746', 0.8, vary='#3d3a39', vary_scale=6, bump=0.5, bump_scale=60)
M['ocean'] = material('pacific', '#1f6fa8', 0.06, vary='#2a80b8', vary_scale=3, coat=0.6, bump=0.15, bump_scale=40)
M['surf'] = material('surf', '#f2f7f9', 0.5)
M['islandGrass'] = material('islandGrass', '#79b84a', 0.85, vary='#6caa41', vary_scale=7, bump=0.15, bump_scale=300)

AY = -0.12              # the platform's middle; the moai stand on it facing -y, inland
AH = 0.05               # its height

# ------------------------------------------------------------------ the ocean, its surf and the shore behind the ahu
COAST = [(x, 0.3 + 0.06 * math.sin(3.1 * x + 0.7) + 0.03 * math.sin(7.3 * x)) for x in [-1.6 + 0.1 * k for k in range(33)]]
slab('ocean', M['ocean'], COAST + [(1.6, 1.6), (-1.6, 1.6)], G - 0.004, G + 0.002, margin=0.02)
slab('grass', M['islandGrass'], [(-1.6, -1.6), (1.6, -1.6)] + list(reversed(COAST)), G - 0.004, G + 0.004, margin=0.02)
surf = [(x, y + 0.02) for x, y in COAST]
for k in range(len(surf) - 1):
    (x0, y0), (x1, y1) = surf[k], surf[k + 1]
    if math.hypot(x0, y0) < 1.45 and math.hypot(x1, y1) < 1.45:
        tube(f'surf{k}', M['surf'], [(x0, y0, G + 0.003), (x1, y1, G + 0.003)], 0.007)
bm = bmesh.new()
for k in range(110):
    x = rng.uniform(-1.4, 1.4)
    y = 0.3 + 0.06 * math.sin(3.1 * x + 0.7) + 0.03 * math.sin(7.3 * x) + rng.uniform(-0.07, 0.03)
    if math.hypot(x, y) > 1.42:
        continue
    r = rng.uniform(0.015, 0.04)
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=Matrix.Translation((x, y, G + r * 0.2)) @ Matrix.Rotation(rng.random() * 6, 4, 'Z') @ Matrix.Diagonal((r * 1.3, r, r * 0.6, 1)))
finish('shoreBoulders', bm, M['basalt'], smooth_all=False)

# ------------------------------------------------------------------ the ahu and its paved ramp
slab('ahu', M['ahu'], rect(0.0, AY, 2.55, 0.2), G - 0.004, G + AH, bevel=0.004, margin=0.04)
bm = bmesh.new()
ramp = clip_to_plinth([(-1.25, AY - 0.1), (1.25, AY - 0.1), (1.25, AY - 0.42), (-1.25, AY - 0.42)], 0.05)
add_prism(bm, [bm.verts.new((x, y, G - 0.004)) for x, y in ramp], [bm.verts.new((x, y, G + 0.004 + (AH - 0.012) * max(0.0, (y - (AY - 0.42)) / 0.32))) for x, y in ramp])
finish('ramp', bm, M['poro'], smooth_sides=False)

# ------------------------------------------------------------------ the fifteen moai
SOURCE_CUT = 0.155      # the museum's plinth, a share of the scan's height
SOURCE_TURN = 90.0      # the face then looks -y
N = 15
XS = [-1.12 + 2.24 * k / (N - 1) for k in range(N)]
for k, x in enumerate(XS):
    src = import_model('moai', f'moai{k}')
    if src is None:
        break
    h = 0.52 * rng.uniform(0.82, 1.12)
    stand_sourced(src, cut=SOURCE_CUT, turn=SOURCE_TURN + rng.uniform(-6, 6), height=h, z=G + AH - 0.004, mat=M['tuff'], report=(k == 0))
    me = src.data
    me.transform(Matrix.Translation((x, AY + 0.01, 0)) @ Matrix.Diagonal((rng.uniform(0.9, 1.08), 1.0, 1.0, 1)))
    if k == 9:      # the one with its pukao, the red topknot
        top = max(v.co.z for v in me.vertices)
        lathe('pukao', M['scoria'], [(0.0, 0), (0.044, 0.0), (0.048, 0.006), (0.048, 0.034), (0.044, 0.04), (0.012, 0.042), (0.0, 0.04)], (x, AY + 0.01, top - 0.008), segs=28, smooth=True, sy=0.85)

# the lone "travelling moai" by the way in, on its own small ahu, and the island's stones in the grass
slab('loneAhu', M['ahu'], rect(-1.0, -0.8, 0.2, 0.16), G - 0.004, G + 0.03, bevel=0.003, margin=0.05)
src = import_model('moai', 'loneMoai')
if src is not None:
    stand_sourced(src, cut=SOURCE_CUT, turn=SOURCE_TURN + 12, height=0.4, z=G + 0.026, mat=M['tuff'], report=False)
    src.data.transform(Matrix.Translation((-1.0, -0.8, 0)))
bm = bmesh.new()
for k in range(60):
    x, y = rng.uniform(-1.3, 1.3), rng.uniform(-1.35, -0.35)
    if math.hypot(x, y) > 1.38 or (abs(x + 1.0) < 0.16 and abs(y + 0.8) < 0.14) or (abs(x) < 1.3 and y > -0.58):
        continue
    r = rng.uniform(0.008, 0.02)
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=Matrix.Translation((x, y, G + 0.002)) @ Matrix.Rotation(rng.random() * 6, 4, 'Z') @ Matrix.Diagonal((r * 1.3, r, r * 0.55, 1)))
finish('grassStones', bm, M['basalt'], smooth_all=False)

for k, (x, y, shirt) in enumerate(((-0.6, -0.72, 'red'), (-0.35, -0.8, 'blue'), (0.1, -0.86, 'yellow'), (0.45, -0.76, 'green'), (0.7, -0.92, 'red'), (-0.05, -1.05, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.004)

render('moai')
