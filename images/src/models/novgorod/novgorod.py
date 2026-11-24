# A cartoon Novgorod for the country maps, built in the set's shared look (../toon.py): the red brick
# walls and towers of Veliky Novgorod's kremlin on the bank of the Volkhov, and inside it St Sophia
# Cathedral, its white walls and its five domes, the great central one golden and the others leaden
# grey, with the belfry wall beside it and the Millennium of Russia monument's great bell shape.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P novgorod.py -- novgorod-1024.png 1024 novgorod.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'brick': toon('brick', '#b8503a', shadow_mul=(0.86, 0.76, 0.76), lift=0.06),
    'roof': toon('roof', '#5a6a58'),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'gold': toon('gold', '#f0c040', shadow_mul=(0.86, 0.76, 0.6), lift=0.3),
    'lead': toon('lead', '#8a929e', shadow_mul=(0.82, 0.86, 0.94), lift=0.12),
    'dark': flat('dark', '#2e2a2a'),
    'bronze': toon('bronze', '#4a6a5a', lift=0.1),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('volkhov', M['river'], [strip(-1.41, -0.85, 1.42, -0.004), strip(-1.41, -0.85, 1.42, 0.004)], outline=0)

# ---------- the kremlin walls, an oval of red brick with towers ----------
N = 18
wall = [(0.88 * math.cos(2 * math.pi * k / N), 0.12 + 0.7 * math.sin(2 * math.pi * k / N)) for k in range(N)]
for k in range(N):
    (x0, y0), (x1, y1) = wall[k], wall[(k + 1) % N]
    bar(f'wall{k}', M['brick'], (x0, y0, G + 0.08), (x1, y1, G + 0.08), 0.16, outline=0.005)
    bar(f'wallroof{k}', M['roof'], (x0, y0, G + 0.17), (x1, y1, G + 0.17), 0.05, outline=0.002)
for k in range(0, N, 3):
    x, y = wall[k]
    box(f'tower{k}', M['brick'], x, y, G - 0.005, 0.12, 0.12, 0.26, outline=0.005, bevel=0)
    lathe(f'towerroof{k}', M['roof'], ((0.09, 0), (0.003, 0.14)), G + 0.255, x, y, segs=4, outline=0.003, smooth=False)

# ---------- St Sophia ----------
CX, CY = -0.1, 0.25
box('cathedral', M['white'], CX, CY, G - 0.005, 0.42, 0.38, 0.26, outline=0.008, bevel=0)
for j in range(4):
    box(f'cathwin{j}', M['dark'], CX - 0.15 + j * 0.1, CY - 0.193, G + 0.13, 0.025, 0.006, 0.07, outline=0, bevel=0)
box('cathroof', M['lead'], CX, CY, G + 0.255, 0.4, 0.36, 0.02, outline=0.003, bevel=0)
for k, (dx, dy, r, h, mat) in enumerate(((0, 0, 0.075, 0.16, 'gold'), (-0.12, -0.11, 0.05, 0.1, 'lead'), (0.12, -0.11, 0.05, 0.1, 'lead'), (-0.12, 0.11, 0.05, 0.1, 'lead'), (0.12, 0.11, 0.05, 0.1, 'lead'))):
    x, y = CX + dx, CY + dy
    lathe(f'drum{k}', M['white'], ((r * 0.85, 0), (r * 0.85, h)), G + 0.27, x, y, segs=16, outline=0.003)
    lathe(f'dome{k}', M[mat], ((r * 0.85, 0), (r, r * 0.6), (r * 0.8, r * 1.1), (r * 0.3, r * 1.5), (0.004, r * 1.8)), G + 0.27 + h, x, y, segs=16, outline=0.004)
    rod(f'cross{k}', M['gold'], (x, y, G + 0.27 + h + r * 1.8), (x, y, G + 0.27 + h + r * 1.8 + 0.05), 0.003, segs=4, outline=0)
# the belfry wall beside the cathedral
BX, BY = 0.35, 0.45
box('belfry', M['white'], BX, BY, G - 0.005, 0.3, 0.08, 0.28, outline=0.006, bevel=0)
for j in range(4):
    box(f'belfryarch{j}', M['dark'], BX - 0.105 + j * 0.07, BY - 0.043, G + 0.16, 0.04, 0.006, 0.07, outline=0, bevel=0)
for j in range(2):
    lathe(f'belfrydome{j}', M['lead'], ((0.035, 0), (0.03, 0.03), (0.003, 0.07)), G + 0.275, BX - 0.07 + j * 0.14, BY, segs=10, outline=0.002)

# ---------- the Millennium of Russia monument ----------
MX, MY = 0.3, -0.15
lathe('monumentbase', M['white'], ((0.09, 0), (0.09, 0.05)), G - 0.005, MX, MY, segs=16, outline=0.003)
lathe('bell', M['bronze'], ((0.08, 0), (0.07, 0.04), (0.05, 0.12), (0.045, 0.16), (0.02, 0.18)), G + 0.045, MX, MY, segs=16, outline=0.004)
lathe('orb', M['bronze'], ((0.02, 0), (0.025, 0.02), (0.003, 0.05)), G + 0.225, MX, MY, segs=10, outline=0.002)
for k, (x, y) in enumerate(((-0.5, -0.3), (-0.35, 0.6), (0.5, 0.05))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
