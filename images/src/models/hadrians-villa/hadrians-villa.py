# A cartoon Hadrian's Villa for the country maps, built in the set's shared look (../toon.py): the
# Canopus at Tivoli, its long pool reflecting the sky, the curved colonnade at its end with arches
# and straight lintels in turn, the white marble statues on their plinths along its sides, the
# Serapeum's great half-dome behind, the ruined brick walls and the dark cypresses. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P hadrians-villa.py -- hadrians-villa-1024.png 1024 hadrians-villa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'water': toon('water', '#6ab0c8', lift=0.3),
    'marble': toon('marble', '#f2ece0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'stone': toon('stone', '#d8ccb0'),
    'brick': toon('brick', '#b8785a', shadow_mul=(0.86, 0.8, 0.78)),
    'cypress': toon('cypress', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'dark': flat('dark', '#4a3830'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

PX, Y0, Y1, W = 0.0, -0.7, 0.35, 0.32
box('poolrim', M['stone'], PX, (Y0 + Y1) / 2, G - 0.005, W + 0.06, Y1 - Y0 + 0.06, 0.025, outline=0.004, bevel=0)
box('pool', M['water'], PX, (Y0 + Y1) / 2, G - 0.003, W, Y1 - Y0, 0.03, outline=0.001, bevel=0)
lathe('poolendrim', M['stone'], ((W / 2 + 0.03, 0), (W / 2 + 0.03, 0.025)), G - 0.005, PX, Y1, segs=24, outline=0.004)
lathe('poolend', M['water'], ((W / 2, 0), (W / 2, 0.03)), G - 0.003, PX, Y1, segs=24, outline=0.001)

# ---------- the curved colonnade at the end ----------
R = W / 2 + 0.02
n = 9
pts = []
for k in range(n):
    a = math.radians(10 + 160 * k / (n - 1))
    x, y = PX + R * math.cos(a), Y1 + R * math.sin(a)
    pts.append((x, y))
    rod(f'curvecol{k}', M['marble'], (x, y, G + 0.02), (x, y, G + 0.24), 0.013, segs=10, outline=0.002)
for k in range(n - 1):
    (x0, y0), (x1, y1) = pts[k], pts[k + 1]
    if k % 2 == 0:
        m = 6
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        half = math.hypot(x1 - x0, y1 - y0) / 2
        for i in range(m):
            t0, t1 = i / m, (i + 1) / m
            p0 = (x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0, G + 0.24 + half * math.sin(math.pi * t0))
            p1 = (x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1, G + 0.24 + half * math.sin(math.pi * t1))
            bar(f'arch{k}{i}', M['marble'], p0, p1, 0.016, outline=0.001)
    else:
        bar(f'lintel{k}', M['marble'], (x0, y0, G + 0.245), (x1, y1, G + 0.245), 0.02, outline=0.002)

# ---------- statues along the sides ----------
for s in (-1, 1):
    for j in range(6):
        y = Y0 + 0.1 + j * 0.15
        x = PX + s * (W / 2 + 0.06)
        box(f'plinth{s}{j}', M['stone'], x, y, G - 0.005, 0.04, 0.04, 0.04, outline=0.002, bevel=0)
        if j % 2 == 0:
            rod(f'sidecol{s}{j}', M['marble'], (x, y, G + 0.035), (x, y, G + 0.2), 0.012, segs=10, outline=0.002)
        else:
            lathe(f'statue{s}{j}', M['marble'], ((0.016, 0), (0.014, 0.06), (0.01, 0.1)), G + 0.035, x, y, segs=10, outline=0.002)
            ball(f'statuehead{s}{j}', M['marble'], x, y, G + 0.15, 0.012, outline=0.001)

# ---------- the Serapeum ----------
SY = Y1 + 0.42
box('serapeumback', M['brick'], PX, SY + 0.05, G - 0.005, 0.5, 0.12, 0.3, outline=0.007, bevel=0)
lathe('halfdome', M['brick'], ((0.2, 0), (0.17, 0.08), (0.1, 0.14), (0.004, 0.16)), G + 0.17, PX, SY, segs=20, outline=0.006)
box('exedra', M['dark'], PX, SY - 0.012, G - 0.005, 0.2, 0.006, 0.18, outline=0, bevel=0)

# ---------- ruins and cypresses ----------
for k, (x, y, w, h) in enumerate(((-0.65, 0.1, 0.25, 0.12), (0.65, 0.0, 0.22, 0.1), (-0.55, -0.4, 0.18, 0.07))):
    box(f'ruin{k}', M['brick'], x, y, G - 0.005, w, 0.05, h, outline=0.004, bevel=0)
for k, (x, y) in enumerate(((-0.45, 0.6), (0.45, 0.62), (-0.8, 0.35), (0.8, 0.35), (-0.35, -0.75), (0.35, -0.78))):
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.035, 0.15), (0.004, 0.34)), G - 0.005, x, y, segs=10, outline=0.004)

turn(before, -20)
render(G)
