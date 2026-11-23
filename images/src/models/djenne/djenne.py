# A cartoon Great Mosque of Djenné for the country maps, built in the set's shared look
# (../toon.py): the world's largest mud-brick building, its smooth adobe walls ribbed with
# buttresses, the three tall towers of its front each crowned with an ostrich-egg pinnacle, the
# palm-wood torons bristling from its walls, the raised platform, and the Monday market in front.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P djenne.py -- djenne-1024.png 1024 djenne.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#d8b088', shadow_mul=(0.86, 0.78, 0.72), lift=0.2),
    'adobe': toon('adobe', '#c88a5a', shadow_mul=(0.86, 0.76, 0.72), lift=0.1),
    'adobeDark': toon('adobeDark', '#b07448', shadow_mul=(0.86, 0.76, 0.72)),
    'toron': toon('toron', '#6a4a36'),
    'egg': toon('egg', '#f4efe4', lift=0.2),
    'window': flat('window', '#3a2a24'),
    'stall': toon('stall', '#e8a030'),
    'cloth0': toon('cloth0', '#2f6fc0'), 'cloth1': toon('cloth1', '#e8402c'), 'cloth2': toon('cloth2', '#3f9a4a'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(1801)

# ---------- the platform and the mosque ----------
box('platform', M['adobeDark'], 0.0, 0.25, G - 0.005, 1.3, 0.7, 0.06, outline=0.012, bevel=0)
T = G + 0.055
MX, MY = 0.0, 0.3
loft('mosque', M['adobe'], [[(MX - 0.55, MY - 0.25, T - 0.005), (MX + 0.55, MY - 0.25, T - 0.005), (MX + 0.55, MY + 0.28, T - 0.005), (MX - 0.55, MY + 0.28, T - 0.005)],
                            [(MX - 0.53, MY - 0.23, T + 0.22), (MX + 0.53, MY - 0.23, T + 0.22), (MX + 0.53, MY + 0.26, T + 0.22), (MX - 0.53, MY + 0.26, T + 0.22)]],
     outline=0.014)
for j in range(14):
    x = MX - 0.52 + j * 0.08
    lathe(f'buttress{j}', M['adobe'], ((0.025, 0), (0.022, 0.24), (0.004, 0.3)), T - 0.005, x, MY - 0.255, segs=6, outline=0.004)
for row in range(3):
    for j in range(13):
        x = MX - 0.48 + j * 0.08
        bar(f'toron{row}{j}', M['toron'], (x, MY - 0.24, T + 0.05 + row * 0.07), (x, MY - 0.29, T + 0.05 + row * 0.07), 0.01, outline=0)
# the three towers
for k, (x, h) in enumerate(((MX - 0.25, 0.42), (MX, 0.48), (MX + 0.25, 0.42))):
    loft(f'tower{k}', M['adobe'], [[(x - 0.075, MY - 0.27, T - 0.005), (x + 0.075, MY - 0.27, T - 0.005), (x + 0.075, MY - 0.15, T - 0.005), (x - 0.075, MY - 0.15, T - 0.005)],
                                   [(x - 0.05, MY - 0.25, T + h), (x + 0.05, MY - 0.25, T + h), (x + 0.05, MY - 0.17, T + h), (x - 0.05, MY - 0.17, T + h)]], outline=0.01)
    lathe(f'pinnacle{k}', M['adobe'], ((0.03, 0), (0.02, 0.05), (0.004, 0.08)), T + h, x, MY - 0.21, segs=8, outline=0.004)
    ball(f'egg{k}', M['egg'], x, MY - 0.21, T + h + 0.09, 0.018, outline=0.003)
    for row in range(4):
        bar(f'towertoron{k}{row}', M['toron'], (x, MY - 0.27, T + 0.12 + row * 0.07), (x, MY - 0.32, T + 0.12 + row * 0.07), 0.01, outline=0)
    for s in (-1, 1):
        lathe(f'towerside{k}{s}', M['adobe'], ((0.018, 0), (0.016, h - 0.06), (0.004, h)), T - 0.005, x + s * 0.065, MY - 0.27, segs=6, outline=0.003)
box('door', M['window'], MX, MY - 0.271, T, 0.06, 0.006, 0.1, outline=0, bevel=0)

# ---------- the Monday market ----------
for k in range(8):
    x = -0.85 + k * 0.24
    y = -0.6 + 0.05 * (k % 2)
    if math.hypot(x, y) > 1.2:
        continue
    for u in (-0.05, 0.05):
        rod(f'stallpost{k}{u}', M['toron'], (x + u, y, G), (x + u, y, G + 0.1), 0.004, segs=4, outline=0)
    box(f'stall{k}', M['stall'], x, y, G + 0.1, 0.14, 0.1, 0.01, outline=0.003, bevel=0)
    box(f'cloth{k}', M[f'cloth{k % 3}'], x, y, G - 0.004, 0.1, 0.07, 0.02, outline=0.002, bevel=0)

turn(before, -20)
render(G)
