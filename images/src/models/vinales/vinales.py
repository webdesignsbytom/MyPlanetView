# A cartoon Viñales Valley for the country maps, built in the set's shared look (../toon.py): the
# mogotes, round-topped limestone hills cloaked in green, over the valley's red earth, rows of
# tobacco, a thatched drying barn with leaves hanging, royal palms, and a farmer in a straw hat
# with his ox. Turned a little towards the camera.
# Run: blender -b --factory-startup -P vinales.py -- vinales-1024.png 1024 vinales.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'earth': toon('earth', '#b8603e', shadow_mul=(0.86, 0.76, 0.72), lift=0.2),
    'mogote': toon('mogote', '#3f8a46', shadow_mul=(0.7, 0.78, 0.8)),
    'mogoteLight': toon('mogoteLight', '#5aa04a', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#9a968e', shadow_mul=(0.84, 0.84, 0.9)),
    'tobacco': toon('tobacco', '#6ab84a', shadow_mul=(0.72, 0.8, 0.72)),
    'thatch': toon('thatch', '#b89a5a', shadow_mul=(0.84, 0.76, 0.62)),
    'wood': toon('wood', '#8a6448'),
    'leaf': toon('leaf', '#a8783a'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#c8c0b0'),
    'hat': toon('hat', '#e0c88a', lift=0.2),
    'shirt': toon('shirt', '#f8f6f0', lift=0.2),
    'ox': toon('ox', '#8a6a4e'),
})

G = tile(M['earth'])
before = set(bpy.data.objects)
rng = random.Random(1439)

# ---------- the mogotes behind ----------
for k, (x, y, r, h) in enumerate(((-0.75, 0.6, 0.3, 0.45), (-0.25, 0.85, 0.32, 0.55), (0.3, 0.8, 0.3, 0.48), (0.8, 0.5, 0.28, 0.42), (-1.0, 0.15, 0.2, 0.3))):
    prof = ((r, 0), (r * 1.02, h * 0.45), (r * 0.9, h * 0.75), (r * 0.6, h * 0.95), (0.004, h))
    lathe(f'mogote{k}', M['mogote' if k % 2 else 'mogoteLight'], prof, G - 0.01, x, y, segs=16, outline=0.016)
    bar(f'mogoterock{k}', M['rock'], (x - r * 0.2, y - r * 0.98, G + h * 0.1), (x - r * 0.15, y - r * 0.95, G + h * 0.5), 0.05, outline=0.003)

# ---------- rows of tobacco ----------
for r in range(5):
    y = -0.25 - r * 0.13
    for j in range(9):
        x = -0.15 + j * 0.13
        if math.hypot(x, y) > 1.22:
            continue
        for f in range(4):
            b = 2 * math.pi * f / 4 + j
            bar(f'tobacco{r}{j}{f}', M['tobacco'], (x, y, G), (x + 0.035 * math.cos(b), y + 0.035 * math.sin(b), G + 0.06), 0.03, outline=0.003)

# ---------- the thatched drying barn ----------
BX, BY = -0.6, -0.25
box('barnwall', M['wood'], BX, BY, G - 0.005, 0.36, 0.22, 0.08, outline=0.008, bevel=0)
loft('barnroof', M['thatch'], [[(BX - 0.21, BY - 0.15, G + 0.06), (BX + 0.21, BY - 0.15, G + 0.06), (BX + 0.21, BY + 0.15, G + 0.06), (BX - 0.21, BY + 0.15, G + 0.06)],
                               [(BX - 0.15, BY - 0.006, G + 0.32), (BX + 0.15, BY - 0.006, G + 0.32), (BX + 0.15, BY + 0.006, G + 0.32), (BX - 0.15, BY + 0.006, G + 0.32)]],
     outline=0.012)
box('barndoor', M['window'] if 'window' in M else M['wood'], BX, BY - 0.113, G, 0.07, 0.006, 0.07, outline=0, bevel=0)
for j in range(4):
    bar(f'leaves{j}', M['leaf'], (BX - 0.14 + j * 0.09, BY - 0.14, G + 0.055), (BX - 0.14 + j * 0.09, BY - 0.14, G + 0.005), 0.022, outline=0.002)

# ---------- royal palms, the farmer and his ox ----------
for k, (x, y) in enumerate(((-0.95, -0.55), (0.15, 0.4), (1.05, 0.05), (-0.35, 0.35))):
    h = 0.4
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.014, r2=0.011, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x, y, G + h), (x + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.06), 0.02, outline=0.005)
FX, FY = 0.55, -0.15
rod('farmer', M['shirt'], (FX, FY, G), (FX, FY, G + 0.1), 0.017, segs=8, outline=0.003)
lathe('farmerhat', M['hat'], ((0.04, 0), (0.025, 0.01), (0.02, 0.03), (0.004, 0.035)), G + 0.11, FX, FY, segs=12, outline=0.003)
OX, OY = 0.75, -0.1
for fx in (-0.045, 0.045):
    for side in (-1, 1):
        rod(f'oxleg{fx}{side}', M['ox'], (OX + fx, OY + side * 0.025, G), (OX + fx, OY + side * 0.025, G + 0.07), 0.011, segs=6, outline=0.003)
b = ball('oxbody', M['ox'], 0, 0, 0, 0.05, outline=0.006)
b.scale = (1.4, 0.85, 0.8)
b.location = (OX, OY, G + 0.09)
ball('oxhead', M['ox'], OX + 0.075, OY, G + 0.095, 0.025, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
