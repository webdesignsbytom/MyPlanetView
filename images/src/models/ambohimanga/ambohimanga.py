# A cartoon Royal Hill of Ambohimanga for the country maps, built in the set's shared look
# (../toon.py): the sacred hilltop city of the Merina kings above Antananarivo, Madagascar: the
# king's house of dark rosewood with its tall steep roof and crossed horns at the ridge, the
# airy two-storey palace of Queen Ranavalona beside it, the stone walls with their great
# gateway closed by a huge stone disc, and the old fig trees on the green hill. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P ambohimanga.py -- ambohimanga-1024.png 1024 ambohimanga.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'hill': toon('hill', '#7aac50', shadow_mul=(0.7, 0.78, 0.8)),
    'wood': toon('wood', '#4a3022'),
    'woodLight': toon('woodLight', '#7a5236'),
    'white': toon('white', '#f2eee4', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'roof': toon('roof', '#5a4434'),
    'stone': toon('stone', '#b8ac98', shadow_mul=(0.8, 0.8, 0.86), lift=0.14),
    'dark': flat('dark', '#2e2420'),
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


hill = lathe('hill', M['hill'], ((1.25, 0), (1.0, 0.08), (0.75, 0.13)), G - 0.01, 0.0, 0.05, segs=40, outline=0.005)
hill.visible_shadow = False
HZ = G + 0.12

# ---------- the stone wall and the gateway's stone disc ----------
for k in range(26):
    a0, a1 = 2 * math.pi * k / 26, 2 * math.pi * (k + 1) / 26
    if 4.4 < (a0 + a1) / 2 < 5.0:
        continue
    p0 = (0.7 * math.cos(a0), 0.7 * math.sin(a0) + 0.05)
    p1 = (0.7 * math.cos(a1), 0.7 * math.sin(a1) + 0.05)
    bar(f'wall{k}', M['stone'], (p0[0], p0[1], HZ + 0.03), (p1[0], p1[1], HZ + 0.03), 0.05, outline=0.002)
a = 4.7
gx, gy = 0.7 * math.cos(a), 0.7 * math.sin(a) + 0.05
for s in (-1, 1):
    box(f'gatepier{s}', M['stone'], gx + s * 0.08, gy, HZ - 0.005, 0.06, 0.1, 0.16, outline=0.004, bevel=0)
box('gatelintel', M['stone'], gx, gy, HZ + 0.155, 0.22, 0.1, 0.04, outline=0.003, bevel=0)
cyl('gatedisc', M['stone'], 0.075, 0.04, segs=20, outline=0.003, matrix=Matrix.Translation((gx - 0.05, gy - 0.06, HZ + 0.07)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the king's house ----------
KX, KY = -0.22, 0.15
box('kinghouse', M['wood'], KX, KY, HZ - 0.005, 0.22, 0.18, 0.14, outline=0.005, bevel=0)
gable('kingroof', M['roof'], KX, KY, HZ + 0.135, 0.22, 0.18, 0.3, ridge_x=True, over=0.015)
for s in (-1, 1):
    bar(f'horn{s}', M['woodLight'], (KX + s * 0.11, KY, HZ + 0.42), (KX + s * 0.18, KY, HZ + 0.52), 0.016, outline=0.002)
rod('kingpost', M['woodLight'], (KX, KY, HZ - 0.005), (KX, KY, HZ + 0.44), 0.008, segs=6, outline=0)
box('kingdoor', M['dark'], KX, KY - 0.093, HZ - 0.005, 0.04, 0.006, 0.09, outline=0, bevel=0)

# ---------- the queen's palace ----------
QX, QY = 0.25, 0.25
box('palace', M['white'], QX, QY, HZ - 0.005, 0.3, 0.2, 0.22, outline=0.005, bevel=0)
hip('palaceroof', M['roof'], QX, QY, HZ + 0.215, 0.3, 0.2, 0.09, over=0.02)
box('veranda', M['woodLight'], QX, QY - 0.13, HZ + 0.1, 0.32, 0.06, 0.012, outline=0.002, bevel=0)
for j in range(5):
    rod(f'verandapost{j}', M['woodLight'], (QX - 0.14 + j * 0.07, QY - 0.155, HZ), (QX - 0.14 + j * 0.07, QY - 0.155, HZ + 0.2), 0.006, segs=6, outline=0.001)
    box(f'palacewin{j}', M['dark'], QX - 0.12 + j * 0.06, QY - 0.103, HZ + 0.13, 0.025, 0.006, 0.05, outline=0, bevel=0)

# ---------- the royal fig trees ----------
for k, (x, y) in enumerate(((-0.45, -0.25), (0.2, -0.3), (0.5, 0.5), (-0.5, 0.45))):
    rod(f'figtrunk{k}', M['trunk'], (x, y, HZ), (x, y, HZ + 0.12), 0.02, segs=8, outline=0.002)
    b = ball(f'fig{k}', M['tree'], 0, 0, 0, 0.12, outline=0.008)
    b.scale = (1.3, 1.3, 0.8)
    b.location = (x, y, HZ + 0.2)
for k, (x, y) in enumerate(((-1.05, -0.4), (1.0, -0.5), (1.05, 0.45), (-1.0, 0.5))):
    tree(f'tree{k}', x, y, r=0.08, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
