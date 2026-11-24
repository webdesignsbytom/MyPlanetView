# A cartoon Westminster Abbey for the country maps, built in the set's shared look (../toon.py): the
# west front's two square towers with their pinnacles and the great west window between them, the
# long Gothic nave behind with its flying buttresses and steep lead roof, the north transept's rose
# window, the low lantern tower over the crossing, and the lawn and trees before it. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P westminster-abbey.py -- westminster-abbey-1024.png 1024 westminster-abbey.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#ddd2b6', shadow_mul=(0.86, 0.82, 0.82), lift=0.15),
    'stoneDark': toon('stoneDark', '#bfb294', shadow_mul=(0.86, 0.82, 0.82)),
    'lead': toon('lead', '#7a8290', shadow_mul=(0.8, 0.84, 0.9)),
    'window': flat('window', '#3a3a50'),
    'paving': toon('paving', '#c8c0b0'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile()
before = set(bpy.data.objects)

# The church runs front to back: the west front faces the camera (-y)
NW, NH = 0.3, 0.3          # the nave's width and wall height
Y0, Y1 = -0.15, 0.95       # the nave from the west front to the apse
box('path', M['paving'], 0, -0.6, G - 0.004, 0.3, 0.9, 0.01, outline=0.002, bevel=0)

# ---------- the nave and its roof ----------
box('nave', M['stone'], 0, (Y0 + Y1) / 2, G - 0.005, NW, Y1 - Y0, NH, outline=0.009, bevel=0)
loft('naveroof', M['lead'], [[(-NW / 2, Y0, G + NH - 0.005), (NW / 2, Y0, G + NH - 0.005), (NW / 2, Y1, G + NH - 0.005), (-NW / 2, Y1, G + NH - 0.005)],
                             [(-0.004, Y0, G + NH + 0.12), (0.004, Y0, G + NH + 0.12), (0.004, Y1, G + NH + 0.12), (-0.004, Y1, G + NH + 0.12)]], outline=0.006)
for s in (-1, 1):
    box(f'aisle{s}', M['stone'], s * (NW / 2 + 0.07), (Y0 + Y1) / 2 + 0.02, G - 0.005, 0.14, Y1 - Y0 - 0.06, 0.15, outline=0.006, bevel=0)
    loft(f'aisleroof{s}', M['lead'], [[(s * NW / 2, Y0 + 0.05, G + 0.145), (s * (NW / 2 + 0.14), Y0 + 0.05, G + 0.145), (s * (NW / 2 + 0.14), Y1 - 0.01, G + 0.145), (s * NW / 2, Y1 - 0.01, G + 0.145)][::(1 if s > 0 else -1)],
                                      [(s * NW / 2, Y0 + 0.05, G + 0.19), (s * (NW / 2 + 0.003), Y0 + 0.05, G + 0.19), (s * (NW / 2 + 0.003), Y1 - 0.01, G + 0.19), (s * NW / 2, Y1 - 0.01, G + 0.19)][::(1 if s > 0 else -1)]], outline=0.003)
    for j in range(8):
        y = Y0 + 0.12 + j * 0.11
        if 0.34 < y < 0.52:
            continue
        # the flying buttresses and the clerestory windows
        bar(f'buttress{s}{j}', M['stoneDark'], (s * (NW / 2 + 0.14), y, G + 0.15), (s * NW / 2, y, G + NH - 0.03), 0.02, outline=0.002)
        box(f'pier{s}{j}', M['stoneDark'], s * (NW / 2 + 0.14), y, G - 0.005, 0.03, 0.03, 0.2, outline=0.002, bevel=0)
        lathe(f'pinnacle{s}{j}', M['stoneDark'], ((0.015, 0), (0.002, 0.05)), G + 0.195, s * (NW / 2 + 0.14), y, segs=4, outline=0.001, smooth=False)
        box(f'clerestory{s}{j}', M['window'], s * (NW / 2 + 0.003), y + 0.05, G + 0.2, 0.006, 0.04, 0.08, outline=0, bevel=0)
        box(f'aislewin{s}{j}', M['window'], s * (NW / 2 + 0.143), y + 0.05, G + 0.03, 0.006, 0.04, 0.08, outline=0, bevel=0)

# ---------- the transepts and the crossing ----------
TY = 0.43
box('transept', M['stone'], 0, TY, G - 0.005, 0.9, 0.2, NH, outline=0.008, bevel=0)
loft('transeptroof', M['lead'], [[(-0.45, TY - 0.1, G + NH - 0.005), (0.45, TY - 0.1, G + NH - 0.005), (0.45, TY + 0.1, G + NH - 0.005), (-0.45, TY + 0.1, G + NH - 0.005)],
                                 [(-0.45, TY - 0.004, G + NH + 0.09), (0.45, TY - 0.004, G + NH + 0.09), (0.45, TY + 0.004, G + NH + 0.09), (-0.45, TY + 0.004, G + NH + 0.09)]], outline=0.004)
for s in (-1, 1):
    cyl(f'rose{s}', M['window'], 0.055, 0.006, segs=20, outline=0, matrix=Matrix.Translation((s * 0.453, TY, G + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    for sy in (-1, 1):
        box(f'transeptturret{s}{sy}', M['stone'], s * 0.44, TY + sy * 0.09, G - 0.005, 0.04, 0.04, NH + 0.08, outline=0.003, bevel=0)
        lathe(f'transeptspire{s}{sy}', M['stoneDark'], ((0.024, 0), (0.003, 0.07)), G + NH + 0.075, s * 0.44, TY + sy * 0.09, segs=8, outline=0.001, smooth=False)
box('lantern', M['stone'], 0, TY, G + NH - 0.01, 0.16, 0.16, 0.12, outline=0.006, bevel=0)
for k in range(4):
    for sx in (-1, 1):
        lathe(f'lanternpinnacle{k}{sx}', M['stoneDark'], ((0.012, 0), (0.002, 0.05)), G + NH + 0.105, sx * 0.07, TY + (0.07 if k < 2 else -0.07), segs=4, outline=0.001, smooth=False)
# the apse at the east end
lathe('apse', M['stone'], ((0.16, 0), (0.16, NH - 0.02)), G - 0.005, 0, Y1, segs=10, outline=0.006, smooth=False)
lathe('apseroof', M['lead'], ((0.165, 0), (0.004, 0.11)), G + NH - 0.025, 0, Y1, segs=10, outline=0.003, smooth=False)

# ---------- the west front ----------
TW, TH = 0.12, 0.62
for s in (-1, 1):
    x = s * (NW / 2 + 0.01)
    box(f'westtower{s}', M['stone'], x, Y0 + 0.02, G - 0.005, TW, TW, TH, outline=0.008, bevel=0)
    for k in range(3):
        box(f'towerwin{s}{k}', M['window'], x, Y0 + 0.02 - TW / 2 - 0.003, G + 0.33 + k * 0.08, 0.035, 0.006, 0.055, outline=0, bevel=0)
    box(f'clockface{s}', M['stoneDark'], x, Y0 + 0.02 - TW / 2 - 0.004, G + 0.27, 0.05, 0.006, 0.05, outline=0, bevel=0)
    box(f'towerparapet{s}', M['stoneDark'], x, Y0 + 0.02, G + TH - 0.01, TW + 0.012, TW + 0.012, 0.02, outline=0.002, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            px, py = x + sx * TW / 2, Y0 + 0.02 + sy * TW / 2
            lathe(f'towerpinnacle{s}{sx}{sy}', M['stone'], ((0.018, 0), (0.016, 0.03), (0.002, 0.1)), G + TH, px, py, segs=8, outline=0.002, smooth=False)
box('westfront', M['stone'], 0, Y0 + 0.01, G - 0.005, NW - 0.05, 0.04, NH + 0.03, outline=0.006, bevel=0)
box('westwindow', M['window'], 0, Y0 - 0.012, G + 0.14, 0.12, 0.006, 0.14, outline=0, bevel=0)
cyl('westwindowtop', M['window'], 0.06, 0.006, segs=16, outline=0, matrix=Matrix.Translation((0, Y0 - 0.012, G + 0.28)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('westdoor', M['window'], 0, Y0 - 0.012, G - 0.005, 0.07, 0.006, 0.1, outline=0, bevel=0)
cyl('westdoortop', M['window'], 0.035, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0, Y0 - 0.012, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('westgable', M['stone'], [[(-0.12, Y0 - 0.01, G + NH + 0.02), (0.12, Y0 - 0.01, G + NH + 0.02), (0.12, Y0 + 0.03, G + NH + 0.02), (-0.12, Y0 + 0.03, G + NH + 0.02)],
                               [(-0.004, Y0 - 0.01, G + NH + 0.1), (0.004, Y0 - 0.01, G + NH + 0.1), (0.004, Y0 + 0.03, G + NH + 0.1), (-0.004, Y0 + 0.03, G + NH + 0.1)]], outline=0.003)

# ---------- the trees on the lawn ----------
for k, (x, y) in enumerate(((-0.55, -0.55), (0.55, -0.55), (-0.85, -0.1), (0.85, -0.1), (-0.4, -0.95), (0.45, -0.95))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.013, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
