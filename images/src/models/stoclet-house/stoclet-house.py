# A cartoon Stoclet Palace for the country maps, built in the set's shared look (../toon.py): Josef
# Hoffmann's Vienna Secession mansion in Brussels, Belgium, its flat blocks faced in white
# Norwegian marble edged with bronze mouldings, the long rows of tall windows, the stepped
# stair tower crowned by four bronze figures and a dome of laurel, and the formal garden behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P stoclet-house.py -- stoclet-house-1024.png 1024 stoclet-house.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'marble': toon('marble', '#f2f0ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.25),
    'bronze': toon('bronze', '#6a5a3a'),
    'bronzeLight': toon('bronzeLight', '#b8984a', lift=0.3),
    'glass': flat('glass', '#384a58'),
    'path': toon('path2', '#e6dcc4', lift=0.2),
    'hedge': toon('hedge', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
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



def block(name, x, y, z, w, d, h):
    box(name, M['marble'], x, y, z, w, d, h, outline=0.005, bevel=0)
    for (ex, ey) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        rod(f'{name}edge{ex}{ey}', M['bronze'], (x + ex * w / 2, y + ey * d / 2, z), (x + ex * w / 2, y + ey * d / 2, z + h), 0.005, segs=6, outline=0)
    for (sx, sy, l, along) in ((0, -1, w, 'x'), (0, 1, w, 'x'), (-1, 0, d, 'y'), (1, 0, d, 'y')):
        p = (x + sx * w / 2, y + sy * d / 2)
        if along == 'x':
            bar(f'{name}top{sx}{sy}', M['bronze'], (x - w / 2, p[1], z + h), (x + w / 2, p[1], z + h), 0.01, outline=0)
        else:
            bar(f'{name}top{sx}{sy}', M['bronze'], (p[0], y - d / 2, z + h), (p[0], y + d / 2, z + h), 0.01, outline=0)


# ---------- the house ----------
HX, HY = -0.05, 0.05
block('main', HX, HY, G - 0.005, 0.8, 0.32, 0.24)
block('wing', HX + 0.48, HY + 0.08, G - 0.005, 0.2, 0.26, 0.17)
block('upper', HX - 0.12, HY + 0.02, G + 0.235, 0.46, 0.24, 0.08)
for j in range(9):
    x = HX - 0.36 + j * 0.09
    box(f'win{j}', M['glass'], x, HY - 0.163, G + 0.03, 0.045, 0.006, 0.08, outline=0, bevel=0)
    box(f'winup{j}', M['glass'], x, HY - 0.163, G + 0.14, 0.045, 0.006, 0.07, outline=0, bevel=0)
box('bay', M['marble'], HX + 0.18, HY - 0.19, G + 0.12, 0.16, 0.06, 0.11, outline=0.004, bevel=0)
box('baywin', M['glass'], HX + 0.18, HY - 0.222, G + 0.14, 0.12, 0.006, 0.07, outline=0, bevel=0)
box('door', M['bronze'], HX - 0.25, HY - 0.163, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)

# ---------- the stair tower ----------
TX, TY = HX - 0.2, HY + 0.1
z = G + 0.31
for k, (w, h) in enumerate(((0.16, 0.14), (0.14, 0.08), (0.12, 0.05), (0.1, 0.04))):
    block(f'tower{k}', TX, TY, z, w, w, h)
    z += h
box('towerwin', M['glass'], TX, TY - 0.083, G + 0.33, 0.03, 0.006, 0.11, outline=0, bevel=0)
for k in range(4):
    a = k * math.pi / 2 + math.pi / 4
    x, y = TX + 0.045 * math.cos(a), TY + 0.045 * math.sin(a)
    rod(f'figure{k}', M['bronzeLight'], (x, y, z), (x, y, z + 0.07), 0.01, segs=6, outline=0.001)
    ball(f'figurehead{k}', M['bronzeLight'], x, y, z + 0.08, 0.012, outline=0.001)
lathe('laurel', M['bronzeLight'], [(0.04 * math.cos(a), 0.05 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], z + 0.06, TX, TY, segs=12, outline=0.003)

# ---------- the formal garden ----------
box('drive', M['path'], HX, HY - 0.45, G - 0.004, 1.2, 0.14, 0.008, outline=0.001, bevel=0)
for k in range(4):
    box(f'hedge{k}', M['hedge'], -0.55 + k * 0.36, HY + 0.45, G - 0.005, 0.26, 0.08, 0.06, outline=0.003, bevel=0)
box('gardenpath', M['path'], HX, HY + 0.45, G - 0.004, 0.06, 0.4, 0.008, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.95, 0.4), (0.9, 0.55), (-0.9, -0.3), (0.95, -0.25))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
