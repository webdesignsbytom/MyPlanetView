# A cartoon Cedars of God for the country maps, built in the set's shared look (../toon.py): the
# old grove of Lebanon cedars high above the Qadisha valley, their great flat-tiered dark green
# crowns on stout trunks, the stone wall round the grove and its little chapel, the bare mountain
# slopes with snow on the tops, and the gorge falling away in front. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P cedars-of-god.py -- cedars-of-god-1024.png 1024 cedars-of-god.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#a8a070', shadow_mul=(0.82, 0.8, 0.74), lift=0.2),
    'mountain': toon('mountain', '#9a8e7a', shadow_mul=(0.84, 0.82, 0.86)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'gorge': toon('gorge', '#6a8a4a', shadow_mul=(0.72, 0.8, 0.74)),
    'cedar': toon('cedar', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'cedarLight': toon('cedarLight', '#3f6a46', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
    'wall': toon('wall', '#c8bca4', shadow_mul=(0.84, 0.82, 0.86)),
    'roof': toon('roof', '#c4573a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1747)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the bare mountains with snow behind ----------
mt = loft('mountain', M['mountain'], [segment(0.55, 1.38, -0.01), segment(0.75, 1.2, 0.42), segment(0.92, 1.0, 0.52)], outline=0.016, smooth=True)
mt.visible_shadow = False
sn = loft('snowcap', M['snow'], [segment(0.82, 1.13, 0.47), segment(0.93, 1.0, 0.53)], outline=0.01, smooth=True)
sn.visible_shadow = False

# ---------- the Qadisha gorge falling away at the front ----------
gorge = loft('gorge', M['gorge'], [[(1.4 * math.cos(math.radians(a)), 1.4 * math.sin(math.radians(a)), G + 0.005) for a in range(205, 336, 5)],
                                   [(1.36 * math.cos(math.radians(a)), 1.36 * math.sin(math.radians(a)) + 0.03, G + 0.012) for a in range(205, 336, 5)]], outline=0.006)
for k in range(8):
    a = math.radians(215 + k * 15)
    ball(f'gorgetree{k}', M['cedarLight'], 1.2 * math.cos(a), 1.2 * math.sin(a) + 0.08, G + 0.04, 0.05, outline=0.008)


# ---------- the cedars: stout trunks, flat tiers of foliage ----------
def cedar(name, x, y, s):
    rod(f'{name}trunk', M['trunk'], (x, y, G), (x, y, G + 0.3 * s), 0.03 * s, r2=0.018 * s, segs=8, outline=0.006)
    for i, (r, z) in enumerate(((0.2, 0.1), (0.17, 0.17), (0.13, 0.24), (0.08, 0.3))):
        cyl(f'{name}tier{i}', M['cedar' if i % 2 == 0 else 'cedarLight'], r * s, 0.035 * s, segs=14, outline=0.008,
            matrix=Matrix.Translation((x + rng.uniform(-0.01, 0.01), y, G + z * s)) @ Matrix.Scale(1.0, 4))


for k, (x, y, s) in enumerate(((-0.35, 0.15, 1.5), (0.15, 0.25, 1.6), (0.6, 0.1, 1.3), (-0.75, -0.05, 1.2), (0.25, -0.25, 1.15), (-0.2, -0.35, 1.0))):
    cedar(f'cedar{k}', x, y, s)

# ---------- the grove's wall and chapel ----------
for k in range(12):
    a = 2 * math.pi * k / 12
    x0, y0 = 0.95 * math.cos(a), 0.05 + 0.58 * math.sin(a)
    x1, y1 = 0.95 * math.cos(a + math.pi / 6), 0.05 + 0.58 * math.sin(a + math.pi / 6)
    if -0.2 < a < 0.6:
        continue
    box(f'wall{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0), 0.04, 0.05, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.004, bevel=0)
CX, CY = 0.95, 0.2
box('chapel', M['wall'], CX, CY, G - 0.005, 0.14, 0.1, 0.09, outline=0.007, bevel=0)
loft('chapelroof', M['roof'], [[(CX - 0.08, CY - 0.06, G + 0.085), (CX + 0.08, CY - 0.06, G + 0.085), (CX + 0.08, CY + 0.06, G + 0.085), (CX - 0.08, CY + 0.06, G + 0.085)],
                               [(CX - 0.08, CY - 0.004, G + 0.13), (CX + 0.08, CY - 0.004, G + 0.13), (CX + 0.08, CY + 0.004, G + 0.13), (CX - 0.08, CY + 0.004, G + 0.13)]],
     outline=0.006)

turn(before, -20)
render(G)
