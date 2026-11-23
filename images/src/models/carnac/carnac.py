# A cartoon Carnac for the country maps, built in the set's shared look (../toon.py): the
# alignments of Brittany's standing stones, row upon row of rough grey menhirs marching across the
# heath and growing smaller along the lines, a dolmen of two uprights under its capstone, and the
# Saint-Michel tumulus with its little chapel, with pines. Turned a little towards the camera.
# Run: blender -b --factory-startup -P carnac.py -- carnac-1024.png 1024 carnac.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'heath': toon('heath', '#a8b870', shadow_mul=(0.76, 0.8, 0.8), lift=0.2),
    'stone': toon('stone', '#9a968e', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'stoneDark': toon('stoneDark', '#7a766e'),
    'mound': toon('mound', '#7aa850', shadow_mul=(0.72, 0.8, 0.74)),
    'white': toon('white', '#f0ece0', lift=0.12),
    'slate': toon('slate', '#4a5058'),
    'pine': toon('pine', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a38'),
})

G = tile(M['heath'])
before = set(bpy.data.objects)
rng = random.Random(2483)

# ---------- the alignments ----------
rows = 9
for r in range(rows):
    for j in range(15):
        x = -0.85 + j * 0.115 + rng.uniform(-0.015, 0.015)
        y = -0.45 + r * 0.09 + (x + 0.85) * 0.04 + rng.uniform(-0.01, 0.01)
        if math.hypot(x, y) > 1.1:
            continue
        t = (x + 0.85) / 1.7
        h = (0.2 - 0.13 * t) * rng.uniform(0.75, 1.1)
        w = 0.045 + 0.03 * (1 - t)
        a = rng.uniform(-0.3, 0.3)
        c, s = math.cos(a), math.sin(a)
        p = lambda u, v, z: (x + u * c - v * s, y + u * s + v * c, G + z)
        loft(f'menhir{r}{j}', M['stone'], [[p(-w / 2, -0.016, -0.005), p(w / 2, -0.016, -0.005), p(w / 2, 0.016, -0.005), p(-w / 2, 0.016, -0.005)],
                                           [p(-w * 0.45, -0.014, h * 0.7), p(w * 0.5, -0.016, h * 0.75), p(w * 0.5, 0.016, h * 0.75), p(-w * 0.45, 0.014, h * 0.7)],
                                           [p(-w * 0.2, -0.01, h), p(w * 0.25, -0.012, h * 0.95), p(w * 0.25, 0.012, h * 0.95), p(-w * 0.2, 0.01, h)]], outline=0.003)

# ---------- the dolmen ----------
DX, DY = 0.55, -0.72
for s in (-1, 1):
    box(f'dolmenupright{s}', M['stoneDark'], DX + s * 0.07, DY, G - 0.005, 0.04, 0.1, 0.1, outline=0.004, bevel=0)
box('capstone', M['stone'], DX, DY, G + 0.09, 0.22, 0.16, 0.04, rot_z=0.15, outline=0.005, bevel=0)

# ---------- the Saint-Michel tumulus ----------
TX, TY = -0.3, 0.72
mt = lathe('tumulus', M['mound'], ((0.38, 0), (0.28, 0.08), (0.16, 0.12)), G - 0.01, TX, TY, segs=24, outline=0.008)
mt.visible_shadow = False
box('chapel', M['white'], TX, TY, G + 0.105, 0.14, 0.09, 0.08, outline=0.004, bevel=0)
loft('chapelroof', M['slate'], [[(TX - 0.075, TY - 0.05, G + 0.18), (TX + 0.075, TY - 0.05, G + 0.18), (TX + 0.075, TY + 0.05, G + 0.18), (TX - 0.075, TY + 0.05, G + 0.18)],
                                [(TX - 0.075, TY - 0.004, G + 0.23), (TX + 0.075, TY - 0.004, G + 0.23), (TX + 0.075, TY + 0.004, G + 0.23), (TX - 0.075, TY + 0.004, G + 0.23)]], outline=0.003)
box('chapeltower', M['white'], TX - 0.06, TY, G + 0.105, 0.05, 0.05, 0.16, outline=0.003, bevel=0)
pyramid('chapelspire', M['slate'], TX - 0.06, TY, G + 0.26, 0.055, 0.08, outline=0.002)
for k, (x, y) in enumerate(((0.45, 0.6), (0.7, 0.42), (-0.85, 0.25), (0.88, -0.25), (-0.7, -0.65))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.14), 0.014, segs=6, outline=0.002)
    lathe(f'pine{k}', M['pine'], ((0.09, 0), (0.05, 0.07), (0.004, 0.16)), G + 0.1, x, y, segs=10, outline=0.005, smooth=False)

turn(before, -20)
render(G)
