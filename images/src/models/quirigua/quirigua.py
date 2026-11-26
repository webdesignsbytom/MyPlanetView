# A cartoon Quiriguá for the country maps, built in the set's shared look (../toon.py): the Maya city
# in the Motagua valley of Guatemala, its great carved stelae, the tallest the Maya ever raised,
# standing on the lawn of the Great Plaza, each under its little thatched shelter, a carved
# zoomorph boulder, the acropolis's stepped walls behind, and the rainforest round them.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P quirigua.py -- quirigua-1024.png 1024 quirigua.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc458', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#c4a882', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'carve': toon('carve', '#9a8060'),
    'thatch': toon('thatch', '#c8a458', shadow_mul=(0.8, 0.76, 0.76), lift=0.15),
    'wood': toon('wood', '#6a4a30'),
    'tree': toon('tree', '#2e7a38', shadow_mul=(0.7, 0.78, 0.8)),
    'treeLight': toon('treeLight', '#4e9a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(318422)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the stelae under their shelters ----------
STELAE = ((-0.35, -0.15, 0.62), (0.05, -0.3, 0.5), (0.35, 0.05, 0.44), (-0.1, 0.25, 0.4))
for k, (x, y, h) in enumerate(STELAE):
    box(f'stela{k}', M['stone'], x, y, G - 0.005, 0.11, 0.07, h, outline=0.005, bevel=0)
    for j in range(int(h / 0.07)):
        box(f'glyph{k}{j}', M['carve'], x - 0.025 + 0.05 * (j % 2), y - 0.036, G + 0.04 + j * 0.06, 0.035, 0.004, 0.04, outline=0, bevel=0)
    box(f'face{k}', M['carve'], x, y - 0.036, G + h - 0.18, 0.06, 0.004, 0.08, outline=0, bevel=0)
    for i in (-1, 1):
        for jj in (-1, 1):
            rod(f'post{k}{i}{jj}', M['wood'], (x + i * 0.11, y + jj * 0.09, G), (x + i * 0.11, y + jj * 0.09, G + h + 0.06), 0.007, segs=6, outline=0.001)
    hip(f'shelter{k}', M['thatch'], x, y, G + h + 0.06, 0.26, 0.22, 0.1, outline=0.004)
# the zoomorph boulder
b = ball('zoomorph', M['stone'], 0, 0, 0, 0.11, outline=0.006)
b.scale = (1.3, 1.0, 0.7)
b.location = (0.5, -0.45, G + 0.05)
for k in range(5):
    box(f'zoocarve{k}', M['carve'], 0.42 + k * 0.04, -0.555, G + 0.03 + 0.02 * (k % 2), 0.025, 0.006, 0.04, outline=0, bevel=0)

# ---------- the acropolis behind ----------
for k, (w, h) in enumerate(((0.9, 0.08), (0.7, 0.08), (0.5, 0.06))):
    box(f'acropolis{k}', M['stone'], 0.1, 0.75, G - 0.005 + k * 0.08, w, 0.3 - 0.05 * k, h, outline=0.004, bevel=0)

# ---------- the rainforest ----------
for k in range(14):
    a = 2 * math.pi * k / 14 + 0.2
    r = 1.08 + 0.1 * (k % 2)
    x, y = r * math.cos(a), r * math.sin(a)
    if y < -0.7 and abs(x) < 0.6:
        continue
    tree(f'tree{k}', x, y, r=0.1 + 0.03 * rng.random(), h=0.14 + 0.08 * rng.random(), mat='tree' if k % 2 else 'treeLight')

bpy.context.view_layer.update()
turn(before, -20)
render(G)
