# Kiyomizu-dera in the high-quality look (hq.py), laid out in metres: Kyoto's temple on Mount Otowa; the
# main hall's great wooden stage jutting out over the hillside on its lattice of tall pillars and tie
# beams, the hall behind under its huge dark roof of cypress bark; the vermilion three-storey pagoda and
# the vermilion gate on the slope; the hillside's maples in their autumn reds and oranges among the green,
# and people on the stage.
# Run: blender -b --factory-startup -P kiyomizu-dera.py -- kiyomizu-dera-1024.png 1024 kiyomizu-dera.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1633)
M['woodK'] = material('kiyomizuWood', '#8a6a48', 0.75, vary='#7c5f40', vary_scale=60)
M['woodDark'] = material('kiyomizuWoodDark', '#5e4430', 0.75)
M['deckK'] = material('kiyomizuDeck', '#a88964', 0.8, vary='#9c7d59', vary_scale=60)
M['barkRoof'] = material('cypressBarkRoof', '#4f4038', 0.85, vary='#45372f', vary_scale=60, bump=0.2, bump_scale=300)
M['vermilionK'] = material('kiyomizuVermilion', '#d9472b', 0.55)
M['whiteK'] = material('kiyomizuWhite', '#efe9dc', 0.6)
M['tileK'] = material('kiyomizuTile', '#4a4d50', 0.55)
M['slopeK'] = material('otowaSlope', '#5a7a3a', 0.9, vary='#668643', vary_scale=14)
M['mapleRed'] = material('mapleRedK', '#c8412e', 0.85, vary='#d6533a', vary_scale=14, bump=0.3, bump_scale=90)
M['mapleOrange'] = material('mapleOrangeK', '#e08a2e', 0.85, vary='#e99a3e', vary_scale=14, bump=0.3, bump_scale=90)
M['greenK'] = material('kiyomizuGreen', '#3f7a36', 0.85, vary='#4c8a40', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.03                # metres to the tile's units
Z0 = G
TERR = 18.0             # the hall's terrace


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The hillside dropping towards us from the hall's terrace, rising again behind it."""
    return TERR * smooth((y + 24.0) / 26.0) + 10.0 * smooth((y - 22.0) / 20.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.14)
    return ground(x / S, y / S) * S * rim


land = terrain('hillside', H, [M['slopeK']], lambda z, nz, x, y: 0, rings=180, segs=440)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def roof(name, cx, cy, w, d, z, rise, lift, mat):
    rings = []
    for i, (fw, fd, fz) in enumerate(((1.0, 1.0, 0.0), (0.8, 0.72, 0.45), (0.62, 0.3, 0.85), (0.6, 0.02, 1.0))):
        ring = []
        for sx, sy in ((-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0)):
            corner = abs(sx) + abs(sy) == 2
            l = lift * (1.0 - fz) if corner else 0.0
            ring.append(P(cx + sx * w / 2 * fw, cy + sy * d / 2 * fd, z + rise * fz + l).to_tuple())
        rings.append(ring)
    loft(name, M[mat], rings, smooth=True)


# ------------------------------------------------------------------ the stage on its lattice of pillars
SX0, SX1, SY0, SY1 = -14.0, 14.0, -14.0, 2.0
box('stage', M['deckK'], P(0.0, (SY0 + SY1) / 2, TERR + 0.3), ((SX1 - SX0) * S, (SY1 - SY0) * S, 0.6 * S), bevel=0)
for s in (-1, 1):
    box(f'stageRail{s}', M['woodK'], P(s * (SX1 - 0.2), (SY0 + SY1) / 2, TERR + 1.2), (0.3 * S, (SY1 - SY0) * S, 1.2 * S), bevel=0)
box('stageRailFront', M['woodK'], P(0.0, SY0 + 0.2, TERR + 1.2), ((SX1 - SX0) * S, 0.3 * S, 1.2 * S), bevel=0)
xs = [SX0 + (SX1 - SX0) * i / 5 for i in range(6)]
ys = [SY0 + (SY1 - SY0) * j / 3 for j in range(4)]
for x in xs:
    for y in ys:
        g = ground(x, y)
        cylinder(f'pillar{x:+.0f}{y:+.0f}', M['woodK'], 0.55 * S, (TERR - g + 1.0) * S, P(x, y, g - 1.0), segs=12)
for z in [TERR - 4.0 - 4.0 * k for k in range(4)]:
    for y in ys:
        if ground(SX0, y) > z:
            continue
        box(f'tieX{y:+.0f}{z:.0f}', M['woodDark'], P(0.0, y, z), ((SX1 - SX0 + 1.0) * S, 0.4 * S, 0.6 * S), bevel=0)
    for x in xs:
        if ground(x, SY0) > z:
            continue
        box(f'tieY{x:+.0f}{z:.0f}', M['woodDark'], P(x, (SY0 + SY1) / 2, z), (0.4 * S, (SY1 - SY0 + 1.0) * S, 0.6 * S), bevel=0)

# ------------------------------------------------------------------ the main hall behind it, its great roof
box('hallFloor', M['deckK'], P(0.0, 14.0, TERR + 0.3), (34.0 * S, 24.0 * S, 0.6 * S), bevel=0)
box('hall', M['whiteK'], P(0.0, 15.0, TERR + 4.6), (28.0 * S, 20.0 * S, 8.0 * S), bevel=0)
for k in range(8):
    x = -13.0 + 26.0 * k / 7
    cylinder(f'hallPost{k}', M['woodK'], 0.4 * S, 8.0 * S, P(x, 4.6, TERR + 0.6), segs=10)
box('hallBeam', M['woodDark'], P(0.0, 15.0, TERR + 8.9), (30.0 * S, 22.0 * S, 0.8 * S), bevel=0)
roof('hallRoof', 0.0, 14.0, 40.0, 32.0, TERR + 9.2, 13.0, 1.6, 'barkRoof')
for s in (-1, 1):
    roof(f'wingRoof{s}', s * 15.0, 2.0, 10.0, 8.0, TERR + 6.0, 4.0, 0.8, 'barkRoof')

# ------------------------------------------------------------------ the pagoda and the gate, vermilion
PX, PY = -30.0, 24.0
pz = ground(PX, PY)
for k in range(3):
    w = 8.0 - 1.4 * k
    z = pz + k * 6.0
    box(f'pagoda{k}', M['vermilionK'], P(PX, PY, z + 2.0), (w * S, w * S, 4.0 * S), bevel=0)
    roof(f'pagodaRoof{k}', PX, PY, w + 5.0, w + 5.0, z + 4.0, 2.0, 0.9, 'tileK')
lathe('pagodaSpire', M['woodDark'], [(0.4 * S, 0.0), (0.3 * S, 5.0 * S), (0.0, 6.0 * S)], P(PX, PY, pz + 20.0), segs=8)
GX, GY = -18.0, -28.0
gz = ground(GX, GY)
box('gate', M['vermilionK'], P(GX, GY, gz + 3.0), (10.0 * S, 5.0 * S, 6.0 * S), bevel=0)
box('gateWhite', M['whiteK'], P(GX, GY - 2.52, gz + 3.0), (3.0 * S, 0.1 * S, 3.6 * S), bevel=0)
roof('gateRoof', GX, GY, 14.0, 9.0, gz + 6.0, 3.6, 0.8, 'tileK')

# ------------------------------------------------------------------ the maples in autumn and the green, people on the stage
TREES = []
for p in scatter_on(land, 8000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.34, seed=9):
    x, y = p.x / S, p.y / S
    if (SX0 - 4.0 < x < SX1 + 4.0 and y > SY0 - 4.0) or math.hypot(x - PX, y - PY) < 8.0 or math.hypot(x - GX, y - GY) < 9.0:
        continue
    TREES.append(((p.x, p.y, p.z + 3.0 * S), rng.uniform(2.4, 3.8) * S, 0.85))
    if len(TREES) >= 200:
        break
blob_cloud('maplesRed', M['mapleRed'], TREES[0::3])
blob_cloud('maplesOrange', M['mapleOrange'], TREES[1::3])
blob_cloud('greenTrees', M['greenK'], TREES[2::3])
for k, (x, y, shirt) in enumerate(((-8.0, -10.0, 'red'), (-2.0, -12.0, 'blue'), (4.0, -9.0, 'yellow'), (9.0, -11.0, 'green'))):
    c = P(x, y, TERR + 0.6)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 30.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('kiyomizu-dera')
