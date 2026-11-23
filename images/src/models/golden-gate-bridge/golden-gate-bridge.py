# A cartoon Golden Gate Bridge for the country maps, built in the set's shared look (../toon.py):
# the International Orange suspension bridge across the strait, its two tall stepped towers with
# their cross braces, the great main cables swooping between them and down to the shore, the
# hangers and the deck, the green headlands at each end, the bay, and a bank of fog rolling in.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P golden-gate-bridge.py -- golden-gate-bridge-1024.png 1024 golden-gate-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bay': toon('bay', '#2f6aa0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'headland': toon('headland', '#7a9a50', shadow_mul=(0.74, 0.8, 0.74)),
    'cliff': toon('cliff', '#a89070', shadow_mul=(0.86, 0.82, 0.8)),
    'orange': toon('intlOrange', '#d8482a', shadow_mul=(0.86, 0.72, 0.7), lift=0.15),
    'deck': toon('deck', '#5a5658'),
    'fog': toon('fog', '#ffffff', shadow_mul=(0.88, 0.9, 0.97), lift=0.1),
    'boat': toon('boat', '#f6f4ee', lift=0.2),
})

G = tile(M['bay'])
before = set(bpy.data.objects)
rng = random.Random(2161)

# ---------- the headlands ----------
for s in (-1, 1):
    lathe(f'headland{s}', M['headland'], ((0.34, 0), (0.27, 0.12), (0.17, 0.2)), G - 0.01, s * 0.92, 0.05, segs=16, outline=0.012)
    lathe(f'headlandcliff{s}', M['cliff'], ((0.36, 0), (0.34, 0.04)), G - 0.012, s * 0.92, 0.05, segs=16, outline=0.006)

# ---------- the towers ----------
DZ = G + 0.12
TX = 0.5


def tower(name, x):
    for s in (-1, 1):
        for j, (w, z0, z1) in enumerate(((0.05, 0.0, 0.3), (0.042, 0.3, 0.52), (0.035, 0.52, 0.7))):
            box(f'{name}leg{s}{j}', M['orange'], x, s * 0.06, G - 0.005 + z0, w, w, z1 - z0 + 0.005, outline=0.006, bevel=0)
    for z in (0.22, 0.42, 0.6, 0.7):
        box(f'{name}brace{z}', M['orange'], x, 0.0, G + z, 0.04, 0.15, 0.03, outline=0.004, bevel=0)
    box(f'{name}pier', M['cliff'], x, 0.0, G - 0.01, 0.12, 0.22, 0.04, outline=0.004, bevel=0)


tower('towerL', -TX)
tower('towerR', TX)

# ---------- the deck ----------
box('deck', M['deck'], 0.0, 0.0, DZ - 0.01, 2.2, 0.12, 0.025, outline=0.005, bevel=0)
box('decktruss', M['orange'], 0.0, -0.062, DZ - 0.04, 2.2, 0.006, 0.035, outline=0.002, bevel=0)

# ---------- the main cables and hangers ----------
TOP = G + 0.71


def cable_z(x):
    if abs(x) <= TX:
        return DZ + 0.03 + (TOP - DZ - 0.03) * (x / TX) ** 2
    t = (abs(x) - TX) / (1.08 - TX)
    return TOP + (DZ + 0.05 - TOP) * t ** 0.9


xs = [-1.08 + i * 2.16 / 40 for i in range(41)]
for s in (-1, 1):
    pts = [(x, s * 0.06, cable_z(x)) for x in xs]
    for i in range(len(pts) - 1):
        rod(f'cable{s}{i}', M['orange'], pts[i], pts[i + 1], 0.011, segs=6, outline=0.002)
    for i in range(1, len(pts) - 1, 2):
        x = pts[i][0]
        if abs(abs(x) - TX) < 0.03:
            continue
        rod(f'hanger{s}{i}', M['orange'], (x, s * 0.06, DZ), (x, s * 0.06, pts[i][2]), 0.003, segs=4, outline=0)

# ---------- fog and a boat ----------
for k, (x, y, z, r) in enumerate(((0.75, 0.35, 0.18, 0.14), (0.95, 0.3, 0.24, 0.12), (0.55, 0.42, 0.14, 0.12), (1.0, 0.45, 0.12, 0.1), (0.35, 0.5, 0.1, 0.1))):
    b = ball(f'fog{k}', M['fog'], 0, 0, 0, r, outline=0.008)
    b.scale = (1.6, 1.0, 0.7)
    b.location = (x, y, G + z)
box('boat', M['boat'], -0.2, -0.6, G - 0.002, 0.2, 0.07, 0.04, outline=0.004, bevel=0)
box('boatcabin', M['boat'], -0.23, -0.6, G + 0.035, 0.08, 0.05, 0.035, outline=0.003, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
