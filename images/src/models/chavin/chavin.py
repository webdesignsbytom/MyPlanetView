# A cartoon Chavín de Huántar for the country maps, built in the set's shared look (../toon.py): the
# temple of the Chavín culture high in the Andes of Peru, three thousand years old: the great
# stone platform of the Castillo with its fine courses of light and dark stone, the carved
# tenon heads jutting from its walls, the black and white portal with its stair, the square
# sunken plaza and the round one before it, and the mountains behind. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P chavin.py -- chavin-1024.png 1024 chavin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#9ab866', shadow_mul=(0.72, 0.78, 0.8), lift=0.2),
    'mountain': toon('mountain', '#8a9a6a', shadow_mul=(0.72, 0.78, 0.8)),
    'stone': toon('stone', '#c8bca0', shadow_mul=(0.8, 0.8, 0.86), lift=0.15),
    'stoneDark': toon('stoneDark', '#8a8070'),
    'black': toon('black', '#3a3a3a'),
    'white': toon('white', '#ece6d8', lift=0.2),
    'dark': flat('dark', '#2e2622'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(732554)

for k, (x, y, r, h) in enumerate(((-0.7, 0.95, 0.42, 0.5), (0.3, 1.02, 0.36, 0.42))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.2, h * 0.92), (0.0, h)), G - 0.01, x, y, segs=20, outline=0.006)
    mt.visible_shadow = False

# ---------- the Castillo ----------
CX, CY = 0.1, 0.25
W, D, H = 0.66, 0.46, 0.3
box('castillo', M['stone'], CX, CY, G - 0.005, W, D, H, outline=0.008, bevel=0)
for r in range(5):
    box(f'course{r}', M['stoneDark'], CX, CY - D / 2 - 0.002, G + 0.03 + r * 0.055, W, 0.004, 0.012, outline=0, bevel=0)
    box(f'coursex{r}', M['stoneDark'], CX + W / 2 + 0.002, CY, G + 0.03 + r * 0.055, 0.004, D, 0.012, outline=0, bevel=0)
box('cornice', M['stoneDark'], CX, CY, G + H - 0.005, W + 0.03, D + 0.03, 0.025, outline=0.003, bevel=0)
for k in range(7):
    x = CX - W / 2 + 0.06 + k * (W - 0.12) / 6
    ball(f'tenon{k}', M['white'], x, CY - D / 2 - 0.03, G + H - 0.06, 0.028, outline=0.003)
    box(f'tenonpeg{k}', M['white'], x, CY - D / 2 - 0.01, G + H - 0.065, 0.02, 0.03, 0.02, outline=0, bevel=0)
# the black and white portal
PX = CX - 0.1
for s, mat in ((-1, M['black']), (1, M['white'])):
    lathe(f'portalcol{s}', mat, ((0.025, 0), (0.025, 0.2)), G - 0.005, PX + s * 0.06, CY - D / 2 - 0.03, segs=12, outline=0.002)
box('portallintel', M['black'], PX - 0.03, CY - D / 2 - 0.03, G + 0.195, 0.08, 0.06, 0.03, outline=0.002, bevel=0)
box('portallintel2', M['white'], PX + 0.04, CY - D / 2 - 0.03, G + 0.195, 0.08, 0.06, 0.03, outline=0.002, bevel=0)
box('portaldoor', M['dark'], PX, CY - D / 2 - 0.002, G - 0.005, 0.07, 0.006, 0.17, outline=0, bevel=0)
for k in range(6):
    box(f'portalstep{k}', M['stone'], PX, CY - D / 2 - 0.08 - k * 0.03, G - 0.005, 0.2, 0.03, 0.04 - k * 0.006, outline=0.001, bevel=0)

# ---------- the sunken plazas ----------
SX, SY = -0.1, -0.5
for k in range(3):
    box(f'squareplaza{k}', M['stone'] if k % 2 == 0 else M['stoneDark'], SX + 0.35, SY, G - 0.004 - k * 0.0, 0.5 - k * 0.08, 0.36 - k * 0.08, 0.012 + 0.004 * (2 - k), outline=0.002, bevel=0)
for k in range(3):
    lathe(f'roundplaza{k}', M['stone'] if k % 2 == 0 else M['stoneDark'], ((0.2 - k * 0.04, 0), (0.2 - k * 0.04, 0.012 + 0.004 * (2 - k))), G - 0.004, SX - 0.35, SY + 0.05, segs=28, outline=0.002, smooth=False)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
