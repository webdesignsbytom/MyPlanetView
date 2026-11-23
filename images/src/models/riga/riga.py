# A cartoon Riga for the country maps, built in the set's shared look (../toon.py): the Town Hall
# Square's House of the Blackheads, its tall stepped gable in red brick and white stone trimmed with
# gold, its clock, the Schwab House beside it, Saint Peter's Church behind with its tiered baroque
# spire and golden rooster, and pastel houses round the cobbles. Turned a little towards the camera.
# Run: blender -b --factory-startup -P riga.py -- riga-1024.png 1024 riga.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobble': toon('cobble', '#d3cab8', lift=0.25),
    'brick': toon('brick', '#b0503a'),
    'brickDark': toon('brickDark', '#93412f'),
    'stone': toon('stone', '#ece6d8', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'pink': toon('pink', '#eec2b4', shadow_mul=(0.84, 0.76, 0.82)),
    'yellow': toon('hyellow', '#f2d27a', shadow_mul=(0.84, 0.74, 0.62)),
    'mint': toon('hmint', '#b8dcc4', shadow_mul=(0.74, 0.82, 0.82)),
    'blue': toon('hblue', '#a8c4e0', shadow_mul=(0.74, 0.76, 0.86)),
    'roof': toon('roof', '#c4503a'),
    'spire': toon('spire', '#3f5a52', shadow_mul=(0.74, 0.8, 0.84)),
    'window': flat('window', '#33303d'),
    'clockface': flat('clockface', '#2f4f9a'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(293)


def slab(name, mat, pts, y0, y1, outline=0.0):
    return loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=outline)


def ridge_roof(name, x, y, z, w, d, h, along_x=False):
    top = ([(x - w / 2 + 0.01, y - 0.004), (x + w / 2 - 0.01, y - 0.004), (x + w / 2 - 0.01, y + 0.004), (x - w / 2 + 0.01, y + 0.004)] if along_x else
           [(x - 0.004, y - d / 2 + 0.01), (x + 0.004, y - d / 2 + 0.01), (x + 0.004, y + d / 2 - 0.01), (x - 0.004, y + d / 2 - 0.01)])
    loft(name, M['roof'], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                           [(px, py, z + h) for px, py in top]], outline=0.016)


# ---------- the cobbled square ----------
box('square', M['cobble'], 0, -0.3, G - 0.005, 1.8, 1.0, 0.012, outline=0.01, bevel=0)

# ---------- the House of the Blackheads ----------
BX, BY, BW, BD, BH = -0.12, 0.15, 0.36, 0.3, 0.34
FY = BY - BD / 2
box('blackheads', M['brick'], BX, BY, G - 0.005, BW, BD, BH, outline=0.022, bevel=0)
ridge_roof('blackheadsroof', BX, BY + 0.03, G + BH, BW - 0.02, BD - 0.06, 0.3)
STEPS = [(-BW / 2, 0), (BW / 2, 0), (BW / 2, 0.08), (BW * 0.36, 0.08), (BW * 0.36, 0.17), (BW * 0.22, 0.17), (BW * 0.22, 0.26), (BW * 0.1, 0.26),
         (BW * 0.1, 0.36), (-BW * 0.1, 0.36), (-BW * 0.1, 0.26), (-BW * 0.22, 0.26), (-BW * 0.22, 0.17), (-BW * 0.36, 0.17), (-BW * 0.36, 0.08), (-BW / 2, 0.08)]
slab('gable', M['brick'], [(BX + px, G + BH + pz) for px, pz in STEPS], FY - 0.005, FY + 0.04, outline=0.016)
# white stone bands, pilasters and gold on the front
for k, z in enumerate((0.1, 0.22, BH - 0.01, BH + 0.08, BH + 0.17, BH + 0.26)):
    w = BW if k < 3 else BW * (0.72, 0.44, 0.2)[k - 3] + 0.02
    box(f'band{k}', M['stone'], BX, FY - 0.009, G + z, w, 0.01, 0.016, outline=0, bevel=0)
for k in range(5):
    x = BX - BW / 2 + 0.02 + k * (BW - 0.04) / 4
    box(f'pilaster{k}', M['stone'], x, FY - 0.009, G, 0.018, 0.01, BH, outline=0, bevel=0)
for k, (px, pz) in enumerate(STEPS[2::2]):
    ball(f'goldball{k}', M['gold'], BX + px, FY + 0.015, G + BH + pz + 0.015, 0.014, outline=0.004)
rod('gablespire', M['gold'], (BX, FY + 0.015, G + BH + 0.36), (BX, FY + 0.015, G + BH + 0.46), 0.008, segs=6, outline=0.003)
for row, z in enumerate((0.02, 0.13, 0.25)):
    for k in range(4):
        x = BX - BW / 2 + 0.06 + k * (BW - 0.12) / 3
        box(f'bhwin{row}{k}', M['window'], x, FY - 0.006, G + z, 0.035, 0.01, 0.07 if row else 0.08, outline=0, bevel=0)
cyl('clock', M['gold'], 0.04, 0.012, segs=24, outline=0.006, matrix=Matrix.Translation((BX, FY - 0.012, G + BH + 0.12)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('clockface', M['clockface'], 0.03, 0.012, segs=24, outline=0, matrix=Matrix.Translation((BX, FY - 0.017, G + BH + 0.12)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the Schwab House beside it ----------
SX = BX + BW / 2 + 0.11
box('schwab', M['pink'], SX, BY, G - 0.005, 0.2, BD, BH, outline=0.02, bevel=0)
slab('schwabgable', M['pink'], [(SX + px, G + BH + pz) for px, pz in ((-0.1, 0), (0.1, 0), (0.1, 0.05), (0.05, 0.12), (0.03, 0.2), (-0.03, 0.2), (-0.05, 0.12),
                                                                       (-0.1, 0.05))], FY - 0.005, FY + 0.04, outline=0.014)
ridge_roof('schwabroof', SX, BY + 0.03, G + BH, 0.18, BD - 0.06, 0.18)
for row, z in enumerate((0.04, 0.15, 0.26)):
    for k in range(2):
        box(f'swwin{row}{k}', M['window'], SX - 0.045 + k * 0.09, FY - 0.006, G + z, 0.035, 0.01, 0.06, outline=0, bevel=0)

# ---------- Saint Peter's Church behind, and its spire ----------
PX, PY = 0.35, 0.72
box('peternave', M['brick'], PX - 0.05, PY + 0.12, G - 0.005, 0.32, 0.4, 0.32, outline=0.022, bevel=0)
ridge_roof('peterroof', PX - 0.05, PY + 0.12, G + 0.315, 0.34, 0.42, 0.2)
box('petertower', M['brick'], PX, PY - 0.12, G - 0.005, 0.18, 0.18, 0.62, outline=0.022, bevel=0)
for k, z in enumerate((0.3, 0.45)):
    box(f'peterwin{k}', M['window'], PX, PY - 0.215, G + z, 0.04, 0.01, 0.1, outline=0, bevel=0)
z = G + 0.615
SPIRE = (((0.085, 0), (0.08, 0.06), (0.06, 0.1)), ((0.06, 0), (0.075, 0.05), (0.05, 0.1), (0.035, 0.12)), ((0.035, 0), (0.035, 0.07)),
         ((0.035, 0), (0.05, 0.04), (0.03, 0.08), (0.02, 0.09)), ((0.02, 0), (0.004, 0.42)))   # drum, bulb, lantern, bulb, needle
for k, profile in enumerate(SPIRE):
    lathe(f'spire{k}', M['spire'], profile, z, PX, PY - 0.12, segs=8, outline=0.012, smooth=False)
    z += profile[-1][1]
rod('rooster', M['gold'], (PX, PY - 0.12, z - 0.02), (PX, PY - 0.12, z + 0.05), 0.006, segs=6, outline=0)
box('roosterbird', M['gold'], PX + 0.012, PY - 0.12, z + 0.04, 0.04, 0.008, 0.03, outline=0.003, bevel=0)

# ---------- pastel houses round the square ----------
HOUSES = [(-0.72, 0.2, 'yellow'), (-0.52, 0.22, 'mint'), (0.82, 0.15, 'blue'), (-0.95, -0.25, 'pink'), (0.95, -0.3, 'yellow'), (-0.7, 0.6, 'blue')]
for k, (x, y, mat) in enumerate(HOUSES):
    h = rng.uniform(0.22, 0.3)
    box(f'house{k}', M[mat], x, y, G - 0.005, 0.18, 0.2, h, outline=0.016, bevel=0)
    ridge_roof(f'houseroof{k}', x, y, G + h - 0.005, 0.2, 0.22, 0.12, along_x=True)
    for r in range(2):
        box(f'housewin{k}{r}', M['window'], x, y - 0.104, G + 0.05 + r * 0.1, 0.03, 0.01, 0.05, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.5, -0.75), (0.55, -0.75))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.11, outline=0.018)

turn(before, -20)
render(G)
