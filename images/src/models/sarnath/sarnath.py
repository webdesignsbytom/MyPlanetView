# A cartoon Sarnath for the country maps, built in the set's shared look (../toon.py): the deer park
# near Varanasi, India, where the Buddha first taught: the great Dhamek Stupa, its round drum of
# stone carved with a band of flowers and niches, the brick tower above it, the low brick ruins
# of the monasteries and the stump of Ashoka's pillar on the lawns, and a few trees. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P sarnath.py -- sarnath-1024.png 1024 sarnath.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#d2bc98', shadow_mul=(0.8, 0.78, 0.84), lift=0.16),
    'carve': toon('carve', '#b89e78'),
    'brick': toon('brick', '#b8705a', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'path': toon('path2', '#e2d4b4', lift=0.18),
    'dark': flat('dark', '#3a2a22'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(324394)

# ---------- the Dhamek Stupa ----------
SX, SY = -0.1, 0.2
lathe('stupabase', M['stone'], ((0.27, 0), (0.27, 0.2)), G - 0.005, SX, SY, segs=40, outline=0.007)
lathe('stupaband', M['carve'], ((0.275, 0), (0.275, 0.09)), G + 0.21, SX, SY, segs=40, outline=0.003)
lathe('stupaupper', M['stone'], ((0.265, 0), (0.265, 0.04)), G + 0.3, SX, SY, segs=40, outline=0.004)
lathe('stupatop', M['brick'], ((0.25, 0), (0.25, 0.14), (0.22, 0.2), (0.12, 0.24), (0.0, 0.25)), G + 0.34, SX, SY, segs=40, outline=0.007)
for k in range(8):
    a = -math.pi / 2 + (k - 3.5) * math.pi / 8
    x, y = SX + 0.272 * math.cos(a), SY + 0.272 * math.sin(a)
    m = Matrix.Translation((x, y, G + 0.22)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z')
    nb = box(f'niche{k}', M['dark'], 0, 0, 0, 0.045, 0.012, 0.07, outline=0, bevel=0)
    nb.matrix_world = m @ nb.matrix_world
lathe('plinth', M['path'], ((0.36, 0), (0.36, 0.012)), G - 0.006, SX, SY, segs=40, outline=0.001)

# ---------- the monastery ruins ----------
for m, (MX, MY, W, D) in enumerate(((0.55, -0.15, 0.42, 0.36), (-0.55, -0.45, 0.36, 0.3))):
    for k, (x, y, sx, sy) in enumerate(((MX, MY - D / 2, W, 0.04), (MX, MY + D / 2, W, 0.04), (MX - W / 2, MY, 0.04, D), (MX + W / 2, MY, 0.04, D))):
        box(f'mon{m}wall{k}', M['brick'], x, y, G - 0.005, sx, sy, 0.05 + 0.02 * rng.random(), outline=0.003, bevel=0)
    for k in range(4):
        t = -W / 2 + 0.06 + k * (W - 0.12) / 3
        box(f'mon{m}cell{k}', M['brick'], MX + t, MY - D / 2 + 0.05, G - 0.005, 0.025, 0.1, 0.04, outline=0.001, bevel=0)
        box(f'mon{m}cellb{k}', M['brick'], MX + t, MY + D / 2 - 0.05, G - 0.005, 0.025, 0.1, 0.04, outline=0.001, bevel=0)
# Ashoka's pillar's stump under its little roof
lathe('pillar', M['stone'], ((0.035, 0), (0.035, 0.09)), G - 0.005, 0.25, -0.6, segs=16, outline=0.003)
for s in (-1, 1):
    for t in (-1, 1):
        rod(f'shelterpost{s}{t}', M['carve'], (0.25 + s * 0.07, -0.6 + t * 0.07, G), (0.25 + s * 0.07, -0.6 + t * 0.07, G + 0.14), 0.006, segs=6, outline=0.001)
hip('shelterroof', M['brick'], 0.25, -0.6, G + 0.14, 0.17, 0.17, 0.05)
for k, (x, y) in enumerate(((-0.85, 0.2), (-0.65, 0.65), (0.55, 0.55), (0.9, 0.25), (-0.15, -0.85))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.012, segs=6, outline=0.002)
    b = ball(f'tree{k}', M['tree'], 0, 0, 0, 0.09, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + 0.19)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
