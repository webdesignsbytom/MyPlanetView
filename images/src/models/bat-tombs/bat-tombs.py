# A cartoon Bat, Al-Khutm and Al-Ayn for the country maps, built in the set's shared look
# (../toon.py): the Bronze Age necropolis in the interior of Oman: the row of beehive tombs of
# dry-stacked stone along the ridge at Al-Ayn, round towers narrowing to a rounded top with a
# small doorway each, the craggy limestone peak of Jebel Misht behind them, and the
# date-palm oasis below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bat-tombs.py -- bat-tombs-1024.png 1024 bat-tombs.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d2b88c', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'ridge': toon('ridge', '#c4a87c', shadow_mul=(0.8, 0.76, 0.8)),
    'mountain': toon('mountain', '#b8a088', shadow_mul=(0.78, 0.76, 0.82)),
    'stone': toon('stone', '#c8b08a', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'stoneDark': toon('stoneDark', '#a08866'),
    'dark': flat('dark', '#2e2420'),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
def palm(name, x, y, h=0.3):
    rod(name + "trunk", M["trunk"], (x, y, G), (x + 0.03, y, G + h), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f"{name}frond{j}", M["palm"], (x + 0.03, y, G + h), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + h - 0.05), 0.03, outline=0.002)


# ---------- Jebel Misht behind ----------
mt = loft('misht', M['mountain'], [[(-0.9, 0.55, G - 0.01), (0.7, 0.45, G - 0.01), (0.85, 0.95, G - 0.01), (-0.6, 1.1, G - 0.01)],
                                   [(-0.55, 0.75, G + 0.4), (0.4, 0.7, G + 0.55), (0.5, 0.9, G + 0.5), (-0.4, 0.95, G + 0.42)],
                                   [(-0.2, 0.82, G + 0.62), (0.15, 0.8, G + 0.68), (0.2, 0.86, G + 0.66), (-0.15, 0.88, G + 0.6)]], outline=0.007)
mt.visible_shadow = False

# ---------- the ridge and the beehive tombs ----------
RZ = G + 0.08
rd = loft('ridge', M['ridge'], [[(-1.05, -0.2, G - 0.01), (1.05, -0.35, G - 0.01), (1.0, 0.2, G - 0.01), (-1.0, 0.3, G - 0.01)],
                                [(-0.95, -0.12, RZ), (0.95, -0.26, RZ), (0.9, 0.12, RZ), (-0.9, 0.22, RZ)]], outline=0.005)
rd.visible_shadow = False
for k in range(6):
    x = -0.75 + k * 0.3
    y = 0.05 - 0.07 * (x + 0.75) / 1.5
    h = 0.26 if k % 2 == 0 else 0.2
    r = 0.1 if k % 2 == 0 else 0.085
    lathe(f'tomb{k}', M['stone'], ((r, 0), (r * 0.92, h * 0.6), (r * 0.65, h * 0.9), (r * 0.3, h), (0.0, h * 1.03)), RZ - 0.01, x, y, segs=20, outline=0.006)
    for c in range(3):
        lathe(f'tombcourse{k}{c}', M['stoneDark'], ((r * (0.97 - 0.07 * c) + 0.003, 0), (r * (0.97 - 0.07 * c) + 0.003, 0.008)), RZ - 0.01 + h * (0.2 + 0.2 * c), x, y, segs=20, outline=0)
    box(f'tombdoor{k}', M['dark'], x, y - r - 0.003, RZ - 0.01, 0.03, 0.01, 0.035, outline=0, bevel=0)

# ---------- the oasis below ----------
for k, (x, y) in enumerate(((-0.7, -0.6), (-0.4, -0.75), (-0.1, -0.65), (0.2, -0.8), (0.5, -0.65), (0.8, -0.5))):
    palm(f'palm{k}', x, y, h=0.26)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
