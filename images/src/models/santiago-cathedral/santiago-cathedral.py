# A cartoon Santiago de Compostela for the country maps, built in the set's shared look
# (../toon.py): the cathedral's baroque Obradoiro front in grey-gold granite, its two soaring towers
# stacked with balustrades and pinnacles, the tall glazed middle under its gable, the double
# stairway down to the great Praza do Obradoiro, and pilgrims arriving with their staffs. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P santiago-cathedral.py -- santiago-cathedral-1024.png 1024 santiago-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'praza': toon('praza', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'granite': toon('granite', '#c8b898', shadow_mul=(0.84, 0.82, 0.86), lift=0.1),
    'graniteDark': toon('graniteDark', '#a89878', shadow_mul=(0.84, 0.82, 0.86)),
    'moss': toon('moss', '#8a9a68'),
    'glass': toon('glass', '#4a6a8a', lift=0.2),
    'roof': toon('roof', '#6a6a70'),
    'p0': toon('p0', '#d83a2c'), 'p1': toon('p1', '#2f6fc0'), 'p2': toon('p2', '#f0c030', lift=0.2),
    'skin': toon('skin', '#e8b890'),
    'staff': toon('staff', '#7a5a3a'),
})

G = tile(M['praza'])
before = set(bpy.data.objects)

FX, FY = 0.0, 0.25
# ---------- the nave behind ----------
box('nave', M['granite'], FX, FY + 0.4, G - 0.005, 0.36, 0.6, 0.34, outline=0.01, bevel=0)
loft('naveroof', M['roof'], [[(FX - 0.18, FY + 0.1, G + 0.335), (FX + 0.18, FY + 0.1, G + 0.335), (FX + 0.18, FY + 0.7, G + 0.335), (FX - 0.18, FY + 0.7, G + 0.335)],
                             [(FX - 0.004, FY + 0.1, G + 0.42), (FX + 0.004, FY + 0.1, G + 0.42), (FX + 0.004, FY + 0.7, G + 0.42), (FX - 0.004, FY + 0.7, G + 0.42)]], outline=0.006)

# ---------- the Obradoiro front ----------
box('front', M['granite'], FX, FY, G + 0.1, 0.34, 0.12, 0.4, outline=0.01, bevel=0)
box('frontglass', M['glass'], FX, FY - 0.062, G + 0.2, 0.18, 0.006, 0.22, outline=0, bevel=0)
for j in range(3):
    bar(f'glassbar{j}', M['granite'], (FX - 0.06 + j * 0.06, FY - 0.066, G + 0.2), (FX - 0.06 + j * 0.06, FY - 0.066, G + 0.42), 0.01, outline=0)
loft('gable', M['granite'], [[(FX - 0.17, FY - 0.06, G + 0.495), (FX + 0.17, FY - 0.06, G + 0.495), (FX + 0.17, FY + 0.06, G + 0.495), (FX - 0.17, FY + 0.06, G + 0.495)],
                             [(FX - 0.03, FY - 0.06, G + 0.62), (FX + 0.03, FY - 0.06, G + 0.62), (FX + 0.03, FY + 0.06, G + 0.62), (FX - 0.03, FY + 0.06, G + 0.62)]], outline=0.006)
lathe('gablestatue', M['graniteDark'], ((0.02, 0), (0.012, 0.07)), G + 0.62, FX, FY, segs=8, outline=0.002)
for s in (-1, 1):
    TX = FX + s * 0.25
    z = G + 0.1
    for t, (w, h) in enumerate(((0.16, 0.36), (0.14, 0.16), (0.11, 0.13), (0.08, 0.1))):
        box(f'tower{s}{t}', M['granite' if t % 2 == 0 else 'graniteDark'], TX, FY, z, w, w * 0.85, h, outline=0.006, bevel=0)
        box(f'towerwin{s}{t}', M['glass'], TX, FY - w * 0.425 - 0.003, z + h * 0.3, w * 0.3, 0.006, h * 0.45, outline=0, bevel=0)
        for sx in (-1, 1):
            lathe(f'towerpin{s}{t}{sx}', M['granite'], ((0.012, 0), (0.004, 0.05)), z + h - 0.005, TX + sx * w * 0.45, FY - w * 0.4, segs=5, outline=0.001, smooth=False)
        z += h
    lathe(f'towercap{s}', M['granite'], ((0.035, 0), (0.025, 0.04), (0.004, 0.1)), z, TX, FY, segs=8, outline=0.003)
    bar(f'mossstreak{s}', M['moss'], (TX - 0.05, FY - 0.072, G + 0.12), (TX - 0.04, FY - 0.072, G + 0.4), 0.02, outline=0)
# the terrace and the double stairway
box('terrace', M['graniteDark'], FX, FY - 0.12, G - 0.005, 0.7, 0.14, 0.105, outline=0.006, bevel=0)
for s in (-1, 1):
    for j in range(5):
        box(f'stair{s}{j}', M['granite'], FX + s * (0.1 + j * 0.04), FY - 0.21, G - 0.005, 0.045, 0.07, 0.1 - j * 0.02, outline=0.002, bevel=0)

# ---------- pilgrims on the square ----------
for k, (x, y) in enumerate(((-0.4, -0.45), (-0.25, -0.6), (0.2, -0.5), (0.45, -0.65), (0.05, -0.75), (-0.6, -0.7))):
    lathe(f'pilgrim{k}', M[f'p{k % 3}'], ((0.022, 0), (0.016, 0.07)), G - 0.005, x, y, segs=8, outline=0.003)
    ball(f'pilgrimhead{k}', M['skin'], x, y, G + 0.085, 0.014, outline=0.002)
    box(f'pack{k}', M['staff'], x, y + 0.02, G + 0.035, 0.03, 0.015, 0.035, outline=0.001, bevel=0)
    rod(f'pilgrimstaff{k}', M['staff'], (x + 0.025, y, G), (x + 0.03, y, G + 0.12), 0.003, segs=4, outline=0)

turn(before, -20)
render(G)
