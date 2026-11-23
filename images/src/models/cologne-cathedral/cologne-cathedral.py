# A cartoon Cologne Cathedral for the country maps, built in the set's shared look (../toon.py): the
# great Gothic cathedral's twin dark spires and pinnacles over its nave and buttresses, the
# Hohenzollern Bridge's three steel arches across the Rhine in front with a red train on it, and a
# river cruise boat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cologne-cathedral.py -- cologne-cathedral-1024.png 1024 cologne-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#4a7a9a', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'bank': toon('bank', '#b8b0a0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#6e6a68', shadow_mul=(0.84, 0.84, 0.9)),
    'stoneLight': toon('stoneLight', '#8a8682', shadow_mul=(0.84, 0.84, 0.9)),
    'roof': toon('roof', '#4a4a52'),
    'window': flat('window', '#2e3a54'),
    'steel': toon('steel', '#5a7a7a', shadow_mul=(0.8, 0.84, 0.86)),
    'train': toon('train', '#c8302a'),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'boatBlue': toon('boatBlue', '#2f5a9a'),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(1453)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the bank the cathedral stands on ----------
bank = loft('bank', M['bank'], [segment(0.05, 1.41, -0.01), segment(0.08, 1.4, 0.06)], outline=0.012)
bank.visible_shadow = False
T = G + 0.06

# ---------- the cathedral: nave, buttresses, the twin spires at its west front ----------
CX, CY = 0.1, 0.55
box('nave', M['stone'], CX + 0.15, CY, T - 0.005, 0.7, 0.24, 0.26, outline=0.014, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.2, CY - 0.13, T + 0.255), (CX + 0.5, CY - 0.13, T + 0.255), (CX + 0.5, CY + 0.13, T + 0.255), (CX - 0.2, CY + 0.13, T + 0.255)],
                             [(CX - 0.2, CY - 0.005, T + 0.37), (CX + 0.5, CY - 0.005, T + 0.37), (CX + 0.5, CY + 0.005, T + 0.37), (CX - 0.2, CY + 0.005, T + 0.37)]],
     outline=0.01)
for j in range(6):
    x = CX - 0.1 + j * 0.11
    box(f'buttress{j}', M['stoneLight'], x, CY - 0.15, T - 0.005, 0.03, 0.06, 0.22, outline=0.005, bevel=0)
    lathe(f'buttresspin{j}', M['stoneLight'], ((0.016, 0), (0.004, 0.08)), T + 0.215, x, CY - 0.15, segs=4, outline=0.003, smooth=False)
    box(f'navewin{j}', M['window'], x + 0.055, CY - 0.123, T + 0.08, 0.035, 0.006, 0.12, outline=0, bevel=0)
for s in (-1, 1):
    tx = CX - 0.3
    ty = CY + s * 0.1
    box(f'tower{s}', M['stone'], tx, ty, T - 0.005, 0.16, 0.16, 0.5, outline=0.012, bevel=0)
    lathe(f'towerlantern{s}', M['stoneLight'], ((0.07, 0), (0.07, 0.12)), T + 0.49, tx, ty, segs=8, outline=0.008, smooth=False)
    lathe(f'spire{s}', M['stone'], ((0.07, 0), (0.004, 0.42)), T + 0.6, tx, ty, segs=8, outline=0.01, smooth=False)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        lathe(f'pinnacle{s}{k}', M['stoneLight'], ((0.02, 0), (0.004, 0.1)), T + 0.49, tx + 0.075 * math.cos(a), ty + 0.075 * math.sin(a), segs=4, outline=0.003, smooth=False)
    for k in range(3):
        box(f'towerwin{s}{k}', M['window'], tx, ty - 0.084, T + 0.1 + k * 0.13, 0.04, 0.006, 0.09, outline=0, bevel=0)
box('portal', M['window'], CX - 0.39, CY, T, 0.006, 0.07, 0.15, outline=0, bevel=0)

# ---------- the Hohenzollern Bridge across the Rhine ----------
BY = -0.45
box('bridgedeck', M['steel'], 0.0, BY, G + 0.08, 2.6, 0.12, 0.02, outline=0.006, bevel=0)
for k, xc in enumerate((-0.75, 0.0, 0.75)):
    box(f'pier{k}', M['bank'], xc - 0.37, BY, G - 0.005, 0.06, 0.14, 0.09, outline=0.005, bevel=0)
    pts = [(xc - 0.34 + 0.68 * j / 10, BY, G + 0.1 + 0.2 * math.sin(math.pi * j / 10)) for j in range(11)]
    for s in (-0.05, 0.05):
        for j in range(10):
            bar(f'arch{k}{s}{j}', M['steel'], (pts[j][0], BY + s, pts[j][2]), (pts[j + 1][0], BY + s, pts[j + 1][2]), 0.018, outline=0.003)
        for j in range(1, 10):
            bar(f'hanger{k}{s}{j}', M['steel'], (pts[j][0], BY + s, pts[j][2]), (pts[j][0], BY + s, G + 0.1), 0.007, outline=0)
box('pierend', M['bank'], 1.12, BY, G - 0.005, 0.06, 0.14, 0.09, outline=0.005, bevel=0)
for k in range(3):
    box(f'car{k}', M['train'], -0.5 + k * 0.2, BY, G + 0.1, 0.18, 0.06, 0.06, outline=0.005, bevel=0)

# ---------- a river cruise boat ----------
RX, RY = 0.35, -0.85
loft('boat', M['boat'], [[(RX - 0.24, RY, G), (RX + 0.18, RY - 0.06, G), (RX + 0.26, RY, G), (RX + 0.18, RY + 0.06, G)],
                         [(RX - 0.26, RY, G + 0.05), (RX + 0.18, RY - 0.07, G + 0.05), (RX + 0.32, RY, G + 0.05), (RX + 0.18, RY + 0.07, G + 0.05)]], outline=0.007)
box('boatdeck', M['boat'], RX - 0.02, RY, G + 0.05, 0.36, 0.1, 0.04, outline=0.005, bevel=0)
box('boatstripe', M['boatBlue'], RX - 0.02, RY - 0.052, G + 0.06, 0.34, 0.006, 0.02, outline=0, bevel=0)

turn(before, -20)
render(G)
