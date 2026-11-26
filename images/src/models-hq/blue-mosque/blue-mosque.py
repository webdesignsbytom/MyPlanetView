# The Blue Mosque (Sultan Ahmed Mosque) in the high-quality look (hq.py): Istanbul's cascade of lead
# domes, the great central dome on its drum of windows, its four half-domes and the smaller half-domes
# stepping down from them, the corner domes and the turrets on the great piers, the grey stone walls
# with their rows of arched windows, the six minarets (four with three balconies, two with two) with
# their lead caps and gilded crescents; the forecourt to the west, its arcade under a ring of thirty
# little domes, the domed fountain in its middle, the great portal; the garden round it, and people.
# Run: blender -b --factory-startup -P blue-mosque.py -- blue-mosque-1024.png 1024 blue-mosque.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1616)
M['mosqueStone'] = material('mosqueStone', '#dcd8cf', 0.6, vary='#cfcabf', vary_scale=22, bump=0.15, bump_scale=150)
M['mosqueShade'] = material('mosqueShade', '#c8c3b7', 0.65, vary='#bab4a7', vary_scale=22, bump=0.15, bump_scale=150)
M['leadM'] = banded(material('leadM', '#8d969c', 0.45, vary='#818a90', vary_scale=14, metallic=0.4), 'Z', 34.0, strength=0.15)
M['minaret'] = material('minaretStone', '#ece8df', 0.55, vary='#dfdad0', vary_scale=20, bump=0.08, bump_scale=150)
OPEN, ARCADE = [], []
M['arcadeShade'] = material('arcadeShade', '#9a948a', 0.8)
HX, HY = 0.32, 0.06       # the prayer hall's middle
CXC = -0.46               # the forecourt's middle
Z0 = G + 0.005


def half_dome(name, x, y, r, z0, h, ang, segs=16):
    """A half-dome: a quarter of a sphere's shell facing the direction `ang` (radians)."""
    bm = bmesh.new()
    rings = []
    for i in range(9):
        el = (math.pi / 2) * i / 8
        ring = []
        for k in range(segs + 1):
            az = ang - math.pi / 2 + math.pi * k / segs
            ring.append(bm.verts.new((x + r * math.cos(el) * math.cos(az), y + r * math.cos(el) * math.sin(az), z0 + h * math.sin(el))))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(segs):
            bm.faces.new((a[k], a[k + 1], b[k + 1], b[k]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    ob = finish(name, bm, M['leadM'], smooth_all=True)
    mod = ob.modifiers.new('solid', 'SOLIDIFY')
    mod.thickness = 0.01
    return ob


def arch_face(name, cx, cy, r, z0, h, ang):
    """The stone face closing a half-dome's open side: a half-ellipse wall across it."""
    nx, ny = math.cos(ang), math.sin(ang)
    tx, ty = -ny, nx
    arc = [(r * math.cos(t), h * math.sin(t)) for t in (math.pi * k / 24 for k in range(25))]
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new((cx + tx * u - nx * 0.004, cy + ty * u - ny * 0.004, z0 + z)) for u, z in arc],
              [bm.verts.new((cx + tx * u + nx * 0.004, cy + ty * u + ny * 0.004, z0 + z)) for u, z in arc])
    finish(name, bm, M['mosqueStone'], smooth_sides=False)


def dome(name, x, y, z0, r, h, finial=True):
    lathe(name, M['leadM'], [(r, 0), (r * 0.95, h * 0.3), (r * 0.8, h * 0.6), (r * 0.55, h * 0.85), (r * 0.25, h * 0.98), (0.0, h)], (x, y, z0), segs=40, smooth=True)
    if finial:
        lathe(name + 'Alem', M['gold'], [(0.0, 0), (r * 0.06, h * 0.06), (r * 0.04, h * 0.18), (r * 0.08, h * 0.24), (0.0, h * 0.34)], (x, y, z0 + h), segs=10, smooth=True)


# ------------------------------------------------------------------ the garden and the square
slab('square', M['paving'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.04)
for k, (x, y) in enumerate(((-1.15, -0.65), (-0.9, -0.95), (1.1, -0.65), (0.85, -0.95), (1.2, 0.6), (-1.2, 0.6), (0.2, 1.2), (-0.4, 1.18), (0.85, 0.98))):
    tree(f'tree{k}', x, y, h=0.15, r=0.06, z=Z0)

# ------------------------------------------------------------------ the prayer hall: walls, windows, buttress turrets
W, WH = 0.82, 0.25
box('hall', M['mosqueStone'], (HX, HY, Z0 + WH / 2), (W, W, WH), bevel=0.003)
box('hallCornice', M['mosqueShade'], (HX, HY, Z0 + WH), (W + 0.014, W + 0.014, 0.016), bevel=0.002)
for side in range(4):
    ang = side * math.pi / 2
    nx, ny = math.cos(ang), math.sin(ang)
    for k in range(9):
        u = -W / 2 + W * (k + 0.5) / 9
        for z0, h in ((0.05, 0.06), (0.15, 0.06)):
            OPEN.append((HX + nx * W / 2 - ny * u, HY + ny * W / 2 + nx * u, Z0 + z0, 0.03, h, (nx, ny), 'round'))
# the square of the great piers, the four turrets standing on them
SQ = 0.175               # half the great square: the great dome's radius
box('domeBase', M['mosqueStone'], (HX, HY, Z0 + WH + 0.06), (2 * SQ, 2 * SQ, 0.12), bevel=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = HX + sx * SQ, HY + sy * SQ
        cylinder(f'turret{sx}{sy}', M['mosqueStone'], 0.03, 0.17, (x, y, Z0 + WH), segs=16)
        dome(f'turretDome{sx}{sy}', x, y, Z0 + WH + 0.17, 0.03, 0.03)
        dome(f'cornerDome{sx}{sy}', HX + sx * (W / 2 - 0.1), HY + sy * (W / 2 - 0.1), Z0 + WH + 0.005, 0.085, 0.07)
# the four half-domes round the great dome, two smaller half-domes under each
for side in range(4):
    ang = side * math.pi / 2
    nx, ny = math.cos(ang), math.sin(ang)
    cx_, cy_ = HX + nx * SQ, HY + ny * SQ
    half_dome(f'halfDome{side}', cx_, cy_, SQ * 0.97, Z0 + WH + 0.02, 0.1, ang)
    arch_face(f'archFace{side}', cx_, cy_, SQ, Z0 + WH + 0.02, 0.1, ang)
    for o in (-1, 1):
        ex, ey = HX + nx * (SQ + 0.12) - ny * o * 0.12, HY + ny * (SQ + 0.12) + nx * o * 0.12
        half_dome(f'exedra{side}{o}', ex, ey, 0.075, Z0 + WH + 0.005, 0.055, ang)
        arch_face(f'exedraFace{side}{o}', ex, ey, 0.075, Z0 + WH + 0.005, 0.055, ang)
# the great dome on its drum of windows
DZ = Z0 + WH + 0.12
cylinder('drum', M['mosqueStone'], 0.16, 0.07, (HX, HY, DZ), segs=64)
for k in range(28):
    a = 2 * math.pi * k / 28
    OPEN.append((HX + 0.16 * math.cos(a), HY + 0.16 * math.sin(a), DZ + 0.015, 0.018, 0.045, (math.cos(a), math.sin(a)), 'round'))
    bar(f'drumButtress{k}', M['mosqueStone'], (HX + 0.168 * math.cos(a + math.pi / 28), HY + 0.168 * math.sin(a + math.pi / 28), DZ), (HX + 0.168 * math.cos(a + math.pi / 28), HY + 0.168 * math.sin(a + math.pi / 28), DZ + 0.07), 0.012)
dome('dome', HX, HY, DZ + 0.07, 0.172, 0.14)

# ------------------------------------------------------------------ the forecourt: its arcade, its little domes, the fountain, the portal
CW = 0.74
for side in range(4):
    ang = side * math.pi / 2
    nx, ny = math.cos(ang), math.sin(ang)
    if side == 0:
        continue            # the hall's own wall closes the east side
    box(f'arcadeWall{side}', M['mosqueStone'], (CXC + nx * CW / 2, HY + ny * CW / 2, Z0 + 0.06), (0.06 if side % 2 == 0 else CW + 0.06, CW + 0.06 if side % 2 == 0 else 0.06, 0.12), bevel=0.002)
    for k in range(7):
        u = -CW / 2 + CW * (k + 0.5) / 7
        x, y = CXC + nx * (CW / 2 - 0.03) - ny * u, HY + ny * (CW / 2 - 0.03) + nx * u
        dome(f'arcadeDome{side}{k}', x, y, Z0 + 0.12, 0.04, 0.04, finial=False)
        OPEN.append((CXC + nx * (CW / 2 + 0.031) - ny * u, HY + ny * (CW / 2 + 0.031) + nx * u, Z0 + 0.03, 0.035, 0.06, (nx, ny), 'round'))
# the inner face of the arcade: open arches onto the court, in shade (a recess, never a black hole)
for side in (1, 2, 3):
    ang = side * math.pi / 2
    nx, ny = math.cos(ang), math.sin(ang)
    for k in range(7):
        u = -CW / 2 + CW * (k + 0.5) / 7
        ARCADE.append((CXC + nx * (CW / 2 - 0.031) - ny * u, HY + ny * (CW / 2 - 0.031) + nx * u, Z0 + 0.0, 0.07, 0.1, (-nx, -ny), 'round'))
slab('court', M['mosqueShade'], rect(CXC, HY, CW - 0.06, CW - 0.06), Z0 - 0.002, Z0 + 0.003, margin=0.04)
lathe('fountain', M['mosqueStone'], [(0.07, 0), (0.07, 0.07), (0.075, 0.075), (0.0, 0.075)], (CXC, HY, Z0), segs=6)
dome('fountainDome', CXC, HY, Z0 + 0.075, 0.075, 0.05)
for k in range(6):
    a = 2 * math.pi * (k + 0.5) / 6
    cylinder(f'fountainColumn{k}', M['minaret'], 0.006, 0.075, (CXC + 0.07 * math.cos(a), HY + 0.07 * math.sin(a), Z0), segs=8)
box('portal', M['mosqueStone'], (CXC - CW / 2 - 0.01, HY, Z0 + 0.1), (0.07, 0.18, 0.2), bevel=0.002)
dome('portalDome', CXC - CW / 2 - 0.01, HY, Z0 + 0.2, 0.05, 0.04)
glazed('portalDoor', [(CXC - CW / 2 - 0.046, HY, Z0, 0.07, 0.13, (-1, 0), 'pointed')], M['mosqueShade'], glass=M['door'], depth=0.008)


# ------------------------------------------------------------------ the six minarets
def minaret(name, x, y, h, r, balconies):
    lathe(name + 'Base', M['minaret'], [(r * 1.6, 0), (r * 1.6, 0.07), (r * 1.2, 0.09)], (x, y, Z0), segs=12)
    lathe(name, M['minaret'], [(r * 1.2, 0), (r, h * 0.5), (r * 0.88, h)], (x, y, Z0 + 0.09), segs=16)
    for f in ((0.5, 0.72, 0.9) if balconies == 3 else (0.6, 0.85)):
        lathe(f'{name}Balcony{f}', M['minaret'], [(r, 0), (r * 1.8, 0.016), (r * 1.8, 0.03), (r * 1.6, 0.034)], (x, y, Z0 + 0.09 + h * f), segs=16)
    spire(name + 'Cap', M['leadM'], x, y, Z0 + 0.09 + h, r * 0.95, h * 0.2, finial=False)
    lathe(name + 'Alem', M['gold'], [(0.0, 0), (r * 0.25, 0.01), (r * 0.15, 0.03), (r * 0.3, 0.04), (0.0, 0.055)], (x, y, Z0 + 0.09 + h * 1.2), segs=10, smooth=True)


for k, (x, y) in enumerate(((HX - W / 2 - 0.05, HY - W / 2 - 0.05), (HX - W / 2 - 0.05, HY + W / 2 + 0.05), (HX + W / 2 + 0.05, HY - W / 2 - 0.05), (HX + W / 2 + 0.05, HY + W / 2 + 0.05))):
    minaret(f'minaret{k}', x, y, 0.72, 0.026, 3)
for k, y in enumerate((HY - CW / 2 - 0.04, HY + CW / 2 + 0.04)):
    minaret(f'courtMinaret{k}', CXC - CW / 2 - 0.04, y, 0.6, 0.024, 2)

for k, (x, y, shirt) in enumerate(((-0.95, -0.5, 'red'), (-0.7, -0.62, 'blue'), (-0.2, -0.55, 'yellow'), (0.2, -0.55, 'green'), (0.6, -0.6, 'red'), (-0.45, -0.85, 'blue'), (0.0, -0.95, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z0)

glazed('openings', OPEN, M['mosqueShade'], depth=0.008, bars=False)
windows('innerArcade', M['arcadeShade'], ARCADE, depth=0.008)
render('blue-mosque')
