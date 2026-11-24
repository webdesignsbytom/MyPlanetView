# A cartoon Kasbah of Algiers for the country maps, built in the set's shared look (../toon.py): the
# old citadel town of Algiers, its white cube houses with flat roof terraces tumbling down the
# hillside to the blue Mediterranean, the Ketchaoua mosque's twin octagonal towers at the foot of
# the hill, the citadel at the top, and the sea along the front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kasbah-of-algiers.py -- kasbah-of-algiers-1024.png 1024 kasbah-of-algiers.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#c8b88c', shadow_mul=(0.8, 0.78, 0.82), lift=0.18),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.8, 0.82, 0.9), lift=0.25),
    'cream': toon('cream2', '#eee2c8', lift=0.2),
    'stone': toon('stone', '#d0bc94', lift=0.15),
    'water': toon('water', '#2a8ac0', lift=0.3),
    'green': toon('green', '#3a8a5a'),
    'dark': flat('dark', '#2e2622'),
})

G = tile(M['hill'])
before = set(bpy.data.objects)
rng = random.Random(662102)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the sea along the front ----------
loft('sea', M['water'], [strip(-1.31, -0.78, 1.32, G - 0.004), strip(-1.31, -0.78, 1.32, G + 0.008)], outline=0.002)

# ---------- the houses tumbling down the hill ----------
for i in range(7):
    for j in range(6):
        x = -0.78 + i * 0.24 + 0.04 * (j % 2)
        y = -0.6 + j * 0.24
        if math.hypot(x, y) > 1.05 or (abs(x + 0.35) < 0.2 and y < -0.35):
            continue
        z = G + 0.06 * j
        h = 0.1 + 0.05 * rng.random()
        w, d = 0.2 + 0.03 * rng.random(), 0.2 + 0.03 * rng.random()
        box(f'house{i}{j}', M['white'] if (i * 3 + j) % 4 else M['cream'], x, y, G - 0.005, w, d, z - G + h, outline=0.004, bevel=0)
        box(f'parapet{i}{j}', M['white'], x, y - d / 2 + 0.008, z + h - 0.005, w, 0.016, 0.02, outline=0.001, bevel=0)
        if j > 0:
            box(f'door{i}{j}', M['dark'], x - 0.04, y - d / 2 - 0.003, z + h - 0.09, 0.03, 0.006, 0.05, outline=0, bevel=0)
        box(f'win{i}{j}', M['dark'], x + 0.05, y - d / 2 - 0.003, z + h - 0.06, 0.02, 0.006, 0.025, outline=0, bevel=0)

# ---------- the Ketchaoua mosque at the foot ----------
MX, MY = -0.35, -0.55
box('mosque', M['white'], MX, MY, G - 0.005, 0.3, 0.2, 0.18, outline=0.005, bevel=0)
for s in (-1, 1):
    lathe(f'tower{s}', M['white'], ((0.045, 0), (0.045, 0.3), (0.05, 0.31), (0.05, 0.33)), G - 0.005, MX + s * 0.15, MY - 0.08, segs=8, outline=0.004, smooth=False)
    lathe(f'towercap{s}', M['green'], ((0.045, 0), (0.0, 0.06)), G + 0.325, MX + s * 0.15, MY - 0.08, segs=8, outline=0.002, smooth=False)
for j in range(3):
    arch(f'mosquearch{j}', M['dark'], MX - 0.07 + j * 0.07, MY - 0.103, G - 0.005, 0.045, 0.1)
lathe('mosquedome', M['white'], [(0.08 * math.cos(a), 0.07 * math.sin(a)) for a in [k * math.pi / 12 for k in range(7)]], G + 0.175, MX, MY + 0.02, segs=16, outline=0.004)

# ---------- the citadel at the top ----------
CX, CY = 0.1, 0.78
box('citadel', M['stone'], CX, CY, G - 0.005, 0.5, 0.22, 0.42, outline=0.006, bevel=0)
for k in range(8):
    box(f'merlon{k}', M['stone'], CX - 0.22 + k * 0.063, CY - 0.1, G + 0.415, 0.03, 0.025, 0.03, outline=0.001, bevel=0)
box('citadelgate', M['dark'], CX, CY - 0.113, G + 0.32, 0.05, 0.006, 0.08, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
