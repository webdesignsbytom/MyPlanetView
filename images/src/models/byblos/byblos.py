# A cartoon Byblos for the country maps, built in the set's shared look (../toon.py): the Crusader
# castle on its rise, a square keep of honey-coloured stone inside its curtain wall and corner
# towers, the columns of the ancient city beside it, and below, the little old harbour held between
# two stone arms with its fishing boats and the houses along the quay. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P byblos.py -- byblos-1024.png 1024 byblos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#bcb478', shadow_mul=(0.8, 0.8, 0.82), lift=0.2),
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'stone': toon('stone', '#d4b484', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'stoneDark': toon('stoneDark', '#b4945e'),
    'house': toon('house', '#ece0c8', lift=0.1),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a3430'),
    'boatRed': toon('boatRed', '#c84a3a'),
    'boatBlue': toon('boatBlue', '#3a6ab0'),
    'boatWhite': toon('boatWhite', '#f4f0e6', lift=0.15),
    'olive': toon('olive', '#7a9a50', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('sea', M['sea'], [strip(-1.25, -0.45, 1.33, -0.004), strip(-1.25, -0.45, 1.33, 0.006)], outline=0.004)

# ---------- the harbour ----------
for k, (p0, p1) in enumerate((((-0.15, -0.45), (-0.02, -0.85)), ((0.62, -0.45), (0.38, -0.86)))):
    bar(f'harbourarm{k}', M['stone'], (p0[0], p0[1], G + 0.02), (p1[0], p1[1], G + 0.02), 0.07, outline=0.004)
for k, (x, y, mat) in enumerate(((0.12, -0.6, 'boatRed'), (0.32, -0.65, 'boatBlue'), (0.2, -0.78, 'boatWhite'))):
    loft(f'hull{k}', M[mat], [[(x - 0.05, y - 0.022, G), (x + 0.05, y - 0.022, G), (x + 0.05, y + 0.022, G), (x - 0.05, y + 0.022, G)],
                              [(x - 0.075, y - 0.032, G + 0.035), (x + 0.075, y - 0.032, G + 0.035), (x + 0.075, y + 0.032, G + 0.035), (x - 0.075, y + 0.032, G + 0.035)]], outline=0.003)
    box(f'cabin{k}', M['boatWhite'] if mat != 'boatWhite' else M['boatBlue'], x - 0.015, y, G + 0.03, 0.04, 0.035, 0.035, outline=0.002, bevel=0)
for k, x in enumerate((0.05, 0.22, 0.4, 0.58, 0.76)):
    h = 0.09 + 0.03 * (k % 2)
    box(f'quayhouse{k}', M['house'], x, -0.33, G - 0.005, 0.15, 0.13, h, outline=0.004, bevel=0)
    box(f'quayarch{k}', M['window'], x, -0.397, G - 0.005, 0.045, 0.006, 0.06, outline=0, bevel=0)
    pyramid(f'quayroof{k}', M['roof'], x, -0.33, G + h - 0.01, 0.16, 0.05, outline=0.003)

# ---------- the Crusader castle ----------
CX, CY = -0.25, 0.32
mnd = lathe('rise', M['ground'], ((0.58, 0), (0.5, 0.05), (0.42, 0.075)), G - 0.01, CX, CY, segs=24, outline=0.008)
mnd.visible_shadow = False
T = G + 0.065
W = 0.32
for name, (x, y, sx, sy) in {'front': (CX, CY - W, 2 * W, 0.05), 'back': (CX, CY + W, 2 * W, 0.05), 'left': (CX - W, CY, 0.05, 2 * W), 'right': (CX + W, CY, 0.05, 2 * W)}.items():
    box(f'curtain{name}', M['stone'], x, y, T - 0.005, sx, sy, 0.14, outline=0.007, bevel=0)
box('gate', M['window'], CX + 0.12, CY - W - 0.027, T - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)
for j in range(12):
    x = CX - W + 0.03 + j * (2 * W - 0.06) / 11
    box(f'curtainmerlon{j}', M['stoneDark'], x, CY - W - 0.01, T + 0.13, 0.025, 0.025, 0.03, outline=0.001, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        tx, ty = CX + sx * W, CY + sy * W
        box(f'corner{sx}{sy}', M['stone'], tx, ty, T - 0.005, 0.13, 0.13, 0.22, outline=0.006, bevel=0)
        for j in range(4):
            a = math.pi / 4 + math.pi / 2 * j
            box(f'cornermerlon{sx}{sy}{j}', M['stoneDark'], tx + 0.045 * math.cos(a), ty + 0.045 * math.sin(a), T + 0.21, 0.03, 0.03, 0.035, outline=0.001, bevel=0)
box('keep', M['stone'], CX, CY + 0.02, T - 0.005, 0.3, 0.3, 0.44, outline=0.009, bevel=0)
for r in range(3):
    box(f'keepslit{r}', M['window'], CX, CY - 0.133, T + 0.12 + r * 0.1, 0.02, 0.006, 0.05, outline=0, bevel=0)
for j in range(5):
    for side in (-1, 1):
        box(f'keepmerlon{j}{side}', M['stoneDark'], CX - 0.12 + j * 0.06, CY + 0.02 + side * 0.135, T + 0.43, 0.03, 0.03, 0.04, outline=0.001, bevel=0)
        box(f'keepmerlonx{j}{side}', M['stoneDark'], CX + side * 0.135, CY - 0.1 + j * 0.06, T + 0.43, 0.03, 0.03, 0.04, outline=0.001, bevel=0)

# ---------- the columns of the ancient city ----------
for k, (x, y, h) in enumerate(((0.45, 0.25, 0.24), (0.58, 0.28, 0.2), (0.71, 0.25, 0.24), (0.84, 0.22, 0.14))):
    rod(f'column{k}', M['stone'], (x, y, G - 0.005), (x, y, G + h), 0.024, segs=10, outline=0.004)
box('podium', M['stoneDark'], 0.64, 0.25, G - 0.005, 0.5, 0.14, 0.025, outline=0.003, bevel=0)
for k, (x, y) in enumerate(((0.55, 0.65), (0.8, 0.55), (0.3, 0.85), (-0.85, -0.2))):
    ball(f'olive{k}', M['olive'], x, y, G + 0.07, 0.075, outline=0.006)

turn(before, -20)
render(G)
