# A cartoon Sarmizegetusa Regia for the country maps, built in the set's shared look (../toon.py):
# the capital of the Dacian kings in the Orăștie Mountains of Romania: the sacred terrace in the
# beech forest with its sanctuaries, the rows of round andesite pillar bases of the great
# rectangular temples, the Great Circular Sanctuary's ring of upright posts and stones round its
# apse, the andesite sun disc, and the fortress's stone wall above. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sarmizegetusa.py -- sarmizegetusa-1024.png 1024 sarmizegetusa.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'terrace': toon('terrace', '#a8c070', lift=0.2),
    'andesite': toon('andesite', '#9a948a', shadow_mul=(0.8, 0.8, 0.86), lift=0.14),
    'limestone': toon('limestone', '#e2d8c0', lift=0.2),
    'wood': toon('wood', '#7a5a3e'),
    'stone': toon('stone', '#b8ac94', lift=0.14),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


box('terrace', M['terrace'], 0.0, 0.0, G - 0.004, 1.3, 0.9, 0.01, outline=0.001, bevel=0)

# ---------- the rectangular sanctuaries' pillar bases ----------
for t, (x0, y0, nx, ny) in enumerate(((-0.6, 0.0, 6, 4), (-0.1, 0.25, 5, 3))):
    for i in range(nx):
        for j in range(ny):
            x, y = x0 + i * 0.075, y0 + j * 0.075
            lathe(f'pillar{t}{i}{j}', M['andesite'], ((0.025, 0), (0.025, 0.035)), G - 0.004, x, y, segs=12, outline=0.002)

# ---------- the Great Circular Sanctuary ----------
CX, CY = 0.35, -0.25
for k in range(30):
    a = 2 * math.pi * k / 30
    box(f'ringstone{k}', M['limestone'], CX + 0.28 * math.cos(a), CY + 0.28 * math.sin(a), G - 0.004, 0.05, 0.025, 0.025, rot_z=a + math.pi / 2, outline=0.001, bevel=0)
for k in range(24):
    a = 2 * math.pi * k / 24
    rod(f'post{k}', M['wood'] if k % 4 else M['andesite'], (CX + 0.24 * math.cos(a), CY + 0.24 * math.sin(a), G), (CX + 0.24 * math.cos(a), CY + 0.24 * math.sin(a), G + 0.1), 0.012, segs=6, outline=0.001)
for k in range(12):
    a = math.pi / 2 - 0.9 + k * 1.8 / 11
    rod(f'apsepost{k}', M['wood'], (CX + 0.12 * math.cos(a), CY + 0.12 * math.sin(a) - 0.03, G), (CX + 0.12 * math.cos(a), CY + 0.12 * math.sin(a) - 0.03, G + 0.08), 0.01, segs=6, outline=0.001)

# ---------- the andesite sun disc ----------
SX, SY = -0.3, -0.45
lathe('sundisc', M['andesite'], ((0.15, 0), (0.15, 0.03)), G - 0.004, SX, SY, segs=10, outline=0.003, smooth=False)
for k in range(10):
    a = 2 * math.pi * k / 10
    bar(f'sunray{k}', M['limestone'], (SX, SY, G + 0.03), (SX + 0.14 * math.cos(a), SY + 0.14 * math.sin(a), G + 0.03), 0.012, outline=0)

# ---------- the fortress wall above ----------
for k in range(6):
    x = -0.9 + k * 0.32
    box(f'fortwall{k}', M['stone'], x, 0.62 + 0.03 * (k % 2), G - 0.005, 0.3, 0.06, 0.12 + 0.02 * (k % 3), outline=0.004, bevel=0)

for k in range(12):
    a = 2 * math.pi * k / 12 + 0.15
    x, y = 1.12 * math.cos(a), 1.02 * math.sin(a)
    tree(f'beech{k}', x, y, r=0.11, h=0.16)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
