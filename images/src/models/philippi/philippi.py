# A cartoon Philippi for the country maps, built in the set's shared look (../toon.py): the city of
# Philip of Macedon in eastern Macedonia, Greece, where Saint Paul preached: the great piers of
# Basilica B still standing to their arches, the forum's columns and paving, the theatre cut
# into the acropolis hill behind with its half circle of seats, and the olive trees. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P philippi.py -- philippi-1024.png 1024 philippi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#a0bc66', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#90a860', shadow_mul=(0.72, 0.78, 0.8)),
    'stone': toon('stone', '#e8dcc0', shadow_mul=(0.8, 0.8, 0.86), lift=0.2),
    'stoneDark': toon('stoneDark', '#c4b494'),
    'paving': toon('paving', '#ddd2b8', lift=0.18),
    'dark': flat('dark', '#3a322a'),
    'tree': toon('tree', '#7a9a58', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(379652)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the theatre ----------
OX, OY = -0.35, 0.42
for k in range(5):
    r0 = 0.12 + k * 0.06
    for j in range(10):
        a0 = j * math.pi / 10
        a1 = a0 + math.pi / 10
        pts = [(OX + r0 * math.cos(a0), OY + r0 * math.sin(a0)), (OX + 0.44 * math.cos(a0), OY + 0.44 * math.sin(a0)),
               (OX + 0.44 * math.cos(a1), OY + 0.44 * math.sin(a1)), (OX + r0 * math.cos(a1), OY + r0 * math.sin(a1))]
        loft(f'seats{k}_{j}', M['stoneDark'], [[(x, y, G - 0.005) for x, y in pts], [(x, y, G + 0.03 + k * 0.035) for x, y in pts]], outline=0.002)
box('stage', M['stone'], OX, OY - 0.04, G - 0.005, 0.5, 0.07, 0.05, outline=0.003, bevel=0)

# ---------- the forum's paving and columns ----------
box('forum', M['paving'], 0.15, -0.45, G - 0.004, 1.1, 0.42, 0.01, outline=0.001, bevel=0)
for k in range(9):
    x = -0.3 + k * 0.11
    h = 0.12 + 0.12 * rng.random() if k % 3 else 0.28
    lathe(f'forumcol{k}', M['stone'], ((0.018, 0), (0.016, h)), G + 0.005, x, -0.62, segs=10, outline=0.002, smooth=False)
    if h > 0.25:
        box(f'forumcap{k}', M['stone'], x, -0.62, G + 0.005 + h, 0.045, 0.045, 0.015, outline=0.001, bevel=0)
for k in range(6):
    box(f'forumblock{k}', M['stoneDark'], -0.2 + 0.18 * k, -0.3 + 0.03 * (k % 2), G + 0.005, 0.07, 0.05, 0.03, rot_z=0.3 * k, outline=0.001, bevel=0)

# ---------- Basilica B's standing piers ----------
BX, BY = 0.45, 0.15
box('basilicafloor', M['paving'], BX, BY, G - 0.004, 0.5, 0.6, 0.012, outline=0.001, bevel=0)
for s in (-1, 1):
    for k in range(2):
        y = BY - 0.1 + k * 0.22
        box(f'pier{s}{k}', M['stone'], BX + s * 0.13, y, G - 0.005, 0.08, 0.08, 0.42, outline=0.006, bevel=0)
    SPAN = 0.14
    for j in range(8):
        um = (j + 0.5) / 8
        z = G + 0.35 + 0.07 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
        box(f'archslice{s}{j}', M['stone'], BX + s * 0.13, BY - 0.1 + 0.04 + 0.14 * um, z, 0.08, 0.14 / 8 + 0.002, G + 0.48 - z, outline=0.002, bevel=0)
box('apse', M['stone'], BX, BY + 0.28, G - 0.005, 0.32, 0.04, 0.16, outline=0.004, bevel=0)
for k in range(6):
    lathe(f'basilicacol{k}', M['stone'], ((0.014, 0), (0.014, 0.1 + 0.05 * (k % 2))), G + 0.005, BX - 0.18 + k * 0.072, BY - 0.27, segs=8, outline=0.001, smooth=False)

for k, (x, y) in enumerate(((0.85, 0.65), (1.0, -0.2), (-0.95, -0.25), (-0.75, -0.75), (0.65, -0.95))):
    tree(f'olive{k}', x, y, r=0.08, h=0.08)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
