# A cartoon Quseir Amra for the country maps, built in the set's shared look (../toon.py): the little
# Umayyad desert castle in eastern Jordan, famous for the frescoes inside, its audience hall roofed
# with three barrel vaults side by side, the alcove at its back, the bath house beside it with its
# small dome and vault, and the well with its animal-driven water wheel, among a few terebinth
# trees in the dry wadi. Turned a little towards the camera.
# Run: blender -b --factory-startup -P quseir-amra.py -- quseir-amra-1024.png 1024 quseir-amra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'desert': toon('desert', '#dcc89a', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'stone': toon('stone', '#d4b88a', shadow_mul=(0.8, 0.76, 0.8), lift=0.15),
    'stoneDark': toon('stoneDark', '#b49868'),
    'wood': toon('wood', '#7a5a3e'),
    'dark': flat('dark', '#3a2e26'),
    'tree': toon('tree', '#7a9a5a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['desert'])
before = set(bpy.data.objects)

# ---------- the audience hall and its three barrel vaults ----------
HX, HY = -0.1, 0.05
R, L, WH = 0.12, 0.42, 0.15
box('hall', M['stone'], HX, HY, G - 0.005, 6 * R, L, WH, outline=0.007, bevel=0)
for k in range(3):
    x = HX - 2 * R + k * 2 * R
    cyl(f'vault{k}', M['stone'], R, L, segs=24, outline=0.006, matrix=Matrix.Translation((x, HY, G + WH - 0.005)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('door', M['dark'], HX, HY - L / 2 - 0.004, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
cyl('doortop', M['dark'], 0.03, 0.006, segs=10, outline=0, matrix=Matrix.Translation((HX, HY - L / 2 - 0.004, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    box(f'win{s}', M['dark'], HX + s * 2 * R, HY - L / 2 - 0.004, G + 0.17, 0.03, 0.006, 0.04, outline=0, bevel=0)
# the alcove at the back
box('alcove', M['stone'], HX, HY + L / 2 + 0.06, G - 0.005, 0.2, 0.12, 0.17, outline=0.005, bevel=0)
cyl('alcovevault', M['stone'], 0.1, 0.12, segs=16, outline=0.004, matrix=Matrix.Translation((HX, HY + L / 2 + 0.06, G + 0.165)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the bath house beside it ----------
BX = HX + 3 * R + 0.12
box('bath', M['stone'], BX, HY + 0.08, G - 0.005, 0.24, 0.26, 0.14, outline=0.006, bevel=0)
lathe('bathdrum', M['stone'], ((0.07, 0), (0.07, 0.03)), G + 0.135, BX + 0.04, HY + 0.15, segs=16, outline=0.003)
lathe('bathdome', M['stone'], ((0.072, 0), (0.06, 0.04), (0.03, 0.065), (0.0, 0.07)), G + 0.165, BX + 0.04, HY + 0.15, segs=16, outline=0.004)
cyl('bathvault', M['stone'], 0.06, 0.12, segs=16, outline=0.004, matrix=Matrix.Translation((BX - 0.04, HY - 0.0, G + 0.135)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
box('bathdoor', M['dark'], BX, HY - 0.054, G - 0.005, 0.04, 0.006, 0.07, outline=0, bevel=0)

# ---------- the well and its water wheel ----------
WX, WY = -0.6, -0.45
lathe('wellwall', M['stoneDark'], ((0.1, 0), (0.1, 0.06)), G - 0.005, WX, WY, segs=20, outline=0.004)
lathe('wellhole', M['dark'], ((0.075, 0), (0.075, 0.004)), G + 0.055, WX, WY, segs=20, outline=0)
for s in (-1, 1):
    bar(f'wheelpost{s}', M['wood'], (WX + s * 0.06, WY, G + 0.05), (WX + s * 0.06, WY, G + 0.17), 0.014, outline=0.002)
cyl('wheel', M['wood'], 0.06, 0.012, segs=16, outline=0.003, matrix=Matrix.Translation((WX, WY, G + 0.13)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
lathe('track', M['stoneDark'], ((0.28, 0), (0.28, 0.004)), G - 0.004, WX + 0.2, WY, segs=28, outline=0.001)

# ---------- terebinths in the wadi ----------
for k, (x, y) in enumerate(((0.6, -0.55), (0.25, -0.75), (-0.2, -0.65), (0.8, 0.45), (-0.75, 0.4))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.1), 0.014, segs=6, outline=0.002)
    b = ball(f'tree{k}', M['tree'], 0, 0, 0, 0.1, outline=0.009)
    b.scale = (1.2, 1.1, 0.7)
    b.location = (x + 0.02, y, G + 0.15)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
