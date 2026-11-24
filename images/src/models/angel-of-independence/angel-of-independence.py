# A cartoon Angel of Independence for the country maps, built in the set's shared look (../toon.py):
# Mexico City's column on the Paseo de la Reforma, the golden winged Victory on top holding her laurel
# crown and broken chain, the tall fluted column with its rings, the square base with the bronze
# figures and the lion led by a child at its foot, on its roundabout with flowers and the avenue's
# palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P angel-of-independence.py -- angel-of-independence-1024.png 1024 angel-of-independence.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'road': toon('road', '#8a8a90', shadow_mul=(0.86, 0.86, 0.9), lift=0.2),
    'paving': toon('paving', '#d8d0c0', lift=0.2),
    'stone': toon('stone', '#ece4d2', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stoneDark': toon('stoneDark', '#cfc4ae'),
    'gold': toon('gold', '#f0c040', shadow_mul=(0.86, 0.76, 0.6), lift=0.3),
    'bronze': toon('bronze', '#5a4a3a', lift=0.1),
    'flowers': toon('flowers', '#e05a8a', lift=0.12),
    'lawn': toon('lawn', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
    'white': toon('white', '#f6f4ee'),
})

G = tile(M['road'])
before = set(bpy.data.objects)

# ---------- the roundabout ----------
lathe('island', M['paving'], ((0.5, 0), (0.5, 0.02)), G - 0.004, segs=40, outline=0.004)
lathe('flowerring', M['flowers'], ((0.46, 0), (0.46, 0.03), (0.38, 0.03), (0.38, 0.026)), G + 0.012, segs=40, outline=0.002)
for k in range(8):
    a = 2 * math.pi * k / 8 + math.pi / 8
    bar(f'lane{k}', M['white'], (0.62 * math.cos(a), 0.62 * math.sin(a), G + 0.001), (0.9 * math.cos(a), 0.9 * math.sin(a), G + 0.001), 0.012, outline=0)
for k in range(10):
    a = 2 * math.pi * k / 10
    x, y = 1.12 * math.cos(a), 1.12 * math.sin(a)
    lathe(f'bed{k}', M['lawn'], ((0.08, 0), (0.08, 0.015)), G - 0.004, x, y, segs=12, outline=0.002)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.014, segs=6, outline=0.002)
    for j in range(7):
        b = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.022, outline=0.002)

# ---------- the base and its figures ----------
BZ = G + 0.016
lathe('steps', M['stoneDark'], ((0.3, 0), (0.3, 0.02), (0.26, 0.02), (0.26, 0.04), (0.22, 0.04), (0.22, 0.06)), BZ, segs=4, outline=0.004, smooth=False)
box('pedestal', M['stone'], 0, 0, BZ + 0.055, 0.24, 0.24, 0.16, outline=0.006, bevel=0)
box('pedestalcornice', M['stoneDark'], 0, 0, BZ + 0.21, 0.27, 0.27, 0.02, outline=0.002, bevel=0)
for k in range(4):
    a = k * math.pi / 2 - math.pi / 2
    c, s = math.cos(a), math.sin(a)
    x, y = 0.15 * c, 0.15 * s
    rod(f'figure{k}', M['bronze'], (x, y, BZ + 0.215), (x, y, BZ + 0.3), 0.02, r2=0.014, segs=8, outline=0.002)
    ball(f'figurehead{k}', M['bronze'], x, y, BZ + 0.315, 0.013, outline=0.002)
# the lion and the child in front
lion = ball('lion', M['bronze'], 0, 0, 0, 0.045, outline=0.004)
lion.scale = (1.0, 1.6, 0.8)
lion.location = (0, -0.22, BZ + 0.09)
ball('lionhead', M['bronze'], 0, -0.29, BZ + 0.12, 0.03, outline=0.003)
rod('child', M['bronze'], (0.03, -0.2, BZ + 0.12), (0.03, -0.2, BZ + 0.17), 0.012, segs=6, outline=0.002)
ball('childhead', M['bronze'], 0.03, -0.2, BZ + 0.18, 0.01, outline=0.001)

# ---------- the column ----------
CZ0 = BZ + 0.23
CH = 0.82
lathe('column', M['stone'], ((0.07, 0), (0.06, CH * 0.5), (0.05, CH)), CZ0, segs=20, outline=0.006, smooth=False)
for k in range(5):
    lathe(f'ring{k}', M['stoneDark'], ((0.073 - 0.004 * k, 0), (0.073 - 0.004 * k, 0.016)), CZ0 + 0.12 + k * 0.15, segs=20, outline=0.001)
for k in range(10):
    a = 2 * math.pi * k / 10
    bar(f'flute{k}', M['stoneDark'], (0.069 * math.cos(a), 0.069 * math.sin(a), CZ0 + 0.02), (0.051 * math.cos(a), 0.051 * math.sin(a), CZ0 + CH - 0.03), 0.006, outline=0)
lathe('capital', M['gold'], ((0.05, 0), (0.075, 0.04), (0.075, 0.055)), CZ0 + CH, segs=12, outline=0.003)
lathe('globe', M['stone'], ((0.035, 0), (0.04, 0.02), (0.02, 0.04)), CZ0 + CH + 0.055, segs=12, outline=0.002)

# ---------- the golden Victory ----------
VZ = CZ0 + CH + 0.09
rod('victorylegs', M['gold'], (0, 0, VZ), (0, 0.01, VZ + 0.06), 0.014, r2=0.018, segs=8, outline=0.002)
rod('victory', M['gold'], (0, 0.01, VZ + 0.06), (0, 0.005, VZ + 0.13), 0.02, r2=0.013, segs=8, outline=0.003)
ball('victoryhead', M['gold'], 0, 0.0, VZ + 0.145, 0.014, outline=0.002)
for s in (-1, 1):
    # her wings, swept back, and her arms: the crown raised in her right hand, the chain in her left
    loft(f'wing{s}', M['gold'], [[(s * 0.01, 0.015, VZ + 0.08), (s * 0.01, 0.03, VZ + 0.08), (s * 0.01, 0.03, VZ + 0.14), (s * 0.01, 0.015, VZ + 0.14)],
                                 [(s * 0.09, 0.06, VZ + 0.14), (s * 0.09, 0.07, VZ + 0.14), (s * 0.09, 0.07, VZ + 0.2), (s * 0.09, 0.06, VZ + 0.2)]], outline=0.002)
bar('rightarm', M['gold'], (0.015, 0, VZ + 0.12), (0.03, -0.01, VZ + 0.2), 0.009, outline=0.001)
lathe('laurel', M['gold'], ((0.016, 0), (0.016, 0.006)), VZ + 0.2, 0.03, -0.01, segs=10, outline=0.001)
bar('leftarm', M['gold'], (-0.015, 0, VZ + 0.12), (-0.04, -0.01, VZ + 0.09), 0.009, outline=0.001)
bar('chain', M['gold'], (-0.04, -0.01, VZ + 0.09), (-0.05, -0.01, VZ + 0.05), 0.005, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
