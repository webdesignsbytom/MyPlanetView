# The Pantheon in the high-quality look (hq.py): Rome's ancient temple on the Piazza della Rotonda,
# the deep portico of sixteen grey granite columns with their white marble capitals under the
# pediment and its inscription, the intermediate block, the brick rotunda behind with its cornices
# and blind arches, the great shallow dome stepped round its foot with the open oculus at the top;
# the square's fountain with its obelisk, the ochre and terracotta houses round it, people.
# Run: blender -b --factory-startup -P pantheon.py -- pantheon-1024.png 1024 pantheon.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(125)
M['romanBrick'] = material('romanBrick', '#b98a68', 0.8, vary='#a87a59', vary_scale=24, bump=0.3, bump_scale=200)
M['marbleP'] = material('marbleP', '#e8e0cf', 0.5, vary='#d9cfba', vary_scale=18, bump=0.1, bump_scale=150)
M['greyGranite'] = material('greyGranite', '#8f8b87', 0.55, vary='#7e7a76', vary_scale=40, bump=0.12, bump_scale=200)
M['domeConcrete'] = material('domeConcrete', '#a9a7a2', 0.6, vary='#99978f', vary_scale=14, bump=0.15, bump_scale=150, metallic=0.15)
M['sampietrini'] = material('sampietrini', '#a49d92', 0.85, vary='#918a80', vary_scale=60, bump=0.35, bump_scale=300)
M['ochre'] = material('ochre', '#d9a25a', 0.8, vary='#c8924d', vary_scale=24, bump=0.12, bump_scale=200)
M['ochreRed'] = material('ochreRed', '#c76f45', 0.8, vary='#b5613b', vary_scale=24, bump=0.12, bump_scale=200)
M['ochrePale'] = material('ochrePale', '#e6c88f', 0.8, vary='#d6b87f', vary_scale=24, bump=0.12, bump_scale=200)
OPEN = []
RX, RY, RR = 0.0, 0.3, 0.42          # the rotunda
WH = 0.34                            # its wall's height

# ------------------------------------------------------------------ the piazza and the houses round it
slab('piazza', M['sampietrini'], rect(0.0, -0.4, 2.2, 1.6), G - 0.004, G + 0.005, margin=0.06)
for k, (x, y, w, d, h, mat, rot) in enumerate(((-1.0, -0.4, 0.3, 0.55, 0.32, 'ochre', 0.0), (-0.95, 0.3, 0.3, 0.45, 0.36, 'ochreRed', 0.0), (1.0, -0.45, 0.3, 0.55, 0.3, 'ochrePale', 0.0),
                                               (0.95, 0.25, 0.3, 0.45, 0.34, 'ochreRed', 0.0), (-0.55, 0.95, 0.5, 0.28, 0.32, 'ochrePale', 0.0), (0.55, 0.95, 0.5, 0.28, 0.3, 'ochre', 0.0))):
    box(f'house{k}', M[mat], (x, y, G + h / 2), (w, d, h), rot_z=rot, bevel=0.004)
    hip_roof(f'houseRoof{k}', M['terracotta'], x, y, G + h, w, d, 0.07, over=0.015)
    nx = 1 if x < 0 else -1
    if abs(y) < 0.7:
        for j in range(3):
            for zz in (0.06, 0.15, 0.24):
                if zz + 0.06 < h:
                    OPEN.append((x + nx * w / 2, y - d / 2 + (j + 0.5) * d / 3, G + zz, 0.035, 0.06, (nx, 0), 'rect'))
    else:
        for j in range(4):
            for zz in (0.06, 0.15, 0.24):
                if zz + 0.06 < h:
                    OPEN.append((x - w / 2 + (j + 0.5) * w / 4, y - d / 2, G + zz, 0.035, 0.06, (0, -1), 'rect'))

# ------------------------------------------------------------------ the rotunda and the dome
cylinder('rotundaBase', M['romanBrick'], RR + 0.02, 0.03, (RX, RY, G), segs=80)
cylinder('rotunda', M['romanBrick'], RR, WH, (RX, RY, G), segs=80)
for zz in (0.13, 0.25, WH - 0.01):
    lathe(f'cornice{zz}', M['marbleP'], [(RR + 0.012, 0), (RR + 0.012, 0.014)], (RX, RY, G + zz), segs=80)
for k in range(20):
    a = math.radians(200 + k * 7)
    if 255 < 200 + k * 7 < 285:
        continue
    OPEN.append((RX + RR * math.cos(a), RY + RR * math.sin(a), G + 0.155, 0.05, 0.07, (math.cos(a), math.sin(a)), 'round'))
# the dome: steps round its foot, the shallow curve, the oculus
for j in range(5):
    lathe(f'domeStep{j}', M['domeConcrete'], [(RR - 0.015 - 0.02 * j, 0), (RR - 0.015 - 0.02 * j, 0.018)], (RX, RY, G + WH + 0.018 * j), segs=80)
prof = []
for j in range(13):
    t = j / 12
    a = math.radians(55 * t)
    r = (RR - 0.1) * math.cos(a) * 1.0 + 0.0
    z = 0.09 + (RR - 0.1) * math.sin(a) * 0.55
    prof.append((max(r, 0.06), z))
lathe('dome', M['domeConcrete'], prof + [(0.06, prof[-1][1] - 0.01)], (RX, RY, G + WH), segs=96, smooth=True)
annulus('oculusRim', M['marbleP'], 0.07, 0.055, G + WH + prof[-1][1] - 0.012, G + WH + prof[-1][1] + 0.004, segs=40, center=(RX, RY))
cylinder('oculusDark', M['shadow'], 0.056, 0.004, (RX, RY, G + WH + prof[-1][1] - 0.012), segs=40)

# ------------------------------------------------------------------ the intermediate block, the portico, the pediment
box('block', M['romanBrick'], (RX, RY - RR + 0.02, G + 0.2), (0.62, 0.2, 0.4), bevel=0.003)
PY0, PY1 = RY - RR - 0.38, RY - RR - 0.06
box('porticoFloor', M['marbleP'], (RX, (PY0 + PY1) / 2, G + 0.02), (0.68, PY1 - PY0 + 0.04, 0.04), bevel=0.002)
for j in range(3):
    box(f'porticoStep{j}', M['marbleP'], (RX, PY0 - 0.025 - 0.02 * j, G + 0.012 - 0.0), (0.62, 0.025, 0.024 - 0.007 * j), bevel=0.002)
CB, CC_ = bmesh.new(), bmesh.new()
ZC, CH, CR = G + 0.04, 0.3, 0.022
xs = [RX - 0.3 + k * 0.6 / 7 for k in range(8)]
rows = [(PY0 + 0.02, xs), (PY0 + 0.12, [xs[0], xs[2], xs[5], xs[7]]), (PY0 + 0.22, [xs[0], xs[2], xs[5], xs[7]])]
for y, rowxs in rows:
    for x in rowxs:
        bmesh.ops.create_cone(CB, cap_ends=True, segments=16, radius1=CR, radius2=CR * 0.86, depth=CH * 0.86, matrix=Matrix.Translation((x, y, ZC + CH * 0.04 + CH * 0.43)))
        bmesh.ops.create_cube(CC_, size=1.0, matrix=Matrix.Translation((x, y, ZC + CH * 0.02)) @ Matrix.Diagonal((CR * 2.7, CR * 2.7, CH * 0.04, 1)))
        bmesh.ops.create_cone(CC_, cap_ends=True, segments=16, radius1=CR * 0.88, radius2=CR * 1.4, depth=CH * 0.08, matrix=Matrix.Translation((x, y, ZC + CH * 0.94)))
        bmesh.ops.create_cube(CC_, size=1.0, matrix=Matrix.Translation((x, y, ZC + CH * 0.99)) @ Matrix.Diagonal((CR * 3.0, CR * 3.0, CH * 0.03, 1)))
finish('porticoShafts', CB, M['greyGranite'], smooth_sides=True)
finish('porticoCapitals', CC_, M['marbleP'], smooth_sides=False)
ZE = ZC + CH
box('architrave', M['marbleP'], (RX, (PY0 + PY1) / 2, ZE + 0.025), (0.66, PY1 - PY0 + 0.04, 0.05), bevel=0.002)
box('inscription', M['shadow'], (RX, PY0 - 0.002, ZE + 0.025), (0.36, 0.004, 0.012))
bm = bmesh.new()
tri = [(-0.34, 0), (0.34, 0), (0, 0.13)]
for y0, y1 in ((PY0 - 0.012, PY0 + 0.01),):
    add_prism(bm, [bm.verts.new((RX + u, y0, ZE + 0.05 + z)) for u, z in tri], [bm.verts.new((RX + u, y1, ZE + 0.05 + z)) for u, z in tri])
finish('pediment', bm, M['marbleP'], bevel=0.002, smooth_sides=False)
bm = bmesh.new()
roof = [(RX - 0.345, ZE + 0.05), (RX + 0.345, ZE + 0.05), (RX, ZE + 0.185)]
for side in (-1, 1):
    quad = [(RX + side * 0.345, PY0 - 0.012, ZE + 0.05), (RX + side * 0.345, PY1 + 0.06, ZE + 0.05), (RX, PY1 + 0.06, ZE + 0.185), (RX, PY0 - 0.012, ZE + 0.185)]
    v0 = [bm.verts.new(q) for q in quad]
    v1 = [bm.verts.new((q[0], q[1], q[2] + 0.012)) for q in quad]
    add_prism(bm, v0, v1)
finish('porticoRoofSlopes', bm, M['domeConcrete'], smooth_sides=False)
OPEN.append((RX, RY - RR - 0.08, G + 0.04, 0.12, 0.22, (0, -1), 'rect'))

# ------------------------------------------------------------------ the fountain with its obelisk, and people
FX, FY = 0.0, -0.95
lathe('fountainBasin', M['marbleP'], [(0.16, 0), (0.16, 0.035), (0.14, 0.04), (0.0, 0.04)], (FX, FY, G), segs=48, sx=1.0, sy=0.8)
cylinder('fountainWater', M['water'], 0.14, 0.004, (FX, FY, G + 0.036), segs=48, matrix=None)
lathe('fountainCore', M['marbleP'], [(0.05, 0), (0.04, 0.06), (0.03, 0.08), (0.02, 0.1)], (FX, FY, G + 0.03), segs=24, smooth=True)
box('obelisk', M['granite'], (FX, FY, G + 0.24), (0.024, 0.024, 0.28), bevel=0.002)
pyramid('obeliskTip', M['granite'], FX, FY, G + 0.38, 0.025, 0.025)
for k, (x, y, shirt) in enumerate(((-0.3, -0.7, 'red'), (0.25, -0.75, 'blue'), (0.35, -1.1, 'yellow'), (-0.4, -1.15, 'green'), (0.05, -0.6, 'red'), (-0.15, -0.55, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.005)

windows('openings', M['shadow'], OPEN, depth=0.012)
render('pantheon')
