# A cartoon Antigua Guatemala for the country maps, built in the set's shared look (../toon.py): the
# yellow Santa Catalina Arch with its little clock tower spanning the cobbled street, the colonial
# houses in bright colours either side, and the Volcán de Agua's green cone behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P antigua-guatemala.py -- antigua-guatemala-1024.png 1024 antigua-guatemala.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'cobbles': toon('cobbles', '#a89a86', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'yellow': toon('archYellow', '#f0c040', shadow_mul=(0.86, 0.78, 0.7), lift=0.15),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'volcano': toon('volcano', '#5a8a4a', shadow_mul=(0.72, 0.8, 0.76)),
    'volcanoTop': toon('volcanoTop', '#8a8a82', shadow_mul=(0.84, 0.84, 0.9)),
    'h0': toon('h0', '#e8603a'), 'h1': toon('h1', '#3fa8b0'), 'h2': toon('h2', '#f0a0a0'), 'h3': toon('h3', '#8ac44a'), 'h4': toon('h4', '#a86ad0'),
    'roof': toon('roof', '#c4573a'),
    'window': flat('window', '#3a3640'),
    'clock': toon('clock', '#f8f6f0', lift=0.2),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the Volcán de Agua ----------
lathe('volcano', M['volcano'], ((0.75, 0), (0.55, 0.25), (0.3, 0.55), (0.15, 0.7)), G - 0.01, 0.1, 0.85, segs=24, outline=0.018)
lathe('volcanotop', M['volcanoTop'], ((0.155, 0), (0.12, 0.04), (0.08, 0.06)), G + 0.69, 0.1, 0.85, segs=24, outline=0.01)

# ---------- the cobbled street and its houses ----------
box('street', M['cobbles'], 0.0, -0.2, G - 0.004, 0.32, 2.2, 0.008, outline=0.004, bevel=0)
for s in (-1, 1):
    for k in range(5):
        y = -0.85 + k * 0.3
        x = s * 0.34
        if math.hypot(x, y) > 1.2:
            continue
        box(f'house{s}{k}', M[f'h{(k + (s > 0)) % 5}'], x, y, G - 0.005, 0.32, 0.28, 0.12, outline=0.009, bevel=0)
        box(f'houseroof{s}{k}', M['roof'], x, y, G + 0.115, 0.34, 0.3, 0.025, outline=0.004, bevel=0)
        box(f'housedoor{s}{k}', M['window'], x - s * 0.162, y, G, 0.006, 0.05, 0.08, outline=0, bevel=0)
        box(f'housewin{s}{k}', M['window'], x - s * 0.162, y + 0.08, G + 0.04, 0.006, 0.04, 0.04, outline=0, bevel=0)

# ---------- the Santa Catalina Arch ----------
AY = 0.1
for s in (-1, 1):
    box(f'archpier{s}', M['yellow'], s * 0.2, AY, G - 0.005, 0.1, 0.16, 0.2, outline=0.01, bevel=0)
for j in range(7):
    um = (j + 0.5) / 7
    z = G + 0.13 + 0.07 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
    box(f'archslice{j}', M['yellow'], -0.15 + 0.3 * um, AY, z, 0.3 / 7 + 0.002, 0.16, G + 0.3 - z, outline=0.003, bevel=0)
box('archtop', M['yellow'], 0.0, AY, G + 0.295, 0.52, 0.18, 0.04, outline=0.01, bevel=0)
box('archband', M['white'], 0.0, AY, G + 0.2, 0.52, 0.17, 0.015, outline=0.003, bevel=0)
for j in range(5):
    box(f'archwin{j}', M['window'], -0.16 + j * 0.08, AY - 0.082, G + 0.24, 0.025, 0.006, 0.035, outline=0, bevel=0)
box('clocktower', M['yellow'], 0.0, AY, G + 0.33, 0.14, 0.12, 0.12, outline=0.008, bevel=0)
cyl('clock', M['clock'], 0.035, 0.008, segs=16, outline=0.004, matrix=Matrix.Translation((0.0, AY - 0.064, G + 0.39)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('clockroof', M['roof'], [[(-0.08, AY - 0.07, G + 0.45), (0.08, AY - 0.07, G + 0.45), (0.08, AY + 0.07, G + 0.45), (-0.08, AY + 0.07, G + 0.45)],
                              [(-0.08, AY - 0.004, G + 0.5), (0.08, AY - 0.004, G + 0.5), (0.08, AY + 0.004, G + 0.5), (-0.08, AY + 0.004, G + 0.5)]], outline=0.006)

turn(before, -20)
render(G)
