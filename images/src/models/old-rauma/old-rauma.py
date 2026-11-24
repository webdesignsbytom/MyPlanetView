# A cartoon Old Rauma for the country maps, built in the set's shared look (../toon.py): the largest
# wooden old town in the Nordic countries, on the west coast of Finland, its streets of low
# wooden houses painted yellow, green, blue and red with white trim and tall gates between
# them, and the grey stone Church of the Holy Cross with its steep roof and tall spire by the
# river. Turned a little towards the camera.
# Run: blender -b --factory-startup -P old-rauma.py -- old-rauma-1024.png 1024 old-rauma.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'cobble': toon('cobble', '#b8b0a0', lift=0.15),
    'yellow': toon('yellow', '#f0cc70', lift=0.2),
    'green': toon('green2', '#a8c890', lift=0.2),
    'blue': toon('blue', '#8cb0d0', lift=0.2),
    'red': toon('red', '#b8503a', lift=0.12),
    'white': toon('white', '#f6f2ea', lift=0.25),
    'roof': toon('roof', '#5a5450'),
    'stone': toon('stone', '#a8a49a', shadow_mul=(0.8, 0.8, 0.86), lift=0.12),
    'water': toon('water', '#4a9ac0', lift=0.3),
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


loft('river', M['water'], [strip(0.78, 1.31, 1.32, G - 0.004), strip(0.78, 1.31, 1.32, G + 0.008)], outline=0.002)
box('street', M['cobble'], -0.1, -0.2, G - 0.004, 1.9, 0.18, 0.008, outline=0.001, bevel=0)

# ---------- the wooden houses along the street ----------
COLS = (M['yellow'], M['green'], M['blue'], M['red'], M['yellow'], M['blue'], M['green'])
for r, (y, face) in enumerate(((0.07, -1), (-0.5, -1))):
    x = -0.95 + 0.06 * r
    k = 0
    while x < (0.2 if r == 0 else 0.75):
        w = 0.22 + 0.04 * ((k + r) % 2)
        hx = x + w / 2
        box(f'house{r}{k}', COLS[(k + 2 * r) % 7], hx, y, G - 0.005, w, 0.18, 0.12, outline=0.005, bevel=0)
        gable(f'houseroof{r}{k}', M['roof'], hx, y, G + 0.115, w, 0.18, 0.08, ridge_x=True, over=0.012)
        for j in range(3):
            box(f'housewin{r}{k}{j}', M['white'], hx - w / 2 + 0.05 + j * (w - 0.1) / 2, y - 0.093, G + 0.04, 0.035, 0.006, 0.045, outline=0, bevel=0)
            box(f'housewing{r}{k}{j}', M['dark'], hx - w / 2 + 0.05 + j * (w - 0.1) / 2, y - 0.096, G + 0.045, 0.025, 0.004, 0.035, outline=0, bevel=0)
        for e in (-1, 1):
            box(f'housecorner{r}{k}{e}', M['white'], hx + e * (w / 2 - 0.006), y - 0.093, G - 0.005, 0.012, 0.006, 0.12, outline=0, bevel=0)
        x += w
        if k % 2 == 1:
            box(f'gate{r}{k}', M['red'], x + 0.035, y - 0.06, G - 0.005, 0.07, 0.02, 0.1, outline=0.002, bevel=0)
            x += 0.07
        k += 1

# ---------- the Church of the Holy Cross ----------
CX, CY = 0.55, 0.35
box('church', M['stone'], CX, CY, G - 0.005, 0.24, 0.5, 0.2, outline=0.006, bevel=0)
gable('churchroof', M['roof'], CX, CY, G + 0.195, 0.24, 0.5, 0.2, over=0.012)
box('churchtower', M['stone'], CX, CY - 0.3, G - 0.005, 0.12, 0.12, 0.3, outline=0.005, bevel=0)
lathe('spire', M['roof'], ((0.08, 0), (0.0, 0.34)), G + 0.295, CX, CY - 0.3, segs=8, outline=0.004, smooth=False)
for j in range(3):
    arch(f'churchwin{j}', M['dark'], CX + 0.123, CY - 0.1 + j * 0.13, G + 0.05, 0.04, 0.11, face='x')
arch('churchdoor', M['dark'], CX, CY - 0.363, G - 0.005, 0.05, 0.1)

for k, (x, y) in enumerate(((-0.6, 0.55), (-0.25, 0.6), (0.95, -0.15), (-0.95, 0.3))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
