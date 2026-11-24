# A cartoon Corvey for the country maps, built in the set's shared look (../toon.py): the
# Carolingian abbey on the Weser in Westphalia, Germany, its westwork of 885, a massive
# three-storey front of rough stone between two tall square towers with pointed spires, the
# Gothic church behind it, and beside it the long white baroque abbey, now a palace, round its
# courtyard. Turned a little towards the camera.
# Run: blender -b --factory-startup -P corvey.py -- corvey-1024.png 1024 corvey.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#d0bc9a', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'white': toon('white', '#f2eee4', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'trim': toon('trim', '#c8a880'),
    'roof': toon('roof', '#4a4a52'),
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


# ---------- the westwork and the church ----------
WX, WY = -0.3, -0.1
box('westwork', M['stone'], WX, WY, G - 0.005, 0.34, 0.2, 0.36, outline=0.007, bevel=0)
gable('westworkroof', M['roof'], WX, WY, G + 0.355, 0.34, 0.2, 0.1, ridge_x=True, over=0.01)
for j in range(3):
    arch(f'westarch{j}', M['dark'], WX - 0.08 + j * 0.08, WY - 0.103, G - 0.005, 0.05, 0.1)
    arch(f'westwin{j}', M['dark'], WX - 0.08 + j * 0.08, WY - 0.103, G + 0.2, 0.03, 0.07)
for s in (-1, 1):
    TX = WX + s * 0.14
    box(f'tower{s}', M['stone'], TX, WY - 0.02, G - 0.005, 0.1, 0.1, 0.56, outline=0.006, bevel=0)
    for z in (0.3, 0.42):
        arch(f'towerwin{s}{z}', M['dark'], TX, WY - 0.073, G + z, 0.025, 0.06)
    hip(f'spire{s}', M['roof'], TX, WY - 0.02, G + 0.555, 0.1, 0.1, 0.2, over=0.005)
box('church', M['stone'], WX, WY + 0.38, G - 0.005, 0.26, 0.56, 0.26, outline=0.006, bevel=0)
gable('churchroof', M['roof'], WX, WY + 0.38, G + 0.255, 0.26, 0.56, 0.14, over=0.012)
for j in range(3):
    arch(f'churchwin{j}', M['dark'], WX + 0.133, WY + 0.2 + j * 0.15, G + 0.08, 0.04, 0.13, face='x')

# ---------- the baroque abbey ----------
AX, AY = 0.4, 0.2
for k, (x, y, sx, sy, rx) in enumerate(((AX, AY - 0.3, 0.5, 0.16, True), (AX + 0.17, AY + 0.05, 0.16, 0.56, False), (AX, AY + 0.4, 0.5, 0.16, True))):
    box(f'abbey{k}', M['white'], x, y, G - 0.005, sx, sy, 0.2, outline=0.005, bevel=0)
    hip(f'abbeyroof{k}', M['roof'], x, y, G + 0.195, sx, sy, 0.08, over=0.012)
for j in range(6):
    x = AX - 0.2 + j * 0.08
    box(f'abbeywin{j}', M['trim'], x, AY - 0.383, G + 0.04, 0.035, 0.006, 0.05, outline=0, bevel=0)
    box(f'abbeywinup{j}', M['trim'], x, AY - 0.383, G + 0.12, 0.035, 0.006, 0.05, outline=0, bevel=0)
box('abbeydoor', M['dark'], AX, AY - 0.383, G - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)

box('path', M['path'], WX, WY - 0.45, G - 0.004, 0.12, 0.5, 0.008, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.35), (-0.8, 0.4), (-0.45, 0.85), (0.95, -0.2), (0.6, -0.7), (0.15, -0.75))):
    tree(f'tree{k}', x, y, r=0.1, h=0.14)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
