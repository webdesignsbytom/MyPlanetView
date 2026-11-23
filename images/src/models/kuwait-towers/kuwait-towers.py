# Cartoon Kuwait Towers for the country maps, built in the set's shared look (../toon.py) on a tile
# of the Gulf's water: the three needles on their point of land, the tallest with its great sphere
# and the little observation sphere above it under the spire, the second with its one sphere, the
# third bare, carrying its lights; the spheres studded with blue, green and pale discs in rows,
# and palms along the promenade.
# Run: blender -b --factory-startup -P kuwait-towers.py -- kuwait-towers-1024.png 1024 kuwait-towers.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'land': toon('land', '#e8d9b5', lift=0.25),
    'promenade': toon('promenade', '#f3ede0', shadow_mul=(0.82, 0.82, 0.9), lift=0.2),
    'needle': toon('needle', '#eef0f2', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'sphere': toon('sphere', '#cfd6de', shadow_mul=(0.78, 0.8, 0.9), lift=0.25),
    'discBlue': flat('discBlue', '#2f6fb8'),
    'discGreen': flat('discGreen', '#2e9a74'),
    'discPale': flat('discPale', '#8db3d4'),
    'glass': flat('glass', '#2f3f5a'),
    'light': toon('light', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sea'])
rng = random.Random(97)

# ---------- the point of land and its promenade ----------
LAND = [(-1.2, 0.75), (-1.05, 0.05), (-0.75, -0.45), (-0.2, -0.7), (0.45, -0.62), (0.95, -0.3), (1.2, 0.25), (1.05, 0.8), (0.4, 1.25),
        (-0.5, 1.25)]
loft('land', M['land'], [[(x, y, G - 0.01) for x, y in LAND], [(x, y, G + 0.04) for x, y in LAND]], outline=0.025)
INNER = [(x * 0.9 + 0.01, y * 0.9 + 0.04) for x, y in LAND]
loft('promenade', M['promenade'], [[(x, y, G + 0.035) for x, y in INNER], [(x, y, G + 0.045) for x, y in INNER]], outline=0.01)
L = G + 0.045


def studded(name, x, y, z, r):
    """A sphere studded with discs in rows, their colours running round in a spiral."""
    ball(name, M['sphere'], x, y, z, r, outline=0.02)
    spacing = 0.26 * r
    rows = int(math.radians(150) / (spacing / r))
    colours = ('discBlue', 'discGreen', 'discPale')
    for i in range(rows + 1):
        lat = math.radians(-75) + i * math.radians(150) / rows
        count = max(3, int(2 * math.pi * r * math.cos(lat) / spacing))
        for j in range(count):
            lon = 2 * math.pi * (j + 0.5 * (i % 2)) / count
            n = Vector((math.cos(lat) * math.cos(lon), math.cos(lat) * math.sin(lon), math.sin(lat)))
            at = Vector((x, y, z)) + n * (r + 0.002)
            rot = Vector((0, 0, 1)).rotation_difference(n).to_matrix().to_4x4()
            cyl(f'{name}disc{i}_{j}', M[colours[(j + i) % 3]], 0.11 * r, 0.012, segs=10, outline=0, matrix=Matrix.Translation(at) @ rot)


def needle(name, x, y, h, base_r):
    lathe(f'{name}plinth', M['promenade'], ((0.14, 0), (0.12, 0.05)), L - 0.005, x, y, segs=24, outline=0.014)
    lathe(name, M['needle'], ((base_r, 0), (base_r * 0.75, h * 0.45), (base_r * 0.45, h * 0.8), (0.004, h)), L + 0.04, x, y, segs=16, outline=0.018)


# ---------- the main tower: the great sphere, the observation sphere, the spire ----------
AX, AY = -0.1, 0.32
needle('main', AX, AY, 2.0, 0.07)
studded('mainsphere', AX, AY, L + 0.92, 0.3)
studded('topsphere', AX, AY, L + 1.38, 0.13)
lathe('topwindows', M['glass'], ((0.133, 0), (0.133, 0.035)), L + 1.37, AX, AY, segs=28, outline=0.006, smooth=True)

# ---------- the second tower and its one sphere ----------
BX, BY = 0.5, -0.05
needle('second', BX, BY, 1.55, 0.06)
studded('secondsphere', BX, BY, L + 0.8, 0.23)

# ---------- the third, bare, carrying its lights ----------
CX, CY = -0.72, 0.1
needle('third', CX, CY, 1.2, 0.05)
for k in range(8):
    a = 2 * math.pi * k / 8
    ball(f'light{k}', M['light'], CX + 0.045 * math.cos(a), CY + 0.045 * math.sin(a), L + 0.82, 0.018, outline=0.006)

# ---------- palms along the promenade ----------
for k, (x, y) in enumerate(((-0.75, -0.3), (-0.35, -0.48), (0.15, -0.5), (0.75, -0.25), (0.92, 0.35), (-0.95, 0.5))):
    h = rng.uniform(0.2, 0.27)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, L), (x + 0.02, y, L + h), 0.018, r2=0.013, segs=8, outline=0.008)
    for f in range(6):
        a = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, L + h), (x + 0.02 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), L + h - 0.05), 0.022,
            outline=0.006)

render(G)
