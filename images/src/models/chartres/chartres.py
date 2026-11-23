# A cartoon Chartres Cathedral for the country maps, built in the set's shared look (../toon.py): the
# Gothic cathedral on its hill over the town, its two mismatched spires (the plain Romanesque one and
# the lacy Flamboyant one), the great rose window over the Royal Portal, the flying buttresses and
# green copper roof, the old town's roofs below and the golden wheat fields of the Beauce round it.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P chartres.py -- chartres-1024.png 1024 chartres.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'wheat': toon('wheat', '#e8c860', shadow_mul=(0.86, 0.82, 0.7), lift=0.2),
    'wheatDark': toon('wheatDark', '#d8b040'),
    'hill': toon('hill', '#8ab860', shadow_mul=(0.72, 0.8, 0.74)),
    'stone': toon('stone', '#d8ccb4', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'stoneDark': toon('stoneDark', '#b4a68c', shadow_mul=(0.84, 0.82, 0.86)),
    'copper': toon('copper', '#5aa890', lift=0.12),
    'rose': toon('rose', '#2f5ab0', lift=0.2),
    'window': flat('window', '#2e3a54'),
    'roof': toon('roof', '#c4573a'),
    'house': toon('house', '#ece4d4'),
})

G = tile(M['wheat'])
before = set(bpy.data.objects)
rng = random.Random(2269)

for j in range(8):
    y = -1.0 + j * 0.25
    box(f'furrow{j}', M['wheatDark'], 0.0, y, G - 0.003, 2 * math.sqrt(max(0.0, 1.25 ** 2 - y * y)) - 0.1, 0.02, 0.006, rot_z=0.0, outline=0, bevel=0)
hl = lathe('hill', M['hill'], ((0.85, 0), (0.7, 0.08), (0.55, 0.12)), G - 0.01, 0.0, 0.15, segs=28, outline=0.01)
hl.visible_shadow = False
T = G + 0.11
for k in range(10):
    a = math.radians(200 + k * 14)
    x, y = 0.68 * math.cos(a), 0.15 + 0.6 * math.sin(a)
    h = rng.uniform(0.06, 0.09)
    box(f'house{k}', M['house'], x, y, G + 0.03, 0.12, 0.1, h, rot_z=a + math.pi / 2, outline=0.004, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.03 + h, 0.13, 0.06, outline=0.003)

# ---------- the cathedral: built with its west front facing -x, then turned to face the camera ----------
mark = set(bpy.data.objects)
CX, CY = 0.05, 0.2
box('nave', M['stone'], CX + 0.1, CY, T - 0.005, 0.7, 0.24, 0.3, outline=0.012, bevel=0)
for j in range(6):
    box(f'navewin{j}', M['window'], CX - 0.17 + j * 0.1, CY - 0.122, T + 0.1, 0.04, 0.006, 0.15, outline=0, bevel=0)
    for s in (-1, 1):
        bar(f'buttress{j}{s}', M['stoneDark'], (CX - 0.15 + j * 0.1, CY + s * 0.2, T), (CX - 0.15 + j * 0.1, CY + s * 0.125, T + 0.26), 0.022, outline=0.003)
loft('naveroof', M['copper'], [[(CX - 0.25, CY - 0.125, T + 0.295), (CX + 0.45, CY - 0.125, T + 0.295), (CX + 0.45, CY + 0.125, T + 0.295), (CX - 0.25, CY + 0.125, T + 0.295)],
                               [(CX - 0.25, CY - 0.004, T + 0.42), (CX + 0.45, CY - 0.004, T + 0.42), (CX + 0.45, CY + 0.004, T + 0.42), (CX - 0.25, CY + 0.004, T + 0.42)]], outline=0.008)
lathe('apse', M['stone'], ((0.12, 0), (0.12, 0.3)), T - 0.005, CX + 0.45, CY, segs=12, outline=0.008)
lathe('apseroof', M['copper'], ((0.125, 0), (0.004, 0.12)), T + 0.295, CX + 0.45, CY, segs=12, outline=0.006)
# the west front, facing the camera's left
WX = CX - 0.3
box('westfront', M['stone'], WX, CY, T - 0.005, 0.12, 0.42, 0.36, outline=0.01, bevel=0)
cyl('rosewindow', M['rose'], 0.07, 0.01, segs=20, outline=0.003, matrix=Matrix.Translation((WX - 0.062, CY, T + 0.25)) @ Matrix.Rotation(-math.pi / 2, 4, 'Y'))
box('portal', M['window'], WX - 0.062, CY, T - 0.005, 0.006, 0.12, 0.12, outline=0, bevel=0)
# the plain south spire (Romanesque) and the lacy north spire (Flamboyant)
box('southtower', M['stoneDark'], WX, CY - 0.15, T - 0.005, 0.14, 0.12, 0.5, outline=0.009, bevel=0)
lathe('southspire', M['stoneDark'], ((0.085, 0), (0.004, 0.38)), T + 0.495, WX, CY - 0.15, segs=8, outline=0.007, smooth=False)
box('northtower', M['stone'], WX, CY + 0.15, T - 0.005, 0.14, 0.12, 0.52, outline=0.009, bevel=0)
z = T + 0.515
for t, (r, h) in enumerate(((0.075, 0.08), (0.06, 0.08), (0.045, 0.08))):
    lathe(f'northtier{t}', M['stone'], ((r, 0), (r, h)), z, WX, CY + 0.15, segs=8, outline=0.005, smooth=False)
    for j in range(4):
        a = math.pi / 4 + j * math.pi / 2
        lathe(f'pinnacle{t}{j}', M['stone'], ((0.012, 0), (0.004, 0.06)), z + h - 0.01, WX + r * math.cos(a), CY + 0.15 + r * math.sin(a), segs=5, outline=0.002, smooth=False)
    z += h
lathe('northspire', M['stone'], ((0.04, 0), (0.004, 0.22)), z, WX, CY + 0.15, segs=8, outline=0.005, smooth=False)
turnmat = Matrix.Translation((CX, CY, 0)) @ Matrix.Rotation(math.pi / 2, 4, 'Z') @ Matrix.Translation((-CX, -CY, 0))
for o in set(bpy.data.objects) - mark:
    o.matrix_world = turnmat @ o.matrix_world
bpy.context.view_layer.update()

turn(before, -20)
render(G)
