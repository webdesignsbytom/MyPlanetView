# A cartoon Thracian Tomb of Kazanlak for the country maps, built in the set's shared look
# (../toon.py): the painted beehive tomb of a Thracian ruler in the Valley of the Roses,
# Bulgaria, under its round grassy mound in Tyulbe Park, the low shelter over its entrance
# corridor, the copy of the tomb open to visitors beside it with its little dome, and rose
# bushes all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kazanlak.py -- kazanlak-1024.png 1024 kazanlak.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'mound': toon('mound', '#7aac50', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.8, 0.8, 0.86), lift=0.18),
    'brick': toon('brick', '#c08060'),
    'glass': flat('glass', '#384a58'),
    'path': toon('path2', '#e2d6bc', lift=0.18),
    'rose': toon('rose', '#e0607a', lift=0.25),
    'leaf': toon('leaf', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
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


# ---------- the mound ----------
MX, MY = -0.15, 0.25
mnd = lathe('mound', M['mound'], [(0.55 * math.cos(a), 0.3 * math.sin(a)) for a in [k * math.pi / 16 for k in range(9)]], G - 0.01, MX, MY, segs=36, outline=0.007)
mnd.visible_shadow = False
# the shelter over the corridor into it
box('shelter', M['stone'], MX + 0.05, MY - 0.5, G - 0.005, 0.18, 0.22, 0.13, outline=0.005, bevel=0)
box('shelterroof', M['brick'], MX + 0.05, MY - 0.48, G + 0.125, 0.22, 0.28, 0.025, outline=0.003, bevel=0)
box('shelterdoor', M['glass'], MX + 0.05, MY - 0.613, G - 0.005, 0.08, 0.006, 0.1, outline=0, bevel=0)
box('path', M['path'], MX + 0.05, MY - 0.85, G - 0.004, 0.1, 0.5, 0.008, outline=0.001, bevel=0)

# ---------- the copy of the tomb ----------
CX, CY = 0.6, -0.15
box('copy', M['stone'], CX, CY, G - 0.005, 0.22, 0.3, 0.12, outline=0.005, bevel=0)
lathe('copydome', M['brick'], [(0.1 * math.cos(a), 0.1 * math.sin(a)) for a in [k * math.pi / 12 for k in range(7)]], G + 0.115, CX, CY + 0.05, segs=20, outline=0.004)
box('copydoor', M['dark'], CX, CY - 0.153, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)

# ---------- the rose bushes ----------
for k in range(16):
    a = 2 * math.pi * k / 16
    x, y = 1.05 * math.cos(a), 0.95 * math.sin(a)
    if abs(x - MX - 0.05) < 0.15 and y < 0:
        continue
    b = ball(f'bush{k}', M['leaf'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.2, 0.8)
    b.location = (x, y, G + 0.03)
    for j in range(3):
        ball(f'rose{k}{j}', M['rose'], x + 0.03 * math.cos(j * 2.1), y + 0.03 * math.sin(j * 2.1), G + 0.07, 0.014, outline=0.001)
for k, (x, y) in enumerate(((0.75, 0.55), (0.45, 0.8), (-0.85, 0.65))):
    tree(f'tree{k}', x, y, r=0.1, h=0.14)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
