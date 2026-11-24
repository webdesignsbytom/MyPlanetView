# A cartoon Syracuse for the country maps, built in the set's shared look (../toon.py): the great
# Greek theatre of the Neapolis carved out of the limestone hillside, its fan of seats round the
# orchestra and the stage foundations, and beside it the Ear of Dionysius, the tall cave in the old
# quarry shaped like a pointed ear, in its garden of lemon trees and cypresses. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P syracuse.py -- syracuse-1024.png 1024 syracuse.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8c088', shadow_mul=(0.82, 0.82, 0.8), lift=0.2),
    'limestone': toon('limestone', '#e4d8b8', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'limestoneDark': toon('limestoneDark', '#c4b48c'),
    'cliff': toon('cliff', '#d0c09a', shadow_mul=(0.84, 0.82, 0.82)),
    'cave': flat('cave', '#2a2420'),
    'lemon': toon('lemon', '#5a9a40', shadow_mul=(0.7, 0.78, 0.8)),
    'fruit': toon('fruit', '#f0d840', lift=0.2),
    'cypress': toon('cypress', '#2f5a34', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the theatre ----------
OX, OY = -0.25, -0.25
R0 = 0.14
SPREAD = math.radians(100)
lathe('orchestra', M['limestone'], ((R0, 0), (R0, 0.012)), G - 0.004, OX, OY, segs=28, outline=0.002)
WEDGES = 9
ROWS = 12
for w in range(WEDGES):
    a0 = math.pi / 2 - SPREAD + 2 * SPREAD * w / WEDGES + 0.015
    a1 = math.pi / 2 - SPREAD + 2 * SPREAD * (w + 1) / WEDGES - 0.015
    for r in range(ROWS):
        ri = R0 + 0.02 + r * 0.045
        ro = ri + 0.045
        z1 = G + 0.012 + r * 0.024
        inner = [(OX + ri * math.cos(a0 + (a1 - a0) * k / 3), OY + ri * math.sin(a0 + (a1 - a0) * k / 3)) for k in range(4)]
        outer = [(OX + ro * math.cos(a0 + (a1 - a0) * k / 3), OY + ro * math.sin(a0 + (a1 - a0) * k / 3)) for k in range(4)]
        ring = inner + outer[::-1]
        loft(f'seat{w}{r}', M['limestone'] if (w + r) % 2 else M['limestoneDark'], [[(x, y, G - 0.005) for x, y in ring], [(x, y, z1) for x, y in ring]], outline=0.0015)
# the stage's foundations
for j in range(4):
    box(f'stagefoundation{j}', M['limestoneDark'], OX - 0.18 + j * 0.12, OY - 0.2, G - 0.005, 0.08, 0.06, 0.04, outline=0.002, bevel=0)

# ---------- the quarry cliff and the Ear of Dionysius ----------
QX, QY = 0.45, 0.35
box('quarrycliff', M['cliff'], QX, QY + 0.15, G - 0.005, 0.7, 0.3, 0.52, outline=0.008, bevel=0)
# the ear: a tall cave opening pointed at the top and curving a little, like the shape of an ear
ear = []
for k in range(13):
    t = k / 12
    z = G + 0.48 * t
    w = 0.07 * math.sin(math.pi * min(1.0, t * 1.1)) ** 0.7 + 0.004
    ear.append((QX + 0.03 * math.sin(t * math.pi), z, w))
for k in range(12):
    (x0, z0, w0), (x1, z1, w1) = ear[k], ear[k + 1]
    loft(f'earslice{k}', M['cave'], [[(x0 - w0, QY - 0.003, z0), (x0 + w0, QY - 0.003, z0), (x0 + w0, QY + 0.003, z0), (x0 - w0, QY + 0.003, z0)],
                                     [(x1 - w1, QY - 0.003, z1), (x1 + w1, QY - 0.003, z1), (x1 + w1, QY + 0.003, z1), (x1 - w1, QY + 0.003, z1)]], outline=0)

# ---------- lemon trees and cypresses in the garden ----------
for k, (x, y) in enumerate(((0.5, -0.62), (0.58, -0.38), (0.78, -0.12), (0.86, -0.4))):
    ball(f'lemon{k}', M['lemon'], x, y, G + 0.08, 0.08, outline=0.009)
    for j in range(3):
        ball(f'fruit{k}{j}', M['fruit'], x + 0.05 * math.cos(j * 2.1), y - 0.05, G + 0.07 + 0.02 * j, 0.012, outline=0)
for k, (x, y) in enumerate(((0.95, 0.25), (-0.8, 0.45), (-0.95, -0.15), (0.8, -0.55))):
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.045, 0.06), (0.03, 0.2), (0.004, 0.32)), G - 0.005, x, y, segs=10, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
