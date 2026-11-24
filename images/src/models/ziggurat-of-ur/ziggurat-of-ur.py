# A cartoon Ziggurat of Ur for the country maps, built in the set's shared look (../toon.py): the
# great stepped temple mound of mud brick in the desert of southern Iraq, its sloping walls ribbed
# with buttresses, the three stairways climbing the front, the middle one straight up and the two
# side ones along the wall, meeting at the gatehouse, the upper terraces and the shrine on top, and
# palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ziggurat-of-ur.py -- ziggurat-of-ur-1024.png 1024 ziggurat-of-ur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#dcc898', shadow_mul=(0.86, 0.82, 0.76), lift=0.2),
    'mud': toon('mud', '#b8946a', shadow_mul=(0.86, 0.82, 0.76), lift=0.06),
    'mudDark': toon('mudDark', '#9a7a52'),
    'stairs': toon('stairs', '#c8a878'),
    'dark': flat('dark', '#3a2e24'),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)


def terrace(name, cy, w0, d0, w1, d1, z0, h):
    return loft(name, M['mud'], [[(-w0 / 2, cy - d0 / 2, G + z0), (w0 / 2, cy - d0 / 2, G + z0), (w0 / 2, cy + d0 / 2, G + z0), (-w0 / 2, cy + d0 / 2, G + z0)],
                                 [(-w1 / 2, cy - d1 / 2, G + z0 + h), (w1 / 2, cy - d1 / 2, G + z0 + h), (w1 / 2, cy + d1 / 2, G + z0 + h), (-w1 / 2, cy + d1 / 2, G + z0 + h)]], outline=0.009)


CY = 0.18
terrace('terrace1', CY, 0.98, 0.7, 0.9, 0.62, -0.005, 0.16)
for j in range(9):
    x = -0.4 + j * 0.1
    if abs(x) < 0.08:
        continue
    box(f'rib{j}', M['mudDark'], x, CY - 0.34, G - 0.005, 0.025, 0.03, 0.15, outline=0.001, bevel=0)
terrace('terrace2', CY + 0.05, 0.6, 0.42, 0.54, 0.36, 0.155, 0.1)
terrace('terrace3', CY + 0.1, 0.3, 0.22, 0.27, 0.19, 0.25, 0.08)
box('shrine', M['mudDark'], 0.0, CY + 0.1, G + 0.325, 0.16, 0.12, 0.07, outline=0.004, bevel=0)
box('shrinedoor', M['dark'], 0.0, CY + 0.039, G + 0.325, 0.035, 0.006, 0.045, outline=0, bevel=0)

# ---------- the stairways ----------
FY = CY - 0.35
n = 10
for i in range(n):
    t = (i + 1) / n
    box(f'midstair{i}', M['stairs'], 0.0, FY - 0.32 + t * 0.3, G - 0.005, 0.1, 0.04, 0.16 * t, outline=0.002, bevel=0)
for s in (-1, 1):
    for i in range(n):
        t = (i + 1) / n
        x = s * (0.42 - t * 0.34)
        box(f'sidestair{s}{i}', M['stairs'], x, FY - 0.04, G - 0.005, 0.05, 0.07, 0.16 * t, outline=0.002, bevel=0)
box('gatehouse', M['mudDark'], 0.0, FY - 0.03, G + 0.155, 0.14, 0.1, 0.07, outline=0.004, bevel=0)
box('gatedoor', M['dark'], 0.0, FY - 0.083, G + 0.155, 0.04, 0.006, 0.05, outline=0, bevel=0)
for i in range(5):
    t = (i + 1) / 5
    box(f'upperstair{i}', M['stairs'], 0.0, CY - 0.2 + t * 0.1, G + 0.155, 0.08, 0.03, 0.1 * t, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((-0.8, -0.35), (0.82, -0.4), (-0.75, 0.55), (0.7, 0.62))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.016, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.11 * math.cos(a), y + 0.11 * math.sin(a), G + 0.24), 0.025, outline=0.002)

turn(before, -20)
render(G)
