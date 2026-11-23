# A cartoon Island of Mozambique for the country maps, built in the set's shared look (../toon.py) on
# a tile of the Indian Ocean: the narrow coral island, the great star-shaped Fort of São Sebastião at
# its tip with the little Chapel of Nossa Senhora do Baluarte, the Stone Town's colonial houses with
# their arcades and the palace in its terracotta red, palms, and dhows under their lateen sails in
# the turquoise shallows. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mozambique-island.py -- mozambique-island-1024.png 1024 mozambique-island.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f9ac8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'shallows': toon('shallows', '#5fd0c8', shadow_mul=(0.74, 0.86, 0.88), lift=0.35),
    'sand': toon('sand', '#f0dcae', shadow_mul=(0.84, 0.78, 0.7), lift=0.25),
    'fort': toon('fort', '#d8c49a', shadow_mul=(0.84, 0.78, 0.74)),
    'fortDark': toon('fortDark', '#b8a27a', shadow_mul=(0.84, 0.78, 0.74)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'terracotta': toon('terracotta', '#c8573a'),
    'yellow': toon('hyellow', '#f2d27a', shadow_mul=(0.84, 0.74, 0.62)),
    'blue': toon('hblue', '#8ab4d8', shadow_mul=(0.74, 0.78, 0.88)),
    'window': flat('window', '#3a3640'),
    'grass': toon('grass2', '#8ab55a', shadow_mul=(0.72, 0.8, 0.76)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'dhow': toon('dhow', '#8a5a3c'),
    'sail': toon('sail', '#f6f0e0', shadow_mul=(0.82, 0.84, 0.92), lift=0.15),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(457)


def place(made_before, degrees, x, y):
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


# ---------- the island: long and narrow, running from the fort at the front left away to the back right ----------
AXIS = math.radians(35)
CA, SA = math.cos(AXIS), math.sin(AXIS)


def at(u, v):
    """A point along the island (u) and across it (v)."""
    return (-0.1 + u * CA - v * SA, 0.05 + u * SA + v * CA)


outline_pts = [at(1.15 * math.cos(t), 0.38 * math.sin(t) * (1 + 0.15 * math.cos(t))) for t in (2 * math.pi * k / 28 for k in range(28))]
shallows = [at(1.3 * math.cos(t), 0.52 * math.sin(t)) for t in (2 * math.pi * k / 28 for k in range(28))]
bm = bmesh.new()
bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in shallows])])
finish('shallows', bm, M['shallows'], outline=0)
loft('island', M['sand'], [[(x, y, G - 0.005) for x, y in outline_pts], [(x, y, G + 0.04) for x, y in outline_pts]], outline=0.018)
T = G + 0.04

# ---------- the star fort at the island's tip ----------
fx, fy = at(-0.72, 0.0)
made = set(bpy.data.objects)
STAR = []
for k in range(8):
    a = 2 * math.pi * k / 8 + math.pi / 8
    r = 0.34 if k % 2 == 0 else 0.22
    STAR.append((r * math.cos(a), r * math.sin(a)))
loft('fortwall', M['fort'], [[(x, y, T - 0.005) for x, y in STAR], [(x * 0.95, y * 0.95, T + 0.14) for x, y in STAR]], outline=0.02)
inner = [(x * 0.78, y * 0.78) for x, y in STAR]
loft('fortyard', M['grass'], [[(x, y, T + 0.135) for x, y in inner], [(x, y, T + 0.145) for x, y in inner]], outline=0.008)
for k, (x, y) in enumerate(STAR[::2]):
    lathe(f'sentry{k}', M['fortDark'], ((0.025, 0), (0.025, 0.06)), T + 0.13, x * 0.92, y * 0.92, segs=10, outline=0.006)
    lathe(f'sentrydome{k}', M['fortDark'], ((0.028, 0), (0.004, 0.035)), T + 0.19, x * 0.92, y * 0.92, segs=10, outline=0.005)
box('fortbuilding', M['fortDark'], 0.03, 0.02, T + 0.14, 0.18, 0.12, 0.08, outline=0.012, bevel=0)
# the little chapel on the point
box('chapel', M['white'], -0.25, -0.02, T + 0.14, 0.08, 0.06, 0.06, outline=0.008, bevel=0)
pyramid('chapelroof', M['terracotta'], -0.25, -0.02, T + 0.2, 0.09, 0.04, outline=0.006)
place(made, 35, fx, fy)

# ---------- the Stone Town: colonial houses and the red palace ----------
for k in range(9):
    u = -0.25 + k * 0.15
    v = 0.12 if k % 2 else -0.12
    x, y = at(u, v)
    mat = ('white', 'yellow', 'blue')[k % 3]
    if k == 4:
        mat = 'terracotta'
    w = 0.2 if k == 4 else 0.12
    box(f'house{k}', M[mat], x, y, T - 0.005, w, 0.1, 0.12 if k == 4 else 0.09, rot_z=AXIS, outline=0.012, bevel=0)
    box(f'houseroof{k}', M['white'], x, y, T + (0.115 if k == 4 else 0.085), w + 0.01, 0.11, 0.012, rot_z=AXIS, outline=0.006, bevel=0)
    for j in range(2):
        wx, wy = at(u - w / 4 + j * w / 2, v - 0.051 if v < 0 else v + 0.051)
        box(f'housewin{k}{j}', M['window'], wx, wy, T + 0.03, 0.02, 0.01, 0.04, rot_z=AXIS, outline=0, bevel=0)
for k, (u, v) in enumerate(((0.95, 0.0), (0.75, 0.2), (0.6, -0.22), (-0.35, 0.25))):
    x, y = at(u, v)
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, T), (x + 0.02, y, T + h), 0.014, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, T + h), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), T + h - 0.05), 0.02, outline=0.006)


# ---------- dhows under their lateen sails ----------
def dhow(name, x, y, deg):
    made = set(bpy.data.objects)
    hull0 = [(-0.12, 0, G - 0.005), (0.0, -0.035, G - 0.005), (0.14, 0, G + 0.01), (0.0, 0.035, G - 0.005)]
    hull1 = [(-0.13, 0, G + 0.04), (0.0, -0.05, G + 0.04), (0.17, 0, G + 0.06), (0.0, 0.05, G + 0.04)]
    loft(f'{name}hull', M['dhow'], [hull0, hull1], outline=0.008)
    rod(f'{name}mast', M['dhow'], (0.02, 0, G + 0.04), (0.04, 0, G + 0.24), 0.005, segs=6, outline=0)
    loft(f'{name}sail', M['sail'], [[(-0.14, -0.002, G + 0.1), (0.1, -0.002, G + 0.3), (0.05, -0.002, G + 0.07)],
                                    [(-0.14, 0.002, G + 0.1), (0.1, 0.002, G + 0.3), (0.05, 0.002, G + 0.07)]], outline=0.006)
    place(made, deg, x, y)


for k, (x, y, d) in enumerate(((0.65, -0.65, 30), (-0.75, 0.55, 200), (0.95, 0.15, 120), (-0.2, -1.0, 10))):
    dhow(f'dhow{k}', x, y, d)

turn(before, -20)
render(G)
