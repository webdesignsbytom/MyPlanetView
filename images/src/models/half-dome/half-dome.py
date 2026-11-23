# A cartoon Yosemite for the country maps, built in the set's shared look (../toon.py): Half Dome's
# granite dome with its sheer cut face at the end of the valley, El Capitan's great wall on the
# left, Yosemite Falls dropping white down a cliff on the right, the green valley floor with the
# Merced River winding through it, and tall pines. Turned a little towards the camera.
# Run: blender -b --factory-startup -P half-dome.py -- half-dome-1024.png 1024 half-dome.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'granite': toon('granite', '#c8c4c0', shadow_mul=(0.82, 0.84, 0.9), lift=0.1),
    'graniteDark': toon('graniteDark', '#a8a4a4', shadow_mul=(0.82, 0.84, 0.9)),
    'face': toon('face', '#b4aca8', shadow_mul=(0.82, 0.84, 0.9)),
    'falls': toon('falls', '#ffffff', shadow_mul=(0.84, 0.9, 0.97), lift=0.15),
    'river': toon('river', '#4a9ac0', lift=0.3),
    'pine': toon('pine', '#2f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(2083)


def cut(cx, cy, c, r, z, n=26):
    a0 = math.asin(c / r)
    # turned a quarter: the cut (local y = c) faces +x, so the dome's profile shows its sheer drop on the right
    return [(cx - r * math.sin(a), cy + r * math.cos(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Half Dome ----------
HX, HY = 0.3, 0.55
rings = []
for j in range(9):
    t = (math.pi / 2) * j / 9
    rings.append(cut(HX, HY, -0.12, 0.13 + 0.47 * math.cos(t), 0.82 * math.sin(t) - 0.01))
dome = loft('halfdome', M['granite'], rings, outline=0.016, smooth=True)
dome.visible_shadow = False
for j, d in enumerate((-0.3, -0.1, 0.1, 0.3)):
    bar(f'facestreak{j}', M['face'], (HX + 0.124, HY + d, G + 0.05), (HX + 0.124, HY + d * 0.9, G + 0.7 - 0.6 * abs(d)), 0.05, outline=0)
lathe('domebase', M['graniteDark'], ((0.7, 0), (0.58, 0.12)), G - 0.01, HX - 0.12, HY, segs=24, outline=0.01)

# ---------- El Capitan ----------
EX, EY = -0.78, 0.25
loft('elcap', M['granite'], [[(EX - 0.3, EY - 0.22, G - 0.01), (EX + 0.22, EY - 0.22, G - 0.01), (EX + 0.28, EY + 0.25, G - 0.01), (EX - 0.25, EY + 0.3, G - 0.01)],
                             [(EX - 0.24, EY - 0.18, G + 0.55), (EX + 0.18, EY - 0.18, G + 0.55), (EX + 0.22, EY + 0.22, G + 0.55), (EX - 0.2, EY + 0.25, G + 0.55)],
                             [(EX - 0.16, EY - 0.08, G + 0.66), (EX + 0.1, EY - 0.1, G + 0.66), (EX + 0.12, EY + 0.15, G + 0.66), (EX - 0.12, EY + 0.16, G + 0.66)]],
     outline=0.014)
bar('elcapstreak', M['face'], (EX - 0.02, EY - 0.205, G + 0.05), (EX - 0.03, EY - 0.185, G + 0.52), 0.06, outline=0)

# ---------- the cliff and Yosemite Falls ----------
FX, FY = 0.85, 0.2
loft('cliff', M['graniteDark'], [[(FX - 0.22, FY - 0.15, G - 0.01), (FX + 0.25, FY - 0.15, G - 0.01), (FX + 0.25, FY + 0.3, G - 0.01), (FX - 0.22, FY + 0.3, G - 0.01)],
                                 [(FX - 0.18, FY - 0.12, G + 0.5), (FX + 0.2, FY - 0.12, G + 0.5), (FX + 0.2, FY + 0.25, G + 0.5), (FX - 0.18, FY + 0.25, G + 0.5)]],
     outline=0.012)
bar('upperfall', M['falls'], (FX, FY - 0.135, G + 0.49), (FX, FY - 0.15, G + 0.26), 0.05, outline=0.004)
bar('lowerfall', M['falls'], (FX, FY - 0.16, G + 0.24), (FX, FY - 0.17, G + 0.02), 0.06, outline=0.004)
for k in range(3):
    ball(f'mist{k}', M['falls'], FX - 0.05 + k * 0.05, FY - 0.2, G + 0.03, 0.04, outline=0.004)

# ---------- the Merced River ----------
RIV = [(-1.3, -0.45), (-0.7, -0.3), (-0.1, -0.5), (0.5, -0.32), (1.3, -0.4)]
for k in range(len(RIV) - 1):
    (x0, y0), (x1, y1) = RIV[k], RIV[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    w = 0.08
    quad = [(x0 - w * math.cos(a), y0 - w * math.sin(a)), (x1 - w * math.cos(a), y1 - w * math.sin(a)), (x1 + w * math.cos(a), y1 + w * math.sin(a)), (x0 + w * math.cos(a), y0 + w * math.sin(a))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.004) for x, y in quad]], outline=0.003)
    if k:
        lathe(f'riverjoin{k}', M['river'], ((w, 0), (w, 0.008)), G - 0.004, x0, y0, segs=12, outline=0)

# ---------- the pines ----------
for k in range(14):
    x, y = rng.uniform(-1.1, 1.1), rng.uniform(-1.0, 0.05)
    if math.hypot(x, y) > 1.2 or abs(y + 0.4) < 0.14:
        continue
    h = rng.uniform(0.24, 0.34)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.06), 0.012, segs=6, outline=0.003)
    lathe(f'pine{k}', M['pine'], ((0.065, 0), (0.045, h * 0.4), (0.004, h)), G + 0.05, x, y, segs=8, outline=0.006)

turn(before, -20)
render(G)
