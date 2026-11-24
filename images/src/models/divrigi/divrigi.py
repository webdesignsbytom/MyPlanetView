# A cartoon Divriği Great Mosque and Hospital for the country maps, built in the set's shared look
# (../toon.py): the thirteenth-century stone complex on its hillside, its walls of warm grey stone with
# the great carved portal on the front, its deep stone lacework of flowers and stars standing out
# like a garden in stone, the octagonal brick minaret, the conical stone roof over the hospital's
# dome, and the town's flat roofs below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P divrigi.py -- divrigi-1024.png 1024 divrigi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b07a', shadow_mul=(0.8, 0.8, 0.8), lift=0.2),
    'stone': toon('stone', '#c8bca4', shadow_mul=(0.84, 0.84, 0.88), lift=0.12),
    'stoneDark': toon('stoneDark', '#a89c84'),
    'carving': toon('carving', '#dcd0b8', lift=0.15),
    'brick': toon('brick', '#b8704a', lift=0.06),
    'dark': flat('dark', '#2e2a26'),
    'house': toon('house', '#e0d0b0', lift=0.12),
    'tree': toon('tree', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1228)

# ---------- the complex ----------
CX, CY = 0.0, 0.2
W, D, H = 0.86, 0.6, 0.26
box('complex', M['stone'], CX, CY, G - 0.005, W, D, H, outline=0.009, bevel=0)
box('roof', M['stoneDark'], CX, CY, G + H - 0.01, W + 0.02, D + 0.02, 0.025, outline=0.003, bevel=0)
# the great north portal: a tall frame of carved lacework round a deep niche
PX = CX - 0.15
FY = CY - D / 2
box('portal', M['carving'], PX, FY - 0.035, G - 0.005, 0.24, 0.07, H + 0.08, outline=0.006, bevel=0)
box('portalniche', M['dark'], PX, FY - 0.072, G - 0.005, 0.08, 0.006, 0.18, outline=0, bevel=0)
pyramid('portalnichetop', M['dark'], PX, FY - 0.072, G + 0.175, 0.08, 0.06, outline=0)
for k in range(28):
    # the bold carved flowers, stars and palmettes standing out of the frame
    x = PX + rng.uniform(-0.11, 0.11)
    z = G + rng.uniform(0.02, H + 0.06)
    if abs(x - PX) < 0.05 and z < G + 0.25:
        continue
    b = ball(f'carving{k}', M['carving'], 0, 0, 0, rng.uniform(0.012, 0.022), outline=0.002)
    b.scale = (1.0, 0.6, 1.0)
    b.location = (x, FY - 0.074, z)
# the second portal, the hospital's, more geometric
QX = CX + 0.25
box('hospitalportal', M['carving'], QX, FY - 0.025, G - 0.005, 0.18, 0.05, H + 0.04, outline=0.005, bevel=0)
box('hospitalniche', M['dark'], QX, FY - 0.052, G - 0.005, 0.06, 0.006, 0.15, outline=0, bevel=0)
for j in range(4):
    for i in range(2):
        cyl(f'star{j}{i}', M['stoneDark'], 0.014, 0.006, segs=8, outline=0, matrix=Matrix.Translation((QX - 0.06 + i * 0.12, FY - 0.053, G + 0.05 + j * 0.06)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the hospital's conical stone roof over its dome
lathe('hospitaldrum', M['stone'], ((0.11, 0), (0.11, 0.06)), G + H - 0.005, CX + 0.22, CY + 0.05, segs=8, outline=0.004, smooth=False)
lathe('hospitalcone', M['stoneDark'], ((0.12, 0), (0.003, 0.16)), G + H + 0.055, CX + 0.22, CY + 0.05, segs=8, outline=0.004, smooth=False)
lathe('mosquecone', M['stoneDark'], ((0.09, 0), (0.003, 0.13)), G + H + 0.005, CX - 0.2, CY + 0.12, segs=8, outline=0.003, smooth=False)
# the octagonal brick minaret
MX, MY = CX - 0.4, CY - 0.18
lathe('minaret', M['brick'], ((0.045, 0), (0.04, 0.6)), G - 0.005, MX, MY, segs=8, outline=0.004, smooth=False)
lathe('minaretbalcony', M['stoneDark'], ((0.042, 0), (0.06, 0.015), (0.06, 0.025)), G + 0.48, MX, MY, segs=8, outline=0.002, smooth=False)
lathe('minaretcap', M['stoneDark'], ((0.04, 0), (0.003, 0.12)), G + 0.595, MX, MY, segs=8, outline=0.002, smooth=False)

# ---------- the town's flat roofs below and the poplars ----------
for k, (x, y) in enumerate(((-0.7, -0.5), (-0.4, -0.75), (0.0, -0.7), (0.4, -0.75), (0.7, -0.45), (0.85, 0.1), (-0.85, 0.2))):
    h = rng.uniform(0.08, 0.13)
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.2, 0.16, h, outline=0.004, bevel=0)
    box(f'housewin{k}', M['dark'], x, y - 0.083, G + h * 0.45, 0.03, 0.006, 0.03, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.6, 0.65), (0.6, 0.65), (0.2, -0.45))):
    t = ball(f'tree{k}', M['tree'], 0, 0, 0, 0.07, outline=0.008)
    t.scale = (0.8, 0.8, 1.8)
    t.location = (x, y, G + 0.14)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
