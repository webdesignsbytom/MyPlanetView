# A cartoon Kunya-Urgench for the country maps, built in the set's shared look (../toon.py): the old
# capital of Khwarezm in the desert of northern Turkmenistan, the Kutlug Timur minaret, the
# tallest in Central Asia, tapering up in bands of patterned brick to its broken top, and the
# mausoleum of Turabek Khanum with its tall tiled portal and its pointed turquoise dome, among
# the old graves. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kunya-urgench.py -- kunya-urgench-1024.png 1024 kunya-urgench.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e2cc9a', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'brick': toon('brick', '#d2b084', shadow_mul=(0.8, 0.76, 0.8), lift=0.14),
    'band': toon('band', '#b08c60'),
    'tile': toon('tile', '#3aa8b8', shadow_mul=(0.75, 0.8, 0.86), lift=0.22),
    'tileDark': toon('tileDark', '#2a6e9a'),
    'dark': flat('dark', '#2e2420'),
    'grave': toon('grave', '#c8b494'),
    'shrub': toon('shrub', '#9aa860', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(48472)

# ---------- the Kutlug Timur minaret ----------
NX, NY = -0.35, 0.1
H = 0.95
lathe('minaret', M['brick'], ((0.13, 0), (0.115, H * 0.3), (0.095, H * 0.65), (0.075, H)), G - 0.005, NX, NY, segs=24, outline=0.007, smooth=False)
for k in range(8):
    t = 0.08 + k * 0.11
    r = 0.13 - (0.13 - 0.075) * t + 0.004
    lathe(f'band{k}', M['band'] if k % 3 else M['tile'], ((r, 0), (r, 0.022)), G + H * t, NX, NY, segs=24, outline=0.001, smooth=False)
lathe('minaretbase', M['band'], ((0.16, 0), (0.16, 0.04)), G - 0.005, NX, NY, segs=24, outline=0.003, smooth=False)

# ---------- Turabek Khanum's mausoleum ----------
TX, TY = 0.4, 0.05
box('hall', M['brick'], TX, TY + 0.06, G - 0.005, 0.4, 0.34, 0.24, outline=0.007, bevel=0)
lathe('drum', M['brick'], ((0.15, 0), (0.15, 0.07)), G + 0.235, TX, TY + 0.08, segs=24, outline=0.004)
lathe('dome', M['tile'], ((0.16, 0), (0.16, 0.03), (0.14, 0.1), (0.09, 0.17), (0.03, 0.22), (0.0, 0.235)), G + 0.3, TX, TY + 0.08, segs=24, outline=0.006)
for k in range(12):
    a = 2 * math.pi * k / 12
    bar(f'domerib{k}', M['tileDark'], (TX + 0.158 * math.cos(a), TY + 0.08 + 0.158 * math.sin(a), G + 0.33), (TX + 0.06 * math.cos(a), TY + 0.08 + 0.06 * math.sin(a), G + 0.505), 0.008, outline=0)
box('portal', M['brick'], TX, TY - 0.13, G - 0.005, 0.3, 0.06, 0.38, outline=0.006, bevel=0)
box('portalframe', M['tileDark'], TX, TY - 0.162, G + 0.02, 0.22, 0.004, 0.33, outline=0.001, bevel=0)
arch('portalniche', M['tile'], TX, TY - 0.165, G - 0.005, 0.15, 0.3)
arch('portaldoor', M['dark'], TX, TY - 0.168, G - 0.005, 0.06, 0.12)

# ---------- the old graves ----------
for k in range(12):
    x, y = -0.9 + 1.8 * rng.random(), -0.85 + 0.4 * rng.random()
    if math.hypot(x, y) > 1.1:
        continue
    box(f'grave{k}', M['grave'], x, y, G - 0.005, 0.1, 0.05, 0.03 + 0.02 * rng.random(), rot_z=rng.random() * 0.4, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.8, 0.5), (0.0, 0.75), (0.85, 0.5), (-0.95, -0.1))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
