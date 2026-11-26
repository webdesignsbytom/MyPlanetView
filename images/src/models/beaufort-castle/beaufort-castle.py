# A cartoon Beaufort Castle for the country maps, built in the set's shared look (../toon.py): the
# Crusader castle of Belfort in south Lebanon, on its sheer cliff three hundred metres above the
# gorge of the Litani: the ruined keep and curtain walls of pale limestone along the cliff
# edge, the rock-cut moat, the arches of the halls, the river far below, and the hills of
# Mount Amel round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P beaufort-castle.py -- beaufort-castle-1024.png 1024 beaufort-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a8b86a', shadow_mul=(0.74, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#c8b490', shadow_mul=(0.8, 0.78, 0.82), lift=0.14),
    'stone': toon('stone', '#e0d0ac', shadow_mul=(0.8, 0.78, 0.84), lift=0.18),
    'stoneDark': toon('stoneDark', '#b8a47e'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#5a8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(476801)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)

def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the gorge and the river on the right ----------
loft('river', M['water'], [[(0.75, -1.05, G - 0.004), (1.05, -0.85, G - 0.004), (1.05, 0.85, G - 0.004), (0.75, 1.05, G - 0.004)],
                           [(0.75, -1.05, G + 0.008), (1.05, -0.85, G + 0.008), (1.05, 0.85, G + 0.008), (0.75, 1.05, G + 0.008)]], outline=0.002)

# ---------- the cliff ----------
CZ = G + 0.42
cliff = loft('cliff', M['rock'], [[(-0.9, -0.6, G - 0.01), (0.65, -0.7, G - 0.01), (0.7, 0.75, G - 0.01), (-0.85, 0.7, G - 0.01)],
                                  [(-0.75, -0.48, CZ - 0.12), (0.62, -0.55, CZ), (0.66, 0.6, CZ), (-0.7, 0.58, CZ - 0.1)]], outline=0.008)
cliff.visible_shadow = False
for k in range(5):
    y = -0.5 + k * 0.25
    bar(f'crack{k}', M['stoneDark'], (0.645, y, G + 0.05), (0.64, y + 0.06, CZ - 0.05), 0.014, outline=0)

# ---------- the castle along the cliff edge ----------
def zt(x):
    return CZ - 0.12 + 0.12 * (x + 0.75) / 1.37


for k in range(6):
    y0, y1 = -0.45 + k * 0.17, -0.45 + (k + 1) * 0.17
    h = 0.12 + 0.06 * rng.random()
    box(f'curtain{k}', M['stone'], 0.56, (y0 + y1) / 2, CZ - 0.01, 0.06, 0.17, h, outline=0.004, bevel=0)
    for j in range(2):
        arch(f'curtainwin{k}{j}', M['dark'], 0.593, y0 + 0.05 + j * 0.07, CZ + 0.04, 0.025, 0.05, face='x')
KX, KY = 0.35, 0.1
box('keep', M['stone'], KX, KY, zt(KX) - 0.01, 0.2, 0.2, 0.3, outline=0.006, bevel=0)
box('keepbroken', M['stone'], KX + 0.05, KY + 0.05, zt(KX) + 0.29, 0.1, 0.1, 0.06, outline=0.003, bevel=0)
arch('keepwin', M['dark'], KX + 0.103, KY, zt(KX) + 0.15, 0.04, 0.08, face='x')
arch('keepwinf', M['dark'], KX, KY - 0.103, zt(KX) + 0.15, 0.04, 0.08)
for k in range(3):
    x = 0.1 - k * 0.18
    box(f'hall{k}', M['stoneDark'], x, -0.25, zt(x) - 0.01, 0.16, 0.14, 0.1 + 0.04 * (k % 2), outline=0.004, bevel=0)
    arch(f'hallarch{k}', M['dark'], x, -0.323, zt(x) - 0.01, 0.07, 0.09)
# the rock-cut moat on the landward side
box('moat', M['stoneDark'], -0.3, 0.1, zt(-0.3) - 0.03, 0.06, 0.8, 0.03, outline=0.002, bevel=0)

for k, (x, y) in enumerate(((-1.05, -0.4), (-1.05, 0.3), (-0.55, 0.9), (0.2, 0.95), (-0.3, -0.85), (0.3, -0.9))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
