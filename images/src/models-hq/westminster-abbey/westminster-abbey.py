# Westminster Abbey in the high-quality look (hq.py), drawn to its real proportions (laid out in metres)
# and seen from the north-west: the west front's twin towers with their corner turrets and pinnacles,
# the clock, the great west window and door; the long nave and its aisles with their tall pointed
# windows, the flying buttresses along the north side, the lead roofs; the north transept's front with
# its great rose window, its turrets and portals; the low lantern over the crossing; the choir's east
# end; Henry VII's Lady Chapel bristling with domed turrets; the green round it, and people.
# Run: blender -b --factory-startup -P westminster-abbey.py -- westminster-abbey-1024.png 1024 westminster-abbey.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1245)
M['abbey'] = material('abbeyStone', '#d6cbb2', 0.65, vary='#c8bca2', vary_scale=22, bump=0.15, bump_scale=150)
M['abbeyShade'] = material('abbeyShade', '#bfb398', 0.7, vary='#b0a489', vary_scale=22, bump=0.15, bump_scale=150)
M['leadA'] = banded(material('leadA', '#8a939a', 0.45, vary='#7f888f', vary_scale=14, metallic=0.4), 'X', 60.0, strength=0.15)
M['clockFace'] = material('clockFace', '#f2efe6', 0.4)

S = 0.0158              # metres to the tile's units
Z0 = G + 0.006
OPEN, DOORS = [], []
BARS = bmesh.new()


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def member(p0, p1, t):
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(BARS, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t * S, t * S, d.length, 1)))


def pinnacle(name, x, y, z, r, h, mat=None):
    """A Gothic pinnacle: an octagonal shaft and a crocketed spirelet (metres)."""
    mat = M['abbey'] if mat is None else mat
    lathe(name, mat, [(r * S, 0), (r * S, h * 0.4 * S), (r * 1.15 * S, h * 0.42 * S), (r * 0.9 * S, h * 0.45 * S), (r * 0.15 * S, h * S), (0.0, h * 1.03 * S)], P(x, y, z), segs=8)


def tower(name, x, y, w, h):
    """A west tower: a square shaft, octagonal corner turrets with pinnacles, belfry windows, battlements."""
    box(name, M['abbey'], P(x, y, h / 2), (w * S, w * S, h * S), bevel=0.002)
    for sx in (-1, 1):
        for sy in (-1, 1):
            tx, ty = x + sx * w / 2, y + sy * w / 2
            # flat clasping buttresses up the lower stages, octagonal turrets only from the belfry stage up
            box(name + f'Buttress{sx}{sy}', M['abbeyShade'], P(tx - sx * 0.6, ty - sy * 0.6, (h - 20) / 2), (2.6 * S, 2.6 * S, (h - 20) * S), bevel=0.001)
            lathe(name + f'Turret{sx}{sy}', M['abbey'], [(1.7 * S, 0), (1.7 * S, 23.0 * S)], P(tx - sx * 0.6, ty - sy * 0.6, h - 20), segs=8)
            pinnacle(name + f'Pinnacle{sx}{sy}', tx - sx * 0.6, ty - sy * 0.6, h + 3, 1.7, 8.0)
    for nx, ny in ((0, -1), (-1, 0), (1, 0), (0, 1)):
        for u in (-2.6, 2.6):
            OPEN.append(((x + nx * (w / 2 + 0.1) - ny * u) * S, (y + ny * (w / 2 + 0.1) + nx * u) * S, Z0 + (h - 16) * S, 2.6 * S, 10 * S, (nx, ny), 'pointed'))
    for k in range(9):          # battlements
        u = -w / 2 + w * (k + 0.5) / 9
        for nx, ny in ((0, -1), (0, 1)):
            box(f'{name}Merlon{k}{ny}', M['abbey'], P(x + u, y + ny * (w / 2 - 0.5), h + 0.8), (1.1 * S, 1.0 * S, 1.6 * S), bevel=0)


# ------------------------------------------------------------------ the green and the sanctuary's paving
slab('green', M['lawn'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.04)
slab('sanctuary', M['paving'], [(-2, -2), (-56 * S, -2), (-56 * S, 2), (-2, 2)], Z0 - 0.002, Z0 + 0.003, margin=0.04)
slab('northPath', M['paving'], rect(14 * S, -36 * S, 1.0, 9 * S), Z0 - 0.002, Z0 + 0.003, margin=0.05)

# ------------------------------------------------------------------ the nave, its aisles and clerestory, its roofs
X0, X1 = -48.0, 30.0        # the nave's west and east ends (the crossing at x 18)
NW, NH = 12.0, 31.0          # the nave's width and height to the eaves
AW, AH = 9.0, 17.0           # each aisle's width and height
box('nave', M['abbey'], P((X0 + X1) / 2, 0, NH / 2), ((X1 - X0) * S, NW * S, NH * S), bevel=0.002)
gable_roof('naveRoof', M['leadA'], X0 * S, X1 * S, -NW / 2 * S, NW / 2 * S, Z0 + NH * S, 8.0 * S, over=0.003)
for sy in (-1, 1):
    box(f'aisle{sy}', M['abbey'], P((X0 + X1) / 2, sy * (NW / 2 + AW / 2), AH / 2), ((X1 - X0) * S, AW * S, AH * S), bevel=0.002)
    bm = bmesh.new()
    pts = [(X0, sy * NW / 2, AH + 4.0), (X1, sy * NW / 2, AH + 4.0), (X1, sy * (NW / 2 + AW + 0.5), AH), (X0, sy * (NW / 2 + AW + 0.5), AH)]
    add_prism(bm, [bm.verts.new(P(*p)) for p in pts], [bm.verts.new(P(p[0], p[1], p[2] + 0.6)) for p in pts])
    finish(f'aisleRoof{sy}', bm, M['leadA'], smooth_sides=False)
# the bays: clerestory and aisle windows, buttresses, and the flying buttresses on the north side
BAYS = [X0 + 4.5 + 6.3 * k for k in range(12)]
for k, x in enumerate(BAYS):
    for sy in (-1, 1):
        OPEN.append((x * S, sy * (NW / 2 + 0.1) * S, Z0 + (AH + 4.5) * S, 3.0 * S, 8.5 * S, (0, sy), 'pointed'))
        OPEN.append((x * S, sy * (NW / 2 + AW + 0.1) * S, Z0 + 3.5 * S, 3.2 * S, 10.0 * S, (0, sy), 'pointed'))
        bx = x + 3.15
        if bx < X1:
            box(f'buttress{k}{sy}', M['abbeyShade'], P(bx, sy * (NW / 2 + AW + 1.4), (AH + 6) / 2), (1.6 * S, 3.0 * S, (AH + 6) * S), bevel=0.001)
            pinnacle(f'buttressPinnacle{k}{sy}', bx, sy * (NW / 2 + AW + 1.4), AH + 6, 0.9, 5.0)
            member(P(bx, sy * (NW / 2 + AW + 0.6), AH + 4.0), P(bx, sy * (NW / 2 + 0.3), NH - 3.0), 1.2)
            member(P(bx, sy * (NW / 2 + AW + 0.6), AH - 1.0), P(bx, sy * (NW / 2 + 0.3), AH + 6.0), 1.0)

# ------------------------------------------------------------------ the west front and its towers
TW = 10.0
for sy in (-1, 1):
    tower(f'westTower{sy}', X0 - TW / 2 + 1.0, sy * (NW / 2 + AW / 2 - 0.5), TW, 58.0)
box('westCentre', M['abbey'], P(X0 - 2.0, 0, (NH + 4) / 2), (5.0 * S, NW * S, (NH + 4) * S), bevel=0.002)
bm = bmesh.new()
tri = [(-NW / 2, NH + 4), (NW / 2, NH + 4), (0, NH + 12)]
add_prism(bm, [bm.verts.new(P(X0 - 4.4, u, z)) for u, z in tri], [bm.verts.new(P(X0, u, z)) for u, z in tri])
finish('westGable', bm, M['abbey'], smooth_sides=False)
OPEN.append(((X0 - 4.6) * S, 0.0, Z0 + 14.0 * S, 7.0 * S, 15.0 * S, (-1, 0), 'pointed'))
DOORS.append(((X0 - 4.6) * S, 0.0, Z0, 4.0 * S, 7.5 * S, (-1, 0), 'pointed'))
cylinder('clock', M['clockFace'], 1.8 * S, 0.3 * S, (0, 0, 0), segs=24, matrix=Matrix.Translation(P(X0 - TW + 0.85, -(NW / 2 + AW / 2 - 0.5), 34.0)) @ Matrix.Rotation(-math.pi / 2, 4, 'Y'))

# ------------------------------------------------------------------ the north transept's front: rose window, turrets, portals
TX0, TX1, TY = 6.0, 30.0, -34.0       # its width along the nave, and how far north its front stands
box('transept', M['abbey'], P((TX0 + TX1) / 2, (TY + NW / 2) / 2, NH / 2), ((TX1 - TX0) * S, (NW / 2 - TY) * S, NH * S), bevel=0.002)
gable_roof('transeptRoof', M['leadA'], TX0 * S, TX1 * S, TY * S, 0.0, Z0 + NH * S, 8.0 * S, over=0.003, along='y')
bm = bmesh.new()
tri = [(TX0, NH), (TX1, NH), ((TX0 + TX1) / 2, NH + 9.0)]
add_prism(bm, [bm.verts.new(P(u, TY - 0.6, z)) for u, z in tri], [bm.verts.new(P(u, TY + 1.0, z)) for u, z in tri])
finish('transeptGable', bm, M['abbey'], smooth_sides=False)
TC = (TX0 + TX1) / 2
for sx in (-1, 1):
    tx = TC + sx * (TX1 - TX0) / 2
    lathe(f'transeptTurret{sx}', M['abbey'], [(2.4 * S, 0), (2.4 * S, (NH + 8) * S)], P(tx, TY, 0), segs=8)
    pinnacle(f'transeptPinnacle{sx}', tx, TY, NH + 8, 2.4, 10.0)
# the rose window: a round of glass under its stone tracery
RZ, RR = 21.0, 5.6
m_rose = Matrix.Translation(P(TC, TY - 0.7, RZ)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
cylinder('rose', M['window'], RR * S, 0.4 * S, (0, 0, -0.2 * S), segs=48, matrix=m_rose)
annulus('roseRing', M['abbey'], (RR + 0.6) * S, RR * S, -0.4 * S, 0.5 * S, segs=48, matrix=m_rose)
annulus('roseInner', M['abbey'], 1.5 * S, 1.0 * S, -0.4 * S, 0.5 * S, segs=24, matrix=m_rose)
for k in range(16):
    a = 2 * math.pi * k / 16
    member(m_rose @ Vector((1.2 * S * math.cos(a), 1.2 * S * math.sin(a), 0.2 * S)), m_rose @ Vector((RR * S * math.cos(a), RR * S * math.sin(a), 0.2 * S)), 0.3)
for u in (-6.0, 0.0, 6.0):          # the three portals
    DOORS.append(((TC + u) * S, (TY - 0.7) * S, Z0, 3.6 * S if u else 4.2 * S, 7.0 * S if u else 8.5 * S, (0, -1), 'pointed'))
for u in (-7.5, -2.5, 2.5, 7.5):    # the lancets under the rose
    OPEN.append(((TC + u) * S, (TY - 0.7) * S, Z0 + 10.0 * S, 2.0 * S, 4.5 * S, (0, -1), 'pointed'))

# ------------------------------------------------------------------ the lantern over the crossing
box('lantern', M['abbey'], P(18.0, 0, NH + 5.0), (13 * S, 13 * S, 10 * S), bevel=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        pinnacle(f'lanternPinnacle{sx}{sy}', 18 + sx * 6.5, sy * 6.5, NH + 10, 1.2, 6.0)
for nx, ny in ((0, -1), (-1, 0), (1, 0)):
    for u in (-3.0, 3.0):
        OPEN.append(((18 + nx * 6.6 - ny * u) * S, (ny * 6.6 + nx * u) * S, Z0 + (NH + 1.5) * S, 2.0 * S, 6.0 * S, (nx, ny), 'pointed'))

# ------------------------------------------------------------------ the choir's east end and Henry VII's Lady Chapel
lathe('apse', M['abbey'], [(r * S, z * S) for r, z in ((NW / 2 + AW, 0), (NW / 2 + AW, AH), (NW / 2 + 1, AH + 2), (NW / 2, AH + 3), (NW / 2, NH))], P(X1 + 6, 0, 0), segs=10)
lathe('apseRoof', M['leadA'], [(r * S, z * S) for r, z in ((NW / 2 + 0.5, 0), (0.0, 8.0))], P(X1 + 6, 0, NH), segs=10)
LX0, LX1, LW, LH = X1 + 14, X1 + 46, 22.0, 26.0
box('ladyChapel', M['abbey'], P((LX0 + LX1) / 2, 0, LH / 2), ((LX1 - LX0) * S, LW * S, LH * S), bevel=0.002)
gable_roof('ladyChapelRoof', M['leadA'], LX0 * S, LX1 * S, -LW / 2 * S, LW / 2 * S, Z0 + LH * S, 5.0 * S, over=0.003)
for k in range(6):
    x = LX0 + 2.5 + (LX1 - LX0 - 5) * k / 5
    for sy in (-1, 1):
        lathe(f'lcTurret{k}{sy}', M['abbey'], [(1.6 * S, 0), (1.6 * S, (LH + 4) * S)], P(x, sy * (LW / 2 + 0.6), 0), segs=8)
        lathe(f'lcCupola{k}{sy}', M['leadA'], [(r * S, z * S) for r, z in ((1.9, 0), (1.7, 1.2), (1.0, 2.4), (0.0, 3.2))], P(x, sy * (LW / 2 + 0.6), LH + 4), segs=12, smooth=True)
        if k < 5:
            OPEN.append(((x + 2.9) * S, sy * (LW / 2 + 0.1) * S, Z0 + 5.0 * S, 4.0 * S, 14.0 * S, (0, sy), 'pointed'))
finish('flyingButtresses', BARS, M['abbeyShade'], smooth_sides=False)

for k, (x, y, shirt) in enumerate(((-0.95, -0.4, 'red'), (-1.05, -0.1, 'blue'), (-0.85, 0.3, 'yellow'), (0.15, -0.75, 'green'), (0.3, -0.85, 'red'), (-0.2, -0.95, 'blue'), (0.6, -0.6, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0 + 0.003)
for k, (x, y) in enumerate(((-0.4, -0.95), (0.75, -0.95), (1.05, -0.6), (-0.6, 0.9), (0.4, 1.05), (1.1, 0.6))):
    tree(f'tree{k}', x, y, h=0.16, r=0.06, z=Z0)

glazed('windows', OPEN, M['abbeyShade'], depth=0.4 * S, bars=False)
glazed('doors', DOORS, M['abbeyShade'], glass=M['door'], depth=0.4 * S)
render('westminster-abbey')
