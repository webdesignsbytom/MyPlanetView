# A cartoon Sanchi for the country maps, built in the set's shared look (../toon.py): the Great
# Stupa, its broad stone hemisphere on a terrace with its railing, the square harmika and the
# three-tiered umbrella on top, the stone railing round its foot, and the carved toranas, the
# gateways of two posts and three curved crossbars with elephants and lions, at the cardinal points.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P sanchi.py -- sanchi-1024.png 1024 sanchi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#9ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'path': toon('path', '#d8ccb0'),
    'stone': toon('stone', '#c8b89a', shadow_mul=(0.86, 0.84, 0.8), lift=0.08),
    'stoneDark': toon('stoneDark', '#a8987a'),
    'dome': toon('dome', '#b8a888', shadow_mul=(0.86, 0.84, 0.8), lift=0.06),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

SX, SY = 0.0, 0.12
lathe('pathring', M['path'], ((0.56, 0), (0.56, 0.006)), G - 0.004, SX, SY, segs=40, outline=0)
lathe('drum', M['stone'], ((0.44, 0), (0.44, 0.1)), G - 0.005, SX, SY, segs=40, outline=0.008)
lathe('dome', M['dome'], ((0.4, 0), (0.38, 0.1), (0.3, 0.22), (0.17, 0.3), (0.004, 0.33)), G + 0.095, SX, SY, segs=40, outline=0.008)
for j in range(32):
    a = 2 * math.pi * j / 32
    box(f'terracepost{j}', M['stoneDark'], SX + 0.43 * math.cos(a), SY + 0.43 * math.sin(a), G + 0.095, 0.015, 0.015, 0.035, rot_z=a, outline=0, bevel=0)
lathe('terracerail', M['stoneDark'], ((0.435, 0), (0.435, 0.01)), G + 0.125, SX, SY, segs=40, outline=0.001)
box('harmika', M['stone'], SX, SY, G + 0.42, 0.12, 0.12, 0.05, outline=0.004, bevel=0)
rod('chattrapole', M['stoneDark'], (SX, SY, G + 0.47), (SX, SY, G + 0.62), 0.008, segs=6, outline=0.001)
for k, (z, r) in enumerate(((0.5, 0.06), (0.55, 0.05), (0.6, 0.04))):
    lathe(f'chattra{k}', M['stone'], ((r, 0), (r, 0.012)), G + z, SX, SY, segs=16, outline=0.002)

# ---------- the ground railing ----------
for j in range(48):
    a = 2 * math.pi * j / 48
    if any(abs(math.atan2(math.sin(a - c), math.cos(a - c))) < 0.12 for c in (-math.pi / 2, 0.0, math.pi, math.pi / 2)):
        continue
    box(f'railpost{j}', M['stoneDark'], SX + 0.54 * math.cos(a), SY + 0.54 * math.sin(a), G - 0.005, 0.02, 0.02, 0.1, rot_z=a, outline=0.001, bevel=0)
for k, z in enumerate((0.03, 0.06, 0.09)):
    lathe(f'railbar{k}', M['stoneDark'], ((0.545, 0), (0.545, 0.012)), G + z, SX, SY, segs=48, outline=0.001)


# ---------- the toranas ----------
def torana(name, cx, cy, rot):
    mark = set(bpy.data.objects)
    for s in (-1, 1):
        box(f'{name}post{s}', M['stone'], s * 0.1, 0, G - 0.005, 0.035, 0.035, 0.3, outline=0.003, bevel=0)
        for j in range(2):
            ball(f'{name}elephant{s}{j}', M['stoneDark'], s * 0.1, (j - 0.5) * 0.03, G + 0.31, 0.022, outline=0.002)
    for k, z in enumerate((0.33, 0.39, 0.45)):
        m = 6
        pts = [(-0.17 + 0.34 * i / m, 0, G + z + 0.012 * math.sin(math.pi * i / m)) for i in range(m + 1)]
        for i in range(m):
            bar(f'{name}beam{k}{i}', M['stone'], pts[i], pts[i + 1], 0.028, outline=0.002)
        for s in (-1, 1):
            cyl(f'{name}volute{k}{s}', M['stone'], 0.018, 0.028, segs=12, outline=0.002, matrix=Matrix.Translation((s * 0.175, 0, G + z)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for j in range(3):
        box(f'{name}upright{j}', M['stoneDark'], -0.05 + j * 0.05, 0, G + 0.34, 0.015, 0.015, 0.11, outline=0, bevel=0)
    ball(f'{name}wheel', M['stone'], 0, 0, G + 0.5, 0.025, outline=0.002)
    bpy.context.view_layer.update()
    m4 = Matrix.Translation((cx, cy, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in [o for o in bpy.data.objects if o not in mark]:
        o.matrix_world = m4 @ o.matrix_world


torana('south', SX, SY - 0.6, 0.0)
torana('east', SX + 0.6, SY, math.pi / 2)
torana('west', SX - 0.6, SY, math.pi / 2)
box('southpath', M['path'], SX, SY - 0.85, G - 0.003, 0.14, 0.4, 0.008, outline=0, bevel=0)
for k, (x, y, r) in enumerate(((-0.85, -0.4, 0.11), (0.82, -0.45, 0.11), (-0.75, 0.6, 0.1), (0.7, 0.68, 0.1))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
