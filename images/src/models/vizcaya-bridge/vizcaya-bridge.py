# A cartoon Vizcaya Bridge for the country maps, built in the set's shared look (../toon.py): the
# world's first transporter bridge over the mouth of the Nervión, its two tall iron lattice towers
# on either bank, the high girder across the top, and the gondola hanging on its cables carrying
# cars and people across the water between Getxo and Portugalete, with the towns' houses either
# side. Turned a little towards the camera.
# Run: blender -b --factory-startup -P vizcaya-bridge.py -- vizcaya-bridge-1024.png 1024 vizcaya-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bank': toon('bank', '#cfc6b4', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'river': toon('river', '#4a7a9a', lift=0.3),
    'iron': toon('iron', '#8a3a30', shadow_mul=(0.86, 0.8, 0.8)),
    'gondola': toon('gondola', '#3a5a7a'),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'red': toon('red', '#c43a2a'),
    'yellow': toon('yellow', '#f0c040'),
    'cream': toon('cream', '#f0e6cc', lift=0.12),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a3a42'),
})

G = tile(M['bank'])
before = set(bpy.data.objects)


def vstrip(x0, x1, r, z, n=8):
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, G + z) for x, y in pts]


loft('river', M['river'], [vstrip(-0.46, 0.46, 1.33, -0.004), vstrip(-0.46, 0.46, 1.33, 0.006)], outline=0.004)

# ---------- the towers ----------
TOP = 0.62
for s in (-1, 1):
    tx = s * 0.56
    legs = [(tx + dx, dy) for dx in (-0.08, 0.08) for dy in (-0.08, 0.08)]
    for k, (lx, ly) in enumerate(legs):
        bar(f'leg{s}{k}', M['iron'], (lx, ly, G - 0.005), (tx + (lx - tx) * 0.3, ly * 0.3, G + TOP), 0.018, outline=0.002)
    for j in range(5):
        z0, z1 = G + j * TOP / 5, G + (j + 1) * TOP / 5
        f0, f1 = 1 - 0.7 * j / 5, 1 - 0.7 * (j + 1) / 5
        for dy in (-0.08, 0.08):
            bar(f'brace{s}{j}{dy}', M['iron'], (tx - 0.08 * f0, dy * f0, z0), (tx + 0.08 * f1, dy * f1, z1), 0.008, outline=0)
        for dx in (-0.08, 0.08):
            bar(f'bracex{s}{j}{dx}', M['iron'], (tx + dx * f0, -0.08 * f0, z0), (tx + dx * f1, 0.08 * f1, z1), 0.008, outline=0)
    box(f'towercap{s}', M['iron'], tx, 0.0, G + TOP - 0.01, 0.07, 0.07, 0.04, outline=0.003, bevel=0)
    for k, dy in enumerate((-0.25, 0.25)):
        bar(f'stay{s}{k}', M['iron'], (tx, 0.0, G + TOP), (tx + s * 0.18, dy, G - 0.005), 0.006, outline=0)

# ---------- the girder ----------
for dy in (-0.03, 0.03):
    bar(f'girdertop{dy}', M['iron'], (-0.6, dy, G + TOP + 0.04), (0.6, dy, G + TOP + 0.04), 0.014, outline=0.001)
    bar(f'girderbot{dy}', M['iron'], (-0.6, dy, G + TOP - 0.01), (0.6, dy, G + TOP - 0.01), 0.014, outline=0.001)
    for j in range(12):
        x0, x1 = -0.6 + j * 0.1, -0.5 + j * 0.1
        bar(f'girderdiag{dy}{j}', M['iron'], (x0, dy, G + TOP - 0.01), (x1, dy, G + TOP + 0.04), 0.006, outline=0)

# ---------- the gondola ----------
GX = 0.12
box('trolley', M['iron'], GX, 0.0, G + TOP - 0.03, 0.12, 0.08, 0.02, outline=0.002, bevel=0)
for dx in (-0.05, 0.0, 0.05):
    for dy in (-0.035, 0.035):
        bar(f'cable{dx}{dy}', M['iron'], (GX + dx, dy * 0.8, G + TOP - 0.03), (GX + dx * 1.5, dy * 1.8, G + 0.07), 0.004, outline=0)
box('gondola', M['gondola'], GX, 0.0, G + 0.03, 0.2, 0.14, 0.03, outline=0.003, bevel=0)
box('gondolacabin', M['white'], GX + 0.07, 0.0, G + 0.055, 0.05, 0.12, 0.05, outline=0.002, bevel=0)
for k, (dx, mat) in enumerate(((-0.05, 'red'), (0.0, 'yellow'))):
    box(f'car{k}', M[mat], GX + dx, -0.03 + k * 0.06, G + 0.055, 0.045, 0.03, 0.025, outline=0.001, bevel=0)

# ---------- the towns ----------
rng = random.Random(2509)
for s in (-1, 1):
    for k, y in enumerate((-0.6, -0.3, 0.32, 0.6)):
        x = s * rng.uniform(0.72, 0.85)
        if math.hypot(x, y) > 1.12:
            continue
        h = rng.uniform(0.12, 0.2)
        box(f'house{s}{k}', M['cream'], x, y, G - 0.005, 0.18, 0.16, h, outline=0.005, bevel=0)
        for r in range(2):
            box(f'housewin{s}{k}{r}', M['window'], x, y - 0.083, G + 0.04 + r * 0.06, 0.12, 0.006, 0.022, outline=0, bevel=0)
        pyramid(f'houseroof{s}{k}', M['roof'], x, y, G + h - 0.01, 0.19, 0.06, outline=0.003)

turn(before, -20)
render(G)
