# A cartoon Merv for the country maps, built in the set's shared look (../toon.py): the oasis city
# on the Silk Road in Turkmenistan, the Mausoleum of Sultan Sanjar, its great brick cube with
# the arcaded gallery round its top and the double dome over it, and the Great Kyz Kala nearby,
# a mud-brick keep whose walls are all deep vertical ribs, in the desert. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P merv.py -- merv-1024.png 1024 merv.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e2cc9a', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'brick': toon('brick', '#c8a47a', shadow_mul=(0.8, 0.76, 0.8), lift=0.14),
    'brickDark': toon('brickDark', '#a8845a'),
    'mud': toon('mud', '#c09868', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'tile': toon('tile', '#3c9ab0', lift=0.2),
    'dark': flat('dark', '#2e2420'),
    'shrub': toon('shrub', '#9aa860', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)

# ---------- the Mausoleum of Sultan Sanjar ----------
SX, SY, W = -0.2, 0.15, 0.5
box('cube', M['brick'], SX, SY, G - 0.005, W, W, 0.34, outline=0.008, bevel=0)
arch('portal', M['dark'], SX, SY - W / 2 - 0.003, G - 0.005, 0.12, 0.24)
box('portalframe', M['brickDark'], SX, SY - W / 2 - 0.004, G - 0.005, 0.18, 0.004, 0.28, outline=0.001, bevel=0)
for s in (-1, 1):
    arch(f'sidenichef{s}', M['brickDark'], SX + s * 0.17, SY - W / 2 - 0.002, G + 0.06, 0.06, 0.18)
# the gallery of arches round the top
GZ = G + 0.335
box('gallery', M['brick'], SX, SY, GZ, W - 0.04, W - 0.04, 0.1, outline=0.005, bevel=0)
for j in range(7):
    t = -W / 2 + 0.06 + j * (W - 0.12) / 6
    arch(f'galf{j}', M['dark'], SX + t, SY - (W - 0.04) / 2 - 0.003, GZ + 0.015, 0.035, 0.07)
    arch(f'gals{j}', M['dark'], SX - (W - 0.04) / 2 - 0.003, SY + t, GZ + 0.015, 0.035, 0.07, face='x')
lathe('drum', M['brick'], ((0.22, 0), (0.2, 0.04), (0.19, 0.08)), GZ + 0.095, SX, SY, segs=32, outline=0.005)
lathe('dome', M['brickDark'], [(0.19 * math.cos(a), 0.06 + 0.17 * math.sin(a)) for a in [k * math.pi / 16 for k in range(9)]], GZ + 0.115, SX, SY, segs=32, outline=0.006)
for k in range(8):
    a = 2 * math.pi * k / 8
    box(f'domerib{k}', M['tile'], SX + 0.12 * math.cos(a), SY + 0.12 * math.sin(a), GZ + 0.25, 0.02, 0.02, 0.02, rot_z=a, outline=0, bevel=0)

# ---------- the Great Kyz Kala ----------
KX, KY = 0.55, -0.25
KW, KD, KH = 0.44, 0.34, 0.26
box('kyz', M['mud'], KX, KY, G - 0.005, KW, KD, KH, outline=0.006, bevel=0)
for j in range(9):
    t = -KW / 2 + 0.02 + j * (KW - 0.04) / 8
    lathe(f'ribf{j}', M['mud'], ((0.024, 0), (0.024, KH - 0.03), (0.016, KH)), G - 0.005, KX + t, KY - KD / 2, segs=10, outline=0.002)
for j in range(7):
    t = -KD / 2 + 0.02 + j * (KD - 0.04) / 6
    lathe(f'ribs{j}', M['mud'], ((0.024, 0), (0.024, KH - 0.03), (0.016, KH)), G - 0.005, KX - KW / 2, KY + t, segs=10, outline=0.002)
box('kyzgate', M['dark'], KX, KY - KD / 2 - 0.022, G - 0.005, 0.05, 0.006, 0.1, outline=0, bevel=0)
# a worn city wall behind
for k in range(6):
    x = -0.9 + k * 0.32
    box(f'citywall{k}', M['mud'], x, 0.85 - 0.08 * abs(k - 2.5), G - 0.005, 0.3, 0.06, 0.05 + 0.02 * (k % 2), outline=0.003, bevel=0)
for k, (x, y) in enumerate(((-0.75, -0.55), (-0.3, -0.75), (0.9, 0.35), (0.25, 0.6))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
