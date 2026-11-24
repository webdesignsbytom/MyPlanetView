# A cartoon Citadel of Besançon for the country maps, built in the set's shared look (../toon.py):
# Vauban's citadel along the top of its rocky hill, its massive stone fronts and bastions cut across
# the ridge, the long courtyard between them with the barracks and the chapel, the wooded cliffs
# falling to the river Doubs that loops round the hill, and the old town's roofs on the far bank.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P besancon.py -- besancon-1024.png 1024 besancon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'river': toon('river', '#4a8aa0', lift=0.3),
    'rock': toon('rock', '#b8a888', shadow_mul=(0.84, 0.82, 0.82)),
    'forest': toon('forest', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#d8c8a4', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#b8a684'),
    'roof': toon('roof', '#b8603e'),
    'slate': toon('slate', '#6a7280'),
    'dark': flat('dark', '#2e2a26'),
    'house': toon('house', '#e8dcc0', lift=0.12),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1668)

# ---------- the Doubs looping round the front of the hill ----------
for k in range(22):
    a0 = math.pi * (1.05 + 0.9 * k / 22)
    a1 = math.pi * (1.05 + 0.9 * (k + 1) / 22)
    quad = [(1.05 * math.cos(a0), 0.2 + 1.0 * math.sin(a0)), (1.2 * math.cos(a0), 0.2 + 1.12 * math.sin(a0)),
            (1.2 * math.cos(a1), 0.2 + 1.12 * math.sin(a1)), (1.05 * math.cos(a1), 0.2 + 1.0 * math.sin(a1))]
    if max(math.hypot(x, y) for x, y in quad) > 1.38:
        continue
    loft(f'doubs{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.006) for x, y in quad]], outline=0)

# ---------- the hill: wooded cliffs up to the citadel's ridge ----------
RX, RY = 0.0, 0.15
hl = lathe('hill', M['forest'], ((0.95, 0), (0.85, 0.12), (0.62, 0.28), (0.45, 0.36), (0.0, 0.38)), G - 0.01, RX, RY, segs=32, outline=0.008)
hl.visible_shadow = False
for k in range(10):
    a = rng.uniform(math.pi * 1.1, math.pi * 1.9)
    r = rng.uniform(0.62, 0.85)
    ball(f'cliff{k}', M['rock'], RX + r * math.cos(a), RY + r * math.sin(a), G + 0.16, rng.uniform(0.05, 0.08), outline=0.004)
T = G + 0.37

# ---------- the citadel: three fronts cut across the ridge, with the courtyard between ----------
for k, (y, w) in enumerate(((-0.25, 0.7), (0.1, 0.6), (0.48, 0.55))):
    box(f'front{k}', M['stone'], RX, RY + y, T - 0.005, w, 0.08, 0.16, outline=0.007, bevel=0)
    for s in (-1, 1):
        arrow = [(RX + s * w / 2, RY + y + 0.04), (RX + s * w / 2, RY + y - 0.04), (RX + s * (w / 2 + 0.1), RY + y - 0.12), (RX + s * (w / 2 + 0.14), RY + y)]
        if s < 0:
            arrow = arrow[::-1]
        loft(f'bastion{k}{s}', M['stone'], [[(x, yy, T - 0.06) for x, yy in arrow], [(x, yy, T + 0.15) for x, yy in arrow]], outline=0.005)
    box(f'frontgate{k}', M['dark'], RX, RY + y - 0.043, T, 0.05, 0.006, 0.08, outline=0, bevel=0)
for s in (-1, 1):
    box(f'sidewall{s}', M['stoneDark'], RX + s * 0.27, RY + 0.12, T - 0.005, 0.04, 0.7, 0.08, outline=0.003, bevel=0)
# the barracks and the chapel in the courtyard
for k, y in enumerate((-0.08, 0.29)):
    box(f'barracks{k}', M['stone'], RX - 0.08, RY + y, T - 0.005, 0.28, 0.12, 0.12, outline=0.004, bevel=0)
    for j in range(5):
        box(f'barrackswin{k}{j}', M['dark'], RX - 0.2 + j * 0.06, RY + y - 0.063, T + 0.04, 0.025, 0.006, 0.04, outline=0, bevel=0)
    loft(f'barracksroof{k}', M['slate'], [[(RX - 0.23, RY + y - 0.07, T + 0.115), (RX + 0.07, RY + y - 0.07, T + 0.115), (RX + 0.07, RY + y + 0.07, T + 0.115), (RX - 0.23, RY + y + 0.07, T + 0.115)],
                                          [(RX - 0.23, RY + y - 0.004, T + 0.17), (RX + 0.07, RY + y - 0.004, T + 0.17), (RX + 0.07, RY + y + 0.004, T + 0.17), (RX - 0.23, RY + y + 0.004, T + 0.17)]], outline=0.003)
box('chapel', M['house'], RX + 0.15, RY + 0.1, T - 0.005, 0.1, 0.16, 0.12, outline=0.004, bevel=0)
lathe('chapelbelfry', M['slate'], ((0.03, 0), (0.003, 0.08)), T + 0.115, RX + 0.15, RY + 0.05, segs=6, outline=0.002, smooth=False)

# ---------- the old town on the far bank ----------
for k, (x, y) in enumerate(((-0.95, -0.55), (-0.7, -0.85), (0.7, -0.85), (0.95, -0.55), (-0.35, -1.05), (0.35, -1.05))):
    if math.hypot(x, y) > 1.2:
        continue
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.18, 0.14, 0.12, outline=0.004, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.09, y - 0.07, G + 0.115), (x + 0.09, y - 0.07, G + 0.115), (x + 0.09, y + 0.07, G + 0.115), (x - 0.09, y + 0.07, G + 0.115)],
                                      [(x - 0.09, y - 0.004, G + 0.17), (x + 0.09, y - 0.004, G + 0.17), (x + 0.09, y + 0.004, G + 0.17), (x - 0.09, y + 0.004, G + 0.17)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
