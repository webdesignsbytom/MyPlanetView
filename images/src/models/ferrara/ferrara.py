# A cartoon Castello Estense for the country maps, built in the set's shared look (../toon.py):
# Ferrara's moated castle of red brick, its four great corner towers with their battlements and
# white marble balconies under small roofs, the drawbridges over the green moat, and the square
# around it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ferrara.py -- ferrara-1024.png 1024 ferrara.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'moat': toon('moat', '#5a8a7a', lift=0.25),
    'brick': toon('brick', '#b8583e', shadow_mul=(0.86, 0.78, 0.76), lift=0.04),
    'brickDark': toon('brickDark', '#94442e'),
    'marble': toon('marble', '#f2ece0', lift=0.15),
    'roof': toon('roof', '#a8503e'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

CX, CY, W, D, H = 0.0, 0.1, 0.56, 0.48, 0.24
box('moatrim', M['brickDark'], CX, CY, G - 0.006, W + 0.42, D + 0.42, 0.02, outline=0.003, bevel=0)
box('moat', M['moat'], CX, CY, G - 0.004, W + 0.36, D + 0.36, 0.022, outline=0, bevel=0)
box('castle', M['brick'], CX, CY, G - 0.01, W, D, H, outline=0.009, bevel=0)
for j in range(10):
    x = CX - W / 2 + 0.04 + j * (W - 0.08) / 9
    box(f'merlon{j}', M['brickDark'], x, CY - D / 2 + 0.01, G + H - 0.005, 0.03, 0.025, 0.035, outline=0.001, bevel=0)
for r in range(2):
    for j in range(5):
        box(f'win{r}{j}', M['dark'], CX - 0.18 + j * 0.09, CY - D / 2 - 0.003, G + 0.06 + r * 0.08, 0.025, 0.006, 0.04, outline=0, bevel=0)
loft('castleroof', M['roof'], [[(CX - W / 2 + 0.03, CY - D / 2 + 0.03, G + H + 0.02), (CX + W / 2 - 0.03, CY - D / 2 + 0.03, G + H + 0.02), (CX + W / 2 - 0.03, CY + D / 2 - 0.03, G + H + 0.02), (CX - W / 2 + 0.03, CY + D / 2 - 0.03, G + H + 0.02)],
                               [(CX - W / 2 + 0.1, CY - 0.02, G + H + 0.08), (CX + W / 2 - 0.1, CY - 0.02, G + H + 0.08), (CX + W / 2 - 0.1, CY + 0.02, G + H + 0.08), (CX - W / 2 + 0.1, CY + 0.02, G + H + 0.08)]], outline=0.004)

# ---------- the corner towers ----------
for sx in (-1, 1):
    for sy in (-1, 1):
        tx, ty = CX + sx * W / 2, CY + sy * D / 2
        box(f'tower{sx}{sy}', M['brick'], tx, ty, G - 0.01, 0.16, 0.16, H + 0.12, outline=0.007, bevel=0)
        box(f'towerwin{sx}{sy}', M['dark'], tx, ty - 0.083, G + 0.2, 0.025, 0.006, 0.05, outline=0, bevel=0)
        box(f'balconyring{sx}{sy}', M['marble'], tx, ty, G + H + 0.08, 0.19, 0.19, 0.022, outline=0.002, bevel=0)
        box(f'towertop{sx}{sy}', M['brick'], tx, ty, G + H + 0.1, 0.12, 0.12, 0.06, outline=0.004, bevel=0)
        pyramid(f'towerroof{sx}{sy}', M['roof'], tx, ty, G + H + 0.155, 0.15, 0.08, outline=0.003)

# ---------- the drawbridges ----------
for k, x in enumerate((-0.12, 0.12)):
    box(f'bridge{k}', M['brickDark'], CX + x, CY - D / 2 - 0.11, G - 0.005, 0.07, 0.2, 0.03, outline=0.003, bevel=0)
    box(f'gate{k}', M['dark'], CX + x, CY - D / 2 - 0.003, G - 0.005, 0.045, 0.006, 0.07, outline=0, bevel=0)
box('ravelin', M['brick'], CX, CY - D / 2 - 0.23, G - 0.005, 0.18, 0.08, 0.1, outline=0.005, bevel=0)

for k, (x, y, r) in enumerate(((-0.8, -0.4, 0.11), (0.8, -0.42, 0.11), (-0.82, 0.55, 0.1), (0.8, 0.55, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
