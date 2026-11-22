# A cartoon Bahla Fort for the country maps, built in the set's shared look (../toon.py): Oman's great
# mud-brick fort on its rocky rise, its crenellated walls and round and square towers, the tall keep
# of Al-Qasaba inside with its little windows, the date-palm groves of the oasis round it, and the
# bare Hajar mountains behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bahla-fort.py -- bahla-fort-1024.png 1024 bahla-fort.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#dcc394', shadow_mul=(0.84, 0.74, 0.62), lift=0.25),
    'rock': toon('rock', '#a68a6a', shadow_mul=(0.8, 0.74, 0.78)),
    'mud': toon('mud', '#c9a372', shadow_mul=(0.84, 0.74, 0.66)),
    'mudLight': toon('mudLight', '#d8b688', shadow_mul=(0.84, 0.74, 0.66)),
    'window': flat('window', '#4a3428'),
    'palm': toon('palm', '#5a9e4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'mountain': toon('mountain', '#9a7a62', shadow_mul=(0.8, 0.72, 0.78)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(311)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the Hajar mountains behind ----------
for k, (cx, cy, r, h) in enumerate(((-0.45, 0.96, 0.42, 0.75), (0.4, 0.98, 0.4, 0.62))):
    m = loft(f'mountain{k}', M['mountain'], [ring(cx, cy, r, r * 0.5, -0.01, 0.03), ring(cx, cy, r * 0.62, r * 0.32, h * 0.5, 0.12),
                                             ring(cx, cy, r * 0.28, r * 0.15, h * 0.85, 0.14), ring(cx, cy, 0.02, 0.02, h, 0.0)], outline=0.035)
    m.visible_shadow = False

# ---------- the rocky rise ----------
FX, FY = 0.0, 0.15
rise = loft('rise', M['rock'], [ring(FX, FY, 0.85, 0.62, -0.01, 0.05), ring(FX, FY, 0.75, 0.54, 0.1, 0.05), ring(FX, FY, 0.7, 0.5, 0.14, 0.02)], outline=0.03)
rise.visible_shadow = False
T = G + 0.14


def crenels(name, x0, y0, x1, y1, z):
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    n = max(1, int(length / 0.06))
    for k in range(n):
        t = (k + 0.5) / n
        lathe(f'{name}{k}', M['mudLight'], ((0.016, 0), (0.012, 0.03), (0.002, 0.045)), z, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, segs=6, outline=0.004,
              smooth=False)


# ---------- the outer walls, round towers at the corners, square ones between ----------
WALL = [(-0.55, -0.25), (0.6, -0.3), (0.62, 0.48), (-0.5, 0.52)]
H = 0.22
for k, ((x0, y0), (x1, y1)) in enumerate(zip(WALL, WALL[1:] + WALL[:1])):
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    loft(f'wall{k}', M['mud'],
         [[(x0 - 0.02 * math.sin(a), y0 + 0.02 * math.cos(a), T - 0.01), (x1 - 0.02 * math.sin(a), y1 + 0.02 * math.cos(a), T - 0.01),
           (x1 + 0.03 * math.sin(a), y1 - 0.03 * math.cos(a), T - 0.01), (x0 + 0.03 * math.sin(a), y0 - 0.03 * math.cos(a), T - 0.01)],
          [(x0 - 0.02 * math.sin(a), y0 + 0.02 * math.cos(a), T + H), (x1 - 0.02 * math.sin(a), y1 + 0.02 * math.cos(a), T + H),
           (x1 + 0.015 * math.sin(a), y1 - 0.015 * math.cos(a), T + H), (x0 + 0.015 * math.sin(a), y0 - 0.015 * math.cos(a), T + H)]],
         outline=0.018, bevel=0.006)
    crenels(f'crenel{k}', x0, y0, x1, y1, T + H)
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    box(f'squaretower{k}', M['mud'], mx, my, T - 0.01, 0.14, 0.14, H + 0.12, rot_z=a, outline=0.016, bevel=0.006)
    crenels(f'sqcrenel{k}', mx - 0.06 * math.cos(a), my - 0.06 * math.sin(a), mx + 0.06 * math.cos(a), my + 0.06 * math.sin(a), T + H + 0.11)
for k, (x, y) in enumerate(WALL):
    lathe(f'roundtower{k}', M['mud'], ((0.1, 0), (0.085, H + 0.16)), T - 0.01, x, y, segs=20, outline=0.018)
    for j in range(8):
        a = 2 * math.pi * j / 8
        lathe(f'roundcrenel{k}{j}', M['mudLight'], ((0.016, 0), (0.012, 0.03), (0.002, 0.045)), T + H + 0.15, x + 0.075 * math.cos(a), y + 0.075 * math.sin(a),
              segs=6, outline=0.004, smooth=False)
    box(f'roundslit{k}', M['window'], x, y - 0.095, T + 0.14, 0.02, 0.01, 0.05, outline=0, bevel=0)
box('gate', M['window'], 0.02, -0.29, T, 0.08, 0.01, 0.13, outline=0, bevel=0)

# ---------- the keep, Al-Qasaba, rising inside ----------
KX, KY = -0.1, 0.18
box('keep', M['mud'], KX, KY, T - 0.01, 0.4, 0.3, 0.42, outline=0.022, bevel=0.008)
box('keepupper', M['mudLight'], KX - 0.05, KY + 0.03, T + 0.41, 0.24, 0.2, 0.16, outline=0.018, bevel=0.006)
crenels('keepcrenelf', KX - 0.2, KY - 0.15, KX + 0.2, KY - 0.15, T + 0.41)
crenels('keepupcrenel', KX - 0.17, KY - 0.07, KX + 0.07, KY - 0.07, T + 0.57)
for row, z in enumerate((0.15, 0.3)):
    for k in range(4):
        box(f'keepwin{row}{k}', M['window'], KX - 0.13 + k * 0.087, KY - 0.155, T + z, 0.025, 0.01, 0.045, outline=0, bevel=0)

# ---------- the date palms of the oasis ----------
for k in range(14):
    a = math.radians(rng.uniform(190, 350)) if k < 9 else math.radians(rng.choice((rng.uniform(150, 185), rng.uniform(355, 390))))
    r = rng.uniform(0.95, 1.22)
    x, y = r * math.cos(a), r * math.sin(a) * 0.95
    h = rng.uniform(0.26, 0.36)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.016, r2=0.012, segs=8, outline=0.007)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.12 * math.cos(b), y + 0.12 * math.sin(b), G + h - 0.06), 0.024, outline=0.006)

turn(before, -20)
render(G)
