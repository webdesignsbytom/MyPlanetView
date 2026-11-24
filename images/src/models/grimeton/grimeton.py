# A cartoon Grimeton radio station for the country maps, built in the set's shared look (../toon.py): the
# 1920s longwave transmitter on the Swedish west coast, its six tall steel lattice towers standing
# in a line across the fields, each with its crossarm at the top and the aerial wires slung from
# tower to tower, and at the line's end the white neoclassical transmitter hall with its tall
# windows and red roof, the last working Alexanderson alternator inside. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P grimeton.py -- grimeton-1024.png 1024 grimeton.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'field': toon('field', '#c8b868', shadow_mul=(0.8, 0.8, 0.84), lift=0.15),
    'steel': toon('steel', '#5a6068'),
    'white': toon('white', '#f6f2ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'roof': toon('roof', '#b8503e'),
    'wire': flat('wire', '#2e3238'),
    'dark': flat('dark', '#2e2a2a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'path': toon('path', '#d8ccb0', lift=0.15),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the fields ----------
for k, (x0, x1, y0, y1) in enumerate(((-1.0, -0.15, -0.75, -0.25), (0.15, 0.95, -0.8, -0.3), (-0.6, 0.5, 0.5, 0.95))):
    loft(f'field{k}', M['field'], [[(x0, y0, G - 0.004), (x1, y0, G - 0.004), (x1, y1, G - 0.004), (x0, y1, G - 0.004)],
                                   [(x0, y0, G + 0.006), (x1, y0, G + 0.006), (x1, y1, G + 0.006), (x0, y1, G + 0.006)]], outline=0.002)

# ---------- the six towers and their aerial wires ----------
TY, TH, ARM = 0.12, 0.72, 0.14
XS = [-0.88 + k * 0.33 for k in range(6)]
for k, x in enumerate(XS):
    lathe(f'tower{k}', M['steel'], ((0.045, 0), (0.028, TH * 0.4), (0.014, TH)), G - 0.005, x, TY, segs=4, outline=0.003, smooth=False)
    for j in range(5):
        z = G + 0.05 + j * TH / 5.5
        r = 0.045 - (0.045 - 0.014) * (z - G) / TH
        bar(f'brace{k}{j}', M['steel'], (x - r * 0.72, TY - r * 0.72, z), (x + r * 0.72, TY - r * 0.72, z + TH / 11), 0.005, outline=0)
    bar(f'arm{k}', M['steel'], (x, TY - ARM, G + TH - 0.01), (x, TY + ARM, G + TH - 0.01), 0.016, outline=0.002)
    for s in (-1, 1):
        bar(f'armstrut{k}{s}', M['steel'], (x, TY, G + TH - 0.1), (x, TY + s * ARM * 0.7, G + TH - 0.015), 0.008, outline=0.001)
for s in (-1, 0, 1):
    for k in range(5):
        y = TY + s * ARM * 0.9
        x0, x1 = XS[k], XS[k + 1]
        mid = (x0 + x1) / 2
        bar(f'wire{s}{k}a', M['wire'], (x0, y, G + TH - 0.015), (mid, y, G + TH - 0.05), 0.004, outline=0)
        bar(f'wire{s}{k}b', M['wire'], (mid, y, G + TH - 0.05), (x1, y, G + TH - 0.015), 0.004, outline=0)

# ---------- the transmitter hall ----------
HX, HY = -0.48, -0.42
box('hall', M['white'], HX, HY, G - 0.005, 0.46, 0.24, 0.2, outline=0.007, bevel=0)
for j in range(5):
    box(f'hallwin{j}', M['dark'], HX - 0.18 + j * 0.09, HY - 0.123, G + 0.04, 0.045, 0.006, 0.12, outline=0, bevel=0)
    cyl(f'hallwintop{j}', M['dark'], 0.0225, 0.006, segs=10, outline=0, matrix=Matrix.Translation((HX - 0.18 + j * 0.09, HY - 0.123, G + 0.16)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('hallcornice', M['white'], HX, HY, G + 0.19, 0.48, 0.26, 0.02, outline=0.002, bevel=0)
loft('hallroof', M['roof'], [[(HX - 0.24, HY - 0.13, G + 0.205), (HX + 0.24, HY - 0.13, G + 0.205), (HX + 0.24, HY + 0.13, G + 0.205), (HX - 0.24, HY + 0.13, G + 0.205)],
                             [(HX - 0.16, HY - 0.04, G + 0.29), (HX + 0.16, HY - 0.04, G + 0.29), (HX + 0.16, HY + 0.04, G + 0.29), (HX - 0.16, HY + 0.04, G + 0.29)]], outline=0.004)
box('hallporch', M['white'], HX, HY - 0.14, G - 0.005, 0.12, 0.04, 0.13, outline=0.003, bevel=0)
box('halldoor', M['dark'], HX, HY - 0.162, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
box('lane', M['path'], HX, HY - 0.42, G - 0.004, 0.07, 0.5, 0.008, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((0.85, 0.55), (-0.95, 0.35), (0.3, -0.2), (0.0, -0.95))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
