# A cartoon Santiniketan for the country maps, built in the set's shared look (../toon.py): Tagore's
# university town in West Bengal, India, its Upasana Griha, the glass prayer hall of coloured
# Belgian glass on its white marble plinth, the open-air classes under the old trees, Kala
# Bhavana's mud-walled studios with their sculptures, and the red laterite paths. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P santiniketan.py -- santiniketan-1024.png 1024 santiniketan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'laterite': toon('laterite', '#c06a4a', lift=0.15),
    'marble': toon('marble', '#f4f2ec', shadow_mul=(0.82, 0.84, 0.9), lift=0.25),
    'glassBlue': toon('glassBlue', '#5a9ac8', lift=0.3),
    'glassRed': toon('glassRed', '#d0605a', lift=0.3),
    'glassYellow': toon('glassYellow', '#e8c050', lift=0.3),
    'iron': toon('iron', '#3a3a3e'),
    'mud': toon('mud', '#c8a070', lift=0.12),
    'thatch': toon('thatch', '#b89a5a'),
    'stone': toon('stone', '#9a9488'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the red paths ----------
box('path1', M['laterite'], 0.0, -0.55, G - 0.004, 0.12, 0.8, 0.008, outline=0.001, bevel=0)
box('path2', M['laterite'], 0.1, 0.25, G - 0.004, 1.6, 0.1, 0.008, outline=0.001, bevel=0)

# ---------- the Upasana Griha ----------
UX, UY = -0.05, -0.05
box('plinth', M['marble'], UX, UY, G - 0.005, 0.46, 0.34, 0.05, outline=0.004, bevel=0)
W, D, H = 0.4, 0.28, 0.2
GLASS = (M['glassBlue'], M['glassRed'], M['glassYellow'])
for j in range(8):
    x = UX - W / 2 + (j + 0.5) * W / 8
    box(f'panefront{j}', GLASS[j % 3], x, UY - D / 2, G + 0.045, W / 8 - 0.008, 0.008, H, outline=0, bevel=0)
    box(f'paneback{j}', GLASS[(j + 1) % 3], x, UY + D / 2, G + 0.045, W / 8 - 0.008, 0.008, H, outline=0, bevel=0)
for j in range(6):
    y = UY - D / 2 + (j + 0.5) * D / 6
    for s in (-1, 1):
        box(f'paneside{j}{s}', GLASS[(j + (s > 0)) % 3], UX + s * W / 2, y, G + 0.045, 0.008, D / 6 - 0.008, H, outline=0, bevel=0)
for (ex, ey) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
    rod(f'corner{ex}{ey}', M['iron'], (UX + ex * W / 2, UY + ey * D / 2, G + 0.045), (UX + ex * W / 2, UY + ey * D / 2, G + 0.045 + H), 0.008, segs=6, outline=0)
box('roofslab', M['marble'], UX, UY, G + 0.045 + H, W + 0.04, D + 0.04, 0.025, outline=0.003, bevel=0)
gable('roof', M['iron'], UX, UY, G + 0.07 + H, W + 0.02, D + 0.02, 0.06, ridge_x=True)
box('steps', M['marble'], UX, UY - 0.19, G - 0.005, 0.16, 0.05, 0.03, outline=0.001, bevel=0)

# ---------- Kala Bhavana's studios and a sculpture ----------
for k, (x, y) in enumerate(((0.6, -0.15), (0.6, 0.55))):
    box(f'studio{k}', M['mud'], x, y, G - 0.005, 0.3, 0.2, 0.12, outline=0.005, bevel=0)
    hip(f'studioroof{k}', M['thatch'], x, y, G + 0.115, 0.3, 0.2, 0.08, over=0.02)
    box(f'studiodoor{k}', M['dark'], x, y - 0.103, G - 0.005, 0.04, 0.006, 0.08, outline=0, bevel=0)
    for j in range(4):
        box(f'mural{k}{j}', M['laterite'], x - 0.11 + j * 0.07, y - 0.103, G + 0.09, 0.03, 0.004, 0.02, outline=0, bevel=0)
lathe('sculpture', M['stone'], ((0.04, 0), (0.035, 0.06), (0.05, 0.12), (0.03, 0.2), (0.0, 0.24)), G - 0.005, 0.5, -0.55, segs=10, outline=0.004)
box('sculpturebase', M['stone'], 0.5, -0.55, G - 0.005, 0.1, 0.1, 0.03, outline=0.002, bevel=0)

# ---------- open-air classes under the old trees ----------
for k, (x, y) in enumerate(((-0.6, -0.45), (-0.65, 0.5), (-0.2, 0.7))):
    rod(f'bigtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.14), 0.025, segs=8, outline=0.003)
    b = ball(f'bigtree{k}', M['tree'], 0, 0, 0, 0.16, outline=0.008)
    b.scale = (1.3, 1.3, 0.75)
    b.location = (x, y, G + 0.24)
    lathe(f'platform{k}', M['marble'], ((0.12, 0), (0.12, 0.025)), G - 0.005, x, y, segs=20, outline=0.002)
for k, (x, y) in enumerate(((0.95, 0.15), (-0.95, 0.0), (0.2, -0.95))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
