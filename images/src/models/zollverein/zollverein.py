# A cartoon Zollverein for the country maps, built in the set's shared look (../toon.py): the great
# red steel A-frame headframe of Shaft XII over its winding tower, the two big wheels at its top, the
# cubic Bauhaus-style buildings of red brick in their steel frames around the courtyard, the coal
# washery's conveyor bridge, the chimney, and the birches that have grown round the site. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P zollverein.py -- zollverein-1024.png 1024 zollverein.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#b8b4ac', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'red': toon('red', '#c4402e', shadow_mul=(0.86, 0.76, 0.76), lift=0.1),
    'brick': toon('brick', '#a85a3e', shadow_mul=(0.86, 0.78, 0.76), lift=0.06),
    'steel': toon('steel', '#3a3e46'),
    'window': flat('window', '#2e3238'),
    'birch': toon('birch', '#8ab84a', shadow_mul=(0.72, 0.8, 0.74)),
    'bark': toon('bark', '#e8e4dc'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def cube(name, x, y, w, d, h):
    """A brick block in its steel frame grid, Zollverein's look."""
    box(name, M['brick'], x, y, G - 0.005, w, d, h, outline=0.007, bevel=0)
    for j in range(int(w / 0.08) + 1):
        bx = x - w / 2 + j * w / int(w / 0.08)
        bar(f'{name}post{j}', M['steel'], (bx, y - d / 2 - 0.003, G), (bx, y - d / 2 - 0.003, G + h), 0.008, outline=0)
    for k in range(int(h / 0.08) + 1):
        z = G + k * h / int(h / 0.08)
        bar(f'{name}rail{k}', M['steel'], (x - w / 2, y - d / 2 - 0.003, z), (x + w / 2, y - d / 2 - 0.003, z), 0.008, outline=0)
    for j in range(int(w / 0.08)):
        for k in range(int(h / 0.08)):
            if (j + k) % 3 == 0:
                box(f'{name}win{j}{k}', M['window'], x - w / 2 + (j + 0.5) * w / int(w / 0.08), y - d / 2 - 0.004, G + (k + 0.25) * h / int(h / 0.08), 0.04, 0.004, 0.03, outline=0, bevel=0)
    box(f'{name}roof', M['steel'], x, y, G + h - 0.005, w + 0.01, d + 0.01, 0.015, outline=0.002, bevel=0)


# ---------- Shaft XII's headframe ----------
HX, HY = 0.0, 0.2
cube('windingtower', HX, HY + 0.1, 0.28, 0.24, 0.36)
TOP = G + 0.95
for s in (-1, 1):
    # the A-frame's two legs, each a pair of girders, leaning in to the top
    for fy in (-0.06, 0.06):
        bar(f'leg{s}{fy}', M['red'], (HX + s * 0.42, HY + fy, G), (HX + s * 0.06, HY + fy, TOP), 0.04, outline=0.004)
    for k in range(5):
        t = (k + 0.5) / 5
        x = HX + s * (0.42 - 0.36 * t)
        z = G + (TOP - G) * t
        bar(f'brace{s}{k}', M['red'], (x, HY - 0.06, z), (x, HY + 0.06, z), 0.02, outline=0.002)
        bar(f'diag{s}{k}', M['red'], (x, HY - 0.06, z), (HX + s * (0.42 - 0.36 * (t + 0.1)), HY - 0.06, z + (TOP - G) * 0.1), 0.012, outline=0)
# the vertical shaft tower in the middle
for sx in (-1, 1):
    for fy in (-1, 1):
        bar(f'shaftpost{sx}{fy}', M['red'], (HX + sx * 0.06, HY + fy * 0.06, G + 0.36), (HX + sx * 0.06, HY + fy * 0.06, TOP), 0.03, outline=0.003)
for k in range(6):
    z = G + 0.4 + k * (TOP - G - 0.4) / 5
    box(f'shaftring{k}', M['red'], HX, HY, z, 0.14, 0.14, 0.016, outline=0.002, bevel=0)
box('headtop', M['red'], HX, HY, TOP - 0.01, 0.22, 0.2, 0.05, outline=0.004, bevel=0)
# the two great winding wheels on top, side by side, facing the front
R = 0.09
for k, x in enumerate((-0.08, 0.08)):
    cx, cz = HX + x, TOP + 0.1
    for j in range(16):
        a0, a1 = 2 * math.pi * j / 16, 2 * math.pi * (j + 1) / 16
        p0 = (cx + R * math.cos(a0), HY - 0.04, cz + R * math.sin(a0))
        p1 = (cx + R * math.cos(a1), HY - 0.04, cz + R * math.sin(a1))
        bar(f'wheelrim{k}{j}', M['steel'], p0, p1, 0.014, outline=0.001)
        if j % 4 == 0:
            bar(f'wheelspoke{k}{j}', M['steel'], (cx, HY - 0.04, cz), p0, 0.008, outline=0)
    cyl(f'wheelhub{k}', M['steel'], 0.02, 0.03, segs=10, outline=0.001, matrix=Matrix.Translation((cx, HY - 0.04, cz)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the cubic buildings round the courtyard ----------
cube('boilerhouse', -0.62, 0.35, 0.36, 0.4, 0.3)
cube('workshop', 0.62, 0.3, 0.36, 0.44, 0.26)
cube('washery', -0.55, -0.45, 0.42, 0.3, 0.42)
box('conveyor', M['red'], -0.22, -0.15, G + 0.32, 0.5, 0.06, 0.06, rot_z=math.radians(-35), outline=0.004, bevel=0)
for k in range(3):
    rod(f'conveyorleg{k}', M['steel'], (-0.38 + k * 0.15, -0.26 + k * 0.1, G), (-0.38 + k * 0.15, -0.26 + k * 0.1, G + 0.32), 0.01, segs=6, outline=0.001)
lathe('chimney', M['brick'], ((0.06, 0), (0.045, 0.78)), G - 0.005, -0.85, 0.75, segs=16, outline=0.005)
lathe('chimneycap', M['steel'], ((0.05, 0), (0.05, 0.03)), G + 0.77, -0.85, 0.75, segs=16, outline=0.002)

# ---------- birches ----------
for k, (x, y) in enumerate(((0.55, -0.4), (0.8, -0.2), (0.35, -0.75), (0.75, -0.7), (-0.15, -0.85))):
    rod(f'birchtrunk{k}', M['bark'], (x, y, G), (x, y, G + 0.12), 0.01, segs=6, outline=0.002)
    b = ball(f'birch{k}', M['birch'], 0, 0, 0, 0.07, outline=0.008)
    b.scale = (0.9, 0.9, 1.4)
    b.location = (x, y, G + 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
