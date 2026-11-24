# A cartoon Umayyad Mosque for the country maps, built in the set's shared look (../toon.py): the Great
# Mosque of Damascus, its wide courtyard of polished marble ringed by arcades, the prayer hall's high
# central front glittering with its golden mosaics of trees and palaces under the gable, the Dome of
# the Eagle behind it, the little octagonal Dome of the Treasury on its columns in the courtyard, and
# the three minarets: the Bride's, Jesus' tall square one, and Qaitbay's octagonal one. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P umayyad-mosque.py -- umayyad-mosque-1024.png 1024 umayyad-mosque.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#d8ccb4', shadow_mul=(0.84, 0.84, 0.9), lift=0.18),
    'marble': toon('marble', '#f2eee6', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'stone': toon('stone', '#e0d4bc', shadow_mul=(0.82, 0.82, 0.88), lift=0.18),
    'gold': toon('gold', '#d8a840', lift=0.3),
    'mosaicGreen': toon('mosaicGreen', '#4a8a5a', lift=0.15),
    'lead': toon('lead', '#8a9098', lift=0.15),
    'dark': flat('dark', '#2e2a2a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# ---------- the courtyard and its arcades ----------
CX0, CX1, CY0, CY1 = -0.6, 0.6, -0.5, 0.3
box('courtyard', M['marble'], 0.0, (CY0 + CY1) / 2, G - 0.005, CX1 - CX0, CY1 - CY0, 0.015, outline=0.002, bevel=0)
for name, x, y, sx, sy, face in (('west', CX0 - 0.04, (CY0 + CY1) / 2, 0.1, CY1 - CY0, 'x'), ('east', CX1 + 0.04, (CY0 + CY1) / 2, 0.1, CY1 - CY0, '-x'), ('north', 0.0, CY0 - 0.04, CX1 - CX0 + 0.18, 0.1, 'y')):
    box(f'{name}arcade', M['stone'], x, y, G - 0.005, sx, sy, 0.14, outline=0.005, bevel=0)
    n = int(max(sx, sy) / 0.08)
    for j in range(n):
        t = -max(sx, sy) / 2 + (j + 0.5) * max(sx, sy) / n
        if face == 'y':
            px, py, w, d = x + t, y + 0.054, 0.04, 0.006
        else:
            px, py, w, d = x + (0.054 if face == 'x' else -0.054), y + t, 0.006, 0.04
        box(f'{name}arch{j}', M['dark'], px, py, G + 0.01, w, d, 0.07, outline=0, bevel=0)
        if face == 'y':
            cyl(f'{name}archtop{j}', M['dark'], 0.02, 0.006, segs=10, outline=0, matrix=Matrix.Translation((px, py, G + 0.08)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        else:
            cyl(f'{name}archtop{j}', M['dark'], 0.02, 0.006, segs=10, outline=0, matrix=Matrix.Translation((px, py, G + 0.08)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))

# ---------- the prayer hall along the south side ----------
HY = CY1 + 0.14
box('hall', M['stone'], 0.0, HY, G - 0.005, 1.44, 0.28, 0.2, outline=0.007, bevel=0)
for j in range(16):
    x = -0.66 + j * 0.088
    if abs(x) < 0.12:
        continue
    box(f'hallarch{j}', M['dark'], x, HY - 0.143, G + 0.01, 0.045, 0.006, 0.09, outline=0, bevel=0)
    cyl(f'hallarchtop{j}', M['dark'], 0.0225, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, HY - 0.143, G + 0.1)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('hallmosaic', M['gold'], 0.0, HY - 0.143, G + 0.135, 1.42, 0.006, 0.05, outline=0, bevel=0)
loft('hallroof', M['lead'], [[(-0.73, HY - 0.15, G + 0.195), (0.73, HY - 0.15, G + 0.195), (0.73, HY + 0.15, G + 0.195), (-0.73, HY + 0.15, G + 0.195)],
                             [(-0.71, HY - 0.004, G + 0.26), (0.71, HY - 0.004, G + 0.26), (0.71, HY + 0.004, G + 0.26), (-0.71, HY + 0.004, G + 0.26)]], outline=0.004)
# the high central front with its golden mosaic and gable
box('transept', M['stone'], 0.0, HY, G - 0.005, 0.24, 0.3, 0.34, outline=0.006, bevel=0)
box('transeptmosaic', M['gold'], 0.0, HY - 0.153, G + 0.14, 0.22, 0.006, 0.19, outline=0.001, bevel=0)
for k in range(4):
    rod(f'mosaictree{k}', M['mosaicGreen'], (-0.075 + k * 0.05, HY - 0.157, G + 0.15), (-0.075 + k * 0.05, HY - 0.157, G + 0.25), 0.008, r2=0.003, segs=6, outline=0)
for j in range(3):
    box(f'transeptarch{j}', M['dark'], -0.07 + j * 0.07, HY - 0.153, G + 0.01, 0.045, 0.006, 0.1, outline=0, bevel=0)
    cyl(f'transeptarchtop{j}', M['dark'], 0.0225, 0.006, segs=10, outline=0, matrix=Matrix.Translation((-0.07 + j * 0.07, HY - 0.153, G + 0.11)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('transeptgable', M['lead'], [[(-0.13, HY - 0.16, G + 0.335), (0.13, HY - 0.16, G + 0.335), (0.13, HY + 0.16, G + 0.335), (-0.13, HY + 0.16, G + 0.335)],
                                  [(-0.004, HY - 0.16, G + 0.42), (0.004, HY - 0.16, G + 0.42), (0.004, HY + 0.16, G + 0.42), (-0.004, HY + 0.16, G + 0.42)]], outline=0.004)
lathe('eagledrum', M['stone'], ((0.08, 0), (0.08, 0.06)), G + 0.38, 0.0, HY + 0.12, segs=8, outline=0.003, smooth=False)
lathe('eagledome', M['lead'], ((0.085, 0), (0.08, 0.04), (0.05, 0.08), (0.0, 0.1)), G + 0.435, 0.0, HY + 0.12, segs=24, outline=0.004)

# ---------- the Dome of the Treasury in the courtyard ----------
TX, TY = -0.35, -0.15
for k in range(8):
    a = 2 * math.pi * k / 8
    rod(f'treasurycol{k}', M['marble'], (TX + 0.05 * math.cos(a), TY + 0.05 * math.sin(a), G), (TX + 0.05 * math.cos(a), TY + 0.05 * math.sin(a), G + 0.1), 0.007, segs=6, outline=0.001)
lathe('treasury', M['mosaicGreen'], ((0.065, 0), (0.065, 0.06)), G + 0.1, TX, TY, segs=8, outline=0.003, smooth=False)
lathe('treasurydome', M['lead'], ((0.07, 0), (0.05, 0.03), (0.003, 0.06)), G + 0.155, TX, TY, segs=8, outline=0.002, smooth=False)

# ---------- the three minarets ----------
box('jesus', M['stone'], 0.62, HY + 0.05, G - 0.005, 0.1, 0.1, 0.5, outline=0.005, bevel=0)
for k in range(3):
    box(f'jesuswin{k}', M['dark'], 0.62, HY - 0.003, G + 0.18 + k * 0.1, 0.025, 0.006, 0.05, outline=0, bevel=0)
box('jesusgallery', M['stone'], 0.62, HY + 0.05, G + 0.495, 0.12, 0.12, 0.02, outline=0.002, bevel=0)
lathe('jesuslantern', M['stone'], ((0.035, 0), (0.035, 0.08)), G + 0.51, 0.62, HY + 0.05, segs=8, outline=0.002, smooth=False)
lathe('jesusspire', M['lead'], ((0.04, 0), (0.003, 0.14)), G + 0.585, 0.62, HY + 0.05, segs=8, outline=0.002, smooth=False)
lathe('qaitbay', M['stone'], ((0.05, 0), (0.045, 0.46)), G - 0.005, -0.62, HY + 0.05, segs=8, outline=0.005, smooth=False)
for k in range(2):
    lathe(f'qaitbaygallery{k}', M['stone'], ((0.065, 0), (0.065, 0.02)), G + 0.25 + k * 0.2, -0.62, HY + 0.05, segs=8, outline=0.002, smooth=False)
lathe('qaitbaytop', M['stone'], ((0.03, 0), (0.03, 0.06), (0.003, 0.11)), G + 0.47, -0.62, HY + 0.05, segs=8, outline=0.002, smooth=False)
box('bride', M['stone'], 0.0, CY0 - 0.05, G - 0.005, 0.09, 0.09, 0.4, outline=0.005, bevel=0)
lathe('bridelantern', M['stone'], ((0.035, 0), (0.035, 0.07)), G + 0.395, 0.0, CY0 - 0.05, segs=8, outline=0.002, smooth=False)
lathe('bridecap', M['lead'], ((0.04, 0), (0.025, 0.04), (0.003, 0.08)), G + 0.46, 0.0, CY0 - 0.05, segs=8, outline=0.002, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
