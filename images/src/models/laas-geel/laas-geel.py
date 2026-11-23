# A cartoon Laas Geel for the country maps, built in the set's shared look (../toon.py): the granite
# outcrops in Somaliland's dry plain, rounded boulders piled up, the rock shelters under their
# overhangs with the painted cattle on the rock in red, white and black, acacias, and goats. Turned
# a little towards the camera.
# Run: blender -b --factory-startup -P laas-geel.py -- laas-geel-1024.png 1024 laas-geel.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#d8c08a', shadow_mul=(0.84, 0.78, 0.72), lift=0.25),
    'granite': toon('granite', '#c89a78', shadow_mul=(0.84, 0.76, 0.76)),
    'graniteDark': toon('graniteDark', '#a87e62', shadow_mul=(0.84, 0.76, 0.76)),
    'shelter': flat('shelter', '#6a4a3a'),
    'paintRed': flat('paintRed', '#b8402a'), 'paintWhite': flat('paintWhite', '#f4ece0'), 'paintBlack': flat('paintBlack', '#2e2622'),
    'acacia': toon('acacia', '#7a9a4a', shadow_mul=(0.72, 0.78, 0.78)),
    'trunk': toon('trunk', '#6b5040'),
    'goat': toon('goat', '#f4efe2', lift=0.2), 'goatDark': toon('goatDark', '#5a4438'),
    'tuft': toon('tuft', '#b0a24e', shadow_mul=(0.8, 0.76, 0.66)),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(941)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the main outcrop: a heap of rounded granite boulders ----------
for k, (x, y, z, r, sx, sy, sz) in enumerate(((-0.15, 0.4, 0.12, 0.3, 1.4, 1.0, 0.75), (0.25, 0.45, 0.1, 0.25, 1.3, 1.0, 0.7), (0.0, 0.5, 0.32, 0.2, 1.3, 1.0, 0.7),
                                              (-0.5, 0.25, 0.08, 0.18, 1.2, 1.0, 0.75), (0.55, 0.25, 0.07, 0.16, 1.2, 1.0, 0.75), (0.15, 0.6, 0.42, 0.13, 1.2, 1.0, 0.75))):
    b = squashed(f'boulder{k}', M['granite' if k % 2 == 0 else 'graniteDark'], x, y, G + z, r, sx, sy, sz, outline=0.018)
    b.visible_shadow = False

# ---------- the overhang shelter and its painted cattle ----------
SX, SY = -0.05, -0.05        # in front of the heap, so the painted panel isn't inside a boulder
ov = squashed('overhang', M['graniteDark'], SX, SY + 0.04, G + 0.32, 0.22, 1.6, 0.45, 0.35, outline=0.016)
ov.visible_shadow = False
for s in (-1, 1):
    squashed(f'overhangpier{s}', M['granite'], SX + s * 0.24, SY + 0.04, G + 0.1, 0.1, 0.7, 0.8, 1.1, outline=0.012)
box('shelterback', M['shelter'], SX, SY + 0.1, G - 0.005, 0.4, 0.02, 0.22, outline=0, bevel=0)
for k in range(4):
    x = SX - 0.13 + k * 0.09
    z = G + 0.06 + (k % 2) * 0.06
    box(f'cowbody{k}', M['paintRed'], x, SY + 0.088, z, 0.06, 0.004, 0.03, outline=0, bevel=0)
    box(f'cowbib{k}', M['paintWhite'], x + 0.02, SY + 0.086, z, 0.02, 0.004, 0.026, outline=0, bevel=0)
    for j in (-1, 1):
        box(f'cowleg{k}{j}', M['paintBlack'], x + j * 0.02, SY + 0.087, z - 0.02, 0.006, 0.004, 0.022, outline=0, bevel=0)
    bar(f'cowhorn{k}', M['paintBlack'], (x - 0.03, SY + 0.087, z + 0.03), (x - 0.045, SY + 0.087, z + 0.05), 0.005, outline=0)

# ---------- a smaller outcrop, acacias, tufts ----------
for k, (x, y, r) in enumerate(((0.75, -0.45, 0.12), (0.6, -0.55, 0.08), (-0.75, -0.5, 0.1))):
    squashed(f'rock{k}', M['granite'], x, y, G + r * 0.5, r, 1.3, 1.0, 0.8, outline=0.012)
for k, (x, y) in enumerate(((-0.85, 0.15), (0.9, 0.05), (-0.35, -0.7), (0.3, -0.85), (1.0, 0.45))):
    h = rng.uniform(0.15, 0.2)
    rod(f'acaciatrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.012, segs=6, outline=0.004)
    squashed(f'acacia{k}', M['acacia'], x + 0.02, y, G + h + 0.015, 0.09, 1.5, 1.2, 0.35, outline=0.01)
for k in range(20):
    x, y = rng.uniform(-1.2, 1.2), rng.uniform(-1.2, 0.2)
    if math.hypot(x, y) > 1.25:
        continue
    lathe(f'tuft{k}', M['tuft'], ((0.025, 0), (0.004, 0.045)), G, x, y, segs=6, outline=0.004, smooth=False)

# ---------- goats ----------
for k, (x, y, a, mat) in enumerate(((0.05, -0.45, 0.3, 'goat'), (-0.2, -0.55, -0.4, 'goatDark'), (0.25, -0.6, 2.8, 'goat'))):
    c, s = math.cos(a), math.sin(a)
    at = lambda dx, dy: (x + dx * c - dy * s, y + dx * s + dy * c)
    for j, (dx, dy) in enumerate(((-0.025, -0.01), (-0.025, 0.01), (0.025, -0.01), (0.025, 0.01))):
        px, py = at(dx, dy)
        rod(f'goatleg{k}{j}', M[mat], (px, py, G), (px, py, G + 0.04), 0.005, segs=5, outline=0.002)
    bx, by = at(0, 0)
    box(f'goatbody{k}', M[mat], bx, by, G + 0.035, 0.07, 0.03, 0.03, rot_z=a, outline=0.004, bevel=0.01)
    hx, hy = at(0.045, 0)
    box(f'goathead{k}', M[mat], hx, hy, G + 0.055, 0.025, 0.018, 0.022, rot_z=a, outline=0.003, bevel=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
