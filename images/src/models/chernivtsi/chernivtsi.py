# A cartoon Residence of the Bukovinian and Dalmatian Metropolitans for the country maps, built in
# the set's shared look (../toon.py): Josef Hlávka's red brick palace in Chernivtsi, Ukraine, now
# the university: its wings of dark red brick round a courtyard, the roofs laid in patterns of
# green, yellow and blue glazed tiles, the stepped gables, the seminary church with its twin
# domed towers, and the park. Turned a little towards the camera.
# Run: blender -b --factory-startup -P chernivtsi.py -- chernivtsi-1024.png 1024 chernivtsi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'brick': toon('brick', '#a84a38', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'trim': toon('trim', '#e8dcc0', lift=0.2),
    'tileGreen': toon('tileGreen', '#3a8a5a', lift=0.18),
    'tileYellow': toon('tileYellow', '#e0b440', lift=0.2),
    'tileBlue': toon('tileBlue', '#3a6aa8', lift=0.18),
    'gold': toon('gold2', '#e8b848', shadow_mul=(0.78, 0.66, 0.6), lift=0.35),
    'path': toon('path2', '#e2d6bc', lift=0.18),
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



def tiled_roof(name, x, y, z, w, d, h, ridge_x):
    """A pitched roof in bands of glazed tiles: green, then a yellow and a blue stripe."""
    gable(name, M['tileGreen'], x, y, z, w, d, h, ridge_x=ridge_x, over=0.012, outline=0.004)
    for k, (t, mat) in enumerate(((0.35, M['tileYellow']), (0.6, M['tileBlue']))):
        if ridge_x:
            for s in (-1, 1):
                yy = y + s * (d / 2 + 0.012) * (1 - t)
                bar(f'{name}stripe{k}{s}', mat, (x - w / 2 - 0.01, yy, z + h * t + 0.006), (x + w / 2 + 0.01, yy, z + h * t + 0.006), 0.018, outline=0)
        else:
            for s in (-1, 1):
                xx = x + s * (w / 2 + 0.012) * (1 - t)
                bar(f'{name}stripe{k}{s}', mat, (xx, y - d / 2 - 0.01, z + h * t + 0.006), (xx, y + d / 2 + 0.01, z + h * t + 0.006), 0.018, outline=0)


# ---------- the main wing ----------
MX, MY = -0.1, 0.25
box('main', M['brick'], MX, MY, G - 0.005, 0.8, 0.2, 0.22, outline=0.007, bevel=0)
tiled_roof('mainroof', MX, MY, G + 0.215, 0.8, 0.2, 0.14, True)
for j in range(9):
    x = MX - 0.36 + j * 0.09
    arch(f'mainwin{j}', M['trim'], x, MY - 0.103, G + 0.04, 0.04, 0.07)
    arch(f'mainwinup{j}', M['trim'], x, MY - 0.103, G + 0.13, 0.04, 0.06)
# the gatehouse tower in the middle with its stepped gable
box('gatetower', M['brick'], MX, MY - 0.12, G - 0.005, 0.18, 0.1, 0.34, outline=0.006, bevel=0)
for k in range(4):
    box(f'stepgable{k}', M['brick'], MX, MY - 0.12, G + 0.335 + k * 0.035, 0.18 - k * 0.045, 0.1, 0.035, outline=0.002, bevel=0)
arch('gate', M['dark'], MX, MY - 0.173, G - 0.005, 0.08, 0.15)
box('gatetrim', M['trim'], MX, MY - 0.172, G + 0.18, 0.12, 0.004, 0.015, outline=0, bevel=0)
# the side wing
for s in (-1, 1):
    box(f'side{s}', M['brick'], MX + s * 0.36, MY - 0.32, G - 0.005, 0.16, 0.44, 0.18, outline=0.006, bevel=0)
    tiled_roof(f'sideroof{s}', MX + s * 0.36, MY - 0.32, G + 0.175, 0.16, 0.44, 0.1, False)
    for j in range(2):
        arch(f'sidewin{s}{j}', M['trim'], MX + s * 0.36 - 0.035 + j * 0.07, MY - 0.543, G + 0.05, 0.035, 0.07)

# ---------- the seminary church ----------
CX, CY = 0.65, -0.05
box('church', M['brick'], CX, CY, G - 0.005, 0.2, 0.3, 0.2, outline=0.005, bevel=0)
tiled_roof('churchroof', CX, CY, G + 0.195, 0.2, 0.3, 0.1, False)
for s in (-1, 1):
    box(f'churchtower{s}', M['brick'], CX + s * 0.08, CY - 0.16, G - 0.005, 0.07, 0.07, 0.34, outline=0.004, bevel=0)
    lathe(f'churchdome{s}', M['tileGreen'], ((0.045, 0), (0.05, 0.03), (0.03, 0.07), (0.0, 0.1)), G + 0.335, CX + s * 0.08, CY - 0.16, segs=12, outline=0.003)
    rod(f'churchcross{s}', M['gold'], (CX + s * 0.08, CY - 0.16, G + 0.435), (CX + s * 0.08, CY - 0.16, G + 0.48), 0.005, segs=6, outline=0)
arch('churchdoor', M['dark'], CX, CY - 0.153, G - 0.005, 0.05, 0.1)

box('path', M['path'], MX, MY - 0.6, G - 0.004, 0.14, 0.5, 0.008, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.4), (-0.6, -0.75), (0.35, -0.7), (0.95, -0.4), (-0.6, 0.75), (0.5, 0.7))):
    tree(f'tree{k}', x, y, r=0.1, h=0.13)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
