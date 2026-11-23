# A cartoon Shore Temple for the country maps, built in the set's shared look (../toon.py):
# Mahabalipuram's granite temple on the beach, its two stepped pyramid towers rising in tiers to
# their octagonal capstones, the low enclosure wall lined with seated Nandi bulls, palms on the sand
# and the Bay of Bengal behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P shore-temple.py -- shore-temple-1024.png 1024 shore-temple.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e0cc98', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'granite': toon('granite', '#a89888', shadow_mul=(0.84, 0.84, 0.88), lift=0.06),
    'granDark': toon('granDark', '#887868'),
    'bull': toon('bull', '#9a8a7a'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
    'dark': flat('dark', '#3a3430'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('sea', M['sea'], [strip(0.62, 1.3, 1.33, -0.004), strip(0.62, 1.3, 1.33, 0.006)], outline=0.004)

box('platform', M['granDark'], 0.0, 0.05, G - 0.005, 1.1, 0.8, 0.04, outline=0.005, bevel=0)
P = G + 0.035

# ---------- the enclosure wall and its bulls ----------
for name, (x, y, sx, sy) in {'left': (-0.52, 0.05, 0.04, 0.74), 'right': (0.52, 0.05, 0.04, 0.74), 'back': (0.0, 0.42, 1.08, 0.04),
                             'frontL': (-0.33, -0.32, 0.42, 0.04), 'frontR': (0.33, -0.32, 0.42, 0.04)}.items():
    box(f'wall{name}', M['granite'], x, y, P - 0.005, sx, sy, 0.07, outline=0.004, bevel=0)
spots = [(x, -0.32, 0) for x in (-0.48, -0.36, -0.24, 0.24, 0.36, 0.48)] + [(s * 0.52, y, 1) for s in (-1, 1) for y in (-0.2, -0.06, 0.08, 0.22, 0.36)]
for k, (x, y, side) in enumerate(spots):
    Z = P + 0.065
    b = ball(f'bullbody{k}', M['bull'], 0, 0, 0, 0.028, outline=0.003)
    b.scale = (1.4, 0.85, 0.8) if side == 0 else (0.85, 1.4, 0.8)
    b.location = (x, y, Z + 0.018)
    hx, hy = (x + 0.035, y) if side == 0 else (x, y - 0.035)
    ball(f'bullhead{k}', M['bull'], hx, hy, Z + 0.035, 0.016, outline=0.002)
    ball(f'bullhump{k}', M['bull'], (x + hx) / 2, (y + hy) / 2, Z + 0.04, 0.012, outline=0.001)


# ---------- the two towers ----------
def vimana(name, x, y, base, tiers, th):
    z = P
    box(f'{name}base', M['granite'], x, y, z - 0.005, base, base, th * 1.4, outline=0.007, bevel=0)
    box(f'{name}niche', M['dark'], x, y - base / 2 - 0.003, z + 0.02, base * 0.28, 0.006, th * 0.9, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'{name}pilaster{s}', M['granDark'], x + s * base * 0.33, y - base / 2 - 0.003, z, 0.022, 0.006, th * 1.3, outline=0, bevel=0)
    z += th * 1.4
    w = base
    for i in range(tiers):
        box(f'{name}cornice{i}', M['granDark'], x, y, z - 0.005, w * 1.07, w * 1.07, 0.022, outline=0.003, bevel=0)
        w *= 0.8
        box(f'{name}tier{i}', M['granite'], x, y, z + 0.012, w, w, th, outline=0.005, bevel=0)
        for sx in (-1, 1):
            for sy in (-1, 1):
                box(f'{name}knob{i}{sx}{sy}', M['granDark'], x + sx * w * 0.42, y + sy * w * 0.42, z + 0.012 + th, 0.03, 0.03, 0.03, outline=0.001, bevel=0)
        box(f'{name}tierniche{i}', M['dark'], x, y - w / 2 - 0.003, z + 0.03, w * 0.22, 0.006, th * 0.55, outline=0, bevel=0)
        z += th + 0.017
    lathe(f'{name}cap', M['granite'], ((w * 0.55, 0), (w * 0.62, w * 0.25), (w * 0.3, w * 0.62), (0.004, w * 0.78)), z, x, y, segs=8, outline=0.004, smooth=False)
    rod(f'{name}finial', M['granDark'], (x, y, z + w * 0.75), (x, y, z + w * 0.75 + 0.06), 0.01, segs=6, outline=0.001)


box('mandapa', M['granite'], -0.04, 0.05, P - 0.005, 0.2, 0.16, 0.13, outline=0.005, bevel=0)
vimana('big', 0.2, 0.12, 0.3, 5, 0.09)
vimana('small', -0.27, -0.04, 0.2, 3, 0.07)

# ---------- palms and rocks on the shore ----------
for k, (x, y) in enumerate(((-0.85, -0.3), (0.85, -0.45), (-0.78, 0.38), (0.82, 0.3))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)
for k, (x, y, r) in enumerate(((-0.45, 0.62, 0.06), (-0.3, 0.66, 0.045), (0.35, 0.63, 0.055), (0.55, 0.6, 0.04))):
    ball(f'shorerock{k}', M['granDark'], x, y, G + r * 0.3, r, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
