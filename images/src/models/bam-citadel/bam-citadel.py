# A cartoon Arg-e Bam for the country maps, built in the set's shared look (../toon.py): the great
# mud-brick citadel in the desert of Kerman, the outer walls with their round towers round the old
# town's flat-roofed houses, and rising behind on its rock the inner citadel's walls and towers with
# the governor's tall square keep on top, all the colour of the earth. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P bam-citadel.py -- bam-citadel-1024.png 1024 bam-citadel.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#dcc898', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'mud': toon('mud', '#c8a070', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'mudDark': toon('mudDark', '#a8845a'),
    'rock': toon('rock', '#b89870'),
    'dark': flat('dark', '#4a3828'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(2567)


def wallring(name, pts, z, h, tower_r):
    for k in range(len(pts)):
        (x0, y0), (x1, y1) = pts[k], pts[(k + 1) % len(pts)]
        a = math.atan2(y1 - y0, x1 - x0)
        L = math.hypot(x1 - x0, y1 - y0)
        box(f'{name}wall{k}', M['mud'], (x0 + x1) / 2, (y0 + y1) / 2, z - 0.005, L, 0.05, h, rot_z=a, outline=0.004, bevel=0)
        n = int(L / 0.05)
        for j in range(n):
            t = (j + 0.5) / n
            box(f'{name}merlon{k}{j}', M['mudDark'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z + h - 0.005, 0.022, 0.05, 0.022, rot_z=a, outline=0, bevel=0)
        lathe(f'{name}tower{k}', M['mud'], ((tower_r + 0.008, 0), (tower_r, h + 0.04)), z - 0.005, x0, y0, segs=14, outline=0.004)
        for j in (0.33, 0.66):
            lathe(f'{name}midtower{k}{j}', M['mud'], ((tower_r * 0.7, 0), (tower_r * 0.7, h + 0.02)), z - 0.005, x0 + (x1 - x0) * j, y0 + (y1 - y0) * j, segs=12, outline=0.003)


# ---------- the outer town ----------
wallring('outer', [(-0.8, -0.55), (0.8, -0.55), (0.8, 0.15), (-0.8, 0.15)], G, 0.12, 0.045)
box('outergate', M['mud'], 0.0, -0.57, G - 0.005, 0.12, 0.08, 0.17, outline=0.004, bevel=0)
box('outergatearch', M['dark'], 0.0, -0.612, G - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)
spots = []
for k in range(200):
    x, y = rng.uniform(-0.72, 0.72), rng.uniform(-0.48, 0.08)
    if any(abs(x - px) < 0.11 and abs(y - py) < 0.1 for px, py in spots) or abs(x) < 0.08 and y < -0.35:
        continue
    spots.append((x, y))
    h = rng.uniform(0.05, 0.08)
    box(f'house{k}', M['mud'], x, y, G - 0.005, rng.uniform(0.08, 0.1), rng.uniform(0.07, 0.09), h, outline=0.003, bevel=0)
    if k % 3 == 0:
        lathe(f'housedome{k}', M['mudDark'], ((0.03, 0), (0.022, 0.018), (0.004, 0.03)), G + h - 0.005, x, y, segs=10, outline=0.002)
    if len(spots) >= 22:
        break

# ---------- the citadel on its rock ----------
RX, RY = 0.05, 0.45
rk = lathe('rock', M['rock'], ((0.42, 0), (0.34, 0.1), (0.26, 0.17), (0.22, 0.18)), G - 0.01, RX, RY, segs=10, outline=0.008, smooth=False)
rk.visible_shadow = False
T = G + 0.18
wallring('inner', [(RX - 0.2, RY - 0.12), (RX + 0.2, RY - 0.12), (RX + 0.2, RY + 0.12), (RX - 0.2, RY + 0.12)], T, 0.08, 0.035)
box('keep', M['mud'], RX, RY + 0.02, T - 0.005, 0.14, 0.14, 0.3, outline=0.006, bevel=0)
for j in range(5):
    box(f'keepmerlon{j}', M['mudDark'], RX - 0.056 + j * 0.028, RY - 0.05, T + 0.295, 0.016, 0.016, 0.025, outline=0, bevel=0)
for k in range(2):
    box(f'keepwin{k}', M['dark'], RX - 0.03 + k * 0.06, RY - 0.053, T + 0.2, 0.02, 0.006, 0.04, outline=0, bevel=0)
box('keepwing', M['mud'], RX - 0.1, RY + 0.03, T - 0.005, 0.12, 0.12, 0.16, outline=0.004, bevel=0)

for k, (x, y) in enumerate(((-0.88, 0.35), (0.9, 0.3), (-0.6, 0.7))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)
