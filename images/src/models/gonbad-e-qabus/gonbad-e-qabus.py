# A cartoon Gonbad-e Qabus for the country maps, built in the set's shared look (../toon.py): the
# thousand-year-old tomb tower of fired brick on its green mound, its ten sharp flanges running up
# its whole height like a star, the two bands of Kufic inscription, the tall pointed conical roof,
# and the park round about. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gonbad-e-qabus.py -- gonbad-e-qabus-1024.png 1024 gonbad-e-qabus.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'mound': toon('mound', '#6aa54a', shadow_mul=(0.72, 0.8, 0.74)),
    'path': toon('path', '#d8ccb0'),
    'brick': toon('brick', '#c08a5e', shadow_mul=(0.86, 0.82, 0.78), lift=0.06),
    'brickDark': toon('brickDark', '#9a6a44'),
    'dark': flat('dark', '#3a2e24'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

hl = lathe('mound', M['mound'], ((0.62, 0), (0.45, 0.1), (0.25, 0.14)), G - 0.01, 0.0, 0.1, segs=32, outline=0.008)
hl.visible_shadow = False
bar('path', M['path'], (0.0, -0.95, G + 0.002), (0.0, -0.3, G + 0.002), 0.1, outline=0)
for i in range(6):
    box(f'step{i}', M['path'], 0.0, -0.32 + i * 0.035, G - 0.005, 0.1, 0.04, 0.02 + i * 0.02, outline=0.001, bevel=0)
T = G + 0.13
TX, TY, R, H = 0.0, 0.1, 0.09, 0.62
lathe('core', M['brick'], ((R, 0), (R * 0.95, H)), T - 0.005, TX, TY, segs=20, outline=0.006)
for k in range(10):
    a = 2 * math.pi * k / 10
    c, s = math.cos(a), math.sin(a)
    tri = lambda z, f: [(TX + (R - 0.01) * math.cos(a - 0.22) * f, TY + (R - 0.01) * math.sin(a - 0.22) * f, z),
                        (TX + (R + 0.035) * c * f, TY + (R + 0.035) * s * f, z),
                        (TX + (R - 0.01) * math.cos(a + 0.22) * f, TY + (R - 0.01) * math.sin(a + 0.22) * f, z)]
    loft(f'flange{k}', M['brick'], [tri(T - 0.005, 1.0), tri(T + H, 0.95)], outline=0.003)
for k, z in enumerate((0.1, H - 0.06)):
    lathe(f'inscription{k}', M['brickDark'], ((R + 0.038, 0), (R + 0.038, 0.035)), T + z, TX, TY, segs=20, outline=0.001)
door_a = -math.pi / 2 + math.pi / 10
box('door', M['dark'], TX + (R + 0.02) * math.cos(door_a), TY + (R + 0.02) * math.sin(door_a), T - 0.005, 0.035, 0.006, 0.09, rot_z=door_a + math.pi / 2, outline=0, bevel=0)
lathe('roof', M['brickDark'], ((R + 0.04, 0), (0.004, 0.28)), T + H - 0.005, TX, TY, segs=10, outline=0.005, smooth=False)

for k, (x, y, r) in enumerate(((-0.75, -0.3, 0.12), (0.75, -0.3, 0.12), (-0.7, 0.55, 0.11), (0.7, 0.6, 0.11), (-0.4, -0.7, 0.1), (0.4, -0.7, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
