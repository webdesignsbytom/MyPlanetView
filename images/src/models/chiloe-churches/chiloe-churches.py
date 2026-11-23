# A cartoon of Chiloé's wooden churches for the country maps, built in the set's shared look
# (../toon.py): a shingled timber church painted yellow and white, its arcaded porch and its tiered
# tower with a spire over the front, the palafitos (stilt houses painted every colour) standing in
# the water of the bay, and fishing boats. Turned a little towards the camera.
# Run: blender -b --factory-startup -P chiloe-churches.py -- chiloe-churches-1024.png 1024 chiloe-churches.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bay': toon('bay', '#3a7a9a', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'land': toon('land', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'yellow': toon('churchYellow', '#f0c850', shadow_mul=(0.86, 0.78, 0.7), lift=0.15),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'shingle': toon('shingle', '#6a6460', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'p0': toon('p0', '#d8402c'), 'p1': toon('p1', '#2f8ac0'), 'p2': toon('p2', '#f0a030'), 'p3': toon('p3', '#5aa04a'), 'p4': toon('p4', '#a86ad0'),
    'stilt': toon('stilt', '#6a4a36'),
    'roof': toon('roof', '#8a8e96', shadow_mul=(0.8, 0.8, 0.88)),
    'boat': toon('boat', '#f6f3ec', lift=0.2),
    'boatBlue': toon('boatBlue', '#2f6fc0'),
    'tree': toon('tree', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['bay'])
before = set(bpy.data.objects)
rng = random.Random(1373)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the shore and the hills behind ----------
land = loft('land', M['land'], [segment(-0.05, 1.41, -0.01), segment(-0.02, 1.4, 0.06), segment(0.45, 1.28, 0.16)], outline=0.016, smooth=True)
land.visible_shadow = False
for k in range(9):
    a = math.radians(25 + k * 16)
    ball(f'tree{k}', M['tree'], 1.15 * math.cos(a), 1.1 * math.sin(a) * 0.95, G + 0.2, rng.uniform(0.07, 0.09), outline=0.012)

# ---------- the church: yellow walls, white trim, a shingled roof, porch and tower ----------
CX, CY, T = 0.15, 0.45, G + 0.1
box('nave', M['yellow'], CX, CY + 0.1, T - 0.01, 0.3, 0.46, 0.16, outline=0.014, bevel=0)
loft('naveroof', M['shingle'], [[(CX - 0.17, CY - 0.13, T + 0.145), (CX + 0.17, CY - 0.13, T + 0.145), (CX + 0.17, CY + 0.34, T + 0.145), (CX - 0.17, CY + 0.34, T + 0.145)],
                                [(CX - 0.004, CY - 0.13, T + 0.25), (CX + 0.004, CY - 0.13, T + 0.25), (CX + 0.004, CY + 0.34, T + 0.25), (CX - 0.004, CY + 0.34, T + 0.25)]],
     outline=0.01)
for j in range(4):
    box(f'navewin{j}', M['window'], CX + 0.152, CY - 0.02 + j * 0.11, T + 0.06, 0.006, 0.03, 0.05, outline=0, bevel=0)
# the porch: an arcade of white arches across the front
box('porchroof', M['white'], CX, CY - 0.19, T + 0.12, 0.32, 0.12, 0.025, outline=0.006, bevel=0)
for j in range(5):
    x = CX - 0.14 + j * 0.07
    rod(f'porchpost{j}', M['white'], (x, CY - 0.245, T - 0.01), (x, CY - 0.245, T + 0.12), 0.008, segs=6, outline=0.003)
box('porchback', M['yellow'], CX, CY - 0.14, T - 0.01, 0.3, 0.02, 0.14, outline=0.006, bevel=0)
box('door', M['window'], CX, CY - 0.152, T - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
# the tower: tiers getting smaller, then the spire
TZ = T + 0.24
for i, (w, h, mat) in enumerate(((0.12, 0.1, 'yellow'), (0.1, 0.09, 'white'), (0.08, 0.08, 'yellow'))):
    box(f'tier{i}', M[mat], CX, CY - 0.13, TZ, w, w, h, outline=0.008, bevel=0)
    box(f'tierwin{i}', M['window'], CX, CY - 0.13 - w / 2 - 0.004, TZ + h * 0.3, 0.025, 0.006, h * 0.45, outline=0, bevel=0)
    TZ += h
lathe('spire', M['shingle'], ((0.05, 0), (0.004, 0.18)), TZ, CX, CY - 0.13, segs=8, outline=0.008, smooth=False)
rod('cross', M['white'], (CX, CY - 0.13, TZ + 0.18), (CX, CY - 0.13, TZ + 0.23), 0.005, segs=5, outline=0)

# ---------- the palafitos: stilt houses in the water ----------
for k in range(6):
    x = -0.95 + k * 0.24
    y = -0.15 - 0.04 * (k % 2)
    if math.hypot(x, y) > 1.25:
        continue
    for u in (-0.06, 0.06):
        for v in (-0.05, 0.05):
            rod(f'stilt{k}{u}{v}', M['stilt'], (x + u, y + v, G - 0.01), (x + u, y + v, G + 0.07), 0.006, segs=5, outline=0.002)
    box(f'palafito{k}', M[f'p{k % 5}'], x, y, G + 0.065, 0.16, 0.13, 0.09, outline=0.008, bevel=0)
    loft(f'palafitoroof{k}', M['roof'], [[(x - 0.09, y - 0.075, G + 0.15), (x + 0.09, y - 0.075, G + 0.15), (x + 0.09, y + 0.075, G + 0.15), (x - 0.09, y + 0.075, G + 0.15)],
                                         [(x - 0.09, y - 0.004, G + 0.21), (x + 0.09, y - 0.004, G + 0.21), (x + 0.09, y + 0.004, G + 0.21), (x - 0.09, y + 0.004, G + 0.21)]],
         outline=0.006)
    box(f'palafitowin{k}', M['white'], x, y - 0.067, G + 0.095, 0.04, 0.006, 0.035, outline=0, bevel=0)

# ---------- fishing boats ----------
for k, (x, y, mat) in enumerate(((-0.4, -0.7, 'boatBlue'), (0.35, -0.65, 'p0'), (0.75, -0.4, 'p2'))):
    loft(f'boat{k}', M[mat], [[(x - 0.09, y, G - 0.002), (x + 0.05, y - 0.03, G - 0.002), (x + 0.1, y, G - 0.002), (x + 0.05, y + 0.03, G - 0.002)],
                              [(x - 0.1, y, G + 0.04), (x + 0.05, y - 0.04, G + 0.04), (x + 0.13, y, G + 0.045), (x + 0.05, y + 0.04, G + 0.04)]], outline=0.006)
    box(f'boatcabin{k}', M['boat'], x - 0.02, y, G + 0.04, 0.05, 0.05, 0.04, outline=0.004, bevel=0)

turn(before, -20)
render(G)
