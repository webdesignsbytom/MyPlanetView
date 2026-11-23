# A cartoon Museum Island for the country maps, built in the set's shared look (../toon.py): Berlin's
# island in the Spree, the Bode Museum's green copper dome at its tip, the Berlin Cathedral's great
# dome and corner towers, the Altes Museum's long row of columns facing the Lustgarten, the river
# on both sides, and a tour boat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P museum-island.py -- museum-island-1024.png 1024 museum-island.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'river': toon('river', '#4a7aa0', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'island': toon('island', '#d8d0c4', lift=0.15),
    'lawn': toon('lawn', '#7cb85a'),
    'stone': toon('stone', '#e0d4bc', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'stoneDark': toon('stoneDark', '#b8aa94', shadow_mul=(0.84, 0.82, 0.86)),
    'copper': toon('copper', '#5aa890', lift=0.15),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#3a3a44'),
    'boat': toon('boat', '#f6f4ee', lift=0.2),
    'boatGlass': toon('boatGlass', '#6a9ac8', lift=0.3),
})

G = tile(M['river'])
before = set(bpy.data.objects)

# ---------- the island ----------
FOOT = [(-1.15, 0.45), (-0.4, 0.05), (0.5, -0.3), (1.05, -0.2), (1.1, 0.25), (0.4, 0.6), (-0.6, 0.85)]
loft('island', M['island'], [[(x, y, G - 0.01) for x, y in FOOT], [(x, y, G + 0.05) for x, y in FOOT]], outline=0.008)
T = G + 0.05

# ---------- the Bode Museum at the tip ----------
BX, BY = -0.75, 0.55
lathe('bodebody', M['stoneDark'], ((0.17, 0), (0.17, 0.2)), T - 0.005, BX, BY, segs=16, outline=0.008)
box('bodewing', M['stoneDark'], BX + 0.25, BY - 0.08, T - 0.005, 0.4, 0.2, 0.18, rot_z=-0.35, outline=0.008, bevel=0)
for j in range(6):
    a = math.radians(200 + j * 25)
    box(f'bodewin{j}', M['window'], BX + 0.168 * math.cos(a), BY + 0.168 * math.sin(a), T + 0.06, 0.03, 0.006, 0.08, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('bodedrum', M['stoneDark'], ((0.11, 0), (0.11, 0.05)), T + 0.195, BX, BY, segs=16, outline=0.005)
lathe('bodedome', M['copper'], ((0.12, 0), (0.11, 0.06), (0.07, 0.12), (0.03, 0.15)), T + 0.245, BX, BY, segs=20, outline=0.007)
lathe('bodelantern', M['copper'], ((0.025, 0), (0.025, 0.04), (0.004, 0.07)), T + 0.395, BX, BY, segs=8, outline=0.003)

# ---------- the Berlin Cathedral ----------
CX, CY = 0.45, 0.05
box('cathedral', M['stone'], CX, CY, T - 0.005, 0.5, 0.38, 0.26, outline=0.011, bevel=0)
for j in range(5):
    box(f'cathwin{j}', M['window'], CX - 0.18 + j * 0.09, CY - 0.192, T + 0.08, 0.04, 0.006, 0.12, outline=0, bevel=0)
lathe('cathdrum', M['stone'], ((0.15, 0), (0.15, 0.1)), T + 0.255, CX, CY, segs=24, outline=0.007)
for j in range(12):
    a = 2 * math.pi * j / 12
    rod(f'cathcol{j}', M['stoneDark'], (CX + 0.152 * math.cos(a), CY + 0.152 * math.sin(a), T + 0.255), (CX + 0.152 * math.cos(a), CY + 0.152 * math.sin(a), T + 0.355), 0.008, segs=5, outline=0.001)
lathe('cathdome', M['copper'], ((0.16, 0), (0.155, 0.08), (0.11, 0.16), (0.05, 0.2), (0.02, 0.21)), T + 0.355, CX, CY, segs=24, outline=0.008)
lathe('cathlantern', M['copper'], ((0.03, 0), (0.03, 0.05), (0.004, 0.09)), T + 0.56, CX, CY, segs=8, outline=0.003)
ball('cathcross', M['gold'], CX, CY, T + 0.66, 0.012, outline=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = CX + sx * 0.21, CY + sy * 0.15
        box(f'cathtower{sx}{sy}', M['stone'], x, y, T + 0.25, 0.07, 0.07, 0.1, outline=0.005, bevel=0)
        lathe(f'cathtowerdome{sx}{sy}', M['copper'], ((0.045, 0), (0.035, 0.04), (0.012, 0.08)), T + 0.345, x, y, segs=12, outline=0.004)

# ---------- the Altes Museum and the Lustgarten ----------
AX, AY = 0.55, -0.35
box('altes', M['stone'], AX, AY + 0.08, T - 0.005, 0.5, 0.18, 0.15, outline=0.008, bevel=0)
for j in range(12):
    x = AX - 0.22 + j * 0.04
    rod(f'altescol{j}', M['stone'], (x, AY - 0.02, T), (x, AY - 0.02, T + 0.13), 0.009, segs=6, outline=0.002)
box('altesentab', M['stoneDark'], AX, AY + 0.0, T + 0.13, 0.5, 0.06, 0.025, outline=0.004, bevel=0)
box('lustgarten', M['lawn'], 0.05, -0.15, T - 0.004, 0.35, 0.3, 0.008, rot_z=-0.35, outline=0.003, bevel=0)

# ---------- a tour boat on the Spree ----------
box('boathull', M['boat'], -0.35, -0.55, G - 0.002, 0.34, 0.1, 0.03, rot_z=-0.35, outline=0.004, bevel=0)
box('boatcabin', M['boatGlass'], -0.35, -0.55, G + 0.025, 0.26, 0.08, 0.04, rot_z=-0.35, outline=0.003, bevel=0)

turn(before, -20)
render(G)
