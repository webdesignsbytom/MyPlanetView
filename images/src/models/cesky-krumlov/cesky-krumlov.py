# A cartoon Český Krumlov for the country maps, built in the set's shared look (../toon.py): the
# castle's round tower painted pink and gold with its arcaded gallery and lantern, the castle's
# long wings on the rock above the Vltava, the river's bend round the old town's red-roofed houses
# and church, and a raft on the water. Turned a little towards the camera.
# Run: blender -b --factory-startup -P cesky-krumlov.py -- cesky-krumlov-1024.png 1024 cesky-krumlov.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a8a9a', shadow_mul=(0.74, 0.84, 0.86), lift=0.3),
    'rock': toon('rock', '#9a8e7e', shadow_mul=(0.84, 0.84, 0.9)),
    'pink': toon('pink', '#e8a8a0', shadow_mul=(0.86, 0.76, 0.8), lift=0.15),
    'gold': toon('gold', '#f0c850', lift=0.3),
    'white': toon('white', '#f4efe4', shadow_mul=(0.82, 0.82, 0.9), lift=0.2),
    'cream': toon('cream', '#f0dcb0'),
    'roof': toon('roof', '#c4573a'),
    'copper': toon('copper', '#4f9a80', shadow_mul=(0.78, 0.86, 0.84)),
    'window': flat('window', '#3a3640'),
    'raft': toon('raft', '#9a7a5a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1447)

# ---------- the Vltava's bend round the old town ----------
BC, BR = (0.1, -0.25), 0.62
prev = None
for k in range(15):
    a = math.radians(200 - k * 15)
    p = (BC[0] + BR * math.cos(a), BC[1] + BR * 0.8 * math.sin(a))
    if prev:
        ang = math.atan2(p[1] - prev[1], p[0] - prev[0]) + math.pi / 2
        w = 0.13
        quad = [(prev[0] - w * math.cos(ang), prev[1] - w * math.sin(ang)), (p[0] - w * math.cos(ang), p[1] - w * math.sin(ang)),
                (p[0] + w * math.cos(ang), p[1] + w * math.sin(ang)), (prev[0] + w * math.cos(ang), prev[1] + w * math.sin(ang))]
        loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.003) for x, y in quad]], outline=0.003)
        cyl(f'riverjoin{k}', M['river'], w, 0.007, segs=14, outline=0, matrix=Matrix.Translation((p[0], p[1], G - 0.004)))
    prev = p

# ---------- the old town inside the bend ----------
for k, (x, y) in enumerate(((-0.15, -0.35), (0.05, -0.45), (0.25, -0.35), (-0.05, -0.2), (0.2, -0.15), (0.38, -0.25), (-0.2, -0.05))):
    box(f'house{k}', M['white' if k % 2 else 'cream'], x, y, G - 0.005, 0.12, 0.1, 0.08, outline=0.007, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.075, 0.14, 0.07, outline=0.006)
box('stvitus', M['white'], 0.1, -0.05, G - 0.005, 0.1, 0.18, 0.12, outline=0.008, bevel=0)
box('stvitustower', M['white'], 0.1, -0.15, G - 0.005, 0.06, 0.06, 0.26, outline=0.008, bevel=0)
lathe('stvitusspire', M['copper'], ((0.04, 0), (0.004, 0.14)), G + 0.255, 0.1, -0.15, segs=8, outline=0.005)

# ---------- the castle on its rock, the painted tower ----------
rock = loft('castlerock', M['rock'], [[(-1.2, 0.35, G - 0.01), (0.9, 0.35, G - 0.01), (0.95, 0.75, G - 0.01), (-1.05, 0.8, G - 0.01)],
                                      [(-1.15, 0.4, G + 0.16), (0.85, 0.4, G + 0.16), (0.9, 0.72, G + 0.16), (-1.0, 0.76, G + 0.16)]], outline=0.014)
rock.visible_shadow = False
T = G + 0.16
for k, (x, w) in enumerate(((-0.75, 0.45), (-0.2, 0.4), (0.4, 0.5))):
    box(f'wing{k}', M['white' if k != 1 else 'cream'], x, 0.55, T - 0.005, w, 0.22, 0.14, outline=0.01, bevel=0)
    loft(f'wingroof{k}', M['roof'], [[(x - w / 2, 0.44, T + 0.135), (x + w / 2, 0.44, T + 0.135), (x + w / 2, 0.66, T + 0.135), (x - w / 2, 0.66, T + 0.135)],
                                     [(x - w / 2, 0.548, T + 0.2), (x + w / 2, 0.548, T + 0.2), (x + w / 2, 0.552, T + 0.2), (x - w / 2, 0.552, T + 0.2)]], outline=0.008)
    for j in range(int(w / 0.07)):
        box(f'wingwin{k}{j}', M['window'], x - w / 2 + 0.04 + j * 0.07, 0.438, T + 0.05, 0.022, 0.006, 0.035, outline=0, bevel=0)
TX, TY = -0.45, 0.42
lathe('tower', M['pink'], ((0.08, 0), (0.08, 0.34)), T - 0.005, TX, TY, segs=16, outline=0.012)
for k in range(3):
    lathe(f'towerband{k}', M['gold'], ((0.082, 0), (0.082, 0.015)), T + 0.08 + k * 0.1, TX, TY, segs=16, outline=0.002)
lathe('gallery', M['white'], ((0.095, 0), (0.095, 0.015)), T + 0.33, TX, TY, segs=16, outline=0.004)
for j in range(8):
    a = 2 * math.pi * j / 8
    rod(f'gallerypost{j}', M['white'], (TX + 0.085 * math.cos(a), TY + 0.085 * math.sin(a), T + 0.345), (TX + 0.085 * math.cos(a), TY + 0.085 * math.sin(a), T + 0.4), 0.006,
        segs=5, outline=0.002)
lathe('lanterndrum', M['pink'], ((0.065, 0), (0.065, 0.06)), T + 0.34, TX, TY, segs=12, outline=0.006)
lathe('lanternroof', M['copper'], ((0.09, 0), (0.06, 0.04), (0.035, 0.07), (0.045, 0.09), (0.02, 0.13), (0.004, 0.18)), T + 0.4, TX, TY, segs=12, outline=0.008)

# ---------- a raft, and trees ----------
box('raft', M['raft'], 0.65, -0.5, G + 0.003, 0.16, 0.07, 0.015, rot_z=1.1, outline=0.004, bevel=0)
for k, (x, y) in enumerate(((-0.95, -0.2), (-0.9, -0.55), (0.95, -0.15), (1.0, 0.15))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, rng.uniform(0.07, 0.09), outline=0.012)

turn(before, -20)
render(G)
