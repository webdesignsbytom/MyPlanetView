# A cartoon Western Wall for the country maps, built in the set's shared look (../toon.py): the
# great pale limestone blocks of the Western Wall with tufts of caper growing from its joints, the
# plaza in front with its worshippers, and above it on the Temple Mount the Dome of the Rock, its
# octagon of blue tiles under the golden dome. Turned a little towards the camera.
# Run: blender -b --factory-startup -P western-wall.py -- western-wall-1024.png 1024 western-wall.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plaza': toon('plaza', '#e8dcc4', shadow_mul=(0.86, 0.82, 0.8), lift=0.2),
    'stone': toon('stone', '#e0d0a8', shadow_mul=(0.86, 0.82, 0.78), lift=0.12),
    'stoneDark': toon('stoneDark', '#c8b48c', shadow_mul=(0.86, 0.82, 0.78)),
    'joint': flat('joint', '#a89470'),
    'plant': toon('plant', '#6a9a4a'),
    'blue': toon('tileBlue', '#2f6ac0', lift=0.15),
    'tileWhite': toon('tileWhite', '#f2f0ea', lift=0.2),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'black': toon('black', '#2e2a30'),
    'white': toon('white', '#f6f4ee', lift=0.2),
    'cypress': toon('cypress', '#3f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['plaza'])
before = set(bpy.data.objects)
rng = random.Random(2227)

# ---------- the Temple Mount and the Dome of the Rock ----------
box('mount', M['stoneDark'], 0.0, 0.55, G - 0.005, 1.9, 0.7, 0.34, outline=0.012, bevel=0)
P = G + 0.335
DX, DY = 0.05, 0.62
lathe('domeplatform', M['stone'], ((0.36, 0), (0.36, 0.03)), P - 0.005, DX, DY, segs=8, outline=0.006, smooth=False)
lathe('octagon', M['blue'], ((0.26, 0), (0.26, 0.16)), P + 0.025, DX, DY, segs=8, outline=0.01, smooth=False)
for j in range(8):
    a = 2 * math.pi * j / 8 + math.pi / 8
    box(f'octwhite{j}', M['tileWhite'], DX + 0.245 * math.cos(a), DY + 0.245 * math.sin(a), P + 0.025, 0.12, 0.02, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('drum', M['blue'], ((0.15, 0), (0.15, 0.08)), P + 0.18, DX, DY, segs=16, outline=0.007)
lathe('golddome', M['gold'], ((0.165, 0), (0.16, 0.08), (0.12, 0.15), (0.05, 0.2), (0.004, 0.22)), P + 0.255, DX, DY, segs=22, outline=0.008)
rod('domefinial', M['gold'], (DX, DY, P + 0.47), (DX, DY, P + 0.53), 0.006, segs=5, outline=0)
for k, x in enumerate((-0.75, -0.55, 0.65, 0.85)):
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.05, 0.08), (0.03, 0.2), (0.004, 0.27)), P - 0.005, x, 0.55, segs=8, outline=0.005)

# ---------- the Western Wall ----------
WY = 0.18
box('wall', M['stone'], 0.0, WY, G - 0.005, 1.7, 0.1, 0.4, outline=0.012, bevel=0)
for r in range(7):
    z = G + 0.03 + r * 0.055
    box(f'course{r}', M['joint'], 0.0, WY - 0.052, z, 1.7, 0.004, 0.006, outline=0, bevel=0)
    off = 0.08 * (r % 2)
    for j in range(9):
        x = -0.8 + off + j * 0.2
        if abs(x) < 0.85:
            box(f'joint{r}{j}', M['joint'], x, WY - 0.052, z, 0.006, 0.004, 0.055, outline=0, bevel=0)
for k in range(10):
    x, z = rng.uniform(-0.75, 0.75), rng.uniform(0.1, 0.36)
    ball(f'caper{k}', M['plant'], x, WY - 0.06, G + z, 0.025, outline=0.003)
box('partition', M['white'], 0.25, -0.05, G - 0.005, 0.02, 0.4, 0.07, outline=0.003, bevel=0)

# ---------- worshippers on the plaza ----------
for k in range(12):
    x = rng.uniform(-0.7, 0.7)
    y = rng.uniform(-0.2, 0.05)
    mat = 'black' if k % 3 else 'white'
    lathe(f'person{k}', M[mat], ((0.022, 0), (0.016, 0.07), (0.012, 0.085)), G - 0.005, x, y, segs=8, outline=0.003)
    ball(f'personhead{k}', M['black' if k % 2 else 'white'], x, y, G + 0.1, 0.014, outline=0.002)

turn(before, -20)
render(G)
