# A cartoon Abbey of St Gall for the country maps, built in the set's shared look (../toon.py): the
# baroque abbey cathedral in St Gallen, its long pale nave with grey pilasters, the round rotunda
# bulging out midway under its dome and lantern, the twin towers of the east front with their clocks
# and green onion domes, and the long white wing of the abbey with the famous library beside it.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P st-gall.py -- st-gall-1024.png 1024 st-gall.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d6cfc0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'cream': toon('cream', '#f2ebdc', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'grey': toon('grey', '#a8a49c'),
    'roof': toon('roof', '#9a4a36'),
    'copper': toon('copper', '#4a8a6a', lift=0.12),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the abbey's lawn ----------
loft('lawn', M['grass'], [[(-0.25, -0.95, G - 0.004), (0.55, -0.95, G - 0.004), (0.55, -0.5, G - 0.004), (-0.25, -0.5, G - 0.004)],
                          [(-0.25, -0.95, G + 0.006), (0.55, -0.95, G + 0.006), (0.55, -0.5, G + 0.006), (-0.25, -0.5, G + 0.006)]], outline=0.002)

# ---------- the nave ----------
CX, Y0, Y1 = 0.12, -0.45, 0.38
NW, NH = 0.26, 0.26
box('nave', M['cream'], CX, (Y0 + Y1) / 2, G - 0.005, NW, Y1 - Y0, NH, outline=0.007, bevel=0)
for k in range(7):
    y = Y0 + 0.04 + k * (Y1 - Y0 - 0.08) / 6
    box(f'pilaster{k}', M['grey'], CX - NW / 2 - 0.003, y, G - 0.005, 0.006, 0.018, NH, outline=0, bevel=0)
    if k < 6:
        box(f'navewin{k}', M['dark'], CX - NW / 2 - 0.004, y + 0.06, G + 0.09, 0.006, 0.035, 0.1, outline=0, bevel=0)
loft('naveroof', M['roof'], [[(CX - NW / 2 - 0.015, Y0 - 0.01, G + NH - 0.005), (CX + NW / 2 + 0.015, Y0 - 0.01, G + NH - 0.005), (CX + NW / 2 + 0.015, Y1, G + NH - 0.005), (CX - NW / 2 - 0.015, Y1, G + NH - 0.005)],
                             [(CX - 0.004, Y0 + 0.05, G + NH + 0.12), (CX + 0.004, Y0 + 0.05, G + NH + 0.12), (CX + 0.004, Y1, G + NH + 0.12), (CX - 0.004, Y1, G + NH + 0.12)]], outline=0.005)
# the rotunda midway, with its dome and lantern
RY = -0.04
lathe('rotunda', M['cream'], ((0.2, 0), (0.2, 0.31)), G - 0.005, CX, RY, segs=28, outline=0.006)
for k in range(10):
    a = math.radians(110 + k * 14)
    box(f'rotundawin{k}', M['dark'], CX + 0.2 * math.cos(a), RY + 0.2 * math.sin(a), G + 0.1, 0.03, 0.006, 0.1, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('rotundacornice', M['grey'], ((0.21, 0), (0.21, 0.02)), G + 0.29, CX, RY, segs=28, outline=0.002)
lathe('rotundadome', M['roof'], ((0.21, 0), (0.18, 0.06), (0.11, 0.12), (0.04, 0.145)), G + 0.305, CX, RY, segs=28, outline=0.004)
lathe('lantern', M['cream'], ((0.04, 0), (0.04, 0.06)), G + 0.445, CX, RY, segs=10, outline=0.002)
lathe('lanterncap', M['copper'], ((0.045, 0), (0.04, 0.02), (0.02, 0.045), (0.022, 0.06), (0.003, 0.1)), G + 0.5, CX, RY, segs=10, outline=0.002)

# ---------- the twin towers of the east front ----------
TY = Y1 + 0.05
box('frontcentre', M['cream'], CX, TY, G - 0.005, 0.12, 0.1, 0.46, outline=0.005, bevel=0)
loft('frontpediment', M['cream'], [[(CX - 0.06, TY - 0.05, G + 0.455), (CX + 0.06, TY - 0.05, G + 0.455), (CX + 0.06, TY + 0.05, G + 0.455), (CX - 0.06, TY + 0.05, G + 0.455)],
                                   [(CX - 0.004, TY - 0.05, G + 0.53), (CX + 0.004, TY - 0.05, G + 0.53), (CX + 0.004, TY + 0.05, G + 0.53), (CX - 0.004, TY + 0.05, G + 0.53)]], outline=0.003)
for s in (-1, 1):
    x = CX + s * 0.11
    box(f'tower{s}', M['cream'], x, TY, G - 0.005, 0.1, 0.1, 0.62, outline=0.006, bevel=0)
    for sx in (-1, 1):
        box(f'towerpilaster{s}{sx}', M['grey'], x + sx * 0.045, TY - 0.052, G - 0.005, 0.012, 0.006, 0.62, outline=0, bevel=0)
    cyl(f'clockgold{s}', M['gold'], 0.032, 0.006, segs=16, outline=0.001, matrix=Matrix.Translation((x, TY - 0.053, G + 0.52)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    cyl(f'clock{s}', M['dark'], 0.024, 0.006, segs=16, outline=0, matrix=Matrix.Translation((x, TY - 0.056, G + 0.52)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'towerwin{s}', M['dark'], x, TY - 0.053, G + 0.33, 0.03, 0.006, 0.08, outline=0, bevel=0)
    lathe(f'belfry{s}', M['cream'], ((0.045, 0), (0.045, 0.08)), G + 0.615, x, TY, segs=8, outline=0.003, smooth=False)
    lathe(f'onion{s}', M['copper'], ((0.055, 0), (0.06, 0.03), (0.045, 0.065), (0.015, 0.09), (0.02, 0.11), (0.012, 0.13), (0.003, 0.18)), G + 0.69, x, TY, segs=12, outline=0.003)
    ball(f'towerball{s}', M['gold'], x, TY, G + 0.875, 0.01, outline=0.001)

# ---------- the abbey wing ----------
box('abbey', M['cream'], -0.42, -0.05, G - 0.005, 0.2, 0.9, 0.2, outline=0.006, bevel=0)
for row in range(2):
    for k in range(8):
        box(f'abbeywin{row}{k}', M['dark'], -0.317, -0.45 + k * 0.115, G + 0.04 + row * 0.08, 0.006, 0.03, 0.045, outline=0, bevel=0)
loft('abbeyroof', M['roof'], [[(-0.53, -0.51, G + 0.195), (-0.31, -0.51, G + 0.195), (-0.31, 0.41, G + 0.195), (-0.53, 0.41, G + 0.195)],
                              [(-0.424, -0.44, G + 0.3), (-0.416, -0.44, G + 0.3), (-0.416, 0.34, G + 0.3), (-0.424, 0.34, G + 0.3)]], outline=0.004)
for k, (x, y) in enumerate(((0.0, -0.75), (0.4, -0.75), (0.75, 0.0), (0.7, 0.45))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
