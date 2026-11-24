# A cartoon Summer Palace for the country maps, built in the set's shared look (../toon.py): Beijing's
# imperial garden, Longevity Hill with the octagonal Tower of Buddhist Incense on its terrace, its
# yellow and green tiled roofs on red columns, the Long Corridor along Kunming Lake's shore, the
# white Seventeen-Arch Bridge out to its island, and the Marble Boat. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P summer-palace.py -- summer-palace-1024.png 1024 summer-palace.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#5aa0b8', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#e0d8c8', shadow_mul=(0.84, 0.82, 0.88), lift=0.15),
    'red': toon('red', '#b8302a'),
    'yellow': toon('roofYellow', '#e8b830', lift=0.25),
    'green': toon('roofGreen', '#3f8a5a'),
    'white': toon('white', '#f6f4ee', lift=0.2),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(2207)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Longevity Hill ----------
h = loft('longevityhill', M['hill'], [segment(0.15, 1.38, -0.01), segment(0.3, 1.32, 0.18), segment(0.55, 1.15, 0.36), segment(0.75, 0.95, 0.42)], outline=0.014, smooth=True)
h.visible_shadow = False
for k in range(16):
    a = rng.uniform(0.2, math.pi - 0.2)
    r = rng.uniform(0.9, 1.25)
    x, y = r * math.cos(a), r * math.sin(a)
    if abs(x) < 0.3:
        continue
    ball(f'hilltree{k}', M['tree'], x, y, G + 0.35 * (1.3 - r) / 0.4 + 0.05, 0.07, outline=0.008)


def roof(name, x, y, z, r, h, mat, segs=8):
    lathe(name, M[mat], ((r, 0), (r * 0.6, h * 0.45), (r * 0.25, h * 0.85), (0.004, h)), z, x, y, segs=segs, outline=0.006, smooth=False)


# ---------- the Tower of Buddhist Incense on its terrace ----------
TX, TY = 0.0, 0.62
box('terrace', M['stone'], TX, TY, G + 0.3, 0.62, 0.44, 0.14, outline=0.008, bevel=0)
T = G + 0.435
for tier, (r, hgt) in enumerate(((0.26, 0.17), (0.2, 0.14), (0.15, 0.12))):
    lathe(f'towerbody{tier}', M['red'], ((r * 0.85, 0), (r * 0.85, hgt)), T, TX, TY, segs=8, outline=0.006, smooth=False)
    roof(f'towerroof{tier}', TX, TY, T + hgt, r * 1.25, 0.08 if tier < 2 else 0.17, 'yellow')
    T += hgt + 0.06
lathe('towerfinial', M['yellow'], ((0.02, 0), (0.004, 0.08)), T + 0.1, TX, TY, segs=6, outline=0.002)

# ---------- the Long Corridor along the shore ----------
for k in range(10):
    x = -1.05 + k * 0.23
    y = 0.06 + 0.02 * math.sin(k)
    if abs(x) < 0.2:
        continue
    box(f'corridor{k}', M['red'], x, y, G - 0.005, 0.2, 0.06, 0.06, outline=0.004, bevel=0)
    loft(f'corridorroof{k}', M['green'], [[(x - 0.11, y - 0.045, G + 0.055), (x + 0.11, y - 0.045, G + 0.055), (x + 0.11, y + 0.045, G + 0.055), (x - 0.11, y + 0.045, G + 0.055)],
                                          [(x - 0.11, y - 0.004, G + 0.09), (x + 0.11, y - 0.004, G + 0.09), (x + 0.11, y + 0.004, G + 0.09), (x - 0.11, y + 0.004, G + 0.09)]], outline=0.004)
box('archway', M['red'], 0.0, 0.06, G - 0.005, 0.18, 0.08, 0.14, outline=0.006, bevel=0)
roof('archwayroof', 0.0, 0.06, G + 0.13, 0.14, 0.07, 'yellow', segs=4)

# ---------- the Seventeen-Arch Bridge and its island ----------
BX0, BY0, BX1, BY1 = 0.25, -0.2, 0.9, -0.75
L = math.hypot(BX1 - BX0, BY1 - BY0)
ang = math.atan2(BY1 - BY0, BX1 - BX0)
for j in range(9):
    t0, t1 = j / 9, (j + 1) / 9
    z0 = 0.025 + 0.03 * math.sin(math.pi * t0)
    z1 = 0.025 + 0.03 * math.sin(math.pi * t1)
    bar(f'bridge{j}', M['white'], (BX0 + (BX1 - BX0) * t0, BY0 + (BY1 - BY0) * t0, G + z0), (BX0 + (BX1 - BX0) * t1, BY0 + (BY1 - BY0) * t1, G + z1), 0.05, outline=0.004)
for j in range(8):
    t = (j + 0.5) / 8
    box(f'bridgearch{j}', M['lake'], BX0 + (BX1 - BX0) * t, BY0 + (BY1 - BY0) * t, G - 0.004, 0.025, 0.052, 0.02, rot_z=ang, outline=0, bevel=0)
lathe('island', M['hill'], ((0.2, 0), (0.18, 0.04)), G - 0.01, BX0 - 0.1, BY0 + 0.1, segs=18, outline=0.006)
lathe('islandpavilion', M['red'], ((0.06, 0), (0.06, 0.06)), G + 0.03, BX0 - 0.1, BY0 + 0.1, segs=8, outline=0.004, smooth=False)
roof('islandroof', BX0 - 0.1, BY0 + 0.1, G + 0.09, 0.09, 0.07, 'yellow')

# ---------- the Marble Boat ----------
MX, MY = -0.6, -0.35
box('boathull', M['white'], MX, MY, G - 0.005, 0.36, 0.11, 0.05, outline=0.006, bevel=0)
lathe('boatbow', M['white'], ((0.055, 0), (0.004, 0.12)), G - 0.005, MX - 0.18, MY, segs=4, outline=0.003, smooth=False)
box('boatdeck1', M['white'], MX + 0.02, MY, G + 0.045, 0.26, 0.09, 0.06, outline=0.005, bevel=0)
box('boatdeck2', M['white'], MX + 0.03, MY, G + 0.105, 0.18, 0.08, 0.05, outline=0.004, bevel=0)
loft('boatroof', M['green'], [[(MX - 0.07, MY - 0.05, G + 0.155), (MX + 0.13, MY - 0.05, G + 0.155), (MX + 0.13, MY + 0.05, G + 0.155), (MX - 0.07, MY + 0.05, G + 0.155)],
                              [(MX - 0.07, MY - 0.004, G + 0.19), (MX + 0.13, MY - 0.004, G + 0.19), (MX + 0.13, MY + 0.004, G + 0.19), (MX - 0.07, MY + 0.004, G + 0.19)]], outline=0.004)

turn(before, -20)
render(G)
