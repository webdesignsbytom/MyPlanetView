# A cartoon Tlacotalpan for the country maps, built in the set's shared look (../toon.py): the old
# river port on the Papaloapan in Veracruz, Mexico, its single-storey houses painted every colour,
# with long arcades of columns along the street fronts and red tile roofs, the white and blue
# church of the Candelaria with its tower on the plaza, the palms, and the wide river with a
# launch. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tlacotalpan.py -- tlacotalpan-1024.png 1024 tlacotalpan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'paving': toon('paving', '#ddd0b4', lift=0.18),
    'water': toon('water', '#4a9ac0', lift=0.3),
    'white': toon('white', '#f6f4ee', lift=0.25),
    'blue': toon('blue', '#5aa0d8', lift=0.2),
    'pink': toon('pink', '#e87a9a', lift=0.2),
    'yellow': toon('yellow', '#f0c040', lift=0.2),
    'green': toon('green2', '#6ac08a', lift=0.2),
    'purple': toon('purple', '#a07ac8', lift=0.2),
    'orange': toon('orange', '#f09a4a', lift=0.2),
    'roof': toon('roof', '#c4643c'),
    'dark': flat('dark', '#2e2622'),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left

def palm(name, x, y, h=0.3):
    rod(name + "trunk", M["trunk"], (x, y, G), (x + 0.03, y, G + h), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f"{name}frond{j}", M["palm"], (x + 0.03, y, G + h), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + h - 0.05), 0.03, outline=0.002)


loft('river', M['water'], [strip(-1.31, -0.62, 1.32, G - 0.004), strip(-1.31, -0.62, 1.32, G + 0.008)], outline=0.002)
box('plaza', M['paving'], 0.0, 0.0, G - 0.004, 1.6, 0.9, 0.008, outline=0.001, bevel=0)

# ---------- the arcaded houses ----------
COLS = (M['blue'], M['pink'], M['yellow'], M['green'], M['purple'], M['orange'], M['blue'], M['pink'])
for r, y in enumerate((0.55, -0.35)):
    x = -0.9 + 0.05 * r
    k = 0
    while x < 0.7:
        w = 0.24 + 0.04 * ((k + r) % 2)
        if r == 1 and -0.1 < x + w / 2 < 0.5:
            x += w + 0.02
            k += 1
            continue
        hx = x + w / 2
        mat = COLS[(k + 3 * r) % len(COLS)]
        box(f'house{r}{k}', mat, hx, y, G - 0.005, w, 0.24, 0.15, outline=0.005, bevel=0)
        gable(f'houseroof{r}{k}', M['roof'], hx, y + 0.02, G + 0.145, w, 0.2, 0.06, ridge_x=True, over=0.012)
        box(f'arcaderoof{r}{k}', M['roof'], hx, y - 0.15, G + 0.13, w, 0.08, 0.015, outline=0.002, bevel=0)
        for j in range(3):
            rod(f'arcadecol{r}{k}{j}', M['white'], (hx - w / 2 + 0.03 + j * (w - 0.06) / 2, y - 0.18, G), (hx - w / 2 + 0.03 + j * (w - 0.06) / 2, y - 0.18, G + 0.13), 0.008, segs=8, outline=0.001)
        for j in (-1, 1):
            box(f'housedoor{r}{k}{j}', M['dark'], hx + j * w * 0.22, y - 0.123, G - 0.005, 0.035, 0.006, 0.09, outline=0, bevel=0)
        x += w + 0.02
        k += 1

# ---------- the church of the Candelaria ----------
CX, CY = 0.2, -0.3
box('church', M['white'], CX, CY + 0.06, G - 0.005, 0.24, 0.32, 0.18, outline=0.005, bevel=0)
gable('churchroof', M['blue'], CX, CY + 0.06, G + 0.175, 0.24, 0.32, 0.08, over=0.01)
box('churchfront', M['white'], CX, CY - 0.1, G - 0.005, 0.26, 0.03, 0.24, outline=0.004, bevel=0)
for j in range(3):
    box(f'churchband{j}', M['blue'], CX, CY - 0.117, G + 0.05 + j * 0.07, 0.26, 0.004, 0.012, outline=0, bevel=0)
arch('churchdoor', M['dark'], CX, CY - 0.118, G - 0.005, 0.06, 0.12)
box('churchtower', M['white'], CX + 0.16, CY - 0.06, G - 0.005, 0.09, 0.09, 0.38, outline=0.004, bevel=0)
arch('churchbelfry', M['dark'], CX + 0.16, CY - 0.108, G + 0.27, 0.04, 0.07)
lathe('churchcap', M['blue'], [(0.05 * math.cos(a), 0.06 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], G + 0.375, CX + 0.16, CY - 0.06, segs=8, outline=0.003, smooth=False)

for k, (x, y) in enumerate(((-0.65, 0.05), (-0.25, 0.05), (0.75, 0.1), (-0.9, -0.55))):
    palm(f'palm{k}', x, y)
hull = loft('launch', M['white'], [[(-0.45, -0.88, G + 0.0), (-0.15, -0.88, G + 0.0), (-0.1, -0.85, G + 0.0), (-0.15, -0.82, G + 0.0), (-0.45, -0.82, G + 0.0)],
                                   [(-0.47, -0.9, G + 0.04), (-0.15, -0.9, G + 0.04), (-0.08, -0.85, G + 0.045), (-0.15, -0.8, G + 0.04), (-0.47, -0.8, G + 0.04)]], outline=0.003)
box('launchcabin', M['blue'], -0.32, -0.85, G + 0.04, 0.14, 0.06, 0.05, outline=0.002, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
