# A cartoon Boboli Gardens for the country maps, built in the set's shared look (../toon.py): the
# Medici's great garden behind the Pitti Palace in Florence, Italy: the palace's rusticated
# stone wing, the amphitheatre of stepped grass with its obelisk and its granite basin, the
# Fountain of Neptune on its pool above, the clipped hedges and cypress avenues, and the
# Kaffeehaus. Turned a little towards the camera.
# Run: blender -b --factory-startup -P boboli.py -- boboli-1024.png 1024 boboli.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'lawn': toon('lawn', '#7ab04a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#d4c4a0', shadow_mul=(0.8, 0.8, 0.86), lift=0.16),
    'rustic': toon('rustic', '#b8a07a'),
    'roof': toon('roof', '#b8603e'),
    'gravel': toon('gravel', '#e8dcc4', lift=0.2),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'bronze': toon('bronze', '#5a6a5a', lift=0.2),
    'hedge': toon('hedge', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'cypress': toon('cypress', '#2e5e36', shadow_mul=(0.7, 0.78, 0.8)),
    'dark': flat('dark', '#2e2622'),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the Pitti Palace's garden front ----------
PX, PY = 0.0, -0.62
box('pitti', M['rustic'], PX, PY, G - 0.005, 0.9, 0.18, 0.22, outline=0.007, bevel=0)
for r in range(3):
    box(f'pittiband{r}', M['stone'], PX, PY - 0.093, G + 0.05 + r * 0.07, 0.9, 0.006, 0.008, outline=0, bevel=0)
for j in range(9):
    arch(f'pittiwin{j}', M['dark'], PX - 0.4 + j * 0.1, PY - 0.093, G + 0.08, 0.04, 0.09)
box('pitticornice', M['stone'], PX, PY, G + 0.215, 0.92, 0.2, 0.02, outline=0.002, bevel=0)

# ---------- the amphitheatre ----------
AX, AY = 0.0, -0.3
for k in range(5):
    r0 = 0.28 + k * 0.07
    for j in range(12):
        a0 = j * math.pi / 12
        a1 = a0 + math.pi / 12
        pts = [(AX + r0 * math.cos(a0), AY + r0 * math.sin(a0)), (AX + 0.66 * math.cos(a0), AY + 0.66 * math.sin(a0)),
               (AX + 0.66 * math.cos(a1), AY + 0.66 * math.sin(a1)), (AX + r0 * math.cos(a1), AY + r0 * math.sin(a1))]
        loft(f'tier{k}_{j}', M['lawn'] if k % 2 == 0 else M['stone'], [[(x, y, G - 0.005) for x, y in pts], [(x, y, G + 0.025 + k * 0.03) for x, y in pts]], outline=0.002)
lathe('arena', M['gravel'], ((0.28, 0), (0.28, 0.008)), G - 0.005, AX, AY, segs=32, outline=0.001)
lathe('obeliskbase', M['stone'], ((0.035, 0), (0.035, 0.04)), G - 0.005, AX, AY + 0.05, segs=4, outline=0.002, smooth=False)
lathe('obelisk', M['rustic'], ((0.025, 0), (0.016, 0.26), (0.0, 0.29)), G + 0.035, AX, AY + 0.05, segs=4, outline=0.003, smooth=False)
lathe('basin', M['stone'], ((0.07, 0), (0.08, 0.04), (0.06, 0.05)), G - 0.005, AX, AY - 0.12, segs=16, outline=0.003)

# ---------- Neptune's pool above, and the hedges and cypresses ----------
NX, NY = 0.0, 0.62
lathe('neptunepool', M['stone'], ((0.2, 0), (0.2, 0.03)), G - 0.005, NX, NY, segs=24, outline=0.003)
lathe('neptunewater', M['water'], ((0.18, 0), (0.18, 0.032)), G - 0.005, NX, NY, segs=24, outline=0)
lathe('neptunerock', M['rustic'], ((0.05, 0), (0.03, 0.06)), G + 0.02, NX, NY, segs=10, outline=0.002)
rod('neptune', M['bronze'], (NX, NY, G + 0.08), (NX, NY, G + 0.17), 0.016, segs=8, outline=0.002)
ball('neptunehead', M['bronze'], NX, NY, G + 0.185, 0.016, outline=0.002)
rod('trident', M['bronze'], (NX + 0.025, NY, G + 0.1), (NX + 0.025, NY, G + 0.23), 0.004, segs=6, outline=0)
for s in (-1, 1):
    for k in range(4):
        box(f'hedge{s}{k}', M['hedge'], s * (0.55 + 0.1 * (k % 2)), 0.1 + k * 0.18, G - 0.005, 0.16, 0.12, 0.05, outline=0.003, bevel=0)
    for k in range(5):
        x, y = s * 0.3, 0.35 + k * 0.12
        if y > 0.85:
            continue
        lathe(f'cypress{s}{k}', M['cypress'], ((0.035, 0), (0.04, 0.08), (0.02, 0.22), (0.0, 0.26)), G - 0.005, x, y, segs=10, outline=0.004)
# the Kaffeehaus on the hill
KX, KY = 0.75, 0.5
box('kaffeehaus', M['stone'], KX, KY, G - 0.005, 0.16, 0.12, 0.12, outline=0.004, bevel=0)
lathe('kaffeehausdome', M['bronze'], [(0.05 * math.cos(a), 0.06 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], G + 0.115, KX, KY, segs=12, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
