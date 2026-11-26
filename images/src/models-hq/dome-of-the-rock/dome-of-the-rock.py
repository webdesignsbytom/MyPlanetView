# The Dome of the Rock in the high-quality look (hq.py), laid out in metres: the octagonal shrine on its
# raised platform in Jerusalem, its lower walls of pale marble and its upper walls of blue tilework with
# their arched windows and the band of inscription along the top, a portal on every other side; the drum
# tiled the same with its windows, and the gilded dome on it with its finial; the paved platform with its
# arcades at the heads of the steps, the little Dome of the Chain beside it, cypresses, and people.
# Run: blender -b --factory-startup -P dome-of-the-rock.py -- dome-of-the-rock-1024.png 1024 dome-of-the-rock.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(691)
M['marbleD'] = material('domeMarble', '#ece6da', 0.5, vary='#e2dccf', vary_scale=30)
M['tileD'] = mosaic('domeTiles', [(5, '#2a5fa8'), (3, '#3a8fc0'), (2, '#f0ecdf'), (1, '#2f8a6a'), (1, '#e2b23e')], scale=70, mortar='#d9d3c3', rough=0.35)
M['bandD'] = material('inscriptionBand', '#2a4f9a', 0.4, vary='#e9e3d2', vary_scale=220)
M['goldD'] = material('domeGold', '#e5b43c', 0.22, vary='#f2c757', vary_scale=40, metallic=0.95)
M['stoneD'] = masonry('platformStone', '#d9cdb5', '#bcae94', scale=80, rough=0.85, vary='#d0c3aa')
M['windowD'] = material('domeWindow', '#1d2f55', 0.5)
M['cypress'] = material('cypressD', '#2f5a33', 0.85, vary='#3a683d', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.0255              # metres to the tile's units
Z0 = G + 0.004
PLAT = 3.0              # the platform's top


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def octagon(r):
    return [(r * math.cos(math.pi / 8 + k * math.pi / 4), r * math.sin(math.pi / 8 + k * math.pi / 4)) for k in range(8)]


def prism(name, mat, poly, z0, z1):
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(x, y, z1)) for x, y in poly], [bm.verts.new(P(x, y, z0)) for x, y in poly])
    return finish(name, bm, mat, smooth_sides=False)


BEFORE = set(bpy.data.objects)
slab('platform', M['stoneD'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0 + PLAT * S, margin=0.03)
WIN = []

# ------------------------------------------------------------------ the octagon: marble below, tiles above, windows, the inscription band, the portals
RO = 26.0               # to the octagon's corners
prism('lower', M['marbleD'], octagon(RO), PLAT, PLAT + 6.0)
prism('upper', M['tileD'], octagon(RO - 0.1), PLAT + 6.0, PLAT + 11.4)
prism('band', M['bandD'], octagon(RO + 0.05), PLAT + 11.4, PLAT + 12.6)
prism('parapet', M['tileD'], octagon(RO - 0.4), PLAT + 12.6, PLAT + 13.6)
apo = RO * math.cos(math.pi / 8)
side = 2 * RO * math.sin(math.pi / 8)
for k in range(8):
    a = k * math.pi / 4
    nx, ny = math.cos(a), math.sin(a)
    tx, ty = -ny, nx
    for j in range(5):
        u = -side / 2 + side * (j + 0.5) / 5
        c = P(nx * (apo + 0.05) + tx * u, ny * (apo + 0.05) + ty * u, 0)
        WIN.append((c.x, c.y, Z0 + (PLAT + 7.2) * S, 1.8 * S, 3.4 * S, (nx, ny), 'round'))
    if k % 2 == 0:
        box(f'porch{k}', M['marbleD'], P(nx * (apo + 1.6), ny * (apo + 1.6), PLAT + 3.4), (6.4 * S, 3.2 * S, 6.8 * S), rot_z=a + math.pi / 2, bevel=0)
        for s in (-1, 1):
            cylinder(f'porchCol{k}{s}', M['marbleD'], 0.4 * S, 5.6 * S, P(nx * (apo + 3.4) + tx * s * 2.4, ny * (apo + 3.4) + ty * s * 2.4, PLAT), segs=10)
        box(f'porchRoof{k}', M['marbleD'], P(nx * (apo + 2.4), ny * (apo + 2.4), PLAT + 6.0), (7.0 * S, 4.8 * S, 0.8 * S), rot_z=a + math.pi / 2, bevel=0)
        c = P(nx * (apo + 0.12), ny * (apo + 0.12), 0)
        WIN.append((c.x, c.y, Z0 + PLAT * S, 2.8 * S, 4.6 * S, (nx, ny), 'round'))

# ------------------------------------------------------------------ the drum and the gilded dome
cylinder('drum', M['tileD'], 11.6 * S, 10.0 * S, P(0.0, 0.0, PLAT + 12.6), segs=64)
cylinder('drumBand', M['bandD'], 11.7 * S, 1.2 * S, P(0.0, 0.0, PLAT + 21.4), segs=64)
for k in range(16):
    a = 2 * math.pi * (k + 0.5) / 16
    c = P(11.62 * math.cos(a), 11.62 * math.sin(a), 0)
    WIN.append((c.x, c.y, Z0 + (PLAT + 15.0) * S, 1.6 * S, 3.6 * S, (math.cos(a), math.sin(a)), 'round'))
prof = [(11.6, 0.0), (12.2, 2.4), (12.0, 5.6), (10.8, 9.4), (8.4, 13.4), (5.0, 16.6), (2.0, 18.2), (0.0, 18.6)]
lathe('dome', M['goldD'], [(u * S, v * S) for u, v in prof], P(0.0, 0.0, PLAT + 22.6), segs=72, smooth=True)
lathe('finial', M['goldD'], [(0.6 * S, 0.0), (0.8 * S, 0.8 * S), (0.3 * S, 1.6 * S), (0.5 * S, 2.6 * S), (0.1 * S, 4.0 * S), (0.0, 4.6 * S)], P(0.0, 0.0, PLAT + 41.2), segs=16, smooth=True)
glazed('windows', WIN, M['marbleD'], glass=M['windowD'], depth=0.25 * S, bars=False)

# ------------------------------------------------------------------ the Dome of the Chain, the arcades at the steps, cypresses, people
CX, CY = 36.0, 4.0
for k in range(11):
    a = 2 * math.pi * k / 11
    cylinder(f'chainCol{k}', M['marbleD'], 0.3 * S, 4.4 * S, P(CX + 5.0 * math.cos(a), CY + 5.0 * math.sin(a), PLAT), segs=8)
cylinder('chainRoof', M['tileD'], 5.6 * S, 1.2 * S, P(CX, CY, PLAT + 4.4), segs=24)
lathe('chainDome', M['marbleD'], [(3.0 * S, 0.0), (3.0 * S, 1.2 * S), (2.2 * S, 2.8 * S), (0.0, 3.6 * S)], P(CX, CY, PLAT + 5.6), segs=24, smooth=True)
for k, (ax, ay, ang) in enumerate(((0.0, -40.0, 0.0), (-40.0, 6.0, math.pi / 2))):
    pts = [(ax + math.cos(ang) * u, ay + math.sin(ang) * u) for u in (-12.0, -6.0, 0.0, 6.0, 12.0)]
    arcade_path(f'qanatir{k}', M['marbleD'], [(x * S, y * S) for x, y in pts], 1.2 * S, Z0 + (PLAT + 4.0) * S, 3.0 * S, 2.6 * S)
    for x, y in pts:
        cylinder(f'qanatirCol{k}{x:+.0f}{y:+.0f}', M['marbleD'], 0.45 * S, 4.0 * S, P(x, y, PLAT), segs=10)
CYP = []
for k, (x, y) in enumerate(((-34.0, -26.0), (-38.0, -14.0), (32.0, -26.0), (38.0, -16.0), (-30.0, 30.0), (28.0, 32.0), (-14.0, 40.0), (14.0, 42.0))):
    if math.hypot(x, y) * S > 1.3:
        continue
    CYP.append((P(x, y, PLAT + 5.0).to_tuple(), 1.4 * S, 3.2))
blob_cloud('cypresses', M['cypress'], CYP)
for k, (x, y, shirt) in enumerate(((-6.0, -32.0, 'blue'), (4.0, -33.0, 'red'), (-18.0, -24.0, 'green'), (20.0, -22.0, 'yellow'), (34.0, -4.0, 'blue'))):
    c = P(x, y, PLAT)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('dome-of-the-rock')
