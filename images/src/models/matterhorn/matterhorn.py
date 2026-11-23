# A cartoon Matterhorn for the country maps, built in the set's shared look (../toon.py): the
# great hooked pyramid of rock and snow rising over Zermatt, the village's dark-timbered chalets on
# their white stone bases with slate roofs, its church spire, the larches and pines, and the green
# alpine meadow. Turned a little towards the camera.
# Run: blender -b --factory-startup -P matterhorn.py -- matterhorn-1024.png 1024 matterhorn.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#7a6a64', shadow_mul=(0.84, 0.84, 0.9)),
    'rockLight': toon('rockLight', '#9a8a80', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'wood': toon('wood', '#7a4a2e', shadow_mul=(0.86, 0.8, 0.8)),
    'stone': toon('stone', '#f2eee6', lift=0.15),
    'slate': toon('slate', '#6a6a72'),
    'window': flat('window', '#2e2a28'),
    'geranium': toon('geranium', '#e8402c', lift=0.25),
    'pine': toon('pine', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(2141)

# ---------- the Matterhorn: a leaning, hooked pyramid ----------
MX, MY = 0.0, 0.55


def square(cx, cy, r, z, rot):
    return [(cx + r * math.cos(rot + math.pi / 2 * j + math.pi / 4), cy + r * math.sin(rot + math.pi / 2 * j + math.pi / 4), G + z) for j in range(4)]


LEVELS = ((0.62, 0.0, 0.0, -0.01), (0.5, 0.02, 0.0, 0.25), (0.36, 0.05, 0.02, 0.55), (0.22, 0.08, 0.03, 0.85), (0.1, 0.1, 0.03, 1.08), (0.03, 0.06, 0.03, 1.2))
ROT = 1.13  # a ridge (the Hörnli) towards the camera once the scene is turned
rings = [square(MX + dx, MY + dy, r, z, ROT) for r, dx, dy, z in LEVELS]
mtn = loft('matterhorn', M['rock'], rings, outline=0.016)
mtn.visible_shadow = False
snow_rings = [square(MX + dx, MY + dy, r * 1.04, z, ROT) for r, dx, dy, z in LEVELS[2:5]] + [square(MX + 0.06, MY + 0.03, 0.04, 1.22, ROT)]
sn = loft('snowcap', M['snow'], snow_rings, outline=0.01)
sn.visible_shadow = False
lathe('footslope', M['rockLight'], ((0.85, 0), (0.6, 0.08)), G - 0.012, MX, MY + 0.1, segs=24, outline=0.01)

# ---------- Zermatt's chalets and church ----------
for k, (x, y) in enumerate(((-0.75, -0.25), (-0.45, -0.45), (-0.15, -0.3), (0.2, -0.5), (0.5, -0.3), (0.8, -0.45), (-0.6, -0.7), (0.05, -0.8), (0.55, -0.78))):
    box(f'chaletbase{k}', M['stone'], x, y, G - 0.005, 0.18, 0.15, 0.05, outline=0.006, bevel=0)
    box(f'chalet{k}', M['wood'], x, y, G + 0.045, 0.18, 0.15, 0.1, outline=0.006, bevel=0)
    box(f'balcony{k}', M['wood'], x, y - 0.085, G + 0.08, 0.18, 0.03, 0.012, outline=0.002, bevel=0)
    for j in range(3):
        ball(f'geranium{k}{j}', M['geranium'], x - 0.06 + j * 0.06, y - 0.1, G + 0.1, 0.014, outline=0)
    box(f'chaletwin{k}', M['window'], x, y - 0.077, G + 0.1, 0.05, 0.006, 0.035, outline=0, bevel=0)
    loft(f'chaletroof{k}', M['slate'], [[(x - 0.11, y - 0.1, G + 0.14), (x + 0.11, y - 0.1, G + 0.14), (x + 0.11, y + 0.1, G + 0.14), (x - 0.11, y + 0.1, G + 0.14)],
                                        [(x - 0.004, y - 0.1, G + 0.22), (x + 0.004, y - 0.1, G + 0.22), (x + 0.004, y + 0.1, G + 0.22), (x - 0.004, y + 0.1, G + 0.22)]], outline=0.006)
box('church', M['stone'], 0.95, 0.05, G - 0.005, 0.16, 0.22, 0.14, outline=0.006, bevel=0)
box('churchtower', M['stone'], 0.95, -0.1, G - 0.005, 0.08, 0.08, 0.3, outline=0.006, bevel=0)
lathe('churchspire', M['slate'], ((0.055, 0), (0.004, 0.2)), G + 0.295, 0.95, -0.1, segs=8, outline=0.005, smooth=False)

# ---------- pines ----------
for k in range(10):
    x = rng.choice((-1, 1)) * rng.uniform(0.75, 1.1)
    y = rng.uniform(-0.1, 0.6)
    if math.hypot(x, y) > 1.2 or (x > 0.8 and y < 0.2):
        continue
    h = rng.uniform(0.22, 0.32)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.05), 0.012, segs=6, outline=0.003)
    lathe(f'pine{k}', M['pine'], ((0.06, 0), (0.04, h * 0.4), (0.004, h)), G + 0.04, x, y, segs=8, outline=0.006)

turn(before, -20)
render(G)
