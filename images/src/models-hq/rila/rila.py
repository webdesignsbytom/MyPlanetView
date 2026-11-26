# Rila Monastery in the high-quality look (hq.py), laid out in metres (its courtyard drawn smaller, the
# front wing low, to show it): the monastery's courtyard enclosed by its tall wings, their inner faces
# tiered with arcades of striped arches and wooden balconies under roofs of stone slabs; the Church of
# the Nativity in the middle, its galleries of red-and-white striped arches and its five lead domes;
# Hrelyo's medieval stone tower beside it; the pine-forested Rila mountains all round, and people.
# Run: blender -b --factory-startup -P rila.py -- rila-1024.png 1024 rila.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(927)
M['stripes'] = striped('rilaStripes', ['#f2ede2', '#a8402e', '#f2ede2', '#2a2a2a'], 'X', 70.0, rough=0.6)
M['whiteR'] = material('rilaWhite', '#efe9dc', 0.7, vary='#e4ddcf', vary_scale=24)
M['stoneR'] = masonry('rilaStone', '#a39a8a', '#7c7466', scale=90, rough=0.9, vary='#9a9181')
M['slabR'] = material('rilaSlabRoof', '#6f655a', 0.85, vary='#625a50', vary_scale=40, bump=0.3, bump_scale=200)
M['leadR'] = material('rilaLead', '#7c858a', 0.5, metallic=0.4)
M['woodR'] = material('rilaBalcony', '#6b4a30', 0.75)
M['courtR'] = masonry('rilaCourt', '#c9bfa9', '#a69c86', scale=70, rough=0.85, vary='#bfb59f')
M['recessR'] = material('rilaRecess', '#3a2a22', 0.9)
M['slopeR'] = material('rilaSlope', '#5a7a3a', 0.9, vary='#668643', vary_scale=14)
M['pineR'] = material('rilaPine', '#2c5631', 0.85, vary='#37643b', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.024               # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The valley floor round the monastery, the mountains rising behind and at the sides."""
    return 26.0 * smooth((y - 30.0) / 26.0) + 14.0 * smooth((abs(x) - 36.0) / 20.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.14)
    return ground(x / S, y / S) * S * rim


land = terrain('valley', H, [M['slopeR']], lambda z, nz, x, y: 0, rings=160, segs=400)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


WIN = []
slab('court', M['courtR'], [(-30.0 * S, -26.0 * S), (30.0 * S, -26.0 * S), (30.0 * S, 26.0 * S), (-30.0 * S, 26.0 * S)], Z0, Z0 + 0.15 * S, margin=0.03)


def wing(name, x0, x1, y0, y1, h, face, storeys):
    """A residential wing: stone outside, its courtyard face tiered with striped arcades and balconies."""
    box(name, M['stoneR'], P((x0 + x1) / 2, (y0 + y1) / 2, h / 2), ((x1 - x0) * S, (y1 - y0) * S, h * S), bevel=0)
    gable_roof(name + 'Roof', M['slabR'], (x0 - 0.8) * S, (x1 + 0.8) * S, (y0 - 0.8) * S, (y1 + 0.8) * S, Z0 + h * S, 3.0 * S, over=0.0, along='x' if face[0] == 0 else 'y')
    along = (x1 - x0) if face[0] == 0 else (y1 - y0)
    sh = h / storeys
    for st in range(storeys):
        z = st * sh
        if face[0] == 0:
            yy = y0 - 0.05 if face[1] < 0 else y1 + 0.05
            box(f'{name}Band{st}', M['whiteR'], P((x0 + x1) / 2, yy + face[1] * 0.05, z + sh - 0.4), ((x1 - x0) * S, 0.2 * S, 0.8 * S), bevel=0)
            if st:
                box(f'{name}Balcony{st}', M['woodR'], P((x0 + x1) / 2, yy + face[1] * 0.8, z + 0.2), ((x1 - x0) * S, 1.6 * S, 0.3 * S), bevel=0)
        else:
            xx = x0 - 0.05 if face[0] < 0 else x1 + 0.05
            box(f'{name}Band{st}', M['whiteR'], P(xx + face[0] * 0.05, (y0 + y1) / 2, z + sh - 0.4), (0.2 * S, (y1 - y0) * S, 0.8 * S), bevel=0)
            if st:
                box(f'{name}Balcony{st}', M['woodR'], P(xx + face[0] * 0.8, (y0 + y1) / 2, z + 0.2), (1.6 * S, (y1 - y0) * S, 0.3 * S), bevel=0)
        n = int(along / 3.2)
        for k in range(n):
            u = (k + 0.5) / n
            if face[0] == 0:
                c = P(x0 + u * along, y0 - 0.06 if face[1] < 0 else y1 + 0.06, 0)
            else:
                c = P(x0 - 0.06 if face[0] < 0 else x1 + 0.06, y0 + u * along, 0)
            WIN.append((c.x, c.y, Z0 + (z + 0.5) * S, 2.2 * S, (sh - 1.4) * S, face, 'round'))


# ------------------------------------------------------------------ the wings round the courtyard (the front one kept low)
wing('wingBack', -32.0, 32.0, 26.0, 34.0, 18.0, (0, -1), 4)
wing('wingLeft', -40.0, -32.0, -26.0, 34.0, 16.0, (1, 0), 4)
wing('wingRight', 32.0, 40.0, -26.0, 34.0, 16.0, (-1, 0), 4)
box('frontWall', M['stoneR'], P(0.0, -30.0, 2.5), (72.0 * S, 4.0 * S, 5.0 * S), bevel=0)
box('gate', M['stripes'], P(0.0, -32.1, 2.4), (6.0 * S, 0.3 * S, 4.4 * S), bevel=0)

# ------------------------------------------------------------------ the church: its striped galleries, the five lead domes
box('church', M['whiteR'], P(0.0, 4.0, 6.0), (28.0 * S, 18.0 * S, 12.0 * S), bevel=0)
box('churchStripe', M['stripes'], P(0.0, 4.0, 11.2), (28.3 * S, 18.3 * S, 1.2 * S), bevel=0)
for s, (x0, x1, y0, y1) in (('front', (-16.0, 16.0, -8.0, -5.0)), ('left', (-17.0, -14.0, -5.0, 13.0)), ('right', (14.0, 17.0, -5.0, 13.0))):
    box(f'gallery{s}', M['stripes'], P((x0 + x1) / 2, (y0 + y1) / 2, 3.6), ((x1 - x0) * S, (y1 - y0) * S, 7.2 * S), bevel=0)
    gable_roof(f'galleryRoof{s}', M['leadR'], (x0 - 0.4) * S, (x1 + 0.4) * S, (y0 - 0.4) * S, (y1 + 0.4) * S, Z0 + 7.2 * S, 1.6 * S, over=0.0, along='x' if s == 'front' else 'y')
for k in range(9):
    x = -14.0 + 28.0 * (k + 0.5) / 9
    c = P(x, -8.06, 0)
    WIN.append((c.x, c.y, Z0 + 0.2 * S, 2.2 * S, 5.4 * S, (0, -1), 'round'))
gable_roof('churchRoof', M['leadR'], -14.6 * S, 14.6 * S, -5.6 * S, 13.6 * S, Z0 + 12.0 * S, 3.0 * S, over=0.0, along='x')
for k, (x, y, r, dz) in enumerate(((0.0, 4.0, 3.6, 4.0), (-9.0, 4.0, 2.4, 2.6), (9.0, 4.0, 2.4, 2.6), (0.0, -2.0, 2.2, 2.2), (0.0, 10.0, 2.2, 2.2))):
    cylinder(f'drum{k}', M['whiteR'], r * S, dz * S, P(x, y, 13.0), segs=24)
    lathe(f'dome{k}', M['leadR'], [(r * 1.05 * S, 0.0), (r * 1.0 * S, r * 0.5 * S), (r * 0.6 * S, r * 0.95 * S), (0.0, r * 1.15 * S)], P(x, y, 13.0 + dz), segs=24, smooth=True)
    lathe(f'cross{k}', M['leadR'], [(0.15 * S, 0.0), (0.12 * S, 1.6 * S), (0.0, 1.8 * S)], P(x, y, 13.0 + dz + r * 1.15), segs=6)

# ------------------------------------------------------------------ Hrelyo's Tower, the pines on the mountains, people
box('hrelyoTower', M['stoneR'], P(20.0, 16.0, 11.5), (8.0 * S, 8.0 * S, 23.0 * S), bevel=0)
hip_roof('hrelyoRoof', M['slabR'], 20.0 * S, 16.0 * S, Z0 + 23.0 * S, 9.0 * S, 9.0 * S, 3.4 * S, over=0.0)
for z in (8.0, 14.0, 19.0):
    c = P(20.0, 11.95, 0)
    WIN.append((c.x, c.y, Z0 + z * S, 0.8 * S, 1.6 * S, (0, -1), 'round'))
glazed('arches', WIN, M['whiteR'], glass=M['recessR'], depth=0.3 * S, bars=False)
PINES = []
for p in scatter_on(land, 8000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.34, seed=6):
    x, y = p.x / S, p.y / S
    if -44.0 < x < 44.0 and -36.0 < y < 38.0:
        continue
    PINES.append((p.x, p.y, p.z))
    if len(PINES) >= 160:
        break
for k, (x, y, z) in enumerate(PINES):
    h = rng.uniform(6.0, 10.0) * S
    lathe(f'pine{k}', M['pineR'], [(h * 0.32, 0.0), (h * 0.28, h * 0.3), (h * 0.18, h * 0.65), (0.0, h)], (x, y, z + 0.4 * S), segs=7)
for k, (x, y, shirt) in enumerate(((-8.0, -16.0, 'red'), (6.0, -18.0, 'blue'), (-20.0, -4.0, 'yellow'), (22.0, 0.0, 'green'))):
    c = P(x, y, 0.15)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('rila')
