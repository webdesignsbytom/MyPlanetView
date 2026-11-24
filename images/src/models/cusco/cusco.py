# A cartoon Cusco for the country maps, built in the set's shared look (../toon.py): the Plaza de
# Armas, the stone cathedral with its two towers and the ornate church of La Compañía beside it, the
# colonial arcades with their carved wooden balconies round the square, its fountain and gardens, an
# Inca wall of perfectly fitted stones in front, and the red roofs climbing the green hills behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P cusco.py -- cusco-1024.png 1024 cusco.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'garden': toon('garden', '#6aa54a'),
    'stone': toon('stone', '#b8a890', shadow_mul=(0.84, 0.82, 0.86), lift=0.08),
    'stoneDark': toon('stoneDark', '#988870', shadow_mul=(0.84, 0.82, 0.86)),
    'inca': toon('inca', '#8a8478', shadow_mul=(0.84, 0.84, 0.88)),
    'white': toon('white', '#f2ece0', lift=0.15),
    'roof': toon('roof', '#c4603e'),
    'wood': toon('wood', '#6a3a24'),
    'window': flat('window', '#3a3430'),
    'hill': toon('hill', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'water': toon('water', '#5aa8d0', lift=0.3),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2333)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


for k, (x, y, r, h) in enumerate(((-0.55, 0.92, 0.3, 0.3), (0.0, 1.0, 0.3, 0.36), (0.55, 0.92, 0.3, 0.28))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.75, h * 0.6), (r * 0.35, h * 0.95), (0.004, h)), G - 0.01, x, y, segs=24, outline=0.01)
    hl.visible_shadow = False
for k, x in enumerate((-0.66, -0.44, -0.22, 0.0, 0.22, 0.44, 0.66)):
    y = 0.66 + 0.03 * (k % 2)
    box(f'house{k}', M['white'], x, y, G - 0.005, 0.18, 0.12, 0.12, outline=0.004, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.1, y - 0.07, G + 0.115), (x + 0.1, y - 0.07, G + 0.115), (x + 0.1, y + 0.07, G + 0.115), (x - 0.1, y + 0.07, G + 0.115)],
                                      [(x - 0.1, y - 0.004, G + 0.17), (x + 0.1, y - 0.004, G + 0.17), (x + 0.1, y + 0.004, G + 0.17), (x - 0.1, y + 0.004, G + 0.17)]], outline=0.003)

# ---------- the plaza ----------
box('plazagarden', M['garden'], 0.0, -0.15, G - 0.003, 0.6, 0.4, 0.01, outline=0.002, bevel=0)
for a in (0, math.pi / 2):
    box(f'plazapath{a}', M['paving'], 0.0, -0.15, G - 0.002, 0.6 if a == 0 else 0.06, 0.06 if a == 0 else 0.4, 0.012, outline=0, bevel=0)
lathe('fountainbasin', M['stone'], ((0.08, 0), (0.08, 0.03)), G - 0.005, 0.0, -0.15, segs=12, outline=0.003)
lathe('fountainwater', M['water'], ((0.07, 0), (0.07, 0.034)), G - 0.005, 0.0, -0.15, segs=12, outline=0.001)
lathe('fountaintop', M['stone'], ((0.02, 0), (0.015, 0.1), (0.035, 0.12)), G + 0.02, 0.0, -0.15, segs=8, outline=0.002)


def church(name, x, y, w, h, tower_h):
    box(name, M['stone'], x, y, G - 0.005, w, 0.2, h, outline=0.009, bevel=0)
    box(f'{name}portal', M['stoneDark'], x, y - 0.102, G - 0.005, w * 0.35, 0.006, h * 0.8, outline=0, bevel=0)
    box(f'{name}door', M['window'], x, y - 0.104, G - 0.005, w * 0.15, 0.006, h * 0.35, outline=0, bevel=0)
    for s in (-1, 1):
        tx = x + s * (w / 2 - 0.05)
        box(f'{name}tower{s}', M['stone'], tx, y - 0.051, G - 0.005, 0.1, 0.1, tower_h, outline=0.006, bevel=0)
        box(f'{name}belfry{s}', M['window'], tx, y - 0.103, G + tower_h - 0.1, 0.04, 0.006, 0.06, outline=0, bevel=0)
        lathe(f'{name}cupola{s}', M['stoneDark'], ((0.05, 0), (0.04, 0.03), (0.004, 0.07)), G + tower_h - 0.005, tx, y - 0.051, segs=8, outline=0.003)


church('cathedral', -0.35, 0.4, 0.5, 0.22, 0.4)
church('compania', 0.38, 0.32, 0.36, 0.24, 0.44)

# ---------- the arcades with their balconies ----------
for s in (-1, 1):
    AX = s * 0.78
    box(f'arcadeblock{s}', M['white'], AX, -0.1, G - 0.005, 0.2, 0.7, 0.18, outline=0.007, bevel=0)
    for j in range(5):
        y = -0.38 + j * 0.14
        box(f'arch{s}{j}', M['window'], AX - s * 0.102, y, G - 0.005, 0.006, 0.08, 0.08, outline=0, bevel=0)
        box(f'balcony{s}{j}', M['wood'], AX - s * 0.115, y, G + 0.1, 0.03, 0.1, 0.05, outline=0.002, bevel=0)
    loft(f'arcaderoof{s}', M['roof'], [[(AX - 0.1, -0.45, G + 0.175), (AX + 0.1, -0.45, G + 0.175), (AX + 0.1, 0.25, G + 0.175), (AX - 0.1, 0.25, G + 0.175)],
                                       [(AX - 0.004, -0.45, G + 0.23), (AX + 0.004, -0.45, G + 0.23), (AX + 0.004, 0.25, G + 0.23), (AX - 0.004, 0.25, G + 0.23)]], outline=0.004)

# ---------- an Inca wall of fitted stones ----------
WY = -0.72
for j in range(9):
    for r in range(2):
        x = -0.45 + j * 0.11 + (0.05 if r else 0) + rng.uniform(-0.01, 0.01)
        w = rng.uniform(0.09, 0.11)
        h = rng.uniform(0.05, 0.07)
        b = ball(f'incastone{j}{r}', M['inca'], 0, 0, 0, 0.5, outline=0.004)
        b.scale = (w, 0.06, h)
        b.location = (x, WY, G + 0.03 + r * 0.06)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
