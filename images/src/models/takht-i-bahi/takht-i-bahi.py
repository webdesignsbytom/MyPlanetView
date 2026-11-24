# A cartoon Takht-i-Bahi for the country maps, built in the set's shared look (../toon.py): the
# Buddhist monastery of ancient Gandhara on its rocky hilltop in Khyber Pakhtunkhwa, the court of
# stupas with the square stepped base of the main stupa and its stair, the little votive stupas and
# the ring of chapels with their arched niches round it, and behind it the monks' court with its
# cells round the open square, all in the grey-brown stone of the hill. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P takht-i-bahi.py -- takht-i-bahi-1024.png 1024 takht-i-bahi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#a8a878', shadow_mul=(0.78, 0.78, 0.82), lift=0.18),
    'hill': toon('hill', '#9a8e72', shadow_mul=(0.8, 0.78, 0.84)),
    'stone': toon('stone', '#b8a88a', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'stoneDark': toon('stoneDark', '#968668'),
    'court': toon('court', '#ccbc9c', lift=0.15),
    'dark': flat('dark', '#2e2a24'),
    'shrub': toon('shrub', '#7a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(46)

# ---------- the hill ----------
hill = lathe('hill', M['hill'], ((1.25, 0), (1.05, 0.08), (0.82, 0.18), (0.7, 0.22), (0.0, 0.22)), G - 0.01, 0.0, 0.0, segs=40, outline=0.007)
hill.visible_shadow = False
T = G + 0.21

# ---------- the stupa court ----------
SX, SY, S = 0.0, -0.18, 0.28
box('stupacourt', M['court'], SX, SY, T - 0.005, 2 * S, 2 * S, 0.012, outline=0.001, bevel=0)
for k, (x, y, sx, sy, face) in enumerate(((SX, SY + S, 2 * S + 0.08, 0.08, 'y'), (SX - S, SY, 0.08, 2 * S, '-x'), (SX + S, SY, 0.08, 2 * S, 'x'))):
    box(f'chapels{k}', M['stone'], x, y, T - 0.005, sx, sy, 0.1, outline=0.004, bevel=0)
    for j in range(5):
        t = -S + 0.06 + j * (2 * S - 0.12) / 4
        if face == 'y':
            box(f'niche{k}{j}', M['dark'], x + t, y - 0.044, T + 0.02, 0.035, 0.006, 0.05, outline=0, bevel=0)
        else:
            box(f'niche{k}{j}', M['dark'], x + (0.044 if face == '-x' else -0.044), y + t, T + 0.02, 0.006, 0.035, 0.05, outline=0, bevel=0)
# the main stupa's stepped base and stair
for i, (w, h) in enumerate(((0.22, 0.06), (0.17, 0.06))):
    box(f'stupabase{i}', M['stoneDark'], SX, SY + 0.04, T - 0.005 + i * 0.06, w, w, h, outline=0.004, bevel=0)
for i in range(4):
    box(f'stupastair{i}', M['stone'], SX, SY + 0.04 - 0.11 - 0.015 - i * 0.025, T - 0.005, 0.05, 0.025, 0.1 - i * 0.025, outline=0.001, bevel=0)
lathe('stupadrum', M['stone'], ((0.06, 0), (0.06, 0.03), (0.05, 0.05)), T + 0.115, SX, SY + 0.04, segs=16, outline=0.003)
# the little votive stupas
for k, (x, y) in enumerate(((-0.17, -0.34), (0.17, -0.34), (-0.18, -0.02), (0.18, -0.02), (-0.08, -0.38), (0.08, -0.38))):
    box(f'votive{k}', M['stoneDark'], SX + x, y, T - 0.005, 0.06, 0.06, 0.04, outline=0.002, bevel=0)
    lathe(f'votivedome{k}', M['stone'], ((0.022, 0), (0.018, 0.015), (0.0, 0.025)), T + 0.035, SX + x, y, segs=10, outline=0.002)

# ---------- the monastery court behind ----------
MX, MY = 0.0, 0.42
box('monkcourt', M['court'], MX, MY, T - 0.005, 0.56, 0.36, 0.012, outline=0.001, bevel=0)
for k, (x, y, sx, sy) in enumerate(((MX, MY + 0.2, 0.64, 0.08), (MX - 0.3, MY, 0.08, 0.4), (MX + 0.3, MY, 0.08, 0.4))):
    box(f'cells{k}', M['stone'], x, y, T - 0.005, sx, sy, 0.12 - 0.02 * rng.random(), outline=0.004, bevel=0)
for j in range(6):
    box(f'celldoor{j}', M['dark'], MX - 0.25 + j * 0.1, MY + 0.157, T + 0.01, 0.03, 0.006, 0.05, outline=0, bevel=0)
lathe('tank', M['stoneDark'], ((0.06, 0), (0.06, 0.02)), T - 0.005, MX + 0.1, MY - 0.02, segs=4, outline=0.002, smooth=False)

for k in range(9):
    a = 2 * math.pi * k / 9 + 0.2
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.005)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (0.98 * math.cos(a), 0.98 * math.sin(a), G + 0.09)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
