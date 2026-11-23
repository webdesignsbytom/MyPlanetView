# A cartoon Island of Saint-Louis for the country maps, built in the set's shared look
# (../toon.py): the steel arches of the Faidherbe Bridge crossing the Senegal river to the island,
# the colonial town's ochre, yellow and pink houses with wooden balconies and tiled roofs, and the
# long painted fishing pirogues on the water. Turned a little towards the camera.
# Run: blender -b --factory-startup -P saint-louis.py -- saint-louis-1024.png 1024 saint-louis.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#4a8ab0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'sand': toon('sand', '#e0c890', shadow_mul=(0.86, 0.8, 0.74)),
    'steel': toon('steel', '#a8b0b8', shadow_mul=(0.8, 0.84, 0.9), lift=0.15),
    'deck': toon('deck', '#6a6870'),
    'h0': toon('h0', '#e8b060'), 'h1': toon('h1', '#f0d070'), 'h2': toon('h2', '#e89a90'), 'h3': toon('h3', '#f4ecd8', lift=0.2),
    'roof': toon('roof', '#c4573a'),
    'balcony': toon('balcony', '#7a4a2e'),
    'window': flat('window', '#3a2e2a'),
    'shutter': toon('shutter', '#3f8a6a'),
    'p0': toon('p0', '#e8402c'), 'p1': toon('p1', '#2f6fc0'), 'p2': toon('p2', '#f0c030', lift=0.25), 'p3': toon('p3', '#3f9a4a'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(2031)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


isle = loft('island', M['sand'], [segment(0.15, 1.4, -0.01), segment(0.2, 1.37, 0.06)], outline=0.012)
isle.visible_shadow = False
T = G + 0.06

# ---------- the colonial houses ----------
for k in range(7):
    x = -1.0 + k * 0.3
    y = 0.42 + (0.12 if k % 2 else 0.0)
    if math.hypot(x, y) > 1.15:
        continue
    h = 0.2 if k % 3 else 0.15
    box(f'house{k}', M[f'h{k % 4}'], x, y, T - 0.005, 0.26, 0.2, h, outline=0.008, bevel=0)
    for j in range(3):
        box(f'housewin{k}{j}', M['shutter'], x - 0.08 + j * 0.08, y - 0.102, T + h * 0.62, 0.035, 0.006, 0.05, outline=0, bevel=0)
        box(f'housedoor{k}{j}', M['window'], x - 0.08 + j * 0.08, y - 0.102, T, 0.035, 0.006, 0.07, outline=0, bevel=0)
    box(f'balcony{k}', M['balcony'], x, y - 0.12, T + h * 0.48, 0.26, 0.04, 0.012, outline=0.003, bevel=0)
    bar(f'balconyrail{k}', M['balcony'], (x - 0.13, y - 0.14, T + h * 0.48 + 0.04), (x + 0.13, y - 0.14, T + h * 0.48 + 0.04), 0.008, outline=0)
    loft(f'roof{k}', M['roof'], [[(x - 0.14, y - 0.11, T + h - 0.005), (x + 0.14, y - 0.11, T + h - 0.005), (x + 0.14, y + 0.11, T + h - 0.005), (x - 0.14, y + 0.11, T + h - 0.005)],
                                 [(x - 0.06, y - 0.03, T + h + 0.07), (x + 0.06, y - 0.03, T + h + 0.07), (x + 0.06, y + 0.03, T + h + 0.07), (x - 0.06, y + 0.03, T + h + 0.07)]],
         outline=0.006)
for k, x in enumerate((-0.6, 0.6)):
    rod(f'palmtrunk{k}', M['trunk'], (x, 0.82, T), (x + 0.02, 0.82, T + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, 0.82, T + 0.3), (x + 0.02 + 0.1 * math.cos(b), 0.82 + 0.1 * math.sin(b), T + 0.25), 0.019, outline=0.005)

# ---------- the Faidherbe Bridge, coming to the island from the right ----------
X0, X1 = 0.55, 0.55
Y0, Y1 = -1.2, 0.25
box('bridgedeck', M['deck'], X0, (Y0 + Y1) / 2, G + 0.05, 0.16, Y1 - Y0, 0.02, outline=0.005, bevel=0)
for k in range(4):
    y = Y0 + 0.05 + k * 0.45
    if y > -0.0:
        rod(f'pier{k}', M['steel'], (X0, y, G - 0.005), (X0, y, G + 0.05), 0.025, segs=8, outline=0.004)
        continue
    rod(f'pier{k}', M['steel'], (X0, y, G - 0.005), (X0, y, G + 0.05), 0.025, segs=8, outline=0.004)
spans = [(Y0 + 0.05, Y0 + 0.5), (Y0 + 0.5, Y0 + 0.95), (Y0 + 0.95, Y1 - 0.05)]
for s, (ya, yb) in enumerate(spans):
    for side in (-1, 1):
        x = X0 + side * 0.075
        pts = []
        for j in range(9):
            t = j / 8
            pts.append((x, ya + (yb - ya) * t, G + 0.07 + 0.16 * math.sin(math.pi * t)))
        for j in range(8):
            bar(f'chord{s}{side}{j}', M['steel'], pts[j], pts[j + 1], 0.014, outline=0.003)
        for j in range(1, 8):
            bar(f'hanger{s}{side}{j}', M['steel'], (pts[j][0], pts[j][1], G + 0.07), pts[j], 0.008, outline=0)
        bar(f'bottom{s}{side}', M['steel'], (x, ya, G + 0.07), (x, yb, G + 0.07), 0.012, outline=0.002)
    for j in (2, 4, 6):
        t = j / 8
        z = G + 0.07 + 0.16 * math.sin(math.pi * t)
        bar(f'brace{s}{j}', M['steel'], (X0 - 0.075, ya + (yb - ya) * t, z), (X0 + 0.075, ya + (yb - ya) * t, z), 0.008, outline=0)

# ---------- the pirogues ----------
for k, (x, y, a) in enumerate(((-0.6, -0.35, 0.2), (-0.2, -0.65, -0.15), (-0.85, -0.75, 0.4), (0.05, -0.25, 0.05))):
    box(f'pirogue{k}', M[f'p{k % 4}'], x, y, G - 0.002, 0.42, 0.07, 0.035, rot_z=a, outline=0.005, bevel=0)
    box(f'pirogueband{k}', M[f'p{(k + 2) % 4}'], x, y, G + 0.03, 0.43, 0.075, 0.012, rot_z=a, outline=0, bevel=0)
    for e in (-1, 1):
        lathe(f'piroguetip{k}{e}', M[f'p{k % 4}'], ((0.025, 0), (0.004, 0.09)), G + 0.005, x + e * 0.21 * math.cos(a), y + e * 0.21 * math.sin(a), segs=4, outline=0.003, smooth=False)

turn(before, -20)
render(G)
