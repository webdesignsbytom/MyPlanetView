# A cartoon Galata Tower for the country maps, built in the set's shared look (../toon.py): the old
# Genoese tower of rough grey stone rising over Beyoğlu's roofs, its arched windows, the gallery ringed
# round its top under the tall conical cap, the little houses with their red-tiled roofs crowding the
# hill round it, and the Golden Horn's water below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P galata-tower.py -- galata-tower-1024.png 1024 galata-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8bca8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'sea': toon('sea', '#3a7ab0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'stone': toon('stone', '#bdb4a2', shadow_mul=(0.84, 0.84, 0.9), lift=0.12),
    'stoneDark': toon('stoneDark', '#9a9282'),
    'cap': toon('cap', '#6a7a8e', shadow_mul=(0.82, 0.86, 0.94), lift=0.1),
    'window': flat('window', '#2e2e36'),
    'roof': toon('roof', '#c4603e'),
    'cream': toon('cream', '#f0e2c4', lift=0.1),
    'pink': toon('pink', '#e8b0a0', lift=0.1),
    'yellow': toon('yellow', '#ecc878', lift=0.1),
    'white': toon('white', '#f4f2ec', lift=0.15),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1348)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('goldenhorn', M['sea'], [strip(-1.41, -0.75, 1.42, -0.004), strip(-1.41, -0.75, 1.42, 0.004)], outline=0)

# ---------- the hill of houses round the tower ----------
colours = ('cream', 'pink', 'yellow', 'white')
k = 0
for row in range(6):
    y = -0.62 + row * 0.25
    for j in range(9):
        x = -1.0 + j * 0.25 + (0.12 if row % 2 else 0) + rng.uniform(-0.03, 0.03)
        if math.hypot(x, y) > 1.15 or math.hypot(x, y - 0.1) < 0.3:
            continue
        h = 0.08 + 0.02 * row + rng.uniform(0, 0.06)
        w = rng.uniform(0.15, 0.2)
        box(f'house{k}', M[colours[k % 4]], x, y, G - 0.005, w, 0.16, h, outline=0.004, bevel=0)
        for c in range(2):
            box(f'housewin{k}{c}', M['window'], x - 0.04 + c * 0.08, y - 0.083, G + h - 0.05, 0.025, 0.006, 0.03, outline=0, bevel=0)
        loft(f'houseroof{k}', M['roof'], [[(x - w / 2 - 0.005, y - 0.085, G + h - 0.005), (x + w / 2 + 0.005, y - 0.085, G + h - 0.005), (x + w / 2 + 0.005, y + 0.085, G + h - 0.005), (x - w / 2 - 0.005, y + 0.085, G + h - 0.005)],
                                          [(x - w / 2 - 0.005, y - 0.004, G + h + 0.045), (x + w / 2 + 0.005, y - 0.004, G + h + 0.045), (x + w / 2 + 0.005, y + 0.004, G + h + 0.045), (x - w / 2 - 0.005, y + 0.004, G + h + 0.045)]], outline=0.003)
        k += 1
for j, (x, y) in enumerate(((-0.35, 0.35), (0.38, -0.12), (-0.7, -0.2))):
    ball(f'tree{j}', M['tree'], x, y, G + 0.12, 0.08, outline=0.01)

# ---------- the tower ----------
TX, TY = 0.0, 0.1
R, TH = 0.17, 0.92
lathe('base', M['stoneDark'], ((R + 0.04, 0), (R + 0.02, 0.06)), G - 0.005, TX, TY, segs=28, outline=0.006)
lathe('tower', M['stone'], ((R + 0.01, 0), (R, TH)), G + 0.05, TX, TY, segs=28, outline=0.009)
for k in range(5):
    lathe(f'course{k}', M['stoneDark'], ((R + 0.003, 0), (R + 0.003, 0.006)), G + 0.15 + k * 0.15, TX, TY, segs=28, outline=0)
# the windows, small arched slits up the tower, round its turned face
for row in range(5):
    for k in range(3):
        a = -math.pi / 2 + (k - 1) * 0.6 + (0.3 if row % 2 else 0)
        x, y = TX + (R + 0.002) * math.cos(a), TY + (R + 0.002) * math.sin(a)
        box(f'win{row}{k}', M['window'], x, y, G + 0.12 + row * 0.15, 0.03, 0.03, 0.06, rot_z=a + math.pi / 2, outline=0, bevel=0)
# the top storey with its arched windows all round and the gallery
GZ = G + 0.05 + TH
lathe('gallery', M['stoneDark'], ((R + 0.06, 0), (R + 0.06, 0.02)), GZ - 0.02, TX, TY, segs=28, outline=0.004)
for k in range(28):
    a = 2 * math.pi * k / 28
    rod(f'railing{k}', M['stoneDark'], (TX + (R + 0.055) * math.cos(a), TY + (R + 0.055) * math.sin(a), GZ), (TX + (R + 0.055) * math.cos(a), TY + (R + 0.055) * math.sin(a), GZ + 0.04), 0.003, segs=4, outline=0)
lathe('topstorey', M['stone'], ((R - 0.01, 0), (R - 0.01, 0.14)), GZ, TX, TY, segs=28, outline=0.006)
for k in range(12):
    a = 2 * math.pi * k / 12
    x, y = TX + (R - 0.008) * math.cos(a), TY + (R - 0.008) * math.sin(a)
    box(f'topwin{k}', M['window'], x, y, GZ + 0.03, 0.035, 0.03, 0.08, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('eaves', M['stoneDark'], ((R + 0.01, 0), (R + 0.01, 0.015)), GZ + 0.14, TX, TY, segs=28, outline=0.003)
lathe('cap', M['cap'], ((R + 0.015, 0), (R * 0.7, 0.1), (R * 0.3, 0.24), (0.004, 0.34)), GZ + 0.15, TX, TY, segs=28, outline=0.006)
rod('finial', M['gold'], (TX, TY, GZ + 0.49), (TX, TY, GZ + 0.56), 0.006, segs=6, outline=0.001)
ball('finialball', M['gold'], TX, TY, GZ + 0.5, 0.014, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
