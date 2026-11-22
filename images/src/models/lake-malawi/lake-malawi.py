# A cartoon Lake Malawi for the country maps, built in the set's shared look (../toon.py) on a tile
# of the lake's clear water: a sandy beach at Cape Maclear with its fishing village's dugout canoes
# and a rack of little fish drying in the sun, a baobab, granite islands with trees, bright cichlid
# fish in the clear shallows, and a fish eagle on a dead tree. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lake-malawi.py -- lake-malawi-1024.png 1024 lake-malawi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#2f9ac8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'shallows': toon('shallows', '#7fd0d8', shadow_mul=(0.74, 0.86, 0.88), lift=0.35),
    'sand': toon('sand', '#f0dcae', shadow_mul=(0.84, 0.78, 0.7), lift=0.25),
    'granite': toon('granite', '#b0a49a', shadow_mul=(0.8, 0.78, 0.86)),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'baobab': toon('baobab', '#a89a8a', shadow_mul=(0.8, 0.78, 0.84)),
    'wood': toon('wood', '#7a5238'),
    'woodLight': toon('woodLight', '#9a6b43'),
    'fish': flat('fish', '#d8d2c2'),
    'cichlidBlue': flat('cichlidBlue', '#2f6fd0'),
    'cichlidYellow': flat('cichlidYellow', '#f4c83c'),
    'cichlidOrange': flat('cichlidOrange', '#f08a3a'),
    'eagle': toon('eagle', '#5a3a2a'),
    'eagleWhite': toon('eagleWhite', '#f6f3ec', lift=0.2),
    'beak': toon('beak', '#f4c83c'),
    'thatch': toon('thatch', '#b08a4a', shadow_mul=(0.84, 0.74, 0.62)),
    'hutWall': toon('hutWall', '#c9a678', shadow_mul=(0.84, 0.74, 0.66)),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(367)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the beach along the left and back ----------
R = 1.42
BEACH = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(70, 231, 10)] + [(-0.95, -0.7), (-0.55, -0.15), (-0.25, 0.45), (0.2, 0.95)]
loft('beach', M['sand'], [[(x, y, G - 0.01) for x, y in BEACH], [(x, y, G + 0.05) for x, y in BEACH]], outline=0.022)

# ---------- granite islands with trees ----------
for k, (x, y, r) in enumerate(((0.65, 0.55, 0.28), (0.95, -0.25, 0.2), (0.35, -0.75, 0.14))):
    cyl(f'islandshallows{k}', M['shallows'], r * 1.5, 0.006, segs=20, outline=0, matrix=Matrix.Translation((x, y, G + 0.002)))
    for j in range(3):
        a = 2 * math.pi * j / 3 + k
        b = ball(f'islandrock{k}{j}', M['granite'], 0, 0, 0, r * 0.55, outline=0.018)
        b.scale = (1.2, 1.0, 0.75)
        b.location = (x + r * 0.35 * math.cos(a), y + r * 0.3 * math.sin(a), G + r * 0.2)
        b.visible_shadow = False
    ball(f'islandtree{k}', M['tree'], x, y + 0.03, G + r * 0.75, r * 0.45, outline=0.016)
# bright cichlids in the clear shallows by the biggest island
for k in range(9):
    a = rng.uniform(0, 2 * math.pi)
    d = rng.uniform(0.32, 0.4)
    x, y = 0.65 + d * math.cos(a), 0.55 + d * 0.9 * math.sin(a)
    mat = ('cichlidBlue', 'cichlidYellow', 'cichlidOrange')[k % 3]
    body = ball(f'cichlid{k}', M[mat], 0, 0, 0, 0.022, outline=0)
    body.scale = (1.6, 0.8, 0.3)
    body.rotation_euler = (0, 0, a + math.pi / 2)
    body.location = (x, y, G + 0.008)

# ---------- the fishing village on the beach ----------
for k, (x, y, a) in enumerate(((-0.85, -0.3, 0.6), (-0.6, 0.15, 1.0), (-1.0, -0.55, 0.3))):
    box(f'canoe{k}', M['woodLight'], x, y, G + 0.05, 0.32, 0.06, 0.035, rot_z=a, outline=0.01, bevel=0.012)
    box(f'canoehollow{k}', M['wood'], x, y, G + 0.08, 0.26, 0.035, 0.01, rot_z=a, outline=0, bevel=0)
# the drying rack and its little fish
RX, RY = -0.75, 0.35
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'rackleg{sx}{sy}', M['wood'], (RX + sx * 0.15, RY + sy * 0.07, G + 0.05), (RX + sx * 0.15, RY + sy * 0.07, G + 0.15), 0.008, segs=6, outline=0.003)
box('rack', M['wood'], RX, RY, G + 0.15, 0.34, 0.18, 0.012, outline=0.006, bevel=0)
for k in range(10):
    box(f'drying{k}', M['fish'], RX - 0.13 + (k % 5) * 0.065, RY - 0.04 + (k // 5) * 0.08, G + 0.162, 0.045, 0.02, 0.006, outline=0, bevel=0)
for k, (x, y) in enumerate(((-1.0, 0.65), (-0.6, 0.85))):
    lathe(f'hut{k}', M['hutWall'], ((0.09, 0), (0.09, 0.09)), G + 0.045, x, y, segs=16, outline=0.012)
    lathe(f'hutroof{k}', M['thatch'], ((0.12, 0), (0.06, 0.07), (0.004, 0.14)), G + 0.13, x, y, segs=16, outline=0.012)

# ---------- a baobab ----------
BX, BY = -1.05, 0.05
lathe('baobab', M['baobab'], ((0.12, 0), (0.11, 0.1), (0.08, 0.28), (0.07, 0.34)), G + 0.045, BX, BY, segs=14, outline=0.016)
for k in range(5):
    a = 2 * math.pi * k / 5
    p0 = (BX, BY, G + 0.38)
    p1 = (BX + 0.16 * math.cos(a), BY + 0.16 * math.sin(a), G + 0.47)
    rod(f'baobabbranch{k}', M['baobab'], p0, p1, 0.025, r2=0.012, segs=6, outline=0.006)
    b = ball(f'baobableaf{k}', M['tree'], 0, 0, 0, 0.07, outline=0.012)
    b.scale = (1.2, 1.2, 0.6)
    b.location = p1

# ---------- a fish eagle on a dead tree at the water's edge ----------
EX, EY = -0.15, 0.6
rod('deadtree', M['baobab'], (EX, EY, G + 0.04), (EX + 0.02, EY, G + 0.42), 0.02, r2=0.012, segs=8, outline=0.008)
rod('deadbranch', M['baobab'], (EX + 0.01, EY, G + 0.3), (EX + 0.12, EY, G + 0.4), 0.01, segs=6, outline=0.004)
ez = G + 0.42
e = ball('eaglebody', M['eagle'], 0, 0, 0, 0.04, outline=0.008)
e.scale = (0.9, 0.9, 1.3)
e.location = (EX + 0.02, EY, ez + 0.04)
ball('eaglehead', M['eagleWhite'], EX + 0.02, EY - 0.01, ez + 0.1, 0.028, outline=0.006)
rod('eaglebeak', M['beak'], (EX + 0.02, EY - 0.035, ez + 0.1), (EX + 0.02, EY - 0.055, ez + 0.09), 0.009, r2=0.002, segs=6, outline=0)
ball('eaglebreast', M['eagleWhite'], EX + 0.02, EY - 0.025, ez + 0.06, 0.025, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
