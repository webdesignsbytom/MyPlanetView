# A cartoon Hadrian's Wall for the country maps, built in the set's shared look (../toon.py): the
# Roman wall running along the top of the Whin Sill's crags, dipping through a gap and climbing
# again, a milecastle with its gate, Crag Lough below the cliffs, and sheep on the moor. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P hadrians-wall.py -- hadrians-wall-1024.png 1024 hadrians-wall.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'moor': toon('moor', '#8aa858', shadow_mul=(0.74, 0.8, 0.74), lift=0.2),
    'ridge': toon('ridge', '#7a9a50', shadow_mul=(0.74, 0.8, 0.74)),
    'crag': toon('crag', '#5e5a58', shadow_mul=(0.84, 0.84, 0.9)),
    'joint': flat('joint', '#3e3a3a'),
    'wallstone': toon('wallstone', '#e0d8c4', shadow_mul=(0.84, 0.84, 0.88), lift=0.15),
    'lough': toon('lough', '#4a7aa0', lift=0.3),
    'door': flat('door', '#2e2a28'),
    'wool': toon('wool', '#f2eee6', lift=0.2),
    'face': toon('face', '#3a3436'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['moor'])
before = set(bpy.data.objects)

# ---------- the ridge and its crags: a run of hump sections with a gap ----------
XS = [-1.25, -0.9, -0.55, -0.25, 0.0, 0.25, 0.55, 0.9, 1.25]
HS = [0.18, 0.3, 0.36, 0.28, 0.14, 0.3, 0.38, 0.3, 0.16]
Y = 0.25
top = []
for x, h in zip(XS, HS):
    r = math.sqrt(max(0.0, 1.36 ** 2 - x * x))
    top.append((x, h, min(0.62, r - Y - 0.02)))
for j in range(len(top) - 1):
    (x0, h0, d0), (x1, h1, d1) = top[j], top[j + 1]
    foot = [(x0, Y - 0.05), (x1, Y - 0.05), (x1, Y + d1), (x0, Y + d0)]
    crown = [(x0, Y, h0), (x1, Y, h1), (x1, Y + d1 * 0.7, h1 * 0.6), (x0, Y + d0 * 0.7, h0 * 0.6)]
    o = loft(f'ridge{j}', M['ridge'], [[(x, y, G - 0.01) for x, y in foot], [(x, y, G + z) for x, y, z in crown]], outline=0.01)
    o.visible_shadow = False
    cliff = loft(f'crag{j}', M['crag'], [[(x0, Y - 0.06, G - 0.01), (x1, Y - 0.06, G - 0.01), (x1, Y - 0.02, G - 0.01), (x0, Y - 0.02, G - 0.01)],
                                         [(x0, Y - 0.02, G + h0 - 0.01), (x1, Y - 0.02, G + h1 - 0.01), (x1, Y + 0.01, G + h1 - 0.01), (x0, Y + 0.01, G + h0 - 0.01)]], outline=0.008)
    cliff.visible_shadow = False
    for i in range(5):
        t = (i + 0.5) / 5
        x = x0 + (x1 - x0) * t
        hz = h0 + (h1 - h0) * t
        box(f'cragjoint{j}{i}', M['joint'], x, Y - 0.062, G + 0.02, 0.008, 0.004, hz - 0.04, outline=0, bevel=0)
# the wall along the crest
for j in range(len(top) - 1):
    (x0, h0, _), (x1, h1, _) = top[j], top[j + 1]
    for i in range(4):
        t0, t1 = i / 4, (i + 1) / 4
        xa, xb = x0 + (x1 - x0) * t0, x0 + (x1 - x0) * t1
        za, zb = h0 + (h1 - h0) * t0, h0 + (h1 - h0) * t1
        bar(f'wall{j}{i}', M['wallstone'], (xa, Y + 0.01, G + za + 0.04), (xb, Y + 0.01, G + zb + 0.04), 0.08, outline=0.005)

# ---------- the milecastle ----------
MX = 0.7
mz = 0.38 + (0.3 - 0.38) * (MX - 0.55) / 0.35
box('milecastle', M['wallstone'], MX, Y + 0.12, G + mz - 0.03, 0.22, 0.18, 0.07, outline=0.005, bevel=0)
box('milecastlegate', M['door'], MX, Y + 0.029, G + mz - 0.01, 0.05, 0.006, 0.05, outline=0, bevel=0)
box('milecastlein', M['ridge'], MX, Y + 0.13, G + mz + 0.02, 0.17, 0.13, 0.025, outline=0.002, bevel=0)

# ---------- Crag Lough, sheep, a lone tree in the gap ----------


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


loft('lough', M['lough'], [ring(-0.45, -0.15, 0.4, 0.17, -0.004, 1), ring(-0.45, -0.15, 0.4, 0.17, 0.006, 1)], outline=0.004, smooth=True)
ball('gaptree', M['tree'], 0.0, Y + 0.05, G + 0.22, 0.06, outline=0.006)
for k, (x, y) in enumerate(((0.2, -0.4), (0.45, -0.6), (-0.1, -0.65), (0.75, -0.3), (-0.75, -0.55))):
    b = ball(f'sheep{k}', M['wool'], 0, 0, 0, 0.035, outline=0.004)
    b.scale = (1.3, 0.9, 0.85)
    b.location = (x, y, G + 0.04)
    ball(f'sheephead{k}', M['face'], x + 0.045, y, G + 0.05, 0.015, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
