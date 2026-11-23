# A cartoon Monticello for the country maps, built in the set's shared look (../toon.py): Thomas
# Jefferson's house on its hilltop lawn, the red brick front with its tall white-framed windows and
# white balustrade, the white portico of four columns under its pediment with the round window, and
# the octagonal dome with its round windows above, framed by big trees and the oval walk on the
# lawn. Turned a little towards the camera.
# Run: blender -b --factory-startup -P monticello.py -- monticello-1024.png 1024 monticello.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'brick': toon('brick', '#a8442e', shadow_mul=(0.86, 0.78, 0.76)),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'roof': toon('roof', '#6a6a70'),
    'dome': toon('dome', '#d8d8d0', shadow_mul=(0.84, 0.84, 0.9), lift=0.12),
    'window': flat('window', '#3a4050'),
    'path': toon('path', '#d8ccb0'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4a40'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)


def window(name, x, y, z, w=0.05, h=0.12):
    box(f'{name}frame', M['white'], x, y - 0.003, z, w + 0.016, 0.006, h + 0.016, outline=0, bevel=0)
    box(f'{name}glass', M['window'], x, y - 0.006, z + 0.008, w, 0.006, h, outline=0, bevel=0)


# ---------- the wings ----------
for s in (-1, 1):
    wx = s * 0.45
    box(f'wing{s}', M['brick'], wx, 0.32, G - 0.005, 0.4, 0.3, 0.17, outline=0.008, bevel=0)
    for j, x in enumerate((0.33, 0.45, 0.57)):
        window(f'wingwin{s}{j}', s * x, 0.17, G + 0.02)
    box(f'wingcornice{s}', M['white'], wx, 0.32, G + 0.16, 0.42, 0.32, 0.025, outline=0.003, bevel=0)
    for j in range(9):
        rod(f'baluster{s}{j}', M['white'], (wx - 0.19 + j * 0.0475, 0.165, G + 0.185), (wx - 0.19 + j * 0.0475, 0.165, G + 0.215), 0.006, segs=4, outline=0)
    box(f'wingrail{s}', M['white'], wx, 0.165, G + 0.212, 0.42, 0.014, 0.012, outline=0.001, bevel=0)
    loft(f'wingroof{s}', M['roof'], [[(wx - 0.19, 0.18, G + 0.18), (wx + 0.19, 0.18, G + 0.18), (wx + 0.19, 0.46, G + 0.18), (wx - 0.19, 0.46, G + 0.18)],
                                     [(wx - 0.12, 0.26, G + 0.24), (wx + 0.12, 0.26, G + 0.24), (wx + 0.12, 0.38, G + 0.24), (wx - 0.12, 0.38, G + 0.24)]], outline=0.004)

# ---------- the middle block, its dome and portico ----------
box('middle', M['brick'], 0.0, 0.3, G - 0.005, 0.5, 0.42, 0.24, outline=0.009, bevel=0)
box('middlecornice', M['white'], 0.0, 0.3, G + 0.23, 0.52, 0.44, 0.025, outline=0.003, bevel=0)
for s in (-1, 1):
    window(f'middlewin{s}', s * 0.19, 0.09, G + 0.04, 0.05, 0.14)
loft('middleroof', M['roof'], [[(-0.25, 0.09, G + 0.25), (0.25, 0.09, G + 0.25), (0.25, 0.51, G + 0.25), (-0.25, 0.51, G + 0.25)],
                               [(-0.2, 0.14, G + 0.3), (0.2, 0.14, G + 0.3), (0.2, 0.46, G + 0.3), (-0.2, 0.46, G + 0.3)]], outline=0.005)
DX, DY = 0.0, 0.32
lathe('drum', M['brick'], ((0.19, 0), (0.19, 0.12)), G + 0.25, DX, DY, segs=8, outline=0.006, smooth=False)
lathe('drumcornice', M['white'], ((0.2, 0), (0.2, 0.02)), G + 0.365, DX, DY, segs=8, outline=0.002, smooth=False)
for j, a in enumerate((math.radians(247.5), math.radians(292.5))):
    r = 0.19 * math.cos(math.pi / 8)
    p = (DX + r * math.cos(a), DY + r * math.sin(a), G + 0.31)
    cyl(f'oculus{j}', M['white'], 0.035, 0.006, segs=16, outline=0, matrix=Matrix.Translation(p) @ Matrix.Rotation(a - math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    p2 = (DX + (r + 0.004) * math.cos(a), DY + (r + 0.004) * math.sin(a), G + 0.31)
    cyl(f'oculusglass{j}', M['window'], 0.024, 0.006, segs=16, outline=0, matrix=Matrix.Translation(p2) @ Matrix.Rotation(a - math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
lathe('dome', M['dome'], ((0.2, 0), (0.17, 0.07), (0.1, 0.13), (0.004, 0.15)), G + 0.38, DX, DY, segs=16, outline=0.006)
lathe('lantern', M['white'], ((0.03, 0), (0.03, 0.04), (0.004, 0.06)), G + 0.52, DX, DY, segs=8, outline=0.002)

PY = -0.02
box('platform', M['brick'], 0.0, PY, G - 0.005, 0.34, 0.24, 0.04, outline=0.004, bevel=0)
for k in range(3):
    box(f'step{k}', M['brick'], 0.0, PY - 0.13 - k * 0.025, G - 0.005, 0.18, 0.03, 0.03 - k * 0.01, outline=0.002, bevel=0)
box('door', M['window'], 0.0, 0.087, G + 0.035, 0.08, 0.006, 0.13, outline=0, bevel=0)
for j, x in enumerate((-0.13, -0.045, 0.045, 0.13)):
    rod(f'column{j}', M['white'], (x, PY - 0.1, G + 0.035), (x, PY - 0.1, G + 0.2), 0.017, segs=12, outline=0.002)
box('entablature', M['white'], 0.0, PY, G + 0.2, 0.34, 0.24, 0.032, outline=0.003, bevel=0)
loft('pediment', M['white'], [[(-0.17, PY - 0.12, G + 0.23), (0.17, PY - 0.12, G + 0.23), (0.17, 0.1, G + 0.23), (-0.17, 0.1, G + 0.23)],
                              [(-0.004, PY - 0.12, G + 0.31), (0.004, PY - 0.12, G + 0.31), (0.004, 0.1, G + 0.31), (-0.004, 0.1, G + 0.31)]], outline=0.004)
cyl('pedimentwindow', M['window'], 0.022, 0.006, segs=16, outline=0, matrix=Matrix.Translation((0.0, PY - 0.123, G + 0.258)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the oval walk and the trees ----------
for j in range(28):
    a0, a1 = 2 * math.pi * j / 28, 2 * math.pi * (j + 1) / 28
    p0 = (0.55 * math.cos(a0), -0.6 + 0.26 * math.sin(a0), G + 0.002)
    p1 = (0.55 * math.cos(a1), -0.6 + 0.26 * math.sin(a1), G + 0.002)
    bar(f'walk{j}', M['path'], p0, p1, 0.04, outline=0)
for k, (x, y, r) in enumerate(((-0.88, 0.45, 0.17), (0.88, 0.5, 0.17), (-0.98, -0.12, 0.13), (0.98, -0.18, 0.13))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + r * 1.6), 0.025, segs=6, outline=0.003)
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.9, r, outline=0.009)

turn(before, -20)
render(G)
