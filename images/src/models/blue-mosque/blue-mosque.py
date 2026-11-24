# A cartoon Blue Mosque (the Sultan Ahmed Mosque) for the country maps, built in the set's shared
# look (../toon.py): its cascade of grey lead domes, the great central dome on its four half-domes and
# the little domes and turrets round them, the six slender pencil minarets with their balconies, and
# the arcaded courtyard in front with its own small domes and fountain. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P blue-mosque.py -- blue-mosque-1024.png 1024 blue-mosque.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb4', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'stone': toon('stone', '#eae2d2', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'stoneDark': toon('stoneDark', '#cfc4ae'),
    'lead': toon('lead', '#8a96a8', shadow_mul=(0.82, 0.86, 0.94), lift=0.12),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'window': flat('window', '#3a3a50'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def dome(name, x, y, z, r, mat='lead', finial=True):
    lathe(name, M[mat], ((r, 0), (r * 0.97, r * 0.3), (r * 0.82, r * 0.62), (r * 0.5, r * 0.88), (0.004, r)), z, x, y, segs=24, outline=0.004)
    if finial:
        rod(name + 'finial', M['gold'], (x, y, z + r), (x, y, z + r + 0.04 + r * 0.2), 0.004, segs=4, outline=0)


def minaret(name, x, y, h, balconies):
    lathe(name, M['stone'], ((0.035, 0), (0.035, 0.06), (0.026, 0.07), (0.024, h)), G - 0.005, x, y, segs=12, outline=0.003, smooth=False)
    for k in range(balconies):
        z = G + h * (0.55 + 0.17 * k)
        lathe(f'{name}balcony{k}', M['stoneDark'], ((0.026, 0), (0.038, 0.012), (0.038, 0.02)), z, x, y, segs=12, outline=0.002)
    lathe(f'{name}cap', M['lead'], ((0.026, 0), (0.003, 0.14)), G + h - 0.005, x, y, segs=12, outline=0.002)
    rod(f'{name}finial', M['gold'], (x, y, G + h + 0.13), (x, y, G + h + 0.17), 0.003, segs=4, outline=0)


# ---------- the prayer hall ----------
HX, HY, HS, HH = 0.0, 0.32, 0.58, 0.2
box('hall', M['stone'], HX, HY, G - 0.005, HS, HS, HH, outline=0.009, bevel=0)
for fy in (-1, 1):
    for row in range(2):
        for j in range(5):
            box(f'hallwin{fy}{row}{j}', M['window'], HX - 0.2 + j * 0.1, HY + fy * (HS / 2 + 0.003), G + 0.04 + row * 0.08, 0.03, 0.006, 0.045, outline=0, bevel=0)
# the corner turrets and the four little domes at the corners
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = HX + sx * (HS / 2 - 0.04), HY + sy * (HS / 2 - 0.04)
        lathe(f'turret{sx}{sy}', M['stone'], ((0.035, 0), (0.035, 0.06)), G + HH - 0.005, x, y, segs=8, outline=0.002, smooth=False)
        dome(f'cornerdome{sx}{sy}', x, y, G + HH + 0.055, 0.06)
        x2, y2 = HX + sx * (HS / 2 - 0.02), HY + sy * (HS / 2 - 0.02)
        lathe(f'pinnacle{sx}{sy}', M['stone'], ((0.018, 0), (0.016, 0.06), (0.003, 0.1)), G + HH - 0.005, x2, y2, segs=8, outline=0.001, smooth=False)
# the four half-domes against the central drum, each with its own small half-domes beside it
for k in range(4):
    a = k * math.pi / 2
    c, s = math.cos(a), math.sin(a)
    hx, hy = HX + 0.15 * c, HY + 0.15 * s
    lathe(f'halfdomebase{k}', M['stone'], ((0.1, 0), (0.1, 0.05)), G + HH - 0.005, hx, hy, segs=20, outline=0.003)
    dome(f'halfdome{k}', hx, hy, G + HH + 0.045, 0.1, finial=False)
    for side in (-1, 1):
        dome(f'sidedome{k}{side}', hx - side * 0.12 * s, hy + side * 0.12 * c, G + HH + 0.01, 0.045, finial=False)
# the central dome on its drum ringed with windows
lathe('drum', M['stone'], ((0.17, 0), (0.17, 0.08)), G + HH + 0.06, HX, HY, segs=28, outline=0.005)
for k in range(16):
    a = 2 * math.pi * k / 16
    box(f'drumwin{k}', M['window'], HX + 0.172 * math.cos(a), HY + 0.172 * math.sin(a), G + HH + 0.08, 0.02, 0.02, 0.04, rot_z=a, outline=0, bevel=0)
dome('maindome', HX, HY, G + HH + 0.135, 0.19)
# the buttress towers carrying the dome
for k in range(4):
    a = k * math.pi / 2 + math.pi / 4
    x, y = HX + 0.17 * math.cos(a), HY + 0.17 * math.sin(a)
    lathe(f'buttress{k}', M['stone'], ((0.03, 0), (0.03, 0.15)), G + HH - 0.005, x, y, segs=8, outline=0.002, smooth=False)
    dome(f'buttressdome{k}', x, y, G + HH + 0.145, 0.03, finial=False)

# ---------- the courtyard in front ----------
CY, CS = HY - HS / 2 - 0.25, 0.46
box('courtfloor', M['stoneDark'], HX, CY, G - 0.004, CS, 0.48, 0.012, outline=0.002, bevel=0)
# the arcades round three sides, each bay under its little dome
for j in range(6):
    x = HX - CS / 2 + 0.04 + j * (CS - 0.08) / 5
    box(f'frontbay{j}', M['stone'], x, CY - 0.22, G - 0.005, 0.07, 0.05, 0.07, outline=0.003, bevel=0)
    box(f'frontarch{j}', M['window'], x, CY - 0.246, G - 0.005, 0.035, 0.006, 0.045, outline=0, bevel=0)
    dome(f'frontdome{j}', x, CY - 0.22, G + 0.065, 0.032, finial=False)
for sx in (-1, 1):
    for j in range(6):
        x, y = HX + sx * (CS / 2 - 0.02), CY - 0.2 + j * 0.08
        box(f'sidebay{sx}{j}', M['stone'], x, y, G - 0.005, 0.05, 0.07, 0.07, outline=0.003, bevel=0)
        box(f'sidearch{sx}{j}', M['window'], x - sx * 0.026, y, G - 0.005, 0.006, 0.035, 0.045, outline=0, bevel=0)
        dome(f'baydome{sx}{j}', x, y, G + 0.065, 0.032, finial=False)
box('courtgate', M['stone'], HX, CY - 0.24, G - 0.005, 0.12, 0.06, 0.13, outline=0.004, bevel=0)
box('courtgatearch', M['window'], HX, CY - 0.272, G - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)
lathe('fountain', M['stone'], ((0.06, 0), (0.06, 0.06)), G, HX, CY + 0.02, segs=8, outline=0.003, smooth=False)
dome('fountaindome', HX, CY + 0.02, G + 0.06, 0.05, finial=False)

# ---------- the six minarets ----------
for sx in (-1, 1):
    minaret(f'minaret{sx}a', HX + sx * (HS / 2 + 0.05), HY + HS / 2 + 0.05, 0.6, 3)
    minaret(f'minaret{sx}b', HX + sx * (HS / 2 + 0.05), HY - HS / 2 - 0.03, 0.6, 3)
    minaret(f'minaret{sx}c', HX + sx * (CS / 2 + 0.05), CY - 0.25, 0.48, 2)

for k, (x, y) in enumerate(((-0.75, -0.55), (0.75, -0.55), (-0.85, 0.2), (0.85, 0.2))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.013, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.1, outline=0.012)

bpy.context.view_layer.update()
# grown to fill its tile
grow = Matrix.Translation((0, 0.05, G)) @ Matrix.Scale(1.2, 4) @ Matrix.Translation((0, -0.05, -G))
for o in set(bpy.data.objects) - before:
    o.matrix_world = grow @ o.matrix_world
bpy.context.view_layer.update()
turn(before, -20)
render(G)
