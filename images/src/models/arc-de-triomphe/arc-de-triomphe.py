# A cartoon Arc de Triomphe for the country maps, built in the set's shared look (../toon.py): the
# great arch at the top of the Champs-Élysées, its tall central vault and the small side arches, the
# carved groups on the piers, the frieze and the attic of shields, the French flag hanging in the
# vault over the eternal flame, and the star of avenues round it, lined with trees. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P arc-de-triomphe.py -- arc-de-triomphe-1024.png 1024 arc-de-triomphe.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'road': toon('road', '#8a8a90', shadow_mul=(0.86, 0.86, 0.9)),
    'stone': toon('stone', '#ece0c4', shadow_mul=(0.86, 0.8, 0.78), lift=0.15),
    'stoneDark': toon('stoneDark', '#cdbd98', shadow_mul=(0.86, 0.8, 0.78)),
    'dark': flat('dark', '#2e2a28'),
    'blue': toon('blue', '#2a4aa0', lift=0.1),
    'white': toon('white', '#f6f4ee', lift=0.15),
    'red': toon('red', '#d03a30', lift=0.1),
    'flame': flat('flame', '#ffb030'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the star of avenues ----------
lathe('roundabout', M['road'], ((0.8, 0), (0.8, 0.006)), G - 0.004, segs=48, outline=0)
lathe('island', M['paving'], ((0.62, 0), (0.62, 0.01)), G - 0.004, segs=48, outline=0.003)
for k in range(12):
    a = 2 * math.pi * k / 12 + math.pi / 12
    c, s = math.cos(a), math.sin(a)
    bar(f'avenue{k}', M['road'], (0.78 * c, 0.78 * s, G), (1.38 * c, 1.38 * s, G), 0.16, outline=0)
    for side in (-1, 1):
        for j in range(2):
            r = 0.98 + j * 0.22
            x, y = r * c - side * 0.13 * s, r * s + side * 0.13 * c
            rod(f'trunk{k}{side}{j}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.01, segs=6, outline=0.002)
            ball(f'tree{k}{side}{j}', M['tree'], x, y, G + 0.09, 0.055, outline=0.008)

# ---------- the arch (built at 1, then grown to stand over the star) ----------
arch = set(bpy.data.objects)
W, D, H = 0.56, 0.3, 0.56
SPAN, SPRING = 0.19, 0.3      # the great vault: width and the height its curve starts at
box('base', M['stoneDark'], 0, 0, G, W + 0.02, D + 0.02, 0.03, outline=0.006, bevel=0)
for s in (-1, 1):
    box(f'pier{s}', M['stone'], s * (SPAN / 2 + (W - SPAN) / 4), 0, G + 0.025, (W - SPAN) / 2, D, H - 0.025, outline=0.01, bevel=0)
box('top', M['stone'], 0, 0, G + SPRING + SPAN / 2, SPAN + 0.002, D, H - SPRING - SPAN / 2, outline=0.008, bevel=0)
# the vault's curve: stepped blocks filling each top corner of the opening, leaving a round arch
for s in (-1, 1):
    for t in range(6):
        a0 = math.pi / 2 * t / 6
        a1 = math.pi / 2 * (t + 1) / 6
        x0 = SPAN / 2 * math.cos(a1)
        z0 = SPAN / 2 * math.sin(a0)
        w = SPAN / 2 - x0
        box(f'spandrel{s}{t}', M['stone'], s * (SPAN / 2 - w / 2), 0, G + SPRING + z0, w + 0.001, D, SPAN / 2 - z0 + 0.001, outline=0, bevel=0)
# the side arches through the piers (on the short faces)
for s in (-1, 1):
    x = s * (W / 2 + 0.003)
    box(f'sidearch{s}', M['dark'], x, 0, G + 0.03, 0.006, 0.1, 0.17, outline=0, bevel=0)
    cyl(f'sidearchtop{s}', M['dark'], 0.05, 0.006, segs=16, outline=0, matrix=Matrix.Translation((x, 0, G + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
# the vault's dark inside, so the opening reads
box('vaultceiling', M['stoneDark'], 0, 0, G + SPRING + SPAN / 2 - 0.004, SPAN, D - 0.004, 0.004, outline=0, bevel=0)
# cornice, frieze, attic
box('cornice', M['stoneDark'], 0, 0, G + H - 0.08, W + 0.03, D + 0.03, 0.02, outline=0.004, bevel=0)
box('frieze', M['stoneDark'], 0, -D / 2 - 0.004, G + H - 0.13, W - 0.02, 0.006, 0.04, outline=0, bevel=0)
box('attic', M['stone'], 0, 0, G + H, W + 0.01, D + 0.01, 0.07, outline=0.008, bevel=0)
box('atticcap', M['stoneDark'], 0, 0, G + H + 0.065, W + 0.03, D + 0.03, 0.015, outline=0.003, bevel=0)
for j in range(10):
    for fy in (-1, 1):
        cyl(f'shield{j}{fy}', M['stoneDark'], 0.015, 0.006, segs=10, outline=0, matrix=Matrix.Translation((-W / 2 + 0.04 + j * (W - 0.08) / 9, fy * (D / 2 + 0.008), G + H + 0.035)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the carved groups on the piers' fronts and backs
for fy in (-1, 1):
    for s in (-1, 1):
        x = s * (SPAN / 2 + (W - SPAN) / 4)
        y = fy * (D / 2 + 0.006)
        box(f'groupbase{fy}{s}', M['stoneDark'], x, y, G + 0.12, 0.1, 0.012, 0.16, outline=0.002, bevel=0)
        for f in range(3):
            fx = x - 0.03 + f * 0.03
            rod(f'figure{fy}{s}{f}', M['stone'], (fx, y + fy * 0.008, G + 0.14), (fx + 0.005, y + fy * 0.008, G + 0.22 + 0.02 * (f == 1)), 0.009, segs=6, outline=0.002)
            ball(f'figurehead{fy}{s}{f}', M['stone'], fx + 0.005, y + fy * 0.008, G + 0.235 + 0.02 * (f == 1), 0.008, outline=0.001)
        box(f'relief{fy}{s}', M['stoneDark'], x, y, G + H - 0.25, 0.12, 0.008, 0.06, outline=0.001, bevel=0)

# ---------- the flag and the flame ----------
for k, m in enumerate(('blue', 'white', 'red')):
    box(f'flag{k}', M[m], -0.04 + k * 0.04, 0, G + 0.2, 0.04, 0.004, 0.18, outline=0.001, bevel=0)
bar('flagpole', M['dark'], (-0.07, 0, G + 0.38), (0.07, 0, G + 0.38), 0.006, outline=0)
lathe('flamebowl', M['stoneDark'], ((0.03, 0), (0.035, 0.012)), G, 0, -0.02, segs=12, outline=0.002)
ball('flame', M['flame'], 0, -0.02, G + 0.022, 0.012, outline=0)

bpy.context.view_layer.update()
grow = Matrix.Translation((0, 0, G)) @ Matrix.Scale(1.5, 4) @ Matrix.Translation((0, 0, -G))
for o in set(bpy.data.objects) - arch:
    o.matrix_world = grow @ o.matrix_world
bpy.context.view_layer.update()
turn(before, -20)
render(G)
