# A cartoon Hollókő for the country maps, built in the set's shared look (../toon.py): the Palóc
# village in the hills of northern Hungary, its whitewashed houses with their gable ends to the
# street, carved wooden porches and steep shingle roofs, the little white church with its
# wooden tower, and the ruined castle on the wooded hill above. Turned a little towards the camera.
# Run: blender -b --factory-startup -P holloko.py -- holloko-1024.png 1024 holloko.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'hill': toon('hill', '#6a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'shingle': toon('shingle', '#8a6448'),
    'wood': toon('wood', '#6a4428'),
    'stone': toon('stone', '#c8bca0', shadow_mul=(0.8, 0.8, 0.86), lift=0.15),
    'road': toon('road', '#c8b894', lift=0.15),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(622865)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the castle on its hill ----------
hill = lathe('hill', M['hill'], ((0.45, 0), (0.36, 0.14), (0.22, 0.26), (0.12, 0.3)), G - 0.01, 0.45, 0.75, segs=24, outline=0.006)
hill.visible_shadow = False
CZ = G + 0.28
box('keep', M['stone'], 0.45, 0.75, CZ, 0.13, 0.13, 0.22, outline=0.005, bevel=0)
lathe('keepcorner', M['stone'], ((0.06, 0), (0.06, 0.18)), CZ, 0.53, 0.7, segs=8, outline=0.003, smooth=False)
box('keepwin', M['dark'], 0.45, 0.683, CZ + 0.12, 0.02, 0.006, 0.04, outline=0, bevel=0)
for k in range(4):
    box(f'merlon{k}', M['stone'], 0.4 + k * 0.035, 0.69, CZ + 0.22, 0.02, 0.02, 0.025, outline=0.001, bevel=0)
box('castlewall', M['stone'], 0.3, 0.72, CZ - 0.04, 0.16, 0.04, 0.09, rot_z=0.3, outline=0.003, bevel=0)
for k, (x, y) in enumerate(((0.1, 0.85), (0.8, 0.55), (0.75, 0.9), (0.05, 0.55))):
    tree(f'hilltree{k}', x, y, r=0.08, h=0.1)

# ---------- the village street ----------
box('street', M['road'], -0.2, -0.15, G - 0.004, 0.18, 1.5, 0.008, rot_z=0.25, outline=0.001, bevel=0)
for k in range(5):
    for s in (-1, 1):
        t = -0.6 + k * 0.28
        x = -0.2 + s * 0.24 + t * math.sin(0.25) * -1
        y = -0.15 + t * math.cos(0.25)
        if k == 4:
            continue
        rot = 0.25
        objs = set(bpy.data.objects)
        e = -s * 0.12
        box(f'house{k}{s}', M['white'], 0, 0, G - 0.005, 0.24, 0.16, 0.11, outline=0.005, bevel=0)
        gable(f'houseroof{k}{s}', M['shingle'], 0, 0, G + 0.105, 0.24, 0.16, 0.12, ridge_x=True, over=0.015)
        for j in (-1, 1):
            box(f'housewin{k}{s}{j}', M['dark'], e - s * 0.003, j * 0.035, G + 0.04, 0.006, 0.025, 0.035, outline=0, bevel=0)
        box(f'housegable{k}{s}', M['wood'], e - s * 0.004, 0, G + 0.125, 0.006, 0.07, 0.045, outline=0, bevel=0)
        bar(f'porch{k}{s}', M['wood'], (-0.1, -0.095, G + 0.1), (0.1, -0.095, G + 0.1), 0.018, outline=0.001)
        for j in range(3):
            rod(f'porchpost{k}{s}{j}', M['wood'], (-0.08 + j * 0.08, -0.1, G), (-0.08 + j * 0.08, -0.1, G + 0.1), 0.006, segs=6, outline=0.001)
        for o in set(bpy.data.objects) - objs:
            o.matrix_world = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z') @ o.matrix_world

# ---------- the little church ----------
CX, CY = -0.55, 0.55
box('church', M['white'], CX, CY, G - 0.005, 0.18, 0.3, 0.14, outline=0.005, bevel=0)
gable('churchroof', M['shingle'], CX, CY, G + 0.135, 0.18, 0.3, 0.1, over=0.012)
box('churchtower', M['white'], CX, CY - 0.18, G - 0.005, 0.11, 0.1, 0.24, outline=0.005, bevel=0)
box('towerwood', M['wood'], CX, CY - 0.18, G + 0.235, 0.12, 0.11, 0.07, outline=0.003, bevel=0)
lathe('spire', M['shingle'], ((0.08, 0), (0.0, 0.18)), G + 0.3, CX, CY - 0.18, segs=4, outline=0.004, smooth=False)
box('churchdoor', M['dark'], CX, CY - 0.232, G - 0.005, 0.035, 0.006, 0.07, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.95, 0.0), (0.85, -0.4), (-0.85, -0.6), (0.95, 0.15))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
