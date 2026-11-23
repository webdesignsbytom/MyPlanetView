# A cartoon Old Town of Lijiang for the country maps, built in the set's shared look (../toon.py):
# the Naxi town's sea of dark tiled roofs over wooden houses, its little canals with stone bridges
# and the great water wheels at the town's gate, the Wangu Pavilion rising in five storeys on Lion
# Hill, and the snowy peaks of Jade Dragon Snow Mountain behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lijiang.py -- lijiang-1024.png 1024 lijiang.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8a888', shadow_mul=(0.84, 0.82, 0.8), lift=0.2),
    'hill': toon('hill', '#5a9a44', shadow_mul=(0.72, 0.8, 0.74)),
    'mountain': toon('mountain', '#7a8a9a', shadow_mul=(0.8, 0.84, 0.92)),
    'snow': toon('snow', '#f6f8fa', lift=0.3),
    'wood': toon('wood', '#9a6a44'),
    'white': toon('white', '#ece4d4', lift=0.1),
    'tile': toon('tile', '#3e4248'),
    'water': toon('water', '#5aa8c8', lift=0.3),
    'stone': toon('stone', '#c8c0b0', shadow_mul=(0.84, 0.84, 0.88)),
    'red': toon('red', '#a8382a'),
    'dark': flat('dark', '#2e2a28'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2431)

for k, (x, y, r, h) in enumerate(((0.3, 0.88, 0.34, 0.5), (0.7, 0.68, 0.28, 0.38))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.62, h * 0.55), (r * 0.3, h * 0.85), (0.004, h)), G - 0.01, x, y, segs=12, outline=0.008, smooth=False)
    mt.visible_shadow = False
    lathe(f'snow{k}', M['snow'], ((r * 0.38, 0), (r * 0.3, h * 0.1), (0.004, h * 0.3 + 0.004)), G - 0.01 + h * 0.72, x, y, segs=12, outline=0.004, smooth=False)

# ---------- Lion Hill and the Wangu Pavilion ----------
LX, LY = -0.42, 0.55
hl = lathe('lionhill', M['hill'], ((0.36, 0), (0.25, 0.1), (0.12, 0.15)), G - 0.01, LX, LY, segs=20, outline=0.008)
hl.visible_shadow = False
z = G + 0.14
w = 0.16
for i in range(5):
    h = 0.07 if i == 0 else 0.05
    box(f'storey{i}', M['wood'], LX, LY, z, w, w, h, outline=0.004, bevel=0)
    for side in range(2):
        box(f'storeywin{i}{side}', M['red'], LX, LY - w / 2 - 0.003, z + h * 0.2, w * 0.5, 0.006, h * 0.6, outline=0, bevel=0)
    loft(f'eave{i}', M['tile'], [[(LX - w / 2 - 0.04, LY - w / 2 - 0.04, z + h), (LX + w / 2 + 0.04, LY - w / 2 - 0.04, z + h), (LX + w / 2 + 0.04, LY + w / 2 + 0.04, z + h), (LX - w / 2 - 0.04, LY + w / 2 + 0.04, z + h)],
                                 [(LX - w * 0.36, LY - w * 0.36, z + h + 0.035), (LX + w * 0.36, LY - w * 0.36, z + h + 0.035), (LX + w * 0.36, LY + w * 0.36, z + h + 0.035), (LX - w * 0.36, LY + w * 0.36, z + h + 0.035)]], outline=0.003)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'eavetip{i}{sx}{sy}', M['tile'], (LX + sx * (w / 2 + 0.035), LY + sy * (w / 2 + 0.035), z + h), (LX + sx * (w / 2 + 0.06), LY + sy * (w / 2 + 0.06), z + h + 0.03), 0.01, outline=0)
    z += h + 0.03
    w *= 0.86
pyramid('pavilioncap', M['tile'], LX, LY, z - 0.005, w + 0.04, 0.07, outline=0.003)
ball('pavilionfinial', M['red'], LX, LY, z + 0.075, 0.012, outline=0)

# ---------- canals and houses ----------
for k, x in enumerate((-0.32, 0.1, 0.5)):
    box(f'canal{k}', M['water'], x, -0.25, G - 0.004, 0.06, 0.9, 0.008, outline=0.001, bevel=0)
    for j, y in enumerate((-0.45, 0.0)):
        n = 6
        pts = [(x - 0.05 + 0.1 * i / n, y, G + 0.01 + 0.03 * math.sin(math.pi * i / n)) for i in range(n + 1)]
        for i in range(n):
            bar(f'bridge{k}{j}{i}', M['stone'], pts[i], pts[i + 1], 0.04, outline=0.002)
for col in range(5):
    for row in range(4):
        x = -0.75 + col * 0.36 + (0.0 if row % 2 else 0.05)
        y = -0.65 + row * 0.18
        if any(abs(x - cx) < 0.08 for cx in (-0.32, 0.1, 0.5)) or math.hypot(x, y) > 1.05:
            continue
        w, d, h = rng.uniform(0.17, 0.22), 0.13, rng.uniform(0.08, 0.11)
        box(f'house{col}{row}', M['white' if (col + row) % 3 else 'wood'], x, y, G - 0.005, w, d, h, outline=0.004, bevel=0)
        box(f'housedoor{col}{row}', M['wood'], x, y - d / 2 - 0.003, G - 0.005, 0.05, 0.006, 0.06, outline=0, bevel=0)
        loft(f'houseroof{col}{row}', M['tile'], [[(x - w / 2 - 0.02, y - d / 2 - 0.025, G + h - 0.005), (x + w / 2 + 0.02, y - d / 2 - 0.025, G + h - 0.005), (x + w / 2 + 0.02, y + d / 2 + 0.025, G + h - 0.005), (x - w / 2 - 0.02, y + d / 2 + 0.025, G + h - 0.005)],
                                                 [(x - w / 2 - 0.02, y - 0.004, G + h + 0.06), (x + w / 2 + 0.02, y - 0.004, G + h + 0.06), (x + w / 2 + 0.02, y + 0.004, G + h + 0.06), (x - w / 2 - 0.02, y + 0.004, G + h + 0.06)]], outline=0.004)
        for sx in (-1, 1):
            bar(f'houseridge{col}{row}{sx}', M['tile'], (x + sx * (w / 2 + 0.02), y, G + h + 0.06), (x + sx * (w / 2 + 0.04), y, G + h + 0.085), 0.012, outline=0)

# ---------- the water wheels ----------
for k, (x, y) in enumerate(((0.75, -0.45), (0.82, -0.22))):
    cyl(f'wheel{k}', M['wood'], 0.09, 0.025, segs=20, outline=0.004, matrix=Matrix.Translation((x, y, G + 0.09)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    cyl(f'wheelhub{k}', M['dark'], 0.06, 0.027, segs=20, outline=0, matrix=Matrix.Translation((x, y, G + 0.09)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    for j in range(8):
        a = 2 * math.pi * j / 8
        bar(f'spoke{k}{j}', M['wood'], (x, y, G + 0.09), (x, y + 0.085 * math.cos(a), G + 0.09 + 0.085 * math.sin(a)), 0.01, outline=0)

turn(before, -20)
render(G)
