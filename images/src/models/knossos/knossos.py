# A cartoon Knossos for the country maps, built in the set's shared look (../toon.py): the Minoan
# palace on Crete, the reconstructed north entrance with its red columns that widen upwards and
# their black capitals, the charging bull fresco on the wall behind, stone horns of consecration,
# the ruined walls and stairs of the palace round it, and cypress and olive trees. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P knossos.py -- knossos-1024.png 1024 knossos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c49a', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'stone': toon('stone', '#e8dcc0', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'stoneDark': toon('stoneDark', '#c8b48e', shadow_mul=(0.84, 0.82, 0.86)),
    'red': toon('minoanRed', '#b8302a'),
    'black': toon('black', '#2e2a30'),
    'fresco': toon('fresco', '#8ac0d8', lift=0.2),
    'bull': toon('bull', '#d8a060'),
    'olive': toon('olive', '#7a9a58', shadow_mul=(0.74, 0.8, 0.74)),
    'cypress': toon('cypress', '#3f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the ruined palace round it ----------
for k, (x, y, w, d, h) in enumerate(((-0.6, 0.45, 0.5, 0.1, 0.12), (-0.85, 0.05, 0.1, 0.6, 0.09), (0.55, 0.5, 0.6, 0.1, 0.14), (0.85, 0.1, 0.1, 0.6, 0.1), (-0.25, 0.7, 0.4, 0.1, 0.08),
                                     (0.2, -0.45, 0.5, 0.08, 0.06), (-0.5, -0.35, 0.3, 0.08, 0.07))):
    box(f'ruin{k}', M['stoneDark'], x, y, G - 0.005, w, d, h, outline=0.006, bevel=0)
for j in range(5):
    box(f'stairs{j}', M['stone'], 0.55, 0.0 + j * 0.05, G - 0.005, 0.25, 0.06, 0.03 + j * 0.03, outline=0.004, bevel=0)

# ---------- the north entrance ----------
NX, NY = -0.1, 0.15
box('bastion', M['stone'], NX, NY + 0.1, G - 0.005, 0.62, 0.22, 0.3, outline=0.01, bevel=0)
box('frescopanel', M['fresco'], NX, NY - 0.012, G + 0.08, 0.4, 0.006, 0.16, outline=0.003, bevel=0)
BX, BY, BZ = NX, NY - 0.018, G + 0.15
b = ball('bullbody', M['bull'], 0, 0, 0, 0.05, outline=0.003)
b.scale = (1.6, 0.15, 0.75)
b.location = (BX, BY, BZ)
ball('bullhead', M['bull'], BX - 0.09, BY, BZ + 0.01, 0.025, outline=0.002)
for s in (-1, 1):
    bar(f'bullhorn{s}', M['stone'], (BX - 0.1, BY - 0.003, BZ + 0.025), (BX - 0.1 - 0.02, BY - 0.003, BZ + 0.05 + s * 0.005), 0.006, outline=0)
for fx in (-0.06, 0.06):
    bar(f'bullleg{fx}', M['bull'], (BX + fx, BY, BZ - 0.02), (BX + fx - 0.02, BY, BZ - 0.06), 0.012, outline=0)
box('porticoroof', M['stone'], NX, NY - 0.08, G + 0.295, 0.6, 0.2, 0.035, outline=0.006, bevel=0)
box('porticobeam', M['red'], NX, NY - 0.18, G + 0.27, 0.6, 0.02, 0.03, outline=0.003, bevel=0)
for j in range(4):
    x = NX - 0.24 + j * 0.16
    lathe(f'column{j}', M['red'], ((0.018, 0), (0.028, 0.25)), G - 0.005, x, NY - 0.15, segs=12, outline=0.004)
    lathe(f'capital{j}', M['black'], ((0.04, 0), (0.04, 0.025)), G + 0.245, x, NY - 0.15, segs=12, outline=0.003)
for s in (-1, 1):
    x = NX + s * 0.22
    loft(f'horn{s}', M['stone'], [[(x - 0.05, NY + 0.1, G + 0.33), (x + 0.05, NY + 0.1, G + 0.33), (x + 0.05, NY + 0.14, G + 0.33), (x - 0.05, NY + 0.14, G + 0.33)],
                                  [(x - 0.05, NY + 0.1, G + 0.36), (x + 0.05, NY + 0.1, G + 0.36), (x + 0.05, NY + 0.14, G + 0.36), (x - 0.05, NY + 0.14, G + 0.36)]], outline=0.003)
    for t in (-1, 1):
        lathe(f'hornpoint{s}{t}', M['stone'], ((0.015, 0), (0.004, 0.06)), G + 0.355, x + t * 0.035, NY + 0.12, segs=6, outline=0.002)

# ---------- trees ----------
for k, (x, y) in enumerate(((-0.95, -0.3), (0.95, -0.35), (-0.4, -0.75), (0.5, -0.75))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.08), 0.012, segs=6, outline=0.003)
    b = ball(f'olive{k}', M['olive'], 0, 0, 0, 0.08, outline=0.008)
    b.scale = (1.2, 1.0, 0.7)
    b.location = (x + 0.02, y, G + 0.13)
for k, (x, y) in enumerate(((-0.7, 0.75), (0.75, 0.7), (0.1, 0.85))):
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.05, 0.08), (0.03, 0.22), (0.004, 0.3)), G - 0.005, x, y, segs=8, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
