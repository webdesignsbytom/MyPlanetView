# A cartoon Himeji Castle for the country maps, built in the set's shared look (../toon.py): the
# White Heron Castle's main keep rising in five tiers of white plaster under grey tiled roofs and
# gables, the smaller keeps beside it, the steep curving stone base, the moat, and cherry trees in
# blossom. Turned a little towards the camera.
# Run: blender -b --factory-startup -P himeji-castle.py -- himeji-castle-1024.png 1024 himeji-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#a8a49a', shadow_mul=(0.84, 0.84, 0.9)),
    'white': toon('plaster', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#5a6068', shadow_mul=(0.8, 0.82, 0.9)),
    'window': flat('window', '#3a3640'),
    'moat': toon('moat', '#4a8a9a', lift=0.3),
    'blossom': toon('blossom', '#f4b8c8', shadow_mul=(0.86, 0.78, 0.84), lift=0.25),
    'trunk': toon('trunk', '#5a4038'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1697)

box('moat', M['moat'], 0.0, -0.55, G - 0.004, 2.6, 0.18, 0.01, outline=0.004, bevel=0)


def base(name, x, y, w, d, h):
    loft(name, M['stone'], [[(x - w / 2, y - d / 2, G - 0.01), (x + w / 2, y - d / 2, G - 0.01), (x + w / 2, y + d / 2, G - 0.01), (x - w / 2, y + d / 2, G - 0.01)],
                            [(x - w * 0.44, y - d * 0.42, G + h * 0.6), (x + w * 0.44, y - d * 0.42, G + h * 0.6), (x + w * 0.44, y + d * 0.42, G + h * 0.6),
                             (x - w * 0.44, y + d * 0.42, G + h * 0.6)],
                            [(x - w * 0.42, y - d * 0.4, G + h), (x + w * 0.42, y - d * 0.4, G + h), (x + w * 0.42, y + d * 0.4, G + h), (x - w * 0.42, y + d * 0.4, G + h)]],
         outline=0.014)
    return G + h


def tier(name, x, y, z, w, d, h, gable=False):
    box(name, M['white'], x, y, z - 0.005, w, d, h, outline=0.01, bevel=0)
    for j in range(max(2, int(w / 0.06))):
        n = max(2, int(w / 0.06))
        box(f'{name}win{j}', M['window'], x - w / 2 + (j + 0.5) * w / n, y - d / 2 - 0.004, z + h * 0.4, 0.016, 0.006, 0.025, outline=0, bevel=0)
    e = 0.05
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - e, y - d / 2 - e, z + h - 0.01), (x + w / 2 + e, y - d / 2 - e, z + h - 0.01), (x + w / 2 + e, y + d / 2 + e, z + h - 0.01),
                                     (x - w / 2 - e, y + d / 2 + e, z + h - 0.01)],
                                    [(x - w * 0.35, y - d * 0.3, z + h + 0.05), (x + w * 0.35, y - d * 0.3, z + h + 0.05), (x + w * 0.35, y + d * 0.3, z + h + 0.05),
                                     (x - w * 0.35, y + d * 0.3, z + h + 0.05)]], outline=0.008)
    if gable:
        loft(f'{name}gable', M['white'], [[(x - 0.05, y - d / 2 - 0.03, z + h), (x + 0.05, y - d / 2 - 0.03, z + h), (x + 0.05, y - d / 2 + 0.01, z + h),
                                           (x - 0.05, y - d / 2 + 0.01, z + h)],
                                          [(x - 0.004, y - d / 2 - 0.03, z + h + 0.07), (x + 0.004, y - d / 2 - 0.03, z + h + 0.07), (x + 0.004, y - d / 2 + 0.01, z + h + 0.07),
                                           (x - 0.004, y - d / 2 + 0.01, z + h + 0.07)]], outline=0.005)
    return z + h + 0.03


# ---------- the main keep: five tiers ----------
KX, KY = 0.05, 0.2
z = base('mainbase', KX, KY, 0.6, 0.45, 0.2)
for i, (w, d, h) in enumerate(((0.48, 0.36, 0.09), (0.42, 0.32, 0.08), (0.34, 0.26, 0.08), (0.26, 0.2, 0.07), (0.2, 0.16, 0.07))):
    z = tier(f'keep{i}', KX, KY, z, w, d, h, gable=i in (1, 3))
lathe('shachihoko', M['roof'], ((0.015, 0), (0.004, 0.05)), z + 0.03, KX - 0.06, KY, segs=6, outline=0.002)
lathe('shachihoko2', M['roof'], ((0.015, 0), (0.004, 0.05)), z + 0.03, KX + 0.06, KY, segs=6, outline=0.002)

# ---------- the smaller keeps ----------
for k, (x, y) in enumerate(((KX - 0.48, KY + 0.15), (KX + 0.48, KY + 0.12))):
    z = base(f'smallbase{k}', x, y, 0.32, 0.28, 0.14)
    for i, (w, d, h) in enumerate(((0.24, 0.2, 0.07), (0.18, 0.15, 0.06))):
        z = tier(f'small{k}{i}', x, y, z, w, d, h, gable=i == 1)

# ---------- cherry trees in blossom ----------
for k, (x, y) in enumerate(((-0.85, -0.25), (-0.55, -0.3), (0.6, -0.28), (0.9, -0.2), (-1.0, 0.2), (1.0, 0.45))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.012, segs=6, outline=0.003)
    b = ball(f'blossom{k}', M['blossom'], 0, 0, 0, 0.08, outline=0.01)
    b.scale = (1.3, 1.2, 0.85)
    b.location = (x, y, G + 0.13)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
