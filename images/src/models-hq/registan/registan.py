# The Registan in the high-quality look (hq.py), laid out in metres: Samarkand's square framed by its three
# madrasas, Ulugh Beg's on the west, Sher-Dor's on the east and Tilya-Kori's on the north; each with its
# great portal, the pointed arch deep in it framed in bands of blue and turquoise tilework, its facade's
# two storeys of tiled niches, the minarets at its corners; Sher-Dor's two fluted turquoise domes and
# Tilya-Kori's dome; the paved square before them, and people.
# Run: blender -b --factory-startup -P registan.py -- registan-1024.png 1024 registan.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='paving')
rng = random.Random(1420)
M['brickR'] = material('registanBrick', '#cda97a', 0.85, vary='#c29d6e', vary_scale=40, bump=0.1, bump_scale=200)
M['tile'] = mosaic('registanTile', [(5, '#2a5fae'), (4, '#2f9fc6'), (1, '#f0e4c4'), (1, '#e2b23e'), (2, '#1d3c80')], scale=60, mortar='#d9cfb4', rough=0.35)
M['tileBand'] = mosaic('registanBand', [(3, '#2f9fc6'), (3, '#2a5fae'), (1, '#f0e4c4')], scale=90, mortar='#e8dcc0', rough=0.35)
M['turquoise'] = material('registanDome', '#3ab0c4', 0.35, vary='#45bccf', vary_scale=40)
M['recessR'] = material('registanRecess', '#203d6a', 0.6)
M['squareR'] = masonry('registanSquare', '#cbb894', '#ad9a76', scale=90, rough=0.85, vary='#c2ae89')

S = 0.0215              # metres to the tile's units
FY = 6.0
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


WIN = []


def madrasa(name, ox, oy, ang, width=50.0, portal_h=30.0, minarets=True, domes=()):
    """A madrasa whose facade faces the direction ang (radians) from (ox, oy): its tiled portal with the
    pointed arch, the facade's two storeys of niches, its corner minarets and domes behind."""
    fx, fy = math.cos(ang), math.sin(ang)          # facing out of the facade
    tx, ty = -fy, fx                                # along the facade

    def L(u, v, z):
        return P(ox + tx * u + fx * v, oy + ty * u + fy * v, z)

    rot = ang + math.pi / 2
    box(f'{name}Body', M['brickR'], L(0.0, -10.0, 8.0), (width * S, 20.0 * S, 16.0 * S), rot_z=rot, bevel=0)
    box(f'{name}Frieze', M['tileBand'], L(0.0, 0.05, 14.6), (width * S, 0.3 * S, 1.6 * S), rot_z=rot, bevel=0)
    for row, (z, h) in enumerate(((1.0, 5.6), (8.0, 5.2))):
        n = 6
        for k in range(n):
            for side in (-1, 1):
                u = side * (portal_h * 0.33 + 2.6 + k * 2.9)
                if abs(u) > width / 2 - 3.2:
                    continue
                c = L(u, 0.05, 0)
                WIN.append((c.x, c.y, Z0 + z * S, 2.2 * S, h * S, (fx, fy), 'pointed'))
    # the portal: a tall tiled block, its arch's frame, the deep recess
    PW = portal_h * 0.62
    box(f'{name}Portal', M['tile'], L(0.0, 1.0, portal_h / 2), (PW * S, 4.0 * S, portal_h * S), rot_z=rot, bevel=0)
    box(f'{name}PortalTop', M['tileBand'], L(0.0, 1.2, portal_h - 0.8), ((PW + 0.4) * S, 4.4 * S, 1.6 * S), rot_z=rot, bevel=0)
    c = L(0.0, 3.05, 0)
    WIN.append((c.x, c.y, Z0 + 0.0, PW * 0.56 * S, portal_h * 0.74 * S, (fx, fy), 'pointed'))
    for side in (-1, 1):
        box(f'{name}PortalEdge{side}', M['tileBand'], L(side * PW * 0.36, 3.1, portal_h * 0.4), (0.8 * S, 0.3 * S, portal_h * 0.8 * S), rot_z=rot, bevel=0)
    if minarets:
        for side in (-1, 1):
            m = L(side * (width / 2 + 1.0), 0.5, 0.0)
            cylinder(f'{name}Minaret{side}', M['brickR'], 2.4 * S, 31.0 * S, (m.x, m.y, m.z), segs=24, r2=2.0 * S)
            for z in (6.0, 14.0, 22.0, 29.0):
                cylinder(f'{name}MinaretBand{side}{z:.0f}', M['tile'], 2.45 * S - (z / 31.0) * 0.4 * S, 2.4 * S, (m.x, m.y, Z0 + z * S), segs=24)
            lathe(f'{name}MinaretCap{side}', M['tileBand'], [(2.6 * S, 0.0), (2.6 * S, 0.8 * S), (1.6 * S, 1.6 * S), (0.0, 2.2 * S)], (m.x, m.y, Z0 + 31.0 * S), segs=24)
    for k, (u, v, r, drum) in enumerate(domes):
        c = L(u, v, 0.0)
        cylinder(f'{name}Drum{k}', M['tile'], r * S, drum * S, (c.x, c.y, Z0 + 16.0 * S), segs=32)
        rings = []
        for i in range(13):
            t = i / 12
            rr = r * 1.12 * (math.sin(math.pi * (0.15 + 0.85 * t)) ** 0.8 if t < 0.95 else 0.0) + 0.001
            zz = 16.0 + drum + r * 1.6 * t
            ring = []
            for q in range(48):
                a = 2 * math.pi * q / 48
                rib = 1.0 + 0.05 * abs(math.cos(8 * a))
                ring.append((c.x + rr * rib * math.cos(a) * S, c.y + rr * rib * math.sin(a) * S, Z0 + zz * S))
            rings.append(ring)
        loft(f'{name}Dome{k}', M['turquoise'], rings, smooth=True)


BEFORE = set(bpy.data.objects)
slab('square', M['squareR'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
SPLAY = math.radians(20.0)      # the side madrasas turned a little towards the viewer, so their portals show
madrasa('ulughBeg', -36.0, 0.0, -SPLAY, width=48.0, portal_h=32.0)
madrasa('sherDor', 36.0, 0.0, math.pi + SPLAY, width=48.0, portal_h=32.0, domes=((14.0, -14.0, 5.0, 4.0), (-14.0, -14.0, 5.0, 4.0)))
madrasa('tilyaKori', 0.0, 34.0, -math.pi / 2, width=56.0, portal_h=26.0, minarets=False, domes=((-14.0, -10.0, 6.0, 5.0),))
glazed('niches', WIN, M['tileBand'], glass=M['recessR'], depth=0.5 * S, bars=False)
for k, (x, y, shirt) in enumerate(((-4.0, -12.0, 'red'), (3.0, -16.0, 'blue'), (-12.0, 4.0, 'yellow'), (10.0, 8.0, 'green'), (0.0, -28.0, 'red'), (16.0, -24.0, 'blue'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 2.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('registan')
