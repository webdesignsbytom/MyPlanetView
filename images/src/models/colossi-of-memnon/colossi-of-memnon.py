# A cartoon Colossi of Memnon for the country maps, built in the set's shared look (../toon.py): the
# two great weathered stone statues of Pharaoh Amenhotep III seated side by side on their thrones on
# the Theban plain, their hands on their knees, the small figures of his wife and mother standing by
# their legs, the sandy plain and the green fields and palms of the Nile behind, and the bare Theban
# hills beyond. Turned a little towards the camera.
# Run: blender -b --factory-startup -P colossi-of-memnon.py -- colossi-of-memnon-1024.png 1024 colossi-of-memnon.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e4cc98', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'stone': toon('stone', '#c8a87a', shadow_mul=(0.86, 0.8, 0.76), lift=0.08),
    'stoneDark': toon('stoneDark', '#a8885e'),
    'field': toon('field', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'hill': toon('hill', '#d8b888', shadow_mul=(0.84, 0.8, 0.78)),
    'palm': toon('palm', '#5a9a40'),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)

# ---------- the hills and fields behind ----------
for k, (x, y, r, h) in enumerate(((-0.55, 0.85, 0.32, 0.24), (0.1, 0.95, 0.32, 0.3), (0.65, 0.8, 0.3, 0.22))):
    hl = lathe(f'hill{k}', M['hill'], ((r, 0), (r * 0.75, h * 0.6), (r * 0.35, h * 0.92), (0.004, h)), G - 0.01, x, y, segs=18, outline=0.008)
    hl.visible_shadow = False
for k in range(3):
    box(f'field{k}', M['field'], -0.6 + k * 0.6, 0.55, G - 0.004, 0.5, 0.22, 0.012, outline=0.002, bevel=0)
for k, x in enumerate((-0.95, -0.7, 0.75, 1.0)):
    rod(f'palmtrunk{k}', M['trunk'], (x, 0.4, G), (x + 0.02, 0.4, G + 0.3), 0.014, segs=6, outline=0.002)
    for j in range(7):
        a = 2 * math.pi * j / 7
        bar(f'palmleaf{k}{j}', M['palm'], (x + 0.02, 0.4, G + 0.3), (x + 0.02 + 0.1 * math.cos(a), 0.4 + 0.1 * math.sin(a), G + 0.25), 0.022, outline=0.002)


# ---------- the two colossi ----------
def colossus(name, cx, cy, rng):
    """A seated pharaoh facing the camera (-y), roughly weathered."""
    box(f'{name}plinth', M['stoneDark'], cx, cy, G - 0.005, 0.3, 0.4, 0.08, outline=0.006, bevel=0)
    Z = G + 0.075
    box(f'{name}throne', M['stone'], cx, cy + 0.08, Z, 0.26, 0.22, 0.3, outline=0.007, bevel=0)
    # the legs and feet
    for s in (-1, 1):
        box(f'{name}shin{s}', M['stone'], cx + s * 0.055, cy - 0.06, Z, 0.08, 0.08, 0.2, outline=0.005, bevel=0)
        box(f'{name}thigh{s}', M['stone'], cx + s * 0.055, cy - 0.01, Z + 0.18, 0.085, 0.2, 0.07, outline=0.005, bevel=0)
        box(f'{name}foot{s}', M['stone'], cx + s * 0.055, cy - 0.1, Z, 0.08, 0.06, 0.03, outline=0.003, bevel=0)
        box(f'{name}hand{s}', M['stoneDark'], cx + s * 0.055, cy - 0.09, Z + 0.22, 0.06, 0.04, 0.035, outline=0.002, bevel=0)
        # the small standing queens by his legs
        qx = cx + s * 0.12
        rod(f'{name}queen{s}', M['stoneDark'], (qx, cy - 0.1, Z), (qx, cy - 0.1, Z + 0.13), 0.02, r2=0.016, segs=8, outline=0.003)
        ball(f'{name}queenhead{s}', M['stoneDark'], qx, cy - 0.1, Z + 0.145, 0.016, outline=0.002)
    # the torso, the arms and the head with its nemes headdress
    box(f'{name}torso', M['stone'], cx, cy + 0.07, Z + 0.24, 0.2, 0.12, 0.2, outline=0.006, bevel=0)
    for s in (-1, 1):
        bar(f'{name}arm{s}', M['stone'], (cx + s * 0.105, cy + 0.06, Z + 0.42), (cx + s * 0.07, cy - 0.08, Z + 0.26), 0.05, outline=0.004)
    box(f'{name}head', M['stone'], cx, cy + 0.06, Z + 0.43, 0.1, 0.1, 0.11, outline=0.005, bevel=0)
    loft(f'{name}nemes', M['stoneDark'], [[(cx - 0.08, cy + 0.02, Z + 0.37), (cx + 0.08, cy + 0.02, Z + 0.37), (cx + 0.07, cy + 0.12, Z + 0.37), (cx - 0.07, cy + 0.12, Z + 0.37)],
                                          [(cx - 0.06, cy + 0.03, Z + 0.53), (cx + 0.06, cy + 0.03, Z + 0.53), (cx + 0.05, cy + 0.11, Z + 0.53), (cx - 0.05, cy + 0.11, Z + 0.53)]], outline=0.004)
    # weathering: chips knocked out of the stone
    for k in range(6):
        ball(f'{name}chip{k}', M['stoneDark'], cx + rng.uniform(-0.1, 0.1), cy - 0.05 + rng.uniform(0, 0.1), Z + rng.uniform(0.1, 0.4), 0.018, outline=0)


rng = random.Random(1350)
colossus('north', -0.3, 0.0, rng)
colossus('south', 0.3, 0.0, rng)
for k in range(8):
    x, y = rng.uniform(-0.9, 0.9), rng.uniform(-0.9, -0.35)
    if math.hypot(x, y) < 1.1:
        ball(f'rubble{k}', M['stoneDark'], x, y, G + 0.01, rng.uniform(0.02, 0.04), outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
