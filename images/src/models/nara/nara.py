# A cartoon Nara for the country maps, built in the set's shared look (../toon.py): Tōdai-ji's
# Daibutsuden, the great wooden hall of the Buddha, its two sweeping tiers of dark tiled roof with
# golden ridge horns and the curved gable over its door, the bronze lantern before it, cherry trees,
# and Nara Park's spotted deer on the lawn. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nara.py -- nara-1024.png 1024 nara.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'gravel': toon('gravel', '#e0d8c8', shadow_mul=(0.84, 0.82, 0.88), lift=0.15),
    'wood': toon('wood', '#8a4a2e', shadow_mul=(0.86, 0.8, 0.8)),
    'plaster': toon('plaster', '#f2ece0', lift=0.15),
    'roof': toon('roof', '#4a4a52', shadow_mul=(0.84, 0.84, 0.9)),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'bronze': toon('bronze', '#5a6a58'),
    'stone': toon('stone', '#b8b0a8'),
    'deer': toon('deer', '#b8784a'),
    'spot': flat('spot', '#f2e6d0'),
    'blossom': toon('blossom', '#f8c0d0', lift=0.25),
    'trunk': toon('trunk', '#5a4a40'),
    'window': flat('window', '#3a2a24'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(2213)

box('courtyard', M['gravel'], 0.0, 0.05, G - 0.004, 1.5, 0.95, 0.01, outline=0.004, bevel=0)
box('path', M['stone'], 0.0, -0.65, G - 0.004, 0.22, 0.55, 0.012, outline=0.003, bevel=0)

# ---------- the Daibutsuden ----------
HX, HY = 0.0, 0.3
box('hallbase', M['stone'], HX, HY, G - 0.005, 1.0, 0.62, 0.04, outline=0.006, bevel=0)
box('hall', M['plaster'], HX, HY, G + 0.035, 0.86, 0.5, 0.2, outline=0.01, bevel=0)
for j in range(8):
    box(f'post{j}', M['wood'], HX - 0.42 + j * 0.12, HY - 0.252, G + 0.035, 0.025, 0.006, 0.2, outline=0, bevel=0)
box('beam', M['wood'], HX, HY - 0.253, G + 0.19, 0.86, 0.006, 0.025, outline=0, bevel=0)
box('halldoor', M['window'], HX, HY - 0.254, G + 0.035, 0.16, 0.006, 0.14, outline=0, bevel=0)


def hip(name, z, w, d, h, ridge_w):
    loft(name, M['roof'], [[(HX - w / 2, HY - d / 2, z), (HX + w / 2, HY - d / 2, z), (HX + w / 2, HY + d / 2, z), (HX - w / 2, HY + d / 2, z)],
                           [(HX - ridge_w / 2, HY - 0.01, z + h), (HX + ridge_w / 2, HY - 0.01, z + h), (HX + ridge_w / 2, HY + 0.01, z + h), (HX - ridge_w / 2, HY + 0.01, z + h)]],
         outline=0.009)
    for s in (-1, 1):
        lathe(f'{name}horn{s}', M['gold'], ((0.025, 0), (0.012, 0.05), (0.004, 0.08)), z + h - 0.005, HX + s * ridge_w / 2, HY, segs=6, outline=0.003, smooth=False)


hip('roofLower', G + 0.23, 1.08, 0.72, 0.12, 0.6)
box('upperwall', M['plaster'], HX, HY, G + 0.33, 0.62, 0.34, 0.12, outline=0.008, bevel=0)
for j in range(5):
    box(f'upperpost{j}', M['wood'], HX - 0.28 + j * 0.14, HY - 0.172, G + 0.33, 0.02, 0.006, 0.12, outline=0, bevel=0)
hip('roofUpper', G + 0.44, 0.84, 0.52, 0.2, 0.52)
arch = [(HX + 0.14 * math.cos(math.pi * j / 10), HY - 0.27, G + 0.45 + 0.08 * math.sin(math.pi * j / 10)) for j in range(11)]
loft('karahafu', M['roof'], [arch, [(x, HY - 0.2, z + 0.02) for x, _, z in arch]], outline=0.006)
box('karahafuface', M['gold'], HX, HY - 0.272, G + 0.455, 0.2, 0.006, 0.04, outline=0, bevel=0)

# ---------- the bronze lantern ----------
LX, LY = 0.0, -0.25
lathe('lanternbase', M['bronze'], ((0.05, 0), (0.035, 0.03), (0.02, 0.14)), G - 0.005, LX, LY, segs=8, outline=0.004, smooth=False)
lathe('lanternbox', M['bronze'], ((0.045, 0), (0.045, 0.07)), G + 0.135, LX, LY, segs=8, outline=0.004, smooth=False)
lathe('lanternroof', M['bronze'], ((0.07, 0), (0.004, 0.06)), G + 0.205, LX, LY, segs=8, outline=0.004, smooth=False)

# ---------- cherry trees and deer ----------
for k, (x, y) in enumerate(((-0.9, -0.25), (0.9, -0.2), (-0.85, 0.55), (0.88, 0.55))):
    rod(f'cherrytrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.016, segs=6, outline=0.003)
    for j in range(3):
        ball(f'blossom{k}{j}', M['blossom'], x + 0.06 * math.cos(j * 2.1), y + 0.06 * math.sin(j * 2.1), G + 0.17 + 0.02 * j, 0.075, outline=0.008)


def deer(name, x, y, a):
    ca, sa = math.cos(a), math.sin(a)
    for fx in (-0.035, 0.035):
        for s in (-1, 1):
            px, py = x + fx * ca - s * 0.018 * sa, y + fx * sa + s * 0.018 * ca
            rod(f'{name}leg{fx}{s}', M['deer'], (px, py, G), (px, py, G + 0.07), 0.007, segs=5, outline=0.002)
    b = ball(f'{name}body', M['deer'], 0, 0, 0, 0.04, outline=0.005)
    b.scale = (1.45, 0.75, 0.75)
    b.rotation_euler = (0, 0, a)
    b.location = (x, y, G + 0.09)
    for j in range(3):
        ball(f'{name}spot{j}', M['spot'], x - 0.02 * ca + j * 0.02 * ca, y - 0.02 * sa + j * 0.02 * sa - 0.028, G + 0.1, 0.007, outline=0)
    hx, hy = x + 0.06 * ca, y + 0.06 * sa
    rod(f'{name}neck', M['deer'], (x + 0.04 * ca, y + 0.04 * sa, G + 0.1), (hx, hy, G + 0.15), 0.012, segs=6, outline=0.002)
    b = ball(f'{name}head', M['deer'], 0, 0, 0, 0.02, outline=0.003)
    b.scale = (1.5, 0.8, 0.85)
    b.rotation_euler = (0, 0, a)
    b.location = (hx + 0.01 * ca, hy + 0.01 * sa, G + 0.155)


for k, (x, y, a) in enumerate(((-0.45, -0.45, 0.4), (0.35, -0.5, 2.6), (-0.25, -0.75, 1.2), (0.55, -0.75, 2.2))):
    deer(f'deer{k}', x, y, a)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
