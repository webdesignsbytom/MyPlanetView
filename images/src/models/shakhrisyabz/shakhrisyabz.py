# A cartoon Shakhrisyabz for the country maps, built in the set's shared look (../toon.py): the
# colossal ruined portal of Timur's Ak-Saray palace, its two great pylons clad in blue, turquoise
# and white tile mosaic with the broken springing of the vanished arch between them, and the bronze
# statue of Amir Timur in his cloak on his tall pedestal in the garden before it. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P shakhrisyabz.py -- shakhrisyabz-1024.png 1024 shakhrisyabz.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d4b8', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'brick': toon('brick', '#c8a07a', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'blue': toon('blue', '#1e4a9a', lift=0.12),
    'turquoise': toon('turquoise', '#3ab0c0', lift=0.15),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'bronze': toon('bronze', '#4a5a50'),
    'stone': toon('stone', '#d8d0c0'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.5, -0.35, G - 0.003, 0.5, 0.5, 0.008, outline=0.002, bevel=0)

# ---------- the pylons ----------
PY, PW, PD, PH = 0.35, 0.18, 0.22, 0.66
for s in (-1, 1):
    px = s * 0.2
    box(f'pylon{s}', M['brick'], px, PY, G - 0.005, PW, PD, PH, outline=0.009, bevel=0)
    F = PY - PD / 2 - 0.003
    box(f'tilepanel{s}', M['blue'], px, F, G + 0.06, PW * 0.85, 0.006, PH * 0.8, outline=0, bevel=0)
    for i in range(8):
        for j in range(3):
            mat = ('turquoise', 'white')[(i + j) % 2]
            cyl(f'star{s}{i}{j}', M[mat], 0.016, 0.004, segs=8 if (i + j) % 2 else 4, outline=0, matrix=Matrix.Translation((px - 0.05 + j * 0.05, F - 0.004, G + 0.1 + i * 0.062)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'band{s}', M['white'], px, F - 0.004, G + PH - 0.06, PW * 0.85, 0.004, 0.03, outline=0, bevel=0)
    # the broken springing of the arch
    loft(f'archstub{s}', M['brick'], [[(px - s * PW / 2, PY - 0.1, G + PH - 0.12), (px - s * PW / 2, PY + 0.1, G + PH - 0.12), (px - s * PW / 2, PY + 0.1, G + PH), (px - s * PW / 2, PY - 0.1, G + PH)],
                                      [(px - s * (PW / 2 + 0.07), PY - 0.1, G + PH - 0.05), (px - s * (PW / 2 + 0.07), PY + 0.1, G + PH - 0.05), (px - s * (PW / 2 + 0.07), PY + 0.1, G + PH), (px - s * (PW / 2 + 0.07), PY - 0.1, G + PH)]], outline=0.004)
box('base', M['brick'], 0.0, PY + 0.05, G - 0.005, 0.7, 0.12, 0.08, outline=0.004, bevel=0)

# ---------- the statue of Timur ----------
TX, TY = 0.0, -0.3
box('pedestal', M['stone'], TX, TY, G - 0.005, 0.14, 0.14, 0.2, outline=0.005, bevel=0)
box('pedestalcap', M['stone'], TX, TY, G + 0.19, 0.16, 0.16, 0.02, outline=0.002, bevel=0)
Z = G + 0.21
lathe('cloak', M['bronze'], ((0.05, 0), (0.045, 0.06), (0.035, 0.14), (0.025, 0.17)), Z, TX, TY, segs=12, outline=0.003)
ball('head', M['bronze'], TX, TY, Z + 0.2, 0.022, outline=0.002)
lathe('hat', M['bronze'], ((0.024, 0), (0.016, 0.02), (0.004, 0.03)), Z + 0.21, TX, TY, segs=10, outline=0.001)
rod('arm', M['bronze'], (TX + 0.03, TY - 0.01, Z + 0.14), (TX + 0.06, TY - 0.03, Z + 0.1), 0.01, segs=6, outline=0.001)
bar('sword', M['bronze'], (TX - 0.04, TY - 0.02, Z + 0.12), (TX - 0.05, TY - 0.03, Z + 0.02), 0.01, outline=0.001)
for s in (-1, 1):
    box(f'fountain{s}', M['water'], s * 0.3, -0.05, G - 0.003, 0.14, 0.4, 0.015, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.7, -0.5), (0.7, -0.5), (-0.75, 0.2), (0.75, 0.2))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.007)

turn(before, -20)
render(G)
