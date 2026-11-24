# A cartoon Temple of Apollo Epikourios at Bassae for the country maps, built in the set's shared look
# (../toon.py): the grey limestone Doric temple standing alone high in the Arcadian mountains, its
# long rows of columns on the stepped base, the inner chamber and the remains of its architrave, and
# round it the bare rocky slopes, the oak trees and the far blue peaks. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P bassae.py -- bassae-1024.png 1024 bassae.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#a8a878', shadow_mul=(0.8, 0.8, 0.8), lift=0.2),
    'limestone': toon('limestone', '#c8c4b8', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'limestoneDark': toon('limestoneDark', '#a8a498'),
    'rock': toon('rock', '#9a9282'),
    'mountain': toon('mountain', '#8a9ab0', shadow_mul=(0.82, 0.86, 0.92)),
    'oak': toon('oak', '#5a8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(420)

# ---------- the mountains behind ----------
for k, (x, y, r, h) in enumerate(((-0.6, 0.85, 0.4, 0.4), (0.15, 0.95, 0.35, 0.5), (0.75, 0.75, 0.32, 0.36))):
    if math.hypot(x, y) + r > 1.36:
        r = 1.36 - math.hypot(x, y)
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.25, h * 0.9), (0.004, h)), G - 0.01, x, y, segs=12, outline=0.008, smooth=False)
    mt.visible_shadow = False
for k in range(9):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(-0.9, 0.5)
    if math.hypot(x, y) > 1.15 or (abs(x) < 0.55 and abs(y) < 0.35):
        continue
    b = ball(f'rock{k}', M['rock'], 0, 0, 0, rng.uniform(0.04, 0.08), outline=0.004)
    b.scale = (1.3, 1.0, 0.6)
    b.location = (x, y, G + 0.01)

# ---------- the temple: 6 columns by 15, oriented north-south (here across the tile) ----------
TX, TY = 0.0, 0.0
L, Wd = 0.92, 0.42      # its length (left to right) and width
for k, (dl, dw, h) in enumerate(((0.08, 0.08, 0.03), (0.04, 0.04, 0.03), (0.0, 0.0, 0.03))):
    box(f'step{k}', M['limestoneDark'], TX, TY, G - 0.005 + k * 0.03, L + dl * 2 + 0.06, Wd + dw * 2 + 0.06, h, outline=0.003, bevel=0)
SZ = G + 0.085
CH = 0.26
for j in range(15):
    x = TX - L / 2 + j * L / 14
    for fy in (-1, 1):
        rod(f'column{j}{fy}', M['limestone'], (x, TY + fy * Wd / 2, SZ), (x, TY + fy * Wd / 2, SZ + CH), 0.022, r2=0.018, segs=12, outline=0.003)
        box(f'capital{j}{fy}', M['limestoneDark'], x, TY + fy * Wd / 2, SZ + CH, 0.05, 0.05, 0.015, outline=0.001, bevel=0)
for i in range(1, 5):
    y = TY - Wd / 2 + i * Wd / 5
    for x in (TX - L / 2, TX + L / 2):
        rod(f'endcolumn{i}{x:.2f}', M['limestone'], (x, y, SZ), (x, y, SZ + CH), 0.022, r2=0.018, segs=12, outline=0.003)
        box(f'endcapital{i}{x:.2f}', M['limestoneDark'], x, y, SZ + CH, 0.05, 0.05, 0.015, outline=0.001, bevel=0)
# the cella inside, lower than the colonnade
box('cella', M['limestoneDark'], TX, TY, SZ, L - 0.2, Wd - 0.16, CH - 0.04, outline=0.005, bevel=0)
# the architrave, broken: whole along the back row, in pieces along the front
box('architraveback', M['limestone'], TX, TY + Wd / 2, SZ + CH + 0.015, L + 0.05, 0.06, 0.05, outline=0.004, bevel=0)
for k, (x0, x1) in enumerate(((-L / 2 - 0.025, -0.15), (0.05, 0.3))):
    box(f'architravefront{k}', M['limestone'], TX + (x0 + x1) / 2, TY - Wd / 2, SZ + CH + 0.015, x1 - x0, 0.06, 0.05, outline=0.004, bevel=0)
for k, x in enumerate((TX - L / 2, TX + L / 2)):
    box(f'architraveend{k}', M['limestone'], x, TY, SZ + CH + 0.015, 0.06, Wd + 0.06, 0.05, outline=0.004, bevel=0)

# ---------- oaks ----------
for k, (x, y) in enumerate(((-0.75, -0.45), (0.75, -0.5), (-0.4, -0.85), (0.35, -0.85), (-0.9, 0.2), (0.95, 0.15))):
    if math.hypot(x, y) > 1.15:
        continue
    rod(f'oaktrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.015, segs=6, outline=0.002)
    ball(f'oak{k}', M['oak'], x, y, G + 0.16, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
