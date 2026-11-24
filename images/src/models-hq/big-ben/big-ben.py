# Big Ben (the Elizabeth Tower) in the high-quality look (hq.py): the tower of honey limestone with
# its corner buttresses, its faces panelled in tiers of pointed windows between string courses, the
# clock stage with the four gilded dials (opal faces, black numerals and hands), the belfry's
# pointed openings, the steep dark iron roof with its gilded bands, corner pinnacles, the Ayrton
# Light's lantern and the gilded finial; behind it the Palace of Westminster's river front with its
# buttresses and pinnacles, the Central Tower's spire and the Victoria Tower, the Thames behind
# its embankment, and a red double-decker bus on the road in front.
# Run: blender -b --factory-startup -P big-ben.py -- big-ben-1024.png 1024 big-ben.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
M['dial'] = material('dial', '#f5f1e3', 0.35, emission=('#fff6dc', 0.35))
M['asphalt'] = material('asphalt', '#55585c', 0.9, vary='#4a4d51', vary_scale=40, bump=0.15, bump_scale=300)
M['ironRoof'] = banded(material('ironRoof', '#3c4652', 0.45, vary='#343d48', vary_scale=12, metallic=0.5), 'Z', 40.0, 0.2)
M['busRed'] = material('busRed', '#c7262b', 0.35, coat=0.6)
FACES = ((0, -1), (1, 0), (0, 1), (-1, 0))


def on_face(cx, cy, half, normal, u, z):
    """A point on a square tower's face: u along the face, z up."""
    nx, ny = normal
    tx, ty = -ny, nx
    return (cx + nx * half + tx * u, cy + ny * half + ty * u, z)


# ------------------------------------------------------------------ the Thames and its embankment
bm = bmesh.new()
water_ring = []
for k in range(41):
    a = math.radians(180 - k * 4.5)
    water_ring.append((PLINTH_R * 0.995 * math.cos(a), PLINTH_R * 0.995 * math.sin(a)))
water_ring = [(x, y) for x, y in water_ring if y >= 0.8]
water_ring = [(water_ring[0][0], 0.8)] + water_ring + [(water_ring[-1][0], 0.8)]
v0 = [bm.verts.new((x, y, G - 0.012)) for x, y in water_ring]
v1 = [bm.verts.new((x, y, G + 0.002)) for x, y in water_ring]
add_prism(bm, v0, v1)
finish('thames', bm, M['water'], smooth_sides=False)
box('embankment', M['granite'], (0, 0.79, G + 0.012), (2.6, 0.04, 0.045), bevel=0.004)

# ------------------------------------------------------------------ the road and the bus
box('road', M['asphalt'], (0.0, -0.98, G - 0.002), (2.2, 0.2, 0.012), bevel=0)
for k in range(9):
    box(f'roadLine{k}', M['white'], (-1.0 + k * 0.25, -0.98, G + 0.0045), (0.1, 0.008, 0.002), bevel=0)
box('pavementFront', M['paving'], (0.0, -0.84, G + 0.002), (2.2, 0.07, 0.018), bevel=0.002)
BX, BY = -0.45, -0.99
box('busBody', M['busRed'], (BX, BY, G + 0.085), (0.24, 0.075, 0.13), bevel=0.012)
for z in (G + 0.065, G + 0.125):
    box(f'busWindows{z:.2f}', M['glass'], (BX - 0.005, BY - 0.0385, z), (0.215, 0.004, 0.03), bevel=0)
box('busWindscreen', M['glass'], (BX + 0.121, BY, G + 0.085), (0.004, 0.06, 0.08), bevel=0)
for dx in (-0.07, 0.08):
    for s in (-1, 1):
        cylinder(f'busWheel{dx}{s}', M['shadow'], 0.02, 0.012, (0, 0, 0), segs=16, matrix=Matrix.Translation((BX + dx, BY + s * 0.036, G + 0.022)) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -0.006)))
box('cab', M['shadow'], (0.55, -0.95, G + 0.04), (0.1, 0.05, 0.05), bevel=0.012)
box('cabTop', M['shadow'], (0.54, -0.95, G + 0.075), (0.06, 0.045, 0.03), bevel=0.01)

# ------------------------------------------------------------------ the Palace of Westminster
PX0, PX1, PY0, PY1, PH = -1.18, 0.2, 0.24, 0.62, 0.48
box('palace', M['limestone'], ((PX0 + PX1) / 2, (PY0 + PY1) / 2, G + PH / 2), (PX1 - PX0, PY1 - PY0, PH), bevel=0.003)
gable_roof('palaceRoof', M['ironRoof'], PX0, PX1, PY0, PY1, G + PH, 0.16, over=0.01)
specs = []
n_bays = 19
for b in range(n_bays):
    x = PX0 + (b + 0.5) * (PX1 - PX0) / n_bays
    for t, (z, h) in enumerate(((0.06, 0.1), (0.21, 0.09), (0.34, 0.08))):
        specs.append((x, PY0, G + z, 0.034, h, (0, -1), 'pointed' if t < 2 else 'rect'))
windows('palaceWindows', M['shadow'], specs)
for b in range(n_bays + 1):
    x = PX0 + b * (PX1 - PX0) / n_bays
    box(f'palaceButtress{b}', M['limestoneLight'], (x, PY0 - 0.006, G + PH / 2 + 0.01), (0.016, 0.014, PH + 0.02), bevel=0.002)
    pyramid(f'palacePinnacle{b}', M['limestoneLight'], x, PY0 - 0.006, G + PH + 0.02, 0.022, 0.07)
for t in (0.18, 0.31, 0.45):
    box(f'palaceCourse{t}', M['limestoneLight'], ((PX0 + PX1) / 2, PY0 - 0.004, G + t), (PX1 - PX0, 0.01, 0.01), bevel=0)
# the Central Tower: an octagonal lantern and spire on the roof
CTX = -0.48
lathe('centralTower', M['limestone'], [(0.11, 0), (0.11, 0.3), (0.095, 0.32)], (CTX, (PY0 + PY1) / 2, G + PH), segs=8, smooth=False)
windows('centralTowerWindows', M['shadow'], [(CTX + 0.1 * math.cos(a), (PY0 + PY1) / 2 + 0.1 * math.sin(a), G + PH + 0.12, 0.03, 0.12, (math.cos(a), math.sin(a)), 'pointed') for a in [math.pi / 8 + k * math.pi / 4 for k in range(8)]])
lathe('centralSpire', M['ironRoof'], [(0.1, 0), (0.0, 0.32)], (CTX, (PY0 + PY1) / 2, G + PH + 0.32), segs=8, smooth=False)
# the Victoria Tower at the far end
VX, VY, VS, VH = -0.98, 0.44, 0.3, 1.2
box('victoriaTower', M['limestone'], (VX, VY, G + VH / 2), (VS, VS, VH), bevel=0.004)
vspecs = []
for k, nrm in enumerate(FACES[:2]):
    for t in range(5):
        for u in (-0.07, 0.0, 0.07):
            vspecs.append((*on_face(VX, VY, VS / 2, nrm, u, 0)[:2], G + 0.2 + t * 0.18, 0.04, 0.13, nrm, 'pointed'))
windows('victoriaWindows', M['shadow'], vspecs)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'victoriaTurret{sx}{sy}', M['limestoneLight'], [(0.03, 0), (0.03, VH + 0.08), (0.0, VH + 0.16)], (VX + sx * VS / 2, VY + sy * VS / 2, G), segs=8, smooth=False)
box('victoriaTop', M['limestoneLight'], (VX, VY, G + VH + 0.01), (VS + 0.02, VS + 0.02, 0.025), bevel=0.003)
cylinder('flagpole', M['steel'], 0.004, 0.18, (VX, VY, G + VH + 0.02), segs=8)
box('flag', M['red'], (VX + 0.04, VY, G + VH + 0.16), (0.08, 0.003, 0.05), bevel=0)

# ------------------------------------------------------------------ the Elizabeth Tower
TX, TY = 0.42, -0.28
S = 0.34
box('towerPlinth', M['limestoneLight'], (TX, TY, G + 0.035), (S + 0.08, S + 0.08, 0.07), bevel=0.004)
SH0, SH1 = G + 0.07, G + 1.5
box('shaft', M['limestone'], (TX, TY, (SH0 + SH1) / 2), (S, S, SH1 - SH0), bevel=0.003)
specs = []
for nrm in FACES:
    for t in range(6):
        z = SH0 + 0.08 + t * 0.225
        for u in (-0.105, -0.035, 0.035, 0.105):
            specs.append((*on_face(TX, TY, S / 2, nrm, u, 0)[:2], z, 0.04, 0.16, nrm, 'pointed'))
windows('shaftWindows', M['shadow'], specs)
for t in range(7):
    z = SH0 + 0.04 + t * 0.225
    box(f'stringCourse{t}', M['limestoneLight'], (TX, TY, z), (S + 0.016, S + 0.016, 0.014), bevel=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'cornerButtress{sx}{sy}', M['limestoneLight'], (TX + sx * (S / 2 - 0.004), TY + sy * (S / 2 - 0.004), (SH0 + SH1) / 2), (0.05, 0.05, SH1 - SH0), bevel=0.003)
for nrm in FACES:
    for u in (-0.07, 0.0, 0.07):
        p = on_face(TX, TY, S / 2 + 0.004, nrm, u, 0)
        box(f'mullion{nrm}{u}', M['limestoneLight'], (p[0], p[1], (SH0 + SH1) / 2), (0.01 if nrm[0] == 0 else 0.008, 0.008 if nrm[0] == 0 else 0.01, SH1 - SH0 - 0.04), bevel=0)

# the clock stage: four gilded faces with their dials
CS0, CS1, CW = SH1, SH1 + 0.42, 0.4
box('clockStage', M['limestone'], (TX, TY, (CS0 + CS1) / 2), (CW, CW, CS1 - CS0), bevel=0.004)
box('clockCornice', M['limestoneLight'], (TX, TY, CS0 + 0.01), (CW + 0.03, CW + 0.03, 0.02), bevel=0.003)
CZ = (CS0 + CS1) / 2
for k, nrm in enumerate(FACES):
    nx, ny = nrm
    rot = Matrix.Rotation(math.atan2(nx, -ny), 4, 'Z')   # local -y outwards
    centre = Vector(on_face(TX, TY, CW / 2, nrm, 0, CZ))
    face_m = Matrix.Translation(centre) @ rot
    box_m(f'clockSurround{k}', M['gold'], face_m @ Matrix.Translation((0, -0.004, 0)), (0.34, 0.012, 0.36), bevel=0.003)
    cylinder(f'dial{k}', M['dial'], 0.155, 0.012, (0, 0, 0), segs=64, matrix=face_m @ Matrix.Translation((0, -0.012, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -0.006)))
    cylinder(f'dialRing{k}', M['shadow'], 0.158, 0.008, (0, 0, 0), segs=64, matrix=face_m @ Matrix.Translation((0, -0.01, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -0.004)))
    for h in range(12):
        a = 2 * math.pi * h / 12
        box_m(f'numeral{k}_{h}', M['shadow'], face_m @ Matrix.Translation((0.128 * math.sin(a), -0.0185, 0.128 * math.cos(a))) @ Matrix.Rotation(-a, 4, 'Y'), (0.008, 0.002, 0.024))
    for length, ang, w in ((0.075, math.radians(130), 0.01), (0.12, math.radians(10), 0.007)):
        box_m(f'hand{k}{length}', M['shadow'], face_m @ Matrix.Translation((0, -0.02, 0)) @ Matrix.Rotation(-ang, 4, 'Y') @ Matrix.Translation((0, 0, length / 2)), (w, 0.003, length))
    cylinder(f'hub{k}', M['gold'], 0.01, 0.006, (0, 0, 0), segs=12, matrix=face_m @ Matrix.Translation((0, -0.022, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for cx in (-1, 1):
        for cz in (-1, 1):
            box_m(f'spandrel{k}{cx}{cz}', M['gold'], face_m @ Matrix.Translation((cx * 0.15, -0.012, cz * 0.16)), (0.04, 0.006, 0.04))
box('clockTopCornice', M['limestoneLight'], (TX, TY, CS1), (CW + 0.03, CW + 0.03, 0.025), bevel=0.003)

# the belfry, the roof, the pinnacles, the lantern and the finial
BF0, BF1, BW = CS1 + 0.0125, CS1 + 0.25, 0.36
box('belfry', M['limestone'], (TX, TY, (BF0 + BF1) / 2), (BW, BW, BF1 - BF0), bevel=0.003)
bspecs = []
for nrm in FACES:
    for u in (-0.09, 0.0, 0.09):
        bspecs.append((*on_face(TX, TY, BW / 2, nrm, u, 0)[:2], BF0 + 0.035, 0.06, 0.17, nrm, 'pointed'))
windows('belfryOpenings', M['shadow'], bspecs, depth=0.01)
box('belfryGilt', M['gold'], (TX, TY, BF1 - 0.008), (BW + 0.02, BW + 0.02, 0.016), bevel=0.002)
R0 = BF1
loft_bm = bmesh.new()
rings = []
for z, w in ((R0, 0.36), (R0 + 0.34, 0.13)):
    rings.append([loft_bm.verts.new((TX + x * w / 2, TY + y * w / 2, z)) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
add_prism(loft_bm, rings[0], rings[1])
finish('roof', loft_bm, M['ironRoof'], smooth_sides=False)
for t in (0.08, 0.2):
    w = 0.36 - (0.36 - 0.13) * t / 0.34
    box(f'roofGilt{t}', M['gold'], (TX, TY, R0 + t), (w + 0.006, w + 0.006, 0.012), bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = TX + sx * 0.17, TY + sy * 0.17
        box(f'pinnacleBase{sx}{sy}', M['limestoneLight'], (x, y, R0 + 0.03), (0.04, 0.04, 0.06), bevel=0.002)
        pyramid(f'pinnacle{sx}{sy}', M['ironRoof'], x, y, R0 + 0.06, 0.04, 0.12)
        lathe(f'pinnacleTip{sx}{sy}', M['gold'], [(0.006, 0), (0.0, 0.03)], (x, y, R0 + 0.175), segs=8)
L0 = R0 + 0.34
box('lantern', M['gold'], (TX, TY, L0 + 0.05), (0.12, 0.12, 0.1), bevel=0.003)
windows('lanternLights', M['dial'], [(*on_face(TX, TY, 0.06, nrm, 0, 0)[:2], L0 + 0.02, 0.05, 0.065, nrm, 'pointed') for nrm in FACES], depth=0.006)
pyramid('spire', M['ironRoof'], TX, TY, L0 + 0.1, 0.12, 0.2)
lathe('finial', M['gold'], [(0.012, 0), (0.016, 0.02), (0.006, 0.04), (0.004, 0.08), (0.0, 0.09)], (TX, TY, L0 + 0.28), segs=12, smooth=True)

# ------------------------------------------------------------------ lawns, paths, trees, people
paving_strip('pathTower', TX - 0.05, -0.78, TX - 0.05, TY - 0.22, 0.16)
for k, (x, y) in enumerate(((-0.25, -0.35), (-0.55, -0.45), (0.95, 0.1), (1.0, -0.4))):
    tree(f'tree{k}', x, y, h=0.24, r=0.1)
person('p1', TX - 0.1, -0.68, 1.2, 'red')
person('p2', TX - 0.02, -0.72, 2.0, 'yellow')
person('p3', -0.1, -0.84, 0.3, 'blue')

render('big-ben')
