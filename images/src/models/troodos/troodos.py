# A cartoon Painted Church of the Troodos for the country maps, built in the set's shared look
# (../toon.py): one of the little Byzantine churches in the Troodos mountains of Cyprus whose
# insides are covered in frescoes, sheltered under a steep pitched roof of flat tiles that
# comes down almost to the ground over the stone church inside, its little bell cote, the
# narthex door, and the pines and terraces of the mountainside round it. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P troodos.py -- troodos-1024.png 1024 troodos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#9ab864', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'slope': toon('slope', '#7aa050', shadow_mul=(0.72, 0.78, 0.8)),
    'stone': toon('stone', '#c8b494', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'roof': toon('roof', '#b8603e', shadow_mul=(0.78, 0.7, 0.74)),
    'wood': toon('wood', '#6a4428'),
    'fresco': toon('fresco', '#3a6aa8'),
    'dark': flat('dark', '#2e2622'),
    'pine': toon('pine', '#2e6a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


sl = loft('slope', M['slope'], [strip(0.45, 1.31, 1.32, G - 0.01), strip(0.62, 1.31, 1.32, G + 0.3)], outline=0.006)
sl.visible_shadow = False

# ---------- the church under its great roof ----------
CX, CY = 0.0, 0.0
W, D = 0.36, 0.62
box('walls', M['stone'], CX, CY, G - 0.005, W - 0.06, D - 0.04, 0.12, outline=0.005, bevel=0)
gable('bigroof', M['roof'], CX, CY, G + 0.06, W + 0.1, D, 0.34, over=0.02, outline=0.008)
for k in range(5):
    t = (k + 1) / 6
    for s in (-1, 1):
        bar(f'tilerow{k}{s}', M['stone'], (CX + s * (W / 2 + 0.07) * (1 - t), CY - D / 2 - 0.02, G + 0.06 + 0.34 * t), (CX + s * (W / 2 + 0.07) * (1 - t), CY + D / 2 + 0.02, G + 0.06 + 0.34 * t), 0.008, outline=0)
FY = CY - D / 2 - 0.022
box('gablewall', M['stone'], CX, CY - D / 2 + 0.01, G + 0.06, W - 0.02, 0.02, 0.08, outline=0.002, bevel=0)
arch('door', M['dark'], CX, FY, G - 0.005, 0.07, 0.12)
box('lintelfresco', M['fresco'], CX, FY - 0.002, G + 0.125, 0.08, 0.004, 0.04, outline=0, bevel=0)
# the bell cote on the ridge
box('belcote', M['stone'], CX, CY + D / 2 - 0.05, G + 0.39, 0.07, 0.04, 0.12, outline=0.003, bevel=0)
arch('belcoteopen', M['dark'], CX, CY + D / 2 - 0.072, G + 0.42, 0.035, 0.06)
gable('belcoteroof', M['roof'], CX, CY + D / 2 - 0.05, G + 0.505, 0.08, 0.05, 0.04)

# ---------- the pines ----------
for k, (x, y) in enumerate(((-0.6, -0.4), (0.6, -0.35), (-0.75, 0.15), (0.75, 0.2), (-0.4, 0.75), (0.35, 0.8), (0.0, -0.85))):
    z = G + 0.3 * min(1.0, max(0.0, (y - 0.45) / 0.17))
    lathe(f'pine{k}', M['pine'], ((0.08, 0), (0.0, 0.32)), z + 0.05, x, y, segs=10, outline=0.005, smooth=False)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, z - 0.01), (x, y, z + 0.06), 0.012, segs=6, outline=0.001)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
