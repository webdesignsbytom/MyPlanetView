# A cartoon Tower of London for the country maps, built in the set's shared look (../toon.py): the
# White Tower, its four corner turrets under lead cupolas, inside the curtain walls and their
# towers, and Tower Bridge beside it over the Thames, its two Gothic towers, blue walkways and
# suspension chains. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tower-of-london.py -- tower-of-london-1024.png 1024 tower-of-london.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a7a8a', shadow_mul=(0.76, 0.84, 0.86), lift=0.3),
    'white': toon('whiteStone', '#ece6d8', shadow_mul=(0.82, 0.82, 0.9), lift=0.15),
    'wall': toon('wall', '#c8bca4', shadow_mul=(0.82, 0.8, 0.86)),
    'lead': toon('lead', '#7a7e88', shadow_mul=(0.8, 0.82, 0.9)),
    'bridge': toon('bridgeStone', '#d8ccb0', shadow_mul=(0.82, 0.8, 0.86)),
    'blue': toon('bridgeBlue', '#4a8ac8', lift=0.2),
    'roof': toon('roof', '#4a5264'),
    'window': flat('window', '#3a3640'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(1553)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('thames', M['river'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(196, 345, 4)], G + 0.004, outline=0.01)

# ---------- the curtain walls and their towers ----------
WX, WY = -0.3, 0.35
for k, (x0, y0, x1, y1) in enumerate(((WX - 0.5, WY - 0.38, WX + 0.5, WY - 0.38), (WX + 0.5, WY - 0.38, WX + 0.5, WY + 0.42), (WX + 0.5, WY + 0.42, WX - 0.5, WY + 0.42),
                                      (WX - 0.5, WY + 0.42, WX - 0.5, WY - 0.38))):
    L = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'curtain{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, L, 0.05, 0.12, rot_z=a, outline=0.008, bevel=0)
    lathe(f'walltower{k}', M['wall'], ((0.06, 0), (0.06, 0.16)), G - 0.005, x0, y0, segs=14, outline=0.008)
box('gatehouse', M['wall'], WX + 0.1, WY - 0.38, G - 0.005, 0.14, 0.1, 0.16, outline=0.008, bevel=0)

# ---------- the White Tower ----------
TX, TY = WX, WY + 0.02
box('whitetower', M['white'], TX, TY, G - 0.005, 0.4, 0.34, 0.34, outline=0.014, bevel=0)
for row in range(3):
    for j in range(4):
        box(f'twwin{row}{j}', M['window'], TX - 0.13 + j * 0.087, TY - 0.174, G + 0.07 + row * 0.09, 0.025, 0.006, 0.045, outline=0, bevel=0)
for k, (x, y) in enumerate(((TX - 0.19, TY - 0.16), (TX + 0.19, TY - 0.16), (TX - 0.19, TY + 0.16), (TX + 0.19, TY + 0.16))):
    box(f'turret{k}', M['white'], x, y, G + 0.3, 0.07, 0.07, 0.1, outline=0.006, bevel=0)
    lathe(f'cupola{k}', M['lead'], ((0.04, 0), (0.04, 0.02), (0.025, 0.05), (0.012, 0.07), (0.003, 0.1)), G + 0.4, x, y, segs=12, outline=0.005)

# ---------- Tower Bridge over the Thames ----------
BX, BY = 0.65, -0.45
for s in (-1, 1):
    tx = BX + s * 0.22
    box(f'pier{s}', M['bridge'], tx, BY, G - 0.01, 0.14, 0.14, 0.07, outline=0.006, bevel=0)
    box(f'bridgetower{s}', M['bridge'], tx, BY, G + 0.06, 0.1, 0.1, 0.36, outline=0.01, bevel=0)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        lathe(f'bridgepinnacle{s}{k}', M['roof'], ((0.015, 0), (0.004, 0.06)), G + 0.42, tx + 0.045 * math.cos(a), BY + 0.045 * math.sin(a), segs=6, outline=0.002)
    pyramid(f'bridgeroof{s}', M['roof'], tx, BY, G + 0.42, 0.1, 0.1, outline=0.006)
    box(f'bridgearch{s}', M['window'], tx, BY - 0.052, G + 0.08, 0.04, 0.006, 0.08, outline=0, bevel=0)
box('walkway', M['blue'], BX, BY, G + 0.36, 0.36, 0.06, 0.04, outline=0.006, bevel=0)
box('bascule', M['blue'], BX, BY, G + 0.12, 0.36, 0.08, 0.02, outline=0.005, bevel=0)
for s in (-1, 1):
    for side in (-0.035, 0.035):
        pts = [(BX + s * 0.27 + s * 0.4 * t, BY + side, G + 0.36 - 0.26 * t + 0.12 * t * t) for t in (j / 5 for j in range(6))]
        for j in range(5):
            bar(f'chain{s}{side}{j}', M['blue'], pts[j], pts[j + 1], 0.016, outline=0.003)
    box(f'approach{s}', M['bridge'], BX + s * 0.48, BY, G + 0.1, 0.3, 0.08, 0.03, outline=0.005, bevel=0)

turn(before, -20)
render(G)
