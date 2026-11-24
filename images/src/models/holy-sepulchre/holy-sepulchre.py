# A cartoon Church of the Holy Sepulchre for the country maps, built in the set's shared look
# (../toon.py): the Crusader front on its little paved courtyard, its twin arched doorways (one walled
# up) and twin windows above, the squat bell tower to its left, the two grey domes behind (the great
# dome of the Rotunda over the Tomb and the smaller one over the Catholicon), and the old city's stone
# houses crowding round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P holy-sepulchre.py -- holy-sepulchre-1024.png 1024 holy-sepulchre.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb0', shadow_mul=(0.86, 0.82, 0.78), lift=0.2),
    'stone': toon('stone', '#e0d0ae', shadow_mul=(0.86, 0.82, 0.78), lift=0.12),
    'stoneDark': toon('stoneDark', '#c0ae8a', shadow_mul=(0.86, 0.82, 0.78)),
    'house': toon('house', '#e8dcc0', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'lead': toon('lead', '#8a929e', shadow_mul=(0.82, 0.86, 0.94), lift=0.12),
    'dark': flat('dark', '#2e2a2a'),
    'gold': toon('gold', '#e0b040', lift=0.2),
    'wood': toon('wood', '#7a5236'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1149)

FY = -0.12   # the church's front

# ---------- the church ----------
box('front', M['stone'], 0.0, FY + 0.2, G - 0.005, 0.46, 0.4, 0.36, outline=0.009, bevel=0)
box('cornice', M['stoneDark'], 0.0, FY + 0.2, G + 0.18, 0.47, 0.41, 0.015, outline=0.002, bevel=0)
for j, x in enumerate((-0.08, 0.08)):
    box(f'door{j}', M['dark'] if j == 0 else M['stoneDark'], x, FY - 0.003, G - 0.005, 0.08, 0.006, 0.12, outline=0, bevel=0)
    cyl(f'doortop{j}', M['dark'] if j == 0 else M['stoneDark'], 0.04, 0.006, segs=14, outline=0, matrix=Matrix.Translation((x, FY - 0.003, G + 0.115)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box(f'doorframe{j}', M['stoneDark'], x, FY - 0.001, G - 0.005, 0.1, 0.004, 0.175, outline=0, bevel=0)
    box(f'window{j}', M['dark'], x, FY - 0.003, G + 0.22, 0.05, 0.006, 0.07, outline=0, bevel=0)
    cyl(f'windowtop{j}', M['dark'], 0.025, 0.006, segs=12, outline=0, matrix=Matrix.Translation((x, FY - 0.003, G + 0.29)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(5):
    rod(f'doorcol{j}', M['stoneDark'], (-0.14 + j * 0.07, FY - 0.012, G - 0.005), (-0.14 + j * 0.07, FY - 0.012, G + 0.12), 0.007, segs=6, outline=0.001)
# the immovable ladder on the ledge over the right-hand door
bar('ladderl', M['wood'], (0.1, FY - 0.02, G + 0.18), (0.11, FY - 0.03, G + 0.25), 0.005, outline=0)
bar('ladderr', M['wood'], (0.13, FY - 0.02, G + 0.18), (0.14, FY - 0.03, G + 0.25), 0.005, outline=0)
# the bell tower on the left
box('belltower', M['stone'], -0.3, FY + 0.06, G - 0.005, 0.14, 0.14, 0.44, outline=0.007, bevel=0)
for fy in (-1, 1):
    box(f'belfry{fy}', M['dark'], -0.3, FY + 0.06 + fy * 0.072, G + 0.33, 0.05, 0.006, 0.07, outline=0, bevel=0)
box('belltowertop', M['stoneDark'], -0.3, FY + 0.06, G + 0.43, 0.15, 0.15, 0.02, outline=0.002, bevel=0)
# the Rotunda's great dome and the Catholicon's smaller one
lathe('rotundadrum', M['stone'], ((0.2, 0), (0.2, 0.12)), G + 0.35, -0.1, FY + 0.55, segs=28, outline=0.006)
lathe('rotundadome', M['lead'], ((0.21, 0), (0.2, 0.06), (0.16, 0.14), (0.09, 0.2), (0.03, 0.22)), G + 0.465, -0.1, FY + 0.55, segs=28, outline=0.007)
lathe('rotundalantern', M['lead'], ((0.035, 0), (0.035, 0.04), (0.004, 0.08)), G + 0.68, -0.1, FY + 0.55, segs=12, outline=0.002)
box('rotundabase', M['stone'], -0.1, FY + 0.55, G - 0.005, 0.44, 0.44, 0.36, outline=0.008, bevel=0)
lathe('catholicondrum', M['stone'], ((0.09, 0), (0.09, 0.1)), G + 0.35, 0.16, FY + 0.32, segs=20, outline=0.004)
lathe('catholicondome', M['lead'], ((0.095, 0), (0.09, 0.04), (0.06, 0.09), (0.004, 0.11)), G + 0.445, 0.16, FY + 0.32, segs=20, outline=0.004)
for k, (x, y) in enumerate(((-0.1, FY + 0.55), (0.16, FY + 0.32))):
    z = G + 0.465 + 0.3 if k == 0 else G + 0.555
    rod(f'cross{k}', M['gold'], (x, y, z), (x, y, z + 0.06), 0.004, segs=4, outline=0)
    bar(f'crossbar{k}', M['gold'], (x - 0.018, y, z + 0.04), (x + 0.018, y, z + 0.04), 0.006, outline=0)

# ---------- the old city round it ----------
k = 0
for row in range(5):
    y = -0.85 + row * 0.42
    for j in range(7):
        x = -1.0 + j * 0.33 + (0.15 if row % 2 else 0)
        if math.hypot(x, y) > 1.15 or (abs(x + 0.05) < 0.5 and -0.45 < y < 0.75):
            continue
        h = rng.uniform(0.12, 0.24)
        box(f'house{k}', M['house'], x, y, G - 0.005, 0.26, 0.24, h, outline=0.005, bevel=0)
        box(f'housewin{k}', M['dark'], x, y - 0.123, G + h - 0.07, 0.04, 0.006, 0.04, outline=0, bevel=0)
        if rng.random() < 0.45:
            lathe(f'housedome{k}', M['house'], ((0.07, 0), (0.06, 0.03), (0.03, 0.055), (0.004, 0.06)), G + h - 0.005, x, y, segs=12, outline=0.003)
        k += 1

bpy.context.view_layer.update()
turn(before, -20)
render(G)
