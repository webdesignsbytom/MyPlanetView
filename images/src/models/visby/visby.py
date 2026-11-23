# A cartoon Visby for the country maps, built in the set's shared look (../toon.py): the Hanseatic
# town on Gotland, its long medieval town wall with its tall towers, St Mary's Cathedral with its
# black baroque spires, the roofless gable of St Nicolai's ruin with its rose window, red-roofed
# houses with roses, and the Baltic in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P visby.py -- visby-1024.png 1024 visby.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'sea': toon('sea', '#3a7aa8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'limestone': toon('limestone', '#ddd4c0', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'ruin': toon('ruin', '#c4b8a0', shadow_mul=(0.84, 0.82, 0.86)),
    'roof': toon('roof', '#c4573a'),
    'black': toon('black', '#33303a', shadow_mul=(0.84, 0.84, 0.9)),
    'h0': toon('h0', '#f2e6c8'), 'h1': toon('h1', '#e8c070'), 'h2': toon('h2', '#f0f0ea', lift=0.2), 'h3': toon('h3', '#d8a080'),
    'rose': toon('rose', '#e85a7a', lift=0.2),
    'window': flat('window', '#2e2a30'),
    'sail': toon('sail', '#f8f6f0', lift=0.2),
    'hull': toon('hull', '#8a4a30'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2023)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def front(c, r, z, n=26):
    return [(x, -y, zz) for x, y, zz in reversed(segment(c, r, z, n))]


# ---------- the Baltic ----------
loft('sea', M['sea'], [front(0.8, 1.4, -0.004), front(0.8, 1.4, 0.004)], outline=0.004)
BX, BY = 0.35, -1.0
box('hull', M['hull'], BX, BY, G, 0.2, 0.06, 0.035, outline=0.004, bevel=0)
rod('mast', M['hull'], (BX, BY, G + 0.03), (BX, BY, G + 0.24), 0.005, segs=5, outline=0)
loft('sailcloth', M['sail'], [[(BX + 0.005, BY - 0.003, G + 0.06), (BX + 0.1, BY - 0.003, G + 0.06), (BX + 0.005, BY - 0.003, G + 0.23)],
                              [(BX + 0.005, BY + 0.003, G + 0.06), (BX + 0.1, BY + 0.003, G + 0.06), (BX + 0.005, BY + 0.003, G + 0.23)]], outline=0.003)

# ---------- the town wall and its towers ----------
for k in range(9):
    x = -1.0 + k * 0.25
    y = 0.62 + 0.04 * math.sin(k)
    box(f'wall{k}', M['limestone'], x, y, G - 0.005, 0.26, 0.05, 0.14, rot_z=0.04 * math.cos(k), outline=0.006, bevel=0)
for k, x in enumerate((-0.95, -0.55, -0.15, 0.25, 0.65, 0.98)):
    y = 0.62 + 0.04 * math.sin((x + 1.0) / 0.25)
    box(f'walltower{k}', M['limestone'], x, y, G - 0.005, 0.1, 0.1, 0.3, outline=0.008, bevel=0)
    for j in range(2):
        box(f'walltowerslit{k}{j}', M['window'], x, y - 0.052, G + 0.12 + j * 0.08, 0.015, 0.006, 0.04, outline=0, bevel=0)
    pyramid(f'walltowerroof{k}', M['roof'], x, y, G + 0.295, 0.12, 0.12, outline=0.006)

# ---------- St Mary's Cathedral ----------
CX, CY = -0.35, 0.18
box('nave', M['limestone'], CX + 0.12, CY, G - 0.005, 0.44, 0.22, 0.2, outline=0.01, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.1, CY - 0.11, G + 0.195), (CX + 0.34, CY - 0.11, G + 0.195), (CX + 0.34, CY + 0.11, G + 0.195), (CX - 0.1, CY + 0.11, G + 0.195)],
                             [(CX - 0.1, CY - 0.004, G + 0.3), (CX + 0.34, CY - 0.004, G + 0.3), (CX + 0.34, CY + 0.004, G + 0.3), (CX - 0.1, CY + 0.004, G + 0.3)]],
     outline=0.008)
for j in range(4):
    box(f'navewin{j}', M['window'], CX + j * 0.09, CY - 0.112, G + 0.06, 0.03, 0.006, 0.09, outline=0, bevel=0)
box('westtower', M['limestone'], CX - 0.17, CY, G - 0.005, 0.15, 0.15, 0.42, outline=0.01, bevel=0)
lathe('westspire', M['black'], ((0.1, 0), (0.1, 0.04), (0.06, 0.1), (0.075, 0.15), (0.03, 0.24), (0.004, 0.36)), G + 0.41, CX - 0.17, CY, segs=8, outline=0.008, smooth=False)
for s in (-1, 1):
    box(f'easttower{s}', M['limestone'], CX + 0.36, CY + s * 0.075, G - 0.005, 0.07, 0.07, 0.3, outline=0.006, bevel=0)
    lathe(f'eastspire{s}', M['black'], ((0.05, 0), (0.004, 0.18)), G + 0.295, CX + 0.36, CY + s * 0.075, segs=8, outline=0.005, smooth=False)

# ---------- St Nicolai's ruin: roofless walls and a gable with its rose window ----------
RX, RY = 0.52, 0.2
for s in (-1, 1):
    box(f'ruinwall{s}', M['ruin'], RX + s * 0.13, RY + 0.2, G - 0.005, 0.035, 0.4, 0.2, outline=0.007, bevel=0)
    for j in range(3):
        box(f'ruinarch{s}{j}', M['window'], RX + s * 0.148, RY + 0.08 + j * 0.12, G + 0.06, 0.006, 0.05, 0.1, outline=0, bevel=0)
box('gable', M['ruin'], RX, RY, G - 0.005, 0.3, 0.035, 0.21, outline=0.008, bevel=0)
loft('gabletop', M['ruin'], [[(RX - 0.15, RY - 0.0175, G + 0.2), (RX + 0.15, RY - 0.0175, G + 0.2), (RX + 0.15, RY + 0.0175, G + 0.2), (RX - 0.15, RY + 0.0175, G + 0.2)],
                             [(RX - 0.006, RY - 0.0175, G + 0.36), (RX + 0.006, RY - 0.0175, G + 0.36), (RX + 0.006, RY + 0.0175, G + 0.36), (RX - 0.006, RY + 0.0175, G + 0.36)]],
     outline=0.007)
cyl('rosewindow', M['window'], 0.055, 0.006, segs=18, outline=0, matrix=Matrix.Translation((RX, RY - 0.02, G + 0.23)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('ruindoor', M['window'], RX, RY - 0.019, G - 0.005, 0.07, 0.006, 0.12, outline=0, bevel=0)

# ---------- the houses and their roses ----------
for k, (x, y) in enumerate(((-0.9, -0.15), (-0.65, -0.35), (-0.35, -0.2), (-0.05, -0.4), (0.25, -0.2), (0.55, -0.4), (0.85, -0.15), (-1.05, 0.25), (1.0, 0.25))):
    h = rng.uniform(0.1, 0.14)
    box(f'house{k}', M[f'h{k % 4}'], x, y, G - 0.005, 0.18, 0.14, h, outline=0.007, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.1, y - 0.08, G + h - 0.005), (x + 0.1, y - 0.08, G + h - 0.005), (x + 0.1, y + 0.08, G + h - 0.005), (x - 0.1, y + 0.08, G + h - 0.005)],
                                      [(x - 0.1, y - 0.004, G + h + 0.08), (x + 0.1, y - 0.004, G + h + 0.08), (x + 0.1, y + 0.004, G + h + 0.08), (x - 0.1, y + 0.004, G + h + 0.08)]],
         outline=0.006)
    box(f'housedoor{k}', M['window'], x, y - 0.072, G - 0.005, 0.03, 0.006, 0.06, outline=0, bevel=0)
    for j in range(2):
        ball(f'rose{k}{j}', M['rose'], x - 0.06 + j * 0.12, y - 0.09, G + 0.03, 0.03, outline=0.004)

turn(before, -20)
render(G)
