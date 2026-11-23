# A cartoon Puerto Princesa Underground River for the country maps, built in the set's shared look
# (../toon.py): the dark mouth of the river cave in the jungle-topped limestone cliff, the river
# running out of it into the turquoise lagoon, an outrigger banca with its passengers heading in,
# the white beach, and a macaque on a rock. Turned a little towards the camera.
# Run: blender -b --factory-startup -P underground-river.py -- underground-river-1024.png 1024 underground-river.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#2ebcc0', shadow_mul=(0.74, 0.86, 0.88), lift=0.35),
    'sand': toon('sand', '#f2e8d0', lift=0.2),
    'limestone': toon('limestone', '#9a948a', shadow_mul=(0.84, 0.84, 0.9)),
    'limestoneDark': toon('limestoneDark', '#7a746c', shadow_mul=(0.84, 0.84, 0.9)),
    'cave': flat('cave', '#1e1c22'),
    'jungle': toon('jungle', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'jungleLight': toon('jungleLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'banca': toon('banca', '#f6f3ec', lift=0.2),
    'bancaBlue': toon('bancaBlue', '#2f6fc0'),
    'vest': toon('vest', '#f08a2a', lift=0.25),
    'macaque': toon('macaque', '#8a7050'),
})

G = tile(M['lagoon'])
before = set(bpy.data.objects)
rng = random.Random(1931)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the cliff and the jungle on top ----------
cl = loft('cliff', M['limestone'], [segment(0.1, 1.4, -0.01), segment(0.14, 1.39, 0.5)], outline=0.018)
cl.visible_shadow = False
top = loft('jungletop', M['jungle'], [segment(0.14, 1.39, 0.495), segment(0.3, 1.32, 0.6), segment(0.55, 1.2, 0.66)], outline=0.012, smooth=True)
top.visible_shadow = False
for k in range(12):
    x = -1.15 + k * 0.21
    ball(f'canopy{k}', M['jungle' if k % 2 else 'jungleLight'], x, 0.28 + 0.05 * math.sin(k), G + 0.58, rng.uniform(0.08, 0.1), outline=0.011)
for k in range(5):
    x = -0.9 + k * 0.42
    bar(f'streak{k}', M['limestoneDark'], (x, 0.095, G + 0.05), (x + 0.03, 0.135, G + 0.46), 0.05, outline=0)
# the cave mouth: a dark arch in the cliff face
CX = 0.05
box('cavemouth', M['cave'], CX, 0.09, G - 0.005, 0.32, 0.01, 0.2, outline=0, bevel=0)
for j in range(7):
    um = (j + 0.5) / 7
    z = G + 0.2 + 0.08 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
    box(f'cavearch{j}', M['cave'], CX - 0.16 + 0.32 * um, 0.09, G + 0.19, 0.047, 0.01, z - G - 0.19, outline=0, bevel=0)
for j in range(4):
    lathe(f'stalactite{j}', M['limestoneDark'], ((0.015, 0), (0.004, -0.06)), G + 0.26, CX - 0.1 + j * 0.065, 0.082, segs=5, outline=0.002)

# ---------- the beach either side, a macaque ----------
for s in (-1, 1):
    box(f'beach{s}', M['sand'], s * 0.7, -0.02, G - 0.004, 0.6, 0.18, 0.02, outline=0.005, bevel=0)
ball('macaquerock', M['limestone'], -0.85, -0.15, G + 0.03, 0.07, outline=0.008)
b = ball('macaque', M['macaque'], 0, 0, 0, 0.03, outline=0.004)
b.scale = (1.0, 0.9, 1.2)
b.location = (-0.85, -0.15, G + 0.12)
ball('macaquehead', M['macaque'], -0.84, -0.17, G + 0.17, 0.02, outline=0.003)

# ---------- the banca heading in ----------
BX, BY = 0.1, -0.45
loft('banca', M['banca'], [[(BX, BY - 0.2, G), (BX + 0.04, BY, G), (BX, BY + 0.2, G), (BX - 0.04, BY, G)],
                           [(BX, BY - 0.24, G + 0.05), (BX + 0.055, BY, G + 0.045), (BX, BY + 0.24, G + 0.05), (BX - 0.055, BY, G + 0.045)]], outline=0.007)
for s in (-1, 1):
    rod(f'outrigger{s}', M['bancaBlue'], (BX + s * 0.18, BY - 0.15, G + 0.01), (BX + s * 0.18, BY + 0.15, G + 0.01), 0.01, segs=6, outline=0.002)
    for v in (-0.08, 0.08):
        bar(f'boom{s}{v}', M['bancaBlue'], (BX, BY + v, G + 0.045), (BX + s * 0.18, BY + v, G + 0.015), 0.008, outline=0)
for k in range(3):
    ball(f'passenger{k}', M['vest'], BX, BY - 0.1 + k * 0.08, G + 0.07, 0.02, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
