# A cartoon Longmen Grottoes for the country maps, built in the set's shared look (../toon.py): the
# limestone cliffs over the Yi River honeycombed with niches, and the great open shrine of Fengxian
# Temple carved into them, the giant seated Vairocana Buddha with his serene face and halo, his
# disciples and guardian kings standing either side, the stairs up from the river and a bridge.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P longmen.py -- longmen-1024.png 1024 longmen.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bank': toon('bank', '#a8b870', shadow_mul=(0.76, 0.8, 0.72), lift=0.2),
    'river': toon('river', '#4a8aa8', lift=0.3),
    'cliff': toon('cliff', '#c8bca8', shadow_mul=(0.84, 0.82, 0.86), lift=0.05),
    'cliffDark': toon('cliffDark', '#a89c88', shadow_mul=(0.84, 0.82, 0.86)),
    'niche': flat('niche', '#5a4e44'),
    'stone': toon('stone', '#ddd2bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'eye': flat('eye', '#5a5048'),
    'green': toon('green', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'stair': toon('stair', '#b8ac98'),
})

G = tile(M['bank'])
before = set(bpy.data.objects)
rng = random.Random(2311)

box('river', M['river'], 0.0, -0.7, G - 0.004, 2.6, 0.32, 0.01, outline=0.004, bevel=0)

# ---------- the cliff ----------
CY = 0.45
# the cliff round an open niche: left and right blocks, the back, and a lintel over it
box('cliffleft', M['cliff'], -0.7, CY, G - 0.01, 0.6, 0.5, 0.75, outline=0.012, bevel=0)
box('cliffright', M['cliff'], 0.7, CY, G - 0.01, 0.6, 0.5, 0.75, outline=0.012, bevel=0)
box('cliffbackblock', M['cliff'], 0.0, CY + 0.2, G - 0.01, 0.8, 0.1, 0.75, outline=0.01, bevel=0)
box('clifflintel', M['cliff'], 0.0, CY + 0.05, G + 0.7, 0.8, 0.4, 0.04, outline=0.008, bevel=0)
for k in range(30):
    x = rng.uniform(-0.95, 0.95)
    z = rng.uniform(0.08, 0.65)
    if abs(x) < 0.45:
        continue
    w = rng.uniform(0.03, 0.06)
    box(f'smallniche{k}', M['niche'], x, CY - 0.252, G + z, w, 0.006, w * 1.3, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.8, CY + 0.1), (-0.5, CY + 0.15), (0.5, CY + 0.15), (0.8, CY + 0.1), (0.0, CY + 0.2))):
    ball(f'green{k}', M['green'], x, y, G + 0.78, 0.1, outline=0.009)

# ---------- the Fengxian shrine: a great open niche ----------
NX, NY = 0.0, CY - 0.1
box('shrinefloor', M['cliffDark'], NX, NY, G + 0.08, 0.76, 0.32, 0.02, outline=0.004, bevel=0)
box('shrineback', M['cliffDark'], NX, NY + 0.14, G + 0.08, 0.76, 0.04, 0.62, outline=0.006, bevel=0)
for s in (-1, 1):
    box(f'shrineside{s}', M['cliffDark'], NX + s * 0.38, NY, G + 0.08, 0.04, 0.32, 0.62, outline=0.006, bevel=0)
B = G + 0.1
# Vairocana
box('throne', M['stone'], NX, NY + 0.05, B - 0.005, 0.24, 0.16, 0.08, outline=0.005, bevel=0)
b = ball('vlegs', M['stone'], 0, 0, 0, 0.1, outline=0.008)
b.scale = (1.3, 0.75, 0.45)
b.location = (NX, NY + 0.02, B + 0.11)
b = ball('vtorso', M['stone'], 0, 0, 0, 0.09, outline=0.008)
b.scale = (1.0, 0.7, 1.4)
b.location = (NX, NY + 0.04, B + 0.25)
ball('vhead', M['stone'], NX, NY + 0.03, B + 0.43, 0.065, outline=0.006)
ball('vushnisha', M['cliffDark'], NX, NY + 0.035, B + 0.49, 0.035, outline=0.003)
for s in (-1, 1):
    box(f'veye{s}', M['eye'], NX + s * 0.025, NY - 0.032, B + 0.44, 0.025, 0.004, 0.005, outline=0, bevel=0)
    b = ball(f'vear{s}', M['stone'], 0, 0, 0, 0.025, outline=0.002)
    b.scale = (0.4, 0.6, 1.6)
    b.location = (NX + s * 0.068, NY + 0.03, B + 0.42)
cyl('halo', M['stone'], 0.12, 0.01, segs=24, outline=0.003, matrix=Matrix.Translation((NX, NY + 0.115, B + 0.43)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('halobody', M['cliff'], 0.2, 0.008, segs=24, outline=0.002, matrix=Matrix.Translation((NX, NY + 0.12, B + 0.25)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# disciples and guardians
for s in (-1, 1):
    for j, (dx, h) in enumerate(((0.14, 0.3), (0.26, 0.34))):
        x = NX + s * dx
        lathe(f'attendant{s}{j}', M['stone'], ((0.035, 0), (0.03, h * 0.8), (0.022, h * 0.85)), B - 0.005, x, NY + 0.02, segs=10, outline=0.004)
        ball(f'attendanthead{s}{j}', M['stone'], x, NY + 0.02, B + h * 0.85 + 0.025, 0.028, outline=0.003)

# ---------- the stairs and a bridge ----------
for j in range(5):
    box(f'stair{j}', M['stair'], 0.0, NY - 0.2 - j * 0.04, G - 0.005, 0.2, 0.045, 0.08 - j * 0.016, outline=0.002, bevel=0)
pts = [(0.75, -0.55 - 0.3 * j / 6, G + 0.02 + 0.05 * math.sin(math.pi * j / 6)) for j in range(7)]
for j in range(6):
    bar(f'bridge{j}', M['stone'], pts[j], pts[j + 1], 0.07, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
