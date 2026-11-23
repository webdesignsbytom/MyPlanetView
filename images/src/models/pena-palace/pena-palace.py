# A cartoon Pena Palace for the country maps, built in the set's shared look (../toon.py): the
# Romantic palace on its rocky peak above Sintra, its yellow and red towers, the grey stone of the
# old monastery, the onion-domed clock tower, crenellations and turrets, and the forest of the park
# round the hill. Turned a little towards the camera.
# Run: blender -b --factory-startup -P pena-palace.py -- pena-palace-1024.png 1024 pena-palace.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forest': toon('forest', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#8a8278', shadow_mul=(0.84, 0.84, 0.9)),
    'yellow': toon('penaYellow', '#f0c040', shadow_mul=(0.86, 0.78, 0.7), lift=0.15),
    'red': toon('penaRed', '#c8402c'),
    'grey': toon('grey', '#a8a49a', shadow_mul=(0.84, 0.84, 0.9)),
    'dome': toon('dome', '#c8a0a0', shadow_mul=(0.86, 0.78, 0.82)),
    'window': flat('window', '#2e3a54'),
    'tree': toon('tree', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'treeLight': toon('treeLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['forest'])
before = set(bpy.data.objects)
rng = random.Random(1979)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.07 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.07 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


hill = loft('hill', M['rock'], [ring(0.0, 0.2, 0.75, 0.55, -0.01, 1), ring(0.0, 0.22, 0.5, 0.36, 0.2, 1), ring(0.0, 0.24, 0.42, 0.3, 0.26, 1)], outline=0.016, smooth=True)
hill.visible_shadow = False
T = G + 0.26


def crenel(name, x, y, z, w, d, mat):
    for j in range(max(2, int(w / 0.04))):
        n = max(2, int(w / 0.04))
        box(f'{name}m{j}', M[mat], x - w / 2 + (j + 0.5) * w / n, y - d / 2, z, 0.018, 0.02, 0.025, outline=0.002, bevel=0)


# ---------- the grey monastery wing and the red block ----------
box('monastery', M['grey'], -0.12, 0.3, T - 0.005, 0.3, 0.2, 0.14, outline=0.01, bevel=0)
crenel('monastery', -0.12, 0.3, T + 0.135, 0.3, 0.2, 'grey')
box('redwing', M['red'], 0.18, 0.28, T - 0.005, 0.24, 0.2, 0.18, outline=0.01, bevel=0)
crenel('redwing', 0.18, 0.28, T + 0.175, 0.24, 0.2, 'red')
for j in range(3):
    box(f'redwin{j}', M['window'], 0.1 + j * 0.08, 0.176, T + 0.08, 0.025, 0.006, 0.05, outline=0, bevel=0)

# ---------- the yellow towers and the clock tower ----------
box('yellowblock', M['yellow'], -0.28, 0.15, T - 0.005, 0.2, 0.16, 0.2, outline=0.01, bevel=0)
crenel('yellowblock', -0.28, 0.15, T + 0.195, 0.2, 0.16, 'yellow')
for j in range(2):
    box(f'yellowwin{j}', M['window'], -0.32 + j * 0.08, 0.066, T + 0.09, 0.025, 0.006, 0.05, outline=0, bevel=0)
CX, CY = -0.05, 0.12
lathe('clocktower', M['yellow'], ((0.06, 0), (0.06, 0.3)), T - 0.005, CX, CY, segs=14, outline=0.01)
lathe('clockdome', M['dome'], ((0.068, 0), (0.07, 0.03), (0.05, 0.07), (0.02, 0.1), (0.004, 0.14)), T + 0.295, CX, CY, segs=14, outline=0.007)
for k, (x, y, h, mat) in enumerate(((0.32, 0.15, 0.26, 'yellow'), (-0.4, 0.35, 0.22, 'red'), (0.32, 0.4, 0.22, 'grey'))):
    lathe(f'tower{k}', M[mat], ((0.045, 0), (0.045, h)), T - 0.005, x, y, segs=12, outline=0.008)
    lathe(f'towercap{k}', M['grey' if mat != 'grey' else 'red'], ((0.05, 0), (0.004, 0.08)), T - 0.005 + h, x, y, segs=12, outline=0.005)

# ---------- the forest of the park ----------
for k in range(22):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.82, 1.25)
    ball(f'tree{k}', M['tree' if k % 2 else 'treeLight'], r * math.cos(a), r * math.sin(a), G + 0.08, rng.uniform(0.08, 0.11), outline=0.011)

turn(before, -20)
render(G)
