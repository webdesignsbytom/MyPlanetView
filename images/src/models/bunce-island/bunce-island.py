# A cartoon Bunce Island for the country maps, built in the set's shared look (../toon.py): the
# island in the Sierra Leone River with the ruins of the slave trade's fort, the roofless stone
# shell of the agent's house with its empty windows, the broken curtain wall with a row of rusting
# cannons along the river, trees growing through the ruins, the jetty and mangroves. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P bunce-island.py -- bunce-island-1024.png 1024 bunce-island.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#6a9ab0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'ground': toon('ground', '#8cb85a', shadow_mul=(0.72, 0.78, 0.78), lift=0.25),
    'shore': toon('shore', '#c8a878', shadow_mul=(0.82, 0.78, 0.76)),
    'stone': toon('stone', '#9a8a78', shadow_mul=(0.8, 0.8, 0.88)),
    'stoneDark': toon('stoneDark', '#7a6c5c', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#3a3030'),
    'gun': toon('gun', '#4a3a34'),
    'tree': toon('tree', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'mangrove': toon('mangrove', '#2f6e40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'wood': toon('wood', '#8a6448'),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(937)

# ---------- the island ----------
IX, IY = 0.0, 0.1
pts = [(IX + 0.95 * math.cos(t) * (1 + 0.05 * math.sin(3 * t)), IY + 0.6 * math.sin(t) * (1 + 0.05 * math.cos(2 * t))) for t in (2 * math.pi * j / 24 for j in range(24))]
loft('islandshore', M['shore'], [[(x, y, G - 0.01) for x, y in pts], [(x * 0.97, (y - IY) * 0.97 + IY, G + 0.03) for x, y in pts]], outline=0.012).visible_shadow = False
loft('islandtop', M['ground'], [[(x * 0.95, (y - IY) * 0.95 + IY, G + 0.025) for x, y in pts], [(x * 0.93, (y - IY) * 0.93 + IY, G + 0.045) for x, y in pts]],
     outline=0.008).visible_shadow = False
IZ = G + 0.045

# ---------- the agent's house: a roofless stone shell ----------
HX, HY, HW, HD = -0.15, 0.3, 0.42, 0.26
for k, (dx, dy, w, d, h) in enumerate(((0, -HD / 2, HW, 0.04, 0.24), (0, HD / 2, HW, 0.04, 0.18), (-HW / 2, 0, 0.04, HD, 0.22), (HW / 2, 0, 0.04, HD, 0.15))):
    box(f'housewall{k}', M['stone'], HX + dx, HY + dy, IZ - 0.005, w, d, h, outline=0.01, bevel=0)
for row, z in enumerate((0.03, 0.14)):
    for j in range(4):
        box(f'housewin{row}{j}', M['window'], HX - 0.15 + j * 0.1, HY - HD / 2 - 0.022, IZ + z, 0.035, 0.01, 0.06, outline=0, bevel=0)
rod('ruintreetrunk', M['trunk'], (HX + 0.05, HY + 0.02, IZ), (HX + 0.08, HY + 0.03, IZ + 0.3), 0.02, segs=8, outline=0.005)
ball('ruintree', M['tree'], HX + 0.08, HY + 0.03, IZ + 0.36, 0.12, outline=0.014)

# ---------- the broken curtain wall and the cannons along the river ----------
for k in range(9):
    x = -0.65 + k * 0.16
    if k in (3, 6):
        continue
    box(f'curtain{k}', M['stoneDark' if k % 2 else 'stone'], x, IY - 0.32, IZ - 0.005, 0.15, 0.05, rng.uniform(0.06, 0.13), outline=0.008, bevel=0)
for k in range(6):
    x = -0.55 + k * 0.2
    box(f'carriage{k}', M['stoneDark'], x, IY - 0.42, IZ - 0.005, 0.04, 0.05, 0.02, outline=0.003, bevel=0)
    rod(f'cannon{k}', M['gun'], (x, IY - 0.38, IZ + 0.025), (x + 0.01, IY - 0.5, IZ + 0.03), 0.014, r2=0.011, segs=8, outline=0.003)
box('powdermag', M['stone'], 0.45, 0.3, IZ - 0.005, 0.18, 0.14, 0.1, outline=0.01, bevel=0)
box('powdermagdoor', M['window'], 0.45, 0.228, IZ, 0.04, 0.01, 0.06, outline=0, bevel=0)

# ---------- trees, mangroves, the jetty ----------
for k, (x, y) in enumerate(((0.65, 0.45), (-0.65, 0.5), (0.75, 0.0), (-0.75, 0.1), (0.2, 0.55))):
    h = rng.uniform(0.12, 0.18)
    rod(f'trunk{k}', M['trunk'], (x, y, IZ), (x, y, IZ + h), 0.018, segs=6, outline=0.005)
    ball(f'tree{k}', M['tree'], x, y, IZ + h + 0.07, rng.uniform(0.1, 0.12), outline=0.014)
for k in range(8):
    a = math.radians(150 + k * 15)
    x, y = IX + 0.97 * math.cos(a), IY + 0.62 * math.sin(a)
    ball(f'mangrove{k}', M['mangrove'], x, y, G + 0.06, rng.uniform(0.05, 0.07), outline=0.01)
box('jetty', M['wood'], 0.5, -0.65, G + 0.03, 0.08, 0.5, 0.015, outline=0.004, bevel=0)
for k in range(4):
    rod(f'jettypost{k}', M['wood'], (0.46 + (k % 2) * 0.08, -0.45 - (k // 2) * 0.35, G - 0.01), (0.46 + (k % 2) * 0.08, -0.45 - (k // 2) * 0.35, G + 0.04), 0.008, segs=5,
        outline=0.002)

turn(before, -20)
render(G)
