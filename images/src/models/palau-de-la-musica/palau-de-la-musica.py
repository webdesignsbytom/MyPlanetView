# A cartoon Palau de la Música Catalana for the country maps, built in the set's shared look
# (../toon.py): Barcelona's modernista concert hall, its red-brick corner front with the two great
# arches at street level, the loggia of columns covered in coloured mosaic, the row of busts and the
# white sculpture group bursting from the corner, a band of ceramic tiles and the corner tower's
# little dome. Turned a little towards the camera.
# Run: blender -b --factory-startup -P palau-de-la-musica.py -- palau-de-la-musica-1024.png 1024 palau-de-la-musica.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'brick': toon('brick', '#b8503a', shadow_mul=(0.86, 0.78, 0.76)),
    'stone': toon('stone', '#ece0c8', lift=0.12),
    'glass': flat('glass', '#3a4a5a'),
    'm1': toon('m1', '#3aa86a', lift=0.12),
    'm2': toon('m2', '#f0c030', lift=0.2),
    'm3': toon('m3', '#e86a8a', lift=0.12),
    'm4': toon('m4', '#3a8ad0', lift=0.12),
    'white': toon('white', '#f6f4ee', lift=0.15),
    'tile': toon('tile', '#2a9ab0', lift=0.12),
    'dark': flat('dark', '#2e2a28'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2417)

FY, X0, X1, H = -0.05, -0.45, 0.45, 0.42
box('body', M['brick'], (X0 + X1) / 2, FY + 0.2, G - 0.005, X1 - X0, 0.4, H, outline=0.01, bevel=0)
box('sidewing', M['brick'], X0 - 0.12, FY + 0.35, G - 0.005, 0.24, 0.7, H - 0.04, outline=0.009, bevel=0)
# the street arches
for x in (-0.18, 0.18):
    box(f'arch{x}', M['dark'], x, FY - 0.003, G - 0.005, 0.18, 0.006, 0.1, outline=0, bevel=0)
    cyl(f'archtop{x}', M['dark'], 0.09, 0.006, segs=18, outline=0, matrix=Matrix.Translation((x, FY - 0.003, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    cyl(f'archrim{x}', M['stone'], 0.1, 0.006, segs=18, outline=0, matrix=Matrix.Translation((x, FY + 0.0, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the loggia of mosaic columns
box('loggiaglass', M['glass'], 0.0, FY - 0.003, G + 0.2, X1 - X0 - 0.04, 0.006, 0.12, outline=0, bevel=0)
box('loggiafloor', M['stone'], 0.0, FY - 0.03, G + 0.195, X1 - X0, 0.06, 0.012, outline=0.002, bevel=0)
mats = ('m1', 'm2', 'm3', 'm4')
for j in range(9):
    x = X0 + 0.04 + j * (X1 - X0 - 0.08) / 8
    for k in range(5):
        rod(f'col{j}{k}', M[mats[(j + k) % 4]], (x, FY - 0.04, G + 0.205 + k * 0.025), (x, FY - 0.04, G + 0.23 + k * 0.025), 0.014, segs=10, outline=0.001)
    lathe(f'colcap{j}', M['stone'], ((0.014, 0), (0.024, 0.02)), G + 0.33, x, FY - 0.04, segs=10, outline=0.001)
box('loggiatop', M['stone'], 0.0, FY - 0.03, G + 0.348, X1 - X0, 0.06, 0.016, outline=0.002, bevel=0)
# the busts and the ceramic band
for j in range(7):
    x = X0 + 0.07 + j * (X1 - X0 - 0.14) / 6
    box(f'bustplinth{j}', M['stone'], x, FY - 0.01, G + 0.36, 0.03, 0.03, 0.02, outline=0.001, bevel=0)
    ball(f'bust{j}', M['white'], x, FY - 0.01, G + 0.395, 0.017, outline=0.001)
box('tileband', M['tile'], 0.0, FY - 0.003, G + 0.37, X1 - X0, 0.006, 0.03, outline=0, bevel=0)
for j in range(18):
    box(f'tiledot{j}', M[mats[j % 4]], X0 + 0.025 + j * 0.05, FY - 0.006, G + 0.378, 0.02, 0.004, 0.014, outline=0, bevel=0)
box('cornice', M['stone'], 0.0, FY + 0.2, G + H - 0.005, X1 - X0 + 0.02, 0.42, 0.02, outline=0.002, bevel=0)
# the sculpture group at the corner
CX, CY = X0 + 0.02, FY - 0.02
for k in range(9):
    ball(f'sculpt{k}', M['white'], CX + rng.uniform(-0.04, 0.04), CY + rng.uniform(-0.03, 0.02), G + 0.2 + k * 0.03, rng.uniform(0.03, 0.045), outline=0.003)
lathe('cornertower', M['brick'], ((0.06, 0), (0.06, 0.14)), G + H - 0.005, CX, CY + 0.04, segs=12, outline=0.004)
lathe('cornerdome', M['tile'], ((0.065, 0), (0.05, 0.04), (0.02, 0.07), (0.004, 0.09)), G + H + 0.13, CX, CY + 0.04, segs=16, outline=0.003)
ball('cornerfinial', M['m2'], CX, CY + 0.04, G + H + 0.23, 0.014, outline=0)
for r in range(2):
    for j in range(5):
        box(f'sidewin{r}{j}', M['glass'], X0 - 0.243, FY + 0.08 + j * 0.12, G + 0.06 + r * 0.16, 0.006, 0.05, 0.08, outline=0, bevel=0)

turn(before, -20)
render(G)
