# A cartoon Medieval City of Rhodes for the country maps, built in the set's shared look
# (../toon.py): the Palace of the Grand Master of the Knights of St John, its massive honey stone
# walls with battlements and the gate between two great round towers, the knights' city wall in
# front with its square towers and gate, and palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P rhodes.py -- rhodes-1024.png 1024 rhodes.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'stone': toon('stone', '#d0b888', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'stoneDark': toon('stoneDark', '#b09868'),
    'dark': flat('dark', '#3a3028'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def merlons(name, x0, x1, y, z, along='x'):
    n = max(2, int(abs(x1 - x0) / 0.05))
    for j in range(n):
        t = x0 + (j + 0.5) * (x1 - x0) / n
        px, py = (t, y) if along == 'x' else (y, t)
        box(f'{name}{j}', M['stoneDark'], px, py, z - 0.005, 0.028, 0.028, 0.035, outline=0.001, bevel=0)


# ---------- the palace ----------
PX, PY, W, D, H = 0.05, 0.32, 0.64, 0.44, 0.26
box('palace', M['stone'], PX, PY, G - 0.005, W, D, H, outline=0.01, bevel=0)
merlons('palacemerlon', PX - W / 2, PX + W / 2, PY - D / 2 + 0.01, G + H)
merlons('palacemerlonside', PY - D / 2, PY + D / 2, PX - W / 2 + 0.01, G + H, along='y')
for r in range(2):
    for j in range(8):
        x = PX - W / 2 + 0.06 + j * (W - 0.12) / 7
        if abs(x - PX) < 0.12:
            continue
        box(f'palwin{r}{j}', M['dark'], x, PY - D / 2 - 0.003, G + 0.08 + r * 0.09, 0.025, 0.006, 0.05, outline=0, bevel=0)
for s in (-1, 1):
    tx = PX + s * 0.11
    lathe(f'gatetower{s}', M['stone'], ((0.1, 0), (0.085, 0.08), (0.085, 0.36)), G - 0.005, tx, PY - D / 2 - 0.02, segs=20, outline=0.008)
    for j in range(8):
        a = 2 * math.pi * j / 8
        box(f'gatemerlon{s}{j}', M['stoneDark'], tx + 0.075 * math.cos(a), PY - D / 2 - 0.02 + 0.075 * math.sin(a), G + 0.35, 0.03, 0.03, 0.04, rot_z=a, outline=0.001, bevel=0)
    box(f'gatetowerwin{s}', M['dark'], tx, PY - D / 2 - 0.108, G + 0.24, 0.02, 0.006, 0.05, outline=0, bevel=0)
box('palacegate', M['dark'], PX, PY - D / 2 - 0.003, G - 0.005, 0.07, 0.006, 0.12, outline=0, bevel=0)
cyl('palacegatetop', M['dark'], 0.035, 0.006, segs=14, outline=0, matrix=Matrix.Translation((PX, PY - D / 2 - 0.003, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('gatebridge', M['stone'], PX, PY - D / 2 - 0.02, G + 0.24, 0.14, 0.1, 0.06, outline=0.004, bevel=0)

# ---------- the city wall ----------
WY = -0.4
box('citywall', M['stone'], 0.0, WY, G - 0.005, 1.6, 0.08, 0.16, outline=0.008, bevel=0)
merlons('citymerlon', -0.8, 0.8, WY - 0.03, G + 0.16)
for k, x in enumerate((-0.6, 0.0, 0.6)):
    box(f'walltower{k}', M['stone'], x, WY - 0.02, G - 0.005, 0.14, 0.14, 0.24, outline=0.007, bevel=0)
    merlons(f'walltowermerlon{k}', x - 0.07, x + 0.07, WY - 0.08, G + 0.24)
box('citygate', M['dark'], 0.0, WY - 0.093, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
cyl('citygatetop', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0.0, WY - 0.093, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

for k, (x, y) in enumerate(((-0.75, 0.1), (0.8, 0.05), (-0.35, -0.7), (0.4, -0.72))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)
