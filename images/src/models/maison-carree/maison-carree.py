# A cartoon Maison Carrée for the country maps, built in the set's shared look (../toon.py): Nîmes'
# perfectly kept Roman temple on its high podium, the deep porch of Corinthian columns at the top of
# its steps, the half-columns along the cella's sides, the frieze and pediment under the tiled roof,
# and the square round it with Foster's glass and steel Carré d'Art facing it. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P maison-carree.py -- maison-carree-1024.png 1024 maison-carree.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#e0d8c4', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#ecdcb8', shadow_mul=(0.86, 0.82, 0.78), lift=0.15),
    'stoneDark': toon('stoneDark', '#cdbc94'),
    'roof': toon('roof', '#c4704a'),
    'dark': flat('dark', '#3a3028'),
    'glass': toon('glass', '#8ab8d0', lift=0.3),
    'steel': toon('steel', '#6a7078'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

TX, TY = 0.0, 0.1
L, W = 0.9, 0.4       # the temple's length (front to back) and width
PH = 0.12             # the podium's height
box('podium', M['stone'], TX, TY, G - 0.005, W + 0.04, L, PH, outline=0.007, bevel=0)
box('podiumcap', M['stoneDark'], TX, TY, G + PH - 0.015, W + 0.06, L + 0.02, 0.02, outline=0.002, bevel=0)
for i in range(7):
    box(f'step{i}', M['stoneDark'], TX, TY - L / 2 - 0.015 - i * 0.025, G - 0.005, 0.3, 0.03, PH - i * 0.017, outline=0.001, bevel=0)
for s in (-1, 1):
    box(f'stepcheek{s}', M['stone'], TX + s * 0.17, TY - L / 2 - 0.09, G - 0.005, 0.04, 0.18, PH - 0.02, outline=0.003, bevel=0)
Z = G + PH
CH = 0.3
# the cella with half-columns along its sides
box('cella', M['stone'], TX, TY + 0.14, Z, W - 0.04, L - 0.34, CH, outline=0.007, bevel=0)
box('celladoor', M['dark'], TX, TY + 0.14 - (L - 0.34) / 2 - 0.003, Z, 0.1, 0.006, 0.2, outline=0, bevel=0)
for s in (-1, 1):
    for j in range(7):
        y = TY - 0.1 + j * 0.08
        rod(f'halfcol{s}{j}', M['stone'], (TX + s * (W / 2 - 0.02), y, Z), (TX + s * (W / 2 - 0.02), y, Z + CH), 0.016, segs=10, outline=0.002)
        lathe(f'halfcap{s}{j}', M['stoneDark'], ((0.016, 0), (0.026, 0.025)), Z + CH - 0.025, TX + s * (W / 2 - 0.02), y, segs=8, outline=0.001)
# the porch: six columns across the front, two more down each side
for j in range(6):
    x = TX - W / 2 + 0.02 + j * (W - 0.04) / 5
    for k in range(3):
        y = TY - L / 2 + 0.06 + k * 0.09
        if k > 0 and 0 < j < 5:
            continue
        rod(f'column{j}{k}', M['stone'], (x, y, Z), (x, y, Z + CH), 0.018, segs=12, outline=0.003)
        lathe(f'capital{j}{k}', M['stoneDark'], ((0.018, 0), (0.03, 0.03)), Z + CH - 0.03, x, y, segs=10, outline=0.001)
# the entablature, the frieze, the pediment and the roof
box('entablature', M['stoneDark'], TX, TY + 0.1, Z + CH, W + 0.02, L - 0.08, 0.05, outline=0.004, bevel=0)
box('frieze', M['stone'], TX, TY - L / 2 + 0.05, Z + CH + 0.012, W, 0.006, 0.025, outline=0, bevel=0)
loft('pediment', M['stone'], [[(TX - W / 2 - 0.01, TY - L / 2 + 0.05, Z + CH + 0.05), (TX + W / 2 + 0.01, TY - L / 2 + 0.05, Z + CH + 0.05), (TX + W / 2 + 0.01, TY - L / 2 + 0.09, Z + CH + 0.05), (TX - W / 2 - 0.01, TY - L / 2 + 0.09, Z + CH + 0.05)],
                              [(TX - 0.004, TY - L / 2 + 0.05, Z + CH + 0.15), (TX + 0.004, TY - L / 2 + 0.05, Z + CH + 0.15), (TX + 0.004, TY - L / 2 + 0.09, Z + CH + 0.15), (TX - 0.004, TY - L / 2 + 0.09, Z + CH + 0.15)]], outline=0.004)
loft('roof', M['roof'], [[(TX - W / 2 - 0.01, TY - L / 2 + 0.09, Z + CH + 0.045), (TX + W / 2 + 0.01, TY - L / 2 + 0.09, Z + CH + 0.045), (TX + W / 2 + 0.01, TY + L / 2 - 0.02, Z + CH + 0.045), (TX - W / 2 - 0.01, TY + L / 2 - 0.02, Z + CH + 0.045)],
                         [(TX - 0.004, TY - L / 2 + 0.09, Z + CH + 0.145), (TX + 0.004, TY - L / 2 + 0.09, Z + CH + 0.145), (TX + 0.004, TY + L / 2 - 0.02, Z + CH + 0.145), (TX - 0.004, TY + L / 2 - 0.02, Z + CH + 0.145)]], outline=0.005)

# ---------- the Carré d'Art and the square ----------
AX = 0.75
box('carredart', M['glass'], AX, 0.2, G - 0.005, 0.36, 0.6, 0.32, outline=0.006, bevel=0)
for j in range(5):
    rod(f'carrecol{j}', M['steel'], (AX - 0.18, 0.2 - 0.25 + j * 0.125, G - 0.005), (AX - 0.18, 0.2 - 0.25 + j * 0.125, G + 0.32), 0.006, segs=6, outline=0)
box('carreroof', M['steel'], AX - 0.02, 0.2, G + 0.315, 0.44, 0.66, 0.015, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.7, -0.4), (-0.75, 0.3), (-0.4, -0.8), (0.35, -0.75))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.013, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.16, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
