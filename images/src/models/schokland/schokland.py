# A cartoon Schokland for the country maps, built in the set's shared look (../toon.py): the old
# island in the Zuiderzee, abandoned in 1859 and left high and dry when the Noordoostpolder was
# drained round it: the long low ridge of the former island, the little white church on its
# mound at Middelbuurt, the wooden piles of the old harbour wall, and the flat green polder
# with its straight ditches all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P schokland.py -- schokland-1024.png 1024 schokland.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#94c45e', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'ridge': toon('ridge', '#7aac50', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'roof': toon('roof', '#4a5058'),
    'wood': toon('wood', '#6a4a30'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'brick': toon('brick', '#b8664a'),
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


# ---------- the polder's straight ditches ----------
for k in range(5):
    x = -1.0 + k * 0.5
    L = 2 * math.sqrt(max(0.0, 1.32 ** 2 - x ** 2))
    box(f'ditch{k}', M['water'], x, 0.0, G - 0.003, 0.03, L * 0.92, 0.008, outline=0, bevel=0)

# ---------- the old island's ridge ----------
RZ = G + 0.07
ridge = loft('ridge', M['ridge'], [[(-0.95, -0.35, G - 0.01), (0.9, -0.5, G - 0.01), (1.0, -0.2, G - 0.01), (-0.85, 0.05, G - 0.01)],
                                  [(-0.9, -0.3, RZ), (0.85, -0.44, RZ), (0.93, -0.24, RZ), (-0.82, 0.0, RZ)]], outline=0.005)
ridge.visible_shadow = False
mound = lathe('mound', M['ridge'], ((0.24, 0), (0.18, 0.06), (0.12, 0.08)), RZ - 0.005, 0.0, -0.22, segs=24, outline=0.004)
mound.visible_shadow = False
MZ = RZ + 0.075

# ---------- the church on its mound ----------
CX, CY = 0.0, -0.22
box('church', M['white'], CX, CY, MZ - 0.005, 0.24, 0.13, 0.12, outline=0.005, bevel=0)
gable('churchroof', M['roof'], CX, CY, MZ + 0.115, 0.24, 0.13, 0.09, ridge_x=True, over=0.012)
box('turret', M['white'], CX - 0.08, CY, MZ + 0.18, 0.045, 0.045, 0.06, outline=0.003, bevel=0)
lathe('turretcap', M['roof'], ((0.035, 0), (0.0, 0.08)), MZ + 0.24, CX - 0.08, CY, segs=8, outline=0.002, smooth=False)
for j in range(3):
    arch(f'churchwin{j}', M['dark'], CX - 0.07 + j * 0.07, CY - 0.068, MZ + 0.03, 0.03, 0.06)
# a few old houses and the lighthouse post
for k, (x, y) in enumerate(((-0.55, -0.15), (0.45, -0.32))):
    box(f'house{k}', M['brick'], x, y, RZ - 0.005, 0.14, 0.1, 0.08, outline=0.004, bevel=0)
    gable(f'houseroof{k}', M['roof'], x, y, RZ + 0.075, 0.14, 0.1, 0.07, ridge_x=True, over=0.01)
lathe('lightpost', M['white'], ((0.025, 0), (0.02, 0.2), (0.03, 0.21), (0.03, 0.24), (0.0, 0.27)), RZ - 0.005, 0.8, -0.38, segs=8, outline=0.003, smooth=False)

# ---------- the old harbour wall's piles ----------
for k in range(18):
    t = k / 17
    x, y = -0.9 + 1.8 * t, -0.38 - 0.15 * t
    if -0.1 < x < 0.1:
        continue
    rod(f'pile{k}', M['wood'], (x, y - 0.06, G - 0.005), (x, y - 0.06, G + 0.09), 0.014, segs=6, outline=0.002)

for k, (x, y) in enumerate(((-0.6, 0.55), (0.3, 0.6), (0.8, 0.35), (-0.95, 0.3))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
