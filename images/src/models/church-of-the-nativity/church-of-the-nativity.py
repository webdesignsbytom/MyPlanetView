# A cartoon Church of the Nativity for the country maps, built in the set's shared look
# (../toon.py): Bethlehem's ancient basilica in pale limestone, its fortress-like front with the
# tiny Door of Humility, the long nave under its lead roof, the Franciscan bell tower with its cross,
# the convent buildings round it, Manger Square in front, the town's stone houses on the hills, and
# olive trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P church-of-the-nativity.py -- church-of-the-nativity-1024.png 1024 church-of-the-nativity.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'hill': toon('hill', '#c8b484', shadow_mul=(0.84, 0.78, 0.72), lift=0.25),
    'limestone': toon('limestone', '#e2d2b0', shadow_mul=(0.82, 0.8, 0.84)),
    'limestoneDark': toon('limestoneDark', '#cbb890', shadow_mul=(0.82, 0.8, 0.84)),
    'lead': toon('lead', '#8a929a', shadow_mul=(0.78, 0.8, 0.88)),
    'square': toon('square', '#ddd0b4', lift=0.25),
    'window': flat('window', '#3a3640'),
    'olive': toon('olive', '#7a9a5a', shadow_mul=(0.72, 0.78, 0.78)),
    'trunk': toon('trunk', '#7a6048'),
    'gold': toon('goldCross', '#f3b53a', shadow_mul=(0.78, 0.62, 0.55), lift=0.45),
})

G = tile(M['hill'])
before = set(bpy.data.objects)
rng = random.Random(911)

# ---------- Manger Square ----------
box('mangersquare', M['square'], 0.0, -0.55, G - 0.004, 1.1, 0.5, 0.008, outline=0.005, bevel=0)

# ---------- the basilica ----------
BX, BY = -0.05, 0.25
box('narthex', M['limestoneDark'], BX, BY - 0.3, G - 0.005, 0.34, 0.12, 0.24, outline=0.016, bevel=0)
box('doorofhumility', M['window'], BX, BY - 0.362, G, 0.04, 0.01, 0.06, outline=0, bevel=0)
box('oldarch', M['limestone'], BX, BY - 0.361, G + 0.065, 0.12, 0.008, 0.05, outline=0, bevel=0)
for s in (-1, 1):
    box(f'buttress{s}', M['limestoneDark'], BX + s * 0.19, BY - 0.33, G - 0.005, 0.06, 0.08, 0.22, outline=0.008, bevel=0)
box('nave', M['limestone'], BX, BY + 0.02, G - 0.005, 0.3, 0.46, 0.26, outline=0.016, bevel=0)
loft('naveroof', M['lead'], [[(BX - 0.165, BY - 0.21, G + 0.255), (BX + 0.165, BY - 0.21, G + 0.255), (BX + 0.165, BY + 0.25, G + 0.255), (BX - 0.165, BY + 0.25, G + 0.255)],
                             [(BX - 0.004, BY - 0.21, G + 0.34), (BX + 0.004, BY - 0.21, G + 0.34), (BX + 0.004, BY + 0.25, G + 0.34), (BX - 0.004, BY + 0.25, G + 0.34)]],
     outline=0.012)
for s in (-1, 1):
    box(f'aisle{s}', M['limestone'], BX + s * 0.22, BY + 0.05, G - 0.005, 0.14, 0.4, 0.17, outline=0.012, bevel=0)
    box(f'aisleroof{s}', M['lead'], BX + s * 0.22, BY + 0.05, G + 0.165, 0.15, 0.41, 0.02, outline=0.004, bevel=0)
    for k in range(3):
        box(f'clerestory{s}{k}', M['window'], BX + s * 0.152, BY - 0.1 + k * 0.12, G + 0.2, 0.01, 0.03, 0.04, outline=0, bevel=0)
box('apse', M['limestone'], BX, BY + 0.32, G - 0.005, 0.5, 0.14, 0.22, outline=0.012, bevel=0)

# ---------- the Franciscan bell tower and the convent ----------
TX, TY = BX + 0.35, BY - 0.18
box('belltower', M['limestone'], TX, TY, G - 0.005, 0.12, 0.12, 0.44, outline=0.012, bevel=0)
box('belfry', M['window'], TX, TY - 0.062, G + 0.34, 0.04, 0.01, 0.06, outline=0, bevel=0)
pyramid('towerroof', M['lead'], TX, TY, G + 0.435, 0.14, 0.08, outline=0.008)
bar('crossupright', M['gold'], (TX, TY, G + 0.51), (TX, TY, G + 0.59), 0.01, outline=0.002)
bar('crossbar', M['gold'], (TX - 0.025, TY, G + 0.565), (TX + 0.025, TY, G + 0.565), 0.01, outline=0.002)
for k, (x, y, w, d, h) in enumerate(((BX + 0.45, BY + 0.15, 0.24, 0.3, 0.18), (BX - 0.42, BY + 0.05, 0.22, 0.34, 0.2), (BX - 0.4, BY - 0.3, 0.18, 0.18, 0.14))):
    box(f'convent{k}', M['limestoneDark'], x, y, G - 0.005, w, d, h, outline=0.012, bevel=0)
    for j in range(2):
        box(f'conventwin{k}{j}', M['window'], x - w / 4 + j * w / 2, y - d / 2 - 0.004, G + h * 0.55, 0.025, 0.01, 0.04, outline=0, bevel=0)

# ---------- the town's stone houses on the hills, olive trees ----------
for k, (x, y) in enumerate(((-0.95, 0.4), (-0.8, 0.75), (-0.45, 0.92), (0.45, 0.92), (0.8, 0.7), (1.0, 0.25), (-1.05, -0.05))):
    box(f'house{k}', M['limestone' if k % 2 else 'limestoneDark'], x, y, G - 0.005, 0.16, 0.14, rng.uniform(0.1, 0.16), outline=0.01, bevel=0)
    box(f'housewin{k}', M['window'], x, y - 0.074, G + 0.05, 0.03, 0.01, 0.04, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.6, -0.55), (0.6, -0.5), (-0.85, -0.45), (0.85, -0.35), (0.0, -0.95))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.1), 0.016, segs=6, outline=0.005)
    ball(f'olive{k}', M['olive'], x + 0.02, y, G + 0.15, rng.uniform(0.08, 0.1), outline=0.012)

turn(before, -20)
render(G)
