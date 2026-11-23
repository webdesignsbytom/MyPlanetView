# A cartoon Al Zubarah Fort for the country maps, built in the set's shared look (../toon.py) on a
# tile of Qatar's desert: the square fort of coral stone and lime plaster, three round towers and
# one square one at its corners, the parapets edged with stepped, pointed crenellations, the
# wooden gate, the low walls of the old pearling town's ruins beside it, and a camel.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P al-zubarah.py -- al-zubarah-1024.png 1024 al-zubarah.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#ead2a0', shadow_mul=(0.84, 0.74, 0.62), lift=0.25),
    'plaster': toon('plaster', '#e2c89a', shadow_mul=(0.84, 0.76, 0.7)),
    'plasterLight': toon('plasterLight', '#f0dcb4', shadow_mul=(0.84, 0.76, 0.7)),
    'ruin': toon('ruin', '#c9ae80', shadow_mul=(0.84, 0.76, 0.7)),
    'wood': toon('wood', '#6b4a33'),
    'dark': flat('dark', '#4a3428'),
    'camel': toon('camel', '#c9a06a', shadow_mul=(0.84, 0.74, 0.66)),
    'shrub': toon('shrub', '#9aa06a', shadow_mul=(0.76, 0.8, 0.78)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(521)


def crenels(name, x0, y0, x1, y1, z):
    """Stepped, pointed crenellations along a parapet."""
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    n = max(1, int(length / 0.06))
    for k in range(n):
        t = (k + 0.5) / n
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        box(f'{name}{k}', M['plasterLight'], x, y, z, 0.035, 0.03, 0.02, rot_z=a, outline=0.004, bevel=0)
        pyramid(f'{name}tip{k}', M['plasterLight'], x, y, z + 0.02, 0.03, 0.03, outline=0.003)


# ---------- the fort ----------
FX, FY, S, H = 0.05, 0.1, 0.72, 0.28
CORNERS = [(FX - S / 2, FY - S / 2), (FX + S / 2, FY - S / 2), (FX + S / 2, FY + S / 2), (FX - S / 2, FY + S / 2)]
for k, ((x0, y0), (x1, y1)) in enumerate(zip(CORNERS, CORNERS[1:] + CORNERS[:1])):
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'wall{k}', M['plaster'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, length, 0.06, H, rot_z=a, outline=0.02, bevel=0.006)
    crenels(f'crenel{k}', x0 + 0.08 * math.cos(a), y0 + 0.08 * math.sin(a), x1 - 0.08 * math.cos(a), y1 - 0.08 * math.sin(a), G + H - 0.005)
    # rows of drain spouts and slits
    for m in range(4):
        t = (m + 0.5) / 4
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        nx, ny = math.sin(a), -math.cos(a)
        box(f'slit{k}{m}', M['dark'], x + nx * 0.032, y + ny * 0.032, G + 0.16, 0.012, 0.01, 0.05, rot_z=a, outline=0, bevel=0)
        rod(f'spout{k}{m}', M['wood'], (x + nx * 0.03, y + ny * 0.03, G + H - 0.04), (x + nx * 0.07, y + ny * 0.07, G + H - 0.04), 0.007, segs=6, outline=0.002)
# three round towers and one square one
for k, (x, y) in enumerate(CORNERS):
    if k == 2:
        box('squaretower', M['plaster'], x, y, G - 0.005, 0.18, 0.18, H + 0.14, outline=0.018, bevel=0.006)
        crenels('sqcrenelA', x - 0.07, y - 0.09, x + 0.07, y - 0.09, G + H + 0.135)
        crenels('sqcrenelB', x - 0.09, y - 0.07, x - 0.09, y + 0.07, G + H + 0.135)
        continue
    lathe(f'roundtower{k}', M['plaster'], ((0.11, 0), (0.1, H + 0.12)), G - 0.005, x, y, segs=20, outline=0.018)
    for j in range(8):
        a = 2 * math.pi * j / 8
        cx, cy = x + 0.09 * math.cos(a), y + 0.09 * math.sin(a)
        box(f'tcrenel{k}{j}', M['plasterLight'], cx, cy, G + H + 0.115, 0.03, 0.03, 0.02, rot_z=a, outline=0.004, bevel=0)
        pyramid(f'tcreneltip{k}{j}', M['plasterLight'], cx, cy, G + H + 0.135, 0.028, 0.028, outline=0.003)
    box(f'towerslit{k}', M['dark'], x, y - 0.105, G + 0.2, 0.014, 0.01, 0.05, outline=0, bevel=0)
# the gate
box('gate', M['wood'], FX, FY - S / 2 - 0.032, G - 0.005, 0.1, 0.012, 0.16, outline=0.004, bevel=0)
box('gatearch', M['plasterLight'], FX, FY - S / 2 - 0.035, G + 0.155, 0.14, 0.02, 0.04, outline=0.006, bevel=0)

# ---------- the old town's ruins beside it ----------
for i in range(3):
    for j in range(2):
        x = -0.95 + i * 0.22
        y = -0.6 + j * 0.25
        for k, (dx, dy, w, d) in enumerate(((0, -0.08, 0.18, 0.03), (0, 0.08, 0.18, 0.03), (-0.09, 0, 0.03, 0.16), (0.09, 0, 0.03, 0.16))):
            box(f'ruin{i}{j}{k}', M['ruin'], x + dx, y + dy, G - 0.005, w, d, rng.uniform(0.03, 0.07), outline=0.006, bevel=0)

# ---------- a camel, shrubs ----------
made = set(bpy.data.objects)
for dx in (-0.06, 0.06):
    for s in (-1, 1):
        rod(f'camelleg{dx}{s}', M['camel'], (dx, s * 0.025, G), (dx, s * 0.025, G + 0.15), 0.01, segs=6, outline=0.005)
box('camelbody', M['camel'], 0, 0, G + 0.13, 0.19, 0.07, 0.07, outline=0.009, bevel=0.018)
ball('camelhump', M['camel'], -0.01, 0, G + 0.2, 0.045, outline=0.008)
bar('camelneck', M['camel'], (0.08, 0, G + 0.17), (0.14, 0, G + 0.25), 0.032, outline=0.006)
box('camelhead', M['camel'], 0.16, 0, G + 0.23, 0.07, 0.035, 0.035, outline=0.006, bevel=0.008)
m = Matrix.Translation((0.6, -0.75, 0)) @ Matrix.Rotation(math.radians(-150), 4, 'Z')
bpy.context.view_layer.update()
for ob in set(bpy.data.objects) - made:
    ob.matrix_world = m @ ob.matrix_world
for k, (x, y) in enumerate(((1.0, 0.2), (-1.0, 0.45), (0.85, 0.75), (-0.2, -1.05), (1.05, -0.45))):
    s = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.01)
    s.scale = (1.3, 1.3, 0.7)
    s.location = (x, y, G + 0.02)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
