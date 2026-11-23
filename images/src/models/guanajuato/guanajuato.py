# A cartoon Guanajuato for the country maps, built in the set's shared look (../toon.py): the old
# silver town's houses in every colour climbing the sides of its narrow valley, the yellow Basilica
# with its red dome and towers in the middle, the white University's stairway, and the Pípila
# statue on the hill above. Turned a little towards the camera.
# Run: blender -b --factory-startup -P guanajuato.py -- guanajuato-1024.png 1024 guanajuato.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#a8a070', shadow_mul=(0.82, 0.8, 0.74), lift=0.2),
    'hill': toon('hill', '#8a9a5a', shadow_mul=(0.74, 0.8, 0.74)),
    'h0': toon('h0', '#e8603a'), 'h1': toon('h1', '#3fa8b0'), 'h2': toon('h2', '#f0c030'), 'h3': toon('h3', '#e86a9a'), 'h4': toon('h4', '#8ac44a'), 'h5': toon('h5', '#a86ad0'),
    'h6': toon('h6', '#f2ece0', lift=0.2),
    'yellow': toon('basilicaYellow', '#f0b830', shadow_mul=(0.86, 0.78, 0.7), lift=0.15),
    'red': toon('domeRed', '#c8402c'),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'stone': toon('stone', '#a89a86', shadow_mul=(0.84, 0.84, 0.9)),
    'window': flat('window', '#3a3640'),
})

G = tile(M['valley'])
before = set(bpy.data.objects)
rng = random.Random(1847)

# ---------- the valley sides, stepping up left and right and behind ----------
for s in (-1, 1):
    for i in range(3):
        x0 = s * (0.35 + i * 0.22)
        loft(f'slope{s}{i}', M['hill'], [[(x0, -0.75, G - 0.01), (x0 + s * 0.24, -0.75, G - 0.01), (x0 + s * 0.24, 0.75, G - 0.01), (x0, 0.75, G - 0.01)],
                                         [(x0, -0.75, G + 0.06 + i * 0.08), (x0 + s * 0.24, -0.75, G + 0.06 + i * 0.08), (x0 + s * 0.24, 0.75, G + 0.06 + i * 0.08),
                                          (x0, 0.75, G + 0.06 + i * 0.08)]], outline=0.008)
        for j in range(5):
            y = -0.6 + j * 0.3
            x = x0 + s * 0.12
            if math.hypot(x, y) > 1.2:
                continue
            h = rng.uniform(0.07, 0.11)
            box(f'house{s}{i}{j}', M[f'h{(i + j + (s > 0)) % 7}'], x, y, G + 0.055 + i * 0.08, 0.16, 0.18, h, outline=0.007, bevel=0)
            box(f'housewin{s}{i}{j}', M['window'], x - s * 0.082, y, G + 0.08 + i * 0.08, 0.006, 0.04, 0.035, outline=0, bevel=0)

# ---------- the Basilica ----------
BX, BY = 0.0, 0.25
box('basilica', M['yellow'], BX, BY, G - 0.005, 0.24, 0.44, 0.2, outline=0.012, bevel=0)
for s in (-1, 1):
    box(f'btower{s}', M['yellow'], BX + s * 0.09, BY - 0.2, G - 0.005, 0.08, 0.08, 0.36, outline=0.008, bevel=0)
    lathe(f'btowercap{s}', M['red'], ((0.045, 0), (0.035, 0.04), (0.004, 0.09)), G + 0.355, BX + s * 0.09, BY - 0.2, segs=8, outline=0.004)
    box(f'btowerwin{s}', M['window'], BX + s * 0.09, BY - 0.244, G + 0.27, 0.025, 0.006, 0.05, outline=0, bevel=0)
lathe('bdrum', M['yellow'], ((0.08, 0), (0.08, 0.06)), G + 0.195, BX, BY + 0.1, segs=12, outline=0.006)
lathe('bdome', M['red'], ((0.085, 0), (0.075, 0.05), (0.045, 0.09), (0.004, 0.12)), G + 0.255, BX, BY + 0.1, segs=12, outline=0.006)
box('bdoor', M['window'], BX, BY - 0.224, G, 0.06, 0.006, 0.1, outline=0, bevel=0)

# ---------- the University's stairway and the Pípila ----------
UX, UY = 0.05, -0.5
box('university', M['white'], UX, UY, G - 0.005, 0.24, 0.14, 0.2, outline=0.01, bevel=0)
for i in range(8):
    box(f'ustair{i}', M['white'], UX, UY - 0.08 - i * 0.02, G - 0.005, 0.14, 0.03, 0.02 * (8 - i), outline=0.002, bevel=0)
for j in range(3):
    box(f'uwin{j}', M['window'], UX - 0.07 + j * 0.07, UY - 0.074, G + 0.12, 0.03, 0.006, 0.05, outline=0, bevel=0)
PX, PY = -0.95, 0.55
box('pipilabase', M['stone'], PX, PY, G + 0.3, 0.08, 0.08, 0.06, outline=0.005, bevel=0)
rod('pipila', M['stone'], (PX, PY, G + 0.36), (PX, PY, G + 0.48), 0.025, r2=0.018, segs=8, outline=0.004)
ball('pipilahead', M['stone'], PX, PY, G + 0.5, 0.018, outline=0.003)
bar('pipilatorch', M['stone'], (PX + 0.01, PY, G + 0.47), (PX + 0.03, PY, G + 0.56), 0.012, outline=0.002)

turn(before, -20)
render(G)
