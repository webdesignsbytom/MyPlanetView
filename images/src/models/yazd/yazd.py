# A cartoon Yazd for the country maps, built in the set's shared look (../toon.py): the desert
# city of mud brick, its flat roofs and little domes bristling with tall windcatchers, and over them
# the Jameh Mosque's great tiled portal with its two slender minarets, the tallest in Iran, and its
# turquoise dome behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P yazd.py -- yazd-1024.png 1024 yazd.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#dcc898', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'mud': toon('mud', '#d0aa7a', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'mudDark': toon('mudDark', '#b08a5a'),
    'tile': toon('tile', '#2a6ab0', lift=0.12),
    'turquoise': toon('turquoise', '#3ab0c0', lift=0.15),
    'dark': flat('dark', '#3a2e24'),
    'white': toon('white', '#f4f0e6', lift=0.15),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2591)

# ---------- the Jameh Mosque ----------
MX, MY = 0.0, 0.42
box('mosquebody', M['mud'], MX, MY + 0.12, G - 0.005, 0.5, 0.3, 0.16, outline=0.007, bevel=0)
lathe('drum', M['tile'], ((0.12, 0), (0.12, 0.06)), G + 0.155, MX, MY + 0.16, segs=20, outline=0.004)
lathe('dome', M['turquoise'], ((0.125, 0), (0.115, 0.06), (0.07, 0.12), (0.004, 0.15)), G + 0.21, MX, MY + 0.16, segs=24, outline=0.005)
box('portal', M['mud'], MX, MY - 0.04, G - 0.005, 0.26, 0.1, 0.38, outline=0.007, bevel=0)
box('portaltile', M['tile'], MX, MY - 0.093, G + 0.02, 0.21, 0.006, 0.33, outline=0, bevel=0)
box('portalrecess', M['dark'], MX, MY - 0.096, G - 0.005, 0.11, 0.006, 0.2, outline=0, bevel=0)
cyl('portalarch', M['dark'], 0.055, 0.006, segs=16, outline=0, matrix=Matrix.Translation((MX, MY - 0.096, G + 0.195)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('portalband', M['white'], MX, MY - 0.097, G + 0.31, 0.21, 0.004, 0.02, outline=0, bevel=0)
for s in (-1, 1):
    mx = MX + s * 0.1
    lathe(f'minaret{s}', M['tile'], ((0.026, 0), (0.022, 0.4)), G + 0.375, mx, MY - 0.04, segs=12, outline=0.003)
    lathe(f'minaretbalcony{s}', M['mudDark'], ((0.036, 0), (0.036, 0.015)), G + 0.72, mx, MY - 0.04, segs=12, outline=0.002)
    lathe(f'minarettop{s}', M['tile'], ((0.02, 0), (0.016, 0.06), (0.004, 0.08)), G + 0.735, mx, MY - 0.04, segs=12, outline=0.002)

# ---------- the old city with its windcatchers ----------
spots = []
for k in range(300):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.85, 0.35)
    if math.hypot(x, y) > 1.0 or (abs(x - MX) < 0.32 and y > 0.2) or any(abs(x - px) < 0.15 and abs(y - py) < 0.13 for px, py in spots):
        continue
    spots.append((x, y))
    w, d, h = rng.uniform(0.12, 0.15), rng.uniform(0.1, 0.12), rng.uniform(0.06, 0.1)
    box(f'house{k}', M['mud'], x, y, G - 0.005, w, d, h, outline=0.003, bevel=0)
    if k % 2 == 0:
        bx, by = x + rng.uniform(-0.03, 0.03), y + 0.02
        bh = rng.uniform(0.12, 0.2)
        box(f'badgir{k}', M['mudDark'], bx, by, G + h - 0.005, 0.045, 0.045, bh, outline=0.003, bevel=0)
        for j in range(3):
            box(f'badgirslot{k}{j}', M['dark'], bx - 0.013 + j * 0.013, by - 0.024, G + h + bh * 0.35, 0.006, 0.004, bh * 0.55, outline=0, bevel=0)
        box(f'badgircap{k}', M['mud'], bx, by, G + h + bh - 0.01, 0.052, 0.052, 0.015, outline=0.001, bevel=0)
    else:
        lathe(f'housedome{k}', M['mudDark'], ((0.04, 0), (0.03, 0.025), (0.004, 0.04)), G + h - 0.005, x, y, segs=12, outline=0.002)
    if len(spots) >= 26:
        break

turn(before, -20)
render(G)
