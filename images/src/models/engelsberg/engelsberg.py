# A cartoon Engelsberg Ironworks for the country maps, built in the set's shared look (../toon.py):
# the old ironworks in the forests of Västmanland, Sweden, the finest of its kind left: the tall
# blast furnace house of stone with its timber-clad top and the charcoal bridge running up to it,
# the yellow manor house of the ironmaster by the lake, the red wooden workers' cottages, and
# the birch and pine woods. Turned a little towards the camera.
# Run: blender -b --factory-startup -P engelsberg.py -- engelsberg-1024.png 1024 engelsberg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'water': toon('water', '#4a8ac0', lift=0.3),
    'stone': toon('stone', '#b8b0a0', shadow_mul=(0.8, 0.8, 0.86), lift=0.14),
    'falu': toon('falu', '#a83a2e', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'yellow': toon('yellow', '#f0d080', lift=0.2),
    'white': toon('white', '#f4f0e6', lift=0.22),
    'roof': toon('roof', '#4a4a50'),
    'wood': toon('wood', '#6a4a30'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'pine': toon('pine', '#2e5e36', shadow_mul=(0.7, 0.78, 0.8)),
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


loft('lake', M['water'], [strip(-1.31, -0.62, 1.32, G - 0.004), strip(-1.31, -0.62, 1.32, G + 0.008)], outline=0.002)

# ---------- the blast furnace house ----------
FX, FY = -0.2, 0.15
box('furnace', M['stone'], FX, FY, G - 0.005, 0.26, 0.26, 0.3, outline=0.006, bevel=0)
box('furnacetop', M['falu'], FX, FY, G + 0.295, 0.22, 0.22, 0.14, outline=0.005, bevel=0)
gable('furnaceroof', M['roof'], FX, FY, G + 0.43, 0.22, 0.22, 0.1, ridge_x=True, over=0.015)
arch('furnacearch', M['dark'], FX, FY - 0.133, G - 0.005, 0.1, 0.14)
box('casthouse', M['falu'], FX + 0.25, FY - 0.03, G - 0.005, 0.24, 0.2, 0.14, outline=0.005, bevel=0)
gable('casthouseroof', M['roof'], FX + 0.25, FY - 0.03, G + 0.135, 0.24, 0.2, 0.08, ridge_x=True, over=0.012)
# the charcoal bridge up to the furnace's top
bar('chbridge', M['wood'], (FX - 0.55, FY + 0.35, G + 0.02), (FX - 0.13, FY + 0.06, G + 0.32), 0.07, outline=0.003)
for k in range(4):
    t = (k + 0.5) / 4
    x, y, z = FX - 0.55 + 0.42 * t, FY + 0.35 - 0.29 * t, G + 0.02 + 0.3 * t
    rod(f'chleg{k}', M['wood'], (x, y, G), (x, y, z - 0.03), 0.01, segs=6, outline=0.001)
box('charcoalbarn', M['falu'], FX - 0.62, FY + 0.42, G - 0.005, 0.2, 0.16, 0.1, outline=0.004, bevel=0)
gable('charcoalbarnroof', M['roof'], FX - 0.62, FY + 0.42, G + 0.095, 0.2, 0.16, 0.07, ridge_x=True, over=0.01)

# ---------- the manor house by the lake ----------
HX, HY = 0.5, -0.25
box('manor', M['yellow'], HX, HY, G - 0.005, 0.4, 0.2, 0.18, outline=0.005, bevel=0)
hip('manorroof', M['roof'], HX, HY, G + 0.175, 0.4, 0.2, 0.1, over=0.015)
for j in range(5):
    box(f'manorwin{j}', M['white'], HX - 0.16 + j * 0.08, HY - 0.103, G + 0.04, 0.035, 0.006, 0.05, outline=0, bevel=0)
    box(f'manorwinup{j}', M['white'], HX - 0.16 + j * 0.08, HY - 0.103, G + 0.11, 0.035, 0.006, 0.045, outline=0, bevel=0)
box('manordoor', M['dark'], HX, HY - 0.104, G - 0.005, 0.035, 0.006, 0.07, outline=0, bevel=0)

# ---------- the workers' cottages ----------
for k, (x, y) in enumerate(((0.45, 0.35), (0.75, 0.2), (0.2, 0.6))):
    box(f'cottage{k}', M['falu'], x, y, G - 0.005, 0.18, 0.12, 0.09, outline=0.004, bevel=0)
    gable(f'cottageroof{k}', M['roof'], x, y, G + 0.085, 0.18, 0.12, 0.07, ridge_x=True, over=0.01)
    for s in (-1, 1):
        box(f'cottagewin{k}{s}', M['white'], x + s * 0.05, y - 0.063, G + 0.03, 0.03, 0.006, 0.03, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.95, 0.0), (-0.7, -0.35), (0.95, -0.1), (-0.3, 0.85), (0.65, 0.75), (1.0, 0.45))):
    if k % 2:
        lathe(f'pine{k}', M['pine'], ((0.07, 0), (0.0, 0.32)), G + 0.04, x, y, segs=10, outline=0.005, smooth=False)
        rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.012, segs=6, outline=0.001)
    else:
        tree(f'birch{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
