# A cartoon Lamu for the country maps, built in the set's shared look (../toon.py): the Swahili
# town's whitewashed coral-stone houses with their flat roofs and carved wooden doors along the
# waterfront, the fort, palms, a donkey on the quay, and dhows with their triangular lateen sails
# in the channel. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lamu.py -- lamu-1024.png 1024 lamu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3aa8b8', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'quay': toon('quay', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'white': toon('white', '#f6f3ea', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'coral': toon('coral', '#e2d2b0', shadow_mul=(0.84, 0.82, 0.86)),
    'door': toon('door', '#7a4a2e'),
    'window': flat('window', '#3a3640'),
    'fort': toon('fort', '#d8b888', shadow_mul=(0.86, 0.8, 0.74)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'hull': toon('hull', '#8a5a3a'),
    'sail': toon('sail', '#f8f4ea', lift=0.2),
    'donkey': toon('donkey', '#8a8278'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1721)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


town = loft('town', M['quay'], [segment(-0.1, 1.41, -0.01), segment(-0.08, 1.4, 0.05)], outline=0.01)
town.visible_shadow = False
T = G + 0.05

# ---------- the waterfront houses ----------
for i in range(3):
    for j in range(7):
        x = -0.85 + j * 0.28 + (0.14 if i % 2 else 0)
        y = 0.08 + i * 0.25
        if math.hypot(x, y) > 1.15 or (i == 0 and 0.1 < x < 0.5):
            continue
        h = rng.uniform(0.14, 0.22)
        box(f'house{i}{j}', M['white' if (i + j) % 3 else 'coral'], x, y, T - 0.005, 0.22, 0.18, h, outline=0.009, bevel=0)
        box(f'houseparapet{i}{j}', M['coral'], x, y, T + h - 0.01, 0.23, 0.19, 0.02, outline=0.004, bevel=0)
        box(f'housedoor{i}{j}', M['door'], x, y - 0.094, T, 0.05, 0.006, 0.09, outline=0, bevel=0)
        for k in range(2):
            box(f'housewin{i}{j}{k}', M['window'], x - 0.06 + k * 0.12, y - 0.094, T + h * 0.6, 0.03, 0.006, 0.035, outline=0, bevel=0)
# the fort
FX, FY = 0.3, 0.12
box('fort', M['fort'], FX, FY, T - 0.005, 0.32, 0.22, 0.2, outline=0.012, bevel=0)
for j in range(7):
    box(f'fortmerlon{j}', M['fort'], FX - 0.15 + j * 0.05, FY - 0.11, T + 0.195, 0.03, 0.03, 0.035, outline=0.003, bevel=0)
box('fortgate', M['door'], FX, FY - 0.114, T, 0.07, 0.006, 0.12, outline=0, bevel=0)
for k, x in enumerate((-0.75, -0.25, 0.75)):
    rod(f'palmtrunk{k}', M['trunk'], (x, -0.03, T), (x + 0.02, -0.03, T + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, -0.03, T + 0.3), (x + 0.02 + 0.1 * math.cos(b), -0.03 + 0.1 * math.sin(b), T + 0.25), 0.019, outline=0.005)
DX, DY = -0.45, -0.02
for fx in (-0.025, 0.025):
    rod(f'donkeyleg{fx}', M['donkey'], (DX + fx, DY, T), (DX + fx, DY, T + 0.05), 0.007, segs=5, outline=0.002)
b = ball('donkeybody', M['donkey'], 0, 0, 0, 0.028, outline=0.004)
b.scale = (1.5, 0.8, 0.8)
b.location = (DX, DY, T + 0.065)
ball('donkeyhead', M['donkey'], DX + 0.05, DY, T + 0.085, 0.015, outline=0.003)

# ---------- dhows in the channel ----------
for k, (x, y, s) in enumerate(((-0.4, -0.55, 1.2), (0.35, -0.7, 1.0), (0.85, -0.4, 0.8))):
    loft(f'dhow{k}', M['hull'], [[(x - 0.12 * s, y, G), (x + 0.08 * s, y - 0.03 * s, G), (x + 0.14 * s, y, G), (x + 0.08 * s, y + 0.03 * s, G)],
                                 [(x - 0.15 * s, y, G + 0.05 * s), (x + 0.08 * s, y - 0.04 * s, G + 0.04 * s), (x + 0.2 * s, y, G + 0.06 * s), (x + 0.08 * s, y + 0.04 * s, G + 0.04 * s)]],
         outline=0.006)
    rod(f'dhowmast{k}', M['hull'], (x, y, G + 0.04 * s), (x, y, G + 0.25 * s), 0.005, segs=5, outline=0)
    loft(f'dhowsail{k}', M['sail'], [[(x + 0.004, y - 0.004, G + 0.06 * s), (x + 0.004, y + 0.004, G + 0.06 * s), (x + 0.16 * s, y + 0.004, G + 0.06 * s)],
                                     [(x - 0.13 * s, y - 0.004, G + 0.3 * s), (x - 0.13 * s, y + 0.004, G + 0.3 * s), (x - 0.12 * s, y + 0.004, G + 0.3 * s)]], outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
