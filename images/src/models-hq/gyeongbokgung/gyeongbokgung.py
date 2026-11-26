# Gyeongbokgung in the high-quality look (hq.py), laid out in metres (its courtyard drawn smaller, to fit):
# Seoul's royal palace, its throne hall Geunjeongjeon on the two-tiered stone platform with its
# balustrades and stairs; the hall's red columns and the painted green beams under its two tiers of grey
# tiled roofs, their eaves curving up at the corners, white along their ridges; the stone-paved
# courtyard with its rows of rank stones; the wooded slopes of Bugaksan behind, and people.
# Run: blender -b --factory-startup -P gyeongbokgung.py -- gyeongbokgung-1024.png 1024 gyeongbokgung.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1395)
M['redCol'] = material('palaceRed', '#a5392a', 0.6, vary='#983426', vary_scale=40)
M['dancheong'] = material('dancheongGreen', '#3e7f6e', 0.6, vary='#4a8d7b', vary_scale=40)
M['lattice'] = chequer('palaceLattice', '#c9a06a', '#6b4a2c', scale=300.0, rough=0.7)
M['tileK'] = material('palaceTile', '#464b50', 0.55, vary='#3f4448', vary_scale=60)
M['ridgeK'] = material('palaceRidge', '#e9e6df', 0.6)
M['graniteK'] = material('palaceGranite', '#aaa497', 0.8, vary='#9f998c', vary_scale=40, bump=0.15, bump_scale=200)
M['courtK'] = masonry('palaceCourt', '#cfc9bc', '#aaa498', scale=60, rough=0.85, vary='#c4beb1')
M['slopeK'] = material('bugaksanSlope', '#577a3a', 0.9, vary='#628543', vary_scale=14)
M['pineKo'] = material('koreanPine', '#2f5a33', 0.85, vary='#3b683d', vary_scale=14, bump=0.3, bump_scale=90)
M['treeKo'] = material('bugakTrees', '#4f8a3a', 0.85, vary='#5c9744', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.033               # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    return 18.0 * smooth((y - 26.0) / 20.0) * (0.85 + 0.15 * math.sin(x / 11.0))


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.12)
    return ground(x / S, y / S) * S * rim


land = terrain('bugaksan', H, [M['slopeK']], lambda z, nz, x, y: 0, rings=120, segs=300)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def roof(name, cx, cy, w, d, z, rise, lift, ridge=True):
    """A Korean hip-and-gable roof: grey tiles from its eaves, which curve up at the corners, to a white
    ridge; w x d its eaves' outline at height z."""
    rings = []
    for i, (fw, fd, fz) in enumerate(((1.0, 1.0, 0.0), (0.8, 0.72, 0.45), (0.62, 0.3, 0.85), (0.6, 0.02, 1.0))):
        ring = []
        for sx, sy in ((-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0)):
            corner = abs(sx) + abs(sy) == 2
            l = lift * (1.0 - fz) if corner else 0.0
            sag = -0.25 * rise * (1.0 - fz) * (1 if not corner else 0) * (1 if i < 2 else 0)
            ring.append(P(cx + sx * w / 2 * fw, cy + sy * d / 2 * fd, z + rise * fz + l + sag).to_tuple())
        rings.append(ring)
    loft(name, M['tileK'], rings, smooth=True)
    if ridge:
        box(name + 'Ridge', M['ridgeK'], P(cx, cy, z + rise + 0.25), (w * 0.62 * S, 0.8 * S, 0.6 * S), bevel=0)


def hall_storey(name, cx, cy, w, d, z0, h, cols_x, cols_y):
    """A storey of red columns with green-painted beams and lattice doors between them."""
    for k in range(cols_x + 1):
        x = cx - w / 2 + w * k / cols_x
        for y in (cy - d / 2, cy + d / 2):
            cylinder(f'{name}Col{k}{y:+.0f}', M['redCol'], 0.4 * S, h * S, P(x, y, z0), segs=12)
    for k in range(1, cols_y):
        y = cy - d / 2 + d * k / cols_y
        for x in (cx - w / 2, cx + w / 2):
            cylinder(f'{name}ColS{k}{x:+.0f}', M['redCol'], 0.4 * S, h * S, P(x, y, z0), segs=12)
    box(name + 'Doors', M['lattice'], P(cx, cy, z0 + h * 0.45), ((w - 0.6) * S, (d - 0.6) * S, h * 0.9 * S), bevel=0)
    box(name + 'Beam', M['dancheong'], P(cx, cy, z0 + h + 0.4), ((w + 0.4) * S, (d + 0.4) * S, 0.8 * S), bevel=0)
    box(name + 'Bracket', M['dancheong'], P(cx, cy, z0 + h + 1.1), ((w + 1.4) * S, (d + 1.4) * S, 0.7 * S), bevel=0)


# ------------------------------------------------------------------ the courtyard and its rank stones
CX, CY0, CY1 = 40.0, -38.0, 32.0
slab('court', M['courtK'], [(-CX * S, CY0 * S), (CX * S, CY0 * S), (CX * S, CY1 * S), (-CX * S, CY1 * S)], Z0, Z0 + 0.2 * S, margin=0.02)
block('royalPath', M['graniteK'], -2.5, 2.5, CY0, -8.0, 0.2, 0.45, bevel=0)
for k in range(9):
    y = -30.0 + 2.4 * k
    for s in (-1, 1):
        lathe(f'rankStone{k}{s}', M['graniteK'], [(0.35 * S, 0.0), (0.3 * S, 0.8 * S), (0.0, 1.0 * S)], P(s * 7.0, y, 0.2), segs=6)

# ------------------------------------------------------------------ the platform: two tiers with balustrades, stairs
for k, (hw, hd, z0, z1) in enumerate(((26.0, 21.0, 0.2, 1.8), (21.0, 16.5, 1.8, 3.4))):
    block(f'tier{k}', M['graniteK'], -hw, hw, -hd, hd, z0, z1)
    for (xa, ya, xb, yb) in ((-hw, -hd, hw, -hd), (hw, -hd, hw, hd), (hw, hd, -hw, hd), (-hw, hd, -hw, -hd)):
        n = int(math.hypot(xb - xa, yb - ya) / 2.0)
        for j in range(n + 1):
            x, y = xa + (xb - xa) * j / n, ya + (yb - ya) * j / n
            if abs(x) < 4.0 and y < 0:
                continue
            box(f'post{k}{x:+.0f}{y:+.0f}', M['graniteK'], P(x, y, z1 + 0.45), (0.3 * S, 0.3 * S, 0.9 * S), bevel=0)
        tube(f'rail{k}{xa:+.0f}{ya:+.0f}', M['graniteK'], [P(xa, ya, z1 + 0.8), P(xb, yb, z1 + 0.8)], 0.1 * S)
    for j in range(5):
        z = z0 + (z1 - z0) * (j + 1) / 5
        block(f'stair{k}{j}', M['graniteK'], -3.6, 3.6, -hd - 2.0 + 0.4 * j, -hd + 0.4 * j - 1.6, z0, z, bevel=0)

# ------------------------------------------------------------------ Geunjeongjeon: two storeys of red columns, its two roofs
HZ = 3.4
block('hallFloor', M['graniteK'], -16.0, 16.0, -11.0, 11.0, HZ, HZ + 0.6)
hall_storey('lower', 0.0, 0.0, 30.0, 20.0, HZ + 0.6, 7.0, 5, 4)
roof('lowerRoof', 0.0, 0.0, 35.0, 25.0, HZ + 8.6, 3.0, 1.8, ridge=False)
hall_storey('upper', 0.0, 0.0, 22.0, 13.0, HZ + 10.6, 4.2, 5, 3)
roof('upperRoof', 0.0, 0.0, 29.0, 19.0, HZ + 16.0, 8.4, 2.4)

# ------------------------------------------------------------------ Bugaksan's woods, people
TREES, PINES = [], []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.34, seed=8):
    x, y = p.x / S, p.y / S
    if y < 26.0:
        continue
    (PINES if rng.random() < 0.4 else TREES).append(((p.x, p.y, p.z + 4.0 * S), rng.uniform(2.6, 3.8) * S, 0.85))
    if len(TREES) + len(PINES) >= 160:
        break
blob_cloud('woods', M['treeKo'], TREES)
blob_cloud('pines', M['pineKo'], PINES)
for k, (x, y, shirt) in enumerate(((-1.0, -24.0, 'red'), (1.5, -28.0, 'blue'), (-12.0, -20.0, 'yellow'), (14.0, -26.0, 'green'), (-20.0, -12.0, 'red'))):
    c = P(x, y, 0.2)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('gyeongbokgung')
