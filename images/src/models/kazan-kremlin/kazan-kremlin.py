# A cartoon Kazan Kremlin for the country maps, built in the set's shared look (../toon.py): the
# white walls and towers of the kremlin, the Qolşärif Mosque's blue domes and four slender
# minarets, the Annunciation Cathedral's blue and gold domes beside it, and the red-brick Söyembikä
# Tower, leaning, with its green spire. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kazan-kremlin.py -- kazan-kremlin-1024.png 1024 kazan-kremlin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d8d0c4', lift=0.15),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'blue': toon('domeBlue', '#2f7ac0', lift=0.15),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'green': toon('spireGreen', '#3f8a5a'),
    'brick': toon('brick', '#b8483a', shadow_mul=(0.86, 0.76, 0.72)),
    'window': flat('window', '#2e3a54'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

box('square', M['paving'], 0.0, 0.1, G - 0.004, 1.5, 1.0, 0.01, outline=0.003, bevel=0)

# ---------- the kremlin walls ----------
for s in (-1, 1):
    box(f'sidewall{s}', M['white'], s * 0.78, 0.1, G - 0.005, 0.05, 1.0, 0.14, outline=0.006, bevel=0)
box('frontwall', M['white'], 0.0, -0.4, G - 0.005, 1.6, 0.05, 0.14, outline=0.006, bevel=0)
for k, (x, y) in enumerate(((-0.78, -0.4), (0.78, -0.4), (-0.78, 0.6), (0.78, 0.6))):
    lathe(f'cornertower{k}', M['white'], ((0.07, 0), (0.07, 0.2)), G - 0.005, x, y, segs=12, outline=0.005)
    lathe(f'cornerspire{k}', M['green'], ((0.075, 0), (0.004, 0.14)), G + 0.195, x, y, segs=12, outline=0.004)
# the Spasskaya gate tower
box('spasskaya', M['white'], 0.25, -0.4, G - 0.005, 0.12, 0.1, 0.34, outline=0.007, bevel=0)
box('spasskayagate', M['window'], 0.25, -0.452, G - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)
lathe('spasskayatier', M['white'], ((0.05, 0), (0.05, 0.06)), G + 0.335, 0.25, -0.4, segs=8, outline=0.004, smooth=False)
lathe('spasskayaspire', M['green'], ((0.055, 0), (0.004, 0.16)), G + 0.395, 0.25, -0.4, segs=8, outline=0.004, smooth=False)
ball('spasskayastar', M['gold'], 0.25, -0.4, G + 0.565, 0.015, outline=0.002)

# ---------- the Qolşärif Mosque ----------
QX, QY = -0.2, 0.25
box('mosque', M['white'], QX, QY, G - 0.005, 0.38, 0.38, 0.18, outline=0.01, bevel=0)
for j in range(4):
    box(f'mosquewin{j}', M['window'], QX - 0.13 + j * 0.087, QY - 0.192, G + 0.05, 0.04, 0.006, 0.09, outline=0, bevel=0)
lathe('mosquedrum', M['white'], ((0.13, 0), (0.13, 0.08)), G + 0.175, QX, QY, segs=8, outline=0.006, smooth=False)
lathe('mosquedome', M['blue'], ((0.14, 0), (0.13, 0.07), (0.08, 0.14), (0.02, 0.2), (0.004, 0.22)), G + 0.255, QX, QY, segs=16, outline=0.007)
ball('mosquecrescent', M['gold'], QX, QY, G + 0.49, 0.015, outline=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = QX + sx * 0.21, QY + sy * 0.21
        lathe(f'minaret{sx}{sy}', M['white'], ((0.03, 0), (0.026, 0.45), (0.02, 0.55)), G - 0.005, x, y, segs=8, outline=0.004, smooth=False)
        for z in (0.25, 0.42):
            lathe(f'minaretbalcony{sx}{sy}{z}', M['white'], ((0.042, 0), (0.042, 0.015)), G + z, x, y, segs=8, outline=0.002, smooth=False)
        lathe(f'minaretcap{sx}{sy}', M['blue'], ((0.025, 0), (0.004, 0.12)), G + 0.545, x, y, segs=8, outline=0.003, smooth=False)

# ---------- the Annunciation Cathedral ----------
AX, AY = 0.35, 0.3
box('cathedral', M['white'], AX, AY, G - 0.005, 0.26, 0.24, 0.2, outline=0.008, bevel=0)
for k, (dx, dy, r, z) in enumerate(((0.0, 0.0, 0.06, 0.24), (-0.08, -0.08, 0.035, 0.2), (0.08, -0.08, 0.035, 0.2), (-0.08, 0.08, 0.035, 0.2), (0.08, 0.08, 0.035, 0.2))):
    lathe(f'cathdrum{k}', M['white'], ((r * 0.7, 0), (r * 0.7, z - 0.19)), G + 0.195, AX + dx, AY + dy, segs=10, outline=0.003)
    lathe(f'cathdome{k}', M['blue' if k else 'gold'], ((r * 0.7, 0), (r, r * 0.6), (r * 0.6, r * 1.2), (0.004, r * 1.7)), G + z, AX + dx, AY + dy, segs=12, outline=0.004)

# ---------- the Söyembikä Tower, leaning ----------
SX, SY = 0.55, -0.05
lean = 0.04
z = G - 0.005
for t, (w, h) in enumerate(((0.14, 0.12), (0.11, 0.1), (0.09, 0.09), (0.07, 0.08), (0.05, 0.07))):
    x = SX + lean * (z - G) / 0.5
    box(f'soyembika{t}', M['brick'], x, SY, z, w, w, h, outline=0.005, bevel=0)
    box(f'soyembikawin{t}', M['window'], x, SY - w / 2 - 0.003, z + h * 0.3, w * 0.3, 0.006, h * 0.45, outline=0, bevel=0)
    z += h
pyramid('soyembikaspire', M['green'], SX + lean * (z - G) / 0.5, SY, z, 0.06, 0.16, outline=0.004)

for k, (x, y) in enumerate(((-0.95, -0.55), (0.95, -0.55), (-0.5, -0.8), (0.5, -0.8))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.009)

turn(before, -20)
render(G)
