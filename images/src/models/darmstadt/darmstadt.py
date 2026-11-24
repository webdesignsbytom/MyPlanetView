# A cartoon Mathildenhöhe, Darmstadt, for the country maps, built in the set's shared look
# (../toon.py): the artists' colony on its hill, the Wedding Tower of dark red brick rising to its
# top of five rounded "fingers" like a raised hand, the long band of windows wrapping its corner and
# its sundial, the Russian Chapel's golden onion domes beside it, the exhibition building, and the
# plane-tree grove. Turned a little towards the camera.
# Run: blender -b --factory-startup -P darmstadt.py -- darmstadt-1024.png 1024 darmstadt.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'brick': toon('brick', '#9a3e2e', shadow_mul=(0.86, 0.76, 0.76), lift=0.06),
    'copper': toon('copper', '#4a9a7a', lift=0.12),
    'window': flat('window', '#2e3238'),
    'gold': toon('gold', '#f0c040', shadow_mul=(0.86, 0.76, 0.6), lift=0.3),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'blue': toon('blue', '#3a6ab0', lift=0.12),
    'stone': toon('stone', '#e0d4bc', lift=0.12),
    'tree': toon('tree', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a7a6a'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the Wedding Tower ----------
TX, TY = -0.2, 0.05
TW, TD, TH = 0.18, 0.14, 0.86
box('tower', M['brick'], TX, TY, G - 0.005, TW, TD, TH, outline=0.008, bevel=0)
# the long band of windows wrapping round the corner, near the top
for row in range(2):
    z = G + TH - 0.24 + row * 0.07
    box(f'bandfront{row}', M['window'], TX - 0.02, TY - TD / 2 - 0.003, z, TW - 0.04, 0.006, 0.04, outline=0, bevel=0)
    box(f'bandside{row}', M['window'], TX - TW / 2 - 0.003, TY - 0.02, z, 0.006, TD - 0.04, 0.04, outline=0, bevel=0)
for k in range(6):
    box(f'slitwin{k}', M['window'], TX + 0.04, TY - TD / 2 - 0.003, G + 0.1 + k * 0.08, 0.02, 0.006, 0.04, outline=0, bevel=0)
cyl('sundial', M['blue'], 0.035, 0.006, segs=16, outline=0.001, matrix=Matrix.Translation((TX - 0.04, TY - TD / 2 - 0.004, G + 0.4)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('sundialface', M['gold'], 0.028, 0.004, segs=16, outline=0, matrix=Matrix.Translation((TX - 0.04, TY - TD / 2 - 0.007, G + 0.4)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the five rounded fingers on top
for k in range(5):
    x = TX - TW / 2 + (k + 0.5) * TW / 5
    h = 0.1 if k == 2 else (0.085 if k in (1, 3) else 0.07)
    box(f'finger{k}', M['brick'], x, TY, G + TH - 0.005, TW / 5 - 0.004, TD, h, outline=0.003, bevel=0)
    cyl(f'fingertip{k}', M['copper'], TW / 10 - 0.002, TD + 0.006, segs=12, outline=0.002, matrix=Matrix.Translation((x, TY, G + TH - 0.005 + h)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the Russian Chapel with its golden domes ----------
CX, CY = 0.4, 0.2
box('chapel', M['white'], CX, CY, G - 0.005, 0.24, 0.26, 0.2, outline=0.006, bevel=0)
box('chapeldoor', M['blue'], CX, CY - 0.133, G - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
for k, (dx, dy, r, z) in enumerate(((0, 0, 0.065, 0.32), (-0.08, -0.08, 0.04, 0.24), (0.08, -0.08, 0.04, 0.24), (-0.08, 0.08, 0.04, 0.24), (0.08, 0.08, 0.04, 0.24))):
    x, y = CX + dx, CY + dy
    drum_h = z - 0.2
    lathe(f'drum{k}', M['white'], ((r * 0.7, 0), (r * 0.7, drum_h)), G + 0.195, x, y, segs=12, outline=0.003)
    lathe(f'onion{k}', M['gold'], ((r * 0.7, 0), (r, r * 0.5), (r * 0.8, r * 1.0), (r * 0.25, r * 1.4), (0.003, r * 1.8)), G + 0.195 + drum_h, x, y, segs=16, outline=0.004)
    rod(f'cross{k}', M['gold'], (x, y, G + 0.195 + drum_h + r * 1.8), (x, y, G + 0.195 + drum_h + r * 1.8 + 0.04), 0.003, segs=4, outline=0)

# ---------- the exhibition building and the plane-tree grove ----------
box('exhibition', M['stone'], -0.05, 0.62, G - 0.005, 0.8, 0.26, 0.16, outline=0.006, bevel=0)
for j in range(8):
    box(f'exhibitionwin{j}', M['window'], -0.4 + j * 0.1, 0.62 - 0.133, G + 0.05, 0.05, 0.006, 0.08, outline=0, bevel=0)
for i in range(3):
    for j in range(4):
        x, y = -0.6 + j * 0.25, -0.35 - i * 0.22
        if math.hypot(x, y) > 1.1:
            continue
        rod(f'planetrunk{i}{j}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.012, segs=6, outline=0.002)
        t = ball(f'plane{i}{j}', M['tree'], 0, 0, 0, 0.09, outline=0.01)
        t.scale = (1.1, 1.1, 0.8)
        t.location = (x, y, G + 0.16)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
