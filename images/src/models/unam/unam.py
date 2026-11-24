# A cartoon UNAM Ciudad Universitaria for the country maps, built in the set's shared look (../toon.py):
# the Central Library of Mexico's national university, its tall windowless block covered on every
# side in Juan O'Gorman's stone mosaic of Mexico's history in earthy reds, ochres, blues and greens,
# standing on its low glass ground floor, the long green esplanade in front, and behind it the slab
# of the Rectory tower with its bright relief mural by Siqueiros. Turned a little towards the camera.
# Run: blender -b --factory-startup -P unam.py -- unam-1024.png 1024 unam.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#ddd2bc', lift=0.15),
    'glass': toon('glass', '#4a6a80', lift=0.3),
    'concrete': toon('concrete', '#c8c4bc', lift=0.15),
    'm0': toon('m0', '#b8503e', lift=0.12),
    'm1': toon('m1', '#e0b050', lift=0.12),
    'm2': toon('m2', '#4a7ab0', lift=0.12),
    'm3': toon('m3', '#6a9a5a', lift=0.12),
    'm4': toon('m4', '#e8dcc0', lift=0.15),
    'm5': toon('m5', '#8a5a3e', lift=0.12),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1956)

# ---------- the esplanade ----------
loft('esplanade', M['lawn'], [[(-0.9, -0.85, G - 0.004), (0.55, -0.85, G - 0.004), (0.55, -0.25, G - 0.004), (-0.9, -0.25, G - 0.004)],
                              [(-0.9, -0.85, G + 0.006), (0.55, -0.85, G + 0.006), (0.55, -0.25, G + 0.006), (-0.9, -0.25, G + 0.006)]], outline=0.002)

# ---------- the Central Library ----------
LX, LY = 0.25, 0.1
W, D = 0.36, 0.36
box('base', M['glass'], LX, LY, G - 0.005, W + 0.12, D + 0.06, 0.09, outline=0.005, bevel=0)
box('baseroof', M['concrete'], LX, LY, G + 0.08, W + 0.14, D + 0.08, 0.015, outline=0.002, bevel=0)
TZ0, TH = G + 0.095, 0.5
box('tower', M['m4'], LX, LY, TZ0, W, D, TH, outline=0.008, bevel=0)
NX, NZ = 8, 11
COLS = ('m0', 'm1', 'm2', 'm3', 'm5', 'm0', 'm1')
for i in range(NX):
    for j in range(NZ):
        z = TZ0 + 0.015 + j * (TH - 0.03) / NZ
        u = -W / 2 + 0.015 + (i + 0.5) * (W - 0.03) / NX
        c = M[COLS[rng.randrange(len(COLS))]]
        if rng.random() < 0.82:
            box(f'mosaicfront{i}{j}', c, LX + u, LY - D / 2 - 0.003, z, (W - 0.03) / NX * 0.92, 0.006, (TH - 0.03) / NZ * 0.9, outline=0, bevel=0)
        c = M[COLS[rng.randrange(len(COLS))]]
        if rng.random() < 0.82:
            box(f'mosaicside{i}{j}', c, LX - W / 2 - 0.003, LY + u, z, 0.006, (W - 0.03) / NX * 0.92, (TH - 0.03) / NZ * 0.9, outline=0, bevel=0)
# the big round motifs of the mosaic
for name, x, y, z, rot in (('sunfront', LX, LY - D / 2 - 0.007, TZ0 + 0.34, 'X'), ('sunside', LX - W / 2 - 0.007, LY, TZ0 + 0.2, 'Y')):
    m = Matrix.Translation((x, y, z)) @ (Matrix.Rotation(math.pi / 2, 4, 'X') if rot == 'X' else Matrix.Rotation(math.pi / 2, 4, 'Y'))
    cyl(name, M['m1'], 0.07, 0.006, segs=20, outline=0.001, matrix=m)
    m2 = Matrix.Translation((x - (0.003 if rot == 'Y' else 0), y - (0.003 if rot == 'X' else 0), z)) @ (Matrix.Rotation(math.pi / 2, 4, 'X') if rot == 'X' else Matrix.Rotation(math.pi / 2, 4, 'Y'))
    cyl(f'{name}eye', M['m0'], 0.035, 0.006, segs=16, outline=0, matrix=m2)
box('towertop', M['concrete'], LX, LY, TZ0 + TH - 0.005, W + 0.01, D + 0.01, 0.015, outline=0.002, bevel=0)

# ---------- the Rectory tower and its mural ----------
RX, RY = -0.45, 0.55
box('rectory', M['concrete'], RX, RY, G - 0.005, 0.46, 0.14, 0.42, outline=0.007, bevel=0)
for row in range(7):
    box(f'rectorywin{row}', M['glass'], RX + 0.05, RY - 0.073, G + 0.06 + row * 0.05, 0.3, 0.006, 0.03, outline=0, bevel=0)
box('mural', M['m2'], RX - 0.17, RY - 0.075, G + 0.08, 0.1, 0.006, 0.3, outline=0.001, bevel=0)
box('muralred', M['m0'], RX - 0.17, RY - 0.079, G + 0.15, 0.06, 0.006, 0.14, outline=0, bevel=0)
box('muralyellow', M['m1'], RX - 0.15, RY - 0.082, G + 0.25, 0.04, 0.006, 0.08, outline=0, bevel=0)
box('rectorybase', M['stone'], RX - 0.05, RY - 0.12, G - 0.005, 0.6, 0.12, 0.08, outline=0.004, bevel=0)

for k, (x, y) in enumerate(((-0.95, -0.15), (0.8, -0.45), (0.85, 0.35), (-0.1, 0.9), (0.45, 0.85))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
