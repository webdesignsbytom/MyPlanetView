# A cartoon Roman Theatre of Orange for the country maps, built in the set's shared look
# (../toon.py): the great stage wall, the best kept in the Roman world, rising sheer behind the stage
# with its niches, columns and the royal door, the statue of Augustus standing in his high niche,
# the stage roof over the front, and the semicircle of stone seats rising before it. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P orange-theatre.py -- orange-theatre-1024.png 1024 orange-theatre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b890', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'stone': toon('stone', '#c8a87a', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'stoneDark': toon('stoneDark', '#a88a5e'),
    'seat': toon('seat', '#d8c8a8', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'marble': toon('marble', '#f0eadc', lift=0.15),
    'wood': toon('wood', '#8a6a4a'),
    'glass': toon('glass', '#a8c0d0', lift=0.2),
    'dark': flat('dark', '#3a3028'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the stage wall ----------
WY, WW, WH = 0.45, 1.1, 0.46
box('wall', M['stone'], 0.0, WY, G - 0.005, WW, 0.1, WH, outline=0.01, bevel=0)
F = WY - 0.053
box('royaldoor', M['dark'], 0.0, F, G + 0.06, 0.08, 0.006, 0.12, outline=0, bevel=0)
cyl('royaldoortop', M['dark'], 0.04, 0.006, segs=14, outline=0, matrix=Matrix.Translation((0.0, F, G + 0.18)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    box(f'sidedoor{s}', M['dark'], s * 0.25, F, G + 0.06, 0.05, 0.006, 0.09, outline=0, bevel=0)
for r, z in enumerate((0.06, 0.2)):
    for j in range(10):
        x = -0.45 + j * 0.1
        if abs(x) < 0.06 or (r == 0 and abs(abs(x) - 0.25) < 0.04):
            continue
        rod(f'col{r}{j}', M['marble'], (x, F - 0.015, G + z), (x, F - 0.015, G + z + 0.12), 0.01, segs=8, outline=0.001)
        box(f'niche{r}{j}', M['stoneDark'], x + 0.05, F, G + z + 0.02, 0.035, 0.006, 0.08, outline=0, bevel=0)
    box(f'entablature{r}', M['marble'], 0.0, F - 0.012, G + z + 0.12, WW - 0.1, 0.03, 0.015, outline=0.001, bevel=0)
box('augustusniche', M['dark'], 0.0, F, G + 0.24, 0.08, 0.006, 0.12, outline=0, bevel=0)
cyl('augustusnichetop', M['dark'], 0.04, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0.0, F, G + 0.36)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('augustusplinth', M['marble'], 0.0, F - 0.02, G + 0.235, 0.05, 0.04, 0.02, outline=0.001, bevel=0)
lathe('augustus', M['marble'], ((0.018, 0), (0.015, 0.06), (0.012, 0.09)), G + 0.255, 0.0, F - 0.02, segs=10, outline=0.002)
ball('augustushead', M['marble'], 0.0, F - 0.02, G + 0.355, 0.012, outline=0.001)
rod('augustusarm', M['marble'], (0.012, F - 0.03, G + 0.33), (0.035, F - 0.05, G + 0.36), 0.005, segs=6, outline=0)
# the stage roof of glass and the stage floor
box('stage', M['wood'], 0.0, WY - 0.14, G - 0.005, WW - 0.1, 0.18, 0.05, outline=0.004, bevel=0)
loft('stageroof', M['glass'], [[(-0.5, WY - 0.05, G + WH - 0.02), (0.5, WY - 0.05, G + WH - 0.02), (0.5, WY - 0.05, G + WH - 0.005), (-0.5, WY - 0.05, G + WH - 0.005)],
                               [(-0.5, WY - 0.26, G + WH - 0.06), (0.5, WY - 0.26, G + WH - 0.06), (0.5, WY - 0.26, G + WH - 0.045), (-0.5, WY - 0.26, G + WH - 0.045)]], outline=0.004)

# ---------- the cavea ----------
OX, OY = 0.0, WY - 0.24
lathe('orchestra', M['seat'], ((0.14, 0), (0.14, 0.01)), G - 0.004, OX, OY, segs=24, outline=0.002)
rows, n = 9, 12
for j in range(rows):
    r0 = 0.16 + j * 0.055
    z = G + 0.02 + j * 0.026
    for k in range(n):
        a0 = math.pi + math.pi * k / n
        a1 = math.pi + math.pi * (k + 1) / n
        if j > 6 and abs(math.cos((a0 + a1) / 2)) < 0.3:
            continue
        p = lambda r, a, zz: (OX + r * math.cos(a), OY + r * math.sin(a), zz)
        loft(f'seat{j}{k}', M['seat'], [[p(r0, a0, G - 0.005), p(r0 + 0.057, a0, G - 0.005), p(r0 + 0.057, a1, G - 0.005), p(r0, a1, G - 0.005)],
                                        [p(r0, a0, z), p(r0 + 0.057, a0, z), p(r0 + 0.057, a1, z), p(r0, a1, z)]], outline=0.002)
for k, (x, y, r) in enumerate(((-0.85, 0.3, 0.11), (0.85, 0.3, 0.11), (-0.75, -0.6, 0.1), (0.75, -0.6, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
