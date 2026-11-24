# A cartoon Noto Cathedral for the country maps, built in the set's shared look (../toon.py): the
# Sicilian baroque cathedral of San Nicolò in honey-gold limestone, its columned front with the
# pediment between two bell towers, the dome rising behind, and the great staircase climbing to it
# in three flights from the main street, with palms either side. Turned a little towards the camera.
# Run: blender -b --factory-startup -P noto.py -- noto-1024.png 1024 noto.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'street': toon('street', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'stone': toon('stone', '#e8c088', shadow_mul=(0.88, 0.84, 0.76), lift=0.1),
    'stoneDark': toon('stoneDark', '#c89a60'),
    'steps': toon('steps', '#e0c8a0', shadow_mul=(0.86, 0.84, 0.8)),
    'dome': toon('dome', '#d8d0c0', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'dark': flat('dark', '#3a2e24'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['street'])
before = set(bpy.data.objects)

# ---------- the staircase ----------
SW = 0.62
flights = ((-0.7, -0.5, 0.0, 0.05), (-0.45, -0.3, 0.05, 0.1), (-0.25, -0.1, 0.1, 0.15))
for f, (y0, y1, z0, z1) in enumerate(flights):
    n = 6
    for i in range(n):
        t = (i + 1) / n
        box(f'step{f}{i}', M['steps'], 0.0, y0 + (y1 - y0) * (i + 0.5) / n, G - 0.005, SW - f * 0.06, (y1 - y0) / n + 0.004, z0 + (z1 - z0) * t, outline=0.001, bevel=0)
    if f < 2:
        box(f'landing{f}', M['steps'], 0.0, (y1 + flights[f + 1][0]) / 2, G - 0.005, SW - f * 0.06, flights[f + 1][0] - y1 + 0.01, z1, outline=0.002, bevel=0)
box('terrace', M['steps'], 0.0, 0.2, G - 0.005, 0.7, 0.6, 0.15, outline=0.005, bevel=0)
T = G + 0.145

# ---------- the cathedral ----------
FY = -0.04
box('nave', M['stone'], 0.0, 0.25, T - 0.005, 0.36, 0.5, 0.22, outline=0.007, bevel=0)
box('front', M['stone'], 0.0, FY, T - 0.005, 0.34, 0.06, 0.3, outline=0.007, bevel=0)
box('door', M['dark'], 0.0, FY - 0.033, T - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
cyl('doortop', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0.0, FY - 0.033, T + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for x in (-0.12, -0.07, 0.07, 0.12):
    rod(f'col{x}', M['stoneDark'], (x, FY - 0.04, T), (x, FY - 0.04, T + 0.18), 0.012, segs=10, outline=0.002)
    rod(f'uppercol{x}', M['stoneDark'], (x * 0.7, FY - 0.04, T + 0.2), (x * 0.7, FY - 0.04, T + 0.29), 0.009, segs=10, outline=0.001)
box('entablature', M['stoneDark'], 0.0, FY - 0.03, T + 0.18, 0.34, 0.03, 0.02, outline=0.001, bevel=0)
box('window', M['dark'], 0.0, FY - 0.033, T + 0.21, 0.04, 0.006, 0.06, outline=0, bevel=0)
loft('pediment', M['stone'], [[(-0.12, FY - 0.03, T + 0.295), (0.12, FY - 0.03, T + 0.295), (0.12, FY + 0.03, T + 0.295), (-0.12, FY + 0.03, T + 0.295)],
                              [(-0.004, FY - 0.03, T + 0.36), (0.004, FY - 0.03, T + 0.36), (0.004, FY + 0.03, T + 0.36), (-0.004, FY + 0.03, T + 0.36)]], outline=0.003)
for s in (-1, 1):
    tx = s * 0.24
    box(f'tower{s}', M['stone'], tx, FY + 0.02, T - 0.005, 0.12, 0.12, 0.34, outline=0.006, bevel=0)
    box(f'belfry{s}', M['dark'], tx, FY - 0.043, T + 0.24, 0.04, 0.006, 0.07, outline=0, bevel=0)
    cyl(f'belfrytop{s}', M['dark'], 0.02, 0.006, segs=10, outline=0, matrix=Matrix.Translation((tx, FY - 0.043, T + 0.31)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    lathe(f'towercap{s}', M['stoneDark'], ((0.055, 0), (0.045, 0.03), (0.02, 0.06), (0.004, 0.09)), T + 0.335, tx, FY + 0.02, segs=8, outline=0.003, smooth=False)
lathe('drum', M['stone'], ((0.11, 0), (0.11, 0.1)), T + 0.215, 0.0, 0.3, segs=16, outline=0.005)
lathe('dome', M['dome'], ((0.115, 0), (0.1, 0.06), (0.06, 0.11), (0.004, 0.13)), T + 0.31, 0.0, 0.3, segs=20, outline=0.005)
lathe('lantern', M['stone'], ((0.025, 0), (0.025, 0.04), (0.004, 0.08)), T + 0.435, 0.0, 0.3, segs=8, outline=0.002)

for k, (x, y) in enumerate(((-0.55, -0.45), (0.55, -0.45), (-0.62, 0.1), (0.62, 0.1))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.32), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.32), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.26), 0.025, outline=0.002)

turn(before, -20)
render(G)
