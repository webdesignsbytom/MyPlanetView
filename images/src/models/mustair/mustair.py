# A cartoon Convent of St John at Müstair for the country maps, built in the set's shared look
# (../toon.py): the Benedictine convent founded by Charlemagne in the Val Müstair, Switzerland,
# whose church keeps the largest cycle of Carolingian wall paintings: the white church with its
# three tall round apses at the east end, the square Romanesque Planta tower, the convent's
# white buildings round the courtyard, and the mountains of the valley behind. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P mustair.py -- mustair-1024.png 1024 mustair.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'mountain': toon('mountain', '#8a9a7a', shadow_mul=(0.75, 0.78, 0.82)),
    'snow': toon('snow', '#f4f4f0', lift=0.3),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'roof': toon('roof', '#6a6a70'),
    'stone': toon('stone', '#c8bca4', lift=0.15),
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


for k, (x, y, r, h) in enumerate(((-0.65, 0.95, 0.45, 0.55), (0.35, 1.0, 0.4, 0.62))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.25, h * 0.85), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    mt.visible_shadow = False
    lathe(f'snowcap{k}', M['snow'], ((r * 0.25 + 0.004, 0), (0.0, h * 0.15 + 0.004)), G - 0.01 + h * 0.85, x, y, segs=20, outline=0.003)

# ---------- the church with its three apses ----------
CX, CY = -0.15, 0.15
box('church', M['white'], CX, CY, G - 0.005, 0.42, 0.3, 0.24, outline=0.006, bevel=0)
gable('churchroof', M['roof'], CX, CY, G + 0.235, 0.42, 0.3, 0.12, ridge_x=True, over=0.012)
for j, dx in enumerate((-0.12, 0.0, 0.12)):
    lathe(f'apse{j}', M['white'], ((0.055, 0), (0.055, 0.2 if j == 1 else 0.17)), G - 0.005, CX + 0.21, CY + dx, segs=16, outline=0.004)
    lathe(f'apseroof{j}', M['roof'], ((0.06, 0), (0.0, 0.06)), G - 0.005 + (0.2 if j == 1 else 0.17), CX + 0.21, CY + dx, segs=16, outline=0.003)
    arch(f'apsewin{j}', M['dark'], CX + 0.267, CY + dx, G + 0.08, 0.02, 0.06, face='x')
for j in range(3):
    arch(f'churchwin{j}', M['dark'], CX - 0.12 + j * 0.12, CY - 0.153, G + 0.1, 0.03, 0.08)
arch('churchdoor', M['dark'], CX - 0.15, CY - 0.153, G - 0.005, 0.045, 0.09)

# ---------- the Planta tower ----------
TX, TY = CX - 0.35, CY + 0.2
box('planta', M['stone'], TX, TY, G - 0.005, 0.16, 0.16, 0.48, outline=0.006, bevel=0)
for z in (0.25, 0.37):
    box(f'plantawin{z}', M['dark'], TX, TY - 0.083, G + z, 0.025, 0.006, 0.05, outline=0, bevel=0)
hip('plantaroof', M['roof'], TX, TY, G + 0.475, 0.16, 0.16, 0.12, over=0.01)

# ---------- the convent round the courtyard ----------
for k, (x, y, sx, sy, rx) in enumerate(((CX - 0.1, CY - 0.5, 0.5, 0.18, True), (CX - 0.42, CY - 0.25, 0.18, 0.4, False))):
    box(f'convent{k}', M['white'], x, y, G - 0.005, sx, sy, 0.18, outline=0.005, bevel=0)
    gable(f'conventroof{k}', M['roof'], x, y, G + 0.175, sx, sy, 0.09, ridge_x=rx, over=0.012)
for j in range(5):
    box(f'conventwin{j}', M['dark'], CX - 0.3 + j * 0.1, CY - 0.593, G + 0.06, 0.025, 0.006, 0.04, outline=0, bevel=0)
    box(f'conventwinup{j}', M['dark'], CX - 0.3 + j * 0.1, CY - 0.593, G + 0.12, 0.025, 0.006, 0.035, outline=0, bevel=0)

for k, (x, y) in enumerate(((0.65, -0.3), (0.85, 0.1), (0.5, -0.7), (-0.95, -0.2))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
