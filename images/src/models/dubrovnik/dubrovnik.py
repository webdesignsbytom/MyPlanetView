# A cartoon Dubrovnik for the country maps, built in the set's shared look (../toon.py): the old
# town's mass of red roofs inside its thick city walls on the Adriatic, the round Minčeta tower at
# the top corner, the Stradun's bell tower, Fort Lovrijenac on its own rock outside the walls, and
# boats in the old harbour. Turned a little towards the camera.
# Run: blender -b --factory-startup -P dubrovnik.py -- dubrovnik-1024.png 1024 dubrovnik.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'hill': toon('hill', '#7a9a5a', shadow_mul=(0.72, 0.8, 0.74)),
    'wall': toon('wall', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86)),
    'house': toon('house', '#ece4d2', lift=0.15),
    'roof': toon('roof', '#d0663e'),
    'roofDark': toon('roofDark', '#b8503a'),
    'rock': toon('rock', '#a89a86', shadow_mul=(0.84, 0.84, 0.9)),
    'window': flat('window', '#3a3640'),
    'boat': toon('boat', '#f6f3ec', lift=0.2),
    'boatBlue': toon('boatBlue', '#2f6fc0'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1583)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Mount Srđ behind ----------
h = loft('srd', M['hill'], [segment(0.55, 1.38, -0.01), segment(0.75, 1.22, 0.3), segment(0.9, 1.04, 0.36)], outline=0.016, smooth=True)
h.visible_shadow = False

# ---------- the walled town ----------
WALL = [(-0.75, -0.3), (0.5, -0.35), (0.72, -0.05), (0.62, 0.55), (-0.45, 0.62), (-0.8, 0.25)]
for k in range(len(WALL)):
    (x0, y0), (x1, y1) = WALL[k], WALL[(k + 1) % len(WALL)]
    L = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'citywall{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.01, L + 0.05, 0.07, 0.15, rot_z=a, outline=0.01, bevel=0)
    lathe(f'walltower{k}', M['wall'], ((0.065, 0), (0.065, 0.18)), G - 0.01, x0, y0, segs=14, outline=0.008)
lathe('mincheta', M['wall'], ((0.1, 0), (0.1, 0.3), (0.115, 0.31), (0.115, 0.34)), G - 0.01, 0.62, 0.55, segs=18, outline=0.012)
box('townfloor', M['wall'], 0.0, 0.15, G - 0.01, 1.3, 0.8, 0.12, outline=0.006, bevel=0)
T = G + 0.11
for i in range(4):
    for j in range(7):
        x, y = -0.6 + j * 0.19 + rng.uniform(-0.02, 0.02), -0.18 + i * 0.19
        if (x, y) == (0, 0) or not (-0.68 < x < 0.62):
            continue
        if abs(y - 0.1) < 0.04 and -0.6 < x < 0.5:
            continue
        hh = rng.uniform(0.06, 0.1)
        box(f'house{i}{j}', M['house'], x, y, T - 0.005, 0.16, 0.14, hh, outline=0.006, bevel=0)
        pyramid(f'houseroof{i}{j}', M['roof' if (i + j) % 2 else 'roofDark'], x, y, T + hh - 0.008, 0.17, 0.06, outline=0.005)
box('belltower', M['house'], 0.42, 0.08, T - 0.005, 0.07, 0.07, 0.28, outline=0.008, bevel=0)
lathe('belltowerdome', M['wall'], ((0.04, 0), (0.025, 0.03), (0.004, 0.06)), T + 0.275, 0.42, 0.08, segs=10, outline=0.004)

# ---------- Fort Lovrijenac on its rock, boats in the harbour ----------
FX, FY = -1.0, -0.45
lathe('lovrijenacrock', M['rock'], ((0.2, 0), (0.15, 0.1), (0.1, 0.14)), G - 0.01, FX, FY, segs=14, outline=0.01)
box('lovrijenac', M['wall'], FX, FY, G + 0.13, 0.16, 0.14, 0.12, rot_z=0.3, outline=0.008, bevel=0)
for k, (x, y, mat) in enumerate(((0.75, -0.55, 'boat'), (0.95, -0.35, 'boatBlue'), (0.55, -0.75, 'boat'))):
    loft(f'boat{k}', M[mat], [[(x - 0.08, y, G), (x + 0.05, y - 0.025, G), (x + 0.09, y, G), (x + 0.05, y + 0.025, G)],
                              [(x - 0.09, y, G + 0.03), (x + 0.05, y - 0.03, G + 0.03), (x + 0.11, y, G + 0.035), (x + 0.05, y + 0.03, G + 0.03)]], outline=0.006)

turn(before, -20)
render(G)
