# St. Peter's Basilica in the high-quality look (hq.py): the travertine front with its giant Corinthian
# columns and pilasters, the central balcony, the attic and the row of statues along the top, the two
# clocks; behind it the nave's roof, the great ribbed dome of lead on its drum ringed with paired
# columns and windows, the lantern and the cross, the two small domes beside it; in front Saint
# Peter's Square: Bernini's two curving colonnades of columns with their statues, the straight arms
# to the basilica, the obelisk in the middle with a fountain either side, the paving's rays; people.
# Run: blender -b --factory-startup -P st-peters.py -- st-peters-1024.png 1024 st-peters.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1626)
M['trav'] = material('travertineSP', '#e3d7bd', 0.6, vary='#d3c5a6', vary_scale=22, bump=0.14, bump_scale=150)
M['travShade'] = material('travertineShade', '#cdbf9f', 0.65, vary='#bdae8e', vary_scale=22, bump=0.14, bump_scale=150)
M['domeLead'] = banded(material('domeLead', '#9aa2a6', 0.45, vary='#8c9498', vary_scale=14, metallic=0.4), 'Z', 40.0, strength=0.15)
M['sampietrini'] = material('sampietrini', '#a49d92', 0.85, vary='#918a80', vary_scale=60, bump=0.35, bump_scale=300)
OPEN, DOORS, STATUES = [], [], bmesh.new()
COLS = bmesh.new()
FY = -0.18           # the basilica's front


def corinthian(bm, x, y, z0, h, r):
    bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=r, radius2=r * 0.88, depth=h * 0.88, matrix=Matrix.Translation((x, y, z0 + h * 0.06 + h * 0.44)))
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x, y, z0 + h * 0.03)) @ Matrix.Diagonal((r * 2.6, r * 2.6, h * 0.06, 1)))
    bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=r * 0.9, radius2=r * 1.35, depth=h * 0.07, matrix=Matrix.Translation((x, y, z0 + h * 0.94 + h * 0.035 - h * 0.035)))
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x, y, z0 + h * 0.985)) @ Matrix.Diagonal((r * 2.8, r * 2.8, h * 0.03, 1)))


def statue(x, y, z, s=1.0):
    bmesh.ops.create_cone(STATUES, cap_ends=True, segments=8, radius1=0.011 * s, radius2=0.008 * s, depth=0.045 * s, matrix=Matrix.Translation((x, y, z + 0.0225 * s)))
    bmesh.ops.create_icosphere(STATUES, subdivisions=1, radius=0.008 * s, matrix=Matrix.Translation((x, y, z + 0.052 * s)))


# ------------------------------------------------------------------ Saint Peter's Square
SY, SA, SB = -0.88, 0.7, 0.42          # the oval's middle and half-axes
oval = [(SA * 1.05 * math.cos(a), SY + SB * 1.05 * math.sin(a)) for a in [2 * math.pi * k / 96 for k in range(96)]]
slab('squareOval', M['sampietrini'], oval, G - 0.004, G + 0.004, margin=0.04)
slab('piazzaRetta', M['sampietrini'], [(-0.36, SY + 0.3), (0.36, SY + 0.3), (0.42, FY - 0.02), (-0.42, FY - 0.02)], G - 0.006, G + 0.0025, margin=0.04)   # under the oval's paving, never flush with it
for k in range(16):
    a = 2 * math.pi * k / 16
    bar(f'ray{k}', M['paving'], (0.05 * math.cos(a), SY + 0.05 * math.sin(a), G + 0.0045), (SA * 0.85 * math.cos(a), SY + SB * 0.85 * math.sin(a), G + 0.0045), 0.006)
for side in (-1, 1):
    for k in range(13):
        a = math.radians(-65 + k * 10.8) if side > 0 else math.radians(115 + k * 10.8)
        for ring in (1.0, 1.12):
            x, y = SA * ring * math.cos(a), SY + SB * ring * math.sin(a)
            if math.hypot(x, y) > 1.42:
                continue
            bmesh.ops.create_cone(COLS, cap_ends=True, segments=10, radius1=0.012, radius2=0.011, depth=0.13, matrix=Matrix.Translation((x, y, G + 0.065)))
    pts_in = [(SA * 0.97 * math.cos(math.radians(t)), SY + SB * 0.97 * math.sin(math.radians(t))) for t in (range(-68, 75, 6) if side > 0 else range(112, 255, 6))]
    pts_out = [(SA * 1.15 * math.cos(math.radians(t)), SY + SB * 1.15 * math.sin(math.radians(t))) for t in (range(-68, 75, 6) if side > 0 else range(112, 255, 6))]
    poly = pts_in + list(reversed(pts_out))
    slab(f'colonnadeRoof{side}', M['trav'], poly, G + 0.13, G + 0.165, bevel=0.002, margin=0.04)
    for j in range(0, len(pts_in), 2):
        x, y = (pts_in[j][0] + pts_out[j][0]) / 2, (pts_in[j][1] + pts_out[j][1]) / 2
        statue(x, y, G + 0.165, 0.9)
    # the straight arm to the basilica
    x0 = side * 0.4
    box(f'arm{side}', M['trav'], (x0, (SY + 0.38 + FY) / 2 - 0.02, G + 0.075), (0.08, FY - SY - 0.42, 0.15), bevel=0.003)
    for j in range(5):
        statue(x0, SY + 0.4 + j * (FY - SY - 0.42) / 5, G + 0.15, 0.9)
finish('colonnades', COLS, M['trav'], smooth_sides=False)
# the obelisk and the two fountains
lathe('obeliskBase', M['travShade'], [(0.04, 0), (0.04, 0.04), (0.03, 0.05)], (0, SY, G), segs=4, matrix=None)
pyramid('obelisk', M['granite'], 0, SY, G + 0.05, 0.035, 0.3, segs=4)
box('obeliskShaft', M['granite'], (0, SY, G + 0.18), (0.035, 0.035, 0.26), bevel=0.002)
pyramid('obeliskTip', M['granite'], 0, SY, G + 0.31, 0.036, 0.03)
for s in (-1, 1):
    lathe(f'fountain{s}', M['trav'], [(0.06, 0), (0.06, 0.02), (0.02, 0.03), (0.015, 0.07), (0.03, 0.08), (0.0, 0.09)], (s * 0.32, SY, G), segs=24, smooth=True)
    cylinder(f'fountainWater{s}', M['water'], 0.055, 0.004, (s * 0.32, SY, G + 0.018), segs=24)

# ------------------------------------------------------------------ the basilica's front
FW, FH = 0.82, 0.36
box('nave', M['trav'], (0, FY + 0.515, G + 0.2), (0.5, 0.97, 0.4), bevel=0.004)   # its front a hair behind the facade's: faces lying on each other render black
gable_roof('naveRoof', M['domeLead'], -0.25, 0.25, FY + 0.06, FY + 0.95, G + 0.4, 0.08, over=0.008, along='y')
box('front', M['trav'], (0, FY + 0.04, G + FH / 2), (FW, 0.08, FH), bevel=0.003)
box('frontStep', M['travShade'], (0, FY - 0.04, G + 0.012), (FW + 0.06, 0.1, 0.024), bevel=0.002)
CC = bmesh.new()
for k, u in enumerate((-0.37, -0.29, -0.2, -0.12, -0.04, 0.04, 0.12, 0.2, 0.29, 0.37)):
    corinthian(CC, u, FY - 0.004, G + 0.024, 0.27, 0.017)
finish('frontColumns', CC, M['trav'], smooth_sides=False)
box('entablature', M['trav'], (0, FY + 0.02, G + 0.31), (FW + 0.02, 0.06, 0.04), bevel=0.002)
box('attic', M['trav'], (0, FY + 0.04, G + 0.355), (FW, 0.07, 0.05), bevel=0.002)
bm = bmesh.new()
tri = [(-0.16, 0), (0.16, 0), (0, 0.06)]
add_prism(bm, [bm.verts.new((u, FY - 0.004, G + 0.33 + z)) for u, z in tri], [bm.verts.new((u, FY + 0.03, G + 0.33 + z)) for u, z in tri])
finish('pediment', bm, M['trav'], smooth_sides=False)
for k in range(13):
    statue(-0.36 + k * 0.06, FY + 0.03, G + 0.38, 1.25)
for u in (-0.33, -0.245, -0.16, 0.16, 0.245, 0.33):
    DOORS.append((u, FY - 0.001, G + 0.035, 0.035, 0.1, (0, -1), 'round'))
    OPEN.append((u, FY - 0.001, G + 0.17, 0.03, 0.06, (0, -1), 'rect'))
    OPEN.append((u, FY - 0.001, G + 0.25, 0.024, 0.035, (0, -1), 'rect'))
for u in (-0.08, 0.0, 0.08):
    DOORS.append((u, FY - 0.001, G + 0.035, 0.05, 0.12, (0, -1), 'round'))
OPEN.append((0, FY - 0.001, G + 0.18, 0.06, 0.08, (0, -1), 'round'))
for s in (-1, 1):
    box(f'clockTower{s}', M['trav'], (s * 0.44, FY + 0.06, G + 0.36), (0.08, 0.08, 0.12), bevel=0.003)   # down into the attic: no gap under it
    cylinder(f'clock{s}', M['white'], 0.026, 0.006, (0, 0, 0), segs=24, matrix=Matrix.Translation((s * 0.44, FY + 0.018, G + 0.385)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    lathe(f'cupola{s}', M['domeLead'], [(0.045, 0), (0.035, 0.03), (0.0, 0.05)], (s * 0.44, FY + 0.06, G + 0.42), segs=16, smooth=True)

# ------------------------------------------------------------------ the dome on its drum, the lantern, the small domes
DX, DY = 0.0, FY + 0.62
DZ = G + 0.42
cylinder('drumBase', M['trav'], 0.26, 0.04, (DX, DY, DZ), segs=48)
cylinder('drum', M['trav'], 0.235, 0.18, (DX, DY, DZ + 0.04), segs=48)
DC = bmesh.new()
for k in range(16):
    a = 2 * math.pi * k / 16
    for o in (-0.06, 0.06):
        corinthian(DC, DX + 0.25 * math.cos(a + o), DY + 0.25 * math.sin(a + o), DZ + 0.04, 0.17, 0.011)
    b = a + math.pi / 16
    OPEN.append((DX + 0.236 * math.cos(b), DY + 0.236 * math.sin(b), DZ + 0.09, 0.04, 0.09, (math.cos(b), math.sin(b)), 'round'))
finish('drumColumns', DC, M['trav'], smooth_sides=False)
lathe('drumCornice', M['trav'], [(0.27, 0), (0.27, 0.025)], (DX, DY, DZ + 0.21), segs=48)
lathe('dome', M['domeLead'], [(0.245, 0), (0.24, 0.07), (0.22, 0.15), (0.18, 0.23), (0.12, 0.3), (0.06, 0.345), (0.04, 0.355)], (DX, DY, DZ + 0.235), segs=64, smooth=True)
for k in range(16):
    a = 2 * math.pi * k / 16
    tube(f'rib{k}', M['trav'], [(DX + r * math.cos(a), DY + r * math.sin(a), DZ + 0.235 + z) for r, z in ((0.247, 0.0), (0.242, 0.07), (0.222, 0.15), (0.182, 0.23), (0.122, 0.3), (0.062, 0.345))], 0.006)
for k in range(16):
    a = 2 * math.pi * k / 16 + math.pi / 16
    for zz, r in ((0.08, 0.238), (0.17, 0.205)):
        OPEN.append((DX + r * math.cos(a), DY + r * math.sin(a), DZ + 0.235 + zz, 0.016, 0.022, (math.cos(a), math.sin(a)), 'round'))
LZ = DZ + 0.235 + 0.35
cylinder('lantern', M['trav'], 0.04, 0.09, (DX, DY, LZ), segs=16)
for k in range(8):
    a = 2 * math.pi * k / 8
    cylinder(f'lanternCol{k}', M['trav'], 0.006, 0.09, (DX + 0.045 * math.cos(a), DY + 0.045 * math.sin(a), LZ), segs=6)
lathe('lanternCap', M['domeLead'], [(0.05, 0), (0.03, 0.04), (0.012, 0.07), (0.0, 0.08)], (DX, DY, LZ + 0.09), segs=16, smooth=True)
lathe('orb', M['gold'], [(0.0, 0), (0.012, 0.006), (0.012, 0.018), (0.0, 0.024)], (DX, DY, LZ + 0.17), segs=12, smooth=True)
bar('crossUp', M['gold'], (DX, DY, LZ + 0.19), (DX, DY, LZ + 0.25), 0.007)
bar('crossBar', M['gold'], (DX - 0.02, DY, LZ + 0.23), (DX + 0.02, DY, LZ + 0.23), 0.007)
for s in (-1, 1):
    cylinder(f'smallDrum{s}', M['trav'], 0.06, 0.06, (s * 0.3, FY + 0.35, G + 0.4), segs=32)
    lathe(f'smallDome{s}', M['domeLead'], [(0.065, 0), (0.06, 0.03), (0.04, 0.06), (0.0, 0.075)], (s * 0.3, FY + 0.35, G + 0.46), segs=32, smooth=True)
    lathe(f'smallLantern{s}', M['trav'], [(0.012, 0), (0.012, 0.03), (0.0, 0.045)], (s * 0.3, FY + 0.35, G + 0.535), segs=8)
box('transeptN', M['trav'], (0, DY, G + 0.2), (0.9, 0.36, 0.4), bevel=0.004)
box('apse', M['trav'], (0, DY + 0.3, G + 0.2), (0.4, 0.3, 0.4), bevel=0.004)

for k, (x, y, shirt) in enumerate(((-0.15, -0.55, 'red'), (0.1, -0.6, 'blue'), (0.3, -0.75, 'yellow'), (-0.35, -0.8, 'green'), (0.05, -1.05, 'red'), (-0.2, -1.1, 'blue'), (0.45, -1.0, 'yellow'), (-0.05, -0.4, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.004)

glazed('openings', OPEN, M['travShade'], depth=0.008)
glazed('doors', DOORS, M['travShade'], glass=M['door'], depth=0.008)
finish('statues', STATUES, M['trav'], smooth_all=True)
render('st-peters')
