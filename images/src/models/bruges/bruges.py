# A cartoon Bruges for the country maps, built in the set's shared look (../toon.py): the Belfry's
# brick tower and octagonal lantern over the Markt, the stepped gables of the guild houses in red
# brick and pastel, the canal in front with a tour boat and swans, and the quay's trees.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P bruges.py -- bruges-1024.png 1024 bruges.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'canal': toon('canal', '#4a8a8a', shadow_mul=(0.74, 0.84, 0.86), lift=0.3),
    'cobbles': toon('cobbles', '#b8aa94', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'quay': toon('quay', '#9a8a76', shadow_mul=(0.82, 0.8, 0.86)),
    'brick': toon('brick', '#b4704a', shadow_mul=(0.86, 0.76, 0.72)),
    'brickDark': toon('brickDark', '#8a5236', shadow_mul=(0.86, 0.76, 0.72)),
    'stoneLight': toon('stoneLight', '#e6dcc4', shadow_mul=(0.82, 0.8, 0.86), lift=0.15),
    'h0': toon('h0', '#c0503a'), 'h1': toon('h1', '#f0d8a0'), 'h2': toon('h2', '#a8c8a0'), 'h3': toon('h3', '#f2ece0', lift=0.2), 'h4': toon('h4', '#e0a080'),
    'roof': toon('roof', '#5a5654', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'clock': toon('clock', '#f0c030', lift=0.3),
    'boat': toon('boat', '#7a5236'),
    'seat': toon('seat', '#2f6fc0'),
    'swan': toon('swan', '#ffffff', shadow_mul=(0.82, 0.86, 0.95), lift=0.15),
    'beak': toon('beak', '#f08a2a'),
    'tree': toon('tree', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['cobbles'])
before = set(bpy.data.objects)
rng = random.Random(1291)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the canal across the front, its quay wall ----------
flat_face('canal', M['canal'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(198, 343, 4)], G + 0.004, outline=0.008)
box('quaywall', M['quay'], 0.0, -0.47, G - 0.004, 2.6, 0.05, 0.03, outline=0.006, bevel=0)


# ---------- the guild houses: stepped gables facing the square ----------
def house(name, x, y, w, h, mat, steps=4):
    d = 0.16
    box(name, M[mat], x, y, G - 0.005, w, d, h, outline=0.009, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 + 0.01, y - d / 2 + 0.02, G + h - 0.004), (x + w / 2 - 0.01, y - d / 2 + 0.02, G + h - 0.004),
                                     (x + w / 2 - 0.01, y + d / 2, G + h - 0.004), (x - w / 2 + 0.01, y + d / 2, G + h - 0.004)],
                                    [(x - 0.004, y - d / 2 + 0.02, G + h + 0.09), (x + 0.004, y - d / 2 + 0.02, G + h + 0.09), (x + 0.004, y + d / 2, G + h + 0.09),
                                     (x - 0.004, y + d / 2, G + h + 0.09)]], outline=0.007)
    for i in range(steps):
        sw = w * (1 - (i + 1) / (steps + 1))
        box(f'{name}step{i}', M[mat], x, y - d / 2 + 0.01, G + h - 0.006 + i * 0.026, sw, 0.022, 0.028, outline=0.004, bevel=0)
    for row in range(2):
        for j in range(2):
            box(f'{name}win{row}{j}', M['window'], x - w / 4 + j * w / 2, y - d / 2 - 0.004, G + 0.04 + row * 0.065, 0.025, 0.006, 0.035, outline=0, bevel=0)


ROW = [(-0.98, 0.13, 0.17, 'h0'), (-0.83, 0.12, 0.2, 'h1'), (-0.68, 0.13, 0.18, 'h2'), (0.32, 0.13, 0.19, 'h3'), (0.47, 0.12, 0.21, 'h4'), (0.62, 0.13, 0.17, 'h0'),
       (0.77, 0.12, 0.19, 'h1'), (0.92, 0.12, 0.16, 'h2')]
for k, (x, w, h, mat) in enumerate(ROW):
    house(f'quayhouse{k}', x, -0.32, w, h, mat)
for k, (x, w, h, mat) in enumerate(((-0.75, 0.14, 0.18, 'h3'), (-0.58, 0.13, 0.2, 'h4'), (0.55, 0.14, 0.19, 'h2'), (0.72, 0.13, 0.17, 'h3'))):
    house(f'markthouse{k}', x, 0.35, w, h, mat)

# ---------- the Belfry ----------
BX, BY = -0.15, 0.25
box('hall', M['brick'], BX, BY + 0.02, G - 0.005, 0.5, 0.3, 0.2, outline=0.012, bevel=0)
loft('hallroof', M['roof'], [[(BX - 0.25, BY - 0.13, G + 0.195), (BX + 0.25, BY - 0.13, G + 0.195), (BX + 0.25, BY + 0.17, G + 0.195), (BX - 0.25, BY + 0.17, G + 0.195)],
                             [(BX - 0.25, BY + 0.016, G + 0.27), (BX + 0.25, BY + 0.016, G + 0.27), (BX + 0.25, BY + 0.024, G + 0.27), (BX - 0.25, BY + 0.024, G + 0.27)]],
     outline=0.01)
for j in range(5):
    box(f'hallwin{j}', M['window'], BX - 0.2 + j * 0.1, BY - 0.134, G + 0.06, 0.03, 0.006, 0.08, outline=0, bevel=0)
box('belfry', M['brick'], BX, BY - 0.04, G - 0.005, 0.18, 0.18, 0.5, outline=0.014, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'turret{sx}{sy}', M['brickDark'], ((0.022, 0), (0.022, 0.06), (0.004, 0.11)), G + 0.49, BX + sx * 0.08, BY - 0.04 + sy * 0.08, segs=8, outline=0.004)
for j in range(3):
    box(f'belfrywin{j}', M['window'], BX, BY - 0.134, G + 0.15 + j * 0.11, 0.04, 0.006, 0.07, outline=0, bevel=0)
cyl('belfryclock', M['clock'], 0.035, 0.008, segs=16, outline=0.004, matrix=Matrix.Translation((BX, BY - 0.134, G + 0.44)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('lantern', M['stoneLight'], ((0.075, 0), (0.07, 0.17)), G + 0.49, BX, BY - 0.04, segs=8, outline=0.01)
for j in range(4):
    a = math.pi / 8 + j * math.pi / 4 - math.pi / 2
    box(f'lanternwin{j}', M['window'], BX + 0.068 * math.cos(a), BY - 0.04 + 0.068 * math.sin(a), G + 0.54, 0.022, 0.008, 0.07, rot_z=a + math.pi / 2, outline=0,
        bevel=0)
lathe('lanterntop', M['roof'], ((0.078, 0), (0.05, 0.03), (0.004, 0.08)), G + 0.66, BX, BY - 0.04, segs=8, outline=0.008)

# ---------- a tour boat and swans on the canal; trees on the quay ----------
TX, TY = 0.15, -0.72
loft('boat', M['boat'], [[(TX - 0.22, TY - 0.04, G - 0.002), (TX + 0.18, TY - 0.04, G - 0.002), (TX + 0.18, TY + 0.04, G - 0.002), (TX - 0.22, TY + 0.04, G - 0.002)],
                         [(TX - 0.25, TY - 0.06, G + 0.045), (TX + 0.22, TY - 0.06, G + 0.04), (TX + 0.22, TY + 0.06, G + 0.04), (TX - 0.25, TY + 0.06, G + 0.045)]], outline=0.008)
for j in range(4):
    box(f'boatseat{j}', M['seat'], TX - 0.15 + j * 0.1, TY, G + 0.04, 0.03, 0.09, 0.02, outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.55, -0.7), (-0.42, -0.82))):
    b = ball(f'swan{k}', M['swan'], 0, 0, 0, 0.035, outline=0.006)
    b.scale = (1.5, 0.9, 0.7)
    b.location = (x, y, G + 0.015)
    rod(f'swanneck{k}', M['swan'], (x + 0.04, y, G + 0.02), (x + 0.05, y, G + 0.1), 0.01, segs=8, outline=0.003)
    ball(f'swanhead{k}', M['swan'], x + 0.055, y, G + 0.105, 0.013, outline=0.003)
    bar(f'swanbeak{k}', M['beak'], (x + 0.065, y, G + 0.102), (x + 0.085, y, G + 0.096), 0.007, outline=0)
for k, x in enumerate((-0.4, 0.05, 1.08)):
    rod(f'treetrunk{k}', M['trunk'], (x, -0.4, G), (x, -0.4, G + 0.1), 0.012, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, -0.4, G + 0.15, 0.065, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
