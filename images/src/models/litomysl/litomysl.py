# A cartoon Litomyšl Castle for the country maps, built in the set's shared look (../toon.py): the
# Renaissance castle in eastern Bohemia, Czechia, its walls covered all over in sgraffito,
# thousands of little "pillow" panels each with a different pattern, the three-storey arcades
# round the courtyard, the gables and dormers along the roof, the gate tower, and the garden.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P litomysl.py -- litomysl-1024.png 1024 litomysl.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'wall': toon('wall', '#ece2cc', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'sgraffito': toon('sgraffito', '#9a8e7c'),
    'roof': toon('roof', '#b8603e'),
    'path': toon('path2', '#e2d6bc', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'hedge': toon('hedge', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the wings round the arcaded courtyard ----------
W, D, T, H = 0.8, 0.6, 0.18, 0.3
CY = 0.15
for k, (x, y, sx, sy, rx) in enumerate(((0.0, CY - D / 2 + T / 2, W, T, True), (0.0, CY + D / 2 - T / 2, W, T, True), (-W / 2 + T / 2, CY, T, D - 2 * T, False), (W / 2 - T / 2, CY, T, D - 2 * T, False))):
    box(f'wing{k}', M['wall'], x, y, G - 0.005, sx, sy, H, outline=0.007, bevel=0)
    gable(f'wingroof{k}', M['roof'], x, y, G + H - 0.005, sx, sy, 0.14, ridge_x=rx, over=0.012)
# the sgraffito pillows on the front
FY = CY - D / 2 - 0.003
for r in range(5):
    for j in range(16):
        if (r + j) % 2:
            continue
        box(f'pillow{r}{j}', M['sgraffito'], -W / 2 + 0.03 + j * 0.05, FY, G + 0.02 + r * 0.055, 0.04, 0.004, 0.04, outline=0, bevel=0)
for j in range(7):
    x = -0.33 + j * 0.11
    box(f'frontwin{j}', M['dark'], x, FY - 0.002, G + 0.12, 0.035, 0.004, 0.05, outline=0, bevel=0)
    box(f'frontwinup{j}', M['dark'], x, FY - 0.002, G + 0.21, 0.035, 0.004, 0.05, outline=0, bevel=0)
# the dormer gables along the front roof
for j in range(4):
    x = -0.3 + j * 0.2
    box(f'dormer{j}', M['wall'], x, FY + 0.06, G + H - 0.01, 0.08, 0.04, 0.08, outline=0.003, bevel=0)
    gable(f'dormergable{j}', M['wall'], x, FY + 0.06, G + H + 0.065, 0.08, 0.04, 0.06, outline=0.003)
# the arcades in the courtyard, seen above the front wing's roof line
for f in range(3):
    for j in range(5):
        arch(f'arcade{f}{j}', M['dark'], -0.2 + j * 0.1, CY + D / 2 - T - 0.003, G + 0.02 + f * 0.09, 0.05, 0.07)
# the gate tower
GX = 0.0
box('gatetower', M['wall'], GX, FY - 0.04, G - 0.005, 0.14, 0.1, 0.42, outline=0.006, bevel=0)
arch('gate', M['dark'], GX, FY - 0.093, G - 0.005, 0.07, 0.12)
lathe('gatetowercap', M['roof'], ((0.08, 0), (0.06, 0.04), (0.04, 0.06), (0.05, 0.08), (0.0, 0.16)), G + 0.415, GX, FY - 0.04, segs=8, outline=0.004, smooth=False)

# ---------- the garden ----------
box('path', M['path'], GX, -0.65, G - 0.004, 0.12, 0.5, 0.008, outline=0.001, bevel=0)
for s in (-1, 1):
    for k in range(3):
        box(f'hedge{s}{k}', M['hedge'], s * (0.25 + k * 0.18), -0.55, G - 0.005, 0.14, 0.12, 0.05, outline=0.003, bevel=0)
for k, (x, y) in enumerate(((-0.85, 0.2), (0.85, 0.25), (-0.6, 0.75), (0.6, 0.75), (0.95, -0.35), (-0.95, -0.35))):
    tree(f'tree{k}', x, y, r=0.1, h=0.13)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
