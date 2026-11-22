# A cartoon Leptis Magna for the country maps, built in the set's shared look (../toon.py): the Roman
# city by the Mediterranean, its theatre's half-round of stone seats rising towards the sea behind,
# the columns of the stage building in front of it, the four-way Arch of Septimius Severus with
# columns at its corners, a row of forum columns, and palms and olive trees on the sandy ground.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P leptis-magna.py -- leptis-magna-1024.png 1024 leptis-magna.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e2cf9e', shadow_mul=(0.84, 0.76, 0.64), lift=0.25),
    'sea': toon('sea', '#3fa3d6', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'stone': toon('stone', '#e3c38a', shadow_mul=(0.84, 0.74, 0.66)),
    'stoneDark': toon('stoneDark', '#c9a46a', shadow_mul=(0.84, 0.74, 0.66)),
    'marble': toon('marble', '#f0e8d8', shadow_mul=(0.8, 0.8, 0.88), lift=0.2),
    'palm': toon('palm', '#5a9e4a', shadow_mul=(0.7, 0.78, 0.8)),
    'olive': toon('olive', '#8aa064', shadow_mul=(0.74, 0.8, 0.78)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(313)

# ---------- the sea along the back ----------
R = 1.42
SEA = [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(28, 153, 8)] + [(-1.1, 0.7), (-0.4, 0.92), (0.4, 0.9), (1.1, 0.72)]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in SEA])])
finish('sea', bm, M['sea'], outline=0.01)


def column(name, x, y, z0, h, r, mat='marble'):
    lathe(f'{name}base', M['stoneDark'], ((r * 1.4, 0), (r * 1.4, 0.02), (r * 1.1, 0.03)), z0, x, y, segs=12, outline=0.006)
    rod(name, M[mat], (x, y, z0 + 0.03), (x, y, z0 + h - 0.035), r, r2=r * 0.88, segs=12, outline=0.01)
    lathe(f'{name}capital', M['stoneDark'], ((r * 0.9, 0), (r * 1.4, 0.035)), z0 + h - 0.035, x, y, segs=12, outline=0.006)


# ---------- the theatre: the half-round of seats rising towards the sea, the stage in front ----------
TX, TY = -0.3, 0.35
ROWS = 7
for k in range(ROWS):
    r_in, r_out = 0.18 + k * 0.065, 0.18 + (k + 1) * 0.065
    z0, z1 = G - 0.005, G + 0.035 * (k + 1)
    a0, a1 = math.radians(0), math.radians(180)
    n = 18
    arc_out = [(TX + r_out * math.cos(a0 + (a1 - a0) * j / n), TY + r_out * 0.85 * math.sin(a0 + (a1 - a0) * j / n)) for j in range(n + 1)]
    arc_in = [(TX + r_in * math.cos(a1 - (a1 - a0) * j / n), TY + r_in * 0.85 * math.sin(a1 - (a1 - a0) * j / n)) for j in range(n + 1)]
    pts = arc_out + arc_in
    loft(f'seats{k}', M['stone' if k % 2 == 0 else 'stoneDark'], [[(x, y, z0) for x, y in pts], [(x, y, z1) for x, y in pts]], outline=0.012)
# the orchestra and the stage with its columns
cyl('orchestra', M['marble'], 0.17, 0.012, segs=24, outline=0.008, matrix=Matrix.Translation((TX, TY, G + 0.0)) @ Matrix.Scale(0.85, 4, (0, 1, 0)))
box('stage', M['stone'], TX, TY - 0.12, G - 0.005, 0.95, 0.12, 0.06, outline=0.014, bevel=0)
for k in range(9):
    column(f'stagecol{k}', TX - 0.4 + k * 0.1, TY - 0.15, G + 0.055, 0.3 if k % 4 else 0.36, 0.018)
box('stageentab', M['stone'], TX - 0.2, TY - 0.15, G + 0.355, 0.42, 0.04, 0.03, outline=0.008, bevel=0)

# ---------- the Arch of Septimius Severus ----------
AX, AY, AS, AH = 0.62, -0.35, 0.36, 0.42
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'pier{sx}{sy}', M['stone'], AX + sx * (AS / 2 - 0.05), AY + sy * (AS / 2 - 0.05), G - 0.005, 0.1, 0.1, AH, outline=0.016, bevel=0)
        for cx, cy in ((sx * AS / 2 + sx * 0.012, sy * (AS / 2 - 0.05)), (sx * (AS / 2 - 0.05), sy * AS / 2 + sy * 0.012)):
            column(f'archcol{sx}{sy}{cx}', AX + cx, AY + cy, G - 0.005, AH - 0.03, 0.014)
box('attic', M['stone'], AX, AY, G + AH - 0.01, AS + 0.04, AS + 0.04, 0.1, outline=0.018, bevel=0)
box('atticband', M['stoneDark'], AX, AY, G + AH - 0.01, AS + 0.05, AS + 0.05, 0.02, outline=0, bevel=0)
# the lintel over the four ways through
box('lintel', M['stone'], AX, AY, G + AH - 0.09, AS - 0.06, AS - 0.06, 0.08, outline=0.012, bevel=0)

# ---------- a row of forum columns ----------
for k in range(5):
    column(f'forumcol{k}', -0.85 + k * 0.13, -0.5, G - 0.005, 0.36 if k != 3 else 0.2, 0.022)
box('forumentab', M['stone'], -0.72, -0.5, G + 0.35, 0.3, 0.05, 0.03, outline=0.008, bevel=0)

# ---------- palms and olive trees ----------
for k, (x, y) in enumerate(((1.05, 0.3), (0.85, 0.55), (-1.1, -0.15), (0.2, -0.9))):
    h = rng.uniform(0.28, 0.34)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h), 0.016, r2=0.012, segs=8, outline=0.007)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + h), (x + 0.02 + 0.12 * math.cos(b), y + 0.12 * math.sin(b), G + h - 0.06), 0.024, outline=0.006)
for k, (x, y) in enumerate(((-0.55, -0.95), (0.95, -0.75), (-1.0, 0.3))):
    rod(f'olivetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.02, segs=8, outline=0.008)
    ball(f'olive{k}', M['olive'], x, y, G + 0.17, 0.1, outline=0.016)

turn(before, -20)
render(G)
