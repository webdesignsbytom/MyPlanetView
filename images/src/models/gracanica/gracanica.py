# A cartoon Gračanica Monastery for the country maps, built in the set's shared look (../toon.py):
# the Serbian Orthodox monastery in Kosovo, its church of stepped volumes in bands of red brick and
# pale stone, five domes on tall drums with the highest in the middle, red tiled roofs over its
# arches, the bell tower at the gate, the courtyard wall, and cypresses. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P gracanica.py -- gracanica-1024.png 1024 gracanica.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#e8dcc0', shadow_mul=(0.82, 0.8, 0.84)),
    'brick': toon('brick', '#b8603e', shadow_mul=(0.84, 0.72, 0.72)),
    'tile': toon('tileRoof', '#c4573a'),
    'lead': toon('lead', '#8a929a', shadow_mul=(0.78, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'wall': toon('wall', '#d8ccb0', shadow_mul=(0.82, 0.8, 0.84)),
    'court': toon('court', '#d9c9a8', lift=0.25),
    'cypress': toon('cypress', '#2f6e40', shadow_mul=(0.7, 0.78, 0.8)),
    'gold': toon('goldCross', '#f3b53a', shadow_mul=(0.78, 0.62, 0.55), lift=0.45),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1033)


def banded_box(name, x, y, z0, w, d, h, bands=5):
    """A block in alternating bands of pale stone and red brick."""
    for k in range(bands):
        box(f'{name}band{k}', M['stone' if k % 2 == 0 else 'brick'], x, y, z0 + k * h / bands - (0.0 if k == 0 else 0.001), w, d, h / bands + 0.002,
            outline=0.012 if k == 0 else 0.004, bevel=0)


def drum(name, x, y, z0, r, h, dome_r):
    for k in range(4):
        lathe(f'{name}band{k}', M['stone' if k % 2 == 0 else 'brick'], ((r, 0), (r, h / 4 + 0.002)), z0 + k * h / 4, x, y, segs=8, outline=0.008, smooth=False)
    for k in range(8):
        a = 2 * math.pi * k / 8 + math.pi / 8
        box(f'{name}win{k}', M['window'], x + r * 0.98 * math.cos(a), y + r * 0.98 * math.sin(a), z0 + h * 0.35, 0.012, r * 0.35, h * 0.4, rot_z=a, outline=0, bevel=0)
    lathe(f'{name}dome', M['lead'], ((dome_r, 0), (dome_r * 0.95, dome_r * 0.4), (dome_r * 0.6, dome_r * 0.85), (0.004, dome_r * 1.05)), z0 + h, x, y, segs=12, outline=0.01)
    bar(f'{name}cross', M['gold'], (x, y, z0 + h + dome_r * 1.05), (x, y, z0 + h + dome_r * 1.05 + 0.06), 0.008, outline=0.002)


# ---------- the courtyard and its wall ----------
box('court', M['court'], 0.0, 0.1, G - 0.004, 1.5, 1.2, 0.008, outline=0.004, bevel=0)
for k, (x, y, w, d) in enumerate(((0.0, 0.7, 1.5, 0.05), (-0.75, 0.1, 0.05, 1.2), (0.75, 0.1, 0.05, 1.2), (-0.45, -0.5, 0.6, 0.05), (0.45, -0.5, 0.6, 0.05))):
    box(f'courtwall{k}', M['wall'], x, y, G - 0.005, w, d, 0.09, outline=0.008, bevel=0)
    box(f'courtwallcap{k}', M['tile'], x, y, G + 0.085, w + 0.01, d + 0.02, 0.015, outline=0.003, bevel=0)

# ---------- the church: stepped banded volumes ----------
CX, CY = 0.0, 0.15
banded_box('base', CX, CY, G - 0.005, 0.58, 0.5, 0.2)
for k in range(3):
    box(f'basewin{k}', M['window'], CX - 0.16 + k * 0.16, CY - 0.254, G + 0.06, 0.035, 0.01, 0.08, outline=0, bevel=0)
box('baseroof', M['tile'], CX, CY, G + 0.195, 0.6, 0.52, 0.02, outline=0.006, bevel=0)
banded_box('upper', CX, CY, G + 0.21, 0.4, 0.34, 0.14, bands=4)
box('upperroof', M['tile'], CX, CY, G + 0.345, 0.42, 0.36, 0.02, outline=0.006, bevel=0)
drum('centraldrum', CX, CY, G + 0.36, 0.085, 0.2, 0.09)
for sx in (-1, 1):
    for sy in (-1, 1):
        drum(f'corner{sx}{sy}', CX + sx * 0.16, CY + sy * 0.13, G + 0.36, 0.05, 0.12, 0.055)

# ---------- the bell tower at the gate ----------
BX, BY = 0.0, -0.5
banded_box('belltower', BX, BY, G - 0.005, 0.14, 0.14, 0.4, bands=6)
box('belfry', M['window'], BX, BY - 0.072, G + 0.3, 0.045, 0.01, 0.06, outline=0, bevel=0)
box('gatepassage', M['window'], BX, BY - 0.072, G, 0.06, 0.01, 0.1, outline=0, bevel=0)
pyramid('belltowerroof', M['tile'], BX, BY, G + 0.395, 0.17, 0.1, outline=0.008)
bar('belltowercross', M['gold'], (BX, BY, G + 0.495), (BX, BY, G + 0.55), 0.008, outline=0.002)

# ---------- cypresses ----------
for k, (x, y) in enumerate(((-0.5, -0.2), (0.5, -0.2), (-0.5, 0.45), (0.5, 0.45), (-0.95, -0.6), (0.95, -0.6))):
    h = rng.uniform(0.26, 0.34)
    lathe(f'cypress{k}', M['cypress'], ((0.04, 0), (0.05, h * 0.3), (0.035, h * 0.75), (0.004, h)), G - 0.005, x, y, segs=10, outline=0.008)

turn(before, -20)
render(G)
