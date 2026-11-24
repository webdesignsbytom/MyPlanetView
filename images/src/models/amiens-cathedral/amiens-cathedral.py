# A cartoon Amiens Cathedral for the country maps, built in the set's shared look (../toon.py):
# France's largest Gothic cathedral, its west front with three deep portals under pointed gables,
# the gallery of kings and the rose window between two towers of different heights, the very tall
# nave and choir with their flying buttresses, the high lead roof, and the slender gilded spire over
# the crossing. Turned a little towards the camera.
# Run: blender -b --factory-startup -P amiens-cathedral.py -- amiens-cathedral-1024.png 1024 amiens-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'stone': toon('stone', '#e0d4b4', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'stoneDark': toon('stoneDark', '#c0b290'),
    'lead': toon('lead', '#6a7480', shadow_mul=(0.84, 0.86, 0.92)),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'window': flat('window', '#3a3a48'),
    'rose': flat('rose', '#4a5a9a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

NY0, NY1, NW, NH = -0.2, 0.62, 0.24, 0.38
box('aisles', M['stone'], 0.0, (NY0 + NY1) / 2, G - 0.005, 0.42, NY1 - NY0, 0.16, outline=0.008, bevel=0)
box('nave', M['stone'], 0.0, (NY0 + NY1) / 2, G - 0.005, NW, NY1 - NY0, NH, outline=0.008, bevel=0)
loft('naveroof', M['lead'], [[(-NW / 2 - 0.005, NY0, G + NH - 0.005), (NW / 2 + 0.005, NY0, G + NH - 0.005), (NW / 2 + 0.005, NY1, G + NH - 0.005), (-NW / 2 - 0.005, NY1, G + NH - 0.005)],
                             [(-0.004, NY0, G + NH + 0.15), (0.004, NY0, G + NH + 0.15), (0.004, NY1, G + NH + 0.15), (-0.004, NY1, G + NH + 0.15)]], outline=0.006)
box('transept', M['stone'], 0.0, 0.24, G - 0.005, 0.54, 0.13, NH, outline=0.008, bevel=0)
loft('transeptroof', M['lead'], [[(-0.27, 0.175, G + NH - 0.005), (0.27, 0.175, G + NH - 0.005), (0.27, 0.305, G + NH - 0.005), (-0.27, 0.305, G + NH - 0.005)],
                                 [(-0.27, 0.236, G + NH + 0.15), (0.27, 0.236, G + NH + 0.15), (0.27, 0.244, G + NH + 0.15), (-0.27, 0.244, G + NH + 0.15)]], outline=0.005)
lathe('apse', M['stone'], ((0.12, 0), (0.12, NH)), G - 0.005, 0.0, NY1, segs=10, outline=0.007, smooth=False)
lathe('apseroof', M['lead'], ((0.125, 0), (0.004, 0.15)), G + NH - 0.005, 0.0, NY1, segs=10, outline=0.005, smooth=False)
lathe('spire', M['lead'], ((0.035, 0), (0.03, 0.08), (0.018, 0.22), (0.004, 0.42)), G + NH + 0.13, 0.0, 0.24, segs=8, outline=0.004, smooth=False)
ball('spireball', M['gold'], 0.0, 0.24, G + NH + 0.55, 0.012, outline=0)
for s in (-1, 1):
    for j in range(6):
        y = NY0 + 0.08 + j * 0.13
        if abs(y - 0.24) < 0.08:
            continue
        box(f'buttress{s}{j}', M['stoneDark'], s * 0.2, y, G - 0.005, 0.03, 0.03, 0.22, outline=0.002, bevel=0)
        for k, (z0, z1) in enumerate(((0.2, 0.29), (0.15, 0.24))):
            bar(f'flyer{s}{j}{k}', M['stoneDark'], (s * 0.2, y, G + z0 + 0.02), (s * 0.12, y, G + z1 + 0.06), 0.016, outline=0.001)
        lathe(f'pinnacle{s}{j}', M['stoneDark'], ((0.015, 0), (0.004, 0.07)), G + 0.215, s * 0.2, y, segs=4, outline=0.001, smooth=False)
        box(f'clerestory{s}{j}', M['window'], s * 0.122, y - 0.06, G + 0.2, 0.006, 0.04, 0.14, outline=0, bevel=0)

# ---------- the west front ----------
FY = NY0 - 0.04
box('front', M['stone'], 0.0, FY, G - 0.005, 0.42, 0.08, 0.4, outline=0.008, bevel=0)
for x, w in ((-0.135, 0.07), (0.0, 0.09), (0.135, 0.07)):
    box(f'portal{x}', M['window'], x, FY - 0.042, G - 0.005, w, 0.006, 0.1, outline=0, bevel=0)
    cyl(f'portaltop{x}', M['window'], w / 2, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, FY - 0.042, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    loft(f'gable{x}', M['stone'], [[(x - w / 2 - 0.015, FY - 0.06, G + 0.12), (x + w / 2 + 0.015, FY - 0.06, G + 0.12), (x + w / 2 + 0.015, FY - 0.04, G + 0.12), (x - w / 2 - 0.015, FY - 0.04, G + 0.12)],
                                   [(x - 0.004, FY - 0.06, G + 0.2), (x + 0.004, FY - 0.06, G + 0.2), (x + 0.004, FY - 0.04, G + 0.2), (x - 0.004, FY - 0.04, G + 0.2)]], outline=0.003)
for j in range(16):
    lathe(f'king{j}', M['stoneDark'], ((0.008, 0), (0.006, 0.03)), G + 0.21, -0.185 + j * 0.0247, FY - 0.044, segs=6, outline=0)
cyl('rosering', M['stoneDark'], 0.065, 0.008, segs=24, outline=0.002, matrix=Matrix.Translation((0.0, FY - 0.042, G + 0.31)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('rose', M['rose'], 0.055, 0.008, segs=24, outline=0, matrix=Matrix.Translation((0.0, FY - 0.046, G + 0.31)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s, h in ((-1, 0.2), (1, 0.15)):
    tx = s * 0.15
    box(f'tower{s}', M['stone'], tx, FY + 0.01, G + 0.395, 0.12, 0.11, h, outline=0.007, bevel=0)
    for j in range(2):
        box(f'belfry{s}{j}', M['window'], tx - 0.028 + j * 0.056, FY - 0.047, G + 0.42, 0.022, 0.006, h - 0.05, outline=0, bevel=0)
    box(f'towertop{s}', M['stoneDark'], tx, FY + 0.01, G + 0.39 + h, 0.13, 0.12, 0.015, outline=0.002, bevel=0)

for k, (x, y, r) in enumerate(((-0.75, -0.4, 0.11), (0.75, -0.42, 0.11), (-0.7, 0.45, 0.1), (0.72, 0.5, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
