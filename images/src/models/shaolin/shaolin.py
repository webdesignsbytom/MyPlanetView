# A cartoon Shaolin Temple for the country maps, built in the set's shared look (../toon.py): the
# temple at the foot of Mount Song, the red-walled mountain gate under its grey tiled roof with the
# black name board, the halls rising behind it, and the Pagoda Forest of stone and brick pagodas,
# tall and short, round the monks' graves, with pines and the mountain behind. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P shaolin.py -- shaolin-1024.png 1024 shaolin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b080', shadow_mul=(0.8, 0.8, 0.82), lift=0.2),
    'mountain': toon('mountain', '#6a8a5a', shadow_mul=(0.76, 0.8, 0.82)),
    'red': toon('red', '#a8382a'),
    'tile': toon('tile', '#4a4e56'),
    'board': flat('board', '#2a2a30'),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'stone': toon('stone', '#b8ae9c', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'brick': toon('brick', '#a8907a'),
    'dark': flat('dark', '#2e2a28'),
    'pine': toon('pine', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(2429)

for k, (x, y, r, h) in enumerate(((-0.55, 0.9, 0.38, 0.36), (0.15, 1.0, 0.32, 0.44), (0.72, 0.82, 0.32, 0.3))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.65, h * 0.6), (r * 0.25, h * 0.92), (0.004, h)), G - 0.01, x, y, segs=18, outline=0.008)
    mt.visible_shadow = False


def hall(name, x, y, w, d, h, rise=0.09):
    box(name, M['red'], x, y, G - 0.005, w, d, h, outline=0.006, bevel=0)
    loft(f'{name}roof', M['tile'], [[(x - w / 2 - 0.04, y - d / 2 - 0.04, G + h - 0.005), (x + w / 2 + 0.04, y - d / 2 - 0.04, G + h - 0.005), (x + w / 2 + 0.04, y + d / 2 + 0.04, G + h - 0.005), (x - w / 2 - 0.04, y + d / 2 + 0.04, G + h - 0.005)],
                                    [(x - w * 0.36, y - 0.01, G + h + rise), (x + w * 0.36, y - 0.01, G + h + rise), (x + w * 0.36, y + 0.01, G + h + rise), (x - w * 0.36, y + 0.01, G + h + rise)]], outline=0.005)
    for sx in (-1, 1):
        bar(f'{name}ridgeend{sx}', M['tile'], (x + sx * w * 0.36, y, G + h + rise), (x + sx * w * 0.4, y, G + h + rise + 0.04), 0.018, outline=0.002)
        bar(f'{name}eavetip{sx}', M['tile'], (x + sx * (w / 2 + 0.03), y - d / 2 - 0.03, G + h), (x + sx * (w / 2 + 0.07), y - d / 2 - 0.07, G + h + 0.04), 0.014, outline=0.001)


# ---------- the mountain gate ----------
GX, GY = -0.3, -0.25
hall('gate', GX, GY, 0.36, 0.16, 0.15)
box('gatedoor', M['dark'], GX, GY - 0.083, G - 0.005, 0.07, 0.006, 0.1, outline=0, bevel=0)
box('board', M['board'], GX, GY - 0.084, G + 0.11, 0.1, 0.006, 0.03, outline=0, bevel=0)
box('boardtext', M['gold'], GX, GY - 0.088, G + 0.117, 0.07, 0.004, 0.016, outline=0, bevel=0)
for s in (-1, 1):
    box(f'wall{s}', M['red'], GX + s * 0.32, GY + 0.02, G - 0.005, 0.3, 0.05, 0.09, outline=0.004, bevel=0)
    box(f'wallcap{s}', M['tile'], GX + s * 0.32, GY + 0.02, G + 0.085, 0.32, 0.08, 0.02, outline=0.002, bevel=0)
    lathe(f'lion{s}', M['stone'], ((0.03, 0), (0.025, 0.05), (0.02, 0.07)), G - 0.005, GX + s * 0.12, GY - 0.15, segs=8, outline=0.002)
hall('hall1', GX, 0.15, 0.4, 0.2, 0.17, 0.1)
hall('hall2', GX + 0.02, 0.5, 0.36, 0.18, 0.15, 0.09)

# ---------- the Pagoda Forest ----------
spots = [(0.28, -0.5), (0.45, -0.38), (0.62, -0.5), (0.8, -0.3), (0.3, -0.15), (0.52, -0.08), (0.75, 0.05), (0.35, 0.25), (0.58, 0.32), (0.85, 0.35), (0.2, 0.55)]
for k, (x, y) in enumerate(spots):
    tiers = rng.choice((3, 4, 5, 7))
    w = rng.uniform(0.07, 0.1)
    mat = M['stone'] if k % 2 else M['brick']
    z = G - 0.005
    box(f'pbase{k}', mat, x, y, z, w * 1.3, w * 1.3, 0.04, outline=0.003, bevel=0)
    z += 0.04
    for i in range(tiers):
        h = 0.07 if i == 0 else 0.035
        lathe(f'ptier{k}{i}', mat, ((w / 2, 0), (w / 2, h)), z, x, y, segs=6, outline=0.003, smooth=False)
        lathe(f'peave{k}{i}', mat, ((w / 2 + 0.012, 0), (w / 2, 0.012)), z + h, x, y, segs=6, outline=0.002, smooth=False)
        z += h + 0.012
        w *= 0.9
    lathe(f'ptop{k}', mat, ((w / 2, 0), (0.004, 0.06)), z, x, y, segs=6, outline=0.002, smooth=False)
for k, (x, y) in enumerate(((-0.85, -0.2), (-0.8, 0.3), (0.95, -0.05), (-0.65, -0.6), (0.05, -0.75))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.014, segs=6, outline=0.002)
    lathe(f'pine{k}', M['pine'], ((0.09, 0), (0.05, 0.08), (0.004, 0.2)), G + 0.08, x, y, segs=10, outline=0.005, smooth=False)

turn(before, -20)
render(G)
