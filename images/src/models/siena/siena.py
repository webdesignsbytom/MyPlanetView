# A cartoon Siena for the country maps, built in the set's shared look (../toon.py): the
# shell-shaped Piazza del Campo sloping down in its nine brick sections to the Palazzo Pubblico, the
# palace's crenellated brick front, the slender Torre del Mangia rising high beside it with its
# white stone crown, the Fonte Gaia, and the brick palaces round the square. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P siena.py -- siena-1024.png 1024 siena.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8c4a4', shadow_mul=(0.86, 0.82, 0.8), lift=0.2),
    'campo': toon('campo', '#c8704a', shadow_mul=(0.86, 0.78, 0.76), lift=0.08),
    'travertine': toon('travertine', '#f0e8d8', lift=0.15),
    'brick': toon('brick', '#b8583a', shadow_mul=(0.86, 0.76, 0.72)),
    'stone': toon('stone', '#e8dcc4', lift=0.12),
    'window': flat('window', '#2e2a28'),
    'roof': toon('roof', '#c4573a'),
    'h0': toon('h0', '#d8a070'), 'h1': toon('h1', '#e8c090'), 'h2': toon('h2', '#c8865a'),
    'water': toon('water', '#5a9ac0', lift=0.3),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2281)

# ---------- the Campo: a fan of nine sections ----------
CX, CY = 0.0, 0.3   # the fan's centre, at the palace
R = 0.85
for k in range(9):
    a0 = math.radians(195 + k * 150 / 9)
    a1 = math.radians(195 + (k + 1) * 150 / 9)
    pts = [(CX, CY)] + [(CX + R * math.cos(a0 + (a1 - a0) * j / 4), CY + R * math.sin(a0 + (a1 - a0) * j / 4)) for j in range(5)]
    loft(f'section{k}', M['campo'], [[(x, y, G - 0.005) for x, y in pts], [(x, y, G + 0.004 + 0.0 * k) for x, y in pts]], outline=0.0)
    a = a1
    bar(f'line{k}', M['travertine'], (CX, CY, G + 0.006), (CX + R * math.cos(a), CY + R * math.sin(a), G + 0.006), 0.012, outline=0)
for j in range(24):
    a = math.radians(195 + j * 150 / 23)
    box(f'rim{j}', M['travertine'], CX + (R - 0.02) * math.cos(a), CY + (R - 0.02) * math.sin(a), G - 0.004, 0.08, 0.025, 0.012, rot_z=a + math.pi / 2, outline=0, bevel=0)
box('fontegaia', M['travertine'], CX - 0.05, CY - 0.62, G - 0.005, 0.24, 0.1, 0.06, outline=0.004, bevel=0)
box('fontegaiawater', M['water'], CX - 0.05, CY - 0.63, G + 0.03, 0.2, 0.06, 0.035, outline=0, bevel=0)

# ---------- the Palazzo Pubblico and the Torre del Mangia ----------
PX, PY = CX, CY + 0.12
box('palazzo', M['brick'], PX, PY, G - 0.005, 0.62, 0.2, 0.28, outline=0.011, bevel=0)
box('palazzobase', M['travertine'], PX, PY - 0.102, G - 0.005, 0.62, 0.006, 0.09, outline=0, bevel=0)
for r in range(2):
    for j in range(7):
        box(f'palwin{r}{j}', M['window'], PX - 0.26 + j * 0.087, PY - 0.104, G + 0.12 + r * 0.08, 0.035, 0.006, 0.05, outline=0, bevel=0)
box('palazzocentre', M['brick'], PX, PY, G + 0.275, 0.24, 0.18, 0.08, outline=0.007, bevel=0)
for j in range(14):
    box(f'merlon{j}', M['brick'], PX - 0.3 + j * 0.046, PY - 0.08, G + 0.275, 0.025, 0.04, 0.03, outline=0.002, bevel=0)
TX, TY = PX - 0.36, PY + 0.02
box('tower', M['brick'], TX, TY, G - 0.005, 0.09, 0.09, 0.82, outline=0.009, bevel=0)
box('towerbelt', M['travertine'], TX, TY, G + 0.81, 0.12, 0.12, 0.05, outline=0.005, bevel=0)
box('towerbelfry', M['travertine'], TX, TY, G + 0.855, 0.07, 0.07, 0.08, outline=0.005, bevel=0)
box('belfryopen', M['window'], TX, TY - 0.036, G + 0.87, 0.04, 0.006, 0.05, outline=0, bevel=0)
pyramid('towercap', M['travertine'], TX, TY, G + 0.93, 0.08, 0.06, outline=0.004)
box('cappella', M['travertine'], TX, TY - 0.08, G - 0.005, 0.12, 0.06, 0.08, outline=0.004, bevel=0)

# ---------- the palaces round the square ----------
for k in range(11):
    a = math.radians(200 + k * 14)
    x, y = CX + (R + 0.1) * math.cos(a), CY + (R + 0.1) * math.sin(a)
    if math.hypot(x, y) > 1.18:
        continue
    h = rng.uniform(0.14, 0.22)
    box(f'house{k}', M[f'h{k % 3}'], x, y, G - 0.005, 0.2, 0.14, h, rot_z=a + math.pi / 2, outline=0.006, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + h - 0.005, 0.2, 0.05, outline=0.004)

turn(before, -20)
render(G)
