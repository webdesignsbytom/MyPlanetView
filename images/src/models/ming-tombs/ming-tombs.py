# A cartoon Ming Tombs for the country maps, built in the set's shared look (../toon.py): the Sacred
# Way leading to the tombs north of Beijing, lined on both sides with great stone statues of animals
# (elephants, camels, lions, horses) and officials, and at its end the Changling tomb's red hall of
# Ling'en with its yellow double roof on its white terrace, the walled mound behind among the hills.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P ming-tombs.py -- ming-tombs-1024.png 1024 ming-tombs.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#9ac06a', shadow_mul=(0.74, 0.8, 0.76), lift=0.2),
    'path': toon('path', '#d4ccbc', lift=0.15),
    'stone': toon('stone', '#c8c0b0', shadow_mul=(0.84, 0.84, 0.9), lift=0.12),
    'marble': toon('marble', '#f2f0ea', lift=0.2),
    'red': toon('red', '#b8372e', shadow_mul=(0.86, 0.76, 0.76), lift=0.08),
    'yellow': toon('yellow', '#e8b030', shadow_mul=(0.86, 0.78, 0.66), lift=0.15),
    'green': toon('green', '#3a8a7a'),
    'hill': toon('hill', '#6a9a4a', shadow_mul=(0.72, 0.8, 0.76)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the hills behind and the tomb mound ----------
for k, (x, y, r, h) in enumerate(((-0.6, 0.78, 0.32, 0.34), (0.55, 0.8, 0.34, 0.3))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.7, h * 0.6), (r * 0.3, h * 0.92), (0.004, h)), G - 0.01, x, y, segs=18, outline=0.008)
    hl.visible_shadow = False
lathe('mound', M['tree'], ((0.3, 0), (0.28, 0.08), (0.18, 0.15), (0.004, 0.18)), G - 0.005, 0, 0.85, segs=24, outline=0.006)

# ---------- the hall of Ling'en ----------
HX, HY = 0.0, 0.42
box('terrace', M['marble'], HX, HY, G - 0.005, 0.6, 0.34, 0.05, outline=0.004, bevel=0)
box('hall', M['red'], HX, HY, G + 0.045, 0.48, 0.24, 0.13, outline=0.006, bevel=0)
for j in range(7):
    box(f'halldoor{j}', M['yellow'], HX - 0.2 + j * 0.067, HY - 0.123, G + 0.055, 0.045, 0.006, 0.09, outline=0, bevel=0)
box('hallbrackets', M['green'], HX, HY, G + 0.175, 0.5, 0.26, 0.02, outline=0.002, bevel=0)
for k, (w, d, z, h) in enumerate(((0.62, 0.36, G + 0.195, 0.06), (0.5, 0.26, G + 0.27, 0.11))):
    if k:
        box('hallupper', M['red'], HX, HY, z - 0.03, w - 0.08, d - 0.06, 0.04, outline=0.002, bevel=0)
    loft(f'hallroof{k}', M['yellow'], [[(HX - w / 2, HY - d / 2, z), (HX + w / 2, HY - d / 2, z), (HX + w / 2, HY + d / 2, z), (HX - w / 2, HY + d / 2, z)],
                                        [(HX - w * 0.3, HY - 0.008, z + h), (HX + w * 0.3, HY - 0.008, z + h), (HX + w * 0.3, HY + 0.008, z + h), (HX - w * 0.3, HY + 0.008, z + h)]], outline=0.005)

# ---------- the Sacred Way and its statues ----------
box('sacredway', M['path'], 0, -0.4, G - 0.004, 0.2, 1.1, 0.01, outline=0.001, bevel=0)


def animal(name, x, y, kind):
    box(f'{name}plinth', M['stone'], x, y, G - 0.005, 0.1, 0.14, 0.025, outline=0.002, bevel=0)
    Z = G + 0.02
    if kind == 'elephant':
        body = ball(name, M['stone'], 0, 0, 0, 0.05, outline=0.004)
        body.scale = (0.9, 1.3, 0.85)
        body.location = (x, y, Z + 0.08)
        for fx in (-0.025, 0.025):
            for fy in (-0.03, 0.03):
                rod(f'{name}leg{fx}{fy}', M['stone'], (x + fx, y + fy, Z), (x + fx, y + fy, Z + 0.06), 0.014, segs=6, outline=0.001)
        bar(f'{name}trunk', M['stone'], (x, y - 0.06, Z + 0.09), (x, y - 0.075, Z + 0.02), 0.014, outline=0.001)
        ball(f'{name}head', M['stone'], x, y - 0.06, Z + 0.1, 0.03, outline=0.002)
    elif kind == 'camel':
        body = ball(name, M['stone'], 0, 0, 0, 0.04, outline=0.004)
        body.scale = (0.7, 1.4, 0.7)
        body.location = (x, y, Z + 0.09)
        ball(f'{name}hump', M['stone'], x, y, Z + 0.12, 0.022, outline=0.002)
        bar(f'{name}neck', M['stone'], (x, y - 0.05, Z + 0.09), (x, y - 0.07, Z + 0.14), 0.016, outline=0.001)
        ball(f'{name}head', M['stone'], x, y - 0.075, Z + 0.15, 0.015, outline=0.001)
        for fy in (-0.035, 0.035):
            rod(f'{name}leg{fy}', M['stone'], (x, y + fy, Z), (x, y + fy, Z + 0.07), 0.01, segs=6, outline=0.001)
    else:
        # an official: a tall robed figure with his tablet
        rod(name, M['stone'], (x, y, Z), (x, y, Z + 0.14), 0.026, r2=0.02, segs=8, outline=0.003)
        ball(f'{name}head', M['stone'], x, y, Z + 0.16, 0.018, outline=0.002)
        box(f'{name}hat', M['stone'], x, y, Z + 0.17, 0.03, 0.03, 0.02, outline=0.001, bevel=0)


for s in (-1, 1):
    for k, (y, kind) in enumerate(((-0.85, 'elephant'), (-0.6, 'camel'), (-0.35, 'official'), (-0.1, 'official'))):
        animal(f'statue{s}{k}', s * 0.2, y, kind)
# the stone archway at the start of the way
for s in (-1, 1):
    rod(f'archpost{s}', M['marble'], (s * 0.13, -0.98, G), (s * 0.13, -0.98, G + 0.2), 0.014, segs=8, outline=0.002)
box('archbeam', M['marble'], 0, -0.98, G + 0.19, 0.32, 0.03, 0.03, outline=0.003, bevel=0)
loft('archroof', M['yellow'], [[(-0.18, -1.0, G + 0.22), (0.18, -1.0, G + 0.22), (0.18, -0.96, G + 0.22), (-0.18, -0.96, G + 0.22)],
                               [(-0.12, -0.981, G + 0.26), (0.12, -0.981, G + 0.26), (0.12, -0.979, G + 0.26), (-0.12, -0.979, G + 0.26)]], outline=0.003)
for k, (x, y) in enumerate(((-0.6, -0.3), (0.6, -0.3), (-0.75, 0.25), (0.75, 0.25), (-0.5, -0.8), (0.5, -0.8))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.12, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
