# A cartoon Château de Chambord for the country maps, built in the set's shared look (../toon.py):
# the great Renaissance château in the Loire valley, its pale keep and round corner towers under
# slate cones, its famous roofscape crowded with chimneys, dormers and turrets round the central
# lantern of the double staircase, the moat of the Cosson in front, and the forest round it.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P chambord.py -- chambord-1024.png 1024 chambord.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#f2ead6', shadow_mul=(0.82, 0.8, 0.86), lift=0.15),
    'slate': toon('slate', '#4a5264', shadow_mul=(0.8, 0.82, 0.9)),
    'window': flat('window', '#3a4a64'),
    'water': toon('water', '#4a8aa0', lift=0.3),
    'forest': toon('forest', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1523)

# ---------- the moat in front ----------
box('moat', M['water'], 0.0, -0.45, G - 0.003, 2.2, 0.22, 0.008, outline=0.004, bevel=0)

# ---------- the château: wings, corner towers, the keep ----------
CX, CY = 0.0, 0.25
box('wings', M['stone'], CX, CY, G - 0.005, 1.3, 0.5, 0.14, outline=0.012, bevel=0)
box('wingroof', M['slate'], CX, CY, G + 0.135, 1.32, 0.52, 0.03, outline=0.005, bevel=0)
for j in range(10):
    box(f'wingwin{j}', M['window'], CX - 0.55 + j * 0.122, CY - 0.254, G + 0.05, 0.03, 0.006, 0.05, outline=0, bevel=0)
for k, (x, y) in enumerate(((CX - 0.65, CY - 0.25), (CX + 0.65, CY - 0.25), (CX - 0.65, CY + 0.25), (CX + 0.65, CY + 0.25))):
    lathe(f'cornertower{k}', M['stone'], ((0.12, 0), (0.12, 0.18)), G - 0.005, x, y, segs=20, outline=0.012)
    lathe(f'cornercone{k}', M['slate'], ((0.125, 0), (0.09, 0.05), (0.004, 0.16)), G + 0.175, x, y, segs=20, outline=0.01)
KX, KY = CX, CY - 0.02
box('keep', M['stone'], KX, KY, G - 0.005, 0.56, 0.4, 0.28, outline=0.014, bevel=0)
for row in range(2):
    for j in range(6):
        box(f'keepwin{row}{j}', M['window'], KX - 0.22 + j * 0.088, KY - 0.204, G + 0.06 + row * 0.11, 0.03, 0.006, 0.06, outline=0, bevel=0)
for k, (x, y) in enumerate(((KX - 0.28, KY - 0.2), (KX + 0.28, KY - 0.2), (KX - 0.28, KY + 0.2), (KX + 0.28, KY + 0.2))):
    lathe(f'keeptower{k}', M['stone'], ((0.1, 0), (0.1, 0.3)), G - 0.005, x, y, segs=20, outline=0.012)
    lathe(f'keepcone{k}', M['slate'], ((0.105, 0), (0.075, 0.05), (0.03, 0.12), (0.004, 0.16)), G + 0.295, x, y, segs=20, outline=0.01)
    lathe(f'keeplantern{k}', M['stone'], ((0.02, 0), (0.02, 0.05), (0.004, 0.08)), G + 0.44, x, y, segs=8, outline=0.003)
T = G + 0.275
box('keeproof', M['slate'], KX, KY, T, 0.5, 0.34, 0.05, outline=0.006, bevel=0)

# ---------- the roofscape: chimneys, dormers, turrets, the central lantern ----------
for k in range(14):
    x = KX - 0.2 + (k % 7) * 0.067
    y = KY - 0.1 + (k // 7) * 0.2
    h = rng.uniform(0.08, 0.14)
    box(f'chimney{k}', M['stone'], x, y, T + 0.045, 0.03, 0.03, h, outline=0.004, bevel=0)
    box(f'chimneycap{k}', M['slate'], x, y, T + 0.045 + h, 0.04, 0.04, 0.012, outline=0.002, bevel=0)
for k in range(6):
    x = KX - 0.2 + k * 0.08
    box(f'dormer{k}', M['stone'], x, KY - 0.17, T + 0.04, 0.04, 0.03, 0.05, outline=0.003, bevel=0)
    pyramid(f'dormertop{k}', M['stone'], x, KY - 0.17, T + 0.09, 0.045, 0.04, outline=0.002)
lathe('lantern', M['stone'], ((0.06, 0), (0.06, 0.12), (0.04, 0.13), (0.04, 0.2)), T + 0.045, KX, KY, segs=12, outline=0.008)
lathe('lanterncap', M['slate'], ((0.05, 0), (0.025, 0.04), (0.012, 0.09)), T + 0.245, KX, KY, segs=12, outline=0.005)
lathe('lanternfinial', M['stone'], ((0.015, 0), (0.004, 0.06)), T + 0.335, KX, KY, segs=8, outline=0.002)

# ---------- the forest round it ----------
for k in range(18):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(1.0, 1.25)
    x, y = r * math.cos(a), r * math.sin(a)
    if y < -0.3:
        continue
    ball(f'forest{k}', M['forest'], x, y, G + 0.08, rng.uniform(0.08, 0.1), outline=0.012)

turn(before, -20)
render(G)
