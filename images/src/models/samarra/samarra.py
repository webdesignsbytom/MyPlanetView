# A cartoon Samarra for the country maps, built in the set's shared look (../toon.py): the Malwiya,
# the Great Mosque's spiral minaret, a tapering tower of mud brick wrapped in a ramp that winds five
# times round it to the little pavilion at the top, standing outside the mosque's long walls with
# their round buttresses, on the desert plain. Turned a little towards the camera.
# Run: blender -b --factory-startup -P samarra.py -- samarra-1024.png 1024 samarra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'desert': toon('desert', '#e0c898', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'brick': toon('brick', '#c89a68', shadow_mul=(0.86, 0.8, 0.74), lift=0.08),
    'brickDark': toon('brickDark', '#a87a50', shadow_mul=(0.86, 0.8, 0.74)),
    'door': flat('door', '#3a2a20'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['desert'])
before = set(bpy.data.objects)

# ---------- the Malwiya ----------
MX, MY = -0.1, -0.05
box('base', M['brickDark'], MX, MY, G - 0.005, 0.5, 0.5, 0.05, outline=0.008, bevel=0)
TURNS, H = 5, 0.85
R0, R1 = 0.22, 0.06
lathe('core', M['brick'], ((R0 - 0.02, 0), (R1 - 0.01, H)), G + 0.045, MX, MY, segs=24, outline=0.01)
steps = TURNS * 24
prev = None
for i in range(steps + 1):
    t = i / steps
    a = 2 * math.pi * TURNS * t - math.pi / 2
    r = R0 + (R1 - R0) * t + 0.02
    z = G + 0.045 + H * t
    pt = (MX + r * math.cos(a), MY + r * math.sin(a), z)
    if prev is not None:
        bar(f'ramp{i}', M['brickDark'], prev, pt, 0.045 * (1 - 0.5 * t) + 0.015, outline=0.003)
    prev = pt
lathe('pavilion', M['brick'], ((0.05, 0), (0.05, 0.07)), G + 0.045 + H, MX, MY, segs=12, outline=0.004)
for j in range(4):
    a = j * math.pi / 2
    box(f'pavilionarch{j}', M['door'], MX + 0.05 * math.cos(a), MY + 0.05 * math.sin(a), G + 0.055 + H, 0.02, 0.006, 0.045, rot_z=a + math.pi / 2, outline=0, bevel=0)
box('rampstart', M['brickDark'], MX, MY - 0.27, G - 0.005, 0.08, 0.12, 0.06, outline=0.004, bevel=0)

# ---------- the mosque's walls behind ----------
WY = 0.55
box('mosquewall', M['brick'], 0.1, WY, G - 0.005, 1.6, 0.06, 0.18, outline=0.008, bevel=0)
for j in range(13):
    x = -0.66 + j * 0.13
    lathe(f'buttress{j}', M['brick'], ((0.04, 0), (0.035, 0.2)), G - 0.005, x, WY - 0.03, segs=10, outline=0.003)
for s in (-1, 1):
    box(f'sidewall{s}', M['brick'], 0.1 + s * 0.78, WY + 0.25, G - 0.005, 0.06, 0.5, 0.16, outline=0.007, bevel=0)
box('gate', M['door'], 0.3, WY - 0.032, G - 0.005, 0.07, 0.006, 0.12, outline=0, bevel=0)

for k, (x, y) in enumerate(((0.8, -0.45), (1.0, -0.2), (-0.85, -0.55))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.25), 0.019, outline=0.005)

turn(before, -20)
render(G)
