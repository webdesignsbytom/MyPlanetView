# A cartoon Champaner-Pavagadh for the country maps, built in the set's shared look (../toon.py): the
# fifteenth-century capital of Sultan Mahmud Begada in Gujarat, India, its Jama Masjid of
# yellow sandstone with the two tall slender minarets flanking the great central arch, the
# carved balconies, the domes over the prayer hall behind, and the hill of Pavagadh rising
# beyond. Turned a little towards the camera.
# Run: blender -b --factory-startup -P champaner.py -- champaner-1024.png 1024 champaner.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#9ac060', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'hill': toon('hill', '#6a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#dcb880', shadow_mul=(0.8, 0.76, 0.8), lift=0.16),
    'stoneLight': toon('stoneLight', '#ecd2a0', lift=0.18),
    'path': toon('path2', '#e2d4b4', lift=0.18),
    'dark': flat('dark', '#2e2420'),
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


hl = lathe('pavagadh', M['hill'], ((0.5, 0), (0.36, 0.25), (0.16, 0.5), (0.06, 0.56)), G - 0.01, 0.55, 0.85, segs=24, outline=0.006)
hl.visible_shadow = False
lathe('hilltemple', M['stoneLight'], ((0.04, 0), (0.04, 0.04), (0.0, 0.08)), G + 0.54, 0.55, 0.85, segs=8, outline=0.002, smooth=False)

# ---------- the Jama Masjid ----------
JX, JY = -0.1, 0.1
box('court', M['path'], JX, JY - 0.35, G - 0.004, 0.8, 0.4, 0.008, outline=0.001, bevel=0)
box('prayerhall', M['stone'], JX, JY + 0.12, G - 0.005, 0.8, 0.32, 0.18, outline=0.007, bevel=0)
for k in range(5):
    x = JX - 0.32 + k * 0.16
    lathe(f'dome{k}', M['stoneLight'], [(0.06 * math.cos(a), 0.05 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], G + 0.175, x, JY + 0.15, segs=16, outline=0.003)
lathe('maindome', M['stoneLight'], [(0.1 * math.cos(a), 0.09 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], G + 0.175, JX, JY + 0.12, segs=20, outline=0.004)
box('front', M['stone'], JX, JY - 0.06, G - 0.005, 0.8, 0.04, 0.2, outline=0.006, bevel=0)
for k in range(11):
    x = JX - 0.35 + k * 0.07
    if abs(x - JX) < 0.12:
        continue
    arch(f'arcade{k}', M['dark'], x, JY - 0.083, G - 0.005, 0.045, 0.13)
box('centralframe', M['stoneLight'], JX, JY - 0.07, G - 0.005, 0.24, 0.06, 0.3, outline=0.005, bevel=0)
arch('centralarch', M['dark'], JX, JY - 0.103, G - 0.005, 0.12, 0.24)
for s in (-1, 1):
    MX = JX + s * 0.1
    lathe(f'minaret{s}', M['stoneLight'], ((0.035, 0), (0.035, 0.3), (0.05, 0.31), (0.05, 0.33), (0.03, 0.34), (0.028, 0.52), (0.04, 0.53), (0.04, 0.55), (0.022, 0.56), (0.02, 0.66), (0.0, 0.7)), G - 0.005, MX, JY - 0.1, segs=8, outline=0.004, smooth=False)
for s in (-1, 1):
    box(f'balcony{s}', M['stoneLight'], JX + s * 0.25, JY - 0.095, G + 0.1, 0.1, 0.035, 0.06, outline=0.002, bevel=0)

for k, (x, y) in enumerate(((-0.9, 0.35), (-0.85, -0.45), (0.85, -0.35), (0.45, -0.75), (-0.4, -0.85), (0.0, 0.75))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
