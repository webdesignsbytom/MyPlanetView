# A cartoon Itsukushima Shrine for the country maps, built in the set's shared look (../toon.py):
# the great vermilion torii standing in the sea off Miyajima, its two main pillars braced by four
# smaller ones under the black curving top beam, the shrine's red halls and corridors on their
# stilts over the water, Mount Misen behind, and a deer on the shore. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P itsukushima.py -- itsukushima-1024.png 1024 itsukushima.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3a8aa8', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'shore': toon('shore', '#d8ccb0', lift=0.2),
    'misen': toon('misen', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'vermilion': toon('vermilion', '#e04a2a', shadow_mul=(0.86, 0.74, 0.72), lift=0.15),
    'black': toon('toriiBlack', '#2e2a30'),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'roof': toon('roof', '#5a5654', shadow_mul=(0.8, 0.8, 0.88)),
    'deer': toon('deer', '#b07a50'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1699)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the shore and Mount Misen behind ----------
shore = loft('shore', M['shore'], [segment(0.45, 1.41, -0.01), segment(0.47, 1.4, 0.03)], outline=0.008)
shore.visible_shadow = False
mt = loft('misen', M['misen'], [segment(0.6, 1.36, 0.02), segment(0.75, 1.22, 0.42), segment(0.9, 1.02, 0.55)], outline=0.016, smooth=True)
mt.visible_shadow = False
for k in range(10):
    x = -0.9 + k * 0.2
    y = math.sqrt(max(0.0, 1.2 ** 2 - x * x)) * 0.8
    if y < 0.75:
        continue
    ball(f'tree{k}', M['tree'], x, y, G + 0.42, 0.07, outline=0.01)

# ---------- the shrine's halls on stilts over the water ----------
SX, SY = 0.0, 0.3
for k, (x, y, w, d) in enumerate(((SX - 0.4, SY, 0.4, 0.06), (SX + 0.4, SY, 0.4, 0.06), (SX, SY + 0.02, 0.26, 0.18))):
    for u in (-w / 2 + 0.02, 0.0, w / 2 - 0.02):
        for v in (-d / 2 + 0.01, d / 2 - 0.01):
            rod(f'stilt{k}{u:.2f}{v:.2f}', M['vermilion'], (x + u, y + v, G - 0.01), (x + u, y + v, G + 0.05), 0.006, segs=5, outline=0.002)
    box(f'deck{k}', M['vermilion'], x, y, G + 0.045, w, d + 0.02, 0.015, outline=0.004, bevel=0)
    box(f'hall{k}', M['white'], x, y, G + 0.06, w - 0.02, d, 0.06, outline=0.005, bevel=0)
    for j in range(int(w / 0.05)):
        rod(f'hallpost{k}{j}', M['vermilion'], (x - w / 2 + 0.02 + j * 0.05, y - d / 2 - 0.004, G + 0.06), (x - w / 2 + 0.02 + j * 0.05, y - d / 2 - 0.004, G + 0.12), 0.006,
            segs=5, outline=0.002)
    loft(f'hallroof{k}', M['roof'], [[(x - w / 2 - 0.02, y - d / 2 - 0.03, G + 0.115), (x + w / 2 + 0.02, y - d / 2 - 0.03, G + 0.115), (x + w / 2 + 0.02, y + d / 2 + 0.03, G + 0.115),
                                      (x - w / 2 - 0.02, y + d / 2 + 0.03, G + 0.115)],
                                     [(x - w / 2 + 0.01, y - 0.004, G + 0.16), (x + w / 2 - 0.01, y - 0.004, G + 0.16), (x + w / 2 - 0.01, y + 0.004, G + 0.16),
                                      (x - w / 2 + 0.01, y + 0.004, G + 0.16)]], outline=0.006)

# ---------- the great torii in the sea ----------
TX, TY = 0.05, -0.45
W, H = 0.26, 0.52
for s in (-1, 1):
    x = TX + s * W
    rod(f'pillar{s}', M['vermilion'], (x, TY, G - 0.01), (x, TY, G + H), 0.032, r2=0.028, segs=12, outline=0.008)
    for v in (-1, 1):
        rod(f'brace{s}{v}', M['vermilion'], (x, TY + v * 0.1, G - 0.01), (x, TY + v * 0.1, G + H * 0.45), 0.016, segs=8, outline=0.004)
        bar(f'bracebeam{s}{v}', M['vermilion'], (x, TY + v * 0.1, G + H * 0.32), (x, TY, G + H * 0.32), 0.014, outline=0.002)
    lathe(f'pillarfoot{s}', M['black'], ((0.036, 0), (0.036, 0.03)), G - 0.01, x, TY, segs=12, outline=0.003)
bar('nuki', M['vermilion'], (TX - W - 0.08, TY, G + H * 0.75), (TX + W + 0.08, TY, G + H * 0.75), 0.032, outline=0.005)
box('gakuzuka', M['vermilion'], TX, TY, G + H * 0.77, 0.04, 0.03, H * 0.2, outline=0.003, bevel=0)
pts = [(TX + u, TY, G + H + 0.02 + 0.5 * u * u) for u in (-W - 0.15, -W, -0.1, 0.0, 0.1, W, W + 0.15)]
for j in range(len(pts) - 1):
    bar(f'shimaki{j}', M['vermilion'], (pts[j][0], TY, pts[j][2] - 0.035), (pts[j + 1][0], TY, pts[j + 1][2] - 0.035), 0.03, outline=0.004)
    bar(f'kasagi{j}', M['black'], pts[j], pts[j + 1], 0.04, outline=0.005)

# ---------- a deer on the shore ----------
DX, DY = -0.75, 0.55
for fx in (-0.03, 0.03):
    for side in (-1, 1):
        rod(f'deerleg{fx}{side}', M['deer'], (DX + fx, DY + side * 0.014, G + 0.03), (DX + fx, DY + side * 0.014, G + 0.09), 0.006, segs=5, outline=0.002)
b = ball('deerbody', M['deer'], 0, 0, 0, 0.03, outline=0.005)
b.scale = (1.5, 0.8, 0.8)
b.location = (DX, DY, G + 0.105)
rod('deerneck', M['deer'], (DX + 0.04, DY, G + 0.11), (DX + 0.06, DY, G + 0.16), 0.01, segs=6, outline=0.002)
ball('deerhead', M['deer'], DX + 0.07, DY, G + 0.165, 0.014, outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
