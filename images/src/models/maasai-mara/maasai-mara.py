# A cartoon Maasai Mara for the country maps, built in the set's shared look (../toon.py) on a tile
# of golden savanna: flat-topped acacias, a giraffe and an elephant, the wildebeest of the Great
# Migration crossing the Mara River, granite boulders, and a hot-air balloon drifting over it all
# at dawn. Turned a little towards the camera.
# Run: blender -b --factory-startup -P maasai-mara.py -- maasai-mara-1024.png 1024 maasai-mara.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'savanna': toon('savanna', '#d9c36a', shadow_mul=(0.82, 0.74, 0.62), lift=0.25),
    'tuft': toon('tuft', '#b9a24e', shadow_mul=(0.82, 0.74, 0.62)),
    'acacia': toon('acacia', '#6a9e4e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b4a33'),
    'river': toon('river', '#6aa7a0', shadow_mul=(0.75, 0.82, 0.86), lift=0.3),
    'bank': toon('bank', '#a88660'),
    'giraffe': toon('giraffe', '#e8b65c', shadow_mul=(0.84, 0.72, 0.6)),
    'spot': flat('spot', '#8a5a2e'),
    'elephant': toon('elephant', '#9a9893', shadow_mul=(0.78, 0.78, 0.86)),
    'tusk': toon('tusk', '#f4efe2', lift=0.2),
    'gnu': toon('gnu', '#5b5048', shadow_mul=(0.8, 0.78, 0.86)),
    'rock': toon('rock', '#a39d93', shadow_mul=(0.76, 0.76, 0.86)),
    'balloonRed': toon('balloonRed', '#e0453a'),
    'balloonYellow': toon('balloonYellow', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'basket': toon('basket', '#9a6b43'),
    'rope': flat('rope', '#5a4636'),
})

G = tile(M['savanna'])
before = set(bpy.data.objects)
rng = random.Random(113)


def place(made_before, degrees, x, y):
    """Turns what was made since `made_before` (built facing +X at the origin) and moves it to (x, y)."""
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    bpy.context.view_layer.update()   # so the squashed balls' scale and place are in their matrices
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the Mara River across the front, with its muddy banks ----------
KNOTS = [(-1.32, 0.22), (-0.9, -0.05), (-0.45, -0.45), (0.05, -0.65), (0.3, -1.0), (0.38, -1.3)]
path = []
for (x0, y0), (x1, y1), (x2, y2) in zip(KNOTS, KNOTS[1:], KNOTS[2:]):
    ax, ay, bx, by = (x0 + x1) / 2, (y0 + y1) / 2, (x1 + x2) / 2, (y1 + y2) / 2
    for j in range(8):
        t = j / 8
        path.append(((1 - t) ** 2 * ax + 2 * (1 - t) * t * x1 + t * t * bx, (1 - t) ** 2 * ay + 2 * (1 - t) * t * y1 + t * t * by))
path = [KNOTS[0]] + path + [KNOTS[-1]]


def ribbon(name, mat, width, z, outline):
    bm = bmesh.new()
    left, right = [], []
    for k, (x, y) in enumerate(path):
        (xa, ya), (xb, yb) = path[max(0, k - 1)], path[min(len(path) - 1, k + 1)]
        d = math.hypot(xb - xa, yb - ya) or 1
        px, py = -(yb - ya) / d, (xb - xa) / d
        left.append(bm.verts.new((x + px * width, y + py * width, z)))
        right.append(bm.verts.new((x - px * width, y - py * width, z)))
    for k in range(len(path) - 1):
        bm.faces.new((left[k], right[k], right[k + 1], left[k + 1]))
    finish(name, bm, mat, outline=outline)


ribbon('bank', M['bank'], 0.2, G + 0.003, 0.012)
ribbon('river', M['river'], 0.13, G + 0.008, 0)


# ---------- wildebeest: a little herd, and some swimming across ----------
def gnu(name, x, y, degrees, swimming=False):
    made = set(bpy.data.objects)
    z = -0.03 if swimming else 0.0
    box(f'{name}body', M['gnu'], 0, 0, G + z + 0.05, 0.12, 0.05, 0.055, outline=0.008, bevel=0.006)
    box(f'{name}hump', M['gnu'], 0.03, 0, G + z + 0.09, 0.05, 0.045, 0.025, outline=0.006, bevel=0.006)
    box(f'{name}head', M['gnu'], 0.075, 0, G + z + 0.05, 0.04, 0.032, 0.05, outline=0.006, bevel=0.005)
    for s in (-1, 1):
        bar(f'{name}horn{s}', M['tusk'], (0.07, s * 0.012, G + z + 0.1), (0.06, s * 0.03, G + z + 0.115), 0.008, outline=0)
    if not swimming:
        for dx in (-0.04, 0.04):
            for s in (-1, 1):
                rod(f'{name}leg{dx}{s}', M['gnu'], (dx, s * 0.016, G), (dx, s * 0.016, G + 0.055), 0.008, segs=6, outline=0.004)
    place(made, degrees, x, y)


for k, (x, y) in enumerate(((-1.0, 0.42), (-0.82, 0.5), (-0.95, 0.62), (-0.68, 0.38), (-0.6, 0.6), (-0.78, 0.75), (-0.45, 0.48),
                            (-1.05, 0.45))):
    gnu(f'herd{k}', x, y, -50 + rng.uniform(-15, 15))
for k, t in enumerate((0.36, 0.4, 0.45)):
    x, y = path[int(t * len(path))]
    gnu(f'swim{k}', x + rng.uniform(-0.04, 0.04), y + rng.uniform(-0.04, 0.04), -60, swimming=True)
for k, (x, y) in enumerate(((-0.05, -0.95), (0.18, -0.85))):
    gnu(f'over{k}', x, y, -40)

# ---------- the giraffe ----------
made = set(bpy.data.objects)
for dx in (-0.06, 0.06):
    for s in (-1, 1):
        rod(f'giraffeleg{dx}{s}', M['giraffe'], (dx, s * 0.03, G), (dx, s * 0.03, G + 0.3), 0.014, segs=8, outline=0.008)
box('giraffebody', M['giraffe'], 0, 0, G + 0.28, 0.2, 0.09, 0.1, outline=0.014, bevel=0.02)
bar('giraffeneck', M['giraffe'], (0.07, 0, G + 0.34), (0.15, 0, G + 0.72), 0.045, outline=0.01)
box('giraffehead', M['giraffe'], 0.18, 0, G + 0.7, 0.09, 0.045, 0.045, outline=0.01, bevel=0.012)
for s in (-1, 1):
    rod(f'ossicone{s}', M['trunk'], (0.155, s * 0.012, G + 0.74), (0.15, s * 0.014, G + 0.78), 0.006, segs=6, outline=0)
    for k in range(4):
        squashed(f'spot{s}{k}', M['spot'], -0.07 + k * 0.045, s * 0.046, G + 0.32 + (k % 2) * 0.025, 0.018, 1, 0.3, 1, outline=0)
    for k in range(3):
        t = 0.2 + k * 0.25
        squashed(f'neckspot{s}{k}', M['spot'], 0.07 + 0.08 * t, s * 0.024, G + 0.34 + 0.38 * t, 0.012, 1, 0.3, 1, outline=0)
bar('giraffetail', M['giraffe'], (-0.1, 0, G + 0.36), (-0.13, 0, G + 0.24), 0.01, outline=0)
place(made, 160, 0.42, 0.18)

# ---------- the elephant ----------
made = set(bpy.data.objects)
for dx in (-0.1, 0.1):
    for s in (-1, 1):
        cyl(f'elephantleg{dx}{s}', M['elephant'], 0.045, 0.22, segs=12, outline=0.012, matrix=Matrix.Translation((dx, s * 0.07, G + 0.11)))
squashed('elephantbody', M['elephant'], 0, 0, G + 0.3, 0.19, 1.25, 0.85, 0.85, outline=0.022)
ball('elephanthead', M['elephant'], 0.23, 0, G + 0.36, 0.1, outline=0.018)
for s in (-1, 1):
    squashed(f'ear{s}', M['elephant'], 0.2, s * 0.1, G + 0.36, 0.1, 0.35, 0.6, 1.0, outline=0.014)
    bar(f'tusk{s}', M['tusk'], (0.29, s * 0.035, G + 0.3), (0.35, s * 0.04, G + 0.25), 0.014, outline=0.004)
rod('trunk1', M['elephant'], (0.3, 0, G + 0.34), (0.34, 0, G + 0.2), 0.03, r2=0.024, segs=10, outline=0.01)
rod('trunk2', M['elephant'], (0.34, 0, G + 0.2), (0.33, 0, G + 0.08), 0.024, r2=0.018, segs=10, outline=0.01)
bar('elephanttail', M['elephant'], (-0.23, 0, G + 0.32), (-0.26, 0, G + 0.2), 0.012, outline=0)
place(made, 200, -0.25, 0.62)

# ---------- flat-topped acacias ----------
for k, (x, y, h, r) in enumerate(((0.95, 0.62, 0.36, 0.3), (-0.2, 1.05, 0.3, 0.24), (1.0, -0.35, 0.3, 0.24))):
    rod(f'acaciatrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + h * 0.6), 0.03, r2=0.022, segs=8, outline=0.012)
    for j in range(3):
        a = 2 * math.pi * j / 3 + k
        rod(f'branch{k}{j}', M['trunk'], (x + 0.02, y, G + h * 0.6), (x + 0.02 + r * 0.55 * math.cos(a), y + r * 0.55 * math.sin(a), G + h), 0.016,
            r2=0.01, segs=6, outline=0.008)
    squashed(f'canopy{k}', M['acacia'], x + 0.02, y, G + h + 0.03, r, 1, 1, 0.22, outline=0.022)

# ---------- granite boulders and grass tufts ----------
for k, (x, y, r) in enumerate(((0.62, 0.95, 0.12), (0.78, 0.9, 0.09), (0.55, 1.08, 0.08))):
    b = squashed(f'boulder{k}', M['rock'], x, y, G + r * 0.4, r, 1, 0.9, 0.75, outline=0.02)
    b.visible_shadow = False
for k in range(26):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.3, 1.32)
    x, y = r * math.cos(a), r * math.sin(a)
    rod(f'tuft{k}', M['tuft'], (x, y, G), (x, y, G + 0.05), 0.02, r2=0.0, segs=6, outline=0.004)


# ---------- the hot-air balloon ----------
def striped(name, a, b, x, y, z0, profile, stripes=14):
    n = stripes * 2
    bm = bmesh.new()
    rings = [[bm.verts.new((x + r * math.cos(2 * math.pi * k / n), y + r * math.sin(2 * math.pi * k / n), z0 + h)) for k in range(n)]
             for r, h in profile]
    for i in range(len(rings) - 1):
        for k in range(n):
            f = bm.faces.new((rings[i][k], rings[i][(k + 1) % n], rings[i + 1][(k + 1) % n], rings[i + 1][k]))
            f.material_index = k % 2
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (a, b, toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.022, 1.0, True, False, 2


BX, BY, BZ = -0.72, 0.95, G + 0.62
striped('envelope', M['balloonRed'], M['balloonYellow'], BX, BY, BZ + 0.16,
        ((0.07, 0), (0.15, 0.08), (0.24, 0.2), (0.28, 0.32), (0.27, 0.44), (0.2, 0.54), (0.09, 0.6), (0.005, 0.61)))
box('basket', M['basket'], BX, BY, BZ, 0.09, 0.09, 0.07, outline=0.01, bevel=0.005)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'rope{sx}{sy}', M['rope'], (BX + sx * 0.04, BY + sy * 0.04, BZ + 0.07), (BX + sx * 0.05, BY + sy * 0.05, BZ + 0.16), 0.004, segs=4,
            outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
