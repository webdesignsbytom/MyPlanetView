# A cartoon Palace of Mafra for the country maps, built in the set's shared look (../toon.py): the
# vast baroque palace-convent's long pale front, the basilica in its middle with its two tall bell
# towers and the dome rising behind them, the steps and the portico, the long wings with their rows
# of windows ending in the two square corner pavilions with their bulbous roofs, and the square
# before it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mafra.py -- mafra-1024.png 1024 mafra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#ece2cc', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#d0c2a4'),
    'pink': toon('pink', '#e8c8b0', lift=0.15),
    'slate': toon('slate', '#6a7280', shadow_mul=(0.84, 0.86, 0.92)),
    'dark': flat('dark', '#2e2a26'),
    'gold': toon('gold', '#e0b040', lift=0.2),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

FY = 0.1
L = 1.7
# ---------- the long wings ----------
box('wings', M['pink'], 0, FY + 0.18, G - 0.005, L, 0.36, 0.24, outline=0.009, bevel=0)
box('wingscornice', M['stoneDark'], 0, FY + 0.18, G + 0.23, L + 0.01, 0.37, 0.02, outline=0.002, bevel=0)
loft('wingsroof', M['slate'], [[(-L / 2, FY, G + 0.245), (L / 2, FY, G + 0.245), (L / 2, FY + 0.36, G + 0.245), (-L / 2, FY + 0.36, G + 0.245)],
                               [(-L / 2, FY + 0.17, G + 0.3), (L / 2, FY + 0.17, G + 0.3), (L / 2, FY + 0.19, G + 0.3), (-L / 2, FY + 0.19, G + 0.3)]], outline=0.004)
for row in range(3):
    for j in range(24):
        x = -L / 2 + 0.06 + j * (L - 0.12) / 23
        if abs(x) < 0.3:
            continue
        box(f'win{row}{j}', M['dark'], x, FY - 0.003, G + 0.04 + row * 0.065, 0.025, 0.006, 0.04, outline=0, bevel=0)
# the corner pavilions with their bulbous roofs
for s in (-1, 1):
    px = s * (L / 2 - 0.08)
    box(f'pavilion{s}', M['stone'], px, FY + 0.16, G - 0.005, 0.2, 0.4, 0.32, outline=0.007, bevel=0)
    loft(f'pavilionroof{s}', M['slate'], [[(px - 0.1, FY - 0.04, G + 0.315), (px + 0.1, FY - 0.04, G + 0.315), (px + 0.1, FY + 0.36, G + 0.315), (px - 0.1, FY + 0.36, G + 0.315)],
                                          [(px - 0.11, FY - 0.05, G + 0.36), (px + 0.11, FY - 0.05, G + 0.36), (px + 0.11, FY + 0.37, G + 0.36), (px - 0.11, FY + 0.37, G + 0.36)],
                                          [(px - 0.06, FY + 0.1, G + 0.44), (px + 0.06, FY + 0.1, G + 0.44), (px + 0.06, FY + 0.22, G + 0.44), (px - 0.06, FY + 0.22, G + 0.44)]], outline=0.005)

# ---------- the basilica in the middle ----------
box('basilicafront', M['stone'], 0, FY + 0.06, G - 0.005, 0.56, 0.16, 0.36, outline=0.008, bevel=0)
box('portico', M['stone'], 0, FY - 0.06, G + 0.03, 0.26, 0.1, 0.2, outline=0.005, bevel=0)
for j in range(6):
    rod(f'porticocol{j}', M['stone'], (-0.11 + j * 0.044, FY - 0.11, G + 0.03), (-0.11 + j * 0.044, FY - 0.11, G + 0.23), 0.01, segs=8, outline=0.001)
box('porticodoor', M['dark'], 0, FY - 0.013, G + 0.03, 0.06, 0.006, 0.12, outline=0, bevel=0)
loft('pediment', M['stone'], [[(-0.14, FY - 0.12, G + 0.23), (0.14, FY - 0.12, G + 0.23), (0.14, FY, G + 0.23), (-0.14, FY, G + 0.23)],
                              [(-0.004, FY - 0.12, G + 0.3), (0.004, FY - 0.12, G + 0.3), (0.004, FY, G + 0.3), (-0.004, FY, G + 0.3)]], outline=0.004)
for i in range(4):
    box(f'step{i}', M['stoneDark'], 0, FY - 0.13 - i * 0.03, G - 0.005, 0.4 + i * 0.06, 0.03, 0.035 - i * 0.008, outline=0.001, bevel=0)
for s in (-1, 1):
    tx = s * 0.22
    box(f'tower{s}', M['stone'], tx, FY + 0.06, G - 0.005, 0.12, 0.12, 0.62, outline=0.007, bevel=0)
    for k in range(2):
        box(f'towerwin{s}{k}', M['dark'], tx, FY - 0.003, G + 0.42 + k * 0.08, 0.035, 0.006, 0.06, outline=0, bevel=0)
    lathe(f'towercap{s}', M['slate'], ((0.065, 0), (0.07, 0.03), (0.05, 0.07), (0.02, 0.1), (0.025, 0.12), (0.003, 0.17)), G + 0.615, tx, FY + 0.06, segs=8, outline=0.003, smooth=False)
    ball(f'towerknob{s}', M['gold'], tx, FY + 0.06, G + 0.79, 0.012, outline=0.001)
# the dome behind, over the crossing
lathe('drum', M['stone'], ((0.11, 0), (0.11, 0.12)), G + 0.355, 0, FY + 0.26, segs=16, outline=0.005)
lathe('dome', M['slate'], ((0.12, 0), (0.11, 0.06), (0.07, 0.12), (0.03, 0.15)), G + 0.475, 0, FY + 0.26, segs=16, outline=0.005)
lathe('lantern', M['stone'], ((0.03, 0), (0.03, 0.06), (0.003, 0.1)), G + 0.62, 0, FY + 0.26, segs=8, outline=0.002, smooth=False)
box('nave', M['stone'], 0, FY + 0.3, G - 0.005, 0.3, 0.3, 0.34, outline=0.006, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
