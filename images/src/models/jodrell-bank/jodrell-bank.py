# A cartoon Jodrell Bank for the country maps, built in the set's shared look (../toon.py): the
# Lovell Telescope, its great white dish tilted to the sky between the two steel towers that carry
# it, the towers riding round on the circular railway track, the smaller Mark II dish beside it,
# and the Cheshire fields round about. Turned a little towards the camera.
# Run: blender -b --factory-startup -P jodrell-bank.py -- jodrell-bank-1024.png 1024 jodrell-bank.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'gravel': toon('gravel', '#b8b0a0'),
    'dish': toon('dish', '#f4f4f0', shadow_mul=(0.82, 0.84, 0.9), lift=0.18),
    'dishIn': toon('dishIn', '#dcdcd8', shadow_mul=(0.82, 0.84, 0.9), lift=0.12),
    'steel': toon('steel', '#8a9098', shadow_mul=(0.84, 0.86, 0.9)),
    'rail': toon('rail', '#5a5a60'),
    'building': toon('building', '#e8e4da', lift=0.1),
    'glass': flat('glass', '#3a4a5a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the track ----------
CX, CY, RT = 0.0, 0.15, 0.4
lathe('trackbed', M['gravel'], ((RT + 0.05, 0), (RT + 0.05, 0.008)), G - 0.004, CX, CY, segs=40, outline=0.002)
n = 40
for i in range(n):
    a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
    for rr in (RT - 0.02, RT + 0.02):
        bar(f'rail{i}{rr}', M['rail'], (CX + rr * math.cos(a0), CY + rr * math.sin(a0), G + 0.01), (CX + rr * math.cos(a1), CY + rr * math.sin(a1), G + 0.01), 0.008, outline=0)
lathe('pivot', M['steel'], ((0.05, 0), (0.05, 0.04)), G - 0.004, CX, CY, segs=16, outline=0.003)

# ---------- the towers ----------
AXLE = G + 0.5
for s in (-1, 1):
    tx = CX + s * RT
    for dy in (-0.14, 0.14):
        bar(f'towerleg{s}{dy}', M['steel'], (tx, CY + dy, G + 0.01), (tx, CY, AXLE), 0.022, outline=0.002)
    for k in range(4):
        z0, z1 = G + 0.02 + k * 0.12, G + 0.02 + (k + 1) * 0.12
        f0, f1 = 1 - (z0 - G) / 0.5, 1 - (z1 - G) / 0.5
        bar(f'towerbrace{s}{k}', M['steel'], (tx, CY - 0.14 * f0, z0), (tx, CY + 0.14 * f1, z1), 0.01, outline=0)
        bar(f'towerbar{s}{k}', M['steel'], (tx, CY - 0.14 * f1, z1), (tx, CY + 0.14 * f1, z1), 0.01, outline=0)
    box(f'bogie{s}', M['steel'], tx, CY, G + 0.005, 0.06, 0.3, 0.03, outline=0.003, bevel=0)
    box(f'bearing{s}', M['steel'], tx, CY, AXLE - 0.03, 0.05, 0.06, 0.06, outline=0.003, bevel=0)
bar('axle', M['steel'], (CX - RT, CY, AXLE), (CX + RT, CY, AXLE), 0.02, outline=0.002)

# ---------- the dish ----------
R, DEPTH = 0.37, 0.14
mark = set(bpy.data.objects)
lathe('dish', M['dish'], ((0.004, 0), (R * 0.5, DEPTH * 0.25), (R, DEPTH), (R * 0.97, DEPTH + 0.012), (R * 0.5, DEPTH * 0.25 + 0.015), (0.004, 0.016)), -DEPTH * 0.6, 0.0, 0.0, segs=40, outline=0.008)
lathe('dishhub', M['steel'], ((0.07, 0), (0.06, 0.06), (0.02, 0.08)), -DEPTH * 0.6 - 0.07, 0.0, 0.0, segs=16, outline=0.003)
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    bar(f'feedleg{k}', M['steel'], (R * 0.85 * math.cos(a), R * 0.85 * math.sin(a), -DEPTH * 0.6 + DEPTH * 0.8), (0.0, 0.0, 0.2), 0.008, outline=0)
lathe('feed', M['steel'], ((0.02, 0), (0.02, 0.04)), 0.19, 0.0, 0.0, segs=10, outline=0.001)
for k in range(16):
    a = 2 * math.pi * k / 16
    bar(f'dishrib{k}', M['dishIn'], (0.03 * math.cos(a), 0.03 * math.sin(a), -DEPTH * 0.6 + 0.02), (R * 0.95 * math.cos(a), R * 0.95 * math.sin(a), -DEPTH * 0.6 + DEPTH * 0.92 + 0.01), 0.006, outline=0)
bpy.context.view_layer.update()
m = Matrix.Translation((CX, CY, AXLE)) @ Matrix.Rotation(math.radians(50), 4, 'X')
for o in [o for o in bpy.data.objects if o not in mark]:
    o.matrix_world = m @ o.matrix_world

# ---------- the Mark II dish and the visitor centre ----------
MX, MY = 0.68, -0.45
for k in range(3):
    a = 2 * math.pi * k / 3
    bar(f'mk2leg{k}', M['steel'], (MX + 0.07 * math.cos(a), MY + 0.07 * math.sin(a), G), (MX, MY, G + 0.16), 0.012, outline=0.001)
mark = set(bpy.data.objects)
lathe('mk2', M['dish'], ((0.004, 0), (0.07, 0.015), (0.13, 0.05), (0.125, 0.058), (0.07, 0.022), (0.004, 0.008)), 0.0, 0.0, 0.0, segs=24, outline=0.004)
bpy.context.view_layer.update()
m = Matrix.Translation((MX, MY, G + 0.17)) @ Matrix.Rotation(math.radians(35), 4, 'X')
for o in [o for o in bpy.data.objects if o not in mark]:
    o.matrix_world = m @ o.matrix_world
box('visitor', M['building'], -0.6, -0.5, G - 0.005, 0.3, 0.18, 0.1, outline=0.005, bevel=0)
box('visitorglass', M['glass'], -0.6, -0.593, G + 0.02, 0.26, 0.006, 0.06, outline=0, bevel=0)
for k, (x, y, r) in enumerate(((-0.85, 0.2, 0.1), (0.85, 0.3, 0.1), (-0.3, -0.78, 0.09), (0.25, -0.8, 0.09))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.007)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
