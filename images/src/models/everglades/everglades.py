# A cartoon Everglades for the country maps, built in the set's shared look (../toon.py): the river
# of grass, islands of golden sawgrass and mangroves standing on their roots in the slow water, an
# alligator basking, a great white egret, and an airboat with its big fan. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P everglades.py -- everglades-1024.png 1024 everglades.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'water': toon('water', '#6a9a8a', shadow_mul=(0.76, 0.86, 0.84), lift=0.25),
    'sawgrass': toon('sawgrass', '#b8a850', shadow_mul=(0.84, 0.82, 0.7)),
    'sawgrassGreen': toon('sawgrassGreen', '#8a9a40', shadow_mul=(0.8, 0.82, 0.7)),
    'mangrove': toon('mangrove', '#3f6a30', shadow_mul=(0.72, 0.8, 0.76)),
    'root': toon('root', '#6a5040'),
    'gator': toon('gator', '#4a5a38', shadow_mul=(0.8, 0.82, 0.8)),
    'gatorBelly': toon('gatorBelly', '#a8a878'),
    'egret': toon('egret', '#f8f8f6', lift=0.2),
    'beak': toon('beak', '#f0c030'),
    'boat': toon('boat', '#e8e4dc', lift=0.15),
    'cage': toon('cage', '#3a3a40'),
    'seat': toon('seat', '#d83a2c'),
})

G = tile(M['water'])
before = set(bpy.data.objects)
rng = random.Random(2237)


def grow(objs, f, px, py):
    """Scales a group of finished objects about a point on the ground."""
    m = Matrix.Translation((px, py, G)) @ Matrix.Scale(f, 4) @ Matrix.Translation((-px, -py, -G))
    for o in objs:
        o.matrix_world = m @ o.matrix_world


# ---------- sawgrass islands ----------
for k, (cx, cy, r) in enumerate(((-0.6, 0.45, 0.35), (0.4, 0.6, 0.32), (0.75, -0.1, 0.22), (-0.8, -0.3, 0.22), (0.0, 0.85, 0.25))):
    lathe(f'island{k}', M['sawgrassGreen'], ((r, 0), (r * 0.9, 0.025)), G - 0.006, cx, cy, segs=16, outline=0.004)
    for j in range(int(r * 40)):
        a = rng.uniform(0, 2 * math.pi)
        d = r * math.sqrt(rng.random()) * 0.9
        x, y = cx + d * math.cos(a), cy + d * math.sin(a)
        lathe(f'blade{k}{j}', M['sawgrass' if j % 3 else 'sawgrassGreen'], ((0.02, 0), (0.004, rng.uniform(0.07, 0.12))), G + 0.015, x, y, segs=4, outline=0.002, smooth=False)

# ---------- mangroves on their roots ----------
for k, (x, y) in enumerate(((-0.3, 0.2), (0.15, 0.35), (-0.95, 0.15), (0.95, 0.35))):
    for j in range(6):
        a = 2 * math.pi * j / 6
        rod(f'mangroveroot{k}{j}', M['root'], (x + 0.08 * math.cos(a), y + 0.08 * math.sin(a), G - 0.005), (x, y, G + 0.1), 0.007, segs=4, outline=0.001)
    for j, (dx, dy, dz, r) in enumerate(((0, 0, 0.17, 0.11), (0.08, 0.02, 0.15, 0.08), (-0.07, 0.03, 0.15, 0.08))):
        b = ball(f'mangrove{k}{j}', M['mangrove'], 0, 0, 0, r, outline=0.008)
        b.scale = (1.2, 1.0, 0.7)
        b.location = (x + dx, y + dy, G + dz)

# ---------- the alligator ----------
mark = set(bpy.data.objects)
AX, AY, ANG = -0.25, -0.35, 0.25
ca, sa = math.cos(ANG), math.sin(ANG)
b = ball('gatorbody', M['gator'], 0, 0, 0, 0.06, outline=0.006)
b.scale = (2.6, 0.9, 0.45)
b.rotation_euler = (0, 0, ANG)
b.location = (AX, AY, G + 0.012)
for j in range(5):
    t = -0.1 + j * 0.05
    ball(f'scute{j}', M['gator'], AX + t * ca, AY + t * sa, G + 0.038, 0.012, outline=0.001)
loft('gatorsnout', M['gator'], [[(AX + 0.14 * ca + dx * sa * -1, AY + 0.14 * sa + dx * ca, G + z) for dx, z in ((-0.03, 0.0), (0.03, 0.0), (0.03, 0.03), (-0.03, 0.03))],
                                [(AX + 0.27 * ca + dx * sa * -1, AY + 0.27 * sa + dx * ca, G + z) for dx, z in ((-0.018, 0.0), (0.018, 0.0), (0.018, 0.015), (-0.018, 0.015))]], outline=0.004)
for s in (-1, 1):
    ball(f'gatoreye{s}', M['gator'], AX + 0.15 * ca - s * 0.02 * sa, AY + 0.15 * sa + s * 0.02 * ca, G + 0.04, 0.012, outline=0.001)
rod('gatortail', M['gator'], (AX - 0.14 * ca, AY - 0.14 * sa, G + 0.012), (AX - 0.34 * ca, AY - 0.3 * sa, G + 0.006), 0.03, r2=0.006, segs=6, outline=0.003)

bpy.context.view_layer.update()
grow(set(bpy.data.objects) - mark, 1.7, AX, AY)

# ---------- the egret ----------
mark = set(bpy.data.objects)
EX, EY = 0.45, -0.45
for s in (-1, 1):
    rod(f'egretleg{s}', M['beak'], (EX + s * 0.01, EY, G), (EX + s * 0.01, EY, G + 0.08), 0.004, segs=4, outline=0)
b = ball('egretbody', M['egret'], 0, 0, 0, 0.04, outline=0.004)
b.scale = (1.5, 0.8, 0.9)
b.location = (EX, EY, G + 0.1)
rod('egretneck', M['egret'], (EX + 0.04, EY, G + 0.11), (EX + 0.05, EY, G + 0.19), 0.008, segs=5, outline=0.002)
ball('egrethead', M['egret'], EX + 0.055, EY, G + 0.195, 0.013, outline=0.002)
rod('egretbeak', M['beak'], (EX + 0.065, EY, G + 0.195), (EX + 0.11, EY, G + 0.19), 0.004, segs=4, outline=0)

bpy.context.view_layer.update()
grow(set(bpy.data.objects) - mark, 1.5, EX, EY)

# ---------- the airboat ----------
mark = set(bpy.data.objects)
BX, BY = 0.1, -0.8
box('airboathull', M['boat'], BX, BY, G - 0.002, 0.3, 0.14, 0.035, outline=0.005, bevel=0)
box('airboatseat', M['seat'], BX - 0.02, BY, G + 0.03, 0.06, 0.08, 0.06, outline=0.003, bevel=0)
cyl('airboatcage', M['cage'], 0.075, 0.025, segs=16, outline=0.003, matrix=Matrix.Translation((BX - 0.13, BY, G + 0.12)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
for s in (-1, 1):
    bar(f'airboatfan{s}', M['cage'], (BX - 0.12, BY - s * 0.06, G + 0.12 - s * 0.03), (BX - 0.12, BY + s * 0.06, G + 0.12 + s * 0.03), 0.012, outline=0)

bpy.context.view_layer.update()
grow(set(bpy.data.objects) - mark, 1.7, BX, BY)
bpy.context.view_layer.update()
turn(before, -20)
render(G)
