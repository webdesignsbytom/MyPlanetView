# A cartoon Casco Viejo for the country maps, built in the set's shared look (../toon.py): Panama
# City's old quarter on its little peninsula, the cathedral's white towers inlaid with mother of
# pearl, the restored colonial houses in bright colours with wrought-iron balconies, the old sea wall
# with its promenade, and across the bay the glass towers of the modern skyline.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P casco-viejo.py -- casco-viejo-1024.png 1024 casco-viejo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bay': toon('bay', '#3a8ab0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'wall': toon('wall', '#b8aa94', shadow_mul=(0.84, 0.82, 0.86)),
    'paving': toon('paving', '#d8ccb4', lift=0.2),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'pearl': toon('pearl', '#e8ecf4', lift=0.3),
    'h0': toon('h0', '#f0c050'), 'h1': toon('h1', '#e8806a'), 'h2': toon('h2', '#8ad0c8'), 'h3': toon('h3', '#c8a0e0'), 'h4': toon('h4', '#f2ece0', lift=0.2),
    'roof': toon('roof', '#c4573a'),
    'iron': flat('iron', '#2e2a30'),
    'glass': toon('glass', '#7aa8d0', shadow_mul=(0.76, 0.82, 0.92), lift=0.25),
    'glassDark': toon('glassDark', '#4a7ab0', shadow_mul=(0.76, 0.82, 0.92), lift=0.2),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['bay'])
before = set(bpy.data.objects)
rng = random.Random(1913)

# ---------- the skyline across the bay ----------
for k in range(9):
    a = math.radians(55 + k * 9)
    x, y = 1.2 * math.cos(a), 1.12 * math.sin(a)
    h = rng.uniform(0.35, 0.7)
    box(f'tower{k}', M['glass' if k % 2 else 'glassDark'], x, y, G - 0.005, 0.1, 0.1, h, rot_z=a, outline=0.008, bevel=0)
    for j in range(int(h / 0.08)):
        box(f'towerband{k}{j}', M['white'], x - 0.051 * math.cos(a), y - 0.051 * math.sin(a), G + 0.04 + j * 0.08, 0.006, 0.1, 0.008, rot_z=a, outline=0, bevel=0)

# ---------- the old quarter's peninsula and its sea wall ----------
FOOT = [(-1.2, -0.45), (-0.4, -0.75), (0.45, -0.6), (0.55, 0.05), (0.0, 0.35), (-0.9, 0.3)]
pen = loft('seawall', M['wall'], [[(x, y, G - 0.01) for x, y in FOOT], [(x * 0.98, y * 0.98, G + 0.07) for x, y in FOOT]], outline=0.014)
pen.visible_shadow = False
T = G + 0.07

# ---------- the cathedral ----------
CX, CY = -0.4, -0.05
box('cathedral', M['white'], CX, CY, T - 0.005, 0.34, 0.2, 0.18, outline=0.012, bevel=0)
for s in (-1, 1):
    tx = CX + s * 0.17
    box(f'ctower{s}', M['white'], tx, CY - 0.06, T - 0.005, 0.08, 0.08, 0.32, outline=0.01, bevel=0)
    lathe(f'ctowercap{s}', M['pearl'], ((0.045, 0), (0.035, 0.04), (0.004, 0.09)), T + 0.315, tx, CY - 0.06, segs=8, outline=0.004)
    box(f'ctowerwin{s}', M['iron'], tx, CY - 0.104, T + 0.22, 0.025, 0.006, 0.05, outline=0, bevel=0)
box('cdoor', M['iron'], CX, CY - 0.104, T, 0.06, 0.006, 0.1, outline=0, bevel=0)
pyramid('cgable', M['white'], CX, CY - 0.06, T + 0.175, 0.2, 0.06, outline=0.006)

# ---------- the colonial houses, their balconies ----------
for k, (x, y) in enumerate(((-0.9, -0.3), (-0.7, -0.45), (-0.05, -0.45), (0.2, -0.4), (0.3, -0.1), (-0.1, 0.1), (-0.65, 0.12), (0.1, -0.2))):
    h = rng.uniform(0.13, 0.18)
    box(f'house{k}', M[f'h{k % 5}'], x, y, T - 0.005, 0.18, 0.15, h, outline=0.008, bevel=0)
    box(f'houseroof{k}', M['roof'], x, y, T + h - 0.008, 0.19, 0.16, 0.02, outline=0.003, bevel=0)
    box(f'balcony{k}', M['iron'], x, y - 0.085, T + h * 0.55, 0.15, 0.02, 0.02, outline=0, bevel=0)
    for j in range(2):
        box(f'housewin{k}{j}', M['iron'], x - 0.045 + j * 0.09, y - 0.077, T + h * 0.62, 0.025, 0.006, 0.04, outline=0, bevel=0)
for k, (x, y) in enumerate(((0.45, -0.45), (-1.0, -0.05), (0.0, -0.62))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, T), (x + 0.02, y, T + 0.26), 0.012, r2=0.009, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, T + 0.26), (x + 0.02 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), T + 0.22), 0.017, outline=0.004)

turn(before, -20)
render(G)
