# A cartoon Assisi for the country maps, built in the set's shared look (../toon.py): the Basilica
# of St Francis at the end of its hill, the upper and lower churches with their rose window and
# square bell tower, raised on the great arcaded buttresses over the plain, the pink-and-white stone
# town climbing behind to the Rocca castle, and cypresses. Turned a little towards the camera.
# Run: blender -b --factory-startup -P assisi.py -- assisi-1024.png 1024 assisi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#9ab860', shadow_mul=(0.74, 0.8, 0.72), lift=0.2),
    'hill': toon('hill', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'stone': toon('stone', '#ecd8cc', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'stonePink': toon('stonePink', '#e0b8a8', shadow_mul=(0.86, 0.8, 0.8)),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a2e28'),
    'rose': toon('rose', '#c87a6a'),
    'cypress': toon('cypress', '#3f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(2297)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


hl = loft('hill', M['hill'], [segment(-0.1, 1.38, -0.01), segment(0.05, 1.33, 0.22), segment(0.35, 1.2, 0.38), segment(0.65, 0.98, 0.48)], outline=0.012, smooth=True)
hl.visible_shadow = False

# ---------- the town and the Rocca ----------
for k in range(18):
    x = rng.uniform(-0.9, 0.6)
    y = rng.uniform(0.25, 0.85)
    if math.hypot(x, y) > 1.15:
        continue
    z = G + min(0.47, 0.22 + 0.4 * (y - 0.05))
    h = rng.uniform(0.06, 0.09)
    box(f'house{k}', M['stone' if k % 2 else 'stonePink'], x, y, z - 0.01, 0.12, 0.1, h, outline=0.004, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, z + h - 0.01, 0.13, 0.04, outline=0.003)
RX, RY = -0.2, 0.85
box('rocca', M['stonePink'], RX, RY, G + 0.46, 0.3, 0.16, 0.12, outline=0.007, bevel=0)
box('roccakeep', M['stonePink'], RX - 0.08, RY, G + 0.46, 0.1, 0.1, 0.22, outline=0.006, bevel=0)

# ---------- the basilica on its arcades ----------
mark = set(bpy.data.objects)
BX, BY = 0.4, 0.0
box('substructure', M['stone'], BX, BY, G - 0.005, 0.62, 0.3, 0.2, outline=0.01, bevel=0)
for j in range(7):
    box(f'arcade{j}', M['window'], BX - 0.27 + j * 0.09, BY - 0.152, G + 0.03, 0.05, 0.006, 0.12, outline=0, bevel=0)
    lathe(f'arcadetop{j}', M['window'], ((0.025, 0), (0.004, 0.025)), G + 0.15, BX - 0.27 + j * 0.09, BY - 0.152, segs=6, outline=0, smooth=False)
for j in range(5):
    bar(f'buttress{j}', M['stonePink'], (BX - 0.28 + j * 0.14, BY - 0.2, G), (BX - 0.28 + j * 0.14, BY - 0.155, G + 0.2), 0.035, outline=0.003)
U = G + 0.195
box('lowerchurch', M['stone'], BX, BY + 0.04, U - 0.005, 0.5, 0.2, 0.12, outline=0.008, bevel=0)
box('upperchurch', M['stone'], BX + 0.04, BY + 0.04, U + 0.115, 0.4, 0.18, 0.14, outline=0.008, bevel=0)
loft('upperroof', M['roof'], [[(BX - 0.16, BY - 0.05, U + 0.25), (BX + 0.24, BY - 0.05, U + 0.25), (BX + 0.24, BY + 0.13, U + 0.25), (BX - 0.16, BY + 0.13, U + 0.25)],
                              [(BX - 0.16, BY + 0.036, U + 0.31), (BX + 0.24, BY + 0.036, U + 0.31), (BX + 0.24, BY + 0.044, U + 0.31), (BX - 0.16, BY + 0.044, U + 0.31)]], outline=0.005)
box('facade', M['stone'], BX - 0.17, BY + 0.04, U + 0.115, 0.03, 0.2, 0.2, outline=0.005, bevel=0)
cyl('rosewindow', M['rose'], 0.04, 0.006, segs=16, outline=0.002, matrix=Matrix.Translation((BX - 0.186, BY + 0.04, U + 0.23)) @ Matrix.Rotation(-math.pi / 2, 4, 'Y'))
box('belltower', M['stone'], BX + 0.25, BY + 0.12, U - 0.005, 0.08, 0.08, 0.36, outline=0.006, bevel=0)
box('belfry', M['window'], BX + 0.25, BY + 0.079, U + 0.27, 0.03, 0.006, 0.05, outline=0, bevel=0)
pyramid('belltowerroof', M['roof'], BX + 0.25, BY + 0.12, U + 0.355, 0.09, 0.07, outline=0.004)
growmat = Matrix.Translation((BX, BY - 0.1, G)) @ Matrix.Scale(1.5, 4) @ Matrix.Translation((-BX, -(BY - 0.1), -G))
for o in set(bpy.data.objects) - mark:
    o.matrix_world = growmat @ o.matrix_world
bpy.context.view_layer.update()

for k in range(8):
    x = rng.uniform(-1.0, 1.0)
    y = rng.uniform(-0.8, -0.3)
    if math.hypot(x, y) > 1.15:
        continue
    lathe(f'cypress{k}', M['cypress'], ((0.03, 0), (0.04, 0.06), (0.025, 0.16), (0.004, 0.22)), G - 0.005, x, y, segs=8, outline=0.004)

turn(before, -20)
render(G)
