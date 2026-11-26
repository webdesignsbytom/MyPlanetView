# The Golden Temple in the high-quality look (hq.py), laid out in metres (the pool drawn smaller than it
# is, so the temple can be seen): Harmandir Sahib in Amritsar, standing on its platform in the middle of
# the Amrit Sarovar; its white marble lower storey with the doorways on all four sides, the gilded upper
# storey, the parapet of little domes, the gilded kiosks on its corners and the fluted lotus dome with
# its finial; the marble causeway lined with gilded lamps out to the Darshani Deori gateway and its
# domes; the white marble walkway round the pool, and the white arcaded buildings round it, with people.
# Run: blender -b --factory-startup -P golden-temple.py -- golden-temple-1024.png 1024 golden-temple.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1604)
M['gildG'] = material('templeGold', '#e0ad3a', 0.25, vary='#efc556', vary_scale=40, metallic=0.9)
M['marbleG'] = material('templeMarble', '#f5f3ee', 0.4, vary='#ebe8e1', vary_scale=30)
M['marbleInlay'] = mosaic('templeInlay', [(8, '#f5f3ee'), (1, '#c79a3e'), (1, '#6a8f5a'), (1, '#b45a4a')], scale=120, mortar='#efece5', rough=0.4)
M['sarovar'] = material('amritSarovar', '#4a8579', 0.05, vary='#558f83', vary_scale=6, bump=0.03, bump_scale=60, coat=0.9)
M['walkG'] = chequer('parikrama', '#f2efe8', '#d9d3c7', scale=36.0, rough=0.4)
M['glassG'] = material('templeWindow', '#6f5a33', 0.4)

S = 0.024               # metres to the tile's units
Z0 = G + 0.004
POOL = 25.0             # the pool's half-width


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def lotus_dome(name, x, y, z, r, h, ribs, mat):
    """A fluted dome: its radius rippled round by `ribs` flutes, swelling, then drawn up to a point."""
    rings = []
    for j in range(15):
        t = j / 14
        rr = r * (1.0 + 0.15 * math.sin(math.pi * t * 0.8)) * math.cos(math.pi / 2 * t) ** 0.9
        zz = h * (math.sin(math.pi / 2 * t) * 0.8 + 0.2 * t ** 2)
        ring = []
        for q in range(ribs * 4):
            a = 2 * math.pi * q / (ribs * 4)
            k = rr * (1.0 + 0.06 * math.cos(ribs * a))
            ring.append(P(x + k * math.cos(a), y + k * math.sin(a), z + zz).to_tuple())
        rings.append(ring)
    return loft(name, mat, rings)


def instance(name, data, at, scale=1.0):
    ob = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(ob)
    ob.matrix_world = Matrix.Translation(at) @ Matrix.Scale(scale, 4)


BEFORE = set(bpy.data.objects)
WIN, DOORS = [], []
# ------------------------------------------------------------------ the pool and the walkway round it
E = POOL + 0.8
for k, (x0, y0, x1, y1) in enumerate(((-90.0, -90.0, 90.0, -E), (-90.0, E, 90.0, 90.0), (-90.0, -E, -E, E), (E, -E, 90.0, E))):
    slab(f'walkway{k}', M['walkG'], [(x0 * S, y0 * S), (x1 * S, y0 * S), (x1 * S, y1 * S), (x0 * S, y1 * S)], Z0 - 0.003, Z0 + 1.0 * S, margin=0.02)
block('sarovar', M['sarovar'], -POOL, POOL, -POOL, POOL, -0.3, 0.6, bevel=0)
for k, (x0, x1, y0, y1) in enumerate(((-POOL - 0.8, POOL + 0.8, -POOL - 0.8, -POOL), (-POOL - 0.8, POOL + 0.8, POOL, POOL + 0.8),
                                     (-POOL - 0.8, -POOL, -POOL, POOL), (POOL, POOL + 0.8, -POOL, POOL))):
    block(f'poolEdge{k}', M['marbleG'], x0, x1, y0, y1, 0.0, 1.3, bevel=0)

# ------------------------------------------------------------------ the temple: its platform, the white lower storey, the gilded upper storey, the domes
TP = 1.6
block('platform', M['marbleG'], -10.0, 10.0, -10.0, 10.0, 0.0, TP)
block('lower', M['marbleInlay'], -7.0, 7.0, -7.0, 7.0, TP, TP + 7.0)
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    for u in (-3.6, 0.0, 3.6):
        c = P(nx * 7.05 + (-ny) * u, ny * 7.05 + nx * u, 0)
        DOORS.append((c.x, c.y, Z0 + (TP + 0.2) * S, 2.0 * S, 4.6 * S, (nx, ny), 'round'))
block('cornice1', M['gildG'], -7.6, 7.6, -7.6, 7.6, TP + 7.0, TP + 7.8, bevel=0)
block('upper', M['gildG'], -6.4, 6.4, -6.4, 6.4, TP + 7.8, TP + 13.6)
for nx, ny in ((0, -1), (1, 0), (-1, 0), (0, 1)):
    for u in (-3.2, -1.1, 1.1, 3.2):
        c = P(nx * 6.45 + (-ny) * u, ny * 6.45 + nx * u, 0)
        WIN.append((c.x, c.y, Z0 + (TP + 9.0) * S, 1.4 * S, 3.0 * S, (nx, ny), 'round'))
block('cornice2', M['gildG'], -7.2, 7.2, -7.2, 7.2, TP + 13.6, TP + 14.3, bevel=0)
small = lathe('smallDomeSource', M['gildG'], [(0.7 * S, 0.0), (0.8 * S, 0.5 * S), (0.5 * S, 1.2 * S), (0.1 * S, 1.6 * S), (0.0, 2.0 * S)], (0, 0, 0), segs=12, smooth=True)
SMALL = small.data
bpy.data.objects.remove(small, do_unlink=True)
for k in range(28):
    t = k / 28 * 4
    side, f = int(t), t - int(t)
    pts = ((-6.8 + 13.6 * f, -6.8), (6.8, -6.8 + 13.6 * f), (6.8 - 13.6 * f, 6.8), (-6.8, 6.8 - 13.6 * f))
    x, y = pts[side]
    instance(f'parapetDome{k}', SMALL, P(x, y, TP + 14.3))
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx * 6.4, sy * 6.4
        for j in range(4):
            a = math.pi / 4 + j * math.pi / 2
            bar(f'kioskPost{sx}{sy}{j}', M['gildG'], P(x + 1.0 * math.cos(a), y + 1.0 * math.sin(a), TP + 14.3), P(x + 1.0 * math.cos(a), y + 1.0 * math.sin(a), TP + 16.4), 0.25 * S)
        cylinder(f'kioskRoof{sx}{sy}', M['gildG'], 1.5 * S, 0.4 * S, P(x, y, TP + 16.4), segs=16)
        lotus_dome(f'kioskDome{sx}{sy}', x, y, TP + 16.8, 1.2, 2.6, 8, M['gildG'])
cylinder('domeDrum', M['gildG'], 4.6 * S, 1.8 * S, P(0, 0, TP + 14.3), segs=48)
lotus_dome('lotusDome', 0.0, 0.0, TP + 16.1, 4.6, 8.4, 16, M['gildG'])
lathe('kalash', M['gildG'], [(0.6 * S, 0.0), (0.9 * S, 0.8 * S), (0.4 * S, 1.6 * S), (0.5 * S, 2.2 * S), (0.1 * S, 3.6 * S), (0.0, 4.2 * S)], P(0, 0, TP + 24.3), segs=16, smooth=True)

# ------------------------------------------------------------------ the causeway, its gilded lamps, the Darshani Deori gateway
block('causeway', M['marbleG'], -POOL - 1.0, -10.0, -3.2, 3.2, 0.0, TP)
for s in (-1, 1):
    block(f'causewayRail{s}', M['marbleG'], -POOL - 1.0, -10.0, *sorted((s * 3.2, s * 2.8)), TP, TP + 0.9, bevel=0)
    for k in range(4):
        x = -13.0 - k * 3.4
        bar(f'lampPost{s}{k}', M['gildG'], P(x, s * 3.0, TP + 0.9), P(x, s * 3.0, TP + 3.0), 0.18 * S)
        lathe(f'lamp{s}{k}', M['gildG'], [(0.0, 0.0), (0.45 * S, 0.3 * S), (0.35 * S, 0.8 * S), (0.0, 1.0 * S)], P(x, s * 3.0, TP + 3.0), segs=10)
GX0 = -POOL - 16.0
block('gateway', M['marbleG'], GX0, -POOL - 1.0, -8.0, 8.0, 0.0, 11.0)
block('gatewayGold', M['gildG'], GX0 + 1.0, -POOL - 2.0, -6.0, 6.0, 11.0, 14.0)
c = P(-POOL - 0.95, 0.0, 0)
DOORS.append((c.x, c.y, Z0 + 1.0 * S, 3.6 * S, 6.4 * S, (1, 0), 'round'))
for y in (-4.0, 4.0):
    lotus_dome(f'gatewayDome{y:+.0f}', (GX0 - POOL - 1.0) / 2, y, 14.0, 2.4, 4.6, 10, M['gildG'])
for y in (-7.4, 7.4):
    lotus_dome(f'gatewayKiosk{y:+.0f}', -POOL - 2.0, y, 11.0, 1.0, 2.2, 8, M['gildG'])

# ------------------------------------------------------------------ the white arcaded buildings round the walkway, people
B0 = POOL + 10.0
for k, (x0, x1, y0, y1, nrm) in enumerate(((-B0, B0, B0, B0 + 7.0, (0, -1)), (B0, B0 + 7.0, -B0 + 10.0, B0 + 7.0, (-1, 0)), (-B0 - 7.0, -B0, 10.0, B0 + 7.0, (1, 0)))):
    block(f'surround{k}', M['marbleG'], x0, x1, y0, y1, 0.0, 9.0)
    block(f'surroundCornice{k}', M['marbleG'], x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, 9.0, 9.6, bevel=0)
    along = (x1 - x0) if nrm[0] == 0 else (y1 - y0)
    n = int(along / 4.0)
    for j in range(n):
        u = (j + 0.5) / n
        if nrm[0] == 0:
            cx_, cy_ = x0 + u * along, (y0 - 0.05 if nrm[1] < 0 else y1 + 0.05)
        else:
            cx_, cy_ = (x1 + 0.05 if nrm[0] > 0 else x0 - 0.05), y0 + u * along
        c = P(cx_, cy_, 0)
        DOORS.append((c.x, c.y, Z0 + 1.0 * S, 2.4 * S, 3.6 * S, nrm, 'round'))
        WIN.append((c.x, c.y, Z0 + 5.6 * S, 1.6 * S, 2.4 * S, nrm, 'round'))
    for j in range(0, n, 3):
        u = (j + 0.5) / n
        x, y = (x0 + u * along, (y0 + y1) / 2) if nrm[0] == 0 else ((x0 + x1) / 2, y0 + u * along)
        instance(f'surroundDome{k}{j}', SMALL, P(x, y, 9.6), scale=1.6)
glazed('windows', WIN, M['gildG'], glass=M['glassG'], depth=0.2 * S, bars=False)
glazed('doors', DOORS, M['gildG'], glass=M['door'], depth=0.2 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-16.0, -30.0, 'blue'), (-6.0, -31.0, 'yellow'), (6.0, -30.0, 'red'), (16.0, -31.0, 'blue'), (-31.0, -16.0, 'yellow'), (31.0, 8.0, 'red'), (-18.0, 0.0, 'yellow'))):
    c = P(x, y, 1.0 if k != 6 else TP)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 14.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('golden-temple')
