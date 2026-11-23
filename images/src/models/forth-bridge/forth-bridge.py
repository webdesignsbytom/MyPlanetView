# A cartoon Forth Bridge for the country maps, built in the set's shared look (../toon.py): the red
# steel cantilever railway bridge across the Firth of Forth, its three great double-diamond towers
# on their granite piers joined by suspended spans, a train crossing, and a boat on the water below.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P forth-bridge.py -- forth-bridge-1024.png 1024 forth-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'firth': toon('firth', '#3a7aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'steel': toon('steel', '#c8402c', shadow_mul=(0.86, 0.74, 0.72)),
    'granite': toon('granite', '#a8a29a', shadow_mul=(0.82, 0.82, 0.88)),
    'train': toon('train', '#5a6a8a'),
    'bank': toon('bank', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'boat': toon('boat', '#f6f3ec', lift=0.2),
})

G = tile(M['firth'])
before = set(bpy.data.objects)
DECK = G + 0.16


def bank(name, a0, a1, h):
    pts = [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in range(a0, a1 + 1, 5)]
    b = loft(name, M['bank'], [[(x, y, G - 0.01) for x, y in pts], [(x * 0.97, y * 0.97, G + h) for x, y in pts]], outline=0.014)
    b.visible_shadow = False


bank('bankleft', 140, 220, 0.16)
bank('bankright', -40, 40, 0.16)


# ---------- the three cantilever towers ----------
def cantilever(name, xc, half=0.27, top=0.62):
    for side in (-0.06, 0.06):
        for s in (-1, 1):
            post = (xc + s * 0.035, side)
            bar(f'{name}post{side}{s}', M['steel'], (post[0], side, G + 0.08), (post[0], side, G + top), 0.024, outline=0.004)
            end = (xc + s * half, side)
            bar(f'{name}top{side}{s}', M['steel'], (post[0], side, G + top), (end[0], side, DECK + 0.02), 0.022, outline=0.004)
            mid = (xc + s * half * 0.55, side, G + 0.09)
            bar(f'{name}bottomA{side}{s}', M['steel'], (post[0], side, G + 0.08), mid, 0.026, outline=0.004)
            bar(f'{name}bottomB{side}{s}', M['steel'], mid, (end[0], side, DECK), 0.024, outline=0.004)
            bar(f'{name}brace{side}{s}', M['steel'], (post[0], side, G + top * 0.55), mid, 0.014, outline=0.003)
            bar(f'{name}brace2{side}{s}', M['steel'], mid, (xc + s * half * 0.6, side, G + top * 0.55 - 0.08), 0.012, outline=0.003)
    for z in (G + 0.3, G + top - 0.02):
        bar(f'{name}cross{z:.2f}', M['steel'], (xc, -0.06, z), (xc, 0.06, z), 0.016, outline=0.003)
    box(f'{name}pier', M['granite'], xc, 0.0, G - 0.01, 0.16, 0.2, 0.09, outline=0.006, bevel=0)


for k, xc in enumerate((-0.72, 0.0, 0.72)):
    cantilever(f'tower{k}', xc)
box('deck', M['steel'], 0.0, 0.0, DECK - 0.01, 2.5, 0.1, 0.02, outline=0.005, bevel=0)
for k, x in enumerate((-0.36, 0.36)):
    for side in (-0.06, 0.06):
        bar(f'span{k}{side}', M['steel'], (x - 0.09, side, DECK + 0.02), (x + 0.09, side, DECK + 0.02), 0.016, outline=0.003)
for k in range(4):
    box(f'car{k}', M['train'], -0.45 + k * 0.17, 0.0, DECK + 0.01, 0.16, 0.06, 0.06, outline=0.005, bevel=0)

# ---------- a boat on the firth ----------
loft('boat', M['boat'], [[(0.25, -0.75, G), (0.45, -0.8, G), (0.52, -0.75, G), (0.45, -0.7, G)],
                         [(0.23, -0.75, G + 0.04), (0.45, -0.81, G + 0.04), (0.56, -0.75, G + 0.05), (0.45, -0.69, G + 0.04)]], outline=0.006)

turn(before, -20)
render(G)
