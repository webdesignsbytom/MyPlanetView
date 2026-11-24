# A cartoon Zamość for the country maps, built in the set's shared look (../toon.py): the Renaissance
# "ideal town" in Poland, its pink Town Hall on the Great Market Square with the tall slender clock
# tower and the grand fan-shaped double staircase in front, and round the square the arcaded houses
# of the Armenian merchants painted in bright colours with their fancy attics. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P zamosc.py -- zamosc-1024.png 1024 zamosc.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobbles': toon('cobbles', '#c8c0b0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'pink': toon('pink', '#e8a8a0', lift=0.12),
    'red': toon('red', '#d8604a', lift=0.12),
    'yellow': toon('yellow', '#f0c860', lift=0.12),
    'blue': toon('blue', '#7aa8d0', lift=0.12),
    'green': toon('green', '#8ac08a', lift=0.12),
    'white': toon('white', '#f6f2ea', lift=0.2),
    'roof': toon('roof', '#b8503e'),
    'copper': toon('copper', '#4a8a6a', lift=0.12),
    'dark': flat('dark', '#2e2a2a'),
    'gold': toon('gold', '#e0b040', lift=0.2),
})

G = tile(M['cobbles'])
before = set(bpy.data.objects)

# ---------- the Town Hall ----------
TX, TY = 0.0, 0.35
box('townhall', M['pink'], TX, TY, G - 0.005, 0.44, 0.28, 0.24, outline=0.008, bevel=0)
for row in range(2):
    for j in range(5):
        box(f'thwin{row}{j}', M['dark'], TX - 0.16 + j * 0.08, TY - 0.143, G + 0.06 + row * 0.09, 0.03, 0.006, 0.05, outline=0, bevel=0)
loft('thattic', M['pink'], [[(TX - 0.22, TY - 0.14, G + 0.235), (TX + 0.22, TY - 0.14, G + 0.235), (TX + 0.22, TY - 0.12, G + 0.235), (TX - 0.22, TY - 0.12, G + 0.235)],
                            [(TX - 0.22, TY - 0.14, G + 0.28), (TX + 0.22, TY - 0.14, G + 0.28), (TX + 0.22, TY - 0.12, G + 0.28), (TX - 0.22, TY - 0.12, G + 0.28)]], outline=0.002)
loft('throof', M['roof'], [[(TX - 0.22, TY - 0.12, G + 0.235), (TX + 0.22, TY - 0.12, G + 0.235), (TX + 0.22, TY + 0.14, G + 0.235), (TX - 0.22, TY + 0.14, G + 0.235)],
                           [(TX - 0.22, TY + 0.006, G + 0.33), (TX + 0.22, TY + 0.006, G + 0.33), (TX + 0.22, TY + 0.014, G + 0.33), (TX - 0.22, TY + 0.014, G + 0.33)]], outline=0.004)
# the slender clock tower rising from the middle
box('clocktower', M['pink'], TX, TY + 0.02, G + 0.2, 0.1, 0.1, 0.3, outline=0.005, bevel=0)
cyl('clockface', M['white'], 0.03, 0.006, segs=14, outline=0.001, matrix=Matrix.Translation((TX, TY - 0.033, G + 0.42)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('clockdrum', M['pink'], ((0.045, 0), (0.045, 0.08)), G + 0.495, TX, TY + 0.02, segs=8, outline=0.003, smooth=False)
lathe('clockdome', M['copper'], ((0.05, 0), (0.045, 0.03), (0.02, 0.07), (0.025, 0.09), (0.003, 0.18)), G + 0.575, TX, TY + 0.02, segs=8, outline=0.003, smooth=False)
rod('clockfinial', M['gold'], (TX, TY + 0.02, G + 0.755), (TX, TY + 0.02, G + 0.8), 0.003, segs=4, outline=0)
# the fan-shaped double staircase in front
for i in range(5):
    t = i / 5
    w = 0.42 - t * 0.2
    box(f'stair{i}', M['white'], TX, TY - 0.19 - (4 - i) * 0.03, G - 0.005, w, 0.03, 0.025 + 0.025 * i, outline=0.001, bevel=0)
box('landing', M['white'], TX, TY - 0.16, G - 0.005, 0.2, 0.06, 0.14, outline=0.003, bevel=0)
box('door', M['dark'], TX, TY - 0.143, G + 0.13, 0.05, 0.006, 0.08, outline=0, bevel=0)

# ---------- the Armenian houses round the square ----------
COLS = ('red', 'yellow', 'blue', 'green', 'pink', 'yellow')
for k, (x, y, rot) in enumerate(((-0.6, 0.2, math.pi / 2), (-0.6, -0.15, math.pi / 2), (-0.6, -0.5, math.pi / 2),
                                 (0.6, 0.2, -math.pi / 2), (0.6, -0.15, -math.pi / 2), (0.6, -0.5, -math.pi / 2))):
    objs = set(bpy.data.objects)
    box(f'house{k}', M[COLS[k]], 0, 0.1, G - 0.005, 0.32, 0.2, 0.22, outline=0.005, bevel=0)
    for j in range(3):
        box(f'arcade{k}{j}', M['dark'], -0.1 + j * 0.1, -0.003, G - 0.005, 0.06, 0.006, 0.08, outline=0, bevel=0)
        box(f'housewin{k}{j}', M['dark'], -0.1 + j * 0.1, -0.003, G + 0.12, 0.03, 0.006, 0.05, outline=0, bevel=0)
    # the decorated attic hiding the roof, with its little scrolls and pinnacles
    box(f'attic{k}', M[COLS[k]], 0, 0.01, G + 0.215, 0.32, 0.02, 0.06, outline=0.003, bevel=0)
    for j in range(4):
        lathe(f'atticpin{k}{j}', M['white'], ((0.012, 0), (0.003, 0.04)), G + 0.27, -0.15 + j * 0.1, 0.01, segs=6, outline=0.001, smooth=False)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world

bpy.context.view_layer.update()
turn(before, -20)
render(G)
