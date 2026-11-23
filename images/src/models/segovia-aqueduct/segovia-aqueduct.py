# A cartoon Segovia for the country maps, built in the set's shared look (../toon.py): the Roman
# aqueduct's two tiers of granite arches striding across the square, the old town's houses beside
# it, and the Alcázar on its rock with its slate-blue pointed turrets. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P segovia-aqueduct.py -- segovia-aqueduct-1024.png 1024 segovia-aqueduct.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8bca4', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'granite': toon('granite', '#b8aa94', shadow_mul=(0.82, 0.8, 0.86)),
    'graniteDark': toon('graniteDark', '#9a8e7a', shadow_mul=(0.82, 0.8, 0.86)),
    'rock': toon('rock', '#a89a86', shadow_mul=(0.82, 0.8, 0.86)),
    'castle': toon('castle', '#ece2cc', shadow_mul=(0.82, 0.82, 0.9), lift=0.2),
    'slate': toon('slate', '#4a5a74', shadow_mul=(0.8, 0.82, 0.9)),
    'house': toon('house', '#e8d4b0'),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#3a3640'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1483)

# ---------- the aqueduct: two tiers of arches ----------
AY = -0.15
N, SPAN, PIER = 9, 0.15, 0.06
L = N * SPAN + (N + 1) * PIER
X0 = -L / 2
for k in range(N + 1):
    x = X0 + PIER / 2 + k * (SPAN + PIER)
    box(f'lowerpier{k}', M['granite'], x, AY, G - 0.005, PIER, 0.1, 0.34, outline=0.007, bevel=0)
    box(f'upperpier{k}', M['granite'], x, AY, G + 0.37, PIER * 0.85, 0.08, 0.14, outline=0.006, bevel=0)
for tier, (spring, top, rise) in enumerate(((G + 0.26, G + 0.335, 0.06), (G + 0.45, G + 0.51, 0.045))):
    for k in range(N):
        x0 = X0 + PIER + k * (SPAN + PIER)
        for j in range(6):
            um = (j + 0.5) / 6
            z = spring + rise * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
            box(f'arch{tier}{k}_{j}', M['granite'], x0 + SPAN * um, AY, z, SPAN / 6 + 0.002, 0.09 - 0.015 * tier, top - z, outline=0.003, bevel=0)
box('ledge', M['graniteDark'], 0.0, AY, G + 0.335, L + 0.02, 0.12, 0.035, outline=0.006, bevel=0)
box('channel', M['graniteDark'], 0.0, AY, G + 0.51, L + 0.02, 0.09, 0.045, outline=0.008, bevel=0)

# ---------- the old town's houses ----------
for k, (x, y) in enumerate(((-0.9, 0.3), (-0.65, 0.4), (-0.4, 0.3), (0.35, -0.55), (0.6, -0.5), (-0.6, -0.55), (-0.35, -0.6))):
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.18, 0.13, 0.1, outline=0.008, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.095, 0.2, 0.06, outline=0.006)
    box(f'housewin{k}', M['window'], x, y - 0.069, G + 0.04, 0.03, 0.006, 0.035, outline=0, bevel=0)

# ---------- the Alcázar on its rock ----------
CX, CY = 0.55, 0.55
rock = loft('alcazarrock', M['rock'], [[(CX - 0.4, CY - 0.2, G - 0.01), (CX + 0.35, CY - 0.25, G - 0.01), (CX + 0.4, CY + 0.25, G - 0.01), (CX - 0.35, CY + 0.25, G - 0.01)],
                                       [(CX - 0.32, CY - 0.15, G + 0.14), (CX + 0.28, CY - 0.18, G + 0.14), (CX + 0.32, CY + 0.2, G + 0.14), (CX - 0.28, CY + 0.2, G + 0.14)]],
            outline=0.014)
rock.visible_shadow = False
T = G + 0.14
box('alcazar', M['castle'], CX, CY, T - 0.005, 0.4, 0.22, 0.16, outline=0.012, bevel=0)
box('keep', M['castle'], CX + 0.2, CY + 0.02, T - 0.005, 0.16, 0.16, 0.3, outline=0.012, bevel=0)
for j in range(4):
    a = math.pi / 4 + j * math.pi / 2
    lathe(f'keepturret{j}', M['castle'], ((0.025, 0), (0.025, 0.06)), T + 0.27, CX + 0.2 + 0.075 * math.cos(a), CY + 0.02 + 0.075 * math.sin(a), segs=10, outline=0.004)
    lathe(f'keepcone{j}', M['slate'], ((0.03, 0), (0.004, 0.09)), T + 0.33, CX + 0.2 + 0.075 * math.cos(a), CY + 0.02 + 0.075 * math.sin(a), segs=10, outline=0.004)
for k, (x, y, h) in enumerate(((CX - 0.2, CY - 0.1, 0.22), (CX - 0.05, CY - 0.11, 0.2), (CX - 0.2, CY + 0.1, 0.2))):
    lathe(f'turret{k}', M['castle'], ((0.04, 0), (0.04, h)), T - 0.005, x, y, segs=12, outline=0.008)
    lathe(f'turretcone{k}', M['slate'], ((0.05, 0), (0.004, 0.16)), T - 0.005 + h, x, y, segs=12, outline=0.006)
loft('alcazarroof', M['slate'], [[(CX - 0.2, CY - 0.11, T + 0.155), (CX + 0.12, CY - 0.11, T + 0.155), (CX + 0.12, CY + 0.11, T + 0.155), (CX - 0.2, CY + 0.11, T + 0.155)],
                                 [(CX - 0.2, CY - 0.005, T + 0.23), (CX + 0.12, CY - 0.005, T + 0.23), (CX + 0.12, CY + 0.005, T + 0.23), (CX - 0.2, CY + 0.005, T + 0.23)]],
     outline=0.008)
for k, (x, y) in enumerate(((-1.0, -0.2), (1.05, -0.2), (-0.15, 0.6), (0.05, 0.85))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, 0.075, outline=0.011)

turn(before, -20)
render(G)
