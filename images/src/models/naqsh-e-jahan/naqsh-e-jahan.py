# A cartoon Naqsh-e Jahan Square for the country maps, built in the set's shared look (../toon.py):
# Isfahan's great square, the Shah Mosque's turquoise tiled dome and its tall blue portal between two
# minarets, the square's two-storey arcades of sand-coloured brick round the long pool, and the
# horse-drawn carriage. Turned a little towards the camera.
# Run: blender -b --factory-startup -P naqsh-e-jahan.py -- naqsh-e-jahan-1024.png 1024 naqsh-e-jahan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e2d6bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'brick': toon('brick', '#d8b88a', shadow_mul=(0.86, 0.8, 0.74)),
    'tile': toon('tileBlue', '#2a7ab8', shadow_mul=(0.76, 0.82, 0.92), lift=0.2),
    'turquoise': toon('turquoise', '#3ab0c0', shadow_mul=(0.76, 0.86, 0.9), lift=0.25),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#3a3640'),
    'pool': toon('pool', '#4aa8c8', lift=0.3),
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'horse': toon('horse', '#8a5a3a'),
    'carriage': toon('carriage', '#c8402c'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the square's arcades on three sides ----------
for k, (x, y, w, a) in enumerate(((-0.95, 0.0, 1.2, math.pi / 2), (0.95, 0.0, 1.2, math.pi / 2), (0.0, -0.72, 1.4, 0.0))):
    box(f'arcade{k}', M['brick'], x, y, G - 0.005, w, 0.1, 0.14, rot_z=a, outline=0.01, bevel=0)
    n = int(w / 0.09)
    for j in range(n):
        u = -w / 2 + (j + 0.5) * w / n
        for row in range(2):
            ox, oy = (u, -0.052) if a == 0.0 else (0.052 * (1 if x < 0 else -1), u)
            box(f'arch{k}{j}{row}', M['window'], x + ox, y + oy, G + 0.015 + row * 0.065, 0.04 if a == 0.0 else 0.006, 0.006 if a == 0.0 else 0.04, 0.045, outline=0,
                bevel=0)
box('pool', M['pool'], 0.0, -0.15, G - 0.003, 0.36, 0.5, 0.01, outline=0.004, bevel=0)
for s in (-1, 1):
    box(f'lawnstrip{s}', M['lawn'], s * 0.4, -0.15, G - 0.003, 0.3, 0.7, 0.01, outline=0.003, bevel=0)
    for j in range(4):
        ball(f'tree{s}{j}', M['tree'], s * 0.4, -0.45 + j * 0.2, G + 0.06, 0.05, outline=0.008)

# ---------- the Shah Mosque: portal, minarets, the dome ----------
MX, MY = 0.0, 0.6
box('portal', M['tile'], MX, MY - 0.05, G - 0.005, 0.32, 0.12, 0.42, outline=0.014, bevel=0)
box('iwan', M['turquoise'], MX, MY - 0.113, G + 0.04, 0.17, 0.006, 0.3, outline=0, bevel=0)
pyramid('iwantop', M['turquoise'], MX, MY - 0.113, G + 0.335, 0.17, 0.05, outline=0)
box('door', M['window'], MX, MY - 0.118, G - 0.005, 0.08, 0.006, 0.12, outline=0, bevel=0)
for s in (-1, 1):
    x = MX + s * 0.13
    lathe(f'minaret{s}', M['tile'], ((0.035, 0), (0.03, 0.6)), G - 0.005, x, MY - 0.05, segs=12, outline=0.008)
    cyl(f'minaretbalcony{s}', M['turquoise'], 0.05, 0.03, segs=12, outline=0.004, matrix=Matrix.Translation((x, MY - 0.05, G + 0.55)))
    lathe(f'minarettop{s}', M['turquoise'], ((0.035, 0), (0.025, 0.04), (0.004, 0.08)), G + 0.58, x, MY - 0.05, segs=12, outline=0.004)
box('prayerhall', M['brick'], MX, MY + 0.25, G - 0.005, 0.5, 0.32, 0.2, outline=0.012, bevel=0)
lathe('drum', M['tile'], ((0.16, 0), (0.16, 0.1)), G + 0.195, MX, MY + 0.25, segs=24, outline=0.01)
lathe('dome', M['turquoise'], ((0.17, 0), (0.19, 0.08), (0.17, 0.16), (0.1, 0.24), (0.03, 0.29), (0.004, 0.31)), G + 0.29, MX, MY + 0.25, segs=24, outline=0.012)
lathe('finial', M['gold'], ((0.012, 0), (0.004, 0.05)), G + 0.595, MX, MY + 0.25, segs=8, outline=0.002)

# ---------- a horse-drawn carriage ----------
CX, CY = 0.55, -0.4
box('carriage', M['carriage'], CX, CY, G + 0.03, 0.1, 0.07, 0.06, outline=0.005, bevel=0)
for fx in (0.1, 0.16):
    for side in (-1, 1):
        rod(f'horseleg{fx}{side}', M['horse'], (CX + fx, CY + side * 0.015, G), (CX + fx, CY + side * 0.015, G + 0.05), 0.007, segs=5, outline=0.002)
b = ball('horsebody', M['horse'], 0, 0, 0, 0.03, outline=0.004)
b.scale = (1.6, 0.8, 0.8)
b.location = (CX + 0.13, CY, G + 0.065)
ball('horsehead', M['horse'], CX + 0.19, CY, G + 0.09, 0.016, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
