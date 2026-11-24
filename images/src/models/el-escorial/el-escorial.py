# A cartoon El Escorial for the country maps, built in the set's shared look (../toon.py): the
# vast grey granite monastery-palace of Philip II at the foot of the Guadarrama mountains, its long
# plain fronts with rows of small windows, the four corner towers with their slate spires, the
# basilica's two bell towers and great dome rising from the middle, and the slate roofs. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P el-escorial.py -- el-escorial-1024.png 1024 el-escorial.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b878', shadow_mul=(0.8, 0.8, 0.82), lift=0.2),
    'paving': toon('paving', '#d0c8b8'),
    'granite': toon('granite', '#bcb8ac', shadow_mul=(0.84, 0.84, 0.9), lift=0.08),
    'graniteDark': toon('graniteDark', '#9a968a'),
    'slate': toon('slate', '#4a4e56'),
    'window': flat('window', '#3a3a42'),
    'mountain': toon('mountain', '#7a8a6a', shadow_mul=(0.76, 0.8, 0.82)),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'tree': toon('tree', '#4f7a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

for k, (x, y, r, h) in enumerate(((-0.6, 0.85, 0.38, 0.28), (0.1, 1.0, 0.32, 0.34), (0.68, 0.8, 0.34, 0.24))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.65, h * 0.6), (r * 0.25, h * 0.92), (0.004, h)), G - 0.01, x, y, segs=20, outline=0.008)
    mt.visible_shadow = False
box('forecourt', M['paving'], 0.0, -0.55, G - 0.003, 1.0, 0.3, 0.008, outline=0.002, bevel=0)

X0, X1, Y0, Y1, H = -0.6, 0.6, -0.38, 0.5, 0.15
box('palace', M['granite'], 0.0, (Y0 + Y1) / 2, G - 0.005, X1 - X0, Y1 - Y0, H, outline=0.01, bevel=0)
loft('palaceroof', M['slate'], [[(X0, Y0, G + H - 0.005), (X1, Y0, G + H - 0.005), (X1, Y1, G + H - 0.005), (X0, Y1, G + H - 0.005)],
                                [(X0 + 0.06, Y0 + 0.06, G + H + 0.05), (X1 - 0.06, Y0 + 0.06, G + H + 0.05), (X1 - 0.06, Y1 - 0.06, G + H + 0.05), (X0 + 0.06, Y1 - 0.06, G + H + 0.05)]], outline=0.006)
for r in range(3):
    for j in range(20):
        x = X0 + 0.05 + j * (X1 - X0 - 0.1) / 19
        if abs(x) < 0.08:
            continue
        box(f'win{r}{j}', M['window'], x, Y0 - 0.003, G + 0.025 + r * 0.04, 0.018, 0.006, 0.022, outline=0, bevel=0)
box('portal', M['graniteDark'], 0.0, Y0 - 0.02, G - 0.005, 0.14, 0.04, 0.2, outline=0.004, bevel=0)
box('portaldoor', M['window'], 0.0, Y0 - 0.042, G - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)
loft('portalpediment', M['graniteDark'], [[(-0.07, Y0 - 0.04, G + 0.195), (0.07, Y0 - 0.04, G + 0.195), (0.07, Y0, G + 0.195), (-0.07, Y0, G + 0.195)],
                                          [(-0.004, Y0 - 0.04, G + 0.24), (0.004, Y0 - 0.04, G + 0.24), (0.004, Y0, G + 0.24), (-0.004, Y0, G + 0.24)]], outline=0.003)

# ---------- the corner towers ----------
for sx in (-1, 1):
    for sy, y in ((-1, Y0), (1, Y1)):
        x = sx * X1
        box(f'corner{sx}{sy}', M['granite'], x, y, G - 0.005, 0.12, 0.12, 0.3, outline=0.007, bevel=0)
        pyramid(f'cornerroof{sx}{sy}', M['slate'], x, y, G + 0.295, 0.13, 0.12, outline=0.004)
        rod(f'cornerneedle{sx}{sy}', M['slate'], (x, y, G + 0.41), (x, y, G + 0.5), 0.007, segs=6, outline=0.001)
        ball(f'cornerball{sx}{sy}', M['gold'], x, y, G + 0.49, 0.012, outline=0)

# ---------- the basilica ----------
BY = 0.12
box('basilica', M['granite'], 0.0, BY, G - 0.005, 0.36, 0.3, 0.26, outline=0.008, bevel=0)
for s in (-1, 1):
    box(f'belltower{s}', M['granite'], s * 0.14, BY - 0.12, G - 0.005, 0.1, 0.1, 0.42, outline=0.006, bevel=0)
    box(f'belfry{s}', M['window'], s * 0.14, BY - 0.172, G + 0.33, 0.035, 0.006, 0.06, outline=0, bevel=0)
    lathe(f'belltowercap{s}', M['slate'], ((0.055, 0), (0.045, 0.04), (0.012, 0.09), (0.004, 0.14)), G + 0.415, s * 0.14, BY - 0.12, segs=8, outline=0.003, smooth=False)
box('basilicafront', M['graniteDark'], 0.0, BY - 0.155, G - 0.005, 0.16, 0.012, 0.24, outline=0.002, bevel=0)
lathe('drum', M['granite'], ((0.12, 0), (0.12, 0.12)), G + 0.255, 0.0, BY + 0.04, segs=16, outline=0.006)
lathe('dome', M['slate'], ((0.125, 0), (0.11, 0.06), (0.06, 0.11), (0.004, 0.13)), G + 0.37, 0.0, BY + 0.04, segs=20, outline=0.006)
lathe('lantern', M['granite'], ((0.03, 0), (0.03, 0.05), (0.004, 0.12)), G + 0.49, 0.0, BY + 0.04, segs=8, outline=0.002, smooth=False)
ball('lanternball', M['gold'], 0.0, BY + 0.04, G + 0.615, 0.012, outline=0)

for k, (x, y, r) in enumerate(((-0.85, -0.25, 0.09), (0.85, -0.3, 0.09), (-0.8, 0.3, 0.08), (0.82, 0.25, 0.08))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.007)

turn(before, -20)
render(G)
