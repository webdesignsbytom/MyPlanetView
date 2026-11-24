# A cartoon Liberty Bell and Independence Hall for the country maps, built in the set's shared look
# (../toon.py): in Philadelphia, the Liberty Bell hanging from its old wooden yoke, its famous crack
# running up its side, in the glass pavilion on Independence Mall, and behind it Independence Hall,
# where the Declaration of Independence and the Constitution were signed: the red brick hall with its
# white trim and the tall white tower and steeple with its clock. Turned a little towards the camera.
# Run: blender -b --factory-startup -P liberty-bell.py -- liberty-bell-1024.png 1024 liberty-bell.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d6cfc0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'brick': toon('brick', '#b04a36', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.8, 0.82, 0.9), lift=0.22),
    'bronze': toon('bronze', '#8a6a3e', shadow_mul=(0.78, 0.74, 0.78), lift=0.2),
    'yoke': toon('yoke', '#6a4a30'),
    'glass': toon('glass', '#a8c8d8', lift=0.35),
    'frame': toon('frame', '#5a5e66'),
    'dark': flat('dark', '#2e2a2a'),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

box('mall', M['paving'], 0.0, -0.1, G - 0.004, 0.9, 1.4, 0.01, outline=0.001, bevel=0)

# ---------- Independence Hall ----------
HX, HY = 0.0, 0.62
box('hall', M['brick'], HX, HY, G - 0.005, 0.8, 0.22, 0.2, outline=0.007, bevel=0)
for row in range(2):
    for j in range(9):
        x = HX - 0.34 + j * 0.085
        if abs(x - HX) < 0.05:
            continue
        box(f'hallwin{row}{j}', M['white'], x, HY - 0.113, G + 0.035 + row * 0.085, 0.04, 0.006, 0.06, outline=0, bevel=0)
        box(f'hallpane{row}{j}', M['dark'], x, HY - 0.116, G + 0.04 + row * 0.085, 0.03, 0.006, 0.05, outline=0, bevel=0)
box('halldoor', M['white'], HX, HY - 0.113, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
box('hallcornice', M['white'], HX, HY, G + 0.19, 0.82, 0.24, 0.02, outline=0.002, bevel=0)
loft('hallroof', M['dark'], [[(HX - 0.41, HY - 0.12, G + 0.205), (HX + 0.41, HY - 0.12, G + 0.205), (HX + 0.41, HY + 0.12, G + 0.205), (HX - 0.41, HY + 0.12, G + 0.205)],
                             [(HX - 0.38, HY - 0.004, G + 0.27), (HX + 0.38, HY - 0.004, G + 0.27), (HX + 0.38, HY + 0.004, G + 0.27), (HX - 0.38, HY + 0.004, G + 0.27)]], outline=0.004)
box('hallbalustrade', M['white'], HX, HY, G + 0.265, 0.3, 0.06, 0.02, outline=0.002, bevel=0)
# the tower and its white steeple
TY = HY + 0.16
box('tower', M['brick'], HX, TY, G - 0.005, 0.16, 0.14, 0.36, outline=0.006, bevel=0)
box('towerwin', M['white'], HX, TY - 0.073, G + 0.24, 0.05, 0.006, 0.08, outline=0, bevel=0)
box('towercornice', M['white'], HX, TY, G + 0.35, 0.17, 0.15, 0.02, outline=0.002, bevel=0)
box('steeplebase', M['white'], HX, TY, G + 0.37, 0.12, 0.12, 0.07, outline=0.004, bevel=0)
cyl('clock', M['white'], 0.03, 0.006, segs=16, outline=0.002, matrix=Matrix.Translation((HX, TY - 0.063, G + 0.405)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('clockface', M['dark'], 0.022, 0.006, segs=16, outline=0, matrix=Matrix.Translation((HX, TY - 0.066, G + 0.405)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('belfry', M['white'], ((0.05, 0), (0.05, 0.08)), G + 0.44, HX, TY, segs=8, outline=0.003, smooth=False)
lathe('cupola', M['white'], ((0.04, 0), (0.04, 0.05)), G + 0.52, HX, TY, segs=8, outline=0.002, smooth=False)
lathe('steeple', M['white'], ((0.035, 0), (0.025, 0.04), (0.003, 0.12)), G + 0.57, HX, TY, segs=8, outline=0.002, smooth=False)
ball('vane', M['gold'], HX, TY, G + 0.7, 0.008, outline=0.001)

# ---------- the glass pavilion ----------
PX, PY = 0.0, -0.15
PW, PD, PH = 0.5, 0.36, 0.34
box('pavilionfloor', M['white'], PX, PY, G - 0.004, PW, PD, 0.015, outline=0.002, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'post{sx}{sy}', M['frame'], (PX + sx * PW / 2, PY + sy * PD / 2, G), (PX + sx * PW / 2, PY + sy * PD / 2, G + PH), 0.008, segs=6, outline=0.001)
box('pavilionroof', M['frame'], PX, PY, G + PH, PW + 0.03, PD + 0.03, 0.02, outline=0.003, bevel=0)
glass = box('backglass', M['glass'], PX, PY + PD / 2, G, PW, 0.006, PH, outline=0.001, bevel=0)
glass.visible_shadow = False
for k in range(3):
    bar(f'mullion{k}', M['frame'], (PX - PW / 2 + (k + 1) * PW / 4, PY + PD / 2 - 0.004, G), (PX - PW / 2 + (k + 1) * PW / 4, PY + PD / 2 - 0.004, G + PH), 0.005, outline=0)

# ---------- the bell and its yoke ----------
BX, BY = PX, PY
for s in (-1, 1):
    bar(f'yokepost{s}', M['yoke'], (BX + s * 0.14, BY, G), (BX + s * 0.14, BY, G + 0.3), 0.025, outline=0.003)
box('yoke', M['yoke'], BX, BY, G + 0.28, 0.32, 0.05, 0.04, outline=0.003, bevel=0)
BZ = G + 0.03
lathe('bell', M['bronze'], ((0.115, 0), (0.11, 0.015), (0.09, 0.05), (0.075, 0.12), (0.072, 0.18), (0.055, 0.215), (0.0, 0.225)), BZ, BX, BY, segs=28, outline=0.006)
lathe('lip', M['bronze'], ((0.118, 0), (0.118, 0.012)), BZ, BX, BY, segs=28, outline=0.002)
lathe('crown', M['bronze'], ((0.025, 0), (0.025, 0.03)), BZ + 0.22, BX, BY, segs=12, outline=0.002)
# the crack, up the front from the lip
pts = [(0.005, 0.0), (-0.004, 0.03), (0.006, 0.06), (-0.002, 0.1), (0.004, 0.14)]
for k, ((x0, z0), (x1, z1)) in enumerate(zip(pts, pts[1:])):
    r0 = 0.115 - 0.3 * z0
    r1 = 0.115 - 0.3 * z1
    bar(f'crack{k}', M['dark'], (BX + x0, BY - r0 - 0.002, BZ + 0.012 + z0), (BX + x1, BY - r1 - 0.002, BZ + 0.012 + z1), 0.006, outline=0)
box('band', M['dark'], BX, BY - 0.082, BZ + 0.16, 0.08, 0.006, 0.008, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.75, -0.45), (0.75, -0.45), (-0.8, 0.15), (0.8, 0.15), (-0.35, -0.95), (0.35, -0.95))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
