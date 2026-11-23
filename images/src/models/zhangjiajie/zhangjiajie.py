# A cartoon Zhangjiajie for the country maps, built in the set's shared look (../toon.py): the
# Wulingyuan sandstone pillars, tall and sheer, rising out of the green valley with pines clinging
# to their tops and ledges, wisps of mist between them, and a little viewing pavilion on one. Turned
# a little towards the camera.
# Run: blender -b --factory-startup -P zhangjiajie.py -- zhangjiajie-1024.png 1024 zhangjiajie.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#c8b8a0', shadow_mul=(0.84, 0.82, 0.86), lift=0.1),
    'rockDark': toon('rockDark', '#a89880', shadow_mul=(0.84, 0.82, 0.86)),
    'pine': toon('pine', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'mist': toon('mist', '#ffffff', shadow_mul=(0.88, 0.9, 0.97), lift=0.1),
    'red': toon('red', '#b8302a'),
    'roof': toon('roof', '#4a4a50'),
})

G = tile(M['valley'])
before = set(bpy.data.objects)
rng = random.Random(2209)

PILLARS = ((-0.1, 0.35, 0.16, 1.05), (0.3, 0.55, 0.13, 0.88), (-0.5, 0.55, 0.12, 0.8), (0.55, 0.15, 0.12, 0.72), (-0.65, 0.05, 0.11, 0.62),
           (0.2, -0.05, 0.1, 0.55), (-0.3, -0.2, 0.09, 0.45), (0.75, 0.6, 0.1, 0.6), (-0.85, 0.45, 0.09, 0.5), (0.0, 0.85, 0.11, 0.7))
for k, (x, y, r, h) in enumerate(PILLARS):
    rings = []
    for j, (f, z) in enumerate(((1.15, -0.01), (1.0, 0.2), (0.95, 0.5), (1.02, 0.8), (0.9, 1.0))):
        zz = h * z
        rings.append([(x + r * f * math.cos(t) * (1 + 0.12 * math.sin(3 * t + k + j)), y + r * f * math.sin(t) * (1 + 0.12 * math.cos(2 * t + k)), G + zz) for t in (2 * math.pi * i / 9 for i in range(9))])
    p = loft(f'pillar{k}', M['rock' if k % 3 else 'rockDark'], rings, outline=0.01)
    p.visible_shadow = False
    for j in range(3):
        bar(f'pillarcrack{k}{j}', M['rockDark'], (x - r * 0.4 + j * r * 0.4, y - r * 1.02, G + h * 0.15), (x - r * 0.35 + j * r * 0.4, y - r * 0.98, G + h * 0.85), 0.012, outline=0)
    for j in range(3):
        a = 2 * math.pi * j / 3 + k
        px, py = x + r * 0.45 * math.cos(a), y + r * 0.45 * math.sin(a)
        lathe(f'toppine{k}{j}', M['pine'], ((0.045, 0), (0.004, 0.12)), G + h * 0.98, px, py, segs=7, outline=0.004)
    a = rng.uniform(math.pi * 1.1, math.pi * 1.9)
    lathe(f'ledgepine{k}', M['pine'], ((0.03, 0), (0.004, 0.08)), G + h * 0.55, x + r * 1.0 * math.cos(a), y + r * 1.0 * math.sin(a), segs=6, outline=0.003)

# ---------- mist ----------
for k, (x, y, z, r) in enumerate(((-0.3, 0.3, 0.35, 0.16), (0.2, 0.3, 0.28, 0.14), (0.5, 0.4, 0.4, 0.12), (-0.6, 0.3, 0.25, 0.13), (0.05, 0.6, 0.45, 0.12), (-0.1, 0.0, 0.18, 0.12))):
    b = ball(f'mist{k}', M['mist'], 0, 0, 0, r, outline=0.006)
    b.scale = (1.8, 1.0, 0.45)
    b.location = (x, y, G + z)

# ---------- a viewing pavilion on the tallest ----------
x, y, r, h = PILLARS[0]
lathe('pavilion', M['red'], ((0.04, 0), (0.04, 0.05)), G + h * 0.98, x, y, segs=6, outline=0.003, smooth=False)
lathe('pavilionroof', M['roof'], ((0.065, 0), (0.02, 0.04), (0.004, 0.07)), G + h * 0.98 + 0.05, x, y, segs=6, outline=0.003, smooth=False)

# ---------- valley trees ----------
for k in range(14):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-1.0, -0.3)
    if math.hypot(x, y) > 1.15:
        continue
    ball(f'valleytree{k}', M['pine'], x, y, G + 0.05, rng.uniform(0.05, 0.08), outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
