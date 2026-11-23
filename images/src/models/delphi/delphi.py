# A cartoon Delphi for the country maps, built in the set's shared look (../toon.py): the Tholos of
# the sanctuary of Athena, its three standing Doric columns and their piece of entablature on the
# round drum, the temple of Apollo's platform and columns above it on the slope of Parnassus, the
# grey cliffs behind, and olive trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P delphi.py -- delphi-1024.png 1024 delphi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8b07a', shadow_mul=(0.82, 0.8, 0.74), lift=0.2),
    'slope': toon('slope', '#8a9a62', shadow_mul=(0.76, 0.8, 0.74)),
    'cliff': toon('cliff', '#a8a49a', shadow_mul=(0.84, 0.84, 0.9)),
    'marble': toon('marble', '#f0ece2', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'marbleDark': toon('marbleDark', '#d8d2c4', shadow_mul=(0.8, 0.82, 0.92)),
    'olive': toon('olive', '#8a9a5a', shadow_mul=(0.76, 0.8, 0.74)),
    'trunk': toon('trunk', '#6a5a46'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1579)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Parnassus: the slope, the Phaedriades cliffs ----------
s = loft('slope', M['slope'], [segment(0.15, 1.4, -0.01), segment(0.45, 1.33, 0.18), segment(0.62, 1.24, 0.25)], outline=0.016, smooth=True)
s.visible_shadow = False
c = loft('cliffs', M['cliff'], [segment(0.62, 1.24, 0.24), segment(0.66, 1.22, 0.62), segment(0.85, 1.05, 0.66)], outline=0.016)
c.visible_shadow = False

# ---------- the temple of Apollo up the slope ----------
AX, AY, AZ = -0.3, 0.5, G + 0.17
box('apolloplatform', M['marbleDark'], AX, AY, AZ - 0.02, 0.5, 0.24, 0.05, outline=0.008, bevel=0)
for j in range(6):
    rod(f'apollocolumn{j}', M['marble'], (AX - 0.2 + j * 0.08, AY - 0.1, AZ + 0.03), (AX - 0.2 + j * 0.08, AY - 0.1, AZ + 0.16), 0.016, segs=10, outline=0.004)
for j in range(3):
    rod(f'apollostump{j}', M['marble'], (AX - 0.12 + j * 0.12, AY + 0.08, AZ + 0.03), (AX - 0.12 + j * 0.12, AY + 0.08, AZ + 0.07), 0.016, segs=10, outline=0.004)

# ---------- the Tholos ----------
TX, TY = 0.25, -0.2
lathe('krepis', M['marbleDark'], ((0.32, 0), (0.32, 0.03), (0.28, 0.03), (0.28, 0.06)), G - 0.005, TX, TY, segs=32, outline=0.01)
lathe('cella', M['marbleDark'], ((0.17, 0), (0.17, 0.05)), G + 0.055, TX, TY, segs=24, outline=0.006)
for j in range(20):
    a = 2 * math.pi * j / 20
    x, y = TX + 0.25 * math.cos(a), TY + 0.25 * math.sin(a)
    if j in (14, 15, 16):
        rod(f'column{j}', M['marble'], (x, y, G + 0.055), (x, y, G + 0.42), 0.022, r2=0.019, segs=12, outline=0.006)
        box(f'capital{j}', M['marble'], x, y, G + 0.42, 0.055, 0.055, 0.018, rot_z=a, outline=0.004, bevel=0)
    else:
        rod(f'stump{j}', M['marble'], (x, y, G + 0.055), (x, y, G + 0.055 + 0.03 * (1 + j % 3)), 0.022, segs=12, outline=0.004)
for k in range(2):
    a0, a1 = 2 * math.pi * (14 + k) / 20, 2 * math.pi * (15 + k) / 20
    x0, y0, x1, y1 = TX + 0.25 * math.cos(a0), TY + 0.25 * math.sin(a0), TX + 0.25 * math.cos(a1), TY + 0.25 * math.sin(a1)
    box(f'entablature{k}', M['marble'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.435, math.hypot(x1 - x0, y1 - y0) + 0.05, 0.06, 0.06, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.006, bevel=0)

# ---------- olive trees ----------
for k, (x, y) in enumerate(((-0.9, -0.2), (-0.65, -0.5), (0.85, -0.55), (0.95, 0.0), (-0.3, -0.75), (-1.0, 0.25), (0.75, 0.35))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.08), 0.014, segs=6, outline=0.004)
    b = ball(f'olive{k}', M['olive'], 0, 0, 0, 0.08, outline=0.01)
    b.scale = (1.3, 1.2, 0.8)
    b.location = (x + 0.02, y, G + 0.13)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
