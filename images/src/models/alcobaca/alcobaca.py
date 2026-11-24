# A cartoon Alcobaça Monastery for the country maps, built in the set's shared look (../toon.py): the
# great Cistercian abbey's baroque front of pale limestone, its two bell towers with their onion caps
# either side of the church's Gothic doorway and rose window, the statues in its niches, the long wings
# of the monastery stretching away either side, the church's long roof behind, and the square in front.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P alcobaca.py -- alcobaca-1024.png 1024 alcobaca.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#efe6d2', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#d4c8ac'),
    'roof': toon('roof', '#c4603e'),
    'slate': toon('slate', '#6a7280'),
    'dark': flat('dark', '#2e2a26'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

FY = 0.0
# ---------- the long wings either side ----------
for s in (-1, 1):
    x = s * 0.62
    box(f'wing{s}', M['stone'], x, FY + 0.15, G - 0.005, 0.66, 0.3, 0.22, outline=0.008, bevel=0)
    loft(f'wingroof{s}', M['roof'], [[(x - 0.33, FY, G + 0.215), (x + 0.33, FY, G + 0.215), (x + 0.33, FY + 0.3, G + 0.215), (x - 0.33, FY + 0.3, G + 0.215)],
                                     [(x - 0.33, FY + 0.145, G + 0.29), (x + 0.33, FY + 0.145, G + 0.29), (x + 0.33, FY + 0.155, G + 0.29), (x - 0.33, FY + 0.155, G + 0.29)]], outline=0.004)
    for row in range(2):
        for j in range(5):
            box(f'wingwin{s}{row}{j}', M['dark'], x - 0.24 + j * 0.12, FY - 0.003, G + 0.05 + row * 0.09, 0.035, 0.006, 0.05, outline=0, bevel=0)
# ---------- the church's long nave behind ----------
box('nave', M['stone'], 0, FY + 0.5, G - 0.005, 0.36, 0.8, 0.32, outline=0.008, bevel=0)
loft('naveroof', M['roof'], [[(-0.19, FY + 0.1, G + 0.315), (0.19, FY + 0.1, G + 0.315), (0.19, FY + 0.9, G + 0.315), (-0.19, FY + 0.9, G + 0.315)],
                             [(-0.004, FY + 0.1, G + 0.42), (0.004, FY + 0.1, G + 0.42), (0.004, FY + 0.9, G + 0.42), (-0.004, FY + 0.9, G + 0.42)]], outline=0.005)
# ---------- the baroque front ----------
box('front', M['stone'], 0, FY + 0.03, G - 0.005, 0.34, 0.08, 0.42, outline=0.008, bevel=0)
loft('frontgable', M['stone'], [[(-0.12, FY - 0.01, G + 0.415), (0.12, FY - 0.01, G + 0.415), (0.12, FY + 0.07, G + 0.415), (-0.12, FY + 0.07, G + 0.415)],
                                [(-0.03, FY - 0.01, G + 0.52), (0.03, FY - 0.01, G + 0.52), (0.03, FY + 0.07, G + 0.52), (-0.03, FY + 0.07, G + 0.52)]], outline=0.004)
rod('gablestatue', M['stoneDark'], (0, FY + 0.03, G + 0.52), (0, FY + 0.03, G + 0.58), 0.012, segs=6, outline=0.001)
# the Gothic doorway and the rose window
box('doorway', M['stoneDark'], 0, FY - 0.012, G - 0.005, 0.12, 0.006, 0.2, outline=0, bevel=0)
box('door', M['dark'], 0, FY - 0.014, G - 0.005, 0.06, 0.006, 0.13, outline=0, bevel=0)
pyramid('doortop', M['dark'], 0, FY - 0.014, G + 0.125, 0.06, 0.04, outline=0)
cyl('rose', M['dark'], 0.04, 0.006, segs=16, outline=0, matrix=Matrix.Translation((0, FY - 0.013, G + 0.3)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    box(f'niche{s}', M['stoneDark'], s * 0.1, FY - 0.012, G + 0.24, 0.035, 0.006, 0.07, outline=0, bevel=0)
    rod(f'statue{s}', M['stone'], (s * 0.1, FY - 0.018, G + 0.24), (s * 0.1, FY - 0.018, G + 0.3), 0.01, segs=6, outline=0.001)
    # the two bell towers
    tx = s * 0.23
    box(f'tower{s}', M['stone'], tx, FY + 0.03, G - 0.005, 0.12, 0.12, 0.58, outline=0.007, bevel=0)
    box(f'belfry{s}', M['dark'], tx, FY - 0.033, G + 0.44, 0.04, 0.006, 0.08, outline=0, bevel=0)
    lathe(f'towercap{s}', M['slate'], ((0.065, 0), (0.07, 0.04), (0.05, 0.08), (0.015, 0.11), (0.02, 0.13), (0.003, 0.18)), G + 0.575, tx, FY + 0.03, segs=12, outline=0.003)

for k, (x, y) in enumerate(((-0.7, -0.45), (0.7, -0.45), (-0.3, -0.8), (0.3, -0.8))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
