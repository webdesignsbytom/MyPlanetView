# Itsukushima Shrine in the high-quality look (hq.py), laid out in metres: the great vermilion torii
# standing in the sea at high tide, its two main pillars with their four support legs, the upturned
# black-topped lintel over the crossbar and the plaque between; behind it the shrine on its piers over
# the water, its halls and its long zigzag corridors, vermilion posts and white panels under roofs of
# cypress bark, the stage before the main hall; the shore and the forested slopes of Mount Misen behind,
# and people on the corridors.
# Run: blender -b --factory-startup -P itsukushima.py -- itsukushima-1024.png 1024 itsukushima.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(593)
M['vermilion'] = material('vermilion', '#d9472b', 0.55, vary='#cf4027', vary_scale=40)
M['blackTop'] = material('kasagiBlack', '#2b2827', 0.5)
M['whitePanel'] = material('shrineWhite', '#f3efe6', 0.6)
M['bark'] = material('cypressBark', '#6f5a48', 0.85, vary='#655140', vary_scale=60, bump=0.2, bump_scale=300)
M['deckI'] = material('shrineDeck', '#9a8a74', 0.8, vary='#8f7f69', vary_scale=60)
M['sea'] = material('setoSea', '#3d7f8f', 0.06, vary='#488a9a', vary_scale=6, bump=0.04, bump_scale=60, coat=0.8)
M['sandI'] = material('miyajimaSand', '#d5c7a8', 0.9, vary='#cbbc9c', vary_scale=40)
M['forestI'] = material('misenForest', '#3f7434', 0.85, vary='#4c823d', vary_scale=14, bump=0.3, bump_scale=90)
M['forestI2'] = material('misenForestLight', '#5e8f3e', 0.85, vary='#6b9c47', vary_scale=14, bump=0.3, bump_scale=90)
M['slope'] = material('misenSlope', '#4f7a38', 0.9, vary='#5a8541', vary_scale=14)

S = 0.03                # metres to the tile's units
Z0 = G
WATER = 0.8             # the sea's surface over the base's top


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The sea floor in front, the shore behind the shrine, Misen's slopes rising behind it."""
    return -0.4 + 1.6 * smooth((y - 26.0) / 6.0) + 26.0 * smooth((y - 32.0) / 22.0) * (0.8 + 0.2 * math.sin(x / 9.0))


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.1)
    return max(0.0, ground(x / S, y / S)) * S * rim


land = terrain('shore', H, [M['sandI'], M['slope']], lambda z, nz, x, y: 0 if z < 1.6 * S else 1, rings=120, segs=300)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def post(name, x, y, z0, z1, r=0.25, mat='vermilion'):
    cylinder(name, M[mat], r * S, (z1 - z0) * S, P(x, y, z0), segs=10)


slab('sea', M['sea'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (30.0) * S), (-2.0, (30.0) * S)], Z0 - 0.003, Z0 + WATER * S, margin=0.02)

# ------------------------------------------------------------------ the great torii in the sea (drawn 1.6 times its size, the shrine's sign)
TY = -33.0
TORII = set(bpy.data.objects)
for s in (-1, 1):
    x = s * 5.4
    cylinder(f'pillar{s}', M['vermilion'], 0.9 * S, 13.4 * S, P(x, TY, 0.0), segs=20, r2=0.8 * S)
    for d in (-1, 1):
        bar(f'leg{s}{d}', M['vermilion'], P(x, TY + d * 3.2, 0.0), P(x, TY + d * 0.6, 7.6), 0.5 * S)
        bar(f'legTie{s}{d}', M['vermilion'], P(x, TY + d * 2.4, 3.0), P(x, TY, 3.0), 0.3 * S)
box('nuki', M['vermilion'], P(0.0, TY, 9.4), (17.0 * S, 0.7 * S, 1.0 * S), bevel=0)
box('plaque', M['blackTop'], P(0.0, TY - 0.2, 11.5), (2.0 * S, 0.3 * S, 2.6 * S), bevel=0)
box('shimaki', M['vermilion'], P(0.0, TY, 13.6), (19.0 * S, 1.0 * S, 1.0 * S), bevel=0)
rings = []
for i in range(17):
    t = i / 16
    u = -12.4 + 24.8 * t
    lift = 1.2 * (2.0 * abs(t - 0.5)) ** 2.4
    rings.append([P(u, TY + dy, 14.1 + lift + dz).to_tuple() for dy, dz in ((-0.8, 0.0), (0.8, 0.0), (0.8, 0.9), (-0.8, 0.9))])
loft('kasagi', M['vermilion'], rings, smooth=False)
top = []
for i in range(17):
    t = i / 16
    u = -12.6 + 25.2 * t
    lift = 1.2 * (2.0 * abs(t - 0.5)) ** 2.4
    top.append([P(u, TY + dy, 15.0 + lift + dz).to_tuple() for dy, dz in ((-1.0, 0.0), (1.0, 0.0), (0.9, 0.7), (-0.9, 0.7))])
loft('kasagiTop', M['blackTop'], top, smooth=False)

big = Matrix.Translation(P(0.0, TY, 0.0)) @ Matrix.Scale(1.6, 4) @ Matrix.Translation(-P(0.0, TY, 0.0))
for ob in set(bpy.data.objects) - TORII:
    ob.matrix_world = big @ ob.matrix_world

# ------------------------------------------------------------------ the shrine on its piers: the main hall, the halls beside it, the corridors, the stage
DECK = 2.2


def hall(name, cx, cy, w, d, h, roof_rise):
    box(name + 'Floor', M['deckI'], P(cx, cy, DECK - 0.2), ((w + 1.0) * S, (d + 1.0) * S, 0.4 * S), bevel=0)
    for u in [-w / 2 + w * k / max(1, int(w / 3.0)) for k in range(int(w / 3.0) + 1)]:
        for v in (-d / 2, d / 2):
            post(f'{name}Post{u:+.0f}{v:+.0f}', cx + u, cy + v, DECK, DECK + h)
    box(name + 'Wall', M['whitePanel'], P(cx, cy + d / 2 - 0.3, DECK + h / 2), (w * S, 0.3 * S, h * S), bevel=0)
    box(name + 'Beam', M['vermilion'], P(cx, cy, DECK + h - 0.3), (w * S, d * S, 0.5 * S), bevel=0)
    hip_roof(name + 'Roof', M['bark'], cx * S, cy * S, Z0 + (DECK + h) * S, (w + 2.4) * S, (d + 2.4) * S, roof_rise * S, over=0.0)
    for s in (-1, 1):
        bm = bmesh.new()
        q = [(cx - w / 2 - 1.2, cy + s * (d / 2 + 1.2)), (cx + w / 2 + 1.2, cy + s * (d / 2 + 1.2))]
        a = [bm.verts.new(P(x, y, DECK + h)) for x, y in q]
        b = [bm.verts.new(P(x, y + s * 0.8, DECK + h - 0.5)) for x, y in q]
        bm.faces.new((a[0], a[1], b[1], b[0]))
        finish(f'{name}Eave{s}', bm, M['bark'], smooth_sides=False)


for k in range(8):
    x = -16.0 + 32.0 * k / 7
    for y in (6.0, 26.0):
        post(f'pier{k}{y:.0f}', x, y, 0.0, DECK - 0.2, 0.35, 'vermilion')
hall('honden', 0.0, 18.0, 18.0, 9.0, 5.0, 4.0)
hall('haiden', 0.0, 8.0, 14.0, 6.0, 4.4, 3.2)
hall('stage', 0.0, -2.0, 9.0, 7.0, 3.6, 2.4)
for s in (-1, 1):
    hall(f'sideHall{s}', s * 22.0, 14.0, 8.0, 6.0, 4.0, 2.8)
# the corridors: long and zigzagging over the water, posts and lanterns
CORRIDORS = [[(-10.0, 2.0), (-20.0, 2.0), (-24.0, 8.0), (-36.0, 8.0), (-38.0, 20.0)], [(10.0, 2.0), (20.0, 2.0), (24.0, 8.0), (36.0, 8.0), (38.0, 20.0)]]
for j, path in enumerate(CORRIDORS):
    for (xa, ya), (xb, yb) in zip(path, path[1:]):
        L = math.hypot(xb - xa, yb - ya)
        ang = math.atan2(yb - ya, xb - xa)
        mx, my = (xa + xb) / 2, (ya + yb) / 2
        box(f'corridorFloor{j}{xa:+.0f}{ya:+.0f}', M['deckI'], P(mx, my, DECK - 0.2), ((L + 3.0) * S, 3.4 * S, 0.4 * S), rot_z=ang, bevel=0)
        n = max(1, int(L / 3.0))
        nx, ny = -math.sin(ang), math.cos(ang)
        for k in range(n + 1):
            x, y = xa + (xb - xa) * k / n, ya + (yb - ya) * k / n
            for s in (-1, 1):
                post(f'cPost{j}{x:+.0f}{y:+.0f}{s}', x + nx * s * 1.4, y + ny * s * 1.4, DECK, DECK + 3.0, 0.18)
                post(f'cPier{j}{x:+.0f}{y:+.0f}{s}', x + nx * s * 1.4, y + ny * s * 1.4, 0.0, DECK - 0.2, 0.2)
        gable_roof(f'corridorRoof{j}{xa:+.0f}{ya:+.0f}', M['bark'], -(L / 2 + 1.5) * S, (L / 2 + 1.5) * S, -2.2 * S, 2.2 * S, 0.0, 1.4 * S, over=0.0)
        ob = bpy.data.objects[f'corridorRoof{j}{xa:+.0f}{ya:+.0f}']
        ob.matrix_world = Matrix.Translation(P(mx, my, DECK + 3.0)) @ Matrix.Rotation(ang, 4, 'Z')

# ------------------------------------------------------------------ the forest on Misen's slopes, people
CROWNS = []
for p in scatter_on(land, 8000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: m == 1 and math.hypot(p.x, p.y) < 1.36, seed=3):
    CROWNS.append(((p.x, p.y, p.z + rng.uniform(3.0, 5.0) * S), rng.uniform(2.6, 4.0) * S, 0.85))
    if len(CROWNS) >= 260:
        break
blob_cloud('forest', M['forestI'], CROWNS[::2])
blob_cloud('forestLight', M['forestI2'], CROWNS[1::2])
for k, (x, y, shirt) in enumerate(((-22.0, 2.0, 'blue'), (-30.0, 8.0, 'red'), (24.0, 8.0, 'yellow'), (0.0, -1.0, 'green'))):
    c = P(x, y, DECK)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('itsukushima')
