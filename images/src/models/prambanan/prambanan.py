# A cartoon Prambanan for the country maps, built in the set's shared look (../toon.py): the Hindu
# temple compound near Yogyakarta, the tall pointed Shiva temple in the middle with its tiers of
# carved spires, the Brahma and Vishnu temples either side, the smaller shrines in front, on their
# stone platform, with palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P prambanan.py -- prambanan-1024.png 1024 prambanan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#8a8478', shadow_mul=(0.84, 0.84, 0.9)),
    'stoneLight': toon('stoneLight', '#a8a294', shadow_mul=(0.84, 0.84, 0.9)),
    'window': flat('window', '#2e2a28'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def candi(name, x, y, s):
    # a Javanese temple: a stepped base, the body with its door, then tiers studded with little spires
    box(f'{name}base', M['stoneLight'], x, y, G - 0.005, 0.32 * s, 0.32 * s, 0.06 * s, outline=0.008, bevel=0)
    box(f'{name}body', M['stone'], x, y, G + 0.055 * s, 0.22 * s, 0.22 * s, 0.16 * s, outline=0.008, bevel=0)
    box(f'{name}door', M['window'], x, y - 0.11 * s - 0.004, G + 0.07 * s, 0.05 * s, 0.006, 0.09 * s, outline=0, bevel=0)
    z = G + 0.21 * s
    for i in range(5):
        w = (0.2 - i * 0.035) * s
        box(f'{name}tier{i}', M['stone' if i % 2 else 'stoneLight'], x, y, z, w, w, 0.06 * s, outline=0.006, bevel=0)
        for k in range(4):
            a = math.pi / 4 + k * math.pi / 2
            lathe(f'{name}ratna{i}{k}', M['stoneLight'], ((0.016 * s, 0), (0.004, 0.05 * s)), z + 0.06 * s, x + w * 0.5 * math.cos(a), y + w * 0.5 * math.sin(a), segs=6,
                  outline=0.002)
        z += 0.06 * s
    lathe(f'{name}top', M['stoneLight'], ((0.04 * s, 0), (0.025 * s, 0.05 * s), (0.004, 0.12 * s)), z, x, y, segs=8, outline=0.004)


box('platform', M['stoneLight'], 0.0, 0.2, G - 0.005, 1.6, 0.9, 0.05, outline=0.01, bevel=0)
candi('shiva', 0.0, 0.3, 1.5)
candi('brahma', -0.55, 0.35, 1.0)
candi('vishnu', 0.55, 0.35, 1.0)
for k, x in enumerate((-0.45, 0.0, 0.45)):
    candi(f'vahana{k}', x, -0.15, 0.6)
for k, (x, y) in enumerate(((-1.0, -0.45), (1.0, -0.4), (-0.75, -0.75), (0.75, -0.75))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

turn(before, -20)
render(G)
