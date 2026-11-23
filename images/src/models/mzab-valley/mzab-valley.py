# A cartoon M'Zab Valley for the country maps, built in the set's shared look (../toon.py):
# Ghardaïa in Algeria's Sahara, its pastel cube houses packed in rings up a hill to the mosque at
# the top and its tapering minaret with finger-like pinnacles, the palm grove of the oasis at the
# hill's foot, and the dry valley round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mzab-valley.py -- mzab-valley-1024.png 1024 mzab-valley.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'desert': toon('desert', '#dcc08a', shadow_mul=(0.84, 0.76, 0.72), lift=0.25),
    'hill': toon('hill', '#c9a872', shadow_mul=(0.84, 0.76, 0.72)),
    'h1': toon('h1', '#f4ecd8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2), 'h2': toon('h2', '#bcdcec', shadow_mul=(0.76, 0.82, 0.9), lift=0.2),
    'h3': toon('h3', '#f0d8a0', shadow_mul=(0.84, 0.76, 0.66), lift=0.2), 'h4': toon('h4', '#ecc0b0', shadow_mul=(0.84, 0.74, 0.76), lift=0.2),
    'minaret': toon('minaret', '#d8b888', shadow_mul=(0.84, 0.76, 0.72)),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'garden': toon('garden', '#8cc35b', shadow_mul=(0.72, 0.78, 0.78), lift=0.25),
})

G = tile(M['desert'])
before = set(bpy.data.objects)
rng = random.Random(733)

# ---------- the hill, in terraces ----------
HX, HY = 0.0, 0.2
TERRACES = [(0.82, 0.62, 0.0), (0.62, 0.47, 0.1), (0.42, 0.32, 0.2), (0.22, 0.17, 0.3)]
for k, (rx, ry, z) in enumerate(TERRACES):
    t = loft(f'terrace{k}', M['hill'], [[(HX + rx * math.cos(a), HY + ry * math.sin(a), G - 0.01 + z) for a in (2 * math.pi * j / 24 for j in range(24))],
                                       [(HX + rx * math.cos(a), HY + ry * math.sin(a), G + z + 0.1) for a in (2 * math.pi * j / 24 for j in range(24))]], outline=0.014)
    t.visible_shadow = False

# ---------- the houses, ringed round each terrace ----------
COLOURS = ('h1', 'h2', 'h1', 'h3', 'h1', 'h4')
n = 0
for k, (rx, ry, z) in enumerate(TERRACES[:3]):
    nrx, nry = TERRACES[k + 1][0], TERRACES[k + 1][1]
    mx, my = (rx + nrx) / 2, (ry + nry) / 2
    count = int(26 * mx)
    for j in range(count):
        a = 2 * math.pi * (j + 0.5 * k) / count
        x, y = HX + mx * math.cos(a), HY + my * math.sin(a)
        w = rng.uniform(0.07, 0.1)
        h = rng.uniform(0.06, 0.1)
        box(f'house{n}', M[COLOURS[n % len(COLOURS)]], x, y, G + z + 0.095, w, w * rng.uniform(0.8, 1.1), h, rot_z=a, outline=0.006, bevel=0)
        if math.sin(a) < 0:
            box(f'housewin{n}', M['window'], x + (w / 2 + 0.004) * math.cos(a), y + (w / 2 + 0.004) * math.sin(a), G + z + 0.095 + h * 0.4, 0.01, 0.016, 0.022, rot_z=a,
                outline=0, bevel=0)
        n += 1

# ---------- the mosque and its minaret at the top ----------
TZ = G + 0.4
box('mosque', M['h1'], HX - 0.05, HY + 0.02, TZ - 0.005, 0.22, 0.18, 0.08, outline=0.01, bevel=0)
MX, MY = HX + 0.07, HY - 0.02
loft('minaret', M['minaret'], [[(MX - 0.05, MY - 0.05, TZ - 0.005), (MX + 0.05, MY - 0.05, TZ - 0.005), (MX + 0.05, MY + 0.05, TZ - 0.005), (MX - 0.05, MY + 0.05, TZ - 0.005)],
                               [(MX - 0.03, MY - 0.03, TZ + 0.34), (MX + 0.03, MY - 0.03, TZ + 0.34), (MX + 0.03, MY + 0.03, TZ + 0.34), (MX - 0.03, MY + 0.03, TZ + 0.34)]],
     outline=0.01)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'pinnacle{sx}{sy}', M['minaret'], ((0.01, 0), (0.008, 0.05), (0.002, 0.07)), TZ + 0.335, MX + sx * 0.024, MY + sy * 0.024, segs=6, outline=0.003)
for k in range(3):
    box(f'minaretslit{k}', M['window'], MX, MY - 0.045 + k * 0.004, TZ + 0.08 + k * 0.09, 0.012, 0.01, 0.03, outline=0, bevel=0)

# ---------- the palm grove at the foot ----------
for k in range(8):
    x = -0.95 + k * 0.27 + rng.uniform(-0.04, 0.04)
    y = -0.75 + rng.uniform(-0.12, 0.12)
    if math.hypot(x, y) > 1.25:
        continue
    box(f'garden{k}', M['garden'], x, y, G - 0.004, 0.2, 0.16, 0.008, outline=0.003, bevel=0)
    h = rng.uniform(0.22, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)

turn(before, -20)
render(G)
