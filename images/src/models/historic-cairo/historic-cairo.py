# A cartoon Historic Cairo for the country maps, built in the set's shared look (../toon.py): the
# Citadel on its spur of the Muqattam hills, its walls and round towers, and the Mosque of Muhammad
# Ali on top, its great dome over a cascade of half domes and its two slender pencil minarets, with
# the old city's flat roofs and minarets below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P historic-cairo.py -- historic-cairo-1024.png 1024 historic-cairo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#d8c49a', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'hill': toon('hill', '#c8a878', shadow_mul=(0.86, 0.8, 0.74)),
    'wall': toon('wall', '#c8b08a', shadow_mul=(0.86, 0.82, 0.78)),
    'alabaster': toon('alabaster', '#ece6dc', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'dome': toon('dome', '#8a9098', shadow_mul=(0.84, 0.86, 0.92), lift=0.05),
    'house0': toon('house0', '#d8c0a0'), 'house1': toon('house1', '#c8a888'), 'house2': toon('house2', '#e0d0b8'),
    'window': flat('window', '#3a3230'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(2253)

# ---------- the hill and the Citadel's walls ----------
CX, CY = 0.0, 0.35
hl = lathe('hill', M['hill'], ((0.85, 0), (0.7, 0.12), (0.55, 0.18)), G - 0.01, CX, CY, segs=10, outline=0.012, smooth=False)
hl.visible_shadow = False
T = G + 0.17
for k in range(10):
    a0, a1 = 2 * math.pi * k / 10, 2 * math.pi * (k + 1) / 10
    x0, y0, x1, y1 = CX + 0.5 * math.cos(a0), CY + 0.42 * math.sin(a0), CX + 0.5 * math.cos(a1), CY + 0.42 * math.sin(a1)
    box(f'citadelwall{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.01, math.hypot(x1 - x0, y1 - y0) + 0.02, 0.04, 0.1, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.004, bevel=0)
    lathe(f'citadeltower{k}', M['wall'], ((0.05, 0), (0.05, 0.14)), T - 0.01, x0, y0, segs=10, outline=0.004)

# ---------- the Mosque of Muhammad Ali ----------
MX, MY = 0.05, 0.4
box('mosque', M['alabaster'], MX, MY, T - 0.005, 0.42, 0.36, 0.17, outline=0.01, bevel=0)
for j in range(4):
    box(f'mosquewin{j}', M['window'], MX - 0.15 + j * 0.1, MY - 0.182, T + 0.05, 0.04, 0.006, 0.07, outline=0, bevel=0)
lathe('drum', M['alabaster'], ((0.13, 0), (0.13, 0.08)), T + 0.165, MX, MY, segs=20, outline=0.006)
lathe('maindome', M['dome'], ((0.14, 0), (0.135, 0.07), (0.09, 0.14), (0.03, 0.17), (0.004, 0.18)), T + 0.245, MX, MY, segs=24, outline=0.008)
lathe('mainfinial', M['dome'], ((0.012, 0), (0.004, 0.06)), T + 0.42, MX, MY, segs=6, outline=0.002)
for k, (dx, dy) in enumerate(((0.17, 0.0), (-0.17, 0.0), (0.0, -0.15), (0.0, 0.15))):
    lathe(f'halfdome{k}', M['dome'], ((0.08, 0), (0.07, 0.05), (0.004, 0.08)), T + 0.165, MX + dx, MY + dy, segs=16, outline=0.005)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'cornerdome{sx}{sy}', M['dome'], ((0.045, 0), (0.035, 0.03), (0.004, 0.05)), T + 0.165, MX + sx * 0.17, MY + sy * 0.14, segs=12, outline=0.004)
for s in (-1, 1):
    mx, my = MX + s * 0.25, MY - 0.12
    lathe(f'minaret{s}', M['alabaster'], ((0.025, 0), (0.022, 0.5), (0.02, 0.58)), T - 0.005, mx, my, segs=8, outline=0.004, smooth=False)
    for z in (0.3, 0.45):
        lathe(f'minaretbalcony{s}{z}', M['alabaster'], ((0.035, 0), (0.035, 0.015)), T + z, mx, my, segs=8, outline=0.002, smooth=False)
    lathe(f'minaretcap{s}', M['dome'], ((0.022, 0), (0.004, 0.12)), T + 0.575, mx, my, segs=8, outline=0.003, smooth=False)

# ---------- the old city below ----------
for k in range(16):
    x, y = rng.uniform(-1.05, 1.05), rng.uniform(-0.95, -0.35)
    if math.hypot(x, y) > 1.15:
        continue
    h = rng.uniform(0.06, 0.12)
    box(f'house{k}', M[f'house{k % 3}'], x, y, G - 0.005, rng.uniform(0.12, 0.18), 0.12, h, outline=0.005, bevel=0)
    box(f'housewin{k}', M['window'], x, y - 0.062, G + h * 0.5, 0.03, 0.006, 0.025, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.55, -0.55), (0.45, -0.65))):
    lathe(f'oldminaret{k}', M['house2'], ((0.025, 0), (0.02, 0.26)), G - 0.005, x, y, segs=8, outline=0.003, smooth=False)
    lathe(f'oldminarettop{k}', M['house1'], ((0.028, 0), (0.004, 0.06)), G + 0.255, x, y, segs=8, outline=0.002)
for k, (x, y) in enumerate(((-0.95, -0.2), (0.95, -0.1))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.28), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.28), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.23), 0.019, outline=0.005)

turn(before, -20)
render(G)
