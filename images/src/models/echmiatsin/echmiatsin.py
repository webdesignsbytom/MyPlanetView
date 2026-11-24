# A cartoon Etchmiadzin Cathedral for the country maps, built in the set's shared look
# (../toon.py): the mother cathedral of the Armenian Church in pinkish tuff, its cross-shaped body
# with little rotundas on its arms, the central drum under its umbrella-pointed cone, the bell tower
# at the west door with its open three-tiered belfry, and carved cross-stones in the garden.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P echmiatsin.py -- echmiatsin-1024.png 1024 echmiatsin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'lawn': toon('lawn', '#7cb85a'),
    'tuff': toon('tuff', '#d0aca0', shadow_mul=(0.86, 0.82, 0.82), lift=0.08),
    'tuffDark': toon('tuffDark', '#a88478'),
    'roof': toon('roof', '#8a7a78'),
    'dark': flat('dark', '#2e2626'),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.62, -0.1, G - 0.003, 0.4, 0.8, 0.008, outline=0.002, bevel=0)

CX, CY = 0.0, 0.18
box('armx', M['tuff'], CX, CY, G - 0.005, 0.46, 0.22, 0.22, outline=0.008, bevel=0)
box('army', M['tuff'], CX, CY, G - 0.005, 0.22, 0.46, 0.22, outline=0.008, bevel=0)
for k, (dx, dy) in enumerate(((1, 0), (0, 1))):
    loft(f'roof{k}', M['roof'], [[(CX - 0.23 * dx - 0.11 * dy, CY - 0.23 * dy - 0.11 * dx, G + 0.215), (CX + 0.23 * dx - 0.11 * dy, CY + 0.23 * dy - 0.11 * dx, G + 0.215),
                                  (CX + 0.23 * dx + 0.11 * dy, CY + 0.23 * dy + 0.11 * dx, G + 0.215), (CX - 0.23 * dx + 0.11 * dy, CY - 0.23 * dy + 0.11 * dx, G + 0.215)],
                                 [(CX - 0.23 * dx - 0.004 * dy, CY - 0.23 * dy - 0.004 * dx, G + 0.28), (CX + 0.23 * dx - 0.004 * dy, CY + 0.23 * dy - 0.004 * dx, G + 0.28),
                                  (CX + 0.23 * dx + 0.004 * dy, CY + 0.23 * dy + 0.004 * dx, G + 0.28), (CX - 0.23 * dx + 0.004 * dy, CY - 0.23 * dy + 0.004 * dx, G + 0.28)]], outline=0.004)
for k, (dx, dy) in enumerate(((0.14, 0.14), (-0.14, 0.14), (0.14, -0.14), (-0.14, -0.14))):
    lathe(f'rotunda{k}', M['tuff'], ((0.04, 0), (0.04, 0.06)), G + 0.215, CX + dx, CY + dy, segs=8, outline=0.003, smooth=False)
    lathe(f'rotundacone{k}', M['roof'], ((0.045, 0), (0.004, 0.06)), G + 0.27, CX + dx, CY + dy, segs=8, outline=0.002, smooth=False)
lathe('drum', M['tuff'], ((0.08, 0), (0.08, 0.14)), G + 0.26, CX, CY, segs=12, outline=0.005, smooth=False)
for k in range(12):
    a = 2 * math.pi * (k + 0.5) / 12
    if math.sin(a) > 0.3:
        continue
    box(f'drumwin{k}', M['dark'], CX + 0.078 * math.cos(a), CY + 0.078 * math.sin(a), G + 0.3, 0.014, 0.006, 0.06, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('cone', M['roof'], ((0.09, 0), (0.07, 0.02), (0.004, 0.13)), G + 0.395, CX, CY, segs=12, outline=0.004, smooth=False)
rod('cross', M['gold'], (CX, CY, G + 0.52), (CX, CY, G + 0.57), 0.005, segs=6, outline=0)
bar('crossbar', M['gold'], (CX - 0.015, CY, G + 0.555), (CX + 0.015, CY, G + 0.555), 0.007, outline=0)
for side in range(2):
    a = -math.pi / 2 if side == 0 else 0.0
    box(f'armwin{side}', M['dark'], CX + 0.233 * math.cos(a), CY + 0.233 * math.sin(a), G + 0.1, 0.025, 0.006, 0.07, rot_z=a + math.pi / 2, outline=0, bevel=0)

# ---------- the bell tower ----------
BY = CY - 0.3
box('belltowerbase', M['tuff'], CX, BY, G - 0.005, 0.18, 0.12, 0.2, outline=0.006, bevel=0)
box('westdoor', M['dark'], CX, BY - 0.063, G - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
z = G + 0.195
for i, (r, h) in enumerate(((0.06, 0.08), (0.045, 0.07), (0.035, 0.06))):
    for k in range(6):
        a = 2 * math.pi * k / 6
        rod(f'belfrycol{i}{k}', M['tuff'], (CX + r * math.cos(a), BY + r * math.sin(a), z), (CX + r * math.cos(a), BY + r * math.sin(a), z + h), 0.008, segs=6, outline=0.001)
    lathe(f'belfryroof{i}', M['roof'], ((r + 0.012, 0), (r * 0.6, 0.025)), z + h, CX, BY, segs=8, outline=0.002, smooth=False)
    z += h + 0.022
lathe('belfrycone', M['roof'], ((0.035, 0), (0.004, 0.06)), z - 0.005, CX, BY, segs=8, outline=0.002, smooth=False)

# ---------- khachkars ----------
for k, x in enumerate((-0.5, -0.4, 0.4, 0.5)):
    box(f'khachkar{k}', M['tuffDark'], x, -0.45, G - 0.005, 0.06, 0.02, 0.12, outline=0.002, bevel=0)
    box(f'khachkarcross{k}', M['tuff'], x, -0.461, G + 0.04, 0.012, 0.004, 0.05, outline=0, bevel=0)
    box(f'khachkarcrossh{k}', M['tuff'], x, -0.461, G + 0.07, 0.034, 0.004, 0.01, outline=0, bevel=0)
for k, (x, y, r) in enumerate(((-0.75, 0.4, 0.11), (0.75, 0.42, 0.11), (-0.65, -0.65, 0.1), (0.65, -0.65, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
