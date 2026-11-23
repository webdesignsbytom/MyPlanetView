# A cartoon Paphos Archaeological Park for the country maps, built in the set's shared look
# (../toon.py): the Roman villas' mosaic floors laid open among their low ruined walls, a row of
# standing columns, the arches of the Saranta Kolones fort, the white Paphos lighthouse, the dry
# grass and olive trees of the headland, and the Mediterranean beyond. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P paphos.py -- paphos-1024.png 1024 paphos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#c9c07a', shadow_mul=(0.82, 0.78, 0.68), lift=0.25),
    'sea': toon('sea', '#3fa3d6', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'stone': toon('stone', '#d8c8a8', shadow_mul=(0.82, 0.78, 0.8)),
    'stoneDark': toon('stoneDark', '#b8a684', shadow_mul=(0.82, 0.78, 0.8)),
    'marble': toon('marble', '#f0e8d8', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'lamp': toon('lamp', '#f4d860', shadow_mul=(0.8, 0.68, 0.55), lift=0.4),
    'dark': flat('dark', '#4a3a30'),
    'm1': flat('m1', '#c8503a'), 'm2': flat('m2', '#f0e2c0'), 'm3': flat('m3', '#3a3a42'), 'm4': flat('m4', '#d8a040'), 'm5': flat('m5', '#4a7a9a'),
    'olive': toon('olive', '#8aa064', shadow_mul=(0.74, 0.8, 0.78)),
    'trunk': toon('trunk', '#7a6048'),
    'path': toon('path2', '#e8dcc0', lift=0.25),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(487)

# ---------- the Mediterranean beyond the headland ----------
R = 1.42
# a segment of the circle cut by a straight coast, so its one face can never fold over the land
SEA = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(70, 206, 9)] + [(R * math.cos(math.radians(205)), R * math.sin(math.radians(205)))]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in SEA])])
finish('sea', bm, M['sea'], outline=0.01)

# ---------- a villa's mosaic floor among its low walls ----------
MX, MY = 0.15, -0.25
PAL = ('m1', 'm2', 'm3', 'm4', 'm5')
for i in range(8):
    for j in range(6):
        ring = max(abs(i - 3.5), abs(j - 2.5))
        mat = PAL[int(ring * 2 + (i + j) % 2) % 5] if ring > 1 else ('m4' if (i + j) % 2 else 'm1')
        box(f'tess{i}{j}', M[mat], MX - 0.28 + i * 0.08, MY - 0.2 + j * 0.08, G - 0.002, 0.08, 0.08, 0.008, outline=0, bevel=0)
for k, (x, y, w, d, h) in enumerate(((MX, MY - 0.25, 0.7, 0.035, 0.06), (MX, MY + 0.25, 0.7, 0.035, 0.1), (MX - 0.35, MY, 0.035, 0.5, 0.08), (MX + 0.35, MY + 0.05, 0.035, 0.4, 0.05),
                                     (MX + 0.6, MY - 0.05, 0.035, 0.45, 0.07), (MX + 0.48, MY - 0.28, 0.25, 0.035, 0.04))):
    box(f'villawall{k}', M['stone'], x, y, G - 0.005, w, d, h, outline=0.01, bevel=0)
box('path', M['path'], MX - 0.05, -0.85, G - 0.005, 0.18, 0.55, 0.01, outline=0.005, bevel=0)

# ---------- a row of standing columns ----------
for k in range(5):
    x = -0.22 + k * 0.12
    h = 0.34 if k != 2 else 0.18
    lathe(f'colbase{k}', M['stoneDark'], ((0.03, 0), (0.03, 0.02), (0.024, 0.03)), G - 0.005, x, 0.35, segs=12, outline=0.005)
    rod(f'col{k}', M['marble'], (x, 0.35, G + 0.025), (x, 0.35, G + h), 0.02, r2=0.018, segs=12, outline=0.007)
    if k != 2:
        lathe(f'colcap{k}', M['stoneDark'], ((0.02, 0), (0.03, 0.025)), G + h, x, 0.35, segs=12, outline=0.005)
box('entablature', M['stone'], -0.16, 0.35, G + 0.36, 0.17, 0.05, 0.035, outline=0.008, bevel=0)
for k in range(3):
    rod(f'drum{k}', M['marble'], (0.08 + k * 0.06, 0.5, G + 0.02), (0.12 + k * 0.06, 0.54, G + 0.02), 0.02, segs=10, outline=0.006)

# ---------- the arches of the Saranta Kolones fort ----------
FX, FY = 0.65, 0.4
for k in range(3):
    x = FX - 0.15 + k * 0.15
    for s in (-1, 1):
        box(f'fortpier{k}{s}', M['stoneDark'], x + s * 0.05, FY, G - 0.005, 0.035, 0.08, 0.16, outline=0.008, bevel=0)
    box(f'fortlintel{k}', M['stoneDark'], x, FY, G + 0.155, 0.135, 0.08, 0.04, outline=0.008, bevel=0)
box('fortwall', M['stoneDark'], FX + 0.25, FY + 0.1, G - 0.005, 0.06, 0.3, 0.12, outline=0.01, bevel=0)

# ---------- the lighthouse ----------
LX, LY = -0.55, -0.12
lathe('lighthouse', M['white'], ((0.075, 0), (0.06, 0.55)), G - 0.005, LX, LY, segs=16, outline=0.016)
for k, z in enumerate((0.2, 0.36)):
    box(f'lhwin{k}', M['dark'], LX, LY - 0.07, G + z, 0.022, 0.01, 0.04, outline=0, bevel=0)
lathe('lhgallery', M['white'], ((0.08, 0), (0.08, 0.02)), G + 0.545, LX, LY, segs=16, outline=0.01)
lathe('lhlantern', M['lamp'], ((0.04, 0), (0.04, 0.06)), G + 0.565, LX, LY, segs=12, outline=0.008)
lathe('lhcap', M['stoneDark'], ((0.05, 0), (0.004, 0.05)), G + 0.625, LX, LY, segs=12, outline=0.006)
box('lhhouse', M['white'], LX + 0.14, LY + 0.02, G - 0.005, 0.16, 0.12, 0.09, outline=0.01, bevel=0)

# ---------- olive trees ----------
for k, (x, y) in enumerate(((0.95, -0.35), (0.75, -0.75), (-0.45, -0.6), (1.05, 0.05), (-0.2, -1.05))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.1), 0.022, segs=8, outline=0.008)
    b = ball(f'olive{k}', M['olive'], 0, 0, 0, 0.11, outline=0.016)
    b.scale = (1.2, 1.2, 0.8)
    b.location = (x + 0.02, y, G + 0.18)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
