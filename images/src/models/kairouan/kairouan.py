# A cartoon Great Mosque of Kairouan for the country maps, built in the set's shared look
# (../toon.py): its massive square minaret rising in three tapering tiers to a little ribbed dome,
# the buttressed outer walls, the white marble courtyard ringed by arcades, and the prayer hall at
# the far end with its two ribbed domes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kairouan.py -- kairouan-1024.png 1024 kairouan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e0cc98', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'stone': toon('stone', '#d8c094', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'stoneDark': toon('stoneDark', '#b8a070'),
    'marble': toon('marble', '#f4f0e6', lift=0.15),
    'dark': flat('dark', '#4a3a2a'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

X0, X1, Y0, Y1, H = -0.55, 0.55, -0.55, 0.55, 0.13
box('court', M['marble'], 0.0, -0.08, G - 0.003, 1.0, 0.74, 0.01, outline=0.002, bevel=0)
for name, (x, y, sx, sy) in {'front': (0.0, Y0, X1 - X0, 0.08), 'back': (0.0, Y1, X1 - X0, 0.08), 'left': (X0, 0.0, 0.08, Y1 - Y0), 'right': (X1, 0.0, 0.08, Y1 - Y0)}.items():
    box(f'wall{name}', M['stone'], x, y, G - 0.005, sx + 0.08, sy, H, outline=0.007, bevel=0)
for j in range(9):
    t = -0.48 + j * 0.12
    for x, y in ((t, Y0 - 0.055), (X0 - 0.055, t), (X1 + 0.055, t)):
        if abs(x) < 0.15 and y < -0.5:
            continue
        box(f'buttress{x}{y}', M['stoneDark'], x, y, G - 0.005, 0.05, 0.05, H - 0.02, outline=0.002, bevel=0)

# arcades round the courtyard
for j in range(8):
    t = -0.42 + j * 0.12
    for s in (-1, 1):
        box(f'sidearch{s}{j}', M['dark'], s * (X1 - 0.042), t, G - 0.005, 0.006, 0.06, 0.07, outline=0, bevel=0)
        cyl(f'sidearchtop{s}{j}', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((s * (X1 - 0.042), t, G + 0.065)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))

# ---------- the prayer hall ----------
HY = 0.4
box('hall', M['stone'], 0.0, HY, G - 0.005, 1.1, 0.3, 0.16, outline=0.008, bevel=0)
for j in range(9):
    x = -0.48 + j * 0.12
    box(f'hallarch{j}', M['dark'], x, HY - 0.152, G - 0.005, 0.06, 0.006, 0.08, outline=0, bevel=0)
    cyl(f'hallarchtop{j}', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, HY - 0.152, G + 0.075)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('hallporch', M['stone'], 0.0, HY - 0.16, G - 0.005, 0.18, 0.06, 0.2, outline=0.004, bevel=0)
for k, y in enumerate((HY - 0.12, HY + 0.08)):
    lathe(f'domedrum{k}', M['stone'], ((0.08, 0), (0.08, 0.06)), G + 0.155, 0.0, y, segs=8, outline=0.004, smooth=False)
    lathe(f'dome{k}', M['stone'], ((0.075, 0), (0.065, 0.04), (0.035, 0.08), (0.004, 0.095)), G + 0.21, 0.0, y, segs=16, outline=0.004, smooth=False)

# ---------- the minaret ----------
MX, MY = 0.0, Y0 + 0.02
z = G - 0.005
for i, (w, h) in enumerate(((0.22, 0.34), (0.16, 0.12), (0.11, 0.08))):
    box(f'minaret{i}', M['stone'], MX, MY, z, w, w, h, outline=0.008, bevel=0)
    box(f'minaretwin{i}', M['dark'], MX, MY - w / 2 - 0.003, z + h * 0.4, w * 0.18, 0.006, h * 0.3, outline=0, bevel=0)
    for k in range(4):
        for side in range(4):
            a = math.pi / 2 * side
            u = -w / 2 + 0.02 + k * (w - 0.04) / 3
            px = MX + (w / 2) * math.cos(a) - u * math.sin(a)
            py = MY + (w / 2) * math.sin(a) + u * math.cos(a)
            box(f'merlon{i}{k}{side}', M['stoneDark'], px, py, z + h - 0.005, 0.025, 0.025, 0.03, outline=0.001, bevel=0)
    z += h
lathe('minaretdome', M['stone'], ((0.045, 0), (0.04, 0.03), (0.02, 0.06), (0.004, 0.075)), z, MX, MY, segs=16, outline=0.003, smooth=False)
rod('minaretfinial', M['stoneDark'], (MX, MY, z + 0.07), (MX, MY, z + 0.11), 0.006, segs=6, outline=0)
box('minaretdoor', M['dark'], MX, MY - 0.113, G - 0.005, 0.05, 0.006, 0.08, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.85, -0.45), (0.85, -0.5), (-0.9, 0.3), (0.9, 0.35))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)
