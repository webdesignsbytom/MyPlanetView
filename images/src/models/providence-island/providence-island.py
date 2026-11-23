# A cartoon Providence Island for the country maps, built in the set's shared look (../toon.py):
# the little island at Monrovia's Mesurado river mouth where Liberia's founders landed in 1822, its
# monument and open-air amphitheatre among palms, mangroves at its edge, the bridge across the river
# to the city, and canoes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P providence-island.py -- providence-island-1024.png 1024 providence-island.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#5a9ab0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'ground': toon('ground', '#8cc35b', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'sand': toon('sand', '#e0cfa0', shadow_mul=(0.82, 0.8, 0.84), lift=0.2),
    'stone': toon('stone', '#d8d0c0', shadow_mul=(0.8, 0.8, 0.88)),
    'concrete': toon('concrete', '#b8b2a8', shadow_mul=(0.8, 0.8, 0.88)),
    'mangrove': toon('mangrove', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'root': toon('root', '#6b5040'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'city': toon('city', '#e8dcc8', shadow_mul=(0.8, 0.8, 0.86)),
    'roof': toon('roof', '#c4573a'),
    'canoe': toon('canoe', '#6b4a33'),
    'flagRed': flat('flagRed', '#bf0a30'), 'flagWhite': flat('flagWhite', '#ffffff'), 'flagBlue': flat('flagBlue', '#002868'),
})

G = tile(M['river'])
before = set(bpy.data.objects)
rng = random.Random(827)

# ---------- the mainland at the back, Monrovia's houses ----------
R = 1.42
back = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(28, 153, 6)]
loft('mainland', M['ground'], [[(x, y, G - 0.01) for x, y in back], [(x, y, G + 0.03) for x, y in back]], outline=0.01).visible_shadow = False
for k in range(9):
    a = math.radians(40 + k * 12.5)
    x, y = 1.18 * math.cos(a), 1.18 * math.sin(a)
    box(f'city{k}', M['city'], x, y, G + 0.025, 0.12, 0.1, rng.uniform(0.08, 0.16), rot_z=a, outline=0.008, bevel=0)

# ---------- the island ----------
IX, IY = -0.05, -0.08
isl = loft('island', M['sand'], [[(IX + 0.68 * math.cos(t) * (1 + 0.05 * math.sin(3 * t)), IY + 0.45 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 22 for j in range(22))],
                                 [(IX + 0.64 * math.cos(t) * (1 + 0.05 * math.sin(3 * t)), IY + 0.42 * math.sin(t), G + 0.03) for t in (2 * math.pi * j / 22 for j in range(22))]],
           outline=0.012)
isl.visible_shadow = False
top = loft('islandtop', M['ground'], [[(IX + 0.58 * math.cos(t) * (1 + 0.05 * math.sin(3 * t)), IY + 0.37 * math.sin(t), G + 0.025) for t in (2 * math.pi * j / 22 for j in range(22))],
                                      [(IX + 0.56 * math.cos(t) * (1 + 0.05 * math.sin(3 * t)), IY + 0.35 * math.sin(t), G + 0.045) for t in (2 * math.pi * j / 22 for j in range(22))]],
           outline=0.008)
top.visible_shadow = False
IZ = G + 0.045

# ---------- the monument and its flag ----------
MX, MY = IX - 0.25, IY + 0.05
for k in range(3):
    box(f'monumentstep{k}', M['stone'], MX, MY, IZ + k * 0.02, 0.16 - k * 0.04, 0.16 - k * 0.04, 0.022, outline=0.004, bevel=0)
loft('obelisk', M['stone'], [[(MX - 0.025, MY - 0.025, IZ + 0.06), (MX + 0.025, MY - 0.025, IZ + 0.06), (MX + 0.025, MY + 0.025, IZ + 0.06), (MX - 0.025, MY + 0.025, IZ + 0.06)],
                             [(MX - 0.015, MY - 0.015, IZ + 0.3), (MX + 0.015, MY - 0.015, IZ + 0.3), (MX + 0.015, MY + 0.015, IZ + 0.3), (MX - 0.015, MY + 0.015, IZ + 0.3)]],
     outline=0.006)
pyramid('obelisktip', M['stone'], MX, MY, IZ + 0.3, 0.03, 0.03, outline=0.003)
FX, FY = MX + 0.14, MY + 0.08
rod('flagpole', M['stone'], (FX, FY, IZ), (FX, FY, IZ + 0.32), 0.005, segs=6, outline=0)
for k in range(5):
    box(f'flagstripe{k}', M['flagRed' if k % 2 == 0 else 'flagWhite'], FX + 0.055, FY, IZ + 0.27 + k * 0.01, 0.1, 0.006, 0.01, outline=0, bevel=0)
box('flagcanton', M['flagBlue'], FX + 0.025, FY - 0.001, IZ + 0.295, 0.04, 0.007, 0.025, outline=0, bevel=0)

# ---------- the open-air amphitheatre ----------
AX, AY = IX + 0.22, IY - 0.02
for k in range(4):
    r0, r1 = 0.1 + k * 0.05, 0.15 + k * 0.05
    rings = []
    for j in range(9):
        t = math.radians(-20 + j * 220 / 8)
        rings.append([(AX + r0 * math.cos(t), AY + r0 * math.sin(t), IZ), (AX + r1 * math.cos(t), AY + r1 * math.sin(t), IZ),
                      (AX + r1 * math.cos(t), AY + r1 * math.sin(t), IZ + 0.02 + k * 0.02), (AX + r0 * math.cos(t), AY + r0 * math.sin(t), IZ + 0.02 + k * 0.02)])
    loft(f'tier{k}', M['concrete'], rings, outline=0.005)
box('stage', M['stone'], AX, AY - 0.04, IZ, 0.16, 0.08, 0.02, outline=0.004, bevel=0)

# ---------- palms and mangroves ----------
for k, (x, y) in enumerate(((IX - 0.5, IY + 0.1), (IX - 0.05, IY + 0.25), (IX + 0.45, IY + 0.2), (IX - 0.35, IY - 0.22))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, IZ), (x + 0.03, y, IZ + h), 0.013, r2=0.01, segs=8, outline=0.005)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, IZ + h), (x + 0.03 + 0.09 * math.cos(b), y + 0.09 * math.sin(b), IZ + h - 0.04), 0.018, outline=0.005)
for k in range(9):
    a = math.radians(190 + k * 20)
    x, y = IX + 0.66 * math.cos(a), IY + 0.44 * math.sin(a)
    for j in range(3):
        b = 2 * math.pi * j / 3
        rod(f'mroot{k}{j}', M['root'], (x + 0.04 * math.cos(b), y + 0.04 * math.sin(b), G), (x, y, G + 0.06), 0.005, segs=5, outline=0.002)
    ball(f'mangrove{k}', M['mangrove'], x, y, G + 0.1, rng.uniform(0.06, 0.08), outline=0.01)

# ---------- the bridge across the river, and canoes ----------
box('bridge', M['concrete'], 0.82, 0.25, G + 0.1, 0.12, 1.1, 0.03, rot_z=0.15, outline=0.008, bevel=0)
for k in range(4):
    y = -0.25 + k * 0.33
    box(f'bridgepier{k}', M['concrete'], 0.82 - y * 0.15, y + 0.25, G - 0.005, 0.07, 0.07, 0.11, outline=0.006, bevel=0)
for k, (x, y, a) in enumerate(((-0.6, -0.75, 0.3), (0.15, -0.8, -0.2))):
    c, s = math.cos(a), math.sin(a)
    at = lambda dx, dy, z: (x + dx * c - dy * s, y + dx * s + dy * c, z)
    loft(f'canoe{k}', M['canoe'], [[at(-0.14, 0, G + 0.0), at(0, -0.025, G + 0.0), at(0.14, 0, G + 0.0), at(0, 0.025, G + 0.0)],
                                   [at(-0.16, 0, G + 0.03), at(0, -0.035, G + 0.03), at(0.16, 0, G + 0.03), at(0, 0.035, G + 0.03)]], outline=0.006)

turn(before, -20)
render(G)
