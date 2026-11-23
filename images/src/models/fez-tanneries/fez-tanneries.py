# A cartoon Chouara tannery for the country maps, built in the set's shared look (../toon.py): the
# honeycomb of round stone vats in the heart of Fez's medina, full of white lime and dyes in saffron,
# poppy red, indigo, henna and brown, a tanner at work among them, hides drying on the rooftops of
# the old houses round the yard, and the green-tiled roof of a mosque. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P fez-tanneries.py -- fez-tanneries-1024.png 1024 fez-tanneries.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#c8b89a', shadow_mul=(0.86, 0.82, 0.8), lift=0.2),
    'rim': toon('rim', '#d8c8aa', shadow_mul=(0.86, 0.82, 0.8)),
    'house': toon('house', '#e2d2b0', shadow_mul=(0.86, 0.82, 0.8)),
    'houseDark': toon('houseDark', '#c8b490', shadow_mul=(0.86, 0.82, 0.8)),
    'window': flat('window', '#3a3640'),
    'tile': toon('greenTile', '#2f8a5a'),
    'd0': toon('d0', '#f4f2ec', lift=0.2), 'd1': toon('d1', '#f0c030', lift=0.3), 'd2': toon('d2', '#c8302a'), 'd3': toon('d3', '#2f4a9a'), 'd4': toon('d4', '#b8703a'),
    'd5': toon('d5', '#8a5a3a'), 'd6': toon('d6', '#5aa04a'),
    'hide': toon('hide', '#e8c898'),
    'shirt': toon('shirt', '#f8f6f0', lift=0.2),
    'skin': toon('skin', '#9a6a4a'),
})

G = tile(M['stone'])
before = set(bpy.data.objects)
rng = random.Random(1789)

# ---------- the vats ----------
DYES = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd1', 'd0', 'd2', 'd4', 'd3']
k = 0
for i in range(5):
    for j in range(7):
        x = -0.6 + j * 0.2 + (0.1 if i % 2 else 0)
        y = -0.45 + i * 0.17
        if math.hypot(x, y) > 0.85:
            continue
        lathe(f'vat{k}', M['rim'], ((0.085, 0), (0.085, 0.05), (0.07, 0.05)), G - 0.005, x, y, segs=16, outline=0.006)
        lathe(f'dye{k}', M[DYES[k % len(DYES)]], ((0.07, 0), (0.07, 0.058)), G - 0.005, x, y, segs=16, outline=0.002)
        k += 1
TX, TY = 0.05, -0.1
rod('tanner', M['shirt'], (TX, TY, G + 0.03), (TX, TY, G + 0.12), 0.018, segs=8, outline=0.003)
ball('tannerhead', M['skin'], TX, TY, G + 0.14, 0.016, outline=0.003)

# ---------- the old houses round the yard, hides on the roofs ----------
for k2 in range(16):
    a = 2 * math.pi * k2 / 16
    x, y = 1.08 * math.cos(a), 1.05 * math.sin(a)
    if -0.9 < math.sin(a) < -0.5:
        continue
    h = rng.uniform(0.18, 0.3)
    box(f'house{k2}', M['house' if k2 % 2 else 'houseDark'], x, y, G - 0.005, 0.24, 0.22, h, rot_z=a + math.pi / 2, outline=0.01, bevel=0)
    for row in range(2):
        box(f'housewin{k2}{row}', M['window'], x - 0.112 * math.cos(a), y - 0.112 * math.sin(a), G + 0.06 + row * 0.08, 0.03, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0,
            bevel=0)
    for j in range(2):
        box(f'hide{k2}{j}', M['hide'], x + 0.04 * (j - 0.5) * math.sin(a), y - 0.04 * (j - 0.5) * math.cos(a), G + h - 0.002, 0.07, 0.05, 0.006, rot_z=a, outline=0.002, bevel=0)
MX, MY = 0.0, 1.05
box('mosque', M['house'], MX, MY, G - 0.005, 0.3, 0.2, 0.2, outline=0.01, bevel=0)
pyramid('mosqueroof', M['tile'], MX, MY, G + 0.195, 0.32, 0.08, outline=0.006)
box('mosqueminaret', M['house'], MX + 0.2, MY, G - 0.005, 0.08, 0.08, 0.38, outline=0.008, bevel=0)
pyramid('minaretroof', M['tile'], MX + 0.2, MY, G + 0.375, 0.09, 0.05, outline=0.004)

turn(before, -20)
render(G)
