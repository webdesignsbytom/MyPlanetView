# A cartoon Castel Nuovo for the country maps, built in the set's shared look (../toon.py): Naples'
# Maschio Angioino, the grey stone castle with its great round towers on flared bases and
# battlements, the white marble triumphal arch of Alfonso of Aragon set between the two front
# towers, the bay in front and Vesuvius rising behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P castel-nuovo.py -- castel-nuovo-1024.png 1024 castel-nuovo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'stone': toon('stone', '#8a8680', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'stoneDark': toon('stoneDark', '#6a6660'),
    'marble': toon('marble', '#f2ece0', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'tuff': toon('tuff', '#c8b890'),
    'volcano': toon('volcano', '#8a7a6a', shadow_mul=(0.8, 0.8, 0.86)),
    'dark': flat('dark', '#2a2622'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('bay', M['sea'], [strip(-1.25, -0.62, 1.33, -0.004), strip(-1.25, -0.62, 1.33, 0.006)], outline=0.004)
vs = lathe('vesuvius', M['volcano'], ((0.38, 0), (0.27, 0.2), (0.15, 0.36), (0.1, 0.38)), G - 0.01, 0.55, 0.7, segs=20, outline=0.008)
vs.visible_shadow = False
lathe('somma', M['volcano'], ((0.3, 0), (0.2, 0.18), (0.12, 0.24)), G - 0.01, 0.25, 0.9, segs=16, outline=0.006).visible_shadow = False

# ---------- the castle ----------
TOWERS = [(-0.24, -0.12), (0.24, -0.12), (-0.36, 0.38), (0.36, 0.38), (0.0, 0.48)]
for name, (a, b) in {'front': (0, 1), 'left': (0, 2), 'right': (1, 3), 'backl': (2, 4), 'backr': (4, 3)}.items():
    (x0, y0), (x1, y1) = TOWERS[a], TOWERS[b]
    ang = math.atan2(y1 - y0, x1 - x0)
    box(f'curtain{name}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0), 0.09, 0.28, rot_z=ang, outline=0.008, bevel=0)
box('courtyardfill', M['stone'], 0.0, 0.18, G - 0.005, 0.5, 0.5, 0.26, outline=0.006, bevel=0)
for k, (x, y) in enumerate(TOWERS):
    lathe(f'tower{k}', M['stone'], ((0.14, 0), (0.11, 0.1), (0.1, 0.4)), G - 0.005, x, y, segs=24, outline=0.008)
    lathe(f'towerbelt{k}', M['stoneDark'], ((0.105, 0), (0.105, 0.015)), G + 0.1, x, y, segs=24, outline=0)
    for j in range(10):
        a = 2 * math.pi * j / 10
        box(f'merlon{k}{j}', M['stoneDark'], x + 0.09 * math.cos(a), y + 0.09 * math.sin(a), G + 0.39, 0.035, 0.03, 0.045, rot_z=a + math.pi / 2, outline=0.001, bevel=0)

# ---------- the triumphal arch ----------
AY = -0.17
box('arch', M['marble'], 0.0, AY, G - 0.005, 0.18, 0.06, 0.5, outline=0.006, bevel=0)
box('archopening', M['dark'], 0.0, AY - 0.032, G - 0.005, 0.07, 0.006, 0.12, outline=0, bevel=0)
cyl('archopeningtop', M['dark'], 0.035, 0.006, segs=14, outline=0, matrix=Matrix.Translation((0.0, AY - 0.032, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    for z0, z1 in ((0.0, 0.17), (0.25, 0.36)):
        rod(f'archcol{s}{z0}', M['marble'], (s * 0.065, AY - 0.04, G + z0), (s * 0.065, AY - 0.04, G + z1), 0.01, segs=8, outline=0.001)
box('frieze', M['tuff'], 0.0, AY - 0.033, G + 0.18, 0.16, 0.006, 0.05, outline=0, bevel=0)
box('upperarch', M['dark'], 0.0, AY - 0.032, G + 0.26, 0.05, 0.006, 0.07, outline=0, bevel=0)
cyl('upperarchtop', M['dark'], 0.025, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0.0, AY - 0.032, G + 0.33)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(3):
    lathe(f'archstatue{j}', M['marble'], ((0.012, 0), (0.008, 0.05)), G + 0.495, -0.05 + j * 0.05, AY, segs=6, outline=0.001)

for k, (x, y) in enumerate(((-0.75, -0.3), (0.75, -0.35), (-0.8, 0.2))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)
