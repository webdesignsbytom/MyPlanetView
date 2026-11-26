# Tower Bridge in the high-quality look (hq.py), on the Thames: the two Gothic towers of pale stone on
# their piers, each with four corner turrets under slate caps with gilded finials, their pointed
# windows and the arches over the road; the two high walkways of pale blue steel between them; the
# bascules raised for a tall ship passing; the side spans hanging from their blue chains to the
# shore towers; the embankments with their trees, a red bus on the road, and people.
# Run: blender -b --factory-startup -P tower-bridge.py -- tower-bridge-1024.png 1024 tower-bridge.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1894)
M['portland'] = material('portland', '#d9d5ca', 0.6, vary='#c9c4b8', vary_scale=24, bump=0.15, bump_scale=150)
M['granite3'] = material('graniteGrey3', '#a8a49b', 0.7, vary='#97938a', vary_scale=24, bump=0.2, bump_scale=150)
M['steelBlue'] = material('steelBlue', '#86bfdf', 0.4, vary='#78b0d0', vary_scale=20, metallic=0.3, coat=0.2)
M['steelWhite'] = material('steelWhite', '#f2f2ee', 0.45, metallic=0.2)
M['asphalt'] = material('asphalt', '#55545a', 0.8, vary='#4b4a50', vary_scale=40, bump=0.1, bump_scale=300)
M['busRed'] = material('busRed', '#c8261e', 0.35, coat=0.5)
M['hullDark'] = material('hullDark', '#2f2b2a', 0.5)
M['sailCloth'] = material('sailCloth', '#f4efe2', 0.7, sss=0.05)
BARS = bmesh.new()
OPEN = []
TX, TW, TD = 0.38, 0.2, 0.26          # the towers, either side of the middle; their width and depth
ZD = G + 0.15                          # the road
ZW = G + 0.86                          # the walkways


def member(p0, p1, t):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(BARS, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t, t, d.length, 1)))


# ------------------------------------------------------------------ the embankments
for s in (-1, 1):
    x0 = s * 1.12
    pts = [(x0, -1.6), (s * 1.6, -1.6), (s * 1.6, 1.6), (x0, 1.6)]
    slab(f'embankment{s}', M['granite3'], pts, G - 0.004, G + 0.1, bevel=0.004, margin=0.006)
    slab(f'bank{s}', M['grass'], [(x0 + s * 0.06, -1.6), (s * 1.6, -1.6), (s * 1.6, 1.6), (x0 + s * 0.06, 1.6)], G + 0.1, G + 0.11, margin=0.008)
    for k, y in enumerate((-0.55, -0.22, 0.22, 0.55)):
        tree(f'bankTree{s}{k}', s * 1.24, y, h=0.22, r=0.085, z=G + 0.11)

# ------------------------------------------------------------------ the towers
for s in (-1, 1):
    x = s * TX
    lathe(f'pier{s}', M['granite3'], [(0.2, 0), (0.2, 0.1), (0.17, 0.12)], (x, 0, G - 0.01), segs=40, sx=0.75, sy=1.0)
    # the tower: solid below the road, the road's pointed arch right through it, solid above
    ZT = ZD + 0.2
    box(f'towerFoot{s}', M['portland'], (x, 0, (G + 0.1 + ZD) / 2), (TW, TD, ZD - G - 0.1), bevel=0.003)
    prof = [(-TD / 2, ZD - 0.005), (-0.068, ZD - 0.005)] + [(0.068 * math.cos(t), ZD + 0.1 + 0.068 * math.sin(t) + 0.035 * (1 - abs(math.cos(t)))) for t in (math.pi * (1 - k / 12) for k in range(13))] + [(0.068, ZD - 0.005), (TD / 2, ZD - 0.005), (TD / 2, ZT), (-TD / 2, ZT)]
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new((x - TW / 2, u, z)) for u, z in prof], [bm.verts.new((x + TW / 2, u, z)) for u, z in prof])
    finish(f'towerArch{s}', bm, M['portland'], bevel=0.002, smooth_sides=False)
    box(f'tower{s}', M['portland'], (x, 0, (ZT - 0.005 + ZW + 0.06) / 2), (TW, TD, ZW + 0.06 - ZT + 0.005), bevel=0.003)
    box(f'tunnelRoad{s}', M['asphalt'], (x, 0, ZD - 0.001), (TW + 0.01, 0.12, 0.006), bevel=0)
    for zz in (ZT + 0.012, ZW - 0.12, ZW + 0.06):
        box(f'towerCourse{s}{zz:.2f}', M['granite3'], (x, 0, zz), (TW + 0.012, TD + 0.012, 0.014), bevel=0.002)
    # the road's arch through the tower, and windows
    for ny in (-1, 1):
        OPEN.append((x, ny * TD / 2, ZD, 0.11, 0.16, (0, ny), 'pointed'))
        for u in (-0.05, 0.05):
            for zz in (ZD + 0.22, ZD + 0.36, ZD + 0.5):
                OPEN.append((x + u, ny * TD / 2, zz, 0.032, 0.09, (0, ny), 'pointed'))
    for nx in (-1, 1):
        for zz in (ZD + 0.3, ZD + 0.48):
            OPEN.append((x + nx * TW / 2, 0, zz, 0.04, 0.1, (nx, 0), 'pointed'))
    # the turrets, the pavilion roof and its spirelet
    for sx in (-1, 1):
        for sy in (-1, 1):
            tx_, ty_ = x + sx * TW / 2, sy * TD / 2
            lathe(f'turret{s}{sx}{sy}', M['portland'], [(0.032, 0), (0.032, ZW + 0.12 - G - 0.1)], (tx_, ty_, G + 0.1), segs=8)
            lathe(f'turretBand{s}{sx}{sy}', M['granite3'], [(0.036, 0), (0.036, 0.014)], (tx_, ty_, ZW + 0.1), segs=8)
            spire(f'turretCap{s}{sx}{sy}', M['slate'], tx_, ty_, ZW + 0.12, 0.034, 0.14)
    lathe(f'towerRoof{s}', M['slate'], [(TW / 2 * math.sqrt(2), 0), (TW / 2 * 0.8 * math.sqrt(2), 0.05), (0.03, 0.2), (0.0, 0.22)], (0, 0, 0), segs=4,
          matrix=Matrix.Translation((x, 0, ZW + 0.07)) @ Matrix.Rotation(math.pi / 4, 4, 'Z') @ Matrix.Diagonal((1.0, TD / TW, 1.0, 1)))
    lathe(f'towerFinial{s}', M['gold'], [(0.0, 0), (0.01, 0.02), (0.004, 0.06), (0.0, 0.08)], (x, 0, ZW + 0.28), segs=10, smooth=True)

# ------------------------------------------------------------------ the high walkways
for wy in (-0.08, 0.08):
    x0, x1 = -TX + TW / 2, TX - TW / 2
    for zz in (ZW - 0.06, ZW + 0.03):
        member((x0, wy, zz), (x1, wy, zz), 0.016)
    n = 12
    for j in range(n):
        xa = x0 + (x1 - x0) * j / n
        xb = x0 + (x1 - x0) * (j + 1) / n
        member((xa, wy, ZW - 0.06), (xb, wy, ZW + 0.03), 0.006)
        member((xa, wy, ZW - 0.06), (xa, wy, ZW + 0.03), 0.006)
    box(f'walkwayDeck{wy}', M['steelBlue'], (0, wy, ZW - 0.06), (x1 - x0, 0.05, 0.01))
    box(f'walkwayRoof{wy}', M['steelBlue'], (0, wy, ZW + 0.035), (x1 - x0, 0.05, 0.008))

# ------------------------------------------------------------------ the bascules, raised
for s in (-1, 1):
    hinge = Vector((s * (TX - TW / 2), 0, ZD))
    ang = math.radians(62)
    m = Matrix.Translation(hinge) @ Matrix.Rotation(s * ang, 4, 'Y')
    box_m(f'bascule{s}', M['steelBlue'], m @ Matrix.Translation((-s * 0.14, 0, -0.012)), (0.28, 0.16, 0.024), bevel=0.003)
    box_m(f'basculeRoad{s}', M['asphalt'], m @ Matrix.Translation((-s * 0.14, 0, 0.002)), (0.27, 0.12, 0.004))
    for wy in (-0.075, 0.075):
        box_m(f'basculeRail{s}{wy}', M['steelWhite'], m @ Matrix.Translation((-s * 0.14, wy, 0.012)), (0.27, 0.006, 0.02))

# ------------------------------------------------------------------ the side spans, their chains and the shore towers
for s in (-1, 1):
    xa, xb = s * (TX + TW / 2), s * 1.1
    box(f'sideDeck{s}', M['steelBlue'], ((xa + xb) / 2, 0, ZD - 0.016), (abs(xb - xa), 0.17, 0.03))
    box(f'sideRoad{s}', M['asphalt'], ((xa + xb) / 2, 0, ZD + 0.001), (abs(xb - xa), 0.12, 0.004))
    box(f'shoreTower{s}', M['portland'], (s * 1.08, 0, G + 0.16), (0.08, 0.2, 0.22), bevel=0.003)
    for sx in (-1, 1):
        spire(f'shoreCap{s}{sx}', M['slate'], s * 1.08, sx * 0.08, G + 0.27, 0.025, 0.08)
    for wy in (-0.09, 0.09):
        pts = []
        for j in range(25):
            f = j / 24
            x = xa + (xb - xa) * f
            z = (ZW - 0.12) + (G + 0.3 - (ZW - 0.12)) * f - 0.42 * math.sin(math.pi * f) * (1 - f) ** 0.2
            z = max(z, ZD + 0.04)
            pts.append((x, wy, z))
        tube(f'chain{s}{wy}', M['steelBlue'], pts, 0.013)
        for p in pts[2:-2:2]:
            member((p[0], wy, p[2]), (p[0], wy, ZD), 0.004)
    for wy in (-0.085, 0.085):
        box(f'sideRail{s}{wy}', M['steelWhite'], ((xa + xb) / 2, wy, ZD + 0.012), (abs(xb - xa), 0.006, 0.02))

# ------------------------------------------------------------------ a red bus, a tall ship, people
m = Matrix.Translation((0.78, -0.03, ZD + 0.004))
box_m('bus', M['busRed'], m @ Matrix.Translation((0, 0, 0.034)), (0.12, 0.032, 0.06), bevel=0.005)
for s in (-1, 1):
    box_m(f'busWindows{s}', M['glass'], m @ Matrix.Translation((0, s * 0.0162, 0.045)), (0.11, 0.002, 0.03))
SX, SY = -0.02, 0.62
bm = bmesh.new()
hull = [(-0.2, -0.04), (0.16, -0.045), (0.24, 0.0), (0.16, 0.045), (-0.2, 0.04)]
add_prism(bm, [bm.verts.new((SX + u, SY + v, G - 0.005)) for u, v in hull], [bm.verts.new((SX + u * 1.04, SY + v * 1.1, G + 0.05)) for u, v in hull])
finish('shipHull', bm, M['hullDark'], bevel=0.004, smooth_sides=False)
box('shipDeck', M['wood'], (SX, SY, G + 0.052), (0.38, 0.08, 0.006))
for k, (mx, mh) in enumerate(((-0.11, 0.42), (0.0, 0.5), (0.1, 0.44))):
    cylinder(f'mast{k}', M['wood'], 0.004, mh, (SX + mx, SY, G + 0.05), segs=8)
    for j in range(3):
        zz = G + 0.12 + j * mh * 0.26
        w = 0.1 - j * 0.02
        box(f'sail{k}{j}', M['sailCloth'], (SX + mx, SY, zz + 0.04), (0.006, w * 1.2, 0.08), bevel=0.003)
for k, (x, y, shirt) in enumerate(((-0.95, -0.05, 'red'), (-0.8, 0.05, 'blue'), (0.95, 0.04, 'yellow'), (-1.3, -0.5, 'green'), (1.3, 0.5, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=ZD + 0.004 if abs(x) < 1.12 else G + 0.11)

glazed('openings', OPEN, M['granite3'], depth=0.008)
finish('steelwork', BARS, M['steelBlue'], smooth_sides=False)
render('tower-bridge')
