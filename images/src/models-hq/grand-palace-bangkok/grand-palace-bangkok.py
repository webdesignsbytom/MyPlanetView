# The Grand Palace in Bangkok in the high-quality look (hq.py), laid out in metres: the Temple of the
# Emerald Buddha's upper terrace, of white marble; the golden bell of the Phra Si Rattana Chedi on its
# rings, rising to its spire; the Phra Mondop's square library with its tiered green and gold needle;
# the Royal Pantheon with its corn-cob prang; and before them the ordination hall, white and gold, under
# tier on tier of orange roofs edged in green, with the horned finials on their gables; little gilded
# chedis, the paving round them, and people.
# Run: blender -b --factory-startup -P grand-palace-bangkok.py -- grand-palace-bangkok-1024.png 1024 grand-palace-bangkok.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1782)
M['goldT'] = material('thaiGold', '#e2b23e', 0.25, vary='#efc556', vary_scale=40, metallic=0.9)
M['orangeT'] = material('thaiOrangeTile', '#d9682a', 0.5, vary='#cf5f24', vary_scale=60)
M['greenT'] = material('thaiGreenTile', '#2f8a4c', 0.5, vary='#2a7d44', vary_scale=60)
M['whiteT'] = material('thaiWhite', '#f4f1ea', 0.5)
M['mosaicT'] = mosaic('thaiMosaic', [(3, '#2f7fb4'), (2, '#e2b23e'), (2, '#3f9a5a'), (1, '#c8423a'), (2, '#f0ece2')], scale=160, mortar='#e9e3d4', rough=0.3)
M['marbleT'] = masonry('thaiMarble', '#ece8e0', '#cfc9bd', scale=70, rough=0.6, vary='#e4dfd5')
M['doorT'] = material('thaiDoor', '#7a1e1a', 0.5)

S = 0.03                # metres to the tile's units
Z0 = G + 0.004
TERR = 1.6              # the terrace's top


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def thai_roof(name, cx, cy, w, d, z, tiers, along='y', rise=3.6):
    """Tier on tier of gabled roofs, each a little shorter and higher, orange tiles edged in green, gilded
    edges and the horned finials (chofa) at the gables' peaks."""
    for k in range(tiers):
        tw, td = w * (1.0 - 0.08 * k), d * (1.0 - 0.16 * k)
        tz = z + k * rise * 0.55
        if along == 'y':
            x0, x1, y0, y1 = cx - tw / 2, cx + tw / 2, cy - td / 2, cy + td / 2
        else:
            x0, x1, y0, y1 = cx - td / 2, cx + td / 2, cy - tw / 2, cy + tw / 2
        gable_roof(f'{name}{k}', M['orangeT'], x0 * S, x1 * S, y0 * S, y1 * S, Z0 + tz * S, rise * S, over=0.0, along=along)
        gable_roof(f'{name}Edge{k}', M['greenT'], (x0 - 0.3) * S, (x1 + 0.3) * S, (y0 - 0.3) * S, (y1 + 0.3) * S, Z0 + (tz - 0.25) * S, 0.5 * S, over=0.0, along=along)
    top = z + (tiers - 1) * rise * 0.55 + rise
    ends = ((cx, cy - d * (1.0 - 0.16 * (tiers - 1)) / 2), (cx, cy + d * (1.0 - 0.16 * (tiers - 1)) / 2)) if along == 'y' else \
           ((cx - d * (1.0 - 0.16 * (tiers - 1)) / 2, cy), (cx + d * (1.0 - 0.16 * (tiers - 1)) / 2, cy))
    for j, (ex, ey) in enumerate(ends):
        tube(f'{name}Chofa{j}', M['goldT'], [P(ex, ey, top - 0.2), P(ex, ey, top + 1.2), P(ex + (0.0 if along == 'y' else (0.8 if j else -0.8)), ey + ((0.8 if j else -0.8) if along == 'y' else 0.0), top + 2.0)], 0.22 * S)


def spire(name, x, y, z, r, h, mat):
    lathe(name, M[mat], [(r * S, 0.0), (r * 0.6 * S, h * 0.25 * S), (r * 0.35 * S, h * 0.55 * S), (r * 0.12 * S, h * 0.85 * S), (0.0, h * S)], P(x, y, z), segs=16, smooth=True)


BEFORE = set(bpy.data.objects)
slab('terrace', M['marbleT'], [(-44.0 * S, -14.0 * S), (44.0 * S, -14.0 * S), (44.0 * S, 40.0 * S), (-44.0 * S, 40.0 * S)], Z0 - 0.003, Z0 + TERR * S, margin=0.03)
for j in range(5):
    block(f'terraceStep{j}', M['marbleT'], -6.0, 6.0, -14.0 - 0.6 * (j + 1), -14.0 - 0.6 * j, -0.3, TERR - 0.32 * (j + 1), bevel=0)
WIN = []

# ------------------------------------------------------------------ the golden chedi: its rings, the bell, the spire
CX, CY = -26.0, 22.0
for k, (r, h) in enumerate(((11.0, 1.6), (9.6, 1.4), (8.4, 1.2))):
    cylinder(f'chediBase{k}', M['goldT'], r * S, h * S, P(CX, CY, TERR + sum(hh for rr, hh in ((11.0, 1.6), (9.6, 1.4), (8.4, 1.2))[:k])), segs=48)
BZ = TERR + 4.2
lathe('chediBell', M['goldT'], [(7.6 * S, 0.0), (7.8 * S, 2.0 * S), (7.0 * S, 6.0 * S), (5.0 * S, 9.4 * S), (2.6 * S, 11.4 * S), (1.6 * S, 12.2 * S)], P(CX, CY, BZ), segs=48, smooth=True)
box('chediHarmika', M['goldT'], P(CX, CY, BZ + 13.0), (3.2 * S, 3.2 * S, 1.6 * S), bevel=0)
for k in range(7):
    lathe(f'chediRing{k}', M['goldT'], [((1.4 - 0.15 * k) * S, 0.0), ((1.6 - 0.15 * k) * S, 0.35 * S), ((1.2 - 0.15 * k) * S, 0.7 * S)], P(CX, CY, BZ + 13.8 + 0.7 * k), segs=24)
spire('chediSpire', CX, CY, BZ + 18.7, 0.5, 9.0, 'goldT')

# ------------------------------------------------------------------ the Mondop: square library, its tiered needle
MX, MY = 0.0, 24.0
block('mondopBase', M['whiteT'], MX - 10.0, MX + 10.0, MY - 10.0, MY + 10.0, TERR, TERR + 2.0)
block('mondop', M['mosaicT'], MX - 7.5, MX + 7.5, MY - 7.5, MY + 7.5, TERR + 2.0, TERR + 11.0)
for nx, ny in ((0, -1), (1, 0), (-1, 0)):
    c = P(MX + nx * 7.55, MY + ny * 7.55, 0)
    WIN.append((c.x, c.y, Z0 + (TERR + 2.4) * S, 2.6 * S, 5.6 * S, (nx, ny), 'pointed'))
for k in range(5):
    w = 16.0 - 2.4 * k
    gable_roof(f'mondopTierA{k}', M['greenT'], (MX - w / 2) * S, (MX + w / 2) * S, (MY - w / 2) * S, (MY + w / 2) * S, Z0 + (TERR + 11.0 + 2.0 * k) * S, 2.0 * S, over=0.0, along='x')
    gable_roof(f'mondopTierB{k}', M['orangeT'], (MX - w / 2) * S, (MX + w / 2) * S, (MY - w / 2) * S, (MY + w / 2) * S, Z0 + (TERR + 11.0 + 2.0 * k) * S, 2.0 * S, over=0.0, along='y')
lathe('mondopNeedle', M['goldT'], [(2.6 * S, 0.0), (2.0 * S, 2.0 * S), (1.4 * S, 4.0 * S), (1.0 * S, 7.0 * S), (0.5 * S, 10.0 * S), (0.0, 13.0 * S)], P(MX, MY, TERR + 21.0), segs=8)

# ------------------------------------------------------------------ the Royal Pantheon and its prang
PX, PY = 26.0, 22.0
block('pantheon', M['whiteT'], PX - 9.0, PX + 9.0, PY - 6.0, PY + 6.0, TERR, TERR + 8.0)
block('pantheonCross', M['whiteT'], PX - 5.0, PX + 5.0, PY - 10.0, PY + 10.0, TERR, TERR + 8.0)
thai_roof('pantheonRoofA', PX, PY, 18.0, 13.0, TERR + 8.0, 3, along='x', rise=3.0)
thai_roof('pantheonRoofB', PX, PY, 11.0, 21.0, TERR + 8.0, 3, along='y', rise=3.0)
rings = [(3.4, 0.0), (3.6, 1.0), (3.2, 2.0), (3.4, 3.0), (2.9, 4.0), (3.0, 5.0), (2.5, 6.0), (2.5, 7.0), (2.0, 8.0), (1.9, 9.0), (1.3, 10.4), (0.8, 11.4), (0.0, 12.6)]
lathe('prang', M['goldT'], [(r * S, z * S) for r, z in rings], P(PX, PY, TERR + 13.0), segs=24, smooth=True)
spire('prangTip', PX, PY, TERR + 25.4, 0.4, 4.0, 'goldT')

# ------------------------------------------------------------------ the ordination hall in front: white and gold walls, its tiered roofs
UX, UY = 0.0, -2.0
block('uboBase', M['whiteT'], UX - 13.0, UX + 13.0, UY - 8.0, UY + 8.0, TERR, TERR + 1.6)
block('ubo', M['whiteT'], UX - 11.0, UX + 11.0, UY - 6.0, UY + 6.0, TERR + 1.6, TERR + 10.0)
block('uboGoldBand', M['goldT'], UX - 11.2, UX + 11.2, UY - 6.2, UY + 6.2, TERR + 8.6, TERR + 10.0, bevel=0)
for k in range(6):
    x = UX - 10.0 + 4.0 * k
    for y in (UY - 7.2, UY + 7.2):
        cylinder(f'uboCol{k}{y:+.0f}', M['goldT'], 0.45 * S, 8.4 * S, P(x, y, TERR + 1.6), segs=8)
for k in range(5):
    x = UX - 8.0 + 4.0 * k
    c = P(x, UY - 6.05, 0)
    WIN.append((c.x, c.y, Z0 + (TERR + 3.0) * S, 1.6 * S, 4.0 * S, (0, -1), 'pointed'))
thai_roof('uboRoof', UX, UY, 17.0, 30.0, TERR + 10.0, 3, along='x', rise=4.0)
glazed('doors', WIN, M['goldT'], glass=M['doorT'], depth=0.2 * S, bars=False)

# ------------------------------------------------------------------ little gilded chedis, people
for k, (x, y) in enumerate(((-28.0, -2.0), (28.0, -2.0))):
    cylinder(f'smallChediBase{k}', M['goldT'], 2.4 * S, 1.6 * S, P(x, y, TERR), segs=24)
    lathe(f'smallChedi{k}', M['goldT'], [(2.0 * S, 0.0), (2.0 * S, 1.0 * S), (1.2 * S, 3.0 * S), (0.5 * S, 4.4 * S)], P(x, y, TERR + 1.6), segs=24, smooth=True)
    spire(f'smallChediSpire{k}', x, y, TERR + 6.0, 0.4, 5.0, 'goldT')
for k, (x, y, shirt) in enumerate(((-4.0, -18.0, 'red'), (3.0, -20.0, 'blue'), (-14.0, -10.0, 'yellow'), (14.0, -10.0, 'green'), (-20.0, 6.0, 'red'))):
    c = P(x, y, TERR if y > -14.0 else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('grand-palace-bangkok')
