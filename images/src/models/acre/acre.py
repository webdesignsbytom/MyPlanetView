# A cartoon Acre for the country maps, built in the set's shared look (../toon.py): the old city
# behind its sea walls with their round towers, the Al-Jazzar Mosque's green dome and slender
# minaret rising over the flat-roofed houses, palms, and the fishing harbour with its breakwater and
# boats in the Mediterranean. Turned a little towards the camera.
# Run: blender -b --factory-startup -P acre.py -- acre-1024.png 1024 acre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'land': toon('land', '#d8c8a0', shadow_mul=(0.86, 0.82, 0.76)),
    'wall': toon('wall', '#c8a878', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'wallDark': toon('wallDark', '#a8885a'),
    'house': toon('house', '#e4d6b8', lift=0.1),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'green': toon('green', '#3f9a5a', lift=0.15),
    'gold': toon('gold', '#f0c030', lift=0.3),
    'window': flat('window', '#3a3430'),
    'boatRed': toon('boatRed', '#c84a3a'),
    'boatBlue': toon('boatBlue', '#3a6ab0'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(2357)


def segment(c, r, z, n=30):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


loft('land', M['land'], [segment(-0.28, 1.33, -0.01), segment(-0.28, 1.33, 0.05)], outline=0.01)
T = G + 0.05

# ---------- the sea walls ----------
box('seawall', M['wall'], 0.0, -0.24, G - 0.005, 2.2, 0.08, 0.17, outline=0.01, bevel=0)
for j in range(22):
    box(f'merlon{j}', M['wallDark'], -1.05 + j * 0.1, -0.27, G + 0.16, 0.05, 0.03, 0.035, outline=0.002, bevel=0)
for k, x in enumerate((-0.85, -0.25, 0.45)):
    lathe(f'seatower{k}', M['wall'], ((0.085, 0), (0.08, 0.26)), G - 0.005, x, -0.27, segs=16, outline=0.007)
    for j in range(6):
        a = math.pi + math.pi * j / 5
        box(f'towermerlon{k}{j}', M['wallDark'], x + 0.08 * math.cos(a), -0.27 + 0.08 * math.sin(a), G + 0.25, 0.03, 0.03, 0.035, rot_z=a, outline=0.001, bevel=0)

# ---------- the Al-Jazzar Mosque ----------
MX, MY = 0.0, 0.42
box('hall', M['white'], MX, MY, T - 0.005, 0.36, 0.3, 0.16, outline=0.008, bevel=0)
for j in range(3):
    box(f'hallarch{j}', M['window'], MX - 0.1 + j * 0.1, MY - 0.152, T + 0.03, 0.05, 0.006, 0.08, outline=0, bevel=0)
lathe('dome', M['green'], ((0.14, 0), (0.14, 0.03), (0.12, 0.1), (0.07, 0.16), (0.004, 0.19)), T + 0.155, MX, MY, segs=24, outline=0.007)
rod('finial', M['gold'], (MX, MY, T + 0.34), (MX, MY, T + 0.4), 0.008, segs=6, outline=0.001)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'smalldome{sx}{sy}', M['green'], ((0.04, 0), (0.03, 0.03), (0.004, 0.05)), T + 0.155, MX + sx * 0.14, MY + sy * 0.11, segs=12, outline=0.003)
NX, NY = 0.27, 0.27
lathe('minaret', M['white'], ((0.04, 0), (0.035, 0.4)), T - 0.005, NX, NY, segs=12, outline=0.004)
lathe('balcony', M['white'], ((0.058, 0), (0.058, 0.02)), T + 0.35, NX, NY, segs=12, outline=0.003)
lathe('minarettop', M['white'], ((0.03, 0), (0.028, 0.12)), T + 0.37, NX, NY, segs=12, outline=0.003)
lathe('minaretcap', M['green'], ((0.036, 0), (0.004, 0.1)), T + 0.485, NX, NY, segs=12, outline=0.003)

# ---------- the old city's houses ----------
placed = 0
for k in range(60):
    x, y = rng.uniform(-1.0, 1.0), rng.uniform(-0.1, 0.95)
    if math.hypot(x, y) > 1.12 or (abs(x - MX) < 0.36 and 0.12 < y < 0.7):
        continue
    w, d, h = rng.uniform(0.12, 0.18), rng.uniform(0.1, 0.15), rng.uniform(0.07, 0.15)
    box(f'house{k}', M['house'], x, y, T - 0.005, w, d, h, outline=0.004, bevel=0)
    box(f'housewin{k}', M['window'], x, y - d / 2 - 0.003, T + h * 0.4, 0.03, 0.006, 0.04, outline=0, bevel=0)
    if k % 4 == 0:
        lathe(f'housedome{k}', M['white'], ((0.035, 0), (0.025, 0.025), (0.004, 0.04)), T + h - 0.005, x, y, segs=10, outline=0.002)
    placed += 1
    if placed >= 18:
        break
for k, (x, y) in enumerate(((-0.6, -0.08), (0.2, -0.1), (0.75, -0.05))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, T), (x + 0.02, y, T + 0.2), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, y, T + 0.2), (x + 0.02 + 0.08 * math.cos(a), y + 0.08 * math.sin(a), T + 0.16), 0.02, outline=0.002)

# ---------- the harbour ----------
for j, (p0, p1) in enumerate((((0.75, -0.3), (0.95, -0.68)), ((0.95, -0.68), (0.62, -0.93)))):
    bar(f'breakwater{j}', M['wall'], (p0[0], p0[1], G + 0.02), (p1[0], p1[1], G + 0.02), 0.07, outline=0.004)
for k, (x, y, mat) in enumerate(((0.45, -0.58, 'boatRed'), (0.18, -0.72, 'boatBlue'), (0.52, -0.82, 'boatBlue'))):
    loft(f'hull{k}', M[mat], [[(x - 0.06, y - 0.025, G), (x + 0.06, y - 0.025, G), (x + 0.06, y + 0.025, G), (x - 0.06, y + 0.025, G)],
                              [(x - 0.09, y - 0.035, G + 0.04), (x + 0.09, y - 0.035, G + 0.04), (x + 0.09, y + 0.035, G + 0.04), (x - 0.09, y + 0.035, G + 0.04)]], outline=0.003)
    box(f'cabin{k}', M['white'], x - 0.02, y, G + 0.035, 0.05, 0.04, 0.04, outline=0.002, bevel=0)

turn(before, -20)
render(G)
