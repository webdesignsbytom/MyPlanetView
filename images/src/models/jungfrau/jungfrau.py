# A cartoon Jungfrau-Aletsch for the country maps, built in the set's shared look (../toon.py): the
# Jungfrau, the Mönch and the Eiger white with snow over their dark rock, the Sphinx observatory on
# its ridge at the Jungfraujoch, and the Great Aletsch Glacier flowing away from them, its dark
# moraine stripes running down the ice. Turned a little towards the camera.
# Run: blender -b --factory-startup -P jungfrau.py -- jungfrau-1024.png 1024 jungfrau.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'rockGround': toon('rockGround', '#9a968e', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'rock': toon('rock', '#6e6a68', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'ice': toon('ice', '#e2f0f8', shadow_mul=(0.8, 0.88, 0.96), lift=0.2),
    'moraine': toon('moraine', '#6a645e'),
    'meadow': toon('meadow', '#7aa84a', shadow_mul=(0.7, 0.78, 0.8)),
    'sphinx': toon('sphinx', '#c8ccd2', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#3a4a64'),
    'pine': toon('pine', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['rockGround'])
before = set(bpy.data.objects)
rng = random.Random(1361)


def mountain(name, x, y, rx, ry, h, snow_from=0.45, segs=7):
    lathe(name, M['rock'], ((rx, 0), (rx * 0.6, h * 0.45), (rx * 0.25, h * 0.8), (0.004, h)), G - 0.01, x, y, segs=segs, outline=0.016, smooth=False)
    lathe(f'{name}snow', M['snow'], ((rx * 0.6 * 1.04, 0), (rx * 0.25 * 1.06, h * 0.35), (0.004, h * (1 - snow_from) + 0.01)), G - 0.01 + h * snow_from, x, y, segs=segs,
          outline=0.01, smooth=False)


# ---------- the three peaks at the back ----------
mountain('jungfrau', -0.45, 0.62, 0.48, 0.4, 0.92)
mountain('monch', 0.25, 0.78, 0.4, 0.34, 0.78, snow_from=0.5)
mountain('eiger', 0.85, 0.48, 0.32, 0.3, 0.68, snow_from=0.62)
# the Sphinx observatory on the ridge between the Jungfrau and the Mönch
SX, SY, SZ = -0.08, 0.6, G + 0.44
lathe('sphinxrock', M['rock'], ((0.09, 0), (0.06, 0.08), (0.03, 0.12)), SZ - 0.1, SX, SY, segs=7, outline=0.008, smooth=False)
box('sphinx', M['sphinx'], SX, SY, SZ + 0.01, 0.08, 0.07, 0.06, outline=0.006, bevel=0)
lathe('sphinxdome', M['sphinx'], ((0.035, 0), (0.03, 0.02), (0.004, 0.04)), SZ + 0.07, SX, SY, segs=14, outline=0.004)
box('sphinxwin', M['window'], SX, SY - 0.037, SZ + 0.03, 0.06, 0.006, 0.02, outline=0, bevel=0)

# ---------- the Aletsch Glacier, flowing towards the front ----------
PATH = [(-0.1, 0.4), (0.0, 0.15), (0.12, -0.12), (0.2, -0.4), (0.25, -0.7), (0.22, -0.98)]
WIDTH = [0.42, 0.42, 0.4, 0.36, 0.32, 0.28]
for k in range(len(PATH) - 1):
    (x0, y0), (x1, y1) = PATH[k], PATH[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    w0, w1 = WIDTH[k] / 2, WIDTH[k + 1] / 2
    quad = [(x0 - w0 * math.cos(a), y0 - w0 * math.sin(a)), (x1 - w1 * math.cos(a), y1 - w1 * math.sin(a)), (x1 + w1 * math.cos(a), y1 + w1 * math.sin(a)),
            (x0 + w0 * math.cos(a), y0 + w0 * math.sin(a))]
    loft(f'glacier{k}', M['ice'], [[(x, y, G - 0.005) for x, y in quad], [(x, y, G + 0.035) for x, y in quad]], outline=0.008)
    for f in (-0.35, 0.3):
        bar(f'moraine{k}{f}', M['moraine'], (x0 + f * w0 * math.cos(a), y0 + f * w0 * math.sin(a), G + 0.037), (x1 + f * w1 * math.cos(a), y1 + f * w1 * math.sin(a), G + 0.037),
            0.018, outline=0)

# ---------- meadows and pines at the sides ----------
for s in (-1, 1):
    m = loft(f'meadow{s}', M['meadow'], [[(s * 0.55 + 0.4 * math.cos(t) * 0.9, -0.55 + 0.35 * math.sin(t), G - 0.005) for t in (2 * math.pi * j / 20 for j in range(20))],
                                          [(s * 0.55 + 0.37 * math.cos(t) * 0.9, -0.55 + 0.32 * math.sin(t), G + 0.02) for t in (2 * math.pi * j / 20 for j in range(20))]],
             outline=0.008)
    m.visible_shadow = False
    for k in range(5):
        x = s * (0.55 + rng.uniform(-0.25, 0.25))
        y = -0.55 + rng.uniform(-0.2, 0.2)
        lathe(f'pine{s}{k}', M['pine'], ((0.05, 0), (0.004, 0.15)), G + 0.015, x, y, segs=10, outline=0.006)

turn(before, -20)
render(G)
