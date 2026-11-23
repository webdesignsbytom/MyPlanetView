# A cartoon Fountains Abbey for the country maps, built in the set's shared look (../toon.py): the
# great roofless Cistercian ruin in its Yorkshire valley, Abbot Huby's tall tower with its corner
# pinnacles, the open nave of round columns and arches, the east end's gable with its huge empty
# window, the cellarium's long range, and the River Skell running past on the lawns. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P fountains-abbey.py -- fountains-abbey-1024.png 1024 fountains-abbey.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a7a9a', lift=0.3),
    'stone': toon('stone', '#c8b898', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'stoneDark': toon('stoneDark', '#a89a7a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
for k, (p0, p1) in enumerate((((-1.1, -0.5), (-0.2, -0.42)), ((-0.2, -0.42), (0.5, -0.55)), ((0.5, -0.55), (1.05, -0.4)))):
    bar(f'river{k}', M['river'], (p0[0], p0[1], G - 0.001), (p1[0], p1[1], G - 0.001), 0.1, outline=0.002)

Y, X0, X1 = 0.12, -0.5, 0.3
# ---------- the nave: two arcades, open to the sky ----------
for s in (-1, 1):
    y = Y + s * 0.08
    xs = [X0 + 0.04 + j * 0.09 for j in range(9)]
    for j, x in enumerate(xs):
        rod(f'col{s}{j}', M['stone'], (x, y, G - 0.005), (x, y, G + 0.16), 0.016, segs=10, outline=0.002)
        if j < len(xs) - 1:
            m = 6
            for i in range(m):
                t0, t1 = i / m, (i + 1) / m
                bar(f'arch{s}{j}{i}', M['stone'], (x + 0.09 * t0, y, G + 0.16 + 0.045 * math.sin(math.pi * t0)), (x + 0.09 * t1, y, G + 0.16 + 0.045 * math.sin(math.pi * t1)), 0.022, outline=0.001)
    box(f'clerestory{s}', M['stone'], (X0 + X1) / 2, y, G + 0.2, X1 - X0 - 0.05, 0.03, 0.1, outline=0.004, bevel=0)
    box(f'aislewall{s}', M['stoneDark'], (X0 + X1) / 2, Y + s * 0.18, G - 0.005, X1 - X0 - 0.05, 0.025, 0.07, outline=0.003, bevel=0)
# the west gable
box('westgable', M['stone'], X0 - 0.02, Y, G - 0.005, 0.04, 0.2, 0.3, outline=0.005, bevel=0)
loft('westgabletop', M['stone'], [[(X0 - 0.04, Y - 0.1, G + 0.295), (X0, Y - 0.1, G + 0.295), (X0, Y + 0.1, G + 0.295), (X0 - 0.04, Y + 0.1, G + 0.295)],
                                  [(X0 - 0.04, Y - 0.004, G + 0.38), (X0, Y - 0.004, G + 0.38), (X0, Y + 0.004, G + 0.38), (X0 - 0.04, Y + 0.004, G + 0.38)]], outline=0.003)
# the east end with its great empty window: built round the opening
EX = X1 + 0.05
for s in (-1, 1):
    box(f'eastjamb{s}', M['stone'], EX, Y + s * 0.12, G - 0.005, 0.05, 0.08, 0.46, outline=0.005, bevel=0)
    lathe(f'eastpin{s}', M['stoneDark'], ((0.022, 0), (0.004, 0.08)), G + 0.455, EX, Y + s * 0.12, segs=6, outline=0.001, smooth=False)
box('eastsill', M['stone'], EX, Y, G - 0.005, 0.05, 0.16, 0.08, outline=0.004, bevel=0)
m = 8
for i in range(m):
    a0, a1 = math.pi * i / m, math.pi * (i + 1) / m
    bar(f'eastarch{i}', M['stone'], (EX, Y + 0.08 * math.cos(a0), G + 0.36 + 0.09 * math.sin(a0)), (EX, Y + 0.08 * math.cos(a1), G + 0.36 + 0.09 * math.sin(a1)), 0.04, outline=0.002)
box('eastmullion', M['stone'], EX, Y, G + 0.075, 0.02, 0.012, 0.3, outline=0, bevel=0)

# ---------- Huby's tower ----------
TX, TY = X1 - 0.12, Y + 0.22
box('tower', M['stone'], TX, TY, G - 0.005, 0.13, 0.13, 0.56, outline=0.008, bevel=0)
for k in range(3):
    box(f'towerwin{k}', M['stoneDark'], TX, TY - 0.068, G + 0.15 + k * 0.13, 0.04, 0.006, 0.09, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'towerpin{sx}{sy}', M['stoneDark'], ((0.016, 0), (0.004, 0.08)), G + 0.555, TX + sx * 0.058, TY + sy * 0.058, segs=4, outline=0.001, smooth=False)
for j in range(4):
    box(f'battlement{j}', M['stoneDark'], TX - 0.045 + j * 0.03, TY - 0.06, G + 0.555, 0.016, 0.016, 0.025, outline=0, bevel=0)

# ---------- the cellarium ----------
box('cellarium', M['stone'], X0 + 0.1, Y - 0.36, G - 0.005, 0.5, 0.12, 0.13, outline=0.006, bevel=0)
for j in range(7):
    box(f'cellwin{j}', M['stoneDark'], X0 - 0.12 + j * 0.07, Y - 0.423, G + 0.04, 0.02, 0.006, 0.05, outline=0, bevel=0)

for k, (x, y, r) in enumerate(((-0.85, 0.3, 0.13), (0.8, 0.35, 0.13), (-0.7, 0.7, 0.12), (0.6, 0.72, 0.12), (0.85, -0.1, 0.1), (-0.85, -0.15, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
