# The Gateway of India in the high-quality look (hq.py), laid out in metres: Mumbai's arch on the Apollo
# Bunder waterfront, in honey-coloured basalt; the great pointed arch running through it between its side
# wings, their two storeys of smaller arches and latticed windows; the four corner turrets rising over
# the parapet to their little domes; the latticed parapet along the top; the promenade before it, the
# harbour behind with its ferries, and people.
# Run: blender -b --factory-startup -P gateway-of-india.py -- gateway-of-india-1024.png 1024 gateway-of-india.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1924)
M['basalt'] = material('gatewayBasalt', '#e2bb80', 0.8, vary='#d6ad72', vary_scale=40, bump=0.1, bump_scale=200)
M['basaltDeep'] = material('gatewayBasaltDeep', '#b38955', 0.85, vary='#a77e4b', vary_scale=40)
M['jaliG'] = chequer('gatewayJali', '#c49a62', '#5a4128', scale=300.0, rough=0.8)
M['harbour'] = material('mumbaiHarbour', '#4a7a86', 0.08, vary='#558692', vary_scale=6, bump=0.04, bump_scale=60, coat=0.8)
M['promenadeG'] = masonry('apolloBunder', '#cfc3ad', '#b2a68f', scale=120, rough=0.8, vary='#c6baa3')
M['ferry'] = material('ferryHull', '#f0ece2', 0.5)
M['ferryBand'] = material('ferryBand', '#2f6fa8', 0.5)
M['recessG'] = material('gatewayRecess', '#4e3a26', 0.85)

S = 0.046               # metres to the tile's units
FY = 4.0                # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0004):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


BEFORE = set(bpy.data.objects)
slab('harbour', M['harbour'], [(-2.0, (14.0 - FY) * S), (2.0, (14.0 - FY) * S), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0 - 0.0015, margin=0.02)
slab('promenade', M['promenadeG'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (14.0 - FY) * S), (-2.0, (14.0 - FY) * S)], Z0 - 0.003, Z0 + 0.6 * S, margin=0.02)
WIN = []
Y0, Y1 = -7.0, 7.0      # the gateway's front (land) and back (sea)

# ------------------------------------------------------------------ the middle: the great arch running through, its frame, the attic over it
AW = 5.4                # the great arch's half-width
for s in (-1, 1):
    block(f'archPier{s}', M['basalt'], *sorted((s * AW, s * (AW + 3.0))), Y0, Y1, 0.6, 21.0)
arcade_path('greatArch', M['basalt'], [(-AW * S, (Y0 - FY) * S), (AW * S, (Y0 - FY) * S)], (Y1 - Y0) * S, Z0 + 11.0 * S, 10.0 * S, AW * S, pointed=0.7)
for y in (Y0, Y1):
    side = -1 if y == Y0 else 1
    arcade_path(f'archFrame{side}', M['basaltDeep'], [(-(AW + 0.9) * S, (y + side * 0.3 - FY) * S), ((AW + 0.9) * S, (y + side * 0.3 - FY) * S)], 0.6 * S, Z0 + 11.0 * S, 7.6 * S, (AW + 0.25) * S, pointed=0.7)
block('attic', M['basalt'], -AW - 3.0, AW + 3.0, Y0, Y1, 21.0, 24.6)
block('atticBand', M['basaltDeep'], -AW - 3.2, AW + 3.2, Y0 - 0.3, Y1 + 0.3, 21.0, 21.6, bevel=0)
block('atticJali', M['jaliG'], -AW + 0.4, AW - 0.4, Y0 - 0.08, Y0 + 0.2, 22.0, 24.0, bevel=0)
block('atticCornice', M['basaltDeep'], -AW - 3.3, AW + 3.3, Y0 - 0.5, Y1 + 0.5, 24.6, 25.2, bevel=0)

# ------------------------------------------------------------------ the side wings: two storeys of arches, the parapet's lattice
for s in (-1, 1):
    x0, x1 = sorted((s * (AW + 3.0), s * (AW + 14.0)))
    block(f'wing{s}', M['basalt'], x0, x1, Y0 + 1.0, Y1 - 1.0, 0.6, 16.0)
    block(f'wingBand{s}', M['basaltDeep'], x0, x1 + 0.0, Y0 + 0.7, Y1 - 0.7, 8.0, 8.6, bevel=0)
    block(f'wingCornice{s}', M['basaltDeep'], x0 - 0.2, x1 + 0.2, Y0 + 0.5, Y1 - 0.5, 16.0, 16.6, bevel=0)
    block(f'wingJali{s}', M['jaliG'], x0 + 0.4, x1 - 0.4, Y0 + 0.9, Y0 + 1.2, 16.6, 18.2, bevel=0)
    block(f'wingParapetCap{s}', M['basaltDeep'], x0, x1, Y0 + 0.9, Y1 - 1.0, 18.2, 18.6, bevel=0)
    for xc in ((x0 + x1) / 2 - 3.0, (x0 + x1) / 2 + 3.0):
        for z, h in ((1.2, 5.6), (9.2, 5.2)):
            for y, n in ((Y0 + 0.95, (0, -1)), (Y1 - 0.95, (0, 1))):
                c = P(xc, y, 0)
                WIN.append((c.x, c.y, Z0 + z * S, 2.6 * S, h * S, n, 'pointed'))
    for z, h in ((1.2, 5.6), (9.2, 5.2)):
        c = P(s * (AW + 14.05), 0.0, 0)
        WIN.append((c.x, c.y, Z0 + z * S, 2.6 * S, h * S, (s, 0), 'pointed'))

# ------------------------------------------------------------------ the four corner turrets and their domes
for sx in (-1, 1):
    for y in (Y0 + 0.4, Y1 - 0.4):
        x = sx * (AW + 3.0)
        lathe(f'turret{sx}{y:+.0f}', M['basalt'], [(1.9 * S, 0.0), (1.9 * S, 27.0 * S)], (0, 0, 0), segs=8,
              matrix=Matrix.Translation(P(x, y, 0.6)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
        for z in (8.0, 16.0, 21.0):
            lathe(f'turretRing{sx}{y:+.0f}{z:.0f}', M['basaltDeep'], [(2.15 * S, 0.0), (2.15 * S, 0.5 * S)], (0, 0, 0), segs=8,
                  matrix=Matrix.Translation(P(x, y, z)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
        cylinder(f'turretGallery{sx}{y:+.0f}', M['basaltDeep'], 2.5 * S, 0.6 * S, P(x, y, 27.6), segs=16)
        for j in range(8):
            a = 2 * math.pi * (j + 0.5) / 8
            bar(f'turretPost{sx}{y:+.0f}{j}', M['basalt'], P(x + 1.6 * math.cos(a), y + 1.6 * math.sin(a), 28.2), P(x + 1.6 * math.cos(a), y + 1.6 * math.sin(a), 30.4), 0.35 * S)
        cylinder(f'turretEave{sx}{y:+.0f}', M['basaltDeep'], 2.4 * S, 0.4 * S, P(x, y, 30.4), segs=16)
        lathe(f'turretDome{sx}{y:+.0f}', M['basalt'], [(2.0 * S, 0.0), (2.1 * S, 0.8 * S), (1.4 * S, 2.0 * S), (0.4 * S, 2.8 * S), (0.0, 3.4 * S)], P(x, y, 30.8), segs=20, smooth=True)
        lathe(f'turretFinial{sx}{y:+.0f}', M['basaltDeep'], [(0.25 * S, 0.0), (0.35 * S, 0.3 * S), (0.0, 1.2 * S)], P(x, y, 34.2), segs=8)

# ------------------------------------------------------------------ the ferries in the harbour, people
for k, (x, y, ang) in enumerate(((-16.0, 24.0, 0.2), (14.0, 28.0, -0.3))):
    hull = [(-7.0, -1.8), (5.0, -1.8), (8.0, 0.0), (5.0, 1.8), (-7.0, 1.8)]
    pts = [(x + u * math.cos(ang) - v * math.sin(ang), y + u * math.sin(ang) + v * math.cos(ang)) for u, v in hull]
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(u, v, 1.4)) for u, v in pts], [bm.verts.new(P(u, v, -0.2)) for u, v in pts])
    finish(f'ferry{k}', bm, M['ferry'], smooth_sides=False)
    bm = bmesh.new()
    cabin = [(x + u * math.cos(ang) - v * math.sin(ang), y + u * math.sin(ang) + v * math.cos(ang)) for u, v in ((-5.0, -1.3), (3.0, -1.3), (3.0, 1.3), (-5.0, 1.3))]
    add_prism(bm, [bm.verts.new(P(u, v, 3.2)) for u, v in cabin], [bm.verts.new(P(u, v, 1.4)) for u, v in cabin])
    finish(f'ferryCabin{k}', bm, M['ferryBand'], smooth_sides=False)
glazed('windows', WIN, M['basaltDeep'], glass=M['recessG'], depth=0.4 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-2.0, -12.0, 'red'), (3.0, -15.0, 'blue'), (-10.0, -18.0, 'yellow'), (12.0, -14.0, 'green'), (0.0, 0.0, 'red'), (8.0, -20.0, 'blue'))):
    c = P(x, y, 0.6)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.2)

R = Matrix.Rotation(math.radians(-32.0 + 16.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('gateway-of-india')
