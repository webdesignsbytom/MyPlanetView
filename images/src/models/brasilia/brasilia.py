# A cartoon Brasília for the country maps, built in the set's shared look (../toon.py): Niemeyer's
# cathedral, a crown of sixteen curved white concrete ribs with blue glass between them, its bell
# tower and the four evangelists at the door, and behind it the National Congress: the twin office
# towers joined in an H, the dome and the upturned bowl on their long platform, and the reflecting
# pool. Turned a little towards the camera.
# Run: blender -b --factory-startup -P brasilia.py -- brasilia-1024.png 1024 brasilia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'concrete': toon('concrete', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'glass': toon('glass', '#5a8ad0', shadow_mul=(0.76, 0.82, 0.92), lift=0.3),
    'towerGlass': toon('towerGlass', '#7a9ab8', shadow_mul=(0.76, 0.82, 0.92), lift=0.2),
    'pool': toon('pool', '#3a9ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'bronze': toon('bronze', '#7a6a54', shadow_mul=(0.82, 0.78, 0.76)),
    'paving': toon('paving', '#e8e2d4', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1307)

# ---------- the National Congress behind ----------
NX, NY = 0.25, 0.65
box('platform', M['concrete'], NX - 0.05, NY - 0.05, G - 0.005, 1.1, 0.28, 0.07, outline=0.012, bevel=0)
lathe('dome', M['concrete'], ((0.14, 0), (0.13, 0.04), (0.09, 0.08), (0.004, 0.1)), G + 0.065, NX - 0.35, NY - 0.05, segs=24, outline=0.01)
lathe('bowl', M['concrete'], ((0.04, 0), (0.12, 0.05), (0.18, 0.09), (0.19, 0.1)), G + 0.065, NX + 0.25, NY - 0.05, segs=24, outline=0.01)
for s in (-1, 1):
    tx = NX - 0.05 + s * 0.06
    box(f'congresstower{s}', M['towerGlass'], tx, NY + 0.12, G - 0.005, 0.07, 0.12, 0.62, outline=0.01, bevel=0)
    for j in range(8):
        box(f'towerband{s}{j}', M['concrete'], tx, NY + 0.059, G + 0.05 + j * 0.07, 0.072, 0.004, 0.012, outline=0, bevel=0)
box('towerbridge', M['towerGlass'], NX - 0.05, NY + 0.12, G + 0.3, 0.06, 0.1, 0.06, outline=0.006, bevel=0)
box('pool', M['pool'], NX - 0.05, NY - 0.28, G - 0.003, 1.0, 0.16, 0.01, outline=0.004, bevel=0)

# ---------- the cathedral: a crown of sixteen curved ribs, glass between ----------
CX, CY = -0.25, -0.25
cyl('cathpool', M['pool'], 0.42, 0.012, segs=32, outline=0.006, matrix=Matrix.Translation((CX, CY, G - 0.004)))
cyl('cathfloor', M['paving'], 0.3, 0.02, segs=32, outline=0.006, matrix=Matrix.Translation((CX, CY, G - 0.002)))
Z = G + 0.015
lathe('cathglass', M['glass'], ((0.27, 0), (0.2, 0.08), (0.135, 0.2), (0.14, 0.26), (0.2, 0.36)), Z, CX, CY, segs=32, outline=0.006)
RIB = [(0.3, 0.0), (0.24, 0.07), (0.17, 0.17), (0.15, 0.24), (0.19, 0.33), (0.24, 0.42)]
for k in range(16):
    a = 2 * math.pi * k / 16
    pts = [(CX + r * math.cos(a), CY + r * math.sin(a), Z + h) for r, h in RIB]
    for j in range(len(pts) - 1):
        rod(f'rib{k}_{j}', M['concrete'], pts[j], pts[j + 1], 0.02 if j < 2 else 0.016, r2=0.018 if j < 2 else 0.014, segs=6, outline=0.004)
lathe('cathcrown', M['concrete'], ((0.14, 0), (0.14, 0.02)), Z + 0.235, CX, CY, segs=32, outline=0.004)
# the bell tower and the four evangelists
BX, BY = CX + 0.45, CY - 0.1
box('belltowerfoot', M['concrete'], BX, BY, G - 0.005, 0.03, 0.03, 0.04, outline=0.004, bevel=0)
loft('belltower', M['concrete'], [[(BX - 0.015, BY - 0.012, G + 0.03), (BX + 0.015, BY - 0.012, G + 0.03), (BX + 0.015, BY + 0.012, G + 0.03), (BX - 0.015, BY + 0.012, G + 0.03)],
                                  [(BX - 0.05, BY - 0.008, G + 0.34), (BX + 0.05, BY - 0.008, G + 0.34), (BX + 0.05, BY + 0.008, G + 0.34), (BX - 0.05, BY + 0.008, G + 0.34)]],
     outline=0.006)
for k in range(4):
    x = CX - 0.12 + k * 0.08
    rod(f'evangelist{k}', M['bronze'], (x, CY - 0.38, G), (x, CY - 0.38, G + 0.1), 0.014, r2=0.01, segs=8, outline=0.003)
    ball(f'evangelisthead{k}', M['bronze'], x, CY - 0.38, G + 0.112, 0.012, outline=0.003)

# ---------- the Esplanade's trees ----------
for k, (x, y) in enumerate(((-0.95, 0.3), (-1.05, -0.1), (0.9, 0.1), (0.75, -0.4), (1.0, -0.6), (-0.85, -0.65))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, rng.uniform(0.07, 0.09), outline=0.012)

turn(before, -20)
render(G)
