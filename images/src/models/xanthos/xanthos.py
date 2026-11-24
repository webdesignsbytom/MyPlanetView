# A cartoon Xanthos for the country maps, built in the set's shared look (../toon.py): the hilltop
# ruins of the Lycian capital, the Harpy Tomb (a tall square stone pillar with the carved frieze and
# the burial chamber on its top) beside the pillar tomb with its pointed sarcophagus lid, the Roman
# theatre's half-circle of seats cut into the slope, the broken walls, and the olive and pine trees.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P xanthos.py -- xanthos-1024.png 1024 xanthos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b890', shadow_mul=(0.84, 0.82, 0.78), lift=0.2),
    'stone': toon('stone', '#e0d4b8', shadow_mul=(0.86, 0.84, 0.86), lift=0.15),
    'stoneDark': toon('stoneDark', '#b8aa8a'),
    'relief': toon('relief', '#c8b894'),
    'dark': flat('dark', '#2e2a26'),
    'olive': toon('olive', '#8aa060', shadow_mul=(0.72, 0.8, 0.76)),
    'pine': toon('pine', '#3f7a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(545)

# ---------- the theatre on the right, its seats in a half circle ----------
OX, OY = 0.4, 0.2
for r in range(9):
    ri, ro = 0.14 + r * 0.045, 0.14 + (r + 1) * 0.045
    z1 = G + 0.015 + r * 0.025
    for w in range(10):
        a0, a1 = math.pi * w / 10 + 0.01, math.pi * (w + 1) / 10 - 0.01
        ring = [(OX + ri * math.cos(a0), OY + ri * math.sin(a0)), (OX + ri * math.cos(a1), OY + ri * math.sin(a1)),
                (OX + ro * math.cos(a1), OY + ro * math.sin(a1)), (OX + ro * math.cos(a0), OY + ro * math.sin(a0))]
        if rng.random() < 0.1 and r > 5:
            continue   # a few seats fallen
        loft(f'seat{r}{w}', M['stone'] if (r + w) % 2 else M['stoneDark'], [[(x, y, G - 0.005) for x, y in ring], [(x, y, z1) for x, y in ring]], outline=0.0015)
box('stage', M['stoneDark'], OX, OY - 0.08, G - 0.005, 0.46, 0.08, 0.06, outline=0.003, bevel=0)

# ---------- the Harpy Tomb ----------
HX, HY = -0.3, 0.05
box('harpybase', M['stoneDark'], HX, HY, G - 0.005, 0.18, 0.18, 0.04, outline=0.004, bevel=0)
box('harpypillar', M['stone'], HX, HY, G + 0.035, 0.13, 0.13, 0.52, outline=0.007, bevel=0)
# the burial chamber at the top with its carved frieze of harpies and the capstone
box('harpyfrieze', M['relief'], HX, HY, G + 0.55, 0.14, 0.14, 0.08, outline=0.004, bevel=0)
for j in range(3):
    rod(f'harpyfigure{j}', M['stoneDark'], (HX - 0.04 + j * 0.04, HY - 0.072, G + 0.56), (HX - 0.04 + j * 0.04, HY - 0.072, G + 0.62), 0.008, segs=6, outline=0)
box('harpycap', M['stone'], HX, HY, G + 0.625, 0.2, 0.2, 0.04, outline=0.004, bevel=0)

# ---------- the pillar tomb beside it, with its pointed lid ----------
PX, PY = -0.05, -0.2
box('pillartombbase', M['stoneDark'], PX, PY, G - 0.005, 0.14, 0.14, 0.04, outline=0.003, bevel=0)
box('pillartomb', M['stone'], PX, PY, G + 0.035, 0.1, 0.1, 0.3, outline=0.005, bevel=0)
box('sarcophagus', M['stone'], PX, PY, G + 0.33, 0.12, 0.16, 0.08, outline=0.004, bevel=0)
loft('lid', M['stoneDark'], [[(PX - 0.07, PY - 0.09, G + 0.405), (PX + 0.07, PY - 0.09, G + 0.405), (PX + 0.07, PY + 0.09, G + 0.405), (PX - 0.07, PY + 0.09, G + 0.405)],
                             [(PX - 0.004, PY - 0.1, G + 0.5), (PX + 0.004, PY - 0.1, G + 0.5), (PX + 0.004, PY + 0.1, G + 0.5), (PX - 0.004, PY + 0.1, G + 0.5)]], outline=0.004)

# ---------- broken walls and fallen columns ----------
for k in range(8):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.85, 0.85)
    if math.hypot(x, y) > 1.1 or math.hypot(x - OX, y - OY) < 0.6 or math.hypot(x - HX, y - HY) < 0.2 or math.hypot(x - PX, y - PY) < 0.2:
        continue
    box(f'ruinwall{k}', M['stoneDark'], x, y, G - 0.005, rng.uniform(0.12, 0.25), 0.04, rng.uniform(0.04, 0.1), rot_z=rng.uniform(0, math.pi), outline=0.003, bevel=0)
for k, (x, y, a) in enumerate(((-0.55, -0.55, 0.3), (0.2, -0.65, -0.4))):
    rod(f'fallencol{k}', M['stone'], (x, y, G + 0.025), (x + 0.22 * math.cos(a), y + 0.22 * math.sin(a), G + 0.025), 0.025, segs=10, outline=0.003)
rod('standingcol', M['stone'], (-0.6, 0.45, G), (-0.6, 0.45, G + 0.24), 0.022, segs=10, outline=0.003)

# ---------- trees ----------
for k, (x, y) in enumerate(((-0.85, -0.15), (0.85, -0.45), (-0.3, 0.75), (0.95, 0.55), (-0.85, 0.55))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.013, segs=6, outline=0.002)
    ball(f'tree{k}', M['olive'] if k % 2 else M['pine'], x, y, G + 0.14, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
