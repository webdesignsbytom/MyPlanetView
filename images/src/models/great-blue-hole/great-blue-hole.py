# A cartoon Great Blue Hole for the country maps, built in the set's shared look (../toon.py):
# Belize's round, deep-blue sinkhole in the turquoise shallows of Lighthouse Reef, its ring of reef
# and surf, coral heads in the shallows, Half Moon Caye's sand and palms with its lighthouse, and a
# dive boat over the edge. Turned a little towards the camera.
# Run: blender -b --factory-startup -P great-blue-hole.py -- great-blue-hole-1024.png 1024 great-blue-hole.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'shallows': toon('shallows', '#5fd0d8', shadow_mul=(0.74, 0.84, 0.9), lift=0.35),
    'reef': toon('reef', '#9ae4dc', shadow_mul=(0.76, 0.86, 0.9), lift=0.3),
    'deep': toon('deep', '#123f7a', shadow_mul=(0.8, 0.84, 0.92), lift=0.2),
    'mid': toon('mid', '#2468a8', shadow_mul=(0.78, 0.84, 0.92), lift=0.25),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'sand': toon('sand', '#f2e6c8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'coralPink': toon('coralPink', '#f08a8a'), 'coralYellow': toon('coralYellow', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'coralPurple': toon('coralPurple', '#a88ad0'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'red': toon('red', '#d0402f'),
    'boat': toon('boat', '#f6f3ec', lift=0.2), 'boatBlue': toon('boatBlue', '#3f7fc0'),
})

G = tile(M['shallows'])
before = set(bpy.data.objects)
rng = random.Random(661)

# ---------- the hole: rings of reef, then darker and darker blue ----------
HX, HY = -0.05, 0.05
for k, (r, mat, z) in enumerate(((0.66, 'reef', 0.002), (0.58, 'foam', 0.004), (0.54, 'mid', 0.006), (0.4, 'deep', 0.008))):
    cyl(f'holering{k}', M[mat], r, 0.006, segs=40, outline=0.006 if k == 0 else 0, matrix=Matrix.Translation((HX, HY, G + z)))

# ---------- coral heads in the shallows ----------
for k in range(26):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.72, 1.25)
    x, y = HX + r * math.cos(a), HY + r * math.sin(a)
    if math.hypot(x, y) > 1.3 or (x > 0.45 and y > 0.35):
        continue
    ball(f'coral{k}', M[('coralPink', 'coralYellow', 'coralPurple')[k % 3]], x, y, G - 0.005, rng.uniform(0.025, 0.045), outline=0.005)

# ---------- Half Moon Caye, its palms and lighthouse ----------
CX, CY = 0.75, 0.72
loft('caye', M['sand'], [[(CX + 0.38 * math.cos(t), CY + 0.2 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 18 for j in range(18))],
                         [(CX + 0.32 * math.cos(t), CY + 0.16 * math.sin(t), G + 0.03) for t in (2 * math.pi * j / 18 for j in range(18))]], outline=0.01).visible_shadow = False
for k, (x, y) in enumerate(((CX - 0.2, CY), (CX + 0.05, CY + 0.06), (CX + 0.2, CY - 0.04))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.03), (x + 0.03, y, G + 0.03 + h), 0.013, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + 0.03 + h), (x + 0.03 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), G + h - 0.02), 0.018, outline=0.005)
LX, LY = CX - 0.05, CY - 0.06
lathe('lighthouse', M['white'], ((0.04, 0), (0.03, 0.26)), G + 0.03, LX, LY, segs=12, outline=0.008)
for k, z in enumerate((0.08, 0.17)):
    lathe(f'lighthouseband{k}', M['red'], ((0.038, 0), (0.035, 0.03)), G + 0.03 + z, LX, LY, segs=12, outline=0.003)
lathe('lantern', M['red'], ((0.036, 0), (0.036, 0.02), (0.004, 0.06)), G + 0.29, LX, LY, segs=12, outline=0.006)

# ---------- a dive boat at the edge of the hole ----------
BX, BY = -0.55, -0.6
loft('boathull', M['boat'], [[(BX - 0.13, BY, G + 0.002), (BX + 0.08, BY - 0.035, G + 0.002), (BX + 0.14, BY, G + 0.002), (BX + 0.08, BY + 0.035, G + 0.002)],
                             [(BX - 0.15, BY, G + 0.045), (BX + 0.08, BY - 0.05, G + 0.045), (BX + 0.17, BY, G + 0.045), (BX + 0.08, BY + 0.05, G + 0.045)]], outline=0.008)
box('boatstripe', M['boatBlue'], BX + 0.01, BY - 0.047, G + 0.02, 0.2, 0.006, 0.012, outline=0, bevel=0)
box('boatcabin', M['white'], BX - 0.03, BY, G + 0.04, 0.09, 0.07, 0.05, outline=0.006, bevel=0)
box('boatroof', M['boatBlue'], BX - 0.03, BY, G + 0.09, 0.11, 0.08, 0.01, outline=0.004, bevel=0)
for k in range(3):
    ball(f'bubble{k}', M['foam'], -0.25 + k * 0.05, -0.42 - k * 0.02, G + 0.01, 0.012, outline=0.002)

turn(before, -20)
render(G)
