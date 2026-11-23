# A cartoon Lviv for the country maps, built in the set's shared look (../toon.py): Rynok Square,
# the Town Hall in its middle with its tall tower, clock and green-domed lantern with a flag, the
# tall narrow townhouses in every colour round the square, and its corner fountains. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P lviv.py -- lviv-1024.png 1024 lviv.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobbles': toon('cobbles', '#c0b4a4', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'hall': toon('hall', '#ece4d0', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'dome': toon('dome', '#3f9a7a'),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'clock': toon('clock', '#f8f6f0', lift=0.2),
    'window': flat('window', '#3a3640'),
    'roof': toon('roof', '#a8503a'),
    'h0': toon('h0', '#f0c050'), 'h1': toon('h1', '#e8806a'), 'h2': toon('h2', '#8ac8d0'), 'h3': toon('h3', '#a8d890'), 'h4': toon('h4', '#d8a8e0'), 'h5': toon('h5', '#f4ecd8'),
    'water': toon('water', '#6ab8e0', lift=0.3),
    'stone': toon('stone', '#d8d0c0'),
    'flagBlue': toon('flagBlue', '#2f6fc0'), 'flagYellow': toon('flagYellow', '#f8d030', lift=0.3),
})

G = tile(M['cobbles'])
before = set(bpy.data.objects)
rng = random.Random(2069)

# ---------- the townhouses round the square ----------
for k in range(7):
    x = -0.9 + k * 0.3
    h = rng.uniform(0.34, 0.44)
    box(f'backhouse{k}', M[f'h{k % 6}'], x, 0.82, G - 0.005, 0.28, 0.26, h, outline=0.008, bevel=0)
    for r in range(3):
        for j in range(3):
            box(f'backwin{k}{r}{j}', M['window'], x - 0.08 + j * 0.08, 0.688, G + 0.06 + r * 0.1, 0.035, 0.006, 0.055, outline=0, bevel=0)
    loft(f'backroof{k}', M['roof'], [[(x - 0.14, 0.69, G + h - 0.005), (x + 0.14, 0.69, G + h - 0.005), (x + 0.14, 0.95, G + h - 0.005), (x - 0.14, 0.95, G + h - 0.005)],
                                     [(x - 0.004, 0.69, G + h + 0.1), (x + 0.004, 0.69, G + h + 0.1), (x + 0.004, 0.95, G + h + 0.1), (x - 0.004, 0.95, G + h + 0.1)]],
         outline=0.006)
for s in (-1, 1):
    for k in range(4):
        y = 0.45 - k * 0.3
        h = rng.uniform(0.3, 0.4)
        box(f'sidehouse{s}{k}', M[f'h{(k + (3 if s > 0 else 0)) % 6}'], s * 0.98, y, G - 0.005, 0.24, 0.28, h, outline=0.008, bevel=0)
        for r in range(3):
            box(f'sidewin{s}{k}{r}', M['window'], s * 0.98 - s * 0.121, y, G + 0.06 + r * 0.1, 0.006, 0.12, 0.055, outline=0, bevel=0)
        pyramid(f'sideroof{s}{k}', M['roof'], s * 0.98, y, G + h - 0.005, 0.26, 0.1, outline=0.005)

# ---------- the Town Hall and its tower ----------
TX, TY = 0.0, 0.1
box('townhall', M['hall'], TX, TY, G - 0.005, 0.7, 0.5, 0.28, outline=0.012, bevel=0)
for r in range(2):
    for j in range(6):
        box(f'hallwin{r}{j}', M['window'], TX - 0.27 + j * 0.108, TY - 0.252, G + 0.06 + r * 0.11, 0.045, 0.006, 0.07, outline=0, bevel=0)
box('hallcornice', M['hall'], TX, TY, G + 0.27, 0.74, 0.54, 0.025, outline=0.005, bevel=0)
box('tower', M['hall'], TX, TY, G + 0.29, 0.2, 0.2, 0.42, outline=0.01, bevel=0)
for j in range(3):
    box(f'towerwin{j}', M['window'], TX, TY - 0.102, G + 0.34 + j * 0.1, 0.05, 0.006, 0.06, outline=0, bevel=0)
box('towerbelt', M['hall'], TX, TY, G + 0.7, 0.23, 0.23, 0.03, outline=0.005, bevel=0)
cyl('clock', M['clock'], 0.05, 0.008, segs=18, outline=0.004, matrix=Matrix.Translation((TX, TY - 0.104, G + 0.64)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('clockgold', M['gold'], 0.014, 0.004, segs=10, outline=0, matrix=Matrix.Translation((TX, TY - 0.11, G + 0.64)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('lantern', M['hall'], ((0.08, 0), (0.08, 0.12)), G + 0.73, TX, TY, segs=8, outline=0.006, smooth=False)
for j in range(8):
    a = 2 * math.pi * j / 8
    box(f'lanternwin{j}', M['window'], TX + 0.078 * math.cos(a), TY + 0.078 * math.sin(a), G + 0.76, 0.02, 0.006, 0.06, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('lanterndome', M['dome'], ((0.1, 0), (0.09, 0.05), (0.04, 0.1), (0.015, 0.14)), G + 0.85, TX, TY, segs=12, outline=0.006)
lathe('lanterncap', M['dome'], ((0.025, 0), (0.025, 0.05), (0.004, 0.09)), G + 0.99, TX, TY, segs=8, outline=0.003)
rod('flagpole', M['gold'], (TX, TY, G + 1.06), (TX, TY, G + 1.2), 0.005, segs=5, outline=0)
box('flagtop', M['flagBlue'], TX + 0.05, TY, G + 1.165, 0.1, 0.006, 0.03, outline=0.002, bevel=0)
box('flagbottom', M['flagYellow'], TX + 0.05, TY, G + 1.135, 0.1, 0.006, 0.03, outline=0.002, bevel=0)

# ---------- the corner fountains ----------
for k, (x, y) in enumerate(((-0.6, -0.55), (0.6, -0.55))):
    lathe(f'basin{k}', M['stone'], ((0.13, 0), (0.13, 0.05)), G - 0.005, x, y, segs=16, outline=0.005)
    lathe(f'water{k}', M['water'], ((0.11, 0), (0.11, 0.058)), G - 0.005, x, y, segs=16, outline=0.002)
    box(f'plinth{k}', M['stone'], x, y, G + 0.04, 0.05, 0.05, 0.12, outline=0.004, bevel=0)
    ball(f'statue{k}', M['stone'], x, y, G + 0.2, 0.035, outline=0.004)
    b = ball(f'statuebody{k}', M['stone'], 0, 0, 0, 0.03, outline=0.004)
    b.scale = (1.0, 1.0, 1.6)
    b.location = (x, y, G + 0.17)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
