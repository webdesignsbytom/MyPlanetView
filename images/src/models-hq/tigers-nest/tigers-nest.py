# Tiger's Nest in the high-quality look (hq.py), laid out in metres (its cliffs drawn lower than they are,
# to fit): Paro Taktsang clinging to its ledge on the sheer granite face; the temples' white walls with
# the dark red band under their eaves, the wooden windows, the gilded roofs and finials, stepping along
# the ledge and up the rock; the cliff dropping away below them to the forested slope, the rock rising
# sheer above to the pines on its top; the waterfall down the face beside them; the strings of prayer
# flags across the path, and people.
# Run: blender -b --factory-startup -P tigers-nest.py -- tigers-nest-1024.png 1024 tigers-nest.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1692)
M['granite'] = layered('taktsangRock', ['#6f6a64', '#7d7871', '#625e58', '#86817a'], scale=16.0, distortion=2.0, rough=0.9, bump=0.5, bump_scale=120, axis='Z')
M['forestFloorT'] = material('taktsangFloor', '#4c6e34', 0.9, vary='#577a3c', vary_scale=14)
M['whiteM'] = material('monasteryWhite', '#f3efe6', 0.6, vary='#ebe6dc', vary_scale=30)
M['kemar'] = material('kemarBand', '#8a2f24', 0.7)
M['woodT'] = material('monasteryWood', '#5c3a24', 0.7)
M['goldR'] = material('taktsangGold', '#e2b23e', 0.3, metallic=0.85)
M['roofT'] = material('taktsangRoof', '#5d5a55', 0.6)
M['windowT'] = material('taktsangWindow', '#2e221a', 0.8)
M['pineT'] = material('bhutanPine', '#2c5631', 0.85, vary='#37643b', vary_scale=14, bump=0.3, bump_scale=90)
M['fall'] = material('taktsangFall', '#eef4f2', 0.4)
FLAGS = [material(f'flag{k}', c, 0.8) for k, c in enumerate(('#2f6fd0', '#f2f0ea', '#d9442e', '#3f9a4a', '#eab32f'))]

S = 0.021               # metres to the tile's units
Z0 = G
LEDGE = 52.0            # the ledge the temples stand on


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def face(x):
    return 4.0 + 3.0 * math.sin(x / 13.0) + 2.0 * math.sin(x / 5.3)


def ground(x, y):
    c = face(x)
    slope = 36.0 * smooth((y + 62.0) / 50.0)
    mid = smooth((58.0 - abs(x)) / 22.0)                                        # the cliffs stand in the middle, the slope runs on at the sides
    lower = slope + (LEDGE - slope) * smooth((y - (c - 16.0)) / 2.5) * mid       # the lower cliff up to the ledge
    top = (98.0 + 6.0 * math.sin(x / 9.0) - 0.5 * max(0.0, y - c)) * mid + slope * (1.0 - mid)
    return lower + max(0.0, top - lower) * smooth((y - (c - 2.0)) / 2.5)        # the upper face up to its top


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.18)
    return ground(x / S, y / S) * S * rim


land = terrain('cliff', H, [M['granite'], M['forestFloorT']], lambda z, nz, x, y: 0 if nz < 0.7 else 1, rings=260, segs=700)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


WIN = []


def temple(name, x, y, z, w, d, h, roof_kind='gold'):
    """A white temple block with its dark red band, its windows, a roof and a gilded finial."""
    box(name, M['whiteM'], P(x, y, z + h / 2), (w * S, d * S, h * S), bevel=0)
    box(name + 'Band', M['kemar'], P(x, y, z + h - 0.7), ((w + 0.1) * S, (d + 0.1) * S, 1.4 * S), bevel=0)
    n = max(1, int(w / 3.2))
    for k in range(n):
        u = -w / 2 + w * (k + 0.5) / n
        for zz in (z + 1.6, z + h - 4.2) if h > 7 else (z + 1.6,):
            c = P(x + u, y - d / 2 - 0.05, 0)
            WIN.append((c.x, c.y, Z0 + zz * S, 1.5 * S, 1.8 * S, (0, -1), 'rect'))
    hip_roof(name + 'Roof', M['goldR'] if roof_kind == 'gold' else M['roofT'], x * S, y * S, Z0 + (z + h) * S, (w + 2.0) * S, (d + 2.0) * S, 2.2 * S, over=0.0)
    if roof_kind == 'gold':
        lathe(name + 'Finial', M['goldR'], [(0.6 * S, 0.0), (0.8 * S, 0.6 * S), (0.3 * S, 1.6 * S), (0.4 * S, 2.0 * S), (0.0, 3.2 * S)], P(x, y, z + h + 2.2), segs=12)


# ------------------------------------------------------------------ the temples along the ledge and up the rock
for k, (x, dy, z, w, d, h, kind) in enumerate(((-14.0, -12.0, LEDGE, 12.0, 8.0, 9.0, 'gold'), (-1.0, -11.0, LEDGE, 10.0, 7.0, 12.0, 'gold'),
                                                 (11.0, -12.5, LEDGE, 11.0, 8.0, 8.0, 'grey'), (5.0, -7.0, LEDGE + 10.0, 9.0, 6.0, 7.0, 'gold'),
                                                 (-9.0, -6.0, LEDGE + 8.0, 8.0, 5.0, 6.0, 'grey'), (20.0, -10.0, LEDGE - 6.0, 8.0, 7.0, 10.0, 'grey'))):
    y = face(x) + dy
    temple(f'temple{k}', x, y, z, w, d, h, kind)
    box(f'footing{k}', M['whiteM'], P(x, y + 1.0, z - 3.0), (w * S, (d - 2.0) * S, 6.0 * S), bevel=0)
glazed('windows', WIN, M['woodT'], glass=M['windowT'], depth=0.2 * S, bars=False)

# ------------------------------------------------------------------ the waterfall down the face, prayer flags, pines, people
fx = 27.0
ftop = ground(fx, face(fx) + 1.0) - 1.0      # from the clifftop where it is, down past the ledge
pts = [P(fx, face(fx) - 1.0 - 3.0 * t, ftop - (ftop - LEDGE + 14.0) * t) for t in [k / 12 for k in range(13)]]
tube('waterfall', M['fall'], pts, 0.7 * S)
for k, ((xa, ya), (xb, yb)) in enumerate((((-24.0, -30.0), (10.0, -34.0)), ((-30.0, -42.0), (14.0, -46.0)))):
    za, zb = ground(xa, ya), ground(xb, yb)
    bar(f'flagPoleA{k}', M['woodT'], P(xa, ya, za), P(xa, ya, za + 7.0), 0.2 * S)
    bar(f'flagPoleB{k}', M['woodT'], P(xb, yb, zb), P(xb, yb, zb + 7.0), 0.2 * S)
    n = 26
    for j in range(n):
        t = (j + 0.5) / n
        x, y = xa + (xb - xa) * t, ya + (yb - ya) * t
        z = za + 7.0 + (zb - za) * t - 2.0 * math.sin(math.pi * t)
        box(f'flag{k}{j}', FLAGS[j % 5], P(x, y, z - 0.6), (1.0 * S, 0.1 * S, 1.2 * S), rot_z=math.atan2(yb - ya, xb - xa), bevel=0)
    tube(f'flagString{k}', M['woodT'], [P(xa + (xb - xa) * t, ya + (yb - ya) * t, za + 7.0 + (zb - za) * t - 2.0 * math.sin(math.pi * t)) for t in [i / 12 for i in range(13)]], 0.06 * S)
PINES = []
for p in scatter_on(land, 9000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.32, seed=10):
    x, y = p.x / S, p.y / S
    if abs(y - face(x) + 9.0) < 9.0 and -22.0 < x < 26.0:
        continue
    PINES.append((p.x, p.y, p.z))
    if len(PINES) >= 220:
        break
for k, (x, y, z) in enumerate(PINES):
    h = rng.uniform(6.0, 10.0) * S
    lathe(f'pine{k}', M['pineT'], [(h * 0.32, 0.0), (h * 0.28, h * 0.3), (h * 0.18, h * 0.65), (0.0, h)], (x, y, z + 0.6 * S), segs=7)
for k, (x, y, shirt) in enumerate(((-10.0, -36.0, 'red'), (-4.0, -38.0, 'blue'), (2.0, -44.0, 'yellow'))):
    c = P(x, y, ground(x, y))
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('tigers-nest')
