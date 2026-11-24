# A cartoon Vézelay for the country maps, built in the set's shared look (../toon.py): the Basilica
# of Sainte-Marie-Madeleine crowning its hill in Burgundy, its Romanesque west front with the single
# tower, the long nave and the Gothic choir behind, the village's stone houses and red roofs climbing
# the one street up the ridge to it, the ramparts round the top, and the vineyards on the slopes.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P vezelay.py -- vezelay-1024.png 1024 vezelay.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#8ab85a', shadow_mul=(0.72, 0.8, 0.74)),
    'stone': toon('stone', '#e0d0b0', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#c0ae8a'),
    'roof': toon('roof', '#c4603e'),
    'slate': toon('slate', '#6a6e78'),
    'dark': flat('dark', '#2e2a26'),
    'vine': toon('vine', '#5a8a3a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['hill'])
before = set(bpy.data.objects)
rng = random.Random(1120)

# ---------- the hill: a long ridge rising from the front to the basilica at the back ----------
RIDGE = lambda y: G + 0.36 * min(1.0, max(0.0, (y + 0.95) / 1.2))
for j in range(9):
    y0, y1 = -1.0 + j * 0.26, min(-1.0 + (j + 1) * 0.26, 1.3)
    if y0 >= 1.3:
        break
    x0, x1 = math.sqrt(max(0.0, 1.36 ** 2 - y0 * y0)), math.sqrt(max(0.0, 1.36 ** 2 - y1 * y1))
    # the ridge is highest along the middle and falls away to either side
    for s in (-1, 1):
        quad = [(0, y0), (s * x0, y0), (s * x1, y1), (0, y1)]
        top = [(0, y0, RIDGE(y0)), (s * x0, y0, G + 0.02), (s * x1, y1, G + 0.02), (0, y1, RIDGE(y1))]
        sl = loft(f'hill{j}{s}', M['hill'], [[(x, y, G - 0.01) for x, y in quad], top], outline=0.004)
        sl.visible_shadow = False


def ground(x, y):
    xa = max(0.2, math.sqrt(max(0.0, 1.36 ** 2 - y * y)))
    return G + 0.02 + (RIDGE(y) - G - 0.02) * max(0.0, 1 - abs(x) / xa)


# ---------- the basilica at the top ----------
BY = 0.55
BZ = ground(0, BY) - 0.02
box('nave', M['stone'], 0, BY + 0.12, BZ, 0.22, 0.5, 0.24, outline=0.008, bevel=0)
loft('naveroof', M['roof'], [[(-0.12, BY - 0.13, BZ + 0.235), (0.12, BY - 0.13, BZ + 0.235), (0.12, BY + 0.37, BZ + 0.235), (-0.12, BY + 0.37, BZ + 0.235)],
                             [(-0.004, BY - 0.13, BZ + 0.32), (0.004, BY - 0.13, BZ + 0.32), (0.004, BY + 0.37, BZ + 0.32), (-0.004, BY + 0.37, BZ + 0.32)]], outline=0.005)
for s in (-1, 1):
    box(f'aisle{s}', M['stone'], s * 0.15, BY + 0.12, BZ, 0.08, 0.46, 0.15, outline=0.005, bevel=0)
box('westfront', M['stone'], 0, BY - 0.15, BZ, 0.32, 0.06, 0.3, outline=0.006, bevel=0)
box('westdoor', M['dark'], 0, BY - 0.183, BZ, 0.06, 0.006, 0.12, outline=0, bevel=0)
cyl('westdoortop', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0, BY - 0.183, BZ + 0.12)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('westwindow', M['dark'], 0, BY - 0.183, BZ + 0.18, 0.06, 0.006, 0.07, outline=0, bevel=0)
box('tower', M['stone'], 0.1, BY - 0.13, BZ, 0.1, 0.1, 0.46, outline=0.006, bevel=0)
box('towerwin', M['dark'], 0.1, BY - 0.183, BZ + 0.35, 0.03, 0.006, 0.07, outline=0, bevel=0)
lathe('towerroof', M['slate'], ((0.065, 0), (0.003, 0.1)), BZ + 0.455, 0.1, BY - 0.13, segs=4, outline=0.003, smooth=False)
box('choir', M['stone'], 0, BY + 0.45, BZ, 0.28, 0.2, 0.28, outline=0.006, bevel=0)
loft('choirroof', M['slate'], [[(-0.15, BY + 0.35, BZ + 0.275), (0.15, BY + 0.35, BZ + 0.275), (0.15, BY + 0.55, BZ + 0.275), (-0.15, BY + 0.55, BZ + 0.275)],
                               [(-0.004, BY + 0.35, BZ + 0.36), (0.004, BY + 0.35, BZ + 0.36), (0.004, BY + 0.55, BZ + 0.36), (-0.004, BY + 0.55, BZ + 0.36)]], outline=0.004)

# ---------- the village up the street ----------
k = 0
for y in (-0.6, -0.42, -0.24, -0.06, 0.12, 0.3):
    for s in (-1, 1):
        x = s * 0.12
        z = ground(x, y) - 0.02
        h = rng.uniform(0.08, 0.12)
        box(f'house{k}', M['stone'], x, y, z, 0.12, 0.15, h, outline=0.004, bevel=0)
        box(f'housewin{k}', M['dark'], x - s * 0.063, y, z + h * 0.5, 0.006, 0.03, 0.03, outline=0, bevel=0)
        loft(f'houseroof{k}', M['roof'], [[(x - 0.065, y - 0.08, z + h - 0.005), (x + 0.065, y - 0.08, z + h - 0.005), (x + 0.065, y + 0.08, z + h - 0.005), (x - 0.065, y + 0.08, z + h - 0.005)],
                                          [(x - 0.004, y - 0.08, z + h + 0.05), (x + 0.004, y - 0.08, z + h + 0.05), (x + 0.004, y + 0.08, z + h + 0.05), (x - 0.004, y + 0.08, z + h + 0.05)]], outline=0.003)
        k += 1

# ---------- vineyards and trees on the slopes ----------
for s in (-1, 1):
    for j in range(5):
        y = -0.7 + j * 0.25
        x0, x1 = s * 0.4, s * 0.85
        if math.hypot(x1, y) > 1.25:
            x1 = s * math.sqrt(max(0.0, 1.25 ** 2 - y * y))
        bar(f'vinerow{s}{j}', M['vine'], (x0, y, ground(x0, y) + 0.012), (x1, y, ground(x1, y) + 0.012), 0.022, outline=0)
for k, (x, y) in enumerate(((-0.35, 0.85), (0.4, 0.8), (-0.6, 0.45), (0.65, 0.4))):
    ball(f'tree{k}', M['tree'], x, y, ground(x, y) + 0.08, 0.09, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
