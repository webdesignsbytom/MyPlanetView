# A cartoon Crespi d'Adda for the country maps, built in the set's shared look (../toon.py): the
# company town the Crespi family built round their cotton mill by the Adda in Lombardy, Italy:
# the long brick mill with its pointed gables, its tall chimney, the little church copied from
# Bramante's in Busto Arsizio, and the workers' houses, each with its garden, in neat rows.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P crespi-dadda.py -- crespi-dadda-1024.png 1024 crespi-dadda.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'brick': toon('brick', '#c46a4a', shadow_mul=(0.78, 0.7, 0.74), lift=0.14),
    'brickLight': toon('brickLight', '#d88a6a', lift=0.15),
    'cream': toon('cream2', '#f0e2c4', lift=0.2),
    'roof': toon('roof', '#8a4a3a'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'road': toon('road', '#d8ccb0', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
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


loft('river', M['water'], [strip(0.85, 1.31, 1.32, G - 0.004), strip(0.85, 1.31, 1.32, G + 0.008)], outline=0.002)
box('road', M['road'], 0.0, 0.0, G - 0.004, 2.2, 0.12, 0.008, outline=0.001, bevel=0)

# ---------- the mill ----------
MX, MY = -0.05, 0.45
box('mill', M['brick'], MX, MY, G - 0.005, 1.1, 0.34, 0.16, outline=0.007, bevel=0)
for j in range(7):
    x = MX - 0.48 + j * 0.16
    gable(f'millgable{j}', M['brickLight'], x, MY, G + 0.155, 0.15, 0.34, 0.08, outline=0.003)
    for i in (-1, 1):
        arch(f'millwin{j}{i}', M['dark'], x + i * 0.035, MY - 0.173, G + 0.04, 0.03, 0.08)
lathe('chimney', M['brick'], ((0.05, 0), (0.035, 0.62), (0.045, 0.64), (0.045, 0.66)), G - 0.005, MX + 0.62, MY + 0.05, segs=16, outline=0.005)
box('gatehouse', M['cream'], MX - 0.6, MY - 0.12, G - 0.005, 0.14, 0.14, 0.2, outline=0.004, bevel=0)
hip('gatehouseroof', M['roof'], MX - 0.6, MY - 0.12, G + 0.195, 0.14, 0.14, 0.06)

# ---------- the church ----------
CX, CY = 0.55, -0.3
box('church', M['cream'], CX, CY, G - 0.005, 0.2, 0.2, 0.18, outline=0.005, bevel=0)
lathe('churchdrum', M['cream'], ((0.08, 0), (0.08, 0.07)), G + 0.175, CX, CY, segs=8, outline=0.004, smooth=False)
lathe('churchcap', M['roof'], ((0.09, 0), (0.0, 0.08)), G + 0.245, CX, CY, segs=8, outline=0.003, smooth=False)
arch('churchdoor', M['dark'], CX, CY - 0.103, G - 0.005, 0.045, 0.1)
gable('churchpediment', M['cream'], CX, CY - 0.09, G + 0.175, 0.2, 0.03, 0.05)

# ---------- the workers' houses in rows ----------
for i in range(4):
    for j in range(2):
        x, y = -0.75 + i * 0.3, -0.3 - j * 0.32
        if math.hypot(x, y) > 1.05:
            continue
        box(f'house{i}{j}', M['cream'], x, y, G - 0.005, 0.18, 0.14, 0.13, outline=0.004, bevel=0)
        hip(f'houseroof{i}{j}', M['roof'], x, y, G + 0.125, 0.18, 0.14, 0.06, over=0.01)
        for k in (-1, 1):
            box(f'housewin{i}{j}{k}', M['dark'], x + k * 0.045, y - 0.073, G + 0.05, 0.025, 0.006, 0.035, outline=0, bevel=0)
        tree(f'garden{i}{j}', x + 0.13, y + 0.02, r=0.05, h=0.06)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
