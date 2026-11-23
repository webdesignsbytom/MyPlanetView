# A cartoon Trinidad for the country maps, built in the set's shared look (../toon.py): the colonial
# town's pastel one-storey houses on a cobbled street with tiled roofs, the yellow bell tower of the
# old convent of San Francisco, and in the Valley of the Sugar Mills beyond, the seven-storey
# Manaca Iznaga tower among cane fields and royal palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P trinidad-cuba.py -- trinidad-cuba-1024.png 1024 trinidad-cuba.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobbles': toon('cobbles', '#b8aa94', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'cane': toon('cane', '#8ac04a', shadow_mul=(0.72, 0.8, 0.72)),
    'field': toon('field', '#a8c870', shadow_mul=(0.72, 0.8, 0.72)),
    'tower': toon('tower', '#f2ead6', shadow_mul=(0.84, 0.8, 0.82), lift=0.15),
    'yellow': toon('yellow', '#f0c850', shadow_mul=(0.86, 0.78, 0.7), lift=0.15),
    'h0': toon('h0', '#9ad0e0'), 'h1': toon('h1', '#f0a0a0'), 'h2': toon('h2', '#f4e08a'), 'h3': toon('h3', '#a8d890'), 'h4': toon('h4', '#c8a8e0'),
    'roof': toon('roof', '#c4573a'),
    'door': toon('door', '#7a4a2e'),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#c8c0b0'),
})

G = tile(M['field'])
before = set(bpy.data.objects)
rng = random.Random(1433)

# ---------- the cobbled street and its pastel houses at the front ----------
box('street', M['cobbles'], 0.0, -0.45, G - 0.004, 2.6, 0.5, 0.008, outline=0.004, bevel=0)
for k in range(9):
    x = -1.0 + k * 0.25
    if abs(x) > 1.1:
        continue
    for side, y in ((0, -0.15), (1, -0.8)):
        if side and abs(x) > 0.75:
            continue
        box(f'house{side}{k}', M[f'h{(k + side) % 5}'], x, y, G - 0.005, 0.22, 0.14, 0.1, outline=0.008, bevel=0)
        box(f'roof{side}{k}', M['roof'], x, y, G + 0.095, 0.23, 0.15, 0.025, outline=0.004, bevel=0)
        fy = y - 0.074 if side == 0 else y + 0.074
        box(f'door{side}{k}', M['door'], x - 0.04, fy, G, 0.03, 0.006, 0.07, outline=0, bevel=0)
        box(f'grille{side}{k}', M['door'], x + 0.05, fy, G + 0.03, 0.05, 0.006, 0.05, outline=0, bevel=0)

# ---------- San Francisco's yellow bell tower ----------
BX, BY = -0.55, 0.15
box('belltower', M['yellow'], BX, BY, G - 0.005, 0.12, 0.12, 0.32, outline=0.01, bevel=0)
box('belltowertop', M['yellow'], BX, BY, G + 0.31, 0.09, 0.09, 0.08, outline=0.008, bevel=0)
box('belfryopen', M['window'], BX, BY - 0.047, G + 0.32, 0.04, 0.006, 0.05, outline=0, bevel=0)
lathe('belltowercap', M['yellow'], ((0.055, 0), (0.035, 0.04), (0.004, 0.08)), G + 0.385, BX, BY, segs=8, outline=0.005)

# ---------- the cane fields, royal palms and the Manaca Iznaga tower ----------
for k in range(7):
    y = 0.3 + k * 0.11
    half = math.sqrt(max(0.0, 1.25 ** 2 - y ** 2)) - 0.05
    if half < 0.2:
        continue
    box(f'canerow{k}', M['cane'], 0.1, y, G - 0.005, 2 * half - 0.1, 0.05, 0.05, outline=0.004, bevel=0)
TX, TY = 0.35, 0.55
for i in range(7):
    w = 0.16 - i * 0.015
    box(f'storey{i}', M['tower'], TX, TY, G - 0.005 + i * 0.075, w, w, 0.075, outline=0.008, bevel=0)
    for j in range(2):
        box(f'arch{i}{j}', M['window'], TX - w / 4 + j * w / 2, TY - w / 2 - 0.004, G + 0.015 + i * 0.075, 0.022, 0.006, 0.04, outline=0, bevel=0)
lathe('towercap', M['tower'], ((0.05, 0), (0.03, 0.03), (0.004, 0.07)), G + 0.52, TX, TY, segs=8, outline=0.005)
for k, (x, y) in enumerate(((-0.95, 0.3), (0.9, 0.3), (-0.2, 0.85), (0.75, 0.75), (1.0, -0.05), (-1.05, -0.4))):
    h = 0.36
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x, y, G + h), (x + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.06), 0.02, outline=0.005)

turn(before, -20)
render(G)
