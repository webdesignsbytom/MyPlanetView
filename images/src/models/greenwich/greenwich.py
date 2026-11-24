# A cartoon Maritime Greenwich for the country maps, built in the set's shared look (../toon.py):
# the Royal Observatory on its hill in Greenwich Park, Flamsteed House's red brick with the red time
# ball on its mast and the big dome of the Great Equatorial telescope, the white Queen's House below
# with its colonnades, the Cutty Sark's black hull and three tall masts in her dock, and the Thames
# in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P greenwich.py -- greenwich-1024.png 1024 greenwich.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.72, 0.8, 0.74)),
    'river': toon('river', '#5a7a8a', lift=0.25),
    'brick': toon('brick', '#b8503a', shadow_mul=(0.86, 0.78, 0.76)),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'dome': toon('dome', '#d8d8d4', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'red': toon('red', '#d83a2a', lift=0.15),
    'lead': toon('lead', '#7a8088'),
    'hull': toon('hull', '#2e2e34'),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'wood': toon('wood', '#8a6a4a'),
    'window': flat('window', '#3a3a48'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'path': toon('path', '#d8ccb0'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('thames', M['river'], [strip(-1.25, -0.68, 1.33, -0.004), strip(-1.25, -0.68, 1.33, 0.006)], outline=0.004)

# ---------- the hill and the Observatory ----------
HX, HY = 0.2, 0.55
hl = lathe('hill', M['hill'], ((0.62, 0), (0.48, 0.12), (0.32, 0.2), (0.22, 0.22)), G - 0.01, HX, HY, segs=28, outline=0.009)
hl.visible_shadow = False
T = G + 0.21
box('flamsteed', M['brick'], HX - 0.05, HY - 0.02, T - 0.005, 0.2, 0.12, 0.13, outline=0.006, bevel=0)
for j in range(3):
    box(f'flamwin{j}', M['window'], HX - 0.11 + j * 0.06, HY - 0.082, T + 0.04, 0.025, 0.006, 0.05, outline=0, bevel=0)
for s in (-1, 1):
    lathe(f'flamturret{s}', M['lead'], ((0.03, 0), (0.025, 0.03), (0.004, 0.06)), T + 0.125, HX - 0.05 + s * 0.08, HY - 0.02, segs=10, outline=0.002)
rod('timeballmast', M['white'], (HX - 0.05, HY - 0.02, T + 0.125), (HX - 0.05, HY - 0.02, T + 0.27), 0.006, segs=6, outline=0.001)
ball('timeball', M['red'], HX - 0.05, HY - 0.02, T + 0.23, 0.028, outline=0.003)
lathe('equatorialdrum', M['brick'], ((0.08, 0), (0.08, 0.1)), T - 0.005, HX + 0.13, HY + 0.03, segs=16, outline=0.005)
lathe('equatorialdome', M['dome'], ((0.085, 0), (0.075, 0.04), (0.045, 0.075), (0.004, 0.09)), T + 0.095, HX + 0.13, HY + 0.03, segs=20, outline=0.005)

# ---------- the Queen's House ----------
QX, QY = -0.15, -0.05
box('queenshouse', M['white'], QX, QY, G - 0.005, 0.34, 0.2, 0.15, outline=0.008, bevel=0)
for r in range(2):
    for j in range(5):
        box(f'qwin{r}{j}', M['window'], QX - 0.12 + j * 0.06, QY - 0.102, G + 0.03 + r * 0.06, 0.025, 0.006, 0.04, outline=0, bevel=0)
box('qroof', M['white'], QX, QY, G + 0.145, 0.36, 0.22, 0.015, outline=0.002, bevel=0)
for s in (-1, 1):
    box(f'colonnade{s}', M['white'], QX + s * 0.32, QY + 0.02, G - 0.005, 0.28, 0.06, 0.07, outline=0.004, bevel=0)
    for j in range(5):
        box(f'colonnadegap{s}{j}', M['window'], QX + s * 0.32 - 0.11 + j * 0.055, QY - 0.012, G - 0.005, 0.03, 0.006, 0.05, outline=0, bevel=0)
bar('avenue', M['path'], (QX + 0.05, QY + 0.11, G + 0.002), (HX - 0.05, HY - 0.25, G + 0.002), 0.05, outline=0)

# ---------- the Cutty Sark ----------
CX, CY = -0.5, -0.5
loft('hull', M['hull'], [[(CX - 0.18, CY - 0.025, G + 0.0), (CX + 0.16, CY - 0.025, G + 0.0), (CX + 0.16, CY + 0.025, G + 0.0), (CX - 0.18, CY + 0.025, G + 0.0)],
                         [(CX - 0.24, CY - 0.05, G + 0.08), (CX + 0.22, CY - 0.05, G + 0.08), (CX + 0.22, CY + 0.05, G + 0.08), (CX - 0.24, CY + 0.05, G + 0.08)]], outline=0.005)
box('goldline', M['gold'], CX - 0.01, CY - 0.052, G + 0.065, 0.44, 0.004, 0.008, outline=0, bevel=0)
box('deck', M['wood'], CX - 0.01, CY, G + 0.075, 0.44, 0.09, 0.01, outline=0.001, bevel=0)
for k, (dx, h) in enumerate(((-0.13, 0.36), (0.0, 0.42), (0.12, 0.34))):
    x = CX + dx
    rod(f'mast{k}', M['wood'], (x, CY, G + 0.08), (x, CY, G + 0.08 + h), 0.008, segs=6, outline=0.001)
    for y in (0.15, 0.25, 0.33):
        if y < h:
            bar(f'yard{k}{y}', M['wood'], (x - 0.07 + y * 0.12, CY, G + 0.08 + y), (x + 0.07 - y * 0.12, CY, G + 0.08 + y), 0.006, outline=0)
bar('bowsprit', M['wood'], (CX + 0.22, CY, G + 0.08), (CX + 0.32, CY, G + 0.12), 0.008, outline=0)
for s in (-1, 1):
    bar(f'stay{s}', M['hull'], (CX, CY, G + 0.5), (CX + s * 0.22, CY, G + 0.085), 0.003, outline=0)
box('dock', M['path'], CX, CY, G - 0.005, 0.56, 0.18, 0.01, outline=0.002, bevel=0)

for k, (x, y, r) in enumerate(((0.75, 0.15, 0.1), (0.85, -0.2, 0.09), (-0.6, 0.35, 0.1), (-0.85, 0.05, 0.09), (0.55, 0.0, 0.08), (-0.3, 0.55, 0.09))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
