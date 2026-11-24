# A cartoon Corfu Old Fortress for the country maps, built in the set's shared look (../toon.py): the
# Venetian fortress on its rocky double-peaked headland jutting into the Ionian Sea, cut off from the
# town by its sea moat (the Contrafossa) and reached by a bridge, its massive bastions, the clock
# tower and the lighthouse on the higher peak, the Doric temple-front of St George's church, and the
# Liston's arcaded old town across the moat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P corfu.py -- corfu-1024.png 1024 corfu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'rock': toon('rock', '#a89a80', shadow_mul=(0.84, 0.84, 0.88)),
    'green': toon('green', '#7aa854', shadow_mul=(0.72, 0.8, 0.76)),
    'stone': toon('stone', '#d8c8a4', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#b8a684'),
    'white': toon('white', '#f6f4ee', lift=0.2),
    'ochre': toon('ochre', '#e8c080', lift=0.1),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#2e2a26'),
    'paving': toon('paving', '#d0c8b8', lift=0.2),
})

G = tile(M['sea'])
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


# ---------- the old town at the back, across the moat ----------
loft('town', M['paving'], [strip(0.62, 1.41, 1.42, -0.01), strip(0.62, 1.38, 1.39, 0.06)], outline=0.006)
for k, x in enumerate((-0.75, -0.45, -0.15, 0.15, 0.45, 0.75)):
    y = 0.85 + 0.05 * (k % 2)
    box(f'liston{k}', M['ochre'], x, y, G + 0.055, 0.28, 0.2, 0.18, outline=0.005, bevel=0)
    for j in range(3):
        box(f'listonarch{k}{j}', M['dark'], x - 0.08 + j * 0.08, y - 0.103, G + 0.06, 0.04, 0.006, 0.06, outline=0, bevel=0)
    loft(f'listonroof{k}', M['roof'], [[(x - 0.14, y - 0.1, G + 0.23), (x + 0.14, y - 0.1, G + 0.23), (x + 0.14, y + 0.1, G + 0.23), (x - 0.14, y + 0.1, G + 0.23)],
                                       [(x - 0.14, y - 0.004, G + 0.29), (x + 0.14, y - 0.004, G + 0.29), (x + 0.14, y + 0.004, G + 0.29), (x - 0.14, y + 0.004, G + 0.29)]], outline=0.003)

# ---------- the headland: rock with its two peaks ----------
head = [(0.62 * math.cos(2 * math.pi * k / 20) * (1 + 0.1 * math.sin(2 * 2 * math.pi * k / 20)), -0.1 + 0.55 * math.sin(2 * math.pi * k / 20)) for k in range(20)]
loft('headland', M['rock'], [[(x, y, G - 0.01) for x, y in head], [(x * 0.95, -0.1 + (y + 0.1) * 0.95, G + 0.12) for x, y in head]], outline=0.007)
T = G + 0.12
for k, (x, y, r, h) in enumerate(((-0.22, -0.05, 0.25, 0.22), (0.22, -0.15, 0.28, 0.3))):
    pk = lathe(f'peak{k}', M['green'], ((r, 0), (r * 0.7, h * 0.6), (r * 0.25, h * 0.95), (0.004, h)), T - 0.01, x, y, segs=16, outline=0.006)
    pk.visible_shadow = False

# ---------- the bastions and walls round the headland's neck ----------
for s in (-1, 1):
    bx, by = s * 0.4, 0.3
    arrow = [(bx - 0.13, by + 0.08), (bx - 0.13, by - 0.05), (bx, by - 0.2), (bx + 0.13, by - 0.05), (bx + 0.13, by + 0.08)]
    loft(f'bastion{s}', M['stone'], [[(x, y, G - 0.01) for x, y in arrow], [(x, y, T + 0.06) for x, y in arrow]], outline=0.005)
box('frontwall', M['stone'], 0, 0.32, G - 0.01, 0.6, 0.08, T - G + 0.08, outline=0.006, bevel=0)
box('gate', M['dark'], 0, 0.36, T - 0.06, 0.07, 0.006, 0.1, outline=0, bevel=0)
# the moat and the bridge over it to the town
box('bridge', M['stoneDark'], 0, 0.48, G + 0.04, 0.1, 0.28, 0.025, outline=0.003, bevel=0)
for s in (-1, 1):
    bar(f'bridgerail{s}', M['stoneDark'], (s * 0.05, 0.34, G + 0.08), (s * 0.05, 0.62, G + 0.08), 0.01, outline=0)

# ---------- the clock tower, the lighthouse and St George's ----------
CX, CY = -0.22, -0.05
CZ = T + 0.2
box('clocktower', M['stone'], CX, CY, CZ - 0.02, 0.08, 0.08, 0.24, outline=0.005, bevel=0)
cyl('clockface', M['white'], 0.025, 0.006, segs=12, outline=0.001, matrix=Matrix.Translation((CX, CY - 0.043, CZ + 0.17)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('clockcap', M['roof'], ((0.055, 0), (0.003, 0.08)), CZ + 0.215, CX, CY, segs=4, outline=0.002, smooth=False)
LX, LY = 0.22, -0.15
LZ = T + 0.28
box('lighthouse', M['white'], LX, LY, LZ - 0.02, 0.09, 0.09, 0.12, outline=0.004, bevel=0)
lathe('lantern', M['stoneDark'], ((0.035, 0), (0.035, 0.05), (0.003, 0.09)), LZ + 0.095, LX, LY, segs=8, outline=0.002, smooth=False)
GX, GY = 0.35, 0.12
box('stgeorge', M['white'], GX, GY, T - 0.01, 0.16, 0.22, 0.14, outline=0.005, bevel=0)
for j in range(4):
    rod(f'stgeorgecol{j}', M['white'], (GX - 0.06 + j * 0.04, GY - 0.12, T - 0.01), (GX - 0.06 + j * 0.04, GY - 0.12, T + 0.12), 0.01, segs=8, outline=0.001)
loft('stgeorgepediment', M['white'], [[(GX - 0.085, GY - 0.13, T + 0.12), (GX + 0.085, GY - 0.13, T + 0.12), (GX + 0.085, GY + 0.11, T + 0.12), (GX - 0.085, GY + 0.11, T + 0.12)],
                                      [(GX - 0.004, GY - 0.13, T + 0.18), (GX + 0.004, GY - 0.13, T + 0.18), (GX + 0.004, GY + 0.11, T + 0.18), (GX - 0.004, GY + 0.11, T + 0.18)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
