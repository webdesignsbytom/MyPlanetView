# A cartoon Riesenrad for the country maps, built in the set's shared look (../toon.py): the Prater's
# old giant Ferris wheel in Vienna, its two steel rims laced together by spokes to the hub, its red
# wooden cabins like little railway carriages hanging between the rims, the trestle towers of steel
# that hold its axle, the entrance pavilion at its foot, and the Prater's chestnut trees. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P riesenrad.py -- riesenrad-1024.png 1024 riesenrad.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c8b8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'steel': toon('steel', '#6a7280', shadow_mul=(0.84, 0.86, 0.92), lift=0.1),
    'steelDark': toon('steelDark', '#4a5260'),
    'red': toon('red', '#c8372e', shadow_mul=(0.86, 0.76, 0.76), lift=0.1),
    'cream': toon('cream', '#f0e2c4', lift=0.15),
    'window': flat('window', '#3a3a46'),
    'roof': toon('roof', '#5a6a58'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

WY = 0.1               # the wheel stands across the tile, facing the camera
R = 0.62
CZ = G + R + 0.16
N = 30
for fy in (-0.06, 0.06):
    rim = [(R * math.sin(2 * math.pi * k / N), WY + fy, CZ + R * math.cos(2 * math.pi * k / N)) for k in range(N)]
    for k in range(N):
        bar(f'rim{fy}{k}', M['steel'], rim[k], rim[(k + 1) % N], 0.018, outline=0.002)
    for k in range(0, N, 2):
        rod(f'spoke{fy}{k}', M['steelDark'], (0, WY + fy * 1.6, CZ), rim[k], 0.0025, segs=4, outline=0)
    # the inner ring of the wheel's lattice
    inner = [(0.88 * R * math.sin(2 * math.pi * k / N), WY + fy, CZ + 0.88 * R * math.cos(2 * math.pi * k / N)) for k in range(N)]
    for k in range(N):
        bar(f'innerrim{fy}{k}', M['steel'], inner[k], inner[(k + 1) % N], 0.01, outline=0)
        bar(f'lattice{fy}{k}', M['steelDark'], rim[k], inner[(k + 1) % N], 0.005, outline=0)
cyl('axle', M['steelDark'], 0.03, 0.24, segs=12, outline=0.003, matrix=Matrix.Translation((0, WY, CZ)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('hub', M['steel'], 0.06, 0.16, segs=16, outline=0.004, matrix=Matrix.Translation((0, WY, CZ)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the cabins hanging between the rims, at every other spoke
for k in range(0, N, 2):
    a = 2 * math.pi * k / N
    x, z = (R + 0.01) * math.sin(a), CZ + (R + 0.01) * math.cos(a)
    rod(f'hangar{k}', M['steelDark'], (x, WY, z), (x, WY, z - 0.04), 0.003, segs=4, outline=0)
    box(f'cabin{k}', M['red'], x, WY, z - 0.1, 0.1, 0.1, 0.06, outline=0.003, bevel=0)
    box(f'cabinroof{k}', M['cream'], x, WY, z - 0.042, 0.11, 0.11, 0.012, outline=0.002, bevel=0)
    for fy in (-1, 1):
        box(f'cabinwin{k}{fy}', M['window'], x, WY + fy * 0.051, z - 0.085, 0.07, 0.006, 0.025, outline=0, bevel=0)

# ---------- the trestle towers holding the axle ----------
for fy in (-1, 1):
    for s in (-1, 1):
        bar(f'trestle{fy}{s}', M['steel'], (s * 0.42, WY + fy * 0.26, G), (0, WY + fy * 0.13, CZ), 0.03, outline=0.003)
    for z in (G + 0.15, G + 0.35, G + 0.55):
        t = (z - G) / (CZ - G)
        w = 0.42 * (1 - t)
        bar(f'trestletie{fy}{z:.2f}', M['steelDark'], (-w, WY + fy * (0.26 - 0.13 * t), z), (w, WY + fy * (0.26 - 0.13 * t), z), 0.012, outline=0)

# ---------- the entrance pavilion and trees ----------
box('pavilion', M['cream'], 0, WY - 0.28, G - 0.005, 0.36, 0.14, 0.1, outline=0.005, bevel=0)
box('pavilionsign', M['red'], 0, WY - 0.353, G + 0.06, 0.24, 0.006, 0.03, outline=0, bevel=0)
loft('pavilionroof', M['roof'], [[(-0.2, WY - 0.36, G + 0.095), (0.2, WY - 0.36, G + 0.095), (0.2, WY - 0.2, G + 0.095), (-0.2, WY - 0.2, G + 0.095)],
                                 [(-0.16, WY - 0.29, G + 0.15), (0.16, WY - 0.29, G + 0.15), (0.16, WY - 0.27, G + 0.15), (-0.16, WY - 0.27, G + 0.15)]], outline=0.003)
for k, (x, y) in enumerate(((-0.85, -0.45), (-0.95, 0.35), (0.85, -0.45), (0.95, 0.35), (-0.5, -0.85), (0.5, -0.85))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
