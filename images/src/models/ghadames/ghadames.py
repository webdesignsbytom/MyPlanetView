# A cartoon Ghadames for the country maps, built in the set's shared look (../toon.py): the old
# oasis town in the Sahara, its whitewashed mud-brick houses packed together with their pointed
# corner crenellations, the mosque's tapering minaret, the date palms of the oasis gardens round it,
# and the desert sand beyond. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ghadames.py -- ghadames-1024.png 1024 ghadames.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8c88a', shadow_mul=(0.86, 0.78, 0.72), lift=0.25),
    'garden': toon('garden', '#8ab860', shadow_mul=(0.72, 0.8, 0.74)),
    'white': toon('white', '#f8f4ea', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'mud': toon('mud', '#d8b88a', shadow_mul=(0.86, 0.8, 0.74)),
    'door': toon('door', '#7a4a2e'),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(1783)

for s in (-1, 1):
    box(f'garden{s}', M['garden'], s * 0.8, -0.2, G - 0.004, 0.5, 0.7, 0.01, outline=0.004, bevel=0)


def house(name, x, y, w, d, h, mat):
    box(name, M[mat], x, y, G - 0.005, w, d, h, outline=0.009, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            lathe(f'{name}horn{sx}{sy}', M[mat], ((0.014, 0), (0.004, 0.05)), G + h - 0.005, x + sx * (w / 2 - 0.012), y + sy * (d / 2 - 0.012), segs=4, outline=0.002,
                  smooth=False)
    box(f'{name}door', M['door'], x, y - d / 2 - 0.004, G, 0.035, 0.006, 0.06, outline=0, bevel=0)
    box(f'{name}win', M['window'], x + w * 0.25, y - d / 2 - 0.004, G + h * 0.6, 0.02, 0.006, 0.025, outline=0, bevel=0)


k = 0
for i in range(4):
    for j in range(5):
        x = -0.45 + j * 0.2 + (0.1 if i % 2 else 0)
        y = -0.35 + i * 0.22
        if math.hypot(x, y) > 0.95:
            continue
        h = rng.uniform(0.12, 0.2)
        house(f'house{k}', x, y, 0.19, 0.2, h, 'white' if (i + j) % 3 else 'mud')
        k += 1
MX, MY = 0.05, 0.35
loft('minaret', M['white'], [[(MX - 0.05, MY - 0.05, G - 0.005), (MX + 0.05, MY - 0.05, G - 0.005), (MX + 0.05, MY + 0.05, G - 0.005), (MX - 0.05, MY + 0.05, G - 0.005)],
                             [(MX - 0.03, MY - 0.03, G + 0.42), (MX + 0.03, MY - 0.03, G + 0.42), (MX + 0.03, MY + 0.03, G + 0.42), (MX - 0.03, MY + 0.03, G + 0.42)]],
     outline=0.01)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'minarethorn{sx}{sy}', M['white'], ((0.01, 0), (0.004, 0.05)), G + 0.415, MX + sx * 0.025, MY + sy * 0.025, segs=4, outline=0.002, smooth=False)
for k2, (x, y) in enumerate(((-0.95, -0.4), (-0.7, -0.05), (-0.85, 0.25), (0.75, -0.45), (0.95, -0.1), (0.7, 0.2), (-0.5, 0.75), (0.45, 0.8))):
    h = rng.uniform(0.28, 0.36)
    rod(f'palmtrunk{k2}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k2
        bar(f'frond{k2}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.019, outline=0.005)

turn(before, -20)
render(G)
