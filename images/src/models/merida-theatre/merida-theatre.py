# A cartoon Roman Theatre of Mérida for the country maps, built in the set's shared look
# (../toon.py): the stage front of Augusta Emerita, its two storeys of blue-grey marble columns with
# white capitals and entablatures, the marble statues standing between them, the stage before it,
# and the semicircle of stone seats rising round the orchestra, with cypresses. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P merida-theatre.py -- merida-theatre-1024.png 1024 merida-theatre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b890', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'wall': toon('wall', '#c8a878', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'column': toon('column', '#8a98a8', shadow_mul=(0.84, 0.86, 0.92), lift=0.08),
    'marble': toon('marble', '#f2ece0', lift=0.15),
    'seat': toon('seat', '#d8c8a8', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'wood': toon('wood', '#8a6a4a'),
    'dark': flat('dark', '#3a3028'),
    'cypress': toon('cypress', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the scaenae frons ----------
WY, WW = 0.42, 0.9
box('backwall', M['wall'], 0.0, WY + 0.05, G - 0.005, WW, 0.06, 0.32, outline=0.008, bevel=0)
box('stage', M['wood'], 0.0, WY - 0.1, G - 0.005, WW, 0.2, 0.05, outline=0.004, bevel=0)
box('podium', M['marble'], 0.0, WY - 0.01, G + 0.045, WW, 0.06, 0.03, outline=0.002, bevel=0)
for k, x in enumerate((-0.25, 0.0, 0.25)):
    box(f'door{k}', M['dark'], x, WY + 0.017, G + 0.07, 0.06 if k != 1 else 0.08, 0.006, 0.1, outline=0, bevel=0)
for r, (z0, h) in enumerate(((0.075, 0.13), (0.23, 0.09))):
    for j in range(12):
        x = -0.41 + j * 0.0745
        if r == 1 and j in (0, 11):
            continue
        rod(f'col{r}{j}', M['column'], (x, WY - 0.01, G + z0), (x, WY - 0.01, G + z0 + h), 0.011, segs=10, outline=0.002)
        box(f'capital{r}{j}', M['marble'], x, WY - 0.01, G + z0 + h - 0.004, 0.028, 0.028, 0.014, outline=0, bevel=0)
    box(f'entablature{r}', M['marble'], 0.0, WY - 0.01, G + z0 + h + 0.008, WW - (0.0 if r == 0 else 0.15), 0.04, 0.02, outline=0.002, bevel=0)
    for j in range(5):
        x = -0.3 + j * 0.15
        lathe(f'statue{r}{j}', M['marble'], ((0.012, 0), (0.01, 0.05), (0.007, 0.07)), G + z0 + 0.005, x + 0.037, WY + 0.01, segs=8, outline=0.001)
        ball(f'statuehead{r}{j}', M['marble'], x + 0.037, WY + 0.01, G + z0 + 0.085, 0.009, outline=0)

# ---------- the cavea ----------
OX, OY = 0.0, WY - 0.24
lathe('orchestra', M['seat'], ((0.14, 0), (0.14, 0.01)), G - 0.004, OX, OY, segs=24, outline=0.002)
rows, n = 8, 12
for j in range(rows):
    r0 = 0.16 + j * 0.06
    z = G + 0.02 + j * 0.026
    for k in range(n):
        a0 = math.pi + math.pi * k / n
        a1 = math.pi + math.pi * (k + 1) / n
        p = lambda r, a, zz: (OX + r * math.cos(a), OY + r * math.sin(a), zz)
        loft(f'seat{j}{k}', M['seat'], [[p(r0, a0, G - 0.005), p(r0 + 0.062, a0, G - 0.005), p(r0 + 0.062, a1, G - 0.005), p(r0, a1, G - 0.005)],
                                        [p(r0, a0, z), p(r0 + 0.062, a0, z), p(r0 + 0.062, a1, z), p(r0, a1, z)]], outline=0.002)
for k, (x, y) in enumerate(((-0.72, 0.4), (0.72, 0.4), (-0.85, -0.2), (0.85, -0.2), (-0.55, 0.65), (0.55, 0.65))):
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.035, 0.15), (0.004, 0.34)), G - 0.005, x, y, segs=10, outline=0.004)

turn(before, -20)
render(G)
