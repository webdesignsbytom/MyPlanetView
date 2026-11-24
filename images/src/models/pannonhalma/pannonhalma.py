# A cartoon Pannonhalma Archabbey for the country maps, built in the set's shared look (../toon.py): the
# thousand-year-old Benedictine abbey on its hilltop in western Hungary, its tall neoclassical bell
# tower beside the long Gothic basilica, the monastery's long wings with their rows of windows round
# the courtyards, the round library, and the wooded hill with the vineyards on its slopes. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P pannonhalma.py -- pannonhalma-1024.png 1024 pannonhalma.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'vine': toon('vine', '#5a8a3a'),
    'wall': toon('wall', '#f0e6d0', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stone': toon('stone', '#d8ccb0', lift=0.12),
    'roof': toon('roof', '#a8503e'),
    'copper': toon('copper', '#4a8a6a', lift=0.12),
    'window': flat('window', '#3a3a46'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['hill'])
before = set(bpy.data.objects)

# ---------- the hill ----------
HZ = 0.28
hl = lathe('hill', M['hill'], ((1.28, 0), (1.15, 0.06), (0.9, 0.18), (0.7, 0.26), (0.6, HZ), (0.0, HZ)), G - 0.01, 0, 0.05, segs=40, outline=0.008)
hl.visible_shadow = False
T = G + HZ - 0.01
for k in range(9):
    a = math.pi * (1.15 + 0.7 * k / 8)
    for r in (0.85, 1.0, 1.15):
        x0, y0 = r * math.cos(a), 0.05 + r * math.sin(a)
        x1, y1 = r * math.cos(a + 0.07), 0.05 + r * math.sin(a + 0.07)
        z = G + HZ * max(0.0, min(1.0, (1.3 - r) / 0.7)) + 0.01
        bar(f'vinerow{k}{r}', M['vine'], (x0, y0, z), (x1, y1, z), 0.025, outline=0)


def wing(name, x, y, w, d, h):
    box(name, M['wall'], x, y, T - 0.005, w, d, h, outline=0.006, bevel=0)
    along_x = w >= d
    n = int((w if along_x else d) / 0.06)
    for row in range(2):
        for j in range(n):
            t = -(w if along_x else d) / 2 + (j + 0.5) * (w if along_x else d) / n
            if along_x:
                box(f'{name}win{row}{j}', M['window'], x + t, y - d / 2 - 0.003, T + 0.04 + row * 0.07, 0.022, 0.006, 0.04, outline=0, bevel=0)
            else:
                box(f'{name}win{row}{j}', M['window'], x - w / 2 - 0.003, y + t, T + 0.04 + row * 0.07, 0.006, 0.022, 0.04, outline=0, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2, y - d / 2, T + h - 0.005), (x + w / 2, y - d / 2, T + h - 0.005), (x + w / 2, y + d / 2, T + h - 0.005), (x - w / 2, y + d / 2, T + h - 0.005)],
                                    [(x - (w / 2 if along_x else 0.004), y - (0.004 if along_x else d / 2), T + h + 0.06), (x + (w / 2 if along_x else 0.004), y - (0.004 if along_x else d / 2), T + h + 0.06),
                                     (x + (w / 2 if along_x else 0.004), y + (0.004 if along_x else d / 2), T + h + 0.06), (x - (w / 2 if along_x else 0.004), y + (0.004 if along_x else d / 2), T + h + 0.06)]], outline=0.004)


# ---------- the monastery's wings ----------
wing('frontwing', 0.1, -0.1, 0.7, 0.14, 0.18)
wing('eastwing', 0.38, 0.15, 0.14, 0.4, 0.18)
wing('backwing', 0.1, 0.42, 0.6, 0.14, 0.18)
# the round library
lathe('library', M['wall'], ((0.1, 0), (0.1, 0.2)), T - 0.005, -0.32, -0.1, segs=20, outline=0.005)
lathe('librarydome', M['copper'], ((0.105, 0), (0.09, 0.04), (0.05, 0.08), (0.003, 0.1)), T + 0.195, -0.32, -0.1, segs=20, outline=0.004)
# the basilica, running front to back on the left
box('basilica', M['stone'], -0.15, 0.2, T - 0.005, 0.2, 0.5, 0.24, outline=0.007, bevel=0)
loft('basilicaroof', M['roof'], [[(-0.25, -0.05, T + 0.235), (-0.05, -0.05, T + 0.235), (-0.05, 0.45, T + 0.235), (-0.25, 0.45, T + 0.235)],
                                 [(-0.154, -0.05, T + 0.33), (-0.146, -0.05, T + 0.33), (-0.146, 0.45, T + 0.33), (-0.154, 0.45, T + 0.33)]], outline=0.004)
# the tall neoclassical bell tower at the basilica's front
BX, BY = -0.15, -0.0
box('belltower', M['wall'], BX, BY, T - 0.005, 0.13, 0.13, 0.58, outline=0.007, bevel=0)
for k in range(3):
    box(f'belltowerwin{k}', M['window'], BX, BY - 0.068, T + 0.24 + k * 0.1, 0.035, 0.006, 0.06, outline=0, bevel=0)
for k in range(4):
    a = k * math.pi / 2
    rod(f'belltowercol{k}', M['stone'], (BX + 0.05 * math.cos(a), BY + 0.05 * math.sin(a), T + 0.575), (BX + 0.05 * math.cos(a), BY + 0.05 * math.sin(a), T + 0.68), 0.01, segs=6, outline=0.001)
lathe('belltowerdrum', M['wall'], ((0.05, 0), (0.05, 0.1)), T + 0.575, BX, BY, segs=12, outline=0.003)
lathe('belltowerdome', M['copper'], ((0.06, 0), (0.05, 0.04), (0.025, 0.08), (0.003, 0.14)), T + 0.675, BX, BY, segs=12, outline=0.003)

for k in range(8):
    a = math.pi * (0.1 + 0.8 * k / 7)
    x, y = 1.0 * math.cos(a), 0.05 + 0.95 * math.sin(a)
    if math.hypot(x, y) > 1.2:
        continue
    ball(f'tree{k}', M['tree'], x, y, G + 0.21, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
