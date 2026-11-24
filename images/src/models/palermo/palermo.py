# A cartoon Arab-Norman Palermo for the country maps, built in the set's shared look (../toon.py):
# Palermo Cathedral's long golden-stone front with its Gothic porch, the crenellated parapets of
# Arab-style merlons all round, its corner towers, the dome over the crossing, and beside it the
# little church of San Giovanni degli Eremiti with its five red domes among its garden's palms.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P palermo.py -- palermo-1024.png 1024 palermo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d4b8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'stone': toon('stone', '#e8c88a', shadow_mul=(0.86, 0.8, 0.72), lift=0.12),
    'stoneDark': toon('stoneDark', '#c8a464'),
    'white': toon('white', '#f0e8d4', lift=0.15),
    'red': toon('red', '#d0503a', shadow_mul=(0.86, 0.76, 0.74), lift=0.12),
    'tile': toon('tile', '#4a9a7a', lift=0.12),
    'dark': flat('dark', '#2e2622'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def merlons(name, x0, y0, x1, y1, z, step=0.05):
    n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
    for j in range(n):
        t = (j + 0.5) / n
        box(f'{name}{j}', M['stoneDark'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z, 0.022, 0.022, 0.035, outline=0.001, bevel=0)
        pyramid(f'{name}tip{j}', M['stoneDark'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z + 0.034, 0.022, 0.02, outline=0)


# ---------- the cathedral, its long side facing the camera ----------
CX, CY = -0.15, 0.2
L, D, H = 1.0, 0.34, 0.3
box('cathedral', M['stone'], CX, CY, G - 0.005, L, D, H, outline=0.009, bevel=0)
merlons('merlonfront', CX - L / 2, CY - D / 2, CX + L / 2, CY - D / 2, G + H - 0.005)
for j in range(8):
    x = CX - L / 2 + 0.08 + j * (L - 0.16) / 7
    box(f'win{j}', M['dark'], x, CY - D / 2 - 0.003, G + 0.15, 0.035, 0.006, 0.09, outline=0, bevel=0)
    pyramid(f'wintop{j}', M['dark'], x, CY - D / 2 - 0.003, G + 0.24, 0.035, 0.03, outline=0)
# the Gothic porch on the south side
box('porch', M['stone'], CX - 0.05, CY - D / 2 - 0.08, G - 0.005, 0.28, 0.14, 0.2, outline=0.006, bevel=0)
for j in range(3):
    x = CX - 0.05 - 0.09 + j * 0.09
    box(f'porcharch{j}', M['dark'], x, CY - D / 2 - 0.153, G - 0.005, 0.05, 0.006, 0.12, outline=0, bevel=0)
    pyramid(f'porcharchtop{j}', M['dark'], x, CY - D / 2 - 0.153, G + 0.115, 0.05, 0.04, outline=0)
merlons('merlonporch', CX - 0.19, CY - D / 2 - 0.15, CX + 0.09, CY - D / 2 - 0.15, G + 0.195)
# the corner towers and the dome
for k, (x, y) in enumerate(((CX - L / 2, CY - D / 2), (CX - L / 2, CY + D / 2), (CX + L / 2, CY - D / 2), (CX + L / 2, CY + D / 2))):
    box(f'tower{k}', M['stone'], x, y, G - 0.005, 0.08, 0.08, H + 0.14, outline=0.005, bevel=0)
    lathe(f'towercap{k}', M['stoneDark'], ((0.04, 0), (0.003, 0.08)), G + H + 0.135, x, y, segs=6, outline=0.002, smooth=False)
lathe('drum', M['white'], ((0.1, 0), (0.1, 0.08)), G + H - 0.005, CX + 0.25, CY, segs=16, outline=0.004)
lathe('dome', M['tile'], ((0.105, 0), (0.1, 0.05), (0.07, 0.1), (0.03, 0.13), (0.003, 0.15)), G + H + 0.075, CX + 0.25, CY, segs=20, outline=0.005)
lathe('lantern', M['white'], ((0.025, 0), (0.025, 0.04), (0.003, 0.07)), G + H + 0.22, CX + 0.25, CY, segs=8, outline=0.002)

# ---------- San Giovanni degli Eremiti in its garden ----------
box('garden', M['lawn'], 0.55, -0.45, G - 0.004, 0.6, 0.5, 0.012, outline=0.002, bevel=0)
EX, EY = 0.55, -0.45
box('eremiti', M['white'], EX, EY, G - 0.005, 0.3, 0.2, 0.16, outline=0.006, bevel=0)
box('eremititower', M['white'], EX + 0.12, EY - 0.05, G - 0.005, 0.09, 0.09, 0.26, outline=0.004, bevel=0)
for k, (dx, dy, r, z) in enumerate(((-0.08, 0.0, 0.07, 0.155), (0.04, 0.0, 0.07, 0.155), (-0.08, 0.08, 0.05, 0.155), (0.04, 0.08, 0.05, 0.155), (0.12, -0.05, 0.05, 0.255))):
    lathe(f'reddome{k}', M['red'], ((r, 0), (r * 0.95, r * 0.4), (r * 0.7, r * 0.78), (r * 0.3, r * 0.96), (0.003, r)), G + z, EX + dx, EY + dy, segs=16, outline=0.004)
box('eremitidoor', M['dark'], EX - 0.04, EY - 0.103, G - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)
for k, (x, y) in enumerate(((0.3, -0.62), (0.8, -0.3), (0.85, -0.6), (-0.75, -0.45), (-0.5, -0.6))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.28), 0.013, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, G + 0.28), (x + 0.02 + 0.09 * math.cos(a), y + 0.09 * math.sin(a), G + 0.24), 0.02, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
