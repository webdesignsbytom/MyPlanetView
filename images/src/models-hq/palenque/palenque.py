# Palenque in the high-quality look (hq.py), laid out in metres: the Temple of the Inscriptions, its nine
# battered tiers built against the forested hill, the stair climbing its front and the temple on top
# with its five doorways between piers and its sloping roof; beside it the Palace on its platform, its
# long galleries with their sloping upper walls round the courtyards, and its four-storey tower; the
# lawns of the plaza before them, the rainforest on the hills behind, and people.
# Run: blender -b --factory-startup -P palenque.py -- palenque-1024.png 1024 palenque.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(683)
M['lime'] = material('palenqueLimestone', '#cfc8b2', 0.85, vary='#a9a38f', vary_scale=9, bump=0.2, bump_scale=160)
M['limeDark'] = material('palenqueLimestoneDark', '#aaa391', 0.85, vary='#8f8a78', vary_scale=9, bump=0.2, bump_scale=160)
M['roofStone'] = material('palenqueRoof', '#b8b29f', 0.85, vary='#8e8a77', vary_scale=7, bump=0.25, bump_scale=160)
M['doorway'] = material('palenqueDoorway', '#2c2a26', 0.9)
M['lawnP'] = material('palenqueLawn', '#6ea443', 0.85, vary='#7cb24e', vary_scale=12, bump=0.3, bump_scale=200)
M['forestFloorP'] = material('palenqueForestFloor', '#3f6e2f', 0.9, vary='#4a7a36', vary_scale=14)
M['jungleP'] = material('palenqueJungle', '#2e6f2f', 0.85, vary='#3d8139', vary_scale=14, bump=0.3, bump_scale=90)
M['jungleL'] = material('palenqueJungleLight', '#4f9338', 0.85, vary='#5ea142', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.022               # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The plaza level, the forested hill rising behind the temple and the palace."""
    hill = 26.0 * smooth((y - 24.0 - 5.0 * math.sin(x / 23.0)) / 36.0)
    return hill


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.12)
    return ground(x / S, y / S) * S * rim


land = terrain('plaza', H, [M['lawnP'], M['forestFloorP']], lambda z, nz, x, y: 0 if z < 0.02 else 1, rings=140, segs=360)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def frustum(name, mat, x0, x1, y0, y1, z0, z1, inset):
    """A battered block: its top `inset` metres in from its foot all round."""
    bm = bmesh.new()
    lo = [bm.verts.new(P(x, y, z0)) for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
    hi = [bm.verts.new(P(x, y, z1)) for x, y in ((x0 + inset, y0 + inset), (x1 - inset, y0 + inset), (x1 - inset, y1 - inset), (x0 + inset, y1 - inset))]
    add_prism(bm, lo, hi)
    return finish(name, bm, mat, smooth_sides=False)


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def stair(name, mat, xc, w, y_foot, z_foot, run, rise, n):
    """A stair of n steps climbing towards +y: its side profile extruded across its width."""
    prof = [(y_foot, z_foot)]
    for k in range(n):
        y = y_foot + run * k
        prof += [(y, z_foot + rise * (k + 1)), (y + run, z_foot + rise * (k + 1))]
    prof += [(y_foot + run * n, z_foot)]
    bm = bmesh.new()
    left = [bm.verts.new(P(xc - w / 2, y, z)) for y, z in prof]
    right = [bm.verts.new(P(xc + w / 2, y, z)) for y, z in prof]
    add_prism(bm, left, right)
    return finish(name, bm, mat, smooth_sides=False)


def gallery(name, x0, x1, y0, y1, z0, wall, doors, face):
    """A palace gallery: walls pierced by doorways on its `face` side ((0, -1) the front), and the
    sloping upper walls (the Maya mansard roof) over them."""
    block(name, M['lime'], x0, x1, y0, y1, z0, z0 + wall)
    frustum(name + 'Roof', M['roofStone'], x0 - 0.4, x1 + 0.4, y0 - 0.4, y1 + 0.4, z0 + wall, z0 + wall + 3.2, min(x1 - x0, y1 - y0) * 0.32)
    block(name + 'Cap', M['limeDark'], x0 + min(x1 - x0, y1 - y0) * 0.32, x1 - min(x1 - x0, y1 - y0) * 0.32, y0 + min(x1 - x0, y1 - y0) * 0.32, y1 - min(x1 - x0, y1 - y0) * 0.32, z0 + wall + 3.2, z0 + wall + 3.6, bevel=0)
    along = x1 - x0 if face[0] == 0 else y1 - y0
    for k in range(doors):
        t = (k + 0.5) / doors
        if face[0] == 0:
            c = P(x0 + t * along, y0 - 0.05 if face[1] < 0 else y1 + 0.05, 0)
        else:
            c = P(x0 - 0.05 if face[0] < 0 else x1 + 0.05, y0 + t * along, 0)
        DOORS.append((c.x, c.y, Z0 + (z0 + 0.2) * S, 2.2 * S, wall * 0.72 * S, face, 'rect'))


DOORS = []
# ------------------------------------------------------------------ the Temple of the Inscriptions: nine tiers, the stair, the temple on top
TX0, TX1, TY0, TY1 = 2.0, 52.0, -24.0, 20.0
TIER = 2.7
for k in range(9):
    i = 2.0 * k
    frustum(f'tier{k}', M['lime'] if k % 2 == 0 else M['limeDark'], TX0 + i, TX1 - i, TY0 + i, TY1 - i * 0.3, k * TIER, (k + 1) * TIER, 0.45)
TOP = 9 * TIER
TXC = (TX0 + TX1) / 2
stair('stair', M['lime'], TXC, 11.0, TY0 - 1.0, 0.0, 19.0 / 34.0, TOP / 34.0, 34)
for s in (-1, 1):
    bm = bmesh.new()
    a = [bm.verts.new(P(TXC + s * 5.5, y, z)) for y, z in ((TY0 - 1.0, 0.0), (TY0 - 1.0, 1.2), (TY0 + 18.0, TOP + 1.2), (TY0 + 18.0, TOP))]
    b = [bm.verts.new(P(TXC + s * 6.6, y, z)) for y, z in ((TY0 - 1.0, 0.0), (TY0 - 1.0, 1.2), (TY0 + 18.0, TOP + 1.2), (TY0 + 18.0, TOP))]
    add_prism(bm, a, b)
    finish(f'balustrade{s}', bm, M['limeDark'], smooth_sides=False)
# the temple: walls and five doorways between six piers on the front, the sloping roof
WX0, WX1, WY0, WY1 = TXC - 11.5, TXC + 11.5, TY0 + 19.0, TY0 + 28.0
block('templeFloor', M['limeDark'], WX0 - 1.0, WX1 + 1.0, WY0 - 1.0, WY1 + 1.0, TOP, TOP + 0.6)
block('templeWalls', M['lime'], WX0, WX1, WY0, WY1, TOP + 0.6, TOP + 6.6)
for k in range(5):
    x = WX0 + 23.0 * (k + 0.5) / 5
    c = P(x, WY0 - 0.05, 0)
    DOORS.append((c.x, c.y, Z0 + (TOP + 0.6) * S, 2.6 * S, 4.0 * S, (0, -1), 'rect'))
frustum('templeRoof', M['roofStone'], WX0 - 0.5, WX1 + 0.5, WY0 - 0.5, WY1 + 0.5, TOP + 6.6, TOP + 10.2, 3.4)
block('templeRoofCap', M['limeDark'], WX0 + 2.9, WX1 - 2.9, WY0 + 2.9, WY1 - 2.9, TOP + 10.2, TOP + 10.7, bevel=0)
for k in range(6):
    x = WX0 + 23.0 * k / 5
    block(f'pier{k}', M['limeDark'], max(WX0, x - 0.9), min(WX1, x + 0.9), WY0 - 0.35, WY0, TOP + 0.6, TOP + 6.6, bevel=0)

# ------------------------------------------------------------------ the Palace: its platform and stair, the galleries round it, the tower
PX0, PX1, PY0, PY1 = -54.0, -6.0, -28.0, 22.0
PH = 8.0
frustum('palacePlatform', M['limeDark'], PX0, PX1, PY0, PY1, 0.0, PH, 1.4)
frustum('palaceTerrace', M['lime'], PX0 + 1.2, PX1 - 1.2, PY0 + 1.2, PY1 - 1.2, PH - 0.2, PH + 0.3, 0.2)
stair('palaceStair', M['lime'], (PX0 + PX1) / 2 - 6.0, 16.0, PY0 - 7.5, 0.0, 7.5 / 14.0, PH / 14.0, 14)
GZ = PH + 0.3
gallery('houseFront', PX0 + 2.0, PX1 - 2.0, PY0 + 2.0, PY0 + 10.0, GZ, 5.0, 10, (0, -1))
gallery('houseEast', PX1 - 10.0, PX1 - 2.0, PY0 + 10.0, PY1 - 2.0, GZ, 5.0, 5, (1, 0))
gallery('houseWest', PX0 + 2.0, PX0 + 10.0, PY0 + 10.0, PY1 - 2.0, GZ, 5.0, 5, (-1, 0))
gallery('houseBack', PX0 + 10.0, PX1 - 10.0, PY1 - 10.0, PY1 - 2.0, GZ, 5.0, 6, (0, -1))
gallery('houseMiddle', PX0 + 10.0, -28.0, -4.0, 3.0, GZ, 4.6, 4, (0, -1))
# the tower: four storeys, each with its openings, a sloping cap
TWX, TWY = -21.0, 6.0
for k, (w, z0, z1) in enumerate(((8.0, GZ, GZ + 4.4), (7.2, GZ + 4.4, GZ + 8.2), (6.4, GZ + 8.2, GZ + 11.6), (5.6, GZ + 11.6, GZ + 14.6))):
    block(f'tower{k}', M['lime'], TWX - w / 2, TWX + w / 2, TWY - w / 2, TWY + w / 2, z0, z1)
    block(f'towerBand{k}', M['limeDark'], TWX - w / 2 - 0.3, TWX + w / 2 + 0.3, TWY - w / 2 - 0.3, TWY + w / 2 + 0.3, z1 - 0.5, z1, bevel=0)
    for nx, ny in ((0, -1), (1, 0), (-1, 0)):
        c = P(TWX + nx * (w / 2 + 0.05), TWY + ny * (w / 2 + 0.05), 0)
        DOORS.append((c.x, c.y, Z0 + (z0 + 0.6) * S, 1.6 * S, (z1 - z0 - 1.6) * S, (nx, ny), 'rect'))
frustum('towerCap', M['roofStone'], TWX - 3.2, TWX + 3.2, TWY - 3.2, TWY + 3.2, GZ + 14.6, GZ + 17.0, 2.2)
glazed('doorways', DOORS, M['limeDark'], glass=M['doorway'], depth=0.4 * S, bars=False)

# ------------------------------------------------------------------ the rainforest on the hills and round the plaza, people
CROWNS = []
for p in scatter_on(land, 20000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.36, seed=4):
    x, y = p.x / S, p.y / S
    behind = y > 26.0 + 5.0 * math.sin(x / 23.0)
    side = (x > 58.0 or x < -60.0) and y > -30.0
    if TX0 - 4 < x < TX1 + 4 and TY0 - 6 < y < TY1 + 2:
        continue
    if PX0 - 4 < x < PX1 + 4 and PY0 - 10 < y < PY1 + 2:
        continue
    if behind or side:
        CROWNS.append(((p.x, p.y, p.z + rng.uniform(4.0, 7.0) * S), rng.uniform(3.5, 6.0) * S, 0.85))
    if len(CROWNS) >= 420:
        break
half = len(CROWNS) // 3
blob_cloud('jungle', M['jungleP'], CROWNS[half:])
blob_cloud('jungleLight', M['jungleL'], CROWNS[:half])
for k, (x, y, shirt) in enumerate(((TXC - 3.0, TY0 - 6.0, 'red'), (TXC + 4.0, TY0 - 8.0, 'blue'), (-14.0, -40.0, 'yellow'), (-24.0, -42.0, 'green'), (TXC + 1.0, TY0 + 6.0, 'red'))):
    c = P(x, y, 0)
    z = Z0 if k != 4 else Z0 + (7.0 / 19.0 * TOP) * S
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=z, scale=0.8)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('palenque')
