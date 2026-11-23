# A cartoon Managaha for the country maps, built in the set's shared look (../toon.py): the little
# island in Saipan's lagoon, its ring of white beach, palms and ironwood trees, the rusting Japanese
# coastal gun from the Second World War looking out to sea, beach umbrellas, and a boat across the
# turquoise lagoon. Turned a little towards the camera.
# Run: blender -b --factory-startup -P managaha.py -- managaha-1024.png 1024 managaha.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#3ec4cc', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'sand': toon('sand', '#f6eedc', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'grass': toon('grass', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'ironwood': toon('ironwood', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'rust': toon('rust', '#8a4a30', shadow_mul=(0.84, 0.76, 0.72)),
    'rustDark': toon('rustDark', '#6a3a28'),
    'concrete': toon('concrete', '#b8b4ac', shadow_mul=(0.8, 0.8, 0.88)),
    'u0': toon('u0', '#e8402c'), 'u1': toon('u1', '#f0c030'), 'u2': toon('u2', '#2f8ac0'),
    'pole': toon('pole', '#f8f6f0', lift=0.2),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'canopy': toon('canopy', '#2f8ac0'),
    'mast': toon('mast', '#b7bcc4'),
})

G = tile(M['lagoon'])
before = set(bpy.data.objects)
rng = random.Random(1163)


def ring(cx, cy, rx, ry, z, k, sides=24):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the island: white sand round a green middle ----------
IX, IY = 0.0, 0.2
isle = loft('isle', M['sand'], [ring(IX, IY, 1.0, 0.68, -0.01, 1), ring(IX, IY, 0.96, 0.65, 0.035, 1)], outline=0.014, smooth=True)
isle.visible_shadow = False
mid = loft('middle', M['grass'], [ring(IX, IY + 0.1, 0.66, 0.4, 0.03, 2), ring(IX, IY + 0.1, 0.62, 0.37, 0.05, 2)], outline=0.008)
mid.visible_shadow = False
T = G + 0.05
for k in range(12):
    a = 2 * math.pi * k / 12
    x, y = IX + 0.5 * math.cos(a), IY + 0.12 + 0.3 * math.sin(a)
    if y < IY - 0.05 and abs(x) < 0.35:
        continue
    rod(f'ironwoodtrunk{k}', M['trunk'], (x, y, T), (x, y, T + 0.1), 0.012, segs=6, outline=0.004)
    lathe(f'ironwood{k}', M['ironwood'], ((0.08, 0), (0.06, 0.08), (0.004, 0.2)), T + 0.08, x, y, segs=12, outline=0.008)
for k in range(9):
    a = math.radians(-10 + k * 25)
    x, y = IX + 0.85 * math.cos(a), IY + 0.56 * math.sin(a)
    hgt = rng.uniform(0.26, 0.32)
    lean = 0.05
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.03), (x + lean * math.cos(a), y + lean * math.sin(a), G + hgt), 0.013, r2=0.01, segs=8, outline=0.004)
    tx, ty = x + lean * math.cos(a), y + lean * math.sin(a)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (tx, ty, G + hgt), (tx + 0.1 * math.cos(b), ty + 0.1 * math.sin(b), G + hgt - 0.05), 0.019, outline=0.005)

# ---------- the Japanese coastal gun on the beach ----------
GX, GY = 0.0, -0.3
cyl('gunbase', M['concrete'], 0.17, 0.04, segs=22, outline=0.008, matrix=Matrix.Translation((GX, GY, G + 0.02)))
cyl('gunmount', M['rust'], 0.1, 0.05, segs=16, outline=0.008, matrix=Matrix.Translation((GX, GY, G + 0.06)))
box('gunshield', M['rust'], GX + 0.03, GY + 0.01, G + 0.1, 0.22, 0.14, 0.1, rot_z=0.35, outline=0.009, bevel=0)
box('gunbreech', M['rustDark'], GX + 0.13, GY + 0.05, G + 0.13, 0.08, 0.06, 0.06, rot_z=0.35, outline=0.006, bevel=0)
rod('gunbarrel', M['rustDark'], (GX - 0.02, GY - 0.01, G + 0.16), (GX - 0.5, GY - 0.19, G + 0.24), 0.026, r2=0.018, segs=12, outline=0.006)
lathe('gunmuzzle', M['rustDark'], ((0.024, 0), (0.024, 0.02)), G + 0.235, GX - 0.5, GY - 0.19, segs=10, outline=0.003)

# ---------- beach umbrellas ----------
for k, (x, y) in enumerate(((0.4, -0.3), (0.65, -0.12), (-0.6, 0.05))):
    rod(f'umbrellapole{k}', M['pole'], (x, y, G + 0.03), (x, y, G + 0.17), 0.005, segs=5, outline=0.002)
    lathe(f'umbrella{k}', M[f'u{k}'], ((0.09, 0), (0.06, 0.025), (0.004, 0.04)), G + 0.15, x, y, segs=12, outline=0.005)

# ---------- a boat across the lagoon ----------
BX, BY = 0.55, -0.85
loft('hull', M['hull'], [[(BX - 0.16, BY, G - 0.002), (BX + 0.1, BY - 0.05, G - 0.002), (BX + 0.18, BY, G - 0.002), (BX + 0.1, BY + 0.05, G - 0.002)],
                         [(BX - 0.18, BY, G + 0.06), (BX + 0.1, BY - 0.07, G + 0.06), (BX + 0.24, BY, G + 0.07), (BX + 0.1, BY + 0.07, G + 0.06)]], outline=0.008)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'canopypost{sx}{sy}', M['mast'], (BX + sx * 0.07, BY + sy * 0.04, G + 0.06), (BX + sx * 0.07, BY + sy * 0.04, G + 0.15), 0.004, segs=5, outline=0)
box('canopy', M['canopy'], BX, BY, G + 0.15, 0.18, 0.11, 0.012, outline=0.005, bevel=0)

turn(before, -20)
render(G)
