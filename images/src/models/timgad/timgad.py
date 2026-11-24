# A cartoon Timgad for the country maps, built in the set's shared look (../toon.py): Trajan's Arch
# standing over the paved main street of the Roman colony in the Aurès hills, its three arches between
# Corinthian columns on tall pedestals, the colonnaded streets running off it in a grid, the
# low walls of the town's blocks and the broken column shafts. Turned a little towards the camera.
# Run: blender -b --factory-startup -P timgad.py -- timgad-1024.png 1024 timgad.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b888', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'street': toon('street', '#b8ac94'),
    'stone': toon('stone', '#dcc8a0', shadow_mul=(0.86, 0.84, 0.8), lift=0.1),
    'stoneDark': toon('stoneDark', '#b8a47c'),
    'dark': flat('dark', '#3a3028'),
    'hill': toon('hill', '#b0a070', shadow_mul=(0.8, 0.8, 0.82)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2647)

for k, (x, y, r, h) in enumerate(((-0.6, 0.88, 0.36, 0.2), (0.2, 0.98, 0.3, 0.24), (0.75, 0.72, 0.3, 0.17))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.65), (r * 0.3, h * 0.95), (0.004, h)), G - 0.01, x, y, segs=20, outline=0.008)
    hl.visible_shadow = False

# ---------- the grid of streets ----------
box('decumanus', M['street'], 0.0, -0.05, G - 0.003, 1.8, 0.12, 0.008, outline=0, bevel=0)
box('cardo', M['street'], 0.0, -0.05, G - 0.003, 0.12, 1.4, 0.008, outline=0, bevel=0)
for k, x in enumerate((-0.45, 0.45)):
    box(f'sidestreet{k}', M['street'], x, -0.05, G - 0.003, 0.06, 1.2, 0.008, outline=0, bevel=0)
for k in range(10):
    x = -0.8 + k * 0.18
    if abs(x) < 0.1:
        continue
    for s in (-1, 1):
        h = rng.choice((0.06, 0.1, 0.16))
        rod(f'colonnade{k}{s}', M['stone'], (x, -0.05 + s * 0.075, G - 0.005), (x, -0.05 + s * 0.075, G + h), 0.013, segs=8, outline=0.002)
for k in range(12):
    bx = rng.choice((-0.68, -0.25, 0.25, 0.68))
    by = rng.choice((-0.55, -0.35, 0.25, 0.45))
    if math.hypot(bx, by) > 1.0:
        continue
    box(f'block{k}', M['stoneDark'], bx + rng.uniform(-0.04, 0.04), by + rng.uniform(-0.04, 0.04), G - 0.005, rng.uniform(0.15, 0.25), 0.025, rng.uniform(0.03, 0.06), rot_z=rng.choice((0.0, math.pi / 2)), outline=0.002, bevel=0)

# ---------- Trajan's Arch ----------
AX, AY = 0.0, 0.25
box('arch', M['stone'], AX, AY, G - 0.005, 0.46, 0.1, 0.3, outline=0.008, bevel=0)
box('mainarch', M['dark'], AX, AY - 0.053, G - 0.005, 0.12, 0.006, 0.15, outline=0, bevel=0)
cyl('mainarchtop', M['dark'], 0.06, 0.006, segs=18, outline=0, matrix=Matrix.Translation((AX, AY - 0.053, G + 0.145)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    sx = AX + s * 0.16
    box(f'sidearch{s}', M['dark'], sx, AY - 0.053, G - 0.005, 0.06, 0.006, 0.09, outline=0, bevel=0)
    cyl(f'sidearchtop{s}', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((sx, AY - 0.053, G + 0.085)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'niche{s}', M['stoneDark'], sx, AY - 0.053, G + 0.17, 0.04, 0.006, 0.06, outline=0, bevel=0)
    cyl(f'nichepediment{s}', M['stoneDark'], 0.035, 0.012, segs=14, outline=0.001, matrix=Matrix.Translation((sx, AY - 0.055, G + 0.235)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for x in (-0.21, -0.1, 0.1, 0.21):
    box(f'pedestal{x}', M['stoneDark'], AX + x, AY - 0.07, G - 0.005, 0.04, 0.04, 0.06, outline=0.002, bevel=0)
    rod(f'archcol{x}', M['stone'], (AX + x, AY - 0.07, G + 0.055), (AX + x, AY - 0.07, G + 0.26), 0.013, segs=10, outline=0.002)
    lathe(f'archcap{x}', M['stone'], ((0.013, 0), (0.02, 0.02)), G + 0.26, AX + x, AY - 0.07, segs=8, outline=0.001)
box('entablature', M['stoneDark'], AX, AY - 0.01, G + 0.28, 0.48, 0.14, 0.03, outline=0.003, bevel=0)

turn(before, -20)
render(G)
