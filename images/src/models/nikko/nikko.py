# A cartoon Nikkō for the country maps, built in the set's shared look (../toon.py): the Tōshō-gū
# shrine's Yōmeimon gate, white and gold with its brackets in every colour under two tiers of black
# roof with golden ridge ends, the stone lanterns of its approach, the giant cedars, and the
# vermilion Shinkyō bridge arching over the Daiya River below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nikko.py -- nikko-1024.png 1024 nikko.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'moss': toon('moss', '#6a9a48', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'gravel': toon('gravel', '#d8d4c8', lift=0.15),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'black': toon('black', '#2e2a30'),
    'red': toon('vermilion', '#d8402c'),
    'teal': toon('teal', '#2fa0a0'),
    'stone': toon('stone', '#a8a49c', shadow_mul=(0.84, 0.84, 0.88)),
    'river': toon('river', '#4a9ab0', lift=0.3),
    'cedar': toon('cedar', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a3a'),
})

G = tile(M['moss'])
before = set(bpy.data.objects)

box('approach', M['gravel'], 0.0, -0.05, G - 0.004, 0.32, 0.9, 0.01, outline=0.003, bevel=0)

# ---------- the Yōmeimon gate ----------
YX, YY = 0.0, 0.35
box('gateplatform', M['stone'], YX, YY, G - 0.005, 0.6, 0.34, 0.05, outline=0.006, bevel=0)
for sx in range(4):
    for sy in (-1, 1):
        x = YX - 0.21 + sx * 0.14
        rod(f'post{sx}{sy}', M['white'], (x, YY + sy * 0.11, G + 0.045), (x, YY + sy * 0.11, G + 0.25), 0.018, segs=8, outline=0.003)
box('gatebody', M['white'], YX, YY, G + 0.045, 0.06, 0.2, 0.2, outline=0.003, bevel=0)
for j in range(9):
    box(f'bracket{j}', M[('gold', 'red', 'teal')[j % 3]], YX - 0.24 + j * 0.06, YY - 0.13, G + 0.25, 0.05, 0.04, 0.04, outline=0.002, bevel=0)
box('beam', M['gold'], YX, YY, G + 0.24, 0.6, 0.28, 0.02, outline=0.003, bevel=0)


def roof(name, z, w, d, h, ridge):
    loft(name, M['black'], [[(YX - w / 2, YY - d / 2, z), (YX + w / 2, YY - d / 2, z), (YX + w / 2, YY + d / 2, z), (YX - w / 2, YY + d / 2, z)],
                            [(YX - ridge / 2, YY - 0.01, z + h), (YX + ridge / 2, YY - 0.01, z + h), (YX + ridge / 2, YY + 0.01, z + h), (YX - ridge / 2, YY + 0.01, z + h)]], outline=0.007)
    for s in (-1, 1):
        lathe(f'{name}end{s}', M['gold'], ((0.02, 0), (0.004, 0.05)), z + h - 0.005, YX + s * ridge / 2, YY, segs=5, outline=0.002, smooth=False)


roof('roofLower', G + 0.29, 0.78, 0.46, 0.09, 0.45)
box('upperstorey', M['white'], YX, YY, G + 0.37, 0.44, 0.24, 0.09, outline=0.005, bevel=0)
for j in range(6):
    box(f'upperbracket{j}', M[('teal', 'gold', 'red')[j % 3]], YX - 0.19 + j * 0.076, YY - 0.122, G + 0.38, 0.05, 0.006, 0.06, outline=0, bevel=0)
roof('roofUpper', G + 0.455, 0.62, 0.4, 0.14, 0.3)
arch = [(YX + 0.1 * math.cos(math.pi * j / 10), YY - 0.21, G + 0.46 + 0.05 * math.sin(math.pi * j / 10)) for j in range(11)]
loft('karahafu', M['black'], [arch, [(x, YY - 0.12, z + 0.02) for x, _, z in arch]], outline=0.005)

# ---------- stone lanterns ----------
for s in (-1, 1):
    for j in range(3):
        x, y = s * 0.24, -0.1 - j * 0.22
        lathe(f'lanternbase{s}{j}', M['stone'], ((0.035, 0), (0.02, 0.04), (0.015, 0.1)), G - 0.005, x, y, segs=6, outline=0.003, smooth=False)
        box(f'lanternbox{s}{j}', M['stone'], x, y, G + 0.095, 0.05, 0.05, 0.04, outline=0.002, bevel=0)
        pyramid(f'lanterncap{s}{j}', M['stone'], x, y, G + 0.135, 0.08, 0.04, outline=0.002)

# ---------- the cedars ----------
for k, (x, y) in enumerate(((-0.55, 0.15), (0.55, 0.2), (-0.5, 0.6), (0.5, 0.65), (-0.75, -0.2), (0.78, -0.15), (-0.2, 0.85), (0.25, 0.85))):
    rod(f'cedartrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.022, segs=6, outline=0.003)
    lathe(f'cedar{k}', M['cedar'], ((0.08, 0), (0.06, 0.2), (0.004, 0.52)), G + 0.08, x, y, segs=8, outline=0.006)

# ---------- the river and the Shinkyō bridge ----------
box('river', M['river'], 0.0, -0.85, G - 0.003, 2.4, 0.22, 0.012, outline=0.003, bevel=0)
BX = 0.55
pts = [(BX + 0.2 * math.cos(math.pi * (1 - j / 8)), -0.85, G + 0.04 + 0.07 * math.sin(math.pi * j / 8)) for j in range(9)]
for side in (-1, 1):
    for j in range(8):
        a, b = pts[j], pts[j + 1]
        bar(f'bridgedeck{side}{j}', M['red'], (a[0], a[1] + side * 0.03, a[2]), (b[0], b[1] + side * 0.03, b[2]), 0.035, outline=0.003)
        rod(f'bridgepost{side}{j}', M['red'], (a[0], a[1] + side * 0.05, a[2]), (a[0], a[1] + side * 0.05, a[2] + 0.04), 0.005, segs=4, outline=0)
for s in (-1, 1):
    box(f'abutment{s}', M['stone'], BX + s * 0.2, -0.85, G - 0.005, 0.06, 0.12, 0.05, outline=0.003, bevel=0)

turn(before, -20)
render(G)
