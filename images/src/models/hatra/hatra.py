# A cartoon Hatra for the country maps, built in the set's shared look (../toon.py):
# the Parthian city in Iraq's desert, its great temple's facade of tall arched iwans in pale
# limestone with smaller two-storey arches between them and a broken skyline, rows of columns in
# the court before it, a small temple with a few columns still standing, a stretch of the round
# city wall and its towers, palms and a camel. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hatra.py -- hatra-1024.png 1024 hatra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e6cf9a', shadow_mul=(0.84, 0.76, 0.72), lift=0.25),
    'lime': toon('lime', '#d9c39a', shadow_mul=(0.82, 0.76, 0.78)),
    'limeLight': toon('limeLight', '#ead9b4', shadow_mul=(0.82, 0.78, 0.8), lift=0.2),
    'hole': flat('hole', '#5a4030'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'camel': toon('camel', '#c89a5e'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(593)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


def arch(name, mat, x, y_front, z0, w, h, depth, outline=0.0):
    """An arch-topped slab standing on the facade (a rectangle under a half circle), `depth` deep."""
    zc = z0 + h - w / 2
    pts = [(x - w / 2, z0), (x + w / 2, z0)] + [(x + w / 2 * math.cos(t), zc + w / 2 * math.sin(t)) for t in (math.pi * k / 12 for k in range(13))]
    return loft(name, M[mat], [[(px, y_front, pz) for px, pz in pts], [(px, y_front + depth, pz) for px, pz in pts]], outline=outline)


# ---------- the great temple's facade of iwans ----------
FY = 0.075          # its front face
box('temple', M['lime'], 0, 0.3, G - 0.005, 1.5, 0.45, 0.42, outline=0.022, bevel=0)
box('cornice', M['limeLight'], 0, 0.3, G + 0.385, 1.52, 0.47, 0.02, outline=0.008, bevel=0)
for k, x in enumerate((-0.34, 0.34)):                    # the two great iwans
    arch(f'iwanrim{k}', 'limeLight', x, FY - 0.004, G - 0.005, 0.3, 0.36, 0.012, outline=0.005)
    arch(f'iwan{k}', 'hole', x, FY - 0.008, G - 0.005, 0.26, 0.34, 0.012)
for k, x in enumerate((-0.62, 0.0, 0.62)):               # the small two-storey ones between
    for j, (z0, h) in enumerate(((0.0, 0.15), (0.2, 0.13))):
        arch(f'smallrim{k}{j}', 'limeLight', x, FY - 0.004, G + z0 - 0.005, 0.15, h + 0.015, 0.012, outline=0.004)
        arch(f'small{k}{j}', 'hole', x, FY - 0.008, G + z0 - 0.005, 0.11, h, 0.012)
for k, x in enumerate((-0.515, -0.135, 0.135, 0.515)):
    box(f'pilaster{k}', M['limeLight'], x, FY - 0.006, G - 0.005, 0.03, 0.014, 0.39, outline=0.005, bevel=0)
# the broken top
for k in range(15):
    if rng.random() < 0.3:
        continue
    box(f'ruin{k}', M['lime'], -0.7 + k * 0.1, 0.3 + rng.uniform(-0.05, 0.05), G + 0.4, 0.09, rng.uniform(0.25, 0.4), rng.uniform(0.03, 0.11), outline=0.01, bevel=0)

# ---------- the columns in the court ----------
for k, h in enumerate((0.3, 0.12, 0.28, 0.3, 0.08, 0.26, 0.18)):
    x = -0.6 + k * 0.2
    cyl(f'colbase{k}', M['limeLight'], 0.05, 0.02, segs=12, outline=0.006, matrix=Matrix.Translation((x, -0.22, G + 0.005)))
    lathe(f'col{k}', M['lime'], ((0.034, 0), (0.03, h)), G + 0.01, x, -0.22, segs=12, outline=0.008)
    if h > 0.25:
        box(f'capital{k}', M['limeLight'], x, -0.22, G + 0.01 + h, 0.085, 0.085, 0.03, outline=0.006, bevel=0)
for k, (x, y, a) in enumerate(((-0.32, -0.45, 0.3), (0.45, -0.4, -0.5), (0.05, -0.52, 1.2))):
    rod(f'drum{k}', M['lime'], (x - 0.06 * math.cos(a), y - 0.06 * math.sin(a), G + 0.032), (x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.032), 0.032, segs=12, outline=0.008)

# ---------- a small temple with a few columns standing ----------
SX, SY = 0.82, -0.58
box('podium', M['limeLight'], SX, SY, G - 0.005, 0.36, 0.28, 0.06, outline=0.01, bevel=0)
for k, ((dx, dy), h) in enumerate(zip(((-0.14, -0.1), (-0.047, -0.1), (0.047, -0.1), (0.14, -0.1), (-0.14, 0.1), (0.14, 0.1)), (0.26, 0.26, 0.15, 0.26, 0.26, 0.09))):
    lathe(f'templecol{k}', M['lime'], ((0.024, 0), (0.021, h)), G + 0.055, SX + dx, SY + dy, segs=10, outline=0.006)
box('architrave', M['limeLight'], SX - 0.094, SY - 0.1, G + 0.315, 0.22, 0.05, 0.035, outline=0.006, bevel=0)

# ---------- a stretch of the round city wall at the back ----------
for k in range(16):
    a0, a1 = math.radians(25 + k * 8), math.radians(33 + k * 8)
    x0, y0, x1, y1 = 1.22 * math.cos(a0), 1.22 * math.sin(a0), 1.22 * math.cos(a1), 1.22 * math.sin(a1)
    h = rng.uniform(0.06, 0.14)
    box(f'citywall{k}', M['lime'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.07, h, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.01, bevel=0)
    if k % 4 == 0:
        lathe(f'citytower{k}', M['lime'], ((0.07, 0), (0.065, h + 0.07)), G - 0.005, x0, y0, segs=14, outline=0.01)

# ---------- palms and a camel ----------
for k, (x, y) in enumerate(((-1.0, 0.05), (-0.92, -0.3), (1.08, -0.08))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)

made = set(bpy.data.objects)
for dx in (-0.08, 0.08):
    for sy in (-1, 1):
        rod(f'camelleg{dx}{sy}', M['camel'], (dx, sy * 0.035, G), (dx, sy * 0.035, G + 0.17), 0.012, segs=8, outline=0.004)
squashed('camelbody', M['camel'], 0, 0, G + 0.2, 0.1, 1.5, 0.8, 0.7, outline=0.012)
ball('camelhump', M['camel'], -0.01, 0, G + 0.26, 0.06, outline=0.01)
rod('camelneck', M['camel'], (0.12, 0, G + 0.2), (0.2, 0, G + 0.3), 0.025, r2=0.02, segs=10, outline=0.006)
squashed('camelhead', M['camel'], 0.23, 0, G + 0.31, 0.035, 1.5, 0.9, 0.8, outline=0.006)
place(made, 200, -0.62, -0.62)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
