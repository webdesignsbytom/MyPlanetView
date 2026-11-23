# A cartoon León Cathedral for the country maps, built in the set's shared look (../toon.py):
# Nicaragua's great white baroque-neoclassical basilica, its broad columned front between two low
# bell towers, the central dome and the rows of little domes on its white roof that visitors walk
# among, the park in front with palms, and Momotombo's cone behind. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P leon-cathedral.py -- leon-cathedral-1024.png 1024 leon-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'cream': toon('cream2', '#ece4d0', shadow_mul=(0.82, 0.8, 0.86)),
    'window': flat('window', '#3a3640'),
    'volcano': toon('volcano', '#6a7a5a', shadow_mul=(0.76, 0.8, 0.78)),
    'volcanoTop': toon('volcanoTop', '#8a7e74', shadow_mul=(0.82, 0.8, 0.86)),
    'plaza': toon('plaza', '#d9c9a8', lift=0.25),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'lion': toon('lion', '#e8dcc0', shadow_mul=(0.82, 0.8, 0.84)),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(877)

# ---------- Momotombo behind ----------
vl = loft('momotombo', M['volcano'], [[(0.55 + 0.6 * math.cos(t), 0.95 + 0.3 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 20 for j in range(20))],
                                     [(0.55 + 0.2 * math.cos(t), 0.98 + 0.1 * math.sin(t), G + 0.42) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.022)
vl.visible_shadow = False
vt = loft('momotombotop', M['volcanoTop'], [[(0.55 + 0.2 * math.cos(t), 0.98 + 0.1 * math.sin(t), G + 0.42) for t in (2 * math.pi * j / 20 for j in range(20))],
                                           [(0.55 + 0.05 * math.cos(t), 0.99 + 0.03 * math.sin(t), G + 0.55) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.016)
vt.visible_shadow = False

# ---------- the plaza and the park ----------
box('plaza', M['plaza'], 0, -0.5, G - 0.004, 1.4, 0.6, 0.008, outline=0.005, bevel=0)

# ---------- the cathedral ----------
CX, CY, W, D, H = 0.0, 0.25, 0.8, 0.7, 0.24
box('nave', M['white'], CX, CY, G - 0.005, W, D, H, outline=0.02, bevel=0)
box('roof', M['white'], CX, CY, G + H - 0.005, W + 0.02, D + 0.02, 0.02, outline=0.006, bevel=0)
# the front: pilasters, a pediment and the doors
FY = CY - D / 2
for k in range(7):
    x = CX - 0.3 + k * 0.1
    box(f'pilaster{k}', M['cream'], x, FY - 0.006, G - 0.005, 0.03, 0.012, H, outline=0.003, bevel=0)
for k in range(3):
    box(f'door{k}', M['window'], CX - 0.1 + k * 0.1, FY - 0.008, G, 0.05, 0.01, 0.1, outline=0, bevel=0)
    box(f'frontwin{k}', M['window'], CX - 0.1 + k * 0.1, FY - 0.008, G + 0.15, 0.03, 0.01, 0.05, outline=0, bevel=0)
loft('pediment', M['white'], [[(CX - 0.2, FY - 0.01, G + H + 0.015), (CX + 0.2, FY - 0.01, G + H + 0.015), (CX, FY - 0.01, G + H + 0.12)],
                              [(CX - 0.2, FY + 0.03, G + H + 0.015), (CX + 0.2, FY + 0.03, G + H + 0.015), (CX, FY + 0.03, G + H + 0.12)]], outline=0.008)
# the two low bell towers and their domed tops
for s in (-1, 1):
    tx = CX + s * (W / 2 - 0.06)
    box(f'tower{s}', M['white'], tx, FY + 0.06, G - 0.005, 0.15, 0.15, H + 0.14, outline=0.014, bevel=0)
    box(f'belfry{s}', M['window'], tx, FY - 0.017, G + H + 0.05, 0.05, 0.01, 0.06, outline=0, bevel=0)
    lathe(f'towerdome{s}', M['white'], ((0.07, 0), (0.06, 0.04), (0.03, 0.07), (0.004, 0.08)), G + H + 0.135, tx, FY + 0.06, segs=16, outline=0.008)
    lathe(f'towerlantern{s}', M['white'], ((0.015, 0), (0.015, 0.03), (0.003, 0.05)), G + H + 0.21, tx, FY + 0.06, segs=8, outline=0.004)
# the central dome on its drum, and the rows of little domes over the vaults
lathe('drum', M['white'], ((0.11, 0), (0.11, 0.08)), G + H + 0.01, CX, CY + 0.08, segs=16, outline=0.01, smooth=False)
for k in range(8):
    a = 2 * math.pi * k / 8
    box(f'drumwin{k}', M['window'], CX + 0.109 * math.cos(a), CY + 0.08 + 0.109 * math.sin(a), G + H + 0.03, 0.012, 0.025, 0.04, rot_z=a, outline=0, bevel=0)
lathe('dome', M['white'], ((0.12, 0), (0.11, 0.06), (0.07, 0.12), (0.004, 0.15)), G + H + 0.085, CX, CY + 0.08, segs=20, outline=0.012)
lathe('domelantern', M['white'], ((0.025, 0), (0.025, 0.04), (0.004, 0.07)), G + H + 0.23, CX, CY + 0.08, segs=8, outline=0.005)
for i in range(4):
    for j in range(3):
        x = CX - 0.3 + i * 0.2
        y = CY - 0.18 + j * 0.2
        if abs(x - CX) < 0.15 and abs(y - (CY + 0.08)) < 0.15:
            continue
        lathe(f'smalldome{i}{j}', M['white'], ((0.05, 0), (0.045, 0.025), (0.025, 0.045), (0.004, 0.055)), G + H + 0.01, x, y, segs=12, outline=0.006)

# ---------- the lions on the steps, and palms in the park ----------
for s in (-1, 1):
    box(f'lionplinth{s}', M['cream'], CX + s * 0.16, FY - 0.08, G - 0.005, 0.06, 0.06, 0.05, outline=0.005, bevel=0)
    box(f'lion{s}', M['lion'], CX + s * 0.16, FY - 0.08, G + 0.045, 0.05, 0.03, 0.04, outline=0.004, bevel=0.01)
for k, (x, y) in enumerate(((-0.55, -0.45), (-0.25, -0.65), (0.25, -0.65), (0.55, -0.45), (-0.95, 0.1), (0.95, 0.0))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.013, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.019, outline=0.005)

turn(before, -20)
render(G)
