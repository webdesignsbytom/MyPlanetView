# A cartoon Caernarfon Castle for the country maps, built in the set's shared look (../toon.py):
# Edward I's great castle in Gwynedd, Wales, its polygonal towers banded in darker stone like
# Constantinople's walls, the Eagle Tower with its three turrets, the curtain walls along the River
# Seiont's quay where it meets the Menai Strait, the Welsh flag, and boats. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P caernarfon-castle.py -- caernarfon-castle-1024.png 1024 caernarfon-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'water': toon('water', '#3f8fb8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'quay': toon('quay', '#a8a090', shadow_mul=(0.8, 0.8, 0.88)),
    'stone': toon('stone', '#b0a898', shadow_mul=(0.8, 0.8, 0.88)),
    'band': toon('band', '#8a8274', shadow_mul=(0.8, 0.8, 0.88)),
    'window': flat('window', '#2e2a30'),
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'flagGreen': flat('flagGreen', '#00b140'), 'flagWhite': flat('flagWhite', '#ffffff'), 'flagRed': flat('flagRed', '#d30731'),
    'boat': toon('boat', '#f6f3ec', lift=0.2), 'boatBlue': toon('boatBlue', '#3f7fc0'),
    'mast': toon('mast', '#b7bcc4'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1039)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the river along the front, the quay ----------
R = 1.42
flat_face('river', M['water'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(198, 343, 6)], G + 0.004, outline=0.01)
QY = R * math.sin(math.radians(198))
box('quay', M['quay'], 0, QY + 0.05, G - 0.005, 2 * (math.sqrt(R * R - QY * QY) - 0.06), 0.1, 0.03, outline=0.008, bevel=0)


def tower(name, x, y, r, h, sides=8):
    lathe(name, M['stone'], ((r, 0), (r, h)), G - 0.005, x, y, segs=sides, outline=0.014, smooth=False)
    for k, z in enumerate((h * 0.3, h * 0.6)):
        lathe(f'{name}band{k}', M['band'], ((r + 0.004, 0), (r + 0.004, 0.025)), G + z, x, y, segs=sides, outline=0.002, smooth=False)
    for k in range(sides):
        a = 2 * math.pi * (k + 0.5) / sides
        lathe(f'{name}merlon{k}', M['stone'], ((0.018, 0), (0.018, 0.03)), G + h - 0.005, x + r * 0.85 * math.cos(a), y + r * 0.85 * math.sin(a), segs=4, outline=0.003,
              smooth=False)
    box(f'{name}slit', M['window'], x, y - r * 0.93, G + h * 0.45, 0.014, 0.01, 0.04, outline=0, bevel=0)


# ---------- the castle: curtain walls between polygonal towers ----------
TOWERS = [(-0.62, -0.15, 0.13, 0.5), (-0.2, -0.25, 0.1, 0.4), (0.2, -0.22, 0.1, 0.42), (0.62, -0.1, 0.12, 0.46), (0.55, 0.45, 0.11, 0.42), (-0.05, 0.5, 0.1, 0.4),
          (-0.55, 0.4, 0.11, 0.44)]
for k in range(len(TOWERS)):
    (x0, y0, _, _), (x1, y1, _, _) = TOWERS[k], TOWERS[(k + 1) % len(TOWERS)]
    length, a = math.hypot(x1 - x0, y1 - y0), math.atan2(y1 - y0, x1 - x0)
    box(f'curtain{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, length, 0.07, 0.3, rot_z=a, outline=0.012, bevel=0)
    box(f'curtainband{k}', M['band'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.12, length, 0.075, 0.025, rot_z=a, outline=0.002, bevel=0)
    for j in range(int(length / 0.06)):
        t = (j + 0.5) / int(length / 0.06)
        box(f'crenel{k}{j}', M['stone'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G + 0.295, 0.03, 0.075, 0.03, rot_z=a, outline=0.003, bevel=0)
box('ward', M['lawn'], 0.0, 0.12, G - 0.004, 1.1, 0.6, 0.008, outline=0, bevel=0)
for k, (x, y, r, h) in enumerate(TOWERS):
    tower(f'tower{k}', x, y, r, h, sides=10 if k == 0 else 8)
# the Eagle Tower's three turrets and the Welsh flag
EX, EY, ER, EH = TOWERS[0]
for k in range(3):
    a = 2 * math.pi * k / 3 + 0.5
    lathe(f'eagleturret{k}', M['stone'], ((0.035, 0), (0.035, 0.12)), G + EH - 0.005, EX + ER * 0.6 * math.cos(a), EY + ER * 0.6 * math.sin(a), segs=8, outline=0.006,
          smooth=False)
rod('flagpole', M['stone'], (EX, EY, G + EH), (EX, EY, G + EH + 0.22), 0.005, segs=6, outline=0)
box('flagwhite', M['flagWhite'], EX + 0.055, EY, G + EH + 0.185, 0.1, 0.006, 0.025, outline=0, bevel=0)
box('flaggreen', M['flagGreen'], EX + 0.055, EY, G + EH + 0.16, 0.1, 0.006, 0.025, outline=0, bevel=0)
box('flagdragon', M['flagRed'], EX + 0.055, EY - 0.004, G + EH + 0.17, 0.05, 0.006, 0.03, outline=0, bevel=0)
box('kingsgate', M['window'], TOWERS[5][0], TOWERS[5][1] - 0.1, G, 0.05, 0.01, 0.1, outline=0, bevel=0)

# ---------- boats on the river ----------
for k, (x, y) in enumerate(((-0.4, -0.75), (0.35, -0.85))):
    loft(f'hull{k}', M['boat'], [[(x - 0.09, y, G + 0.002), (x + 0.06, y - 0.025, G + 0.002), (x + 0.1, y, G + 0.002), (x + 0.06, y + 0.025, G + 0.002)],
                                 [(x - 0.1, y, G + 0.035), (x + 0.06, y - 0.035, G + 0.035), (x + 0.12, y, G + 0.035), (x + 0.06, y + 0.035, G + 0.035)]], outline=0.007)
    box(f'hullstripe{k}', M['boatBlue'], x + 0.01, y - 0.034, G + 0.02, 0.15, 0.006, 0.01, outline=0, bevel=0)
    rod(f'mast{k}', M['mast'], (x, y, G + 0.035), (x, y, G + 0.25), 0.004, segs=6, outline=0)

turn(before, -20)
render(G)
