# A cartoon Menin Gate for the country maps, built in the set's shared look (../toon.py): the
# memorial to the missing at Ypres, the great pale stone arch spanning the road with its columns and
# coffered vault, the recumbent lion on its top, the grassy ramparts and the moat either side, and
# the Cloth Hall's belfry over the town behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P menin-gate.py -- menin-gate-1024.png 1024 menin-gate.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rampart': toon('rampart', '#6aa54a', shadow_mul=(0.72, 0.8, 0.74)),
    'moat': toon('moat', '#4a7a9a', lift=0.25),
    'road': toon('road', '#9a968e'),
    'stone': toon('stone', '#e4dcc8', shadow_mul=(0.84, 0.84, 0.88), lift=0.12),
    'stoneDark': toon('stoneDark', '#c4b89c'),
    'dark': flat('dark', '#2e2a28'),
    'belfry': toon('belfry', '#c8b890', lift=0.08),
    'slate': toon('slate', '#4a4e56'),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

box('moat', M['moat'], 0.0, -0.4, G - 0.004, 2.0, 0.22, 0.01, outline=0.002, bevel=0)
box('bridge', M['road'], 0.0, -0.4, G - 0.005, 0.2, 0.26, 0.03, outline=0.003, bevel=0)
box('road', M['road'], 0.0, -0.1, G - 0.003, 0.18, 1.4, 0.008, outline=0, bevel=0)
for s in (-1, 1):
    loft(f'rampart{s}', M['rampart'], [[(s * 0.28, -0.25, G - 0.005), (s * 0.95, -0.25, G - 0.005), (s * 0.95, 0.2, G - 0.005), (s * 0.28, 0.2, G - 0.005)],
                                       [(s * 0.32, -0.12, G + 0.14), (s * 0.95, -0.12, G + 0.14), (s * 0.95, 0.12, G + 0.14), (s * 0.32, 0.12, G + 0.14)]], outline=0.006)

# ---------- the gate ----------
GY = 0.0
box('gate', M['stone'], 0.0, GY, G - 0.005, 0.6, 0.3, 0.32, outline=0.009, bevel=0)
box('archway', M['dark'], 0.0, GY - 0.153, G - 0.005, 0.2, 0.006, 0.16, outline=0, bevel=0)
cyl('archwaytop', M['dark'], 0.1, 0.006, segs=24, outline=0, matrix=Matrix.Translation((0.0, GY - 0.153, G + 0.155)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('archrim', M['stoneDark'], 0.115, 0.006, segs=24, outline=0, matrix=Matrix.Translation((0.0, GY - 0.151, G + 0.155)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    for x in (0.15, 0.24):
        rod(f'column{s}{x}', M['stoneDark'], (s * x, GY - 0.16, G - 0.005), (s * x, GY - 0.16, G + 0.24), 0.014, segs=10, outline=0.002)
    box(f'sidearch{s}', M['dark'], s * 0.195, GY - 0.153, G + 0.04, 0.05, 0.006, 0.1, outline=0, bevel=0)
box('entablature', M['stoneDark'], 0.0, GY - 0.01, G + 0.24, 0.62, 0.32, 0.03, outline=0.003, bevel=0)
box('attic', M['stone'], 0.0, GY, G + 0.27, 0.46, 0.24, 0.1, outline=0.006, bevel=0)
box('inscription', M['dark'], 0.0, GY - 0.122, G + 0.3, 0.26, 0.004, 0.03, outline=0, bevel=0)
# the lion
LZ = G + 0.37
box('lionplinth', M['stoneDark'], 0.0, GY, LZ - 0.005, 0.18, 0.08, 0.03, outline=0.002, bevel=0)
b = ball('lionbody', M['stone'], 0, 0, 0, 0.5, outline=0.004)
b.scale = (0.14, 0.06, 0.06)
b.location = (0.01, GY, LZ + 0.05)
ball('lionmane', M['stoneDark'], -0.055, GY - 0.005, LZ + 0.08, 0.04, outline=0.003)
ball('lionhead', M['stone'], -0.07, GY - 0.02, LZ + 0.085, 0.028, outline=0.002)
for dx in (-0.06, -0.035):
    box(f'lionpaw{dx}', M['stone'], dx, GY - 0.04, LZ + 0.025, 0.02, 0.05, 0.02, outline=0.001, bevel=0)

# ---------- the Cloth Hall belfry ----------
BX, BY = 0.45, 0.65
box('clothhall', M['belfry'], BX, BY, G - 0.005, 0.4, 0.12, 0.14, outline=0.005, bevel=0)
loft('clothhallroof', M['slate'], [[(BX - 0.2, BY - 0.06, G + 0.135), (BX + 0.2, BY - 0.06, G + 0.135), (BX + 0.2, BY + 0.06, G + 0.135), (BX - 0.2, BY + 0.06, G + 0.135)],
                                   [(BX - 0.2, BY - 0.004, G + 0.22), (BX + 0.2, BY - 0.004, G + 0.22), (BX + 0.2, BY + 0.004, G + 0.22), (BX - 0.2, BY + 0.004, G + 0.22)]], outline=0.004)
box('belfrytower', M['belfry'], BX, BY, G - 0.005, 0.12, 0.12, 0.42, outline=0.006, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'belfryturret{sx}{sy}', M['slate'], ((0.015, 0), (0.004, 0.07)), G + 0.415, BX + sx * 0.055, BY + sy * 0.055, segs=6, outline=0.001, smooth=False)
pyramid('belfryroof', M['slate'], BX, BY, G + 0.415, 0.11, 0.12, outline=0.003)
ball('belfryball', M['gold'], BX, BY, G + 0.545, 0.012, outline=0)
for k, (x, y) in enumerate(((-0.6, 0.0), (-0.85, 0.05), (0.65, 0.0), (0.88, -0.05), (-0.4, 0.55))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14 + 0.08, 0.08, outline=0.007)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
