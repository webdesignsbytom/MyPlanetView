# A cartoon Temple of Heaven for the country maps, built in the set's shared look (../toon.py): the
# Hall of Prayer for Good Harvests in Beijing, round, its red columns under three tiers of deep blue
# tiles and a golden top, on its three round white marble terraces with stairs to each side, and
# the old cypresses in the park round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P temple-of-heaven.py -- temple-of-heaven-1024.png 1024 temple-of-heaven.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8cfbc', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'marble': toon('marble', '#f4f2ec', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'red': toon('red', '#b8302a'),
    'blue': toon('roofBlue', '#2a48a0', shadow_mul=(0.76, 0.8, 0.92), lift=0.2),
    'beam': toon('beam', '#3f8a6a'),
    'gold': toon('gold', '#f0b830', shadow_mul=(0.8, 0.66, 0.56), lift=0.35),
    'window': flat('window', '#3a2a28'),
    'cypress': toon('cypress', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'lawn': toon('lawn', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1427)

# ---------- the three round terraces, stairs on each side ----------
HX, HY = 0.0, 0.1
box('court', M['paving'], HX, HY, G - 0.005, 1.6, 1.3, 0.012, outline=0.005, bevel=0)
for i, r in enumerate((0.6, 0.5, 0.4)):
    lathe(f'terrace{i}', M['marble'], ((r, 0), (r, 0.05)), G + 0.005 + i * 0.05, HX, HY, segs=40, outline=0.01)
    lathe(f'balustrade{i}', M['marble'], ((r - 0.005, 0), (r - 0.005, 0.02)), G + 0.055 + i * 0.05, HX, HY, segs=40, outline=0.003)
for k in range(4):
    a = math.pi / 2 * k - math.pi / 2
    for i in range(3):
        r = 0.6 - i * 0.1
        box(f'stairs{k}{i}', M['marble'], HX + (r + 0.04) * math.cos(a), HY + (r + 0.04) * math.sin(a), G + 0.005, 0.12, 0.08, 0.05 * (i + 1), rot_z=a, outline=0.004, bevel=0)
T = G + 0.155

# ---------- the hall: red columns, three blue roofs, a golden top ----------
lathe('hall', M['red'], ((0.25, 0), (0.25, 0.1)), T, HX, HY, segs=24, outline=0.012)
for j in range(12):
    a = 2 * math.pi * j / 12
    box(f'lattice{j}', M['window'], HX + 0.252 * math.cos(a), HY + 0.252 * math.sin(a), T + 0.015, 0.06, 0.006, 0.07, rot_z=a + math.pi / 2, outline=0, bevel=0)
z = T + 0.1
for i, (r0, r1, h, body) in enumerate(((0.36, 0.2, 0.09, 0.05), (0.28, 0.15, 0.08, 0.05), (0.21, 0.004, 0.13, 0.0))):
    lathe(f'beam{i}', M['beam'], ((r1 + 0.03 if i < 2 else 0.2, 0), (r1 + 0.03 if i < 2 else 0.2, 0.015)), z, HX, HY, segs=24, outline=0.003)
    lathe(f'roof{i}', M['blue'], ((r0, 0), (r0 * 0.85, h * 0.25), (r1 + 0.01, h * 0.85), (r1, h)), z, HX, HY, segs=28, outline=0.01)
    z += h
    if body:
        lathe(f'drum{i}', M['red'], ((r1, 0), (r1, body)), z, HX, HY, segs=24, outline=0.008)
        z += body
lathe('finial', M['gold'], ((0.04, 0), (0.035, 0.03), (0.018, 0.06), (0.004, 0.1)), z - 0.01, HX, HY, segs=14, outline=0.005)

# ---------- the cypresses round the park ----------
for k in range(16):
    a = 2 * math.pi * k / 16 + 0.1
    x, y = 1.1 * math.cos(a), 0.1 + 1.0 * math.sin(a)
    if math.hypot(x, y) > 1.28:
        x, y = x * 0.93, y * 0.93
    lathe(f'cypress{k}', M['cypress'], ((0.06, 0), (0.07, 0.06), (0.05, 0.14), (0.004, 0.22)), G, x, y, segs=10, outline=0.007)

turn(before, -20)
render(G)
