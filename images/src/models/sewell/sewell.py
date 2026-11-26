# A cartoon Sewell for the country maps, built in the set's shared look (../toon.py): the copper
# mining town high in the Andes of Chile, the "city of stairs", with no streets: its wooden
# buildings painted green, yellow, red and blue climbing the steep slope of the mountain in
# terraces, joined by a great central staircase, the concentrator's long sloping shed, and the
# bare mountains round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sewell.py -- sewell-1024.png 1024 sewell.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'rock': toon('rock', '#a8968a', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'slope': toon('slope', '#968476', shadow_mul=(0.8, 0.78, 0.84)),
    'green': toon('green2', '#6ac08a', lift=0.2),
    'yellow': toon('yellow', '#f0c040', lift=0.2),
    'red': toon('red', '#d8503a', lift=0.15),
    'blue': toon('blue', '#5a9ad8', lift=0.2),
    'white': toon('white', '#f4f0e6', lift=0.22),
    'roof': toon('roof', '#6a6a70'),
    'wood': toon('wood', '#8a6a48'),
    'dark': flat('dark', '#2e2622'),
})

G = tile(M['rock'])
before = set(bpy.data.objects)
rng = random.Random(588417)

# ---------- the mountainside in terraces ----------
LEVELS = 5
for k in range(LEVELS):
    y0 = -0.6 + k * 0.3
    z = G + 0.08 * (k + 1)
    ring = [(-1.1, y0), (1.1, y0), (0.85, 1.0), (-0.85, 1.0)]
    t = loft(f'terrace{k}', M['slope'], [[(x, y, G - 0.01) for x, y in ring], [(x, y, z) for x, y in ring]], outline=0.005)
    t.visible_shadow = False

# ---------- the buildings on each terrace ----------
COLS = (M['green'], M['yellow'], M['red'], M['blue'], M['white'])
for k in range(LEVELS):
    y = -0.6 + k * 0.3 + 0.1
    z = G + 0.08 * (k + 1)
    x = -0.85 + 0.06 * (k % 2)
    j = 0
    while x < 0.7:
        w = 0.2 + 0.06 * rng.random()
        if -0.1 < x + w / 2 < 0.12:
            x += 0.12
            continue
        h = 0.1 + 0.06 * rng.random()
        hx = x + w / 2
        box(f'b{k}{j}', COLS[(k * 2 + j) % 5], hx, y, z - 0.005, w, 0.16, h, outline=0.004, bevel=0)
        gable(f'broof{k}{j}', M['roof'], hx, y, z + h - 0.005, w, 0.16, 0.05, ridge_x=True, over=0.01)
        for i in range(int(w / 0.06)):
            box(f'bwin{k}{j}{i}', M['white'], hx - w / 2 + 0.035 + i * 0.06, y - 0.083, z + h * 0.45, 0.025, 0.006, 0.03, outline=0, bevel=0)
        x += w + 0.03
        j += 1

# ---------- the great staircase ----------
for k in range(20):
    y = -0.75 + k * 0.075
    z = G + 0.02 * (k + 1)
    box(f'stair{k}', M['wood'], 0.0, y, G - 0.005, 0.12, 0.075, z - G + 0.005, outline=0.001, bevel=0)
for s in (-1, 1):
    bar(f'stairrail{s}', M['white'], (s * 0.065, -0.78, G + 0.05), (s * 0.065, 0.72, G + 0.45), 0.008, outline=0)

# ---------- the concentrator's sloping shed ----------
loft('shed', M['white'], [[(0.72, -0.4, G - 0.005), (0.95, -0.4, G - 0.005), (0.95, 0.6, G - 0.005), (0.72, 0.6, G - 0.005)],
                          [(0.72, -0.4, G + 0.08), (0.95, -0.4, G + 0.08), (0.95, 0.6, G + 0.45), (0.72, 0.6, G + 0.45)]], outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
