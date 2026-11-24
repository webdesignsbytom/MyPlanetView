# A cartoon Scott Monument for the country maps, built in the set's shared look (../toon.py):
# Edinburgh's great Victorian Gothic spire to Sir Walter Scott, blackened sandstone rising in tiers of
# pinnacles and flying buttresses from four arched legs, the white marble statue of Scott with his dog
# seated under the canopy, in Princes Street Gardens with its lawns, and the Castle Rock behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P scott-monument.py -- scott-monument-1024.png 1024 scott-monument.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'sandstone': toon('sandstone', '#7a6e60', shadow_mul=(0.86, 0.84, 0.88), lift=0.1),
    'sandstoneLight': toon('sandstoneLight', '#9a8e7a'),
    'marble': toon('marble', '#f6f4ee', lift=0.25),
    'path': toon('path', '#d8ccb4'),
    'rock': toon('rock', '#6a6a62', shadow_mul=(0.84, 0.84, 0.88)),
    'castle': toon('castle', '#a89c88', lift=0.1),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'dark': flat('dark', '#2a2622'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the Castle Rock behind ----------
rk = lathe('castlerock', M['rock'], ((0.42, 0), (0.35, 0.18), (0.25, 0.3), (0.0, 0.32)), G - 0.01, 0.3, 0.8, segs=12, outline=0.008, smooth=False)
rk.visible_shadow = False
box('castle', M['castle'], 0.3, 0.8, G + 0.28, 0.36, 0.2, 0.12, outline=0.005, bevel=0)
box('castlekeep', M['castle'], 0.22, 0.8, G + 0.28, 0.1, 0.1, 0.2, outline=0.004, bevel=0)
box('path', M['path'], 0, -0.4, G - 0.004, 1.6, 0.12, 0.01, outline=0.001, bevel=0)

# ---------- the monument ----------
MX, MY = -0.1, 0.05
S = 0.28        # the base's square
box('platform', M['sandstoneLight'], MX, MY, G - 0.005, S + 0.12, S + 0.12, 0.04, outline=0.004, bevel=0)
# the four arched legs round the canopy
LH = 0.3
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'leg{sx}{sy}', M['sandstone'], MX + sx * S / 2, MY + sy * S / 2, G + 0.035, 0.07, 0.07, LH, outline=0.005, bevel=0)
        lathe(f'legpinnacle{sx}{sy}', M['sandstone'], ((0.03, 0), (0.003, 0.14)), G + 0.035 + LH, MX + sx * (S / 2 + 0.03), MY + sy * (S / 2 + 0.03), segs=6, outline=0.002, smooth=False)
for face in range(4):
    a = face * math.pi / 2
    nx, ny = round(math.cos(a)), round(math.sin(a))
    box(f'archtop{face}', M['sandstone'], MX + nx * S / 2, MY + ny * S / 2, G + 0.035 + LH - 0.07, 0.07 if nx else S, S if nx else 0.07, 0.07, outline=0.004, bevel=0)
    pyramid(f'gable{face}', M['sandstone'], MX + nx * S / 2, MY + ny * S / 2, G + 0.035 + LH, 0.12, 0.12, outline=0.003)
# Scott and his dog Maida, in white marble under the canopy
box('statueplinth', M['marble'], MX, MY, G + 0.035, 0.09, 0.09, 0.06, outline=0.002, bevel=0)
rod('scott', M['marble'], (MX, MY, G + 0.09), (MX, MY, G + 0.17), 0.032, r2=0.022, segs=10, outline=0.003)
ball('scotthead', M['marble'], MX, MY - 0.005, G + 0.19, 0.016, outline=0.002)
dog = ball('maida', M['marble'], 0, 0, 0, 0.02, outline=0.002)
dog.scale = (1.5, 0.8, 0.8)
dog.location = (MX + 0.04, MY - 0.04, G + 0.105)
# the spire: tiers of open stages narrowing upwards, each with its corner pinnacles and buttresses
Z = G + 0.035 + LH
w = S - 0.02
for k in range(5):
    h = 0.14 - k * 0.012
    box(f'stage{k}', M['sandstone'], MX, MY, Z, w, w, h, outline=0.005, bevel=0)
    for face in range(2):
        nx, ny = (0, -1) if face == 0 else (-1, 0)
        box(f'stagewin{k}{face}', M['dark'], MX + nx * (w / 2 + 0.003), MY + ny * (w / 2 + 0.003), Z + h * 0.2, w * 0.3 if ny else 0.006, 0.006 if ny else w * 0.3, h * 0.6, outline=0, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            px, py = MX + sx * (w / 2 + 0.02), MY + sy * (w / 2 + 0.02)
            lathe(f'pinnacle{k}{sx}{sy}', M['sandstone'], ((0.016, 0), (0.014, h * 0.6), (0.003, h + 0.06)), Z, px, py, segs=6, outline=0.002, smooth=False)
            bar(f'flyer{k}{sx}{sy}', M['sandstoneLight'], (px, py, Z + h * 0.6), (MX + sx * w / 2, MY + sy * w / 2, Z + h * 0.9), 0.01, outline=0)
    Z += h
    w *= 0.8
lathe('spire', M['sandstone'], ((w / 2 * 1.2, 0), (0.003, 0.24)), Z, MX, MY, segs=8, outline=0.004, smooth=False)

# ---------- the gardens' trees ----------
for k, (x, y) in enumerate(((-0.7, -0.15), (0.55, -0.1), (-0.75, 0.5), (-0.4, -0.75), (0.45, -0.75), (0.85, 0.3))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.14, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
