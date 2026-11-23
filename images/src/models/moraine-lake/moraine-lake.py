# A cartoon Moraine Lake for the country maps, built in the set's shared look (../toon.py): the
# glacier-fed lake in Banff National Park, its turquoise water under the jagged Ten Peaks with snow
# on their tops, pine forest down the slopes, the Rockpile at the lake's foot, and red canoes.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P moraine-lake.py -- moraine-lake-1024.png 1024 moraine-lake.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lake': toon('lake', '#2ec0d0', shadow_mul=(0.74, 0.86, 0.88), lift=0.4),
    'slope': toon('slope', '#7a8a6a', shadow_mul=(0.8, 0.82, 0.84)),
    'peak': toon('peak', '#8a8a90', shadow_mul=(0.82, 0.82, 0.9)),
    'peakDark': toon('peakDark', '#6e6e76', shadow_mul=(0.82, 0.82, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'rock': toon('rock', '#a8a29a', shadow_mul=(0.82, 0.82, 0.88)),
    'pine': toon('pine', '#2f6a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'canoe': toon('canoe', '#d8402c'),
    'dock': toon('dock', '#9a7a5a'),
})

G = tile(M['lake'])
before = set(bpy.data.objects)
rng = random.Random(1321)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the valley's slopes behind the lake ----------
s = loft('slopes', M['slope'], [segment(0.3, 1.4, -0.01), segment(0.42, 1.36, 0.14), segment(0.6, 1.26, 0.22)], outline=0.016, smooth=True)
s.visible_shadow = False

# ---------- the Ten Peaks: jagged five-sided spires, snow on top ----------
for k in range(10):
    a = math.radians(152 - k * 13.8)
    r = 1.05 + 0.08 * math.sin(k * 2.1)
    x, y = r * math.cos(a), r * math.sin(a) * 0.92 + 0.06
    h = 0.5 + 0.22 * abs(math.sin(k * 1.3 + 0.4))
    base = 0.2 + 0.03 * math.cos(k)
    lathe(f'peak{k}', M['peak' if k % 2 else 'peakDark'], ((base, 0), (base * 0.55, h * 0.55), (0.004, h)), G + 0.15, x, y, segs=5, outline=0.012, smooth=False)
    lathe(f'snow{k}', M['snow'], ((base * 0.5, 0), (base * 0.26, h * 0.22), (0.004, h * 0.4 + 0.012)), G + 0.15 + h * 0.6, x, y, segs=5, outline=0.006, smooth=False)

# ---------- pines down both sides ----------
for k in range(22):
    side = -1 if k % 2 else 1
    x = side * rng.uniform(0.75, 1.2)
    y = rng.uniform(-0.55, 0.55)
    if math.hypot(x, y) > 1.3:
        continue
    lathe(f'pine{k}', M['pine'], ((0.055, 0), (0.004, 0.17)), G + 0.01, x, y, segs=10, outline=0.006)
for k in range(12):
    a = math.radians(rng.uniform(40, 140))
    x, y = 0.95 * math.cos(a), 0.5 + 0.12 * math.sin(a)
    lathe(f'slopepine{k}', M['pine'], ((0.045, 0), (0.004, 0.14)), G + 0.12, x, y, segs=10, outline=0.005)

# ---------- the Rockpile at the lake's foot, a dock and canoes ----------
for k, (x, y, r) in enumerate(((-0.55, -0.75, 0.12), (-0.38, -0.85, 0.1), (-0.7, -0.6, 0.09), (-0.45, -0.65, 0.08), (-0.8, -0.78, 0.07))):
    ball(f'rockpile{k}', M['rock'], x, y, G + r * 0.4, r, outline=0.012)
box('dock', M['dock'], 0.35, -0.7, G + 0.005, 0.32, 0.08, 0.015, rot_z=0.3, outline=0.004, bevel=0)
for k, (x, y, a) in enumerate(((0.1, -0.3, 0.4), (0.45, -0.45, 0.2), (0.6, -0.15, -0.3), (-0.15, -0.1, 0.8))):
    c, s2 = math.cos(a), math.sin(a)
    loft(f'canoe{k}', M['canoe'], [[(x - 0.1 * c, y - 0.1 * s2, G), (x - 0.02 * s2, y + 0.02 * c, G), (x + 0.1 * c, y + 0.1 * s2, G), (x + 0.02 * s2, y - 0.02 * c, G)],
                                   [(x - 0.12 * c, y - 0.12 * s2, G + 0.025), (x - 0.028 * s2, y + 0.028 * c, G + 0.025), (x + 0.12 * c, y + 0.12 * s2, G + 0.025),
                                    (x + 0.028 * s2, y - 0.028 * c, G + 0.025)]], outline=0.005)

turn(before, -20)
render(G)
