# A cartoon Omar Ali Saifuddien Mosque for the country maps, built in the set's shared look
# (../toon.py): Brunei's white mosque in Bandar Seri Begawan, its golden dome and tall minaret
# rising over the artificial lagoon, the arcades round it, the stone ceremonial barge moored in the
# lagoon, the walkway across, and Kampong Ayer's stilt houses behind. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P omar-ali-saifuddien-mosque.py -- omar-ali-saifuddien-mosque-1024.png 1024 omar-ali-saifuddien-mosque.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#3fa8b8', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'marble': toon('marble', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'gold': toon('goldDome', '#f3b53a', shadow_mul=(0.78, 0.62, 0.55), lift=0.45),
    'stone': toon('stone', '#d8ccb0', shadow_mul=(0.82, 0.8, 0.84)),
    'window': flat('window', '#3a3640'),
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'stilt': toon('stilt', '#7a5a40'),
    'house1': toon('house1', '#e8c070', shadow_mul=(0.84, 0.74, 0.62)), 'house2': toon('house2', '#8ac4e0', shadow_mul=(0.74, 0.8, 0.88)),
    'roof': toon('roof', '#c4573a'), 'roof2': toon('roof2', '#5a7a8a'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['lagoon'])
before = set(bpy.data.objects)
rng = random.Random(1069)

# ---------- the mosque's terrace and lawns ----------
MX, MY = 0.0, 0.3
box('terrace', M['stone'], MX, MY, G - 0.005, 1.34, 0.64, 0.05, outline=0.012, bevel=0)
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], MX + s * 0.5, MY, G + 0.04, 0.26, 0.5, 0.008, outline=0, bevel=0)
TZ = G + 0.045

# ---------- the mosque: arcades, the prayer hall, the golden dome ----------
box('hall', M['marble'], MX, MY, TZ - 0.005, 0.62, 0.46, 0.24, outline=0.016, bevel=0)
for k in range(9):
    x = MX - 0.27 + k * 0.0675
    box(f'arcade{k}', M['window'], x, MY - 0.233, TZ + 0.035, 0.04, 0.01, 0.11, outline=0, bevel=0)
    pyramid(f'arcadetop{k}', M['window'], x, MY - 0.233, TZ + 0.145, 0.04, 0.025, outline=0)
box('roofedge', M['marble'], MX, MY, TZ + 0.23, 0.65, 0.49, 0.025, outline=0.007, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'cornerdome{sx}{sy}', M['gold'], ((0.045, 0), (0.04, 0.032), (0.016, 0.058), (0.004, 0.072)), TZ + 0.25, MX + sx * 0.27, MY + sy * 0.19, segs=12,
              outline=0.005)
lathe('drum', M['marble'], ((0.135, 0), (0.135, 0.08)), TZ + 0.25, MX, MY, segs=18, outline=0.012)
lathe('golddome', M['gold'], ((0.16, 0), (0.175, 0.07), (0.15, 0.16), (0.08, 0.24), (0.027, 0.28), (0.005, 0.31)), TZ + 0.325, MX, MY, segs=22, outline=0.014)
rod('finial', M['gold'], (MX, MY, TZ + 0.63), (MX, MY, TZ + 0.7), 0.008, segs=6, outline=0)
# the tall minaret
NX, NY = MX + 0.47, MY + 0.17
lathe('minaret', M['marble'], ((0.052, 0), (0.045, 0.68)), TZ - 0.005, NX, NY, segs=12, outline=0.009)
for k, z in enumerate((0.34, 0.6)):
    cyl(f'minaretbalcony{k}', M['marble'], 0.072, 0.02, segs=12, outline=0.005, matrix=Matrix.Translation((NX, NY, TZ + z)))
lathe('minaretdome', M['gold'], ((0.052, 0), (0.046, 0.04), (0.02, 0.08), (0.004, 0.105)), TZ + 0.672, NX, NY, segs=12, outline=0.006)

# ---------- the stone ceremonial barge in the lagoon ----------
BX, BY = -0.4, -0.55
loft('barge', M['stone'], [[(BX - 0.3, BY, G + 0.0), (BX + 0.18, BY - 0.07, G + 0.0), (BX + 0.34, BY, G + 0.0), (BX + 0.18, BY + 0.07, G + 0.0)],
                           [(BX - 0.36, BY, G + 0.1), (BX + 0.18, BY - 0.1, G + 0.07), (BX + 0.42, BY, G + 0.12), (BX + 0.18, BY + 0.1, G + 0.07)]], outline=0.012)
box('bargepavilion', M['marble'], BX + 0.06, BY, G + 0.07, 0.19, 0.12, 0.085, outline=0.007, bevel=0)
lathe('bargedome', M['gold'], ((0.06, 0), (0.048, 0.035), (0.004, 0.072)), G + 0.155, BX + 0.06, BY, segs=12, outline=0.006)
box('walkway', M['stone'], 0.42, -0.35, G + 0.02, 0.12, 0.62, 0.02, outline=0.006, bevel=0)

# ---------- Kampong Ayer's stilt houses behind ----------
for k in range(7):
    x = -0.85 + k * 0.28
    y = 1.0 - 0.05 * (k % 2)
    if math.hypot(x, y) > 1.25:
        continue
    for sx in (-1, 1):
        rod(f'stilt{k}{sx}', M['stilt'], (x + sx * 0.05, y, G - 0.01), (x + sx * 0.05, y, G + 0.05), 0.006, segs=5, outline=0.002)
    box(f'stilthouse{k}', M['house1' if k % 2 else 'house2'], x, y, G + 0.045, 0.16, 0.12, 0.07, outline=0.006, bevel=0)
    pyramid(f'stilthouseroof{k}', M['roof' if k % 2 else 'roof2'], x, y, G + 0.11, 0.18, 0.06, outline=0.006)

# ---------- palms on the terrace ----------
for k, (x, y) in enumerate(((MX - 0.58, MY - 0.2), (MX + 0.6, MY - 0.2), (MX - 0.58, MY + 0.2))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, TZ), (x + 0.03, y, TZ + h), 0.013, r2=0.01, segs=8, outline=0.005)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, TZ + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), TZ + h - 0.05), 0.019, outline=0.005)

turn(before, -20)
render(G)
