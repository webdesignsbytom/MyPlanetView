# A cartoon Paraty for the country maps, built in the set's shared look (../toon.py): the colonial
# gold port on the Costa Verde of Brazil, its whitewashed houses with brightly painted doors and
# window frames and red tile roofs, the white church of Santa Rita by the water with its bell
# tower, the cobbled street, the colourful schooners at the quay, and the green hills of the
# Serra do Mar behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P paraty.py -- paraty-1024.png 1024 paraty.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'hill': toon('hill', '#4e8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'water': toon('water', '#3a9ac0', lift=0.3),
    'cobble': toon('cobble', '#b8ae9c', lift=0.15),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.8, 0.82, 0.9), lift=0.25),
    'roof': toon('roof', '#c4643c'),
    'blue': toon('blue', '#2a6ab0'),
    'green': toon('green', '#2a8a5a'),
    'yellow': toon('yellow', '#e8b030'),
    'red': toon('red', '#c83a3a'),
    'wood': toon('wood', '#6a4428'),
    'dark': flat('dark', '#2e2622'),
})

G = tile()
before = set(bpy.data.objects)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('bay', M['water'], [strip(-1.31, -0.55, 1.32, G - 0.004), strip(-1.31, -0.55, 1.32, G + 0.008)], outline=0.002)
for k, (x, y, r, h) in enumerate(((-0.65, 0.95, 0.42, 0.34), (0.25, 1.05, 0.38, 0.4), (0.9, 0.75, 0.32, 0.28))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.6), (r * 0.3, h * 0.95), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    hl.visible_shadow = False
box('street', M['cobble'], 0.0, -0.05, G - 0.004, 1.9, 0.5, 0.008, outline=0.001, bevel=0)

# ---------- the church of Santa Rita ----------
CX, CY = 0.55, -0.3
box('church', M['white'], CX, CY + 0.08, G - 0.005, 0.22, 0.32, 0.18, outline=0.005, bevel=0)
gable('churchroof', M['roof'], CX, CY + 0.08, G + 0.175, 0.22, 0.32, 0.09, over=0.012)
gable('churchfront', M['white'], CX, CY - 0.08, G + 0.175, 0.22, 0.02, 0.09)
arch('churchdoor', M['blue'], CX, CY - 0.083, G - 0.005, 0.05, 0.11)
for s in (-1, 1):
    arch(f'churchwin{s}', M['blue'], CX + s * 0.06, CY - 0.083, G + 0.11, 0.03, 0.05)
box('belltower', M['white'], CX + 0.15, CY + 0.15, G - 0.005, 0.09, 0.09, 0.32, outline=0.004, bevel=0)
arch('belfry', M['dark'], CX + 0.15, CY + 0.103, G + 0.22, 0.04, 0.07)
lathe('bellcap', M['white'], ((0.05, 0), (0.0, 0.08)), G + 0.315, CX + 0.15, CY + 0.15, segs=4, outline=0.003, smooth=False)

# ---------- the colonial houses ----------
TRIMS = (M['blue'], M['green'], M['yellow'], M['red'], M['blue'], M['green'], M['yellow'])
for r, (y, z0) in enumerate(((0.35, 0.0), (-0.15, 0.0))):
    x = -0.9 + 0.06 * r
    for k in range(4 if r == 0 else 3):
        w = 0.24 + 0.04 * ((k + r) % 2)
        h = 0.14 if (k + r) % 3 else 0.2
        hx = x + w / 2
        box(f'house{r}{k}', M['white'], hx, y, G - 0.005, w, 0.22, h, outline=0.005, bevel=0)
        gable(f'houseroof{r}{k}', M['roof'], hx, y, G + h - 0.005, w, 0.22, 0.07, ridge_x=True, over=0.015)
        trim = TRIMS[(k + 3 * r) % 7]
        box(f'housedoor{r}{k}', trim, hx - w * 0.25, y - 0.113, G - 0.005, 0.045, 0.006, 0.09, outline=0, bevel=0)
        for j in range(2):
            box(f'housewin{r}{k}{j}', trim, hx + w * 0.05 + j * 0.07, y - 0.113, G + (0.04 if h < 0.18 else 0.12), 0.04, 0.006, 0.045, outline=0, bevel=0)
        if h > 0.18:
            box(f'housedoor2{r}{k}', trim, hx + w * 0.2, y - 0.113, G - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)
        box(f'housecorner{r}{k}', trim, hx - w / 2 + 0.006, y - 0.111, G - 0.005, 0.012, 0.006, h, outline=0, bevel=0)
        x += w + 0.02

# ---------- the schooners at the quay ----------
for k, (x, y, mat) in enumerate(((-0.6, -0.8, M['red']), (-0.1, -0.85, M['blue']), (0.3, -0.95, M['yellow']))):
    hull = loft(f'hull{k}', mat, [[(x - 0.14, y - 0.03, G + 0.0), (x + 0.12, y - 0.03, G + 0.0), (x + 0.16, y, G + 0.0), (x + 0.12, y + 0.03, G + 0.0), (x - 0.14, y + 0.03, G + 0.0)],
                                   [(x - 0.16, y - 0.05, G + 0.05), (x + 0.14, y - 0.05, G + 0.05), (x + 0.2, y, G + 0.06), (x + 0.14, y + 0.05, G + 0.05), (x - 0.16, y + 0.05, G + 0.05)]], outline=0.003)
    box(f'deck{k}', M['white'], x - 0.03, y, G + 0.05, 0.14, 0.07, 0.04, outline=0.002, bevel=0)
    rod(f'mast{k}', M['wood'], (x + 0.05, y, G + 0.05), (x + 0.05, y, G + 0.22), 0.006, segs=6, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
