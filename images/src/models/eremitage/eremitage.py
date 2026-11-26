# A cartoon Eremitage for the country maps, built in the set's shared look (../toon.py): the
# royal hunting lodge in the Par Force Hunting Landscape north of Copenhagen, Denmark: the
# baroque lodge of pale stone standing alone on its hilltop in the open deer park of
# Jægersborg Dyrehave, its copper roof and the crowned royal monogram over the door, the red
# deer grazing on the open grass, and the old oak woods round the clearing. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P eremitage.py -- eremitage-1024.png 1024 eremitage.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a0c264', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#94b85a', shadow_mul=(0.72, 0.78, 0.8)),
    'stone': toon('stone', '#ece0c4', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#c8b898'),
    'copper': toon('copper', '#6aa890', lift=0.2),
    'gold': toon('gold2', '#e8b848', shadow_mul=(0.78, 0.66, 0.6), lift=0.35),
    'deer': toon('deer', '#a8683a'),
    'antler': toon('antler', '#e8dcc0'),
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


hill = lathe('hill', M['hill'], [(0.75 * math.cos(a), 0.12 * math.sin(a)) for a in [k * math.pi / 16 for k in range(9)]], G - 0.01, 0.0, 0.1, segs=36, outline=0.005)
hill.visible_shadow = False
HZ = G + 0.11

# ---------- the lodge ----------
LX, LY = 0.0, 0.1
box('lodge', M['stone'], LX, LY, HZ - 0.01, 0.4, 0.4, 0.22, outline=0.007, bevel=0)
for (ex, ey) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
    box(f'quoin{ex}{ey}', M['stoneDark'], LX + ex * 0.19, LY + ey * 0.19, HZ - 0.01, 0.03, 0.03, 0.22, outline=0.001, bevel=0)
hip('lodgeroof', M['copper'], LX, LY, HZ + 0.205, 0.42, 0.42, 0.14, over=0.01)
box('centre', M['stoneDark'], LX, LY - 0.205, HZ - 0.01, 0.14, 0.02, 0.24, outline=0.003, bevel=0)
gable('pediment', M['stone'], LX, LY - 0.205, HZ + 0.23, 0.16, 0.03, 0.06)
arch('door', M['dark'], LX, LY - 0.218, HZ - 0.01, 0.05, 0.1)
lathe('monogram', M['gold'], ((0.025, 0), (0.028, 0.02), (0.015, 0.04), (0.0, 0.045)), HZ + 0.12, LX, LY - 0.22, segs=10, outline=0.001)
for s in (-1, 1):
    for j in range(2):
        x = LX + s * (0.08 + j * 0.06)
        box(f'win{s}{j}', M['dark'], x, LY - 0.203, HZ + 0.03, 0.03, 0.006, 0.06, outline=0, bevel=0)
        box(f'winup{s}{j}', M['dark'], x, LY - 0.203, HZ + 0.13, 0.03, 0.006, 0.05, outline=0, bevel=0)

# ---------- the deer ----------
for k, (x, y, a) in enumerate(((-0.45, -0.55, 0.3), (-0.25, -0.65, -0.4), (0.4, -0.5, 2.6), (0.55, -0.2, 3.4))):
    objs = set(bpy.data.objects)
    b = ball(f'deer{k}', M['deer'], 0, 0, 0, 0.04, outline=0.003)
    b.scale = (1.5, 0.7, 0.8)
    b.location = (0, 0, 0.07)
    for (dx, dy) in ((-0.035, -0.015), (-0.035, 0.015), (0.035, -0.015), (0.035, 0.015)):
        rod(f'deerleg{k}{dx}{dy}', M['deer'], (dx, dy, 0), (dx, dy, 0.06), 0.006, segs=6, outline=0)
    rod(f'deerneck{k}', M['deer'], (0.05, 0, 0.08), (0.07, 0, 0.12), 0.012, segs=6, outline=0.001)
    ball(f'deerhead{k}', M['deer'], 0.08, 0, 0.125, 0.018, outline=0.001)
    for s in (-1, 1):
        bar(f'antler{k}{s}', M['antler'], (0.075, s * 0.008, 0.14), (0.065, s * 0.035, 0.18), 0.005, outline=0)
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = Matrix.Translation((x, y, G)) @ Matrix.Rotation(a, 4, 'Z') @ o.matrix_world

# ---------- the oak woods ----------
for k in range(14):
    a = 2 * math.pi * k / 14 + 0.1
    x, y = 1.12 * math.cos(a), 1.04 * math.sin(a)
    if y < -0.5 and abs(x) < 0.7:
        continue
    tree(f'oak{k}', x, y, r=0.12, h=0.12)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
