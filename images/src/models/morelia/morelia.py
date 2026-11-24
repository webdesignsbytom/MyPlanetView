# A cartoon Morelia for the country maps, built in the set's shared look (../toon.py): the colonial city
# of pink stone in Michoacán, its baroque cathedral with the two tall towers rising in stages and the
# dome with its tiles, and in front the long eighteenth-century aqueduct striding across on its
# arches, all in the same rosy cantera stone, with the city's trees. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P morelia.py -- morelia-1024.png 1024 morelia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8cdb8', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'cantera': toon('cantera', '#d89a84', shadow_mul=(0.8, 0.74, 0.8), lift=0.15),
    'canteraDark': toon('canteraDark', '#b87a66'),
    'tiles': toon('tiles', '#e8d8a0', lift=0.2),
    'tileBlue': toon('tileBlue', '#3a6aa8', lift=0.15),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'gold': toon('gold', '#e0b040', lift=0.2),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the cathedral ----------
CX, CY = 0.0, 0.45
box('body', M['cantera'], CX, CY + 0.15, G - 0.005, 0.4, 0.42, 0.28, outline=0.007, bevel=0)
box('bodyroof', M['canteraDark'], CX, CY + 0.15, G + 0.275, 0.38, 0.4, 0.02, outline=0.002, bevel=0)
box('front', M['cantera'], CX, CY - 0.06, G - 0.005, 0.24, 0.03, 0.38, outline=0.005, bevel=0)
box('portal', M['dark'], CX, CY - 0.077, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
cyl('portaltop', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((CX, CY - 0.077, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('frontwin', M['dark'], CX, CY - 0.077, G + 0.24, 0.035, 0.006, 0.05, outline=0, bevel=0)
for s in (-1, 1):
    for j in (0.05, 0.09):
        rod(f'frontcol{s}{j}', M['canteraDark'], (CX + s * j, CY - 0.085, G), (CX + s * j, CY - 0.085, G + 0.32), 0.008, segs=8, outline=0.001)
loft('frontcrest', M['cantera'], [[(CX - 0.09, CY - 0.075, G + 0.375), (CX + 0.09, CY - 0.075, G + 0.375), (CX + 0.09, CY - 0.045, G + 0.375), (CX - 0.09, CY - 0.045, G + 0.375)],
                                  [(CX - 0.02, CY - 0.075, G + 0.44), (CX + 0.02, CY - 0.075, G + 0.44), (CX + 0.02, CY - 0.045, G + 0.44), (CX - 0.02, CY - 0.045, G + 0.44)]], outline=0.003)
DY = CY + 0.25
lathe('drum', M['cantera'], ((0.1, 0), (0.1, 0.1)), G + 0.29, CX, DY, segs=8, outline=0.004, smooth=False)
lathe('dome', M['tiles'], ((0.11, 0), (0.1, 0.05), (0.07, 0.1), (0.03, 0.13), (0.0, 0.135)), G + 0.385, CX, DY, segs=24, outline=0.004)
for k in range(8):
    a = 2 * math.pi * k / 8
    bar(f'domerib{k}', M['tileBlue'], (CX + 0.112 * math.cos(a), DY + 0.112 * math.sin(a), G + 0.385), (CX + 0.072 * math.cos(a), DY + 0.072 * math.sin(a), G + 0.485), 0.014, outline=0)
lathe('lantern', M['cantera'], ((0.025, 0), (0.025, 0.05), (0.003, 0.09)), G + 0.51, CX, DY, segs=8, outline=0.002, smooth=False)
for s in (-1, 1):
    x = CX + s * 0.18
    box(f'tower{s}', M['cantera'], x, CY - 0.03, G - 0.005, 0.14, 0.14, 0.42, outline=0.006, bevel=0)
    for st, (w, z0, h) in enumerate(((0.12, 0.415, 0.13), (0.095, 0.54, 0.11), (0.07, 0.645, 0.08))):
        box(f'belfry{s}{st}', M['cantera'], x, CY - 0.03, G + z0, w, w, h, outline=0.004, bevel=0)
        box(f'belfryopen{s}{st}', M['dark'], x, CY - 0.03 - w / 2 - 0.004, G + z0 + 0.02, w * 0.4, 0.006, h - 0.05, outline=0, bevel=0)
        cyl(f'belfryarch{s}{st}', M['dark'], w * 0.2, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, CY - 0.03 - w / 2 - 0.004, G + z0 + h - 0.03)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        box(f'belfrycornice{s}{st}', M['canteraDark'], x, CY - 0.03, G + z0 + h - 0.008, w + 0.015, w + 0.015, 0.014, outline=0.001, bevel=0)
    lathe(f'towercap{s}', M['tiles'], ((0.035, 0), (0.03, 0.025), (0.003, 0.08)), G + 0.72, x, CY - 0.03, segs=8, outline=0.002, smooth=False)
    ball(f'towerball{s}', M['gold'], x, CY - 0.03, G + 0.805, 0.008, outline=0.001)

# ---------- the aqueduct striding across the front ----------
AY = -0.42
N, SPAN, PIER = 12, 0.11, 0.045
L = N * SPAN + (N + 1) * PIER
X0 = -L / 2
SPRING, TOP, RISE = G + 0.15, G + 0.21, 0.05
for k in range(N + 1):
    x = X0 + PIER / 2 + k * (SPAN + PIER)
    if math.hypot(abs(x) + PIER, AY) > 1.25:
        continue
    box(f'pier{k}', M['cantera'], x, AY, G - 0.005, PIER, 0.07, SPRING - G + 0.005, outline=0.004, bevel=0)
for k in range(N):
    x0 = X0 + PIER + k * (SPAN + PIER)
    if math.hypot(abs(x0 + SPAN / 2) + SPAN, AY) > 1.25:
        continue
    for j in range(6):
        um = (j + 0.5) / 6
        z = SPRING + RISE * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
        box(f'arch{k}_{j}', M['cantera'], x0 + SPAN * um, AY, z, SPAN / 6 + 0.002, 0.065, TOP - z, outline=0.002, bevel=0)
XL = min(1.12, L / 2)
box('channel', M['canteraDark'], 0.0, AY, TOP - 0.002, 2 * XL, 0.08, 0.035, outline=0.005, bevel=0)

for k, (x, y) in enumerate(((-0.6, 0.0), (0.6, 0.0), (-0.75, 0.45), (0.75, 0.45), (-0.3, -0.85), (0.35, -0.85))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.11, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
