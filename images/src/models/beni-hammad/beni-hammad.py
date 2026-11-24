# A cartoon Al Qal'a of Beni Hammad for the country maps, built in the set's shared look (../toon.py):
# the ruined first capital of the Hammadid emirs in the mountains of Algeria, its great square
# minaret standing tall and alone, its face divided into three tall panels of blind arches and
# niches, its top broken off, over the low walls of the Great Mosque's prayer hall and the palace
# ruins, the Hodna mountains behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P beni-hammad.py -- beni-hammad-1024.png 1024 beni-hammad.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b07e', shadow_mul=(0.78, 0.78, 0.82), lift=0.18),
    'mountain': toon('mountain', '#9a8c72', shadow_mul=(0.78, 0.78, 0.82)),
    'stone': toon('stone', '#c8ac80', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'stoneDark': toon('stoneDark', '#a88c62'),
    'dark': flat('dark', '#2e2620'),
    'shrub': toon('shrub', '#7a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1007)

# ---------- the mountains behind ----------
for k, (x, y, r, h) in enumerate(((-0.6, 0.9, 0.4, 0.34), (0.15, 1.0, 0.32, 0.42), (0.75, 0.75, 0.32, 0.3))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.65, h * 0.55), (r * 0.25, h * 0.92), (0.0, h)), G - 0.01, x, y, segs=24, outline=0.006)
    mt.visible_shadow = False

# ---------- the minaret ----------
MX, MY = 0.1, 0.1
W, H = 0.16, 0.72
box('minaret', M['stone'], MX, MY, G - 0.005, W, W, H, outline=0.008, bevel=0)
FY = MY - W / 2
for p, px in enumerate((-0.05, 0.0, 0.05)):
    box(f'panel{p}', M['stoneDark'], MX + px, FY - 0.003, G + 0.08, 0.04, 0.006, H - 0.14, outline=0.001, bevel=0)
    for j in range(4):
        z = G + 0.12 + j * 0.13
        box(f'niche{p}{j}', M['dark'], MX + px, FY - 0.007, z, 0.022, 0.006, 0.06, outline=0, bevel=0)
        cyl(f'nichetop{p}{j}', M['dark'], 0.011, 0.006, segs=10, outline=0, matrix=Matrix.Translation((MX + px, FY - 0.007, z + 0.06)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('minaretdoor', M['dark'], MX, FY - 0.004, G - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)
# its broken top: uneven blocks
for k in range(5):
    x = MX - W / 2 + 0.016 + k * (W - 0.032) / 4
    h = rng.choice((0.0, 0.02, 0.04))
    if h:
        box(f'topblock{k}', M['stone'], x, MY - 0.04 + 0.08 * rng.random(), G + H - 0.005, 0.03, 0.06, h, outline=0.002, bevel=0)

# ---------- the Great Mosque's prayer hall and the palace ruins ----------
for k in range(6):
    y = MY + 0.22 + k * 0.08
    box(f'hallwall{k}', M['stone'], MX + 0.05, y, G - 0.005, 0.5, 0.02, 0.04 + 0.04 * rng.random(), outline=0.002, bevel=0)
for k in range(5):
    x = MX - 0.2 + k * 0.1
    box(f'hallpier{k}', M['stone'], x, MY + 0.42, G - 0.005, 0.03, 0.03, 0.06 + 0.06 * rng.random(), outline=0.002, bevel=0)
for k in range(9):
    x = -0.75 + (k % 3) * 0.22 + 0.04 * rng.random()
    y = -0.45 + (k // 3) * 0.28 + 0.04 * rng.random()
    w, d = 0.14 + 0.06 * rng.random(), 0.12 + 0.05 * rng.random()
    box(f'ruinwall{k}a', M['stone'], x, y - d / 2, G - 0.005, w, 0.02, 0.03 + 0.04 * rng.random(), outline=0.001, bevel=0)
    box(f'ruinwall{k}b', M['stone'], x - w / 2, y, G - 0.005, 0.02, d, 0.03 + 0.04 * rng.random(), outline=0.001, bevel=0)
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.3
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.045, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (0.95 * math.cos(a), 0.6 * math.sin(a) - 0.25, G + 0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
