# A cartoon Augustusburg Palace, Brühl, for the country maps, built in the set's shared look
# (../toon.py): the prince-archbishop's rococo palace, its long yellow front with white trim and tall
# windows under the grey mansard roof, the projecting centre and its pediment, the two wings round the
# cour d'honneur, and the formal French garden in front with its swirling box parterres, gravel paths
# and the round pond with its fountain. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bruhl.py -- bruhl-1024.png 1024 bruhl.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'gravel': toon('gravel', '#e0d8c4', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'yellow': toon('yellow', '#f0d080', shadow_mul=(0.86, 0.8, 0.7), lift=0.15),
    'white': toon('white', '#f6f4ee', lift=0.2),
    'slate': toon('slate', '#5e6a7a', shadow_mul=(0.82, 0.86, 0.92)),
    'window': flat('window', '#3a3a46'),
    'box': toon('box', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'flowers': toon('flowers', '#d84a5a', lift=0.12),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['gravel'])
before = set(bpy.data.objects)

PY = 0.45
L, D, H = 1.1, 0.24, 0.24


def wing(name, x, y, w, d, along_x):
    box(name, M['yellow'], x, y, G - 0.005, w, d, H, outline=0.008, bevel=0)
    box(name + 'cornice', M['white'], x, y, G + H - 0.02, w + 0.01, d + 0.01, 0.02, outline=0.002, bevel=0)
    n = int((w if along_x else d) / 0.07)
    for row in range(2):
        for j in range(n):
            t = -(w if along_x else d) / 2 + (j + 0.5) * (w if along_x else d) / n
            if along_x:
                box(f'{name}win{row}{j}', M['window'], x + t, y - d / 2 - 0.003, G + 0.04 + row * 0.1, 0.03, 0.006, 0.07, outline=0, bevel=0)
                box(f'{name}frame{row}{j}', M['white'], x + t, y - d / 2 - 0.002, G + 0.035 + row * 0.1, 0.04, 0.004, 0.08, outline=0, bevel=0)
            else:
                box(f'{name}win{row}{j}', M['window'], x + (d / 2 + 0.003) * (1 if x < 0 else -1), y + t, G + 0.04 + row * 0.1, 0.006, 0.03, 0.07, outline=0, bevel=0)
    loft(name + 'roof', M['slate'], [[(x - w / 2, y - d / 2, G + H - 0.005), (x + w / 2, y - d / 2, G + H - 0.005), (x + w / 2, y + d / 2, G + H - 0.005), (x - w / 2, y + d / 2, G + H - 0.005)],
                                     [(x - w / 2 + 0.02, y - d / 2 + 0.03, G + H + 0.07), (x + w / 2 - 0.02, y - d / 2 + 0.03, G + H + 0.07), (x + w / 2 - 0.02, y + d / 2 - 0.03, G + H + 0.07), (x - w / 2 + 0.02, y + d / 2 - 0.03, G + H + 0.07)],
                                     [(x - w / 2 + 0.03, y - 0.004, G + H + 0.1), (x + w / 2 - 0.03, y - 0.004, G + H + 0.1), (x + w / 2 - 0.03, y + 0.004, G + H + 0.1), (x - w / 2 + 0.03, y + 0.004, G + H + 0.1)]], outline=0.004)


# ---------- the palace: the main front facing the garden, and its wings ----------
wing('main', 0, PY, L, D, True)
box('centre', M['yellow'], 0, PY - D / 2 - 0.03, G - 0.005, 0.26, 0.06, H + 0.04, outline=0.005, bevel=0)
loft('centrepediment', M['white'], [[(-0.14, PY - D / 2 - 0.065, G + H + 0.03), (0.14, PY - D / 2 - 0.065, G + H + 0.03), (0.14, PY - D / 2 + 0.005, G + H + 0.03), (-0.14, PY - D / 2 + 0.005, G + H + 0.03)],
                                    [(-0.004, PY - D / 2 - 0.065, G + H + 0.1), (0.004, PY - D / 2 - 0.065, G + H + 0.1), (0.004, PY - D / 2 + 0.005, G + H + 0.1), (-0.004, PY - D / 2 + 0.005, G + H + 0.1)]], outline=0.003)
for s in (-1, 1):
    wing(f'sidewing{s}', s * (L / 2 - 0.1), PY + 0.3, 0.2, 0.4, False)

# ---------- the garden's parterres, paths and pond ----------
for s in (-1, 1):
    for k in range(2):
        cx, cy = s * 0.32, -0.05 - k * 0.42
        box(f'parterrebed{s}{k}', M['gravel'], cx, cy, G - 0.004, 0.44, 0.34, 0.006, outline=0, bevel=0)
        # the swirling box hedges, as rings of little bars
        for j in range(16):
            a0, a1 = 2 * math.pi * j / 16, 2 * math.pi * (j + 1) / 16
            for rr, sx in ((0.14, 1.4), (0.08, 1.4)):
                bar(f'hedge{s}{k}{rr}{j}', M['box'], (cx + rr * sx * math.cos(a0), cy + rr * math.sin(a0), G + 0.01), (cx + rr * sx * math.cos(a1), cy + rr * math.sin(a1), G + 0.01), 0.022, outline=0.001)
        ball(f'flowerbed{s}{k}', M['flowers'], cx, cy, G + 0.005, 0.04, outline=0.002)
lathe('pondrim', M['white'], ((0.13, 0), (0.13, 0.025), (0.11, 0.025)), G - 0.004, 0, -0.28, segs=24, outline=0.003)
lathe('pond', M['water'], ((0.115, 0), (0.115, 0.02)), G - 0.002, 0, -0.28, segs=24, outline=0)
rod('fountain', M['white'], (0, -0.28, G), (0, -0.28, G + 0.15), 0.008, r2=0.003, segs=6, outline=0)
for k, (x, y) in enumerate(((-0.85, -0.3), (0.85, -0.3), (-0.85, 0.25), (0.85, 0.25), (-0.55, -0.8), (0.55, -0.8))):
    t = ball(f'tree{k}', M['tree'], 0, 0, 0, 0.08, outline=0.01)
    t.scale = (0.9, 0.9, 1.4)
    t.location = (x, y, G + 0.12)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
