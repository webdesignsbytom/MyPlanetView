# A cartoon Stone Town of Zanzibar for the country maps, built in the set's shared look
# (../toon.py): the House of Wonders, the Sultan's great white palace with its tiers of balconies
# on iron pillars all round and its clock tower, the coral-stone houses with their carved wooden
# Zanzibar doors, palms on the seafront, and dhows with their lateen sails. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P stone-town.py -- stone-town-1024.png 1024 stone-town.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8d4a8', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'sea': toon('sea', '#2fa0b8', shadow_mul=(0.76, 0.86, 0.92), lift=0.3),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'pillar': toon('pillar', '#6a7a80'),
    'roof': toon('roof', '#8a9298'),
    'coral': toon('coral', '#d8c4a0', shadow_mul=(0.86, 0.82, 0.8)),
    'coralPink': toon('coralPink', '#e0b8a0', shadow_mul=(0.86, 0.82, 0.8)),
    'door': toon('door', '#6a3a22'),
    'brass': toon('brass', '#e8b830', lift=0.3),
    'clock': flat('clock', '#2e2a30'),
    'hull': toon('hull', '#8a5a34'),
    'sail': toon('sail', '#f6f0e0', lift=0.2),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(2063)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def front(c, r, z, n=26):
    return [(x, -y, zz) for x, y, zz in reversed(segment(c, r, z, n))]


loft('sea', M['sea'], [front(0.55, 1.4, -0.004), front(0.55, 1.4, 0.004)], outline=0.004)

# ---------- the House of Wonders ----------
HX, HY = 0.0, 0.25
box('palace', M['white'], HX, HY, G - 0.005, 0.62, 0.42, 0.5, outline=0.012, bevel=0)
for t in range(3):
    z = G + t * 0.165
    box(f'balcony{t}', M['white'], HX, HY - 0.25, z + 0.15, 0.78, 0.12, 0.02, outline=0.005, bevel=0)
    for j in range(9):
        x = HX - 0.37 + j * 0.0925
        rod(f'pillar{t}{j}', M['pillar'], (x, HY - 0.3, z), (x, HY - 0.3, z + 0.15), 0.008, segs=6, outline=0.002)
    bar(f'rail{t}', M['pillar'], (HX - 0.38, HY - 0.3, z + 0.2), (HX + 0.38, HY - 0.3, z + 0.2), 0.008, outline=0)
    for j in range(5):
        box(f'palacedoor{t}{j}', M['door'], HX - 0.24 + j * 0.12, HY - 0.212, z + 0.01, 0.05, 0.006, 0.1, outline=0, bevel=0)
box('palaceroof', M['roof'], HX, HY - 0.05, G + 0.49, 0.8, 0.55, 0.02, outline=0.006, bevel=0)
box('clocktower', M['white'], HX, HY, G + 0.5, 0.16, 0.16, 0.24, outline=0.008, bevel=0)
cyl('clockface', M['white'], 0.04, 0.006, segs=16, outline=0.003, matrix=Matrix.Translation((HX, HY - 0.083, G + 0.64)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('clockhands', M['clock'], 0.012, 0.004, segs=8, outline=0, matrix=Matrix.Translation((HX, HY - 0.088, G + 0.64)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('towertop', M['white'], HX, HY, G + 0.735, 0.19, 0.19, 0.03, outline=0.005, bevel=0)
lathe('towerspire', M['roof'], ((0.07, 0), (0.004, 0.12)), G + 0.76, HX, HY, segs=4, outline=0.004, smooth=False)

# ---------- coral-stone houses with carved doors ----------
for k, (x, y, w) in enumerate(((-0.75, 0.15, 0.3), (-0.8, 0.55, 0.3), (0.75, 0.15, 0.3), (0.78, 0.55, 0.28), (-0.4, 0.75, 0.3), (0.4, 0.78, 0.3))):
    h = 0.26 + 0.04 * (k % 2)
    box(f'house{k}', M['coral' if k % 2 else 'coralPink'], x, y, G - 0.005, w, 0.24, h, outline=0.008, bevel=0)
    box(f'housedoor{k}', M['door'], x, y - 0.122, G - 0.005, 0.08, 0.008, 0.14, outline=0.002, bevel=0)
    lathe(f'doortop{k}', M['door'], ((0.04, 0), (0.004, 0.03)), G + 0.135, x, y - 0.122, segs=4, outline=0, smooth=False)
    for j in range(3):
        ball(f'stud{k}{j}', M['brass'], x - 0.025 + j * 0.025, y - 0.128, G + 0.09, 0.008, outline=0)
    box(f'housewin{k}', M['door'], x, y - 0.122, G + h - 0.1, 0.1, 0.008, 0.05, outline=0, bevel=0)

# ---------- the seafront palms and the dhows ----------
for k, x in enumerate((-0.5, 0.5, -1.0, 1.0)):
    y = -0.32 if abs(x) < 0.8 else -0.15
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.34), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.34), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.29), 0.019, outline=0.005)
for k, (x, y, s) in enumerate(((-0.45, -0.85, 1.0), (0.4, -0.95, 1.2))):
    box(f'dhowhull{k}', M['hull'], x, y, G - 0.002, 0.28 * s, 0.08 * s, 0.05 * s, outline=0.005, bevel=0)
    lathe(f'dhowprow{k}', M['hull'], ((0.035 * s, 0), (0.004, 0.08 * s)), G + 0.01, x - 0.15 * s, y, segs=4, outline=0.003, smooth=False)
    rod(f'dhowmast{k}', M['hull'], (x, y, G + 0.04), (x, y, G + 0.3 * s), 0.006, segs=5, outline=0)
    loft(f'dhowsail{k}', M['sail'], [[(x - 0.15 * s, y - 0.003, G + 0.12 * s), (x + 0.12 * s, y - 0.003, G + 0.08 * s), (x + 0.02 * s, y - 0.003, G + 0.36 * s)],
                                     [(x - 0.15 * s, y + 0.003, G + 0.12 * s), (x + 0.12 * s, y + 0.003, G + 0.08 * s), (x + 0.02 * s, y + 0.003, G + 0.36 * s)]], outline=0.004)

turn(before, -20)
render(G)
