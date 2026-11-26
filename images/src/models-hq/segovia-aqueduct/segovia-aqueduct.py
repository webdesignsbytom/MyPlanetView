# The Aqueduct of Segovia in the high-quality look (hq.py), laid out in metres where it strides across
# the Plaza del Azoguejo: its two tiers of unmortared granite arches on their tall piers, the cornice
# between them and the channel along the top, the arches shortening to one tier as the ground rises
# at either end; the Virgin in her niche on the top tier over the square (a scanned statue, UBICA.srl,
# CC BY 4.0, in _sources/madonnina/, standing in); the square's paving, the dry Castilian slopes rising
# to the old town either side, a few trees, and people.
# Run: blender -b --factory-startup -P segovia-aqueduct.py -- segovia-aqueduct-1024.png 1024 segovia-aqueduct.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(98)
M['granite'] = masonry('segoviaGranite', '#a39b8d', '#6f685d', scale=150, rough=0.9, vary='#968e80')
M['slopeS'] = material('castilianSlope', '#7c9a4c', 0.9, vary='#8fa65a', vary_scale=12, bump=0.3, bump_scale=120)
M['earth'] = material('dryEarth', '#b49a72', 0.9, vary='#a88d66', vary_scale=14, bump=0.2, bump_scale=200)
M['squareS'] = masonry('azoguejo', '#ddd2bd', '#b3a58e', scale=220, rough=0.85, vary='#d2c6ae')
M['tileRoof'] = banded(material('segoviaRoof', '#b05a3a', 0.7, vary='#9c4f33', vary_scale=14, bump=0.12, bump_scale=200), 'Z', 380.0, strength=0.25)
WALLS = [material(f'houseWall{k}', c, 0.8, vary=c, vary_scale=30, bump=0.08, bump_scale=200) for k, c in enumerate(('#e3cfa6', '#d8b98a', '#efe4cf', '#cfa77a', '#e8d9bb'))]
M['tree'] = material('segoviaTree', '#55783a', 0.85, vary='#628543', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.024               # metres to the tile's units
TURN = -32.0 + 25.0     # the aqueduct runs along x, turned so its piers show their depth


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The ground (metres): the square at the bottom, rising towards the old town on the right and up
    the slope on the left, and a little up the hill behind."""
    right = 22.0 * smooth((x - 12.0) / 44.0)
    left = 14.0 * smooth((-x - 16.0) / 40.0)
    behind = 6.0 * smooth((y - 22.0) / 30.0)
    return right + left + behind


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return ground(x / S, y / S) * S * rim


def pick(z, nz, x, y):
    mx, my = x / S, y / S
    if z < 0.8 * S and -30.0 < mx < 24.0 and -40.0 < my < 30.0:
        return 2
    return 0 if (nz > 0.8 or math.hypot(x, y) > 1.3) else 1


land = terrain('ground', H, [M['slopeS'], M['earth'], M['squareS']], pick, rings=170, segs=430)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, G + z * S))


# ------------------------------------------------------------------ the aqueduct: piers, two tiers of arches, the cornice and the channel on top
AXIS = 4.9              # pier to pier
SPAN = 2.5              # the arches' width
LOW_SPRING, LOW_TOP = 13.5, 15.5
CORNICE = (15.5, 16.3)
UP_SPRING, UP_TOP = 22.6, 25.0
TOP = 27.6
xs = [AXIS * (k + 0.5) for k in range(-16, 16)]
xs = [x for x in xs if math.hypot(x, 0.0) * S < 1.40 and ground(x, 0.0) < UP_SPRING - 3.0]


def pier(name, x, z0, z1, w0, w1, d0, d1):
    """A granite pier, a little wider at its foot, its faces flat."""
    ob = lathe(name, M['granite'], [(math.hypot(w0, d0) / 2 * S, 0.0), (math.hypot(w1, d1) / 2 * S, (z1 - z0) * S)], (0, 0, 0), segs=4,
          matrix=Matrix.Translation(P(x, 0.0, z0)) @ Matrix.Diagonal((w0 / math.hypot(w0, d0) * math.sqrt(2), d0 / math.hypot(w0, d0) * math.sqrt(2), 1.0, 1.0)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
    ob.data.polygons.foreach_set('use_smooth', [False] * len(ob.data.polygons))


lows, ups = [], []
for k, x in enumerate(xs):
    g = min(ground(x - 1.5, 0.0), ground(x + 1.5, 0.0)) - 1.0
    if g < LOW_SPRING - 2.5:
        pier(f'lowPier{k}', x, g, LOW_SPRING + 0.1, 3.2, 2.6, 3.4, 3.0)
        lows.append(x)
        pier(f'upPier{k}', x, CORNICE[1] - 0.1, UP_SPRING + 0.1, 2.5, 2.4, 2.5, 2.4)
    else:
        pier(f'upPier{k}', x, g, UP_SPRING + 0.1, 2.8, 2.4, 2.8, 2.4)
    ups.append(x)


def runs(points):
    """Consecutive piers as runs, so a tier's arches stop where it does."""
    out, cur = [], [points[0]]
    for x in points[1:]:
        if abs(x - cur[-1] - AXIS) < 1e-6:
            cur.append(x)
        else:
            out.append(cur)
            cur = [x]
    out.append(cur)
    return [r for r in out if len(r) > 1]


for j, run in enumerate(runs(lows)):
    arcade_path(f'lowArches{j}', M['granite'], [(x * S, -1.5 * S) for x in run], 3.0 * S, G + LOW_SPRING * S, (LOW_TOP - LOW_SPRING) * S, SPAN / 2 * S)
    box(f'cornice{j}', M['granite'], P((run[0] + run[-1]) / 2, 0.0, sum(CORNICE) / 2), ((run[-1] - run[0] + 1.6) * S, 3.6 * S, (CORNICE[1] - CORNICE[0]) * S), bevel=0)
for j, run in enumerate(runs(ups)):
    arcade_path(f'upArches{j}', M['granite'], [(x * S, -1.2 * S) for x in run], 2.4 * S, G + UP_SPRING * S, (UP_TOP - UP_SPRING) * S, SPAN / 2 * S)
    box(f'channel{j}', M['granite'], P((run[0] + run[-1]) / 2, 0.0, (UP_TOP + TOP) / 2), ((run[-1] - run[0]) * S, 2.6 * S, (TOP - UP_TOP + 0.05) * S), bevel=0)
    box(f'channelLip{j}', M['granite'], P((run[0] + run[-1]) / 2, 0.0, UP_TOP + 0.25), ((run[-1] - run[0]) * S, 2.9 * S, 0.5 * S), bevel=0)
# the ends, where the channel runs into the rising ground
for x in (xs[0] - 0.5, xs[-1] + 0.5):
    g = ground(x, 0.0) - 1.0
    box(f'aqueductEnd{x:.0f}', M['granite'], P(x, 0.0, (g + TOP) / 2), (2.0 * S, 2.6 * S, (TOP - g) * S), bevel=0)

# the Virgin's niche on the top tier over the square
NX = AXIS * 0.5 + AXIS
box('nichePanel', M['granite'], P(NX, -1.45, UP_TOP + 2.2), (3.6 * S, 0.3 * S, 4.6 * S), bevel=0)
for u in (-1.35, 1.35):
    box(f'nichePilaster{u:+.0f}', M['granite'], P(NX + u, -1.75, UP_TOP + 1.8), (0.4 * S, 0.3 * S, 2.8 * S), bevel=0)
box('nicheHood', M['granite'], P(NX, -1.8, UP_TOP + 3.4), (3.4 * S, 0.5 * S, 0.4 * S), bevel=0)
src = import_model('madonnina', 'virginSource')
stand_sourced(src, cut=0.34, turn=0.0, height=2.4 * S, z=0.0, mat=M['whiteStone'], report=False)
src.matrix_world = Matrix.Translation(P(NX, -1.75, UP_TOP + 0.45))

# ------------------------------------------------------------------ the old town's houses up the hill, the square's trees, people
SPOTS = [(-30.0, -26.0), (-20.0, -34.0), (24.0, -30.0)]
for p in scatter_on(land, 3000, (-1.45, 1.45, -1.45, 1.45), lambda p, m: m == 0 and math.hypot(p.x, p.y) < 1.36, seed=5):
    mx, my = p.x / S, p.y / S
    if abs(my) < 10.0 or any(math.hypot(mx - x, my - y) < 9.0 for x, y in SPOTS):
        continue
    SPOTS.append((mx, my))
    if len(SPOTS) >= 26:
        break
TREES = []
for k, (x, y) in enumerate(SPOTS):
    g = ground(x, y)
    cylinder(f'treeTrunk{k}', M['trunk'], 0.3 * S, 3.0 * S, P(x, y, g - 0.2), segs=6)
    TREES.append((P(x, y, g + 5.2).to_tuple(), 3.0 * S, 1.0))
blob_cloud('trees', M['tree'], TREES)
for k, (x, y, shirt) in enumerate(((-8.0, -12.0, 'red'), (4.0, -20.0, 'blue'), (12.0, -8.0, 'yellow'), (-16.0, 10.0, 'green'), (6.0, 14.0, 'red'), (-2.0, 4.0, 'blue'), (18.0, -22.0, 'green'))):
    person(f'p{k}', x * S, y * S, rng.random() * 6, shirt, z=G + ground(x, y) * S, scale=0.7)

R = Matrix.Rotation(math.radians(TURN), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('segovia-aqueduct')
