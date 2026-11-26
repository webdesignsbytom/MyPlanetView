# The Burj Khalifa in the high-quality look (hq.py): Dubai's tower, the world's tallest, rising in its
# stepped Y of glass and stainless steel fins to the spire (the modelled tower in _sources/burj-khalifa/,
# Lambo_SC04, CC BY 4.0, given the diorama's silver-blue glass and brushed steel); its plaza and park
# with date palms, the Burj Lake curving round in front with the Dubai Fountain's jets, and people.
# Run: blender -b --factory-startup -P burj-khalifa.py -- burj-khalifa-1024.png 1024 burj-khalifa.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(2010)
M['burjGlass'] = material('burjGlass', '#7f9fb8', 0.18, vary='#93b1c6', vary_scale=3, metallic=0.55, coat=0.3)
M['burjSteel'] = material('burjSteel', '#c9cfd5', 0.3, vary='#b9c0c7', vary_scale=20, metallic=0.85)
M['lake'] = material('burjLake', '#2a8fb5', 0.05, vary='#36a0c2', vary_scale=3, coat=0.6, bump=0.08, bump_scale=40)
M['plaza'] = masonry('burjPlaza', '#e5dccb', '#c9bfac', scale=60, rough=0.6, vary='#dad0bd')
M['jet'] = material('fountainJet', '#f4fbfd', 0.3, transmission=0.3)
M['palmTrunk'] = material('palmTrunk', '#8a6a45', 0.85, vary='#765a39', vary_scale=60, bump=0.4, bump_scale=300)
M['frond'] = material('frond', '#4d8f3b', 0.75, vary='#3f7d30', vary_scale=12)

TOWER_H = 3.0           # the spire's tip above the plaza
SOURCE_TURN = 20.0      # a wing towards the camera

# ------------------------------------------------------------------ the plaza, the park and the lake
LAKE = [(-1.6, -0.42), (-1.0, -0.5), (-0.5, -0.38), (0.0, -0.42), (0.45, -0.3), (0.8, -0.05), (1.1, 0.25), (1.6, 0.35), (1.6, -1.6), (-1.6, -1.6)]
slab('lake', M['lake'], LAKE, G - 0.004, G + 0.002, margin=0.02)
slab('park', M['lawn'], [(-1.6, 1.6), (1.6, 1.6)] + list(reversed(LAKE[:8])), G - 0.004, G + 0.006, margin=0.02)
slab('plaza', M['plaza'], rect(0.0, 0.2, 0.95, 0.9, rot=math.radians(20)), G + 0.004, G + 0.01, margin=0.05)
for k in range(len(LAKE) - 3):     # the lake's stone edge
    (x0, y0), (x1, y1) = LAKE[k], LAKE[k + 1]
    if math.hypot(x0, y0) < 1.47 and math.hypot(x1, y1) < 1.47:
        tube(f'lakeEdge{k}', M['plaza'], [(x0, y0, G + 0.006), (x1, y1, G + 0.006)], 0.008)


def palm(name, x, y, h, z=G + 0.006):
    """A date palm: a gently curving ringed trunk and a crown of arching fronds."""
    lean = rng.uniform(0, 2 * math.pi)
    pts = [(x + 0.02 * t * t * math.cos(lean), y + 0.02 * t * t * math.sin(lean), z + h * t) for t in (j / 6 for j in range(7))]
    tube(name + 'Trunk', M['palmTrunk'], pts, 0.006 * (1.0 if h > 0.1 else 0.8))
    top = Vector(pts[-1])
    bm = bmesh.new()
    for j in range(11):
        a = 2 * math.pi * j / 11 + rng.uniform(-0.15, 0.15)
        d = Vector((math.cos(a), math.sin(a), 0))
        side = Vector((-d.y, d.x, 0))
        L = h * rng.uniform(0.45, 0.6)
        ring = []
        for t in (k / 6 for k in range(7)):
            c = top + d * L * t + Vector((0, 0, L * (0.35 * t - 0.75 * t * t)))
            w = L * 0.16 * math.sin(math.pi * min(1.0, t * 1.1 + 0.05))
            ring.append((c - side * w, c + side * w))
        vs = [(bm.verts.new(a_), bm.verts.new(b_)) for a_, b_ in ring]
        for k in range(len(vs) - 1):
            bm.faces.new((vs[k][0], vs[k + 1][0], vs[k + 1][1], vs[k][1]))
    finish(name + 'Crown', bm, M['frond'], smooth_all=True)


for k in range(22):
    a = 2 * math.pi * k / 22
    x, y = 0.62 * math.cos(a), 0.2 + 0.58 * math.sin(a)
    if y < -0.28 or math.hypot(x, y) > 1.4:
        continue
    palm(f'palm{k}', x, y, rng.uniform(0.11, 0.15))
for k, (x, y) in enumerate(((-1.1, 0.5), (-0.9, 0.85), (-0.5, 1.15), (0.5, 1.15), (0.95, 0.75), (1.2, 0.55), (-1.25, 0.05))):
    palm(f'parkPalm{k}', x, y, rng.uniform(0.1, 0.14))
# the Dubai Fountain's jets along their arc in the lake
for k in range(13):
    t = k / 12
    x, y = -0.95 + 1.6 * t, -0.75 + 0.25 * math.sin(math.pi * t) + 0.2 * t
    hh = 0.12 + 0.12 * math.sin(math.pi * t)
    lathe(f'jet{k}', M['jet'], [(0.0, 0), (0.012, 0.005), (0.008, hh * 0.6), (0.004, hh), (0.0, hh + 0.01)], (x, y, G), segs=12, smooth=True)

# ------------------------------------------------------------------ the tower
GLASS, STEEL = 0, 1
src = import_model('burj-khalifa', 'tower', group=lambda names: GLASS if 'Vitres' in names else STEEL)
if src is not None:
    me = src.data
    me.transform(Matrix.Rotation(math.radians(SOURCE_TURN), 4, 'Z'))
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    K = TOWER_H / (max(zs) - min(zs))
    me.transform(Matrix.Translation((0.0, 0.2, G + 0.008)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
    me.materials.append(M['burjGlass'])
    me.materials.append(M['burjSteel'])
    for p in me.polygons:
        p.use_smooth = False
    print('TOWER footprint', round((max(xs) - min(xs)) * K, 3), round((max(ys) - min(ys)) * K, 3))

for k, (x, y, shirt) in enumerate(((-0.25, -0.3, 'red'), (0.1, -0.33, 'blue'), (0.35, -0.2, 'yellow'), (-0.5, -0.22, 'green'), (0.55, 0.0, 'red'), (-0.4, 0.62, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.01)

render('burj-khalifa')
