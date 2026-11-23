# A cartoon Fort Louis for the country maps, built in the set's shared look (../toon.py): the
# French fort on its green hill over Marigot, Saint Martin, its stone walls and bastions, cannons
# looking out to sea and the tricolour, the town's pastel houses along the quay below, and yachts in
# the bay. Turned a little towards the camera.
# Run: blender -b --factory-startup -P fort-louis.py -- fort-louis-1024.png 1024 fort-louis.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#a89a86', shadow_mul=(0.82, 0.8, 0.84)),
    'stoneDark': toon('stoneDark', '#8a7c6a', shadow_mul=(0.82, 0.8, 0.84)),
    'cannon': toon('cannon', '#34323a', shadow_mul=(0.8, 0.8, 0.9), lift=0.15),
    'quay': toon('quay', '#d8ccb4', shadow_mul=(0.8, 0.8, 0.88)),
    'h0': toon('h0', '#f0c8a0'), 'h1': toon('h1', '#a8d8c8'), 'h2': toon('h2', '#f4e08a'), 'h3': toon('h3', '#e8a0a8'), 'h4': toon('h4', '#a8c4e8'),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#3a3640'),
    'blue': toon('flagBlue', '#2a4aa0'), 'white': toon('flagWhite', '#f8f6f0', lift=0.2), 'red': toon('flagRed', '#d8382c'),
    'pole': toon('pole', '#d8d4cc'),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'mast': toon('mast', '#b7bcc4'),
    'tree': toon('tree', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1153)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the hill ----------
HX, HY = 0.0, 0.38
h = loft('hill', M['hill'], [ring(HX, HY, 1.0, 0.62, -0.01, 1), ring(HX, HY + 0.03, 0.62, 0.38, 0.26, 1), ring(HX, HY + 0.04, 0.44, 0.28, 0.34, 1)], outline=0.018, smooth=True)
h.visible_shadow = False
T = G + 0.34

# ---------- the fort: walls round a pentagon with bastions at its corners ----------
FX, FY = HX, HY + 0.04
CORNERS = [(FX + 0.38 * math.cos(a), FY + 0.24 * math.sin(a)) for a in (math.radians(-90 + 72 * k) for k in range(5))]
for k in range(5):
    (x0, y0), (x1, y1) = CORNERS[k], CORNERS[(k + 1) % 5]
    L = math.hypot(x1 - x0, y1 - y0)
    box(f'wall{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.03, L, 0.04, 0.11, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.008, bevel=0)
    x, y = CORNERS[k]
    box(f'bastion{k}', M['stoneDark'], x, y, T - 0.03, 0.09, 0.09, 0.13, rot_z=math.radians(45 + 72 * k), outline=0.008, bevel=0)
    for j in range(3):
        f = (j + 1) / 4
        box(f'merlon{k}{j}', M['stone'], x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, T + 0.08, 0.035, 0.045, 0.025, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.004, bevel=0)
for k, (x, a) in enumerate(((-0.2, -1.9), (0.0, -1.57), (0.2, -1.25))):
    y = FY - 0.24 * math.sqrt(max(0, 1 - (x / 0.38) ** 2)) + 0.02
    rod(f'cannon{k}', M['cannon'], (x, y + 0.04, T + 0.05), (x + 0.1 * math.cos(a), y + 0.1 * math.sin(a), T + 0.06), 0.016, r2=0.012, segs=10, outline=0.004)
    for side in (-1, 1):
        ball(f'cannonwheel{k}{side}', M['cannon'], x + side * 0.018, y + 0.04, T + 0.035, 0.016, outline=0.003)
box('magazine', M['stoneDark'], FX + 0.08, FY + 0.06, T - 0.01, 0.16, 0.1, 0.07, outline=0.007, bevel=0)
rod('flagpole', M['pole'], (FX - 0.12, FY + 0.05, T), (FX - 0.12, FY + 0.05, T + 0.32), 0.006, segs=6, outline=0.002)
for k, c in enumerate(('blue', 'white', 'red')):
    box(f'flag{k}', M[c], FX - 0.12 + 0.025 + k * 0.042, FY + 0.05, T + 0.24, 0.042, 0.006, 0.075, outline=0.002, bevel=0)

# ---------- Marigot along the quay below ----------
box('quay', M['quay'], 0.0, -0.3, G - 0.005, 2.0, 0.22, 0.03, outline=0.01, bevel=0)
for k in range(9):
    x = -0.88 + k * 0.22
    if abs(x) > 1.0:
        continue
    w = rng.uniform(0.14, 0.17)
    hh = rng.uniform(0.09, 0.12)
    box(f'house{k}', M[f'h{k % 5}'], x, -0.24, G + 0.02, w, 0.12, hh, outline=0.008, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, -0.24, G + 0.02 + hh - 0.005, w + 0.02, 0.05, outline=0.006)
    for j in range(2):
        box(f'housewin{k}{j}', M['window'], x - w / 4 + j * w / 2, -0.303, G + 0.02 + hh * 0.5, 0.025, 0.006, 0.03, outline=0, bevel=0)
for k in range(6):
    t = math.radians(30 + k * 24)
    ball(f'hilltree{k}', M['tree'], HX + 0.8 * math.cos(t), HY + 0.45 * math.sin(t), G + 0.12, rng.uniform(0.06, 0.08), outline=0.01)

# ---------- yachts in the bay ----------
for k, (x, y) in enumerate(((-0.6, -0.65), (-0.15, -0.8), (0.3, -0.62), (0.7, -0.75))):
    loft(f'hull{k}', M['boat'], [[(x - 0.08, y, G - 0.002), (x + 0.05, y - 0.022, G - 0.002), (x + 0.09, y, G - 0.002), (x + 0.05, y + 0.022, G - 0.002)],
                                 [(x - 0.09, y, G + 0.03), (x + 0.05, y - 0.03, G + 0.03), (x + 0.11, y, G + 0.03), (x + 0.05, y + 0.03, G + 0.03)]], outline=0.007)
    rod(f'mast{k}', M['mast'], (x, y, G + 0.03), (x, y, G + 0.26), 0.004, segs=6, outline=0)

turn(before, -20)
render(G)
