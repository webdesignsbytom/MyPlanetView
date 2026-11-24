# A cartoon Volubilis for the country maps, built in the set's shared look (../toon.py): the Roman
# town on the Moroccan plain, Caracalla's triumphal arch with its columns and attic, the basilica's
# row of tall columns and arches, the Capitol temple's columns on their podium, mosaic floors, fallen
# column drums, olive trees and the green hills behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P volubilis.py -- volubilis-1024.png 1024 volubilis.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#c8c08a', shadow_mul=(0.8, 0.8, 0.82), lift=0.2),
    'stone': toon('stone', '#dcc08c', shadow_mul=(0.86, 0.82, 0.76), lift=0.1),
    'stoneDark': toon('stoneDark', '#bca06c'),
    'dark': flat('dark', '#4a3a2a'),
    'mosaic': toon('mosaic', '#c87a5a'),
    'mosaicLight': toon('mosaicLight', '#e8d0a0'),
    'olive': toon('olive', '#7a9a50', shadow_mul=(0.72, 0.8, 0.74)),
    'hill': toon('hill', '#8aaa5a', shadow_mul=(0.72, 0.8, 0.74)),
})

G = tile(M['plain'])
before = set(bpy.data.objects)

for k, (x, y, r, h) in enumerate(((-0.6, 0.85, 0.36, 0.16), (0.12, 0.96, 0.32, 0.2), (0.72, 0.76, 0.3, 0.14))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.65), (r * 0.3, h * 0.95), (0.004, h)), G - 0.01, x, y, segs=24, outline=0.008)
    hl.visible_shadow = False

# ---------- the triumphal arch ----------
AX, AY = -0.3, -0.15
box('arch', M['stone'], AX, AY, G - 0.005, 0.46, 0.13, 0.36, outline=0.009, bevel=0)
box('archopening', M['dark'], AX, AY - 0.067, G - 0.005, 0.16, 0.006, 0.18, outline=0, bevel=0)
cyl('archtop', M['dark'], 0.08, 0.006, segs=18, outline=0, matrix=Matrix.Translation((AX, AY - 0.067, G + 0.175)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for x in (-0.2, -0.13, 0.13, 0.2):
    box(f'pedestal{x}', M['stoneDark'], AX + x, AY - 0.09, G - 0.005, 0.045, 0.045, 0.065, outline=0.002, bevel=0)
    rod(f'archcol{x}', M['stone'], (AX + x, AY - 0.09, G + 0.06), (AX + x, AY - 0.09, G + 0.27), 0.017, segs=10, outline=0.002)
for s in (-1, 1):
    box(f'archniche{s}', M['dark'], AX + s * 0.165, AY - 0.067, G + 0.1, 0.03, 0.006, 0.07, outline=0, bevel=0)
box('entablature', M['stoneDark'], AX, AY - 0.02, G + 0.27, 0.5, 0.17, 0.03, outline=0.003, bevel=0)
box('attic', M['stone'], AX, AY, G + 0.3, 0.44, 0.12, 0.08, outline=0.005, bevel=0)

# ---------- the basilica's columns and arches ----------
BY = 0.35
xs = [-0.15 + j * 0.12 for j in range(8)]
for j, x in enumerate(xs):
    h = 0.32 if j < 6 else (0.2 if j == 6 else 0.13)
    box(f'colbase{j}', M['stoneDark'], x, BY, G - 0.005, 0.06, 0.06, 0.03, outline=0.002, bevel=0)
    rod(f'col{j}', M['stone'], (x, BY, G + 0.02), (x, BY, G + h), 0.024, segs=10, outline=0.003)
    if j < 5:
        cx, r = x + 0.06, 0.06
        for i in range(6):
            a0, a1 = math.pi * i / 6, math.pi * (i + 1) / 6
            bar(f'arch{j}{i}', M['stone'], (cx - r * math.cos(a0), BY, G + 0.32 + r * math.sin(a0)), (cx - r * math.cos(a1), BY, G + 0.32 + r * math.sin(a1)), 0.035, outline=0.002)

# ---------- the Capitol temple ----------
CX, CY = 0.5, -0.25
box('podium', M['stoneDark'], CX, CY, G - 0.005, 0.36, 0.3, 0.07, outline=0.005, bevel=0)
for k in range(3):
    box(f'templestep{k}', M['stoneDark'], CX, CY - 0.16 - k * 0.025, G - 0.005, 0.2, 0.03, 0.06 - k * 0.02, outline=0.002, bevel=0)
for j, x in enumerate((-0.15, -0.05, 0.05, 0.15)):
    rod(f'templecol{j}', M['stone'], (CX + x, CY - 0.11, G + 0.065), (CX + x, CY - 0.11, G + 0.36), 0.02, segs=10, outline=0.003)
box('templebeam', M['stone'], CX, CY - 0.11, G + 0.36, 0.36, 0.05, 0.03, outline=0.003, bevel=0)
for s in (-1, 1):
    rod(f'templeback{s}', M['stone'], (CX + s * 0.15, CY + 0.1, G + 0.065), (CX + s * 0.15, CY + 0.1, G + 0.2), 0.02, segs=10, outline=0.003)

# ---------- mosaics, fallen drums, olives ----------
for k, (x, y) in enumerate(((-0.75, 0.15), (0.05, -0.6), (-0.7, -0.55))):
    box(f'mosaic{k}', M['mosaic'], x, y, G - 0.003, 0.26, 0.2, 0.01, outline=0.002, bevel=0)
    box(f'mosaicin{k}', M['mosaicLight'], x, y, G - 0.002, 0.18, 0.12, 0.012, outline=0, bevel=0)
for k, (x, y, a) in enumerate(((0.15, -0.3, 0.4), (-0.05, 0.05, 1.2), (0.85, 0.2, 2.0))):
    rod(f'drum{k}', M['stone'], (x, y, G + 0.02), (x + 0.12 * math.cos(a), y + 0.12 * math.sin(a), G + 0.02), 0.022, segs=10, outline=0.002)
for k, (x, y) in enumerate(((-0.95, -0.25), (0.97, -0.05), (-0.95, 0.45), (0.3, -0.85), (-0.35, -0.82))):
    ball(f'olive{k}', M['olive'], x, y, G + 0.075, 0.08, outline=0.006)

turn(before, -20)
render(G)
