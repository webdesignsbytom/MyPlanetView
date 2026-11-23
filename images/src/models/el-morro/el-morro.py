# A cartoon El Morro for the country maps, built in the set's shared look (../toon.py): Castillo
# San Felipe del Morro on its headland at Old San Juan's harbour mouth in Puerto Rico, its stepped
# stone ramparts and round sentry boxes with domed tops, the lighthouse and flag on top, the great
# lawn in front with kites, and the old town's pastel houses behind. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P el-morro.py -- el-morro-1024.png 1024 el-morro.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'rock': toon('rock', '#8a7a6a', shadow_mul=(0.8, 0.78, 0.84)),
    'stone': toon('stone', '#c8b89a', shadow_mul=(0.82, 0.8, 0.84)),
    'stoneDark': toon('stoneDark', '#a8987a', shadow_mul=(0.82, 0.8, 0.84)),
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'h1': toon('h1', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)), 'h2': toon('h2', '#6ab8e0', shadow_mul=(0.74, 0.8, 0.88)),
    'h3': toon('h3', '#f08a8a', shadow_mul=(0.84, 0.74, 0.8)), 'h4': toon('h4', '#7ac08a', shadow_mul=(0.74, 0.82, 0.78)),
    'window': flat('window', '#3a3640'),
    'kite1': flat('kite1', '#e0453a'), 'kite2': flat('kite2', '#f2c84a'),
    'flagRed': flat('flagRed', '#e03c31'), 'flagWhite': flat('flagWhite', '#ffffff'), 'flagBlue': flat('flagBlue', '#0050f0'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(907)

# ---------- the headland and the lawn ----------
land = [(-1.22, 0.5), (-0.9, -0.35), (-0.3, -0.55), (0.6, -0.45), (1.2, -0.15), (1.22, 0.45), (0.55, 1.15), (-0.55, 1.15)]
hl = loft('headland', M['rock'], [[(x, y, G - 0.01) for x, y in land], [(x * 0.98, y * 0.98 + 0.01, G + 0.08) for x, y in land]], outline=0.02)
hl.visible_shadow = False
top = loft('lawn', M['lawn'], [[(x * 0.97, y * 0.97 + 0.015, G + 0.075) for x, y in land], [(x * 0.96, y * 0.96 + 0.02, G + 0.09) for x, y in land]], outline=0.008)
top.visible_shadow = False
LZ = G + 0.09


# ---------- the fort's stepped ramparts towards the sea ----------
def tier(name, pts, z0, z1, mat):
    loft(name, M[mat], [[(x, y, z0) for x, y in pts], [(x * 0.97 + 0.0, y * 0.97 + 0.012, z1) for x, y in pts]], outline=0.014)


FX, FY = -0.35, -0.2
T1 = [(FX - 0.55, FY - 0.15), (FX + 0.1, FY - 0.32), (FX + 0.55, FY - 0.1), (FX + 0.45, FY + 0.3), (FX - 0.5, FY + 0.3)]
T2 = [(x * 0.75 + FX * 0.25, y * 0.75 + (FY + 0.06) * 0.25) for x, y in T1]
T3 = [(x * 0.5 + FX * 0.5, y * 0.5 + (FY + 0.1) * 0.5) for x, y in T1]
tier('rampart1', T1, G - 0.01, LZ + 0.08, 'stone')
tier('rampart2', T2, LZ + 0.07, LZ + 0.17, 'stoneDark')
tier('rampart3', T3, LZ + 0.16, LZ + 0.25, 'stone')
for k, (x, y, z) in enumerate(((FX + 0.1, FY - 0.32, LZ + 0.08), (FX - 0.55, FY - 0.15, LZ + 0.08), (FX + 0.55, FY - 0.1, LZ + 0.08),
                               (T2[1][0], T2[1][1], LZ + 0.17))):
    lathe(f'garita{k}', M['stone'], ((0.035, 0), (0.035, 0.07)), z - 0.005, x, y, segs=12, outline=0.006)
    lathe(f'garitadome{k}', M['stone'], ((0.042, 0), (0.035, 0.025), (0.015, 0.045), (0.003, 0.06)), z + 0.065, x, y, segs=12, outline=0.005)
    box(f'garitaslit{k}', M['window'], x, y - 0.036, z + 0.02, 0.012, 0.008, 0.025, outline=0, bevel=0)
for k in range(5):
    box(f'embrasure{k}', M['window'], FX - 0.25 + k * 0.1, FY - 0.24 + abs(k - 2) * 0.03, LZ + 0.05, 0.03, 0.01, 0.025, outline=0, bevel=0)
# the lighthouse and the flag on the top
LX, LY = FX + 0.02, FY + 0.12
box('lighthousebase', M['white'], LX, LY, LZ + 0.245, 0.08, 0.08, 0.08, outline=0.006, bevel=0)
lathe('lighthouse', M['white'], ((0.03, 0), (0.026, 0.12)), LZ + 0.32, LX, LY, segs=10, outline=0.006)
lathe('lighthousetop', M['stoneDark'], ((0.034, 0), (0.034, 0.02), (0.004, 0.05)), LZ + 0.44, LX, LY, segs=10, outline=0.004)
rod('flagpole', M['white'], (FX - 0.12, FY + 0.12, LZ + 0.245), (FX - 0.12, FY + 0.12, LZ + 0.45), 0.005, segs=6, outline=0)
for k in range(5):
    box(f'flagstripe{k}', M['flagRed' if k % 2 == 0 else 'flagWhite'], FX - 0.065, FY + 0.12, LZ + 0.405 + k * 0.01, 0.1, 0.006, 0.01, outline=0, bevel=0)
loft('flagtriangle', M['flagBlue'], [[(FX - 0.115, FY + 0.117, LZ + 0.405), (FX - 0.115, FY + 0.117, LZ + 0.455), (FX - 0.07, FY + 0.117, LZ + 0.43)],
                                     [(FX - 0.115, FY + 0.123, LZ + 0.405), (FX - 0.115, FY + 0.123, LZ + 0.455), (FX - 0.07, FY + 0.123, LZ + 0.43)]], outline=0)

# ---------- kites over the lawn ----------
for k, (x, y, z, mat) in enumerate(((0.35, 0.1, 0.55, 'kite1'), (0.6, 0.3, 0.62, 'kite2'))):
    loft(f'kite{k}', M[mat], [[(x, y - 0.002, G + z - 0.05), (x + 0.035, y - 0.002, G + z), (x, y - 0.002, G + z + 0.06), (x - 0.035, y - 0.002, G + z)],
                              [(x, y + 0.002, G + z - 0.05), (x + 0.035, y + 0.002, G + z), (x, y + 0.002, G + z + 0.06), (x - 0.035, y + 0.002, G + z)]], outline=0.004)
    bar(f'kitestring{k}', M['white'], (x, y, G + z - 0.05), (x + 0.05, y - 0.4, LZ), 0.003, outline=0)

# ---------- Old San Juan's pastel houses behind ----------
for k, (x, y) in enumerate(((0.15, 0.75), (0.38, 0.72), (0.6, 0.7), (0.82, 0.62), (0.25, 0.95), (0.5, 0.95), (-0.05, 0.95), (1.0, 0.35))):
    mat = ('h1', 'h2', 'h3', 'h4')[k % 4]
    box(f'house{k}', M[mat], x, y, LZ - 0.005, 0.18, 0.14, rng.uniform(0.1, 0.16), outline=0.01, bevel=0)
    for j in (-1, 1):
        box(f'housewin{k}{j}', M['window'], x + j * 0.05, y - 0.074, LZ + 0.04, 0.025, 0.01, 0.04, outline=0, bevel=0)

turn(before, -20)
render(G)
