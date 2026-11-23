# A cartoon Ha'amonga 'a Maui for the country maps, built in the set's shared look (../toon.py): Tonga's
# great trilithon, two upright slabs of coral limestone with the lintel set into notches across their
# tops, standing on the green lawn among coconut palms, with red hibiscus, the Pacific behind, and
# one of Tonga's free-roaming pigs. Turned a little towards the camera.
# Run: blender -b --factory-startup -P haamonga.py -- haamonga-1024.png 1024 haamonga.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'sea': toon('sea', '#3fa3d6', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'sand': toon('sand', '#f0e2be', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'coral': toon('coral', '#bdb6a4', shadow_mul=(0.8, 0.8, 0.88)),
    'coralDark': toon('coralDark', '#9a9482', shadow_mul=(0.8, 0.8, 0.88)),
    'lichen': flat('lichen', '#8a9a6a'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'coconut': toon('coconut', '#6b4a33'),
    'hibiscus': flat('hibiscus', '#e0302a'),
    'bush': toon('bush', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'pig': toon('pig', '#3a3438', lift=0.3),
    'snout': toon('snout', '#d8a0a0'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(409)

# ---------- the Pacific along the back ----------
R = 1.42
SEA = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(30, 151, 8)] + [(-1.1, 0.85), (-0.4, 1.0), (0.4, 0.98), (1.1, 0.82)]
BEACH = [(R * 0.98 * math.cos(math.radians(a)), R * 0.98 * math.sin(math.radians(a))) for a in range(32, 149, 8)] + [(-1.05, 0.75), (-0.4, 0.9), (0.4, 0.88), (1.05, 0.72)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in BEACH])])
finish('beach', bm, M['sand'], outline=0.008)
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.006)) for x, y in SEA])])
finish('sea', bm, M['sea'], outline=0.01)

# ---------- the path up to it ----------
box('path', M['path'], 0.0, -0.75, G - 0.005, 0.22, 0.75, 0.012, outline=0.006, bevel=0)

# ---------- the trilithon ----------
TX, TY = 0.0, 0.05
W, D, H = 0.2, 0.14, 0.58     # each upright
GAP = 0.36
for s in (-1, 1):
    x = TX + s * (GAP / 2 + W / 2)
    loft(f'upright{s}', M['coral'], [[(x - W / 2, TY - D / 2, G - 0.01), (x + W / 2, TY - D / 2, G - 0.01), (x + W / 2, TY + D / 2, G - 0.01), (x - W / 2, TY + D / 2, G - 0.01)],
                                     [(x - W / 2 + 0.02, TY - D / 2 + 0.01, G + H), (x + W / 2 - 0.02, TY - D / 2 + 0.01, G + H),
                                      (x + W / 2 - 0.02, TY + D / 2 - 0.01, G + H), (x - W / 2 + 0.02, TY + D / 2 - 0.01, G + H)]], outline=0.022, bevel=0.01)
    for k in range(3):
        box(f'lichen{s}{k}', M['lichen'], x + rng.uniform(-0.05, 0.05), TY - D / 2 + 0.006, G + rng.uniform(0.08, 0.45), rng.uniform(0.03, 0.05), 0.01,
            rng.uniform(0.03, 0.06), outline=0, bevel=0)
# the lintel, set into notches in the uprights' tops
box('lintel', M['coralDark'], TX, TY, G + H - 0.05, GAP + 2 * W + 0.06, D * 0.75, 0.1, outline=0.02, bevel=0.01)

# ---------- coconut palms ----------
for k, (x, y, lean) in enumerate(((-0.75, 0.25, 0.08), (0.8, 0.15, -0.06), (-0.5, -0.55, 0.05), (0.95, -0.45, -0.04), (-1.0, -0.15, 0.06), (0.45, 0.62, -0.05))):
    h = rng.uniform(0.42, 0.55)
    top = (x + lean * 2, y, G + h)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), top, 0.02, r2=0.014, segs=8, outline=0.008)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], top, (top[0] + 0.15 * math.cos(b), top[1] + 0.15 * math.sin(b), top[2] - 0.07), 0.026, outline=0.006)
    for c in range(3):
        ball(f'coconut{k}{c}', M['coconut'], top[0] + 0.02 * math.cos(c * 2.1), top[1] + 0.02 * math.sin(c * 2.1), top[2] - 0.03, 0.016, outline=0.004)

# ---------- hibiscus bushes ----------
for k, (x, y) in enumerate(((-0.3, -0.4), (0.32, -0.42), (-0.85, 0.55), (0.75, -0.75))):
    b = ball(f'bush{k}', M['bush'], 0, 0, 0, 0.09, outline=0.014)
    b.scale = (1.2, 1.1, 0.8)
    b.location = (x, y, G + 0.06)
    for f in range(5):
        a = 2 * math.pi * f / 5 + k
        ball(f'hibiscus{k}{f}', M['hibiscus'], x + 0.08 * math.cos(a), y + 0.07 * math.sin(a), G + 0.08 + 0.02 * (f % 2), 0.018, outline=0)

# ---------- a pig ----------
PX, PY = 0.42, -0.25
p = ball('pig', M['pig'], 0, 0, 0, 0.06, outline=0.01)
p.scale = (1.4, 0.9, 0.85)
p.location = (PX, PY, G + 0.07)
ball('pighead', M['pig'], PX - 0.08, PY - 0.02, G + 0.07, 0.038, outline=0.008)
rod('pigsnout', M['snout'], (PX - 0.1, PY - 0.03, G + 0.065), (PX - 0.125, PY - 0.035, G + 0.06), 0.016, segs=8, outline=0.004)
for dx in (-0.04, 0.04):
    for dy in (-0.025, 0.025):
        rod(f'pigleg{dx}{dy}', M['pig'], (PX + dx, PY + dy, G), (PX + dx, PY + dy, G + 0.04), 0.011, segs=6, outline=0.004)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
