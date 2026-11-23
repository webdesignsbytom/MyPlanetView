# A cartoon Ávila for the country maps, built in the set's shared look (../toon.py): the old town
# inside its complete medieval walls, the ochre granite curtain with its crenellations and the round
# towers close together all round, the Puerta del Alcázar's two great towers joined over the gate,
# the cathedral whose apse is itself a tower of the walls, and the red roofs inside. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P avila.py -- avila-1024.png 1024 avila.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c4bc84', shadow_mul=(0.8, 0.8, 0.82), lift=0.2),
    'wall': toon('wall', '#c8a87a', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'wallDark': toon('wallDark', '#a88a60'),
    'house': toon('house', '#ece0c8', lift=0.1),
    'roof': toon('roof', '#c4603e'),
    'church': toon('church', '#b8a080', shadow_mul=(0.86, 0.82, 0.78)),
    'slate': toon('slate', '#6a6a70'),
    'window': flat('window', '#3a3430'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2363)

WX, WY0, WY1, H = 0.85, -0.45, 0.55, 0.15
CY = (WY0 + WY1) / 2
box('wallfront', M['wall'], 0.0, WY0, G - 0.005, 2 * WX + 0.06, 0.06, H, outline=0.008, bevel=0)
box('wallback', M['wall'], 0.0, WY1, G - 0.005, 2 * WX + 0.06, 0.06, H, outline=0.008, bevel=0)
for s in (-1, 1):
    box(f'wallside{s}', M['wall'], s * WX, CY, G - 0.005, 0.06, WY1 - WY0, H, outline=0.008, bevel=0)

# the round towers (cubos), close together, half outside the curtain
spots = []
for j in range(11):
    x = -WX + j * (2 * WX / 10)
    if abs(x) > 0.15:
        spots.append((x, WY0 - 0.03))
    spots.append((x, WY1 + 0.03))
for j in range(1, 6):
    y = WY0 + j * (WY1 - WY0) / 6
    spots.append((-WX - 0.03, y))
    if abs(y - 0.12) > 0.1:
        spots.append((WX + 0.03, y))
for k, (x, y) in enumerate(spots):
    lathe(f'cubo{k}', M['wall'], ((0.055, 0), (0.055, H + 0.04)), G - 0.005, x, y, segs=14, outline=0.005)
    for j in range(4):
        a = 2 * math.pi * j / 4 + math.pi / 4
        box(f'cubomerlon{k}{j}', M['wallDark'], x + 0.045 * math.cos(a), y + 0.045 * math.sin(a), G + H + 0.03, 0.025, 0.025, 0.03, rot_z=a, outline=0.001, bevel=0)
# merlons along the curtain
for j in range(26):
    x = -WX + 0.03 + j * (2 * WX - 0.06) / 25
    for y in (WY0 - 0.02, WY1 + 0.02):
        box(f'merlon{j}{y}', M['wallDark'], x, y, G + H - 0.005, 0.03, 0.02, 0.03, outline=0.001, bevel=0)

# ---------- the Puerta del Alcázar ----------
for s in (-1, 1):
    lathe(f'gatetower{s}', M['wall'], ((0.08, 0), (0.08, 0.28)), G - 0.005, s * 0.1, WY0 - 0.04, segs=16, outline=0.006)
    for j in range(5):
        a = math.pi + math.pi * j / 4
        box(f'gatemerlon{s}{j}', M['wallDark'], s * 0.1 + 0.07 * math.cos(a), WY0 - 0.04 + 0.07 * math.sin(a), G + 0.27, 0.03, 0.03, 0.035, rot_z=a, outline=0.001, bevel=0)
box('gatebridge', M['wall'], 0.0, WY0 - 0.04, G + 0.15, 0.2, 0.1, 0.1, outline=0.005, bevel=0)
box('gate', M['window'], 0.0, WY0 - 0.092, G - 0.005, 0.07, 0.006, 0.1, outline=0, bevel=0)
cyl('gatearch', M['window'], 0.035, 0.006, segs=14, outline=0, matrix=Matrix.Translation((0.0, -0.542 - 0.0, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the cathedral, its apse the cimorro tower of the walls ----------
KY = 0.12
box('nave', M['church'], 0.55, KY, G - 0.005, 0.5, 0.18, 0.2, outline=0.008, bevel=0)
loft('naveroof', M['slate'], [[(0.3, KY - 0.09, G + 0.195), (0.8, KY - 0.09, G + 0.195), (0.8, KY + 0.09, G + 0.195), (0.3, KY + 0.09, G + 0.195)],
                              [(0.3, KY - 0.004, G + 0.26), (0.8, KY - 0.004, G + 0.26), (0.8, KY + 0.004, G + 0.26), (0.3, KY + 0.004, G + 0.26)]], outline=0.005)
lathe('cimorro', M['wall'], ((0.13, 0), (0.13, 0.24)), G - 0.005, WX + 0.02, KY, segs=20, outline=0.008)
for j in range(8):
    a = -math.pi / 2 + math.pi * j / 7
    box(f'cimorromerlon{j}', M['wallDark'], WX + 0.02 + 0.115 * math.cos(a), KY + 0.115 * math.sin(a), G + 0.23, 0.035, 0.03, 0.04, rot_z=a, outline=0.001, bevel=0)
box('belltower', M['church'], 0.28, KY - 0.02, G - 0.005, 0.13, 0.13, 0.38, outline=0.008, bevel=0)
box('belfry', M['window'], 0.28, KY - 0.087, G + 0.28, 0.05, 0.006, 0.06, outline=0, bevel=0)
pyramid('towercap', M['slate'], 0.28, KY - 0.02, G + 0.375, 0.13, 0.08, outline=0.004)
box('portal', M['window'], 0.4, KY - 0.092, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)

# ---------- the houses inside ----------
for k in range(40):
    x = -0.7 + (k % 8) * 0.17 + rng.uniform(-0.02, 0.02)
    y = -0.3 + (k // 8) * 0.17 + rng.uniform(-0.02, 0.02)
    if y > 0.45 or (x > 0.15 and -0.02 < y < 0.26) or (x > 0.55):
        continue
    h = rng.uniform(0.07, 0.12)
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.13, 0.11, h, outline=0.004, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + h - 0.01, 0.14, 0.05, outline=0.003)

turn(before, -20)
render(G)
