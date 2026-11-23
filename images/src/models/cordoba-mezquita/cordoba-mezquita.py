# A cartoon Mezquita of Córdoba for the country maps, built in the set's shared look (../toon.py):
# the great mosque-cathedral, its prayer hall shown open so you see the forest of columns and the
# double horseshoe arches striped red and white, the cathedral nave rising in its middle, the bell
# tower that was the minaret, and the Courtyard of the Oranges. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cordoba-mezquita.py -- cordoba-mezquita-1024.png 1024 cordoba-mezquita.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d0b0', shadow_mul=(0.86, 0.82, 0.78), lift=0.2),
    'floor': toon('floor', '#c8b89a'),
    'wall': toon('wall', '#d8b47a', shadow_mul=(0.86, 0.8, 0.74), lift=0.1),
    'brick': toon('brick', '#c0452e'),
    'cream': toon('cream', '#f4ead4', lift=0.2),
    'column': toon('column', '#7a7068'),
    'roof': toon('roof', '#b8603e'),
    'bell': toon('bell', '#d8a030', lift=0.3),
    'door': flat('door', '#3a2a24'),
    'orange': toon('orangeTree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'fruit': toon('fruit', '#f08a2c', lift=0.25),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the open prayer hall: columns and striped double arches ----------
HX, HY = -0.1, 0.25
box('hallfloor', M['floor'], HX, HY, G - 0.004, 1.2, 0.8, 0.012, outline=0.004, bevel=0)
ROWS, BAYS = 5, 8
DX = 1.1 / BAYS
for r in range(ROWS):
    y = HY - 0.3 + r * 0.15
    for i in range(BAYS + 1):
        x = HX - 0.55 + i * DX
        rod(f'col{r}{i}', M['column'], (x, y, G), (x, y, G + 0.12), 0.01, segs=6, outline=0.002)
    for i in range(BAYS):
        x0 = HX - 0.55 + i * DX
        for level, (zb, rad) in enumerate(((G + 0.12, DX / 2), (G + 0.2, DX / 2))):
            pts = [(x0 + DX / 2 - rad * 1.05 * math.cos(math.pi * j / 6 - 0.15 * (1 if j else 0)), y, zb + rad * 0.9 * math.sin(math.pi * j / 6)) for j in range(7)]
            for j in range(6):
                bar(f'arch{r}{i}{level}{j}', M['brick' if j % 2 == 0 else 'cream'], pts[j], pts[j + 1], 0.022, outline=0.002)
        bar(f'pier{r}{i}', M['cream'], (x0, y, G + 0.12), (x0, y, G + 0.2), 0.016, outline=0.002)
# the outer walls on two sides, with horseshoe doors
for s in (-1, 1):
    box(f'sidewall{s}', M['wall'], HX + s * 0.61, HY, G - 0.005, 0.04, 0.8, 0.3, outline=0.007, bevel=0)
box('backwall', M['wall'], HX, HY + 0.41, G - 0.005, 1.26, 0.04, 0.3, outline=0.007, bevel=0)
for j in range(4):
    lathe(f'sidedoor{j}', M['door'], ((0.03, 0), (0.035, 0.05), (0.004, 0.1)), G + 0.02, HX - 0.632, HY - 0.25 + j * 0.16, segs=8, outline=0, smooth=False)
for j in range(14):
    lathe(f'merlon{j}', M['wall'], ((0.018, 0), (0.004, 0.04)), G + 0.295, HX - 0.6 + j * 0.092, HY + 0.41, segs=4, outline=0.002, smooth=False)

# ---------- the cathedral nave in the middle ----------
box('nave', M['cream'], HX + 0.05, HY + 0.1, G + 0.2, 0.22, 0.5, 0.22, outline=0.008, bevel=0)
loft('naveroof', M['roof'], [[(HX - 0.06, HY - 0.15, G + 0.415), (HX + 0.16, HY - 0.15, G + 0.415), (HX + 0.16, HY + 0.35, G + 0.415), (HX - 0.06, HY + 0.35, G + 0.415)],
                             [(HX + 0.046, HY - 0.15, G + 0.5), (HX + 0.054, HY - 0.15, G + 0.5), (HX + 0.054, HY + 0.35, G + 0.5), (HX + 0.046, HY + 0.35, G + 0.5)]], outline=0.006)
lathe('crossingdome', M['roof'], ((0.07, 0), (0.06, 0.04), (0.004, 0.07)), G + 0.43, HX + 0.05, HY + 0.1, segs=8, outline=0.004, smooth=False)

# ---------- the bell tower and the Courtyard of the Oranges ----------
TX, TY = HX + 0.4, HY - 0.62
box('tower', M['wall'], TX, TY, G - 0.005, 0.14, 0.14, 0.5, outline=0.009, bevel=0)
box('belfry', M['cream'], TX, TY, G + 0.495, 0.12, 0.12, 0.12, outline=0.007, bevel=0)
for s in (-1, 1):
    lathe(f'belfryarch{s}', M['door'], ((0.025, 0), (0.025, 0.05), (0.004, 0.08)), G + 0.52, TX + s * 0.03, TY - 0.062, segs=6, outline=0, smooth=False)
ball('bell', M['bell'], TX, TY - 0.02, G + 0.56, 0.025, outline=0.003)
lathe('towertop', M['cream'], ((0.05, 0), (0.045, 0.06), (0.02, 0.12)), G + 0.615, TX, TY, segs=8, outline=0.005, smooth=False)
ball('angel', M['bell'], TX, TY, G + 0.75, 0.02, outline=0.002)
for k in range(8):
    x = HX - 0.45 + (k % 4) * 0.25
    y = HY - 0.58 - (k // 4) * 0.18
    if abs(x - TX) < 0.12 and abs(y - TY) < 0.12:
        continue
    ball(f'orange{k}', M['orange'], x, y, G + 0.1, 0.07, outline=0.007)
    for j in range(3):
        ball(f'fruit{k}{j}', M['fruit'], x + 0.04 * math.cos(j * 2.1), y - 0.04, G + 0.1 + 0.03 * math.sin(j * 2.1), 0.012, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
