# A cartoon Bremen Roland for the country maps, built in the set's shared look (../toon.py): the
# tall stone Roland on his stepped pedestal in the market square, sword raised upright in his right
# hand and the eagle shield on his left, under his little Gothic canopy, in front of the Town Hall's
# Weser Renaissance front with its arcade and ornate stepped gables under the green copper roof, and
# the cathedral's twin spires behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bremen-roland.py -- bremen-roland-1024.png 1024 bremen-roland.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'square': toon('square', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'brick': toon('brick', '#9a4a34', shadow_mul=(0.86, 0.78, 0.76)),
    'stone': toon('stone', '#e8dcc0', shadow_mul=(0.86, 0.84, 0.82), lift=0.12),
    'copper': toon('copper', '#5aa88a', lift=0.12),
    'window': flat('window', '#3a4050'),
    'roland': toon('roland', '#d8d2c4', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'rolandDark': toon('rolandDark', '#b0a898'),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'eagle': flat('eagle', '#3a3430'),
    'tower': toon('tower', '#a89a80', shadow_mul=(0.86, 0.84, 0.82)),
})

G = tile(M['square'])
before = set(bpy.data.objects)

# ---------- the cathedral's twin spires ----------
for k, x in enumerate((-0.66, -0.44)):
    box(f'domtower{k}', M['tower'], x, 0.86, G - 0.005, 0.13, 0.13, 0.55, outline=0.007, bevel=0)
    box(f'domwin{k}', M['window'], x, 0.793, G + 0.42, 0.04, 0.006, 0.08, outline=0, bevel=0)
    lathe(f'domspire{k}', M['copper'], ((0.085, 0), (0.004, 0.3)), G + 0.545, x, 0.86, segs=8, outline=0.005, smooth=False)

# ---------- the Town Hall ----------
HY = 0.5
box('hall', M['brick'], 0.0, HY, G - 0.005, 1.3, 0.3, 0.25, outline=0.01, bevel=0)
FY = HY - 0.15
box('arcade', M['stone'], 0.0, FY - 0.02, G - 0.005, 1.1, 0.04, 0.1, outline=0.005, bevel=0)
for j in range(11):
    x = -0.5 + j * 0.1
    box(f'arch{j}', M['window'], x, FY - 0.042, G - 0.005, 0.05, 0.006, 0.055, outline=0, bevel=0)
    cyl(f'archtop{j}', M['window'], 0.025, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, FY - 0.042, G + 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'upperwin{j}', M['window'], x, FY - 0.003, G + 0.13, 0.04, 0.006, 0.08, outline=0, bevel=0)
box('balustrade', M['stone'], 0.0, FY - 0.03, G + 0.095, 1.12, 0.05, 0.025, outline=0.002, bevel=0)
loft('hallroof', M['copper'], [[(-0.66, HY - 0.16, G + 0.24), (0.66, HY - 0.16, G + 0.24), (0.66, HY + 0.16, G + 0.24), (-0.66, HY + 0.16, G + 0.24)],
                               [(-0.62, HY - 0.01, G + 0.44), (0.62, HY - 0.01, G + 0.44), (0.62, HY + 0.01, G + 0.44), (-0.62, HY + 0.01, G + 0.44)]], outline=0.008)


def gable(name, x, w):
    for k, (z, f, h) in enumerate(((G + 0.24, 1.0, 0.08), (G + 0.32, 0.7, 0.08), (G + 0.4, 0.42, 0.07))):
        box(f'{name}step{k}', M['stone'], x, FY + 0.01, z - 0.005, w * f, 0.05, h, outline=0.004, bevel=0)
        box(f'{name}win{k}', M['window'], x, FY - 0.017, z + 0.015, 0.035, 0.006, h * 0.55, outline=0, bevel=0)
        for s in (-1, 1):
            rod(f'{name}pinnacle{k}{s}', M['stone'], (x + s * w * f / 2, FY - 0.01, z + h - 0.005), (x + s * w * f / 2, FY - 0.01, z + h + 0.04), 0.008, segs=6, outline=0.001)
    rod(f'{name}finial', M['gold'], (x, FY + 0.01, G + 0.465), (x, FY + 0.01, G + 0.53), 0.008, segs=6, outline=0.001)


gable('middle', 0.0, 0.3)
for s in (-1, 1):
    gable(f'side{s}', s * 0.4, 0.22)

# ---------- the Roland ----------
RX, RY = 0.08, -0.3
for k, (z, w, h) in enumerate(((G - 0.005, 0.28, 0.045), (G + 0.04, 0.21, 0.05), (G + 0.09, 0.15, 0.07))):
    box(f'pedestal{k}', M['rolandDark'], RX, RY, z, w, w, h, outline=0.004, bevel=0)
Z = G + 0.16
# the pillar and canopy behind him
box('pillar', M['rolandDark'], RX, RY + 0.06, Z - 0.005, 0.07, 0.04, 0.56, outline=0.004, bevel=0)
box('canopy', M['roland'], RX, RY + 0.01, Z + 0.5, 0.17, 0.13, 0.04, outline=0.004, bevel=0)
lathe('canopyspire', M['roland'], ((0.065, 0), (0.004, 0.15)), Z + 0.535, RX, RY + 0.01, segs=8, outline=0.003, smooth=False)
for sx in (-1, 1):
    rod(f'canopypinnacle{sx}', M['roland'], (RX + sx * 0.075, RY - 0.05, Z + 0.535), (RX + sx * 0.075, RY - 0.05, Z + 0.6), 0.01, segs=6, outline=0.001)
# legs and feet
for s in (-1, 1):
    rod(f'leg{s}', M['roland'], (RX + s * 0.026, RY, Z), (RX + s * 0.026, RY, Z + 0.19), 0.023, segs=8, outline=0.003)
    box(f'foot{s}', M['roland'], RX + s * 0.026, RY - 0.015, Z - 0.005, 0.04, 0.06, 0.025, outline=0.002, bevel=0)
# the armoured body and cloak
lathe('body', M['roland'], ((0.062, 0), (0.056, 0.06), (0.06, 0.14), (0.072, 0.2), (0.04, 0.22)), Z + 0.17, RX, RY, segs=14, outline=0.004)
lathe('belt', M['rolandDark'], ((0.06, 0), (0.06, 0.015)), Z + 0.23, RX, RY, segs=14, outline=0.001)
lathe('cloak', M['rolandDark'], ((0.07, 0), (0.08, 0.2)), Z + 0.15, RX, RY + 0.03, segs=14, outline=0.003)
ball('head', M['roland'], RX, RY, Z + 0.43, 0.042, outline=0.004)
lathe('crown', M['gold'], ((0.034, 0), (0.04, 0.03)), Z + 0.455, RX, RY, segs=10, outline=0.002)
# the right arm and the sword held upright
rod('rightarm', M['roland'], (RX - 0.07, RY, Z + 0.36), (RX - 0.085, RY - 0.06, Z + 0.24), 0.018, segs=8, outline=0.002)
bar('swordgrip', M['rolandDark'], (RX - 0.09, RY - 0.075, Z + 0.17), (RX - 0.09, RY - 0.075, Z + 0.25), 0.014, outline=0.001)
bar('swordguard', M['rolandDark'], (RX - 0.13, RY - 0.075, Z + 0.25), (RX - 0.05, RY - 0.075, Z + 0.25), 0.016, outline=0.001)
bar('swordblade', M['roland'], (RX - 0.09, RY - 0.075, Z + 0.25), (RX - 0.09, RY - 0.075, Z + 0.56), 0.016, outline=0.002)
# the shield with the eagle on his left
box('shield', M['roland'], RX + 0.05, RY - 0.08, Z + 0.17, 0.1, 0.016, 0.15, outline=0.003, bevel=0)
lathe('shieldpoint', M['roland'], ((0.05, 0), (0.004, 0.05)), Z + 0.12, RX + 0.05, RY - 0.08, segs=4, outline=0.002, smooth=False)
box('eagle', M['eagle'], RX + 0.05, RY - 0.089, Z + 0.22, 0.05, 0.004, 0.06, outline=0, bevel=0)

turn(before, -20)
render(G)
