# A cartoon Independence Hall for the country maps, built in the set's shared look (../toon.py):
# Philadelphia's red-brick State House where the Declaration was signed, its white trim and rows of
# windows, the tall tower with its clock and white steeple, the arcaded wings, and the Liberty Bell
# with its crack on a stand on the lawn in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P independence-hall.py -- independence-hall-1024.png 1024 independence-hall.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d8d0c0', lift=0.15),
    'brick': toon('brick', '#b8583a', shadow_mul=(0.86, 0.76, 0.72)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'roof': toon('roof', '#5a5058'),
    'window': flat('window', '#2e3a54'),
    'clock': toon('clock', '#f8f6f0', lift=0.2),
    'hands': flat('hands', '#2e2a30'),
    'bell': toon('bell', '#8a6a3a', shadow_mul=(0.86, 0.8, 0.76), lift=0.1),
    'crack': flat('crack', '#2e2420'),
    'wood': toon('wood', '#6a4a30'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

box('walk', M['path'], 0.0, -0.4, G - 0.004, 0.2, 0.7, 0.01, outline=0.003, bevel=0)

# ---------- the State House ----------
HX, HY = 0.0, 0.35
box('hall', M['brick'], HX, HY, G - 0.005, 0.7, 0.3, 0.26, outline=0.011, bevel=0)
for r in range(2):
    for j in range(7):
        x = HX - 0.3 + j * 0.1
        if r == 0 and j == 3:
            continue
        box(f'win{r}{j}', M['window'], x, HY - 0.152, G + 0.04 + r * 0.12, 0.04, 0.006, 0.08, outline=0, bevel=0)
        box(f'winframe{r}{j}', M['white'], x, HY - 0.153, G + 0.035 + r * 0.12, 0.05, 0.004, 0.09, outline=0, bevel=0)
box('door', M['white'], HX, HY - 0.153, G - 0.005, 0.08, 0.006, 0.12, outline=0, bevel=0)
box('doorinner', M['window'], HX, HY - 0.156, G, 0.05, 0.004, 0.09, outline=0, bevel=0)
box('cornice', M['white'], HX, HY, G + 0.25, 0.72, 0.32, 0.02, outline=0.004, bevel=0)
loft('roof', M['roof'], [[(HX - 0.36, HY - 0.16, G + 0.27), (HX + 0.36, HY - 0.16, G + 0.27), (HX + 0.36, HY + 0.16, G + 0.27), (HX - 0.36, HY + 0.16, G + 0.27)],
                         [(HX - 0.3, HY - 0.004, G + 0.36), (HX + 0.3, HY - 0.004, G + 0.36), (HX + 0.3, HY + 0.004, G + 0.36), (HX - 0.3, HY + 0.004, G + 0.36)]], outline=0.007)
for s in (-1, 1):
    box(f'chimney{s}', M['brick'], HX + s * 0.25, HY, G + 0.3, 0.05, 0.12, 0.1, outline=0.004, bevel=0)
# the tower behind, with its clock and steeple
TX, TY = HX, HY + 0.22
box('tower', M['brick'], TX, TY, G - 0.005, 0.18, 0.16, 0.5, outline=0.009, bevel=0)
box('towerwin', M['window'], TX, TY - 0.082, G + 0.38, 0.05, 0.006, 0.08, outline=0, bevel=0)
box('towercornice', M['white'], TX, TY, G + 0.49, 0.2, 0.18, 0.02, outline=0.004, bevel=0)
lathe('steeple1', M['white'], ((0.08, 0), (0.08, 0.1)), G + 0.51, TX, TY, segs=8, outline=0.006, smooth=False)
cyl('clockface', M['clock'], 0.045, 0.008, segs=18, outline=0.003, matrix=Matrix.Translation((TX, TY - 0.08, G + 0.56)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for a in (0.3, 1.9):
    bar(f'clockhand{a}', M['hands'], (TX, TY - 0.09, G + 0.56), (TX + 0.03 * math.cos(a), TY - 0.09, G + 0.56 + 0.03 * math.sin(a)), 0.004, outline=0)
lathe('steeple2', M['white'], ((0.06, 0), (0.06, 0.08)), G + 0.61, TX, TY, segs=8, outline=0.005, smooth=False)
lathe('steeple3', M['white'], ((0.04, 0), (0.035, 0.06)), G + 0.69, TX, TY, segs=8, outline=0.004, smooth=False)
lathe('spire', M['white'], ((0.025, 0), (0.004, 0.14)), G + 0.75, TX, TY, segs=8, outline=0.003, smooth=False)
# the wings and their arcades
for s in (-1, 1):
    box(f'wing{s}', M['brick'], HX + s * 0.6, HY, G - 0.005, 0.24, 0.2, 0.18, outline=0.008, bevel=0)
    pyramid(f'wingroof{s}', M['roof'], HX + s * 0.6, HY, G + 0.175, 0.26, 0.07, outline=0.005)
    box(f'arcade{s}', M['brick'], HX + s * 0.42, HY + 0.02, G - 0.005, 0.12, 0.12, 0.12, outline=0.005, bevel=0)
    box(f'arcadearch{s}', M['window'], HX + s * 0.42, HY - 0.042, G - 0.005, 0.06, 0.006, 0.08, outline=0, bevel=0)

# ---------- the Liberty Bell ----------
LX, LY = 0.0, -0.35
for s in (-1, 1):
    bar(f'bellpost{s}', M['wood'], (LX + s * 0.1, LY, G), (LX + s * 0.1, LY, G + 0.24), 0.025, outline=0.003)
bar('bellyoke', M['wood'], (LX - 0.12, LY, G + 0.25), (LX + 0.12, LY, G + 0.25), 0.035, outline=0.003)
lathe('bell', M['bell'], ((0.1, 0), (0.095, 0.02), (0.07, 0.08), (0.055, 0.15), (0.03, 0.17)), G + 0.06, LX, LY, segs=24, outline=0.006)
bar('bellcrack', M['crack'], (LX - 0.01, LY - 0.088, G + 0.08), (LX + 0.012, LY - 0.065, G + 0.17), 0.008, outline=0)

for k, (x, y) in enumerate(((-0.85, -0.25), (0.85, -0.25), (-0.6, -0.7), (0.6, -0.7))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.009)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
