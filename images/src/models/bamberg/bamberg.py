# A cartoon Bamberg for the country maps, built in the set's shared look (../toon.py): the Old Town
# Hall standing in the middle of the Regnitz on its own island between two bridges, its painted
# walls, the tower over the arch the street runs through, the half-timbered Rottmeisterhaus hanging
# over the water at its end, and the cathedral's four spires on the hill behind. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P bamberg.py -- bamberg-1024.png 1024 bamberg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bank': toon('bank', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'river': toon('river', '#4a7a9a', lift=0.3),
    'stone': toon('stone', '#d8c8a8', shadow_mul=(0.86, 0.82, 0.8), lift=0.1),
    'fresco': toon('fresco', '#e8d0a0', lift=0.15),
    'paint0': toon('paint0', '#7a9ac0'), 'paint1': toon('paint1', '#c87a5a'), 'paint2': toon('paint2', '#8ab870'),
    'roof': toon('roof', '#b8583a'),
    'slate': toon('slate', '#4a5058'),
    'plaster': toon('plaster', '#f6efe0', lift=0.15),
    'beam': toon('beam', '#6a3a24'),
    'window': flat('window', '#2e2a28'),
    'hill': toon('hill', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'cathedral': toon('cathedralStone', '#c8b890'),
    'copper': toon('copper', '#5aa890'),
})

G = tile(M['bank'])
before = set(bpy.data.objects)

box('river', M['river'], 0.0, -0.2, G - 0.004, 0.55, 2.6, 0.01, outline=0.004, bevel=0)

# ---------- the cathedral on its hill behind ----------
hl = lathe('domberg', M['hill'], ((0.55, 0), (0.4, 0.12), (0.3, 0.16)), G - 0.01, -0.65, 0.75, segs=22, outline=0.008)
hl.visible_shadow = False
DX, DY = -0.65, 0.75
box('dom', M['cathedral'], DX, DY, G + 0.15, 0.4, 0.16, 0.16, outline=0.007, bevel=0)
loft('domroof', M['slate'], [[(DX - 0.2, DY - 0.08, G + 0.305), (DX + 0.2, DY - 0.08, G + 0.305), (DX + 0.2, DY + 0.08, G + 0.305), (DX - 0.2, DY + 0.08, G + 0.305)],
                             [(DX - 0.2, DY - 0.004, G + 0.37), (DX + 0.2, DY - 0.004, G + 0.37), (DX + 0.2, DY + 0.004, G + 0.37), (DX - 0.2, DY + 0.004, G + 0.37)]], outline=0.005)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = DX + sx * 0.2, DY + sy * 0.06
        box(f'domtower{sx}{sy}', M['cathedral'], x, y, G + 0.15, 0.06, 0.06, 0.28, outline=0.004, bevel=0)
        pyramid(f'domspire{sx}{sy}', M['copper'], x, y, G + 0.425, 0.065, 0.14, outline=0.003)

# ---------- the bridges and the Old Town Hall ----------
for s in (-1, 1):
    y = -0.2 + s * 0.3
    for j in range(2):
        x0, x1 = -0.3 + j * 0.3, 0.0 + j * 0.3
        pts = [(x0 + (x1 - x0) * i / 6, y, G + 0.02 + 0.05 * math.sin(math.pi * i / 6)) for i in range(7)]
        for i in range(6):
            bar(f'bridge{s}{j}{i}', M['stone'], pts[i], pts[i + 1], 0.07, outline=0.004)
    box(f'bridgedeck{s}', M['stone'], 0.0, y, G + 0.06, 0.62, 0.07, 0.02, outline=0.003, bevel=0)
HX, HY = 0.0, -0.2
box('islandbase', M['stone'], HX, HY, G - 0.005, 0.24, 0.58, 0.08, outline=0.006, bevel=0)
box('hall', M['fresco'], HX, HY, G + 0.075, 0.2, 0.5, 0.17, outline=0.009, bevel=0)
for j in range(5):
    box(f'paint{j}', M[f'paint{j % 3}'], HX + 0.102, HY - 0.2 + j * 0.1, G + 0.1, 0.004, 0.06, 0.1, outline=0, bevel=0)
    box(f'hallwin{j}', M['window'], HX - 0.102, HY - 0.2 + j * 0.1, G + 0.14, 0.004, 0.035, 0.05, outline=0, bevel=0)
loft('hallroof', M['roof'], [[(HX - 0.11, HY - 0.25, G + 0.24), (HX + 0.11, HY - 0.25, G + 0.24), (HX + 0.11, HY + 0.25, G + 0.24), (HX - 0.11, HY + 0.25, G + 0.24)],
                             [(HX - 0.004, HY - 0.25, G + 0.32), (HX + 0.004, HY - 0.25, G + 0.32), (HX + 0.004, HY + 0.25, G + 0.32), (HX - 0.004, HY + 0.25, G + 0.32)]], outline=0.006)
# the tower over the gateway in the middle
box('gatetower', M['fresco'], HX, HY - 0.02, G + 0.075, 0.24, 0.12, 0.34, outline=0.008, bevel=0)
box('gatearch', M['window'], HX + 0.122, HY - 0.02, G + 0.075, 0.004, 0.06, 0.08, outline=0, bevel=0)
box('towerclock', M['plaster'], HX - 0.122, HY - 0.02, G + 0.33, 0.004, 0.05, 0.05, outline=0, bevel=0)
lathe('towerroof', M['slate'], ((0.08, 0), (0.05, 0.06), (0.03, 0.08), (0.004, 0.16)), G + 0.41, HX, HY - 0.02, segs=8, outline=0.005, smooth=False)
# the Rottmeisterhaus at the front end
RX, RY = HX, HY - 0.32
box('rottmeister', M['plaster'], RX, RY, G + 0.075, 0.18, 0.14, 0.14, outline=0.006, bevel=0)
for j in range(3):
    bar(f'rbeamv{j}', M['beam'], (RX - 0.091, RY - 0.05 + j * 0.05, G + 0.075), (RX - 0.091, RY - 0.05 + j * 0.05, G + 0.21), 0.01, outline=0)
    bar(f'rbeamd{j}', M['beam'], (RX - 0.091, RY - 0.05 + j * 0.05, G + 0.08), (RX - 0.091, RY - 0.025 + j * 0.05, G + 0.14), 0.008, outline=0)
bar('rbeamh', M['beam'], (RX - 0.091, RY - 0.07, G + 0.14), (RX - 0.091, RY + 0.07, G + 0.14), 0.01, outline=0)
loft('rottmeisterroof', M['roof'], [[(RX - 0.1, RY - 0.08, G + 0.21), (RX + 0.1, RY - 0.08, G + 0.21), (RX + 0.1, RY + 0.08, G + 0.21), (RX - 0.1, RY + 0.08, G + 0.21)],
                                    [(RX - 0.004, RY - 0.08, G + 0.3), (RX + 0.004, RY - 0.08, G + 0.3), (RX + 0.004, RY + 0.08, G + 0.3), (RX - 0.004, RY + 0.08, G + 0.3)]], outline=0.005)

# ---------- houses on both banks ----------
for s in (-1, 1):
    for k in range(3):
        x = s * (0.55 + k * 0.2)
        y = -0.45 + (0.2 if k == 1 else 0)
        if math.hypot(x, y) > 1.15:
            continue
        box(f'bankhouse{s}{k}', M['plaster' if k % 2 else 'fresco'], x, y, G - 0.005, 0.16, 0.14, 0.16, outline=0.006, bevel=0)
        pyramid(f'bankroof{s}{k}', M['roof'], x, y, G + 0.155, 0.17, 0.07, outline=0.004)

turn(before, -20)
render(G)
