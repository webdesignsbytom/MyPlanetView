# A cartoon Canterbury Cathedral for the country maps, built in the set's shared look
# (../toon.py): the mother church of the Church of England on its green precincts, the tall Bell
# Harry Tower over the crossing with its four pinnacled corner turrets, the long Perpendicular nave
# with its buttresses and big windows, the two west towers, the choir and the round Corona at the
# east end, under low lead roofs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P canterbury-cathedral.py -- canterbury-cathedral-1024.png 1024 canterbury-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d0c8b8'),
    'stone': toon('stone', '#d8cfb4', shadow_mul=(0.84, 0.84, 0.88), lift=0.1),
    'stoneDark': toon('stoneDark', '#b4a888'),
    'lead': toon('lead', '#7a8088', shadow_mul=(0.84, 0.86, 0.92)),
    'window': flat('window', '#3a3a48'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
box('path', M['path'], -0.55, -0.35, G - 0.003, 0.1, 0.6, 0.008, outline=0, bevel=0)

Y, W = 0.12, 0.2


def hall(name, x0, x1, h, w=W, wins=True):
    box(name, M['stone'], (x0 + x1) / 2, Y, G - 0.005, x1 - x0, w, h, outline=0.008, bevel=0)
    loft(f'{name}roof', M['lead'], [[(x0, Y - w / 2, G + h - 0.005), (x1, Y - w / 2, G + h - 0.005), (x1, Y + w / 2, G + h - 0.005), (x0, Y + w / 2, G + h - 0.005)],
                                    [(x0, Y - 0.004, G + h + 0.06), (x1, Y - 0.004, G + h + 0.06), (x1, Y + 0.004, G + h + 0.06), (x0, Y + 0.004, G + h + 0.06)]], outline=0.005)
    if wins:
        n = max(1, int((x1 - x0) / 0.09))
        for j in range(n):
            x = x0 + (j + 0.5) * (x1 - x0) / n
            box(f'{name}win{j}', M['window'], x, Y - w / 2 - 0.003, G + 0.05, 0.035, 0.006, h - 0.09, outline=0, bevel=0)
            box(f'{name}buttress{j}', M['stoneDark'], x + (x1 - x0) / n / 2, Y - w / 2 - 0.014, G - 0.005, 0.022, 0.028, h - 0.02, outline=0.001, bevel=0)
            lathe(f'{name}pin{j}', M['stoneDark'], ((0.012, 0), (0.003, 0.05)), G + h - 0.025, x + (x1 - x0) / n / 2, Y - w / 2 - 0.014, segs=4, outline=0, smooth=False)


hall('aisles', -0.55, -0.08, 0.13, W + 0.12, wins=False)
hall('nave', -0.55, -0.08, 0.27)
hall('transept', -0.12, 0.0, 0.25, 0.46, wins=False)
hall('choir', 0.0, 0.5, 0.24)
lathe('corona', M['stone'], ((0.1, 0), (0.1, 0.22)), G - 0.005, 0.56, Y, segs=10, outline=0.007, smooth=False)
lathe('coronaroof', M['lead'], ((0.105, 0), (0.004, 0.08)), G + 0.215, 0.56, Y, segs=10, outline=0.004, smooth=False)

# ---------- Bell Harry Tower ----------
BX = -0.06
box('bellharry', M['stone'], BX, Y, G + 0.2, 0.17, 0.17, 0.4, outline=0.008, bevel=0)
for j in range(2):
    box(f'bellharrywin{j}', M['window'], BX - 0.035 + j * 0.07, Y - 0.088, G + 0.34, 0.035, 0.006, 0.2, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = BX + sx * 0.085, Y + sy * 0.085
        lathe(f'turret{sx}{sy}', M['stone'], ((0.024, 0), (0.024, 0.45)), G + 0.2, x, y, segs=8, outline=0.003, smooth=False)
        lathe(f'turretspire{sx}{sy}', M['stoneDark'], ((0.026, 0), (0.004, 0.1)), G + 0.645, x, y, segs=8, outline=0.002, smooth=False)
for j in range(6):
    box(f'parapet{j}', M['stoneDark'], BX - 0.06 + j * 0.024, Y - 0.08, G + 0.6, 0.012, 0.012, 0.03, outline=0, bevel=0)

# ---------- the west towers ----------
for s in (-1, 1):
    tx, ty = -0.6, Y + s * 0.075
    box(f'westtower{s}', M['stone'], tx, ty, G - 0.005, 0.12, 0.12, 0.42, outline=0.007, bevel=0)
    box(f'westwin{s}', M['window'], tx + 0.0, ty - 0.063, G + 0.3, 0.035, 0.006, 0.08, outline=0, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            lathe(f'westpin{s}{sx}{sy}', M['stoneDark'], ((0.014, 0), (0.004, 0.08)), G + 0.415, tx + sx * 0.05, ty + sy * 0.05, segs=4, outline=0.001, smooth=False)
box('westdoor', M['window'], -0.663, Y, G - 0.005, 0.006, 0.05, 0.1, outline=0, bevel=0)

for k, (x, y, r) in enumerate(((-0.85, -0.3, 0.12), (0.8, -0.35, 0.12), (-0.3, -0.7, 0.11), (0.4, -0.65, 0.1), (0.85, 0.45, 0.11), (-0.8, 0.5, 0.11))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
