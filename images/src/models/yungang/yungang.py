# A cartoon Yungang Grottoes for the country maps, built in the set's shared look (../toon.py): the
# sandstone cliff near Datong honeycombed with caves and niches of carved Buddhas, the great seated
# Buddha of Cave 20 in the open with his broad shoulders, his hands in his lap and his calm face, the
# wooden temple fronts built against the cliff over other caves, and the willows at its foot. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P yungang.py -- yungang-1024.png 1024 yungang.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c8a0', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'cliff': toon('cliff', '#c8a878', shadow_mul=(0.86, 0.8, 0.76), lift=0.1),
    'cliffDark': toon('cliffDark', '#a8885e'),
    'buddha': toon('buddha', '#d4b484', shadow_mul=(0.86, 0.8, 0.76), lift=0.12),
    'cave': flat('cave', '#3a2e24'),
    'red': toon('red', '#b8402e', lift=0.08),
    'tile': toon('tile', '#5a5e66'),
    'willow': toon('willow', '#8ab84a', shadow_mul=(0.72, 0.8, 0.74)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(460)

# ---------- the cliff along the back ----------
CY, CH = 0.05, 0.62
box('cliff', M['cliff'], 0, CY + 0.3, G - 0.005, 1.9, 0.6, CH, outline=0.009, bevel=0)
for k in range(14):
    ball(f'cliffedge{k}', M['cliffDark'], -0.9 + k * 0.14, CY + rng.uniform(0.1, 0.5), G + CH - 0.02, rng.uniform(0.05, 0.09), outline=0.004)
# rows of small niches with their little Buddhas
for row in range(3):
    for j in range(16):
        x = -0.86 + j * 0.115
        if abs(x) < 0.32:
            continue
        z = G + 0.1 + row * 0.16
        box(f'niche{row}{j}', M['cave'], x, CY - 0.003, z, 0.06, 0.006, 0.08, outline=0, bevel=0)
        cyl(f'nichetop{row}{j}', M['cave'], 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, CY - 0.003, z + 0.08)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        rod(f'smallbuddha{row}{j}', M['buddha'], (x, CY - 0.006, z), (x, CY - 0.006, z + 0.06), 0.014, r2=0.008, segs=6, outline=0.001)
        ball(f'smallbuddhahead{row}{j}', M['buddha'], x, CY - 0.008, z + 0.07, 0.01, outline=0.001)

# ---------- the great Buddha of Cave 20, in the open ----------
BX, BY = 0.0, CY - 0.02
box('alcove', M['cliffDark'], BX, CY + 0.02, G - 0.005, 0.62, 0.04, CH - 0.04, outline=0.004, bevel=0)
cyl('halo', M['cliffDark'], 0.2, 0.01, segs=24, outline=0.002, matrix=Matrix.Translation((BX, CY - 0.0, G + 0.42)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# his crossed legs, body and robe, shoulders, hands in his lap
legs = ball('legs', M['buddha'], 0, 0, 0, 0.1, outline=0.006)
legs.scale = (2.2, 1.0, 0.6)
legs.location = (BX, BY - 0.1, G + 0.06)
rod('body', M['buddha'], (BX, BY - 0.02, G + 0.08), (BX, BY - 0.02, G + 0.34), 0.13, r2=0.1, segs=16, outline=0.007)
for s in (-1, 1):
    ball(f'shoulder{s}', M['buddha'], BX + s * 0.11, BY - 0.02, G + 0.31, 0.06, outline=0.004)
    bar(f'arm{s}', M['buddha'], (BX + s * 0.14, BY - 0.04, G + 0.3), (BX + s * 0.06, BY - 0.12, G + 0.14), 0.06, outline=0.004)
hands = ball('hands', M['buddha'], 0, 0, 0, 0.05, outline=0.004)
hands.scale = (1.4, 0.8, 0.6)
hands.location = (BX, BY - 0.13, G + 0.14)
# the head with its long ears and topknot
head = ball('head', M['buddha'], 0, 0, 0, 0.075, outline=0.005)
head.scale = (0.95, 0.95, 1.12)
head.location = (BX, BY - 0.02, G + 0.43)
for s in (-1, 1):
    ear = ball(f'ear{s}', M['buddha'], 0, 0, 0, 0.022, outline=0.002)
    ear.scale = (0.5, 0.6, 1.6)
    ear.location = (BX + s * 0.074, BY - 0.02, G + 0.42)
ball('topknot', M['buddha'], BX, BY - 0.02, G + 0.52, 0.04, outline=0.003)
for s in (-1, 1):
    box(f'eye{s}', M['cliffDark'], BX + s * 0.025, BY - 0.09, G + 0.445, 0.025, 0.004, 0.006, outline=0, bevel=0)

# ---------- the wooden temple fronts against the cliff ----------
for s in (-1, 1):
    x = s * 0.6
    box(f'templefront{s}', M['red'], x, CY - 0.06, G - 0.005, 0.26, 0.12, 0.36, outline=0.006, bevel=0)
    for k in range(3):
        z = G + 0.11 + k * 0.11
        loft(f'templeeave{s}{k}', M['tile'], [[(x - 0.16, CY - 0.14, z), (x + 0.16, CY - 0.14, z), (x + 0.16, CY + 0.0, z), (x - 0.16, CY + 0.0, z)],
                                               [(x - 0.13, CY - 0.06, z + 0.04), (x + 0.13, CY - 0.06, z + 0.04), (x + 0.13, CY + 0.0, z + 0.04), (x - 0.13, CY + 0.0, z + 0.04)]], outline=0.003)
    loft(f'templeroof{s}', M['tile'], [[(x - 0.16, CY - 0.14, G + 0.355), (x + 0.16, CY - 0.14, G + 0.355), (x + 0.16, CY + 0.02, G + 0.355), (x - 0.16, CY + 0.02, G + 0.355)],
                                       [(x - 0.1, CY - 0.06, G + 0.43), (x + 0.1, CY - 0.06, G + 0.43), (x + 0.1, CY - 0.04, G + 0.43), (x - 0.1, CY - 0.04, G + 0.43)]], outline=0.004)

# ---------- willows ----------
for k, (x, y) in enumerate(((-0.8, -0.45), (-0.45, -0.75), (0.45, -0.75), (0.8, -0.45))):
    rod(f'willowtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.014, segs=6, outline=0.002)
    w = ball(f'willow{k}', M['willow'], 0, 0, 0, 0.1, outline=0.01)
    w.scale = (1.0, 1.0, 1.3)
    w.location = (x, y, G + 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
