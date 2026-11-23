# A cartoon Singapore Botanic Gardens for the country maps, built in the set's shared look
# (../toon.py): the white Victorian bandstand on its little hill, the great spreading tembusu and
# rain trees, beds of orchids in every colour, Swan Lake with its swans, and a few palms. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P botanic-gardens.py -- botanic-gardens-1024.png 1024 botanic-gardens.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#6cb84a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mound': toon('mound', '#7cc458', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.2),
    'lake': toon('lake', '#4a9ac0', lift=0.3),
    'tree': toon('tree', '#3f8a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'treeLight': toon('treeLight', '#5aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a6050'),
    'bed': toon('bed', '#8a6040'),
    'o0': toon('o0', '#b45ad8', lift=0.2), 'o1': toon('o1', '#f07ab0', lift=0.2), 'o2': toon('o2', '#f8d040', lift=0.25), 'o3': toon('o3', '#f8f4fc', lift=0.2),
    'beak': toon('beak', '#e87a30'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2029)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the bandstand on its mound ----------
BX, BY = 0.1, 0.25
lathe('mound', M['mound'], ((0.55, 0), (0.4, 0.08), (0.3, 0.1)), G - 0.01, BX, BY, segs=24, outline=0.01)
T = G + 0.09
lathe('bandbase', M['white'], ((0.25, 0), (0.25, 0.04)), T, BX, BY, segs=8, outline=0.007, smooth=False)
for j in range(8):
    a = 2 * math.pi * j / 8 + math.pi / 8
    rod(f'bandcol{j}', M['white'], (BX + 0.21 * math.cos(a), BY + 0.21 * math.sin(a), T + 0.04), (BX + 0.21 * math.cos(a), BY + 0.21 * math.sin(a), T + 0.27), 0.013, segs=8, outline=0.004)
lathe('bandeave', M['white'], ((0.27, 0), (0.27, 0.03)), T + 0.27, BX, BY, segs=8, outline=0.006, smooth=False)
lathe('bandroof', M['white'], ((0.3, 0), (0.17, 0.09), (0.08, 0.15), (0.02, 0.2)), T + 0.3, BX, BY, segs=8, outline=0.008, smooth=False)
lathe('bandfinial', M['white'], ((0.02, 0), (0.008, 0.08)), T + 0.5, BX, BY, segs=6, outline=0.003)

# ---------- the great trees ----------
for k, (x, y, r) in enumerate(((-0.75, 0.6, 0.3), (0.85, 0.55, 0.26), (-0.15, 0.95, 0.24))):
    rod(f'bigtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.28), 0.035, r2=0.025, segs=8, outline=0.005)
    for j, (dx, dy, dz, s) in enumerate(((0, 0, 0.36, 1.0), (-r * 0.6, 0.05, 0.32, 0.7), (r * 0.6, -0.03, 0.33, 0.7))):
        b = ball(f'canopy{k}{j}', M['tree' if j == 0 else 'treeLight'], 0, 0, 0, r * s, outline=0.012)
        b.scale = (1.0, 1.0, 0.55)
        b.location = (x + dx, y + dy, G + dz)

# ---------- Swan Lake and its swans ----------
LX, LY = -0.55, -0.45
loft('lake', M['lake'], [ring(LX, LY, 0.5, 0.32, -0.004, 1), ring(LX, LY, 0.5, 0.32, 0.004, 1)], outline=0.005, smooth=True)
for k, (x, y) in enumerate(((LX - 0.15, LY + 0.05), (LX + 0.18, LY - 0.08))):
    b = ball(f'swan{k}', M['white'], 0, 0, 0, 0.045, outline=0.005)
    b.scale = (1.5, 0.9, 0.7)
    b.location = (x, y, G + 0.02)
    rod(f'swanneck{k}', M['white'], (x + 0.05, y, G + 0.03), (x + 0.055, y, G + 0.1), 0.012, segs=6, outline=0.003)
    ball(f'swanhead{k}', M['white'], x + 0.06, y, G + 0.105, 0.018, outline=0.003)
    rod(f'swanbeak{k}', M['beak'], (x + 0.07, y, G + 0.105), (x + 0.1, y, G + 0.1), 0.006, segs=4, outline=0)

# ---------- the orchid beds ----------
for i in range(3):
    x0, y0 = 0.2 + i * 0.3, -0.55 + 0.1 * i
    lathe(f'bed{i}', M['bed'], ((0.13, 0), (0.13, 0.03)), G - 0.005, x0, y0, segs=16, outline=0.005)
    for j in range(9):
        a = 2 * math.pi * j / 9
        rr = 0.07 if j % 2 else 0.04
        ball(f'orchid{i}{j}', M[f'o{(i + j) % 4}'], x0 + rr * math.cos(a), y0 + rr * math.sin(a), G + 0.06, 0.03, outline=0.004)
    ball(f'orchidmid{i}', M[f'o{(i + 2) % 4}'], x0, y0, G + 0.08, 0.035, outline=0.004)

# ---------- palms ----------
for k, (x, y) in enumerate(((1.05, -0.05), (-1.1, 0.0), (0.75, -0.9))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.32), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.32), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.27), 0.019, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
