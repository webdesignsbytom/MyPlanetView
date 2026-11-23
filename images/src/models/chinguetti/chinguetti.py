# A cartoon Chinguetti for the country maps, built in the set's shared look (../toon.py): the old
# ksar of Mauritania's Adrar, the Friday mosque's square stone minaret with its crenellated top and
# the five ostrich eggs on its corners and peak, the old town's dry-stone houses round it, date palms,
# the Sahara's dunes pressing in, and a camel. Turned a little towards the camera.
# Run: blender -b --factory-startup -P chinguetti.py -- chinguetti-1024.png 1024 chinguetti.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8c88a', shadow_mul=(0.84, 0.76, 0.72), lift=0.25),
    'dune': toon('dune', '#e0b070', shadow_mul=(0.84, 0.76, 0.72), lift=0.2),
    'stone': toon('stone', '#b8946a', shadow_mul=(0.84, 0.76, 0.74)),
    'stoneDark': toon('stoneDark', '#9a7a58', shadow_mul=(0.84, 0.76, 0.74)),
    'egg': toon('egg', '#f8f4ec', lift=0.2),
    'window': flat('window', '#3a3030'),
    'door': toon('door', '#3f7fc0'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'camel': toon('camel', '#c89a5e'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(839)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- dunes behind ----------
for k, (cx, cy, rx, ry, h) in enumerate(((-0.55, 0.85, 0.6, 0.3, 0.3), (0.45, 0.95, 0.55, 0.28, 0.26), (1.0, 0.35, 0.3, 0.4, 0.2))):
    rings = [[(cx + s * rx * math.cos(t), cy + dy + s * ry * math.sin(t), G + z) for t in (2 * math.pi * j / 20 for j in range(20))]
             for s, z, dy in ((1.0, -0.01, 0.0), (0.65, h * 0.6, -0.04), (0.25, h * 0.95, -0.06), (0.06, h, -0.07))]
    d = loft(f'dune{k}', M['dune'], rings, outline=0.02, smooth=True)
    d.visible_shadow = False

# ---------- the mosque and its minaret ----------
MX, MY = 0.05, 0.15
box('prayerhall', M['stone'], MX - 0.12, MY + 0.05, G - 0.005, 0.36, 0.28, 0.12, outline=0.014, bevel=0)
for k in range(7):
    box(f'hallmerlon{k}', M['stone'], MX - 0.28 + k * 0.053, MY - 0.09, G + 0.115, 0.025, 0.02, 0.03, outline=0.003, bevel=0)
TX, TY = MX + 0.14, MY - 0.03
loft('minaret', M['stone'], [[(TX - 0.08, TY - 0.08, G - 0.005), (TX + 0.08, TY - 0.08, G - 0.005), (TX + 0.08, TY + 0.08, G - 0.005), (TX - 0.08, TY + 0.08, G - 0.005)],
                             [(TX - 0.065, TY - 0.065, G + 0.42), (TX + 0.065, TY - 0.065, G + 0.42), (TX + 0.065, TY + 0.065, G + 0.42), (TX - 0.065, TY + 0.065, G + 0.42)]],
     outline=0.012)
for k in range(5):
    box(f'minaretcourse{k}', M['stoneDark'], TX, TY - 0.072 - k * 0.002, G + 0.07 + k * 0.08, 0.15 - k * 0.006, 0.008, 0.008, outline=0, bevel=0)
for k, z in enumerate((0.1, 0.22, 0.32)):
    box(f'minaretslit{k}', M['window'], TX, TY - 0.072, G + z, 0.02, 0.01, 0.04, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'cornerpost{sx}{sy}', M['stone'], ((0.018, 0), (0.016, 0.05)), G + 0.415, TX + sx * 0.05, TY + sy * 0.05, segs=4, outline=0.004, smooth=False)
        ball(f'egg{sx}{sy}', M['egg'], TX + sx * 0.05, TY + sy * 0.05, G + 0.48, 0.016, outline=0.003)
lathe('peak', M['stone'], ((0.02, 0), (0.016, 0.08)), G + 0.415, TX, TY, segs=4, outline=0.004, smooth=False)
ball('peakegg', M['egg'], TX, TY, G + 0.51, 0.018, outline=0.003)

# ---------- the old town's dry-stone houses ----------
for k, (x, y, w, d) in enumerate(((-0.55, -0.2, 0.2, 0.16), (-0.3, -0.35, 0.16, 0.14), (-0.65, 0.2, 0.18, 0.16), (0.45, -0.3, 0.2, 0.15), (0.65, 0.05, 0.16, 0.16),
                                  (0.15, -0.45, 0.18, 0.12), (-0.05, -0.2, 0.14, 0.12))):
    h = rng.uniform(0.09, 0.13)
    box(f'house{k}', M['stone' if k % 2 else 'stoneDark'], x, y, G - 0.005, w, d, h, outline=0.01, bevel=0)
    box(f'housedoor{k}', M['door'], x, y - d / 2 - 0.004, G, 0.035, 0.01, 0.06, outline=0, bevel=0)
    box(f'houseparapet{k}', M['stone'], x, y, G + h - 0.005, w + 0.01, d + 0.01, 0.015, outline=0.003, bevel=0)

# ---------- date palms ----------
for k, (x, y) in enumerate(((-0.95, -0.45), (0.9, -0.55), (-0.35, 0.5), (0.95, -0.15))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)

# ---------- a camel ----------
made = set(bpy.data.objects)
for dx in (-0.08, 0.08):
    for sy in (-1, 1):
        rod(f'camelleg{dx}{sy}', M['camel'], (dx, sy * 0.035, G), (dx, sy * 0.035, G + 0.17), 0.012, segs=8, outline=0.004)
squashed('camelbody', M['camel'], 0, 0, G + 0.2, 0.1, 1.5, 0.8, 0.7, outline=0.012)
ball('camelhump', M['camel'], -0.01, 0, G + 0.26, 0.06, outline=0.01)
rod('camelneck', M['camel'], (0.12, 0, G + 0.2), (0.2, 0, G + 0.3), 0.025, r2=0.02, segs=10, outline=0.006)
squashed('camelhead', M['camel'], 0.23, 0, G + 0.31, 0.035, 1.5, 0.9, 0.8, outline=0.006)
place(made, 210, -0.25, -0.75)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
