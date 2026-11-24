# A cartoon Saltaire for the country maps, built in the set's shared look (../toon.py): Sir Titus
# Salt's model mill village in West Yorkshire, England: the huge honey-coloured stone Salts Mill
# with its rows of tall windows and its chimney built like an Italian campanile, the canal and
# the River Aire beside it, the domed Congregational church, and the neat terraces of
# workers' houses. Turned a little towards the camera.
# Run: blender -b --factory-startup -P saltaire.py -- saltaire-1024.png 1024 saltaire.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#dcc48e', shadow_mul=(0.8, 0.78, 0.82), lift=0.16),
    'stoneDark': toon('stoneDark', '#b8a070'),
    'roof': toon('roof', '#5a5a62'),
    'water': toon('water', '#4a8ac0', lift=0.3),
    'green': toon('green3', '#6a9a8a'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)

def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('river', M['water'], [strip(0.82, 1.31, 1.32, G - 0.004), strip(0.82, 1.31, 1.32, G + 0.008)], outline=0.002)
box('canal', M['water'], 0.0, 0.62, G - 0.004, 2.1, 0.1, 0.012, outline=0.001, bevel=0)

# ---------- Salts Mill ----------
MX, MY = -0.1, 0.32
box('mill', M['stone'], MX, MY, G - 0.005, 1.1, 0.24, 0.3, outline=0.008, bevel=0)
hip('millroof', M['roof'], MX, MY, G + 0.295, 1.1, 0.24, 0.07, over=0.01)
for r in range(4):
    for j in range(16):
        box(f'millwin{r}{j}', M['dark'], MX - 0.51 + j * 0.068, MY - 0.123, G + 0.03 + r * 0.07, 0.03, 0.006, 0.045, outline=0, bevel=0)
for s in (-1, 1):
    box(f'millcorner{s}', M['stone'], MX + s * 0.1, MY - 0.13, G - 0.005, 0.12, 0.04, 0.36, outline=0.004, bevel=0)
    hip(f'millcornercap{s}', M['roof'], MX + s * 0.1, MY - 0.13, G + 0.355, 0.12, 0.04, 0.05)
# the campanile chimney
CX, CY = MX + 0.65, MY + 0.05
box('chimney', M['stone'], CX, CY, G - 0.005, 0.09, 0.09, 0.66, outline=0.005, bevel=0)
for z in (0.25, 0.45):
    box(f'chimneyband{z}', M['stoneDark'], CX, CY, G + z, 0.1, 0.1, 0.015, outline=0, bevel=0)
box('chimneytop', M['stoneDark'], CX, CY, G + 0.655, 0.11, 0.11, 0.04, outline=0.003, bevel=0)
arch('chimneyopen', M['dark'], CX, CY - 0.047, G + 0.57, 0.035, 0.07)

# ---------- the church ----------
UX, UY = 0.55, -0.25
box('church', M['stone'], UX, UY + 0.06, G - 0.005, 0.2, 0.3, 0.18, outline=0.005, bevel=0)
gable('churchroof', M['roof'], UX, UY + 0.06, G + 0.175, 0.2, 0.3, 0.08, over=0.01)
lathe('churchportico', M['stone'], ((0.09, 0), (0.09, 0.02)), G - 0.005, UX, UY - 0.12, segs=16, outline=0.002)
for j in range(6):
    a = math.pi + j * math.pi / 5
    lathe(f'churchcol{j}', M['stone'], ((0.012, 0), (0.012, 0.16)), G + 0.015, UX + 0.08 * math.cos(a), UY - 0.12 + 0.08 * math.sin(a), segs=8, outline=0.001)
lathe('churchdrum', M['stone'], ((0.07, 0), (0.07, 0.06)), G + 0.175, UX, UY - 0.1, segs=16, outline=0.003)
lathe('churchdome', M['green'], [(0.072 * math.cos(a), 0.08 * math.sin(a)) for a in [k * math.pi / 12 for k in range(7)]], G + 0.235, UX, UY - 0.1, segs=16, outline=0.003)

# ---------- the terraces of houses ----------
for r in range(3):
    y = -0.15 - r * 0.25
    x0, x1 = -0.95 + 0.1 * r, 0.3 - 0.05 * r
    L = x1 - x0
    box(f'terrace{r}', M['stone'], (x0 + x1) / 2, y, G - 0.005, L, 0.14, 0.13, outline=0.005, bevel=0)
    gable(f'terraceroof{r}', M['roof'], (x0 + x1) / 2, y, G + 0.125, L, 0.14, 0.06, ridge_x=True, over=0.01)
    n = int(L / 0.08)
    for j in range(n):
        x = x0 + 0.04 + j * L / n
        box(f'tdoor{r}{j}', M['dark'], x, y - 0.073, G - 0.005, 0.02, 0.006, 0.06, outline=0, bevel=0)
        box(f'twin{r}{j}', M['dark'], x + 0.025, y - 0.073, G + 0.07, 0.02, 0.006, 0.03, outline=0, bevel=0)
for k, (x, y) in enumerate(((0.9, -0.1), (0.85, -0.55), (0.35, -0.85), (-0.95, 0.2))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
