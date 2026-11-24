# A cartoon Villa Savoye for the country maps, built in the set's shared look (../toon.py): Le
# Corbusier's white box at Poissy, lifted on its slender pilotis above the lawn, the long ribbon
# windows running round all four sides, the curved green glass wall of the ground floor tucked
# beneath, and the white curved screens of the roof garden's solarium, with trees round the meadow.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P villa-savoye.py -- villa-savoye-1024.png 1024 villa-savoye.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d8ccb0'),
    'white': toon('white', '#f6f4ee', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'green': toon('green', '#3a6a4a'),
    'glass': flat('glass', '#3a4a5a'),
    'pink': toon('pink', '#e8b0a0', lift=0.1),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
box('drive', M['path'], 0.0, -0.55, G - 0.003, 0.14, 0.5, 0.008, outline=0, bevel=0)

VX, VY, S, Z0, H = 0.0, 0.1, 0.56, 0.14, 0.14
# the ground floor: the curved glass wall
box('groundfloor', M['green'], VX, VY + 0.04, G - 0.005, S * 0.7, S * 0.5, Z0, outline=0.004, bevel=0)
lathe('groundcurve', M['green'], ((S * 0.25, 0), (S * 0.25, Z0)), G - 0.005, VX, VY + 0.04 - S * 0.25 + 0.02, segs=24, outline=0.004)
for j in range(9):
    a = math.pi + math.pi * j / 8
    box(f'groundmullion{j}', M['glass'], VX + S * 0.252 * math.cos(a), VY + 0.06 - S * 0.25 + S * 0.252 * math.sin(a), G + 0.01, 0.006, 0.004, Z0 - 0.02, rot_z=a + math.pi / 2, outline=0, bevel=0)
# the pilotis
for i in range(5):
    for j in range(5):
        if 0 < i < 4 and 0 < j < 4:
            continue
        x = VX - S / 2 + 0.03 + i * (S - 0.06) / 4
        y = VY - S / 2 + 0.03 + j * (S - 0.06) / 4
        rod(f'piloti{i}{j}', M['white'], (x, y, G - 0.005), (x, y, G + Z0), 0.01, segs=10, outline=0.002)
# the main floor and its ribbon windows
box('mainfloor', M['white'], VX, VY, G + Z0, S, S, H, outline=0.009, bevel=0)
for side in range(4):
    a = -math.pi / 2 + side * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    box(f'ribbon{side}', M['glass'], VX + nx * (S / 2 + 0.003), VY + ny * (S / 2 + 0.003), G + Z0 + 0.04, S - 0.06, 0.006, 0.045, rot_z=a + math.pi / 2, outline=0, bevel=0)
    for j in range(7):
        u = -S / 2 + 0.03 + j * (S - 0.06) / 6
        box(f'ribbonmullion{side}{j}', M['white'], VX + nx * (S / 2 + 0.005) - ny * u, VY + ny * (S / 2 + 0.005) + nx * u, G + Z0 + 0.04, 0.006, 0.004, 0.045, rot_z=a + math.pi / 2, outline=0, bevel=0)
# the roof garden's curved solarium screens
T = G + Z0 + H
for k in range(10):
    a0, a1 = math.radians(150 + k * 12), math.radians(150 + (k + 1) * 12)
    R, cx, cy = 0.14, VX + 0.06, VY + 0.12
    bar(f'screen{k}', M['white'], (cx + R * math.cos(a0), cy + R * math.sin(a0), T + 0.05), (cx + R * math.cos(a1), cy + R * math.sin(a1), T + 0.05), 0.1, outline=0.002)
for k in range(6):
    a0, a1 = math.radians(-20 + k * 15), math.radians(-20 + (k + 1) * 15)
    R, cx, cy = 0.1, VX - 0.08, VY + 0.12
    bar(f'screenb{k}', M['pink'], (cx + R * math.cos(a0), cy + R * math.sin(a0), T + 0.04), (cx + R * math.cos(a1), cy + R * math.sin(a1), T + 0.04), 0.08, outline=0.002)
box('rooftop', M['white'], VX - 0.12, VY - 0.12, T - 0.005, 0.2, 0.2, 0.03, outline=0.002, bevel=0)

for k, (x, y, r) in enumerate(((-0.75, 0.4, 0.15), (0.78, 0.35, 0.15), (-0.7, -0.45, 0.13), (0.72, -0.5, 0.13), (0.0, 0.85, 0.14))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + r * 1.6), 0.022, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.9, r, outline=0.009)

turn(before, -20)
render(G)
