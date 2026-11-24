# A cartoon Centennial Hall for the country maps, built in the set's shared look (../toon.py):
# Wrocław's great reinforced-concrete dome of 1913, its round hall rising in stepped rings of tall
# windows to the lantern, the four apses round its foot, the curved concrete pergola round the pond
# in front, and the tall steel Iglica spike beside it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P centennial-hall.py -- centennial-hall-1024.png 1024 centennial-hall.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#d0c8b8'),
    'concrete': toon('concrete', '#c8c4bc', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'concreteDark': toon('concreteDark', '#a8a49c'),
    'glass': flat('glass', '#3a4a5a'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'steel': toon('steel', '#b8bcc4', lift=0.15),
    'vine': toon('vine', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

HX, HY = 0.0, 0.3
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    lathe(f'apse{k}', M['concrete'], ((0.12, 0), (0.12, 0.12)), G - 0.005, HX + 0.28 * math.cos(a), HY + 0.28 * math.sin(a), segs=16, outline=0.005)
z = G - 0.005
for i, (r, h) in enumerate(((0.34, 0.12), (0.29, 0.07), (0.24, 0.07), (0.19, 0.06), (0.14, 0.05))):
    lathe(f'ring{i}', M['concrete'], ((r, 0), (r, h)), z, HX, HY, segs=40, outline=0.006)
    if i > 0:
        lathe(f'ringglass{i}', M['glass'], ((r + 0.002, 0), (r + 0.002, h * 0.6)), z + h * 0.2, HX, HY, segs=40, outline=0)
        for k in range(24):
            a = 2 * math.pi * k / 24
            box(f'rib{i}{k}', M['concrete'], HX + (r + 0.004) * math.cos(a), HY + (r + 0.004) * math.sin(a), z, 0.01, 0.008, h, rot_z=a + math.pi / 2, outline=0, bevel=0)
    lathe(f'ledge{i}', M['concreteDark'], ((r + 0.012, 0), (r + 0.012, 0.012)), z + h - 0.006, HX, HY, segs=40, outline=0.001)
    z += h
lathe('lantern', M['concrete'], ((0.07, 0), (0.07, 0.04), (0.004, 0.06)), z - 0.005, HX, HY, segs=24, outline=0.003)
box('entrance', M['concrete'], HX, HY - 0.36, G - 0.005, 0.2, 0.08, 0.12, outline=0.004, bevel=0)
for j in range(4):
    box(f'entrancewin{j}', M['glass'], HX - 0.06 + j * 0.04, HY - 0.403, G + 0.01, 0.025, 0.006, 0.09, outline=0, bevel=0)

# ---------- the pergola round the pond ----------
PX, PY, RX, RY = 0.15, -0.5, 0.55, 0.3
lathe('pondwater', M['water'], ((0.4, 0), (0.4, 0.008)), G - 0.004, PX, PY + 0.02, segs=32, outline=0.002)
po = [o for o in bpy.data.objects if o.name == 'pondwater']
bpy.context.view_layer.update()
for o in po:
    o.scale = (1.0, 0.55, 1.0)
    o.location = (0.0, (PY + 0.02) * (1 - 0.55), 0.0)
n = 26
pts = []
for k in range(n + 1):
    a = math.radians(160 + 220 * k / n)
    pts.append((PX + RX * math.cos(a), PY + RY * math.sin(a)))
for k, (x, y) in enumerate(pts):
    if math.hypot(x, y) > 1.12:
        continue
    rod(f'pergolacol{k}', M['concrete'], (x, y, G - 0.005), (x, y, G + 0.11), 0.012, segs=8, outline=0.001)
for k in range(n):
    (x0, y0), (x1, y1) = pts[k], pts[k + 1]
    if math.hypot(x0, y0) > 1.12 or math.hypot(x1, y1) > 1.12:
        continue
    bar(f'pergolabeam{k}', M['concrete'], (x0, y0, G + 0.115), (x1, y1, G + 0.115), 0.022, outline=0.001)
    ball(f'pergolavine{k}', M['vine'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.13, 0.022, outline=0)

# ---------- the Iglica ----------
IX, IY = -0.6, -0.1
for k in range(3):
    a = 2 * math.pi * k / 3
    bar(f'iglicaleg{k}', M['steel'], (IX + 0.06 * math.cos(a), IY + 0.06 * math.sin(a), G - 0.005), (IX, IY, G + 0.12), 0.012, outline=0.001)
rod('iglica', M['steel'], (IX, IY, G + 0.1), (IX, IY, G + 0.82), 0.012, r2=0.003, segs=8, outline=0.002)
for k, (x, y, r) in enumerate(((0.75, 0.4, 0.12), (-0.7, 0.45, 0.12), (0.85, -0.05, 0.1), (-0.85, -0.45, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
