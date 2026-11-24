# A cartoon Chūson-ji for the country maps, built in the set's shared look (../toon.py): the temple
# of the Northern Fujiwara at Hiraizumi in Iwate, Japan: the Konjikidō, the little Golden Hall
# covered inside and out in gold leaf, inside the plain wooden hall built to shelter it, shown
# with its front opened, the Main Hall with its sweeping roof, the avenue of tall old cedars up
# the hill, and the stone lanterns. Turned a little towards the camera.
# Run: blender -b --factory-startup -P chusonji.py -- chusonji-1024.png 1024 chusonji.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7ab450', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'gravel': toon('gravel', '#e2dccc', lift=0.2),
    'gold': toon('gold2', '#f0c040', shadow_mul=(0.78, 0.66, 0.6), lift=0.4),
    'wood': toon('wood', '#6a4a30'),
    'woodLight': toon('woodLight', '#8a6a48'),
    'roof': toon('roof', '#4a4e58'),
    'stone': toon('stone', '#b8b0a0'),
    'dark': flat('dark', '#2e2622'),
    'cedar': toon('cedar', '#2e5e36', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)


def curved_roof(name, mat, x, y, z, w, d, h, eave=0.05):
    rr = [[(x - w / 2 - eave, y - d / 2 - eave, z + 0.02), (x + w / 2 + eave, y - d / 2 - eave, z + 0.02), (x + w / 2 + eave, y + d / 2 + eave, z + 0.02), (x - w / 2 - eave, y + d / 2 + eave, z + 0.02)],
          [(x - w / 2, y - d / 2, z + h * 0.4), (x + w / 2, y - d / 2, z + h * 0.4), (x + w / 2, y + d / 2, z + h * 0.4), (x - w / 2, y + d / 2, z + h * 0.4)],
          [(x - 0.004, y - 0.004, z + h), (x + 0.004, y - 0.004, z + h), (x + 0.004, y + 0.004, z + h), (x - 0.004, y + 0.004, z + h)]]
    return loft(name, mat, rr, outline=0.004)


box('court', M['gravel'], 0.0, 0.0, G - 0.004, 1.2, 0.8, 0.008, outline=0.001, bevel=0)

# ---------- the sheltering hall, open at the front, with the Golden Hall inside ----------
SX, SY = -0.2, 0.1
for (ex, ey) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
    box(f'shelterpost{ex}{ey}', M['woodLight'], SX + ex * 0.2, SY + ey * 0.18, G - 0.005, 0.03, 0.03, 0.3, outline=0.002, bevel=0)
box('shelterback', M['wood'], SX, SY + 0.18, G - 0.005, 0.4, 0.03, 0.3, outline=0.003, bevel=0)
for s in (-1, 1):
    box(f'shelterside{s}', M['wood'], SX + s * 0.2, SY + 0.04, G - 0.005, 0.03, 0.26, 0.3, outline=0.003, bevel=0)
curved_roof('shelterroof', M['roof'], SX, SY, G + 0.29, 0.42, 0.38, 0.16)
# the Konjikidō
KX, KY = SX, SY - 0.02
box('konjikidobase', M['gold'], KX, KY, G - 0.005, 0.24, 0.24, 0.03, outline=0.002, bevel=0)
box('konjikido', M['gold'], KX, KY, G + 0.025, 0.2, 0.2, 0.12, outline=0.004, bevel=0)
for j in range(4):
    box(f'konjikidopost{j}', M['gold'], KX - 0.09 + j * 0.06, KY - 0.103, G + 0.025, 0.012, 0.006, 0.12, outline=0, bevel=0)
box('konjikidodoor', M['dark'], KX, KY - 0.103, G + 0.035, 0.05, 0.004, 0.08, outline=0, bevel=0)
curved_roof('konjikidoroof', M['gold'], KX, KY, G + 0.14, 0.2, 0.2, 0.11, eave=0.04)
lathe('konjikidofinial', M['gold'], ((0.012, 0), (0.008, 0.03), (0.0, 0.04)), G + 0.25, KX, KY, segs=8, outline=0.001)

# ---------- the Main Hall ----------
HX, HY = 0.45, 0.25
box('hondo', M['wood'], HX, HY, G - 0.005, 0.32, 0.24, 0.14, outline=0.005, bevel=0)
for j in range(5):
    box(f'hondopost{j}', M['woodLight'], HX - 0.14 + j * 0.07, HY - 0.123, G - 0.005, 0.014, 0.006, 0.14, outline=0, bevel=0)
curved_roof('hondoroof', M['roof'], HX, HY, G + 0.135, 0.32, 0.24, 0.16)

# ---------- the stone lanterns and the cedar avenue ----------
for k, x in enumerate((-0.45, 0.05)):
    lathe(f'lantern{k}', M['stone'], ((0.03, 0), (0.015, 0.06), (0.03, 0.065), (0.03, 0.1), (0.04, 0.11), (0.0, 0.14)), G - 0.005, x, -0.35, segs=6, outline=0.002, smooth=False)
for s in (-1, 1):
    for k in range(4):
        x, y = -0.2 + s * 0.42, -0.45 - k * 0.15
        if math.hypot(x, y) > 1.1:
            continue
        lathe(f'cedar{s}{k}', M['cedar'], ((0.07, 0), (0.0, 0.34)), G + 0.06, x, y, segs=10, outline=0.005, smooth=False)
        rod(f'cedartrunk{s}{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.016, segs=6, outline=0.001)
for k, (x, y) in enumerate(((-0.85, 0.2), (-0.75, 0.65), (0.9, -0.2), (0.85, 0.6), (0.1, 0.85))):
    lathe(f'cedarb{k}', M['cedar'], ((0.08, 0), (0.0, 0.5)), G + 0.06, x, y, segs=10, outline=0.005, smooth=False)
    rod(f'cedarbtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.07), 0.016, segs=6, outline=0.001)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
