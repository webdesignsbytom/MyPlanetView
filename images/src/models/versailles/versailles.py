# A cartoon Palace of Versailles for the country maps, built in the set's shared look (../toon.py):
# the palace's long garden front in pale stone with its balustraded roofline, the parterres' clipped
# green patterns, the Latona fountain's tiered basin and jets, and the Grand Canal running away
# through the park. Turned a little towards the camera.
# Run: blender -b --factory-startup -P versailles.py -- versailles-1024.png 1024 versailles.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'gravel': toon('gravel', '#e2d8c2', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'stone': toon('stone', '#f0e6cc', shadow_mul=(0.84, 0.8, 0.82), lift=0.15),
    'roof': toon('roof', '#5a5e6a'),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#3a4a64'),
    'hedge': toon('hedge', '#3f8a46', shadow_mul=(0.7, 0.78, 0.8)),
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8)),
    'water': toon('water', '#4a9ac0', lift=0.3),
    'jet': toon('jet', '#e4f2fa', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['gravel'])
before = set(bpy.data.objects)
rng = random.Random(1511)

# ---------- the palace's garden front at the back ----------
PY = 0.75
box('palace', M['stone'], 0.0, PY, G - 0.005, 1.9, 0.22, 0.2, outline=0.014, bevel=0)
box('centre', M['stone'], 0.0, PY - 0.06, G - 0.005, 0.5, 0.22, 0.22, outline=0.012, bevel=0)
box('roofline', M['roof'], 0.0, PY + 0.02, G + 0.195, 1.86, 0.16, 0.04, outline=0.006, bevel=0)
for j in range(20):
    x = -0.9 + j * 0.095
    box(f'balustrade{j}', M['stone'], x, PY - 0.11, G + 0.2, 0.05, 0.015, 0.025, outline=0.002, bevel=0)
    for row in range(2):
        box(f'win{j}{row}', M['window'], x, PY - 0.114 - (0.06 if abs(x) < 0.25 else 0), G + 0.04 + row * 0.08, 0.035, 0.006, 0.06, outline=0, bevel=0)
for j in range(4):
    rod(f'statue{j}', M['stone'], (-0.15 + j * 0.1, PY - 0.17, G + 0.215), (-0.15 + j * 0.1, PY - 0.17, G + 0.27), 0.012, segs=6, outline=0.002)

# ---------- the parterres either side ----------
for s in (-1, 1):
    for i in range(2):
        for j in range(2):
            x, y = s * (0.35 + j * 0.3), 0.35 - i * 0.3
            box(f'parterre{s}{i}{j}', M['lawn'], x, y, G - 0.004, 0.24, 0.22, 0.01, outline=0.003, bevel=0)
            for k in range(4):
                a = k * math.pi / 2
                box(f'hedge{s}{i}{j}{k}', M['hedge'], x + 0.1 * math.cos(a), y + 0.09 * math.sin(a), G + 0.005, 0.22 if k % 2 else 0.03, 0.03 if k % 2 else 0.2, 0.03,
                    outline=0.003, bevel=0)
            lathe(f'topiary{s}{i}{j}', M['hedge'], ((0.025, 0), (0.004, 0.08)), G + 0.005, x, y, segs=8, outline=0.003)

# ---------- the Latona fountain and the Grand Canal ----------
FX, FY = 0.0, 0.15
for i, (r, h) in enumerate(((0.18, 0.03), (0.12, 0.06), (0.07, 0.09))):
    lathe(f'basin{i}', M['stone'], ((r, 0), (r, h)), G - 0.005, FX, FY, segs=24, outline=0.006)
    lathe(f'basinwater{i}', M['water'], ((r - 0.012, 0), (r - 0.012, 0.004)), G - 0.005 + h, FX, FY, segs=24, outline=0)
lathe('latona', M['gold'], ((0.02, 0), (0.012, 0.06)), G + 0.085, FX, FY, segs=8, outline=0.003)
for k in range(8):
    a = 2 * math.pi * k / 8
    rod(f'jet{k}', M['jet'], (FX + 0.14 * math.cos(a), FY + 0.14 * math.sin(a), G + 0.03), (FX + 0.09 * math.cos(a), FY + 0.09 * math.sin(a), G + 0.12), 0.007, segs=5,
        outline=0)
box('canal', M['water'], 0.0, -0.75, G - 0.003, 0.22, 0.8, 0.008, outline=0.004, bevel=0)
box('canalarm', M['water'], 0.0, -0.95, G - 0.003, 0.9, 0.12, 0.008, outline=0.004, bevel=0)
for s in (-1, 1):
    for k in range(5):
        y = -0.35 - k * 0.14
        if math.hypot(s * 0.28, y) > 1.25:
            continue
        ball(f'alley{s}{k}', M['tree'], s * 0.28, y, G + 0.08, 0.06, outline=0.01)

turn(before, -20)
render(G)
