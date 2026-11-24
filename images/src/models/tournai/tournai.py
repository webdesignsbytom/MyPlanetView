# A cartoon Tournai Cathedral for the country maps, built in the set's shared look (../toon.py): the
# Cathedral of Our Lady, its long Romanesque nave of grey-blue Tournai stone, the huge transept with
# its rounded ends, and the cluster of five tall towers over the crossing, the central lantern tower
# and four square towers round it with their steep slate spires; the town's roofs and the belfry
# beside it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tournai.py -- tournai-1024.png 1024 tournai.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c4bc', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#a8aab0', shadow_mul=(0.84, 0.86, 0.92), lift=0.12),
    'stoneDark': toon('stoneDark', '#888a92'),
    'slate': toon('slate', '#4a5060', shadow_mul=(0.84, 0.86, 0.92)),
    'dark': flat('dark', '#2a2a32'),
    'house': toon('house', '#e0d4bc', lift=0.12),
    'roof': toon('roof', '#b8603e'),
    'gold': toon('gold', '#e0b040'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the nave and the choir, running left to right ----------
CY = 0.15
box('nave', M['stone'], -0.35, CY, G - 0.005, 0.55, 0.26, 0.26, outline=0.008, bevel=0)
loft('naveroof', M['slate'], [[(-0.62, CY - 0.13, G + 0.255), (-0.08, CY - 0.13, G + 0.255), (-0.08, CY + 0.13, G + 0.255), (-0.62, CY + 0.13, G + 0.255)],
                              [(-0.62, CY - 0.004, G + 0.36), (-0.08, CY - 0.004, G + 0.36), (-0.08, CY + 0.004, G + 0.36), (-0.62, CY + 0.004, G + 0.36)]], outline=0.005)
for j in range(5):
    box(f'navewin{j}', M['dark'], -0.56 + j * 0.1, CY - 0.133, G + 0.12, 0.035, 0.006, 0.08, outline=0, bevel=0)
box('choir', M['stone'], 0.45, CY, G - 0.005, 0.5, 0.28, 0.34, outline=0.008, bevel=0)
loft('choirroof', M['slate'], [[(0.2, CY - 0.14, G + 0.335), (0.7, CY - 0.14, G + 0.335), (0.7, CY + 0.14, G + 0.335), (0.2, CY + 0.14, G + 0.335)],
                               [(0.2, CY - 0.004, G + 0.45), (0.7, CY - 0.004, G + 0.45), (0.7, CY + 0.004, G + 0.45), (0.2, CY + 0.004, G + 0.45)]], outline=0.005)
for j in range(4):
    box(f'choirwin{j}', M['dark'], 0.27 + j * 0.12, CY - 0.143, G + 0.1, 0.04, 0.006, 0.18, outline=0, bevel=0)
lathe('apse', M['stone'], ((0.14, 0), (0.14, 0.32)), G - 0.005, 0.7, CY, segs=10, outline=0.006, smooth=False)
# the transept, its two ends rounded
box('transept', M['stone'], 0.03, CY, G - 0.005, 0.22, 0.7, 0.28, outline=0.008, bevel=0)
for s in (-1, 1):
    lathe(f'transeptapse{s}', M['stone'], ((0.11, 0), (0.11, 0.28)), G - 0.005, 0.03, CY + s * 0.35, segs=14, outline=0.006)
    lathe(f'transeptapseroof{s}', M['slate'], ((0.115, 0), (0.003, 0.08)), G + 0.275, 0.03, CY + s * 0.35, segs=14, outline=0.003)

# ---------- the five towers over the crossing ----------
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = 0.03 + sx * 0.13, CY + sy * 0.2
        box(f'tower{sx}{sy}', M['stone'], x, y, G - 0.005, 0.1, 0.1, 0.62, outline=0.006, bevel=0)
        for k in range(3):
            box(f'towerwin{sx}{sy}{k}', M['dark'], x, y - 0.052, G + 0.32 + k * 0.1, 0.025, 0.006, 0.06, outline=0, bevel=0)
        lathe(f'towerspire{sx}{sy}', M['slate'], ((0.072, 0), (0.003, 0.32)), G + 0.615, x, y, segs=4, outline=0.004, smooth=False)
        rod(f'towercross{sx}{sy}', M['gold'], (x, y, G + 0.935), (x, y, G + 0.97), 0.003, segs=4, outline=0)
box('lantern', M['stone'], 0.03, CY, G + 0.26, 0.14, 0.14, 0.3, outline=0.006, bevel=0)
lathe('lanternspire', M['slate'], ((0.1, 0), (0.003, 0.24)), G + 0.555, 0.03, CY, segs=4, outline=0.004, smooth=False)

# ---------- the town and the belfry ----------
BX, BY = -0.55, -0.45
box('belfry', M['stoneDark'], BX, BY, G - 0.005, 0.12, 0.12, 0.46, outline=0.006, bevel=0)
lathe('belfrycap', M['slate'], ((0.07, 0), (0.06, 0.05), (0.03, 0.1), (0.003, 0.16)), G + 0.455, BX, BY, segs=8, outline=0.003, smooth=False)
for k, (x, y) in enumerate(((-0.25, -0.6), (0.1, -0.55), (0.45, -0.5), (0.8, -0.2), (-0.85, -0.1))):
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.22, 0.16, 0.14, outline=0.005, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.11, y - 0.08, G + 0.135), (x + 0.11, y - 0.08, G + 0.135), (x + 0.11, y + 0.08, G + 0.135), (x - 0.11, y + 0.08, G + 0.135)],
                                      [(x - 0.11, y - 0.004, G + 0.2), (x + 0.11, y - 0.004, G + 0.2), (x + 0.11, y + 0.004, G + 0.2), (x - 0.11, y + 0.004, G + 0.2)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
