# A cartoon Talayotic Menorca for the country maps, built in the set's shared look (../toon.py): the
# Naveta d'Es Tudons, the boat-shaped prehistoric tomb of great fitted stone blocks lying upside down
# in its field, a taula (the T-shaped table of two huge slabs) in its horseshoe sanctuary, a round
# talayot tower of rough stones, the island's dry-stone walls and wild olive trees. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P talayotic-menorca.py -- talayotic-menorca-1024.png 1024 talayotic-menorca.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'field': toon('field', '#a8c070', shadow_mul=(0.76, 0.8, 0.78), lift=0.2),
    'stone': toon('stone', '#d0c4a8', shadow_mul=(0.84, 0.84, 0.88), lift=0.12),
    'stoneDark': toon('stoneDark', '#a89c80'),
    'dark': flat('dark', '#2a2420'),
    'olive': toon('olive', '#7a9a50', shadow_mul=(0.72, 0.8, 0.76)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['field'])
before = set(bpy.data.objects)
rng = random.Random(1200)

# ---------- the Naveta d'Es Tudons: an upturned boat of stone ----------
NX, NY = -0.25, -0.15
L, W, H = 0.62, 0.3, 0.26
rings = []
for k in range(9):
    t = k / 8
    y = NY - L / 2 + L * t
    rounded = math.sin(math.pi * min(1.0, t * 1.15)) ** 0.35 if t < 0.92 else 0.7
    w = W / 2 * (0.75 + 0.25 * rounded)
    rings.append((y, w))
# built as courses of blocks, each a little narrower, so its sides lean in
for c in range(5):
    z0 = G - 0.005 + c * H / 5
    shrink = 1 - c * 0.07
    for k in range(len(rings) - 1):
        (ya, wa), (yb, wb) = rings[k], rings[k + 1]
        quad = [(NX - wa * shrink, ya), (NX + wa * shrink, ya), (NX + wb * shrink, yb), (NX - wb * shrink, yb)]
        loft(f'course{c}{k}', M['stone'] if (c + k) % 2 else M['stoneDark'], [[(x, y, z0) for x, y in quad], [(x, y, z0 + H / 5) for x, y in quad]], outline=0.002)
box('navetaroof', M['stone'], NX, NY, G + H - 0.01, W * 0.62, L * 0.92, 0.03, outline=0.004, bevel=0)
box('navetadoor', M['dark'], NX, NY - L / 2 - 0.003, G - 0.005, 0.05, 0.006, 0.07, outline=0, bevel=0)

# ---------- the taula in its horseshoe sanctuary ----------
TX, TY = 0.42, 0.25
for k in range(13):
    a = math.pi * (0.15 + 1.7 * k / 12) + math.pi / 2
    box(f'sanctuarywall{k}', M['stoneDark'], TX + 0.26 * math.cos(a), TY + 0.26 * math.sin(a), G - 0.005, 0.08, 0.06, 0.1 + rng.uniform(0, 0.04), rot_z=a, outline=0.003, bevel=0)
box('taulaupright', M['stone'], TX, TY + 0.05, G - 0.005, 0.12, 0.04, 0.32, outline=0.005, bevel=0)
box('taulatop', M['stone'], TX, TY + 0.05, G + 0.31, 0.06, 0.22, 0.05, outline=0.005, bevel=0)

# ---------- a talayot tower ----------
lathe('talayot', M['stoneDark'], ((0.2, 0), (0.18, 0.12), (0.15, 0.24), (0.14, 0.26)), G - 0.005, -0.45, 0.6, segs=16, outline=0.006, smooth=False)
for k in range(14):
    a = 2 * math.pi * k / 14
    ball(f'talayotstone{k}', M['stone'], -0.45 + 0.19 * math.cos(a), 0.6 + 0.19 * math.sin(a), G + 0.05 + 0.08 * (k % 3), 0.03, outline=0.002)

# ---------- dry-stone walls and wild olives ----------
for k, (x0, y0, x1, y1) in enumerate(((-1.05, -0.55, 0.0, -0.75), (0.15, -0.7, 0.95, -0.45), (0.85, -0.3, 0.9, 0.55))):
    bar(f'drywall{k}', M['stoneDark'], (x0, y0, G + 0.03), (x1, y1, G + 0.03), 0.06, outline=0.003)
for k, (x, y) in enumerate(((0.55, -0.25), (-0.85, 0.15), (0.0, 0.75), (0.65, 0.7), (-0.6, -0.85))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.08), 0.016, segs=6, outline=0.002)
    ob = ball(f'olive{k}', M['olive'], 0, 0, 0, 0.09, outline=0.01)
    ob.scale = (1.3, 1.2, 0.75)
    ob.location = (x + 0.03, y, G + 0.14)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
