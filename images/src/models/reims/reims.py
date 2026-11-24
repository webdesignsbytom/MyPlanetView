# A cartoon Reims Cathedral for the country maps, built in the set's shared look (../toon.py): the
# coronation cathedral of the kings of France, its west front with the two flat-topped towers, the
# great rose window over the three deep gabled portals, the gallery of kings and the pinnacles, the
# long nave behind with its flying buttresses, and the square in front. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P reims.py -- reims-1024.png 1024 reims.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'square': toon('square', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'stone': toon('stone', '#e8dcc4', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'stoneDark': toon('stoneDark', '#c4b498', shadow_mul=(0.84, 0.82, 0.86)),
    'rose': toon('rose', '#2f5ab0', lift=0.2),
    'roseRed': toon('roseRed', '#c4402c', lift=0.15),
    'door': flat('door', '#2e2a28'),
    'roof': toon('roof', '#5a6068'),
    'window': flat('window', '#3a4660'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['square'])
before = set(bpy.data.objects)

FX, FY = 0.0, -0.05
W = 0.72
# ---------- the nave and its buttresses behind ----------
box('nave', M['stone'], FX, FY + 0.5, G - 0.005, 0.38, 0.75, 0.42, outline=0.011, bevel=0)
loft('naveroof', M['roof'], [[(FX - 0.2, FY + 0.12, G + 0.415), (FX + 0.2, FY + 0.12, G + 0.415), (FX + 0.2, FY + 0.88, G + 0.415), (FX - 0.2, FY + 0.88, G + 0.415)],
                             [(FX - 0.004, FY + 0.12, G + 0.55), (FX + 0.004, FY + 0.12, G + 0.55), (FX + 0.004, FY + 0.88, G + 0.55), (FX - 0.004, FY + 0.88, G + 0.55)]], outline=0.008)
for j in range(5):
    y = FY + 0.2 + j * 0.15
    for s in (-1, 1):
        box(f'buttress{j}{s}', M['stoneDark'], FX + s * 0.3, y, G - 0.005, 0.06, 0.04, 0.3, outline=0.004, bevel=0)
        bar(f'flyer{j}{s}', M['stoneDark'], (FX + s * 0.3, y, G + 0.3), (FX + s * 0.19, y, G + 0.4), 0.025, outline=0.003)
        lathe(f'buttresspin{j}{s}', M['stone'], ((0.02, 0), (0.004, 0.07)), G + 0.295, FX + s * 0.3, y, segs=5, outline=0.002, smooth=False)
        box(f'navewin{j}{s}', M['window'], FX + s * 0.191, y, G + 0.22, 0.006, 0.06, 0.15, outline=0, bevel=0)

# ---------- the west front ----------
box('front', M['stone'], FX, FY, G - 0.005, W, 0.16, 0.5, outline=0.012, bevel=0)
for j, (x, w, h) in enumerate(((-0.24, 0.14, 0.18), (0.0, 0.18, 0.22), (0.24, 0.14, 0.18))):
    box(f'portal{j}', M['door'], FX + x, FY - 0.082, G - 0.005, w * 0.55, 0.006, h * 0.75, outline=0, bevel=0)
    box(f'portalframe{j}', M['stoneDark'], FX + x, FY - 0.09, G - 0.005, w, 0.02, h, outline=0.004, bevel=0)
    loft(f'gable{j}', M['stone'], [[(FX + x - w / 2, FY - 0.1, G + h - 0.005), (FX + x + w / 2, FY - 0.1, G + h - 0.005), (FX + x + w / 2, FY - 0.08, G + h - 0.005), (FX + x - w / 2, FY - 0.08, G + h - 0.005)],
                                   [(FX + x - 0.004, FY - 0.1, G + h + w * 0.7), (FX + x + 0.004, FY - 0.1, G + h + w * 0.7), (FX + x + 0.004, FY - 0.08, G + h + w * 0.7), (FX + x - 0.004, FY - 0.08, G + h + w * 0.7)]],
         outline=0.004)
cyl('rosewindow', M['rose'], 0.09, 0.008, segs=22, outline=0.004, matrix=Matrix.Translation((FX, FY - 0.083, G + 0.36)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('rosecentre', M['roseRed'], 0.035, 0.004, segs=14, outline=0, matrix=Matrix.Translation((FX, FY - 0.09, G + 0.36)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(8):
    a = math.pi * j / 4
    bar(f'rosespoke{j}', M['stone'], (FX + 0.035 * math.cos(a), FY - 0.092, G + 0.36 + 0.035 * math.sin(a)), (FX + 0.085 * math.cos(a), FY - 0.092, G + 0.36 + 0.085 * math.sin(a)), 0.008, outline=0)
for j in range(9):
    box(f'king{j}', M['stoneDark'], FX - 0.28 + j * 0.07, FY - 0.082, G + 0.47, 0.03, 0.006, 0.05, outline=0, bevel=0)
# the two towers
for s in (-1, 1):
    TX = FX + s * 0.25
    box(f'tower{s}', M['stone'], TX, FY + 0.01, G + 0.495, 0.2, 0.16, 0.28, outline=0.009, bevel=0)
    for j in range(2):
        box(f'towerwin{s}{j}', M['window'], TX - 0.04 + j * 0.08, FY - 0.072, G + 0.55, 0.04, 0.006, 0.18, outline=0, bevel=0)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        lathe(f'towerpin{s}{k}', M['stone'], ((0.02, 0), (0.004, 0.09)), G + 0.77, TX + 0.09 * math.cos(a), FY + 0.01 + 0.075 * math.sin(a), segs=5, outline=0.002, smooth=False)
for j in range(4):
    lathe(f'frontpin{j}', M['stone'], ((0.018, 0), (0.004, 0.1)), G + 0.49, FX - 0.33 + j * 0.22, FY - 0.07, segs=5, outline=0.002, smooth=False)

for k, (x, y) in enumerate(((-0.85, -0.45), (0.85, -0.45), (-0.95, 0.1), (0.95, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.009)

turn(before, -20)
render(G)
