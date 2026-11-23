# A cartoon Taroko Gorge for the country maps, built in the set's shared look (../toon.py): sheer
# marble cliffs streaked grey on either side of the gorge, forest along their tops, the turquoise
# Liwu River winding between them, the Eternal Spring Shrine perched on the cliff with its waterfall
# pouring out beneath it, and a red bridge across the river at the front. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P taroko.py -- taroko-1024.png 1024 taroko.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'marble': toon('marble', '#dcd8cf', shadow_mul=(0.78, 0.78, 0.88), lift=0.2),
    'streak': toon('streak', '#b5b2aa', shadow_mul=(0.78, 0.78, 0.88)),
    'top': toon('top', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#3a7f43', shadow_mul=(0.7, 0.78, 0.8)),
    'river': toon('river', '#3fc1c4', shadow_mul=(0.72, 0.84, 0.88), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'red': toon('red', '#c8402f'),
    'roofGreen': toon('roofGreen', '#2f8a6a', shadow_mul=(0.7, 0.78, 0.8)),
    'roofGold': toon('roofGold', '#e8a83a', shadow_mul=(0.8, 0.68, 0.55)),
    'stoneLight': toon('stoneLight', '#ece8dd', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'pebble': toon('pebble', '#c9c4b8', shadow_mul=(0.8, 0.8, 0.88)),
})

G = tile(M['pebble'])
before = set(bpy.data.objects)
rng = random.Random(227)
SIDES = 20


def streaked(name, rings, dark):
    """A cliff whose columns of faces take the darker streak where dark(k, i)."""
    bm = bmesh.new()
    verts = [[bm.verts.new(p) for p in ring] for ring in rings]
    n = len(rings[0])
    for i in range(len(verts) - 1):
        for k in range(n):
            f = bm.faces.new((verts[i][k], verts[i][(k + 1) % n], verts[i + 1][(k + 1) % n], verts[i + 1][k]))
            f.material_index = 1 if dark(k, i) else 0
    bm.faces.new(list(reversed(verts[0])))
    bm.faces.new(verts[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (M['marble'], M['streak'], toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.03, 1.0, True, False, 2
    ob.visible_shadow = False
    return ob


def wall_of_rock(name, pts, h, outward, peak):
    """A canyon wall: the outline `pts` (anticlockwise) rising sheer to h in streaked marble, then the
    forested mountainside climbing away from the gorge to `peak` above it."""
    dark = {k for k in range(len(pts)) if rng.random() < 0.4}
    rings = [[(x, y, G - 0.01 + h * j / 4) for x, y in pts] for j in range(5)]
    streaked(name, rings, lambda k, i: k in dark and i >= k % 3)
    cx = sum(x for x, _ in pts) / len(pts) + outward * 0.22
    cy = sum(y for _, y in pts) / len(pts)

    def toward(s, z):
        return [(cx + (x - cx) * s, cy + (y - cy) * s, G + z) for x, y in pts]
    slope = loft(name + 'slope', M['top'], [toward(1.0, h - 0.005), toward(0.93, h + 0.03), toward(0.55, h + peak * 0.7), toward(0.15, h + peak)],
                 outline=0.025)
    slope.visible_shadow = False
    for k, (s, z) in enumerate(((0.8, 0.25), (0.8, 0.25), (0.8, 0.25), (0.5, 0.75), (0.5, 0.75))):
        i = (k * 7 + 3) % len(pts)
        x, y = pts[i]
        ball(f'{name}tree{k}', M['forest'], cx + (x - cx) * s, cy + (y - cy) * s, G + h + peak * z + 0.04, rng.uniform(0.07, 0.1), outline=0.016)


R = 1.3


def arc(a0, a1, n):
    return [(R * math.cos(math.radians(a0 + (a1 - a0) * k / n)), R * math.sin(math.radians(a0 + (a1 - a0) * k / n))) for k in range(n + 1)]


def inner_edge(x, y0, y1, n, wiggle):
    return [(x + wiggle * math.sin(3.1 * (y0 + (y1 - y0) * k / n) + x * 7), y0 + (y1 - y0) * k / n) for k in range(n + 1)]


# ---------- the canyon's two walls, either side of the river ----------
LEFT = arc(118, 218, 10) + [(-0.6, -0.8)] + inner_edge(-0.27, -0.74, 1.0, 9, 0.04)
wall_of_rock('left', LEFT, 0.55, -1, 0.35)
RIGHT = arc(-38, 62, 10) + inner_edge(0.29, 1.0, -0.74, 9, 0.04) + [(0.6, -0.8)]
wall_of_rock('right', RIGHT, 0.48, 1, 0.3)

# ---------- the river winding between them ----------
KNOTS = [(0.05, 1.3), (-0.05, 0.7), (0.08, 0.2), (-0.05, -0.4), (0.06, -0.9), (0.0, -1.38)]
path = []
for (x0, y0), (x1, y1), (x2, y2) in zip(KNOTS, KNOTS[1:], KNOTS[2:]):
    ax, ay, bx, by = (x0 + x1) / 2, (y0 + y1) / 2, (x1 + x2) / 2, (y1 + y2) / 2
    for j in range(6):
        t = j / 6
        path.append(((1 - t) ** 2 * ax + 2 * (1 - t) * t * x1 + t * t * bx, (1 - t) ** 2 * ay + 2 * (1 - t) * t * y1 + t * t * by))
path = [KNOTS[0]] + path + [KNOTS[-1]]
bm = bmesh.new()
left, right = [], []
for k, (x, y) in enumerate(path):
    (xa, ya), (xb, yb) = path[max(0, k - 1)], path[min(len(path) - 1, k + 1)]
    d = math.hypot(xb - xa, yb - ya) or 1
    px, py = -(yb - ya) / d, (xb - xa) / d
    w = 0.13
    left.append(bm.verts.new((x + px * w, y + py * w, G + 0.006)))
    right.append(bm.verts.new((x - px * w, y - py * w, G + 0.006)))
for k in range(len(path) - 1):
    bm.faces.new((left[k], right[k], right[k + 1], left[k + 1]))
finish('river', bm, M['river'], outline=0.012)

# ---------- the Eternal Spring Shrine on the left cliff, its waterfall beneath ----------
SX, SY = 0.29, -0.28         # on the right wall's face across the gorge, the side the camera sees
SZ = G + 0.32
box('ledge', M['stoneLight'], SX - 0.06, SY, SZ - 0.04, 0.2, 0.18, 0.04, outline=0.012, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'shrinecol{sx}{sy}', M['red'], (SX - 0.06 + sx * 0.06, SY + sy * 0.05, SZ), (SX - 0.06 + sx * 0.06, SY + sy * 0.05, SZ + 0.1), 0.01, segs=8,
            outline=0.004)
box('shrinebody', M['red'], SX - 0.06, SY, SZ, 0.1, 0.08, 0.08, outline=0.01, bevel=0)
for k, (w, z, h) in enumerate(((0.2, 0.1, 0.05), (0.15, 0.16, 0.06))):
    loft(f'shrineroof{k}', M['roofGreen' if k == 0 else 'roofGold'],
         [[(SX - 0.06 - w / 2, SY - w * 0.42, SZ + z), (SX - 0.06 + w / 2, SY - w * 0.42, SZ + z), (SX - 0.06 + w / 2, SY + w * 0.42, SZ + z),
           (SX - 0.06 - w / 2, SY + w * 0.42, SZ + z)],
          [(SX - 0.065, SY - 0.004, SZ + z + h), (SX - 0.055, SY - 0.004, SZ + z + h), (SX - 0.055, SY + 0.004, SZ + z + h),
           (SX - 0.065, SY + 0.004, SZ + z + h)]], outline=0.01)
    if k == 0:
        box('shrinedrum', M['red'], SX - 0.06, SY, SZ + z + 0.04, 0.06, 0.05, 0.03, outline=0.006, bevel=0)
# the falls pour out beneath it into the river
for k in range(6):
    t = k / 6
    z1 = SZ - 0.04 - t * (SZ - 0.04 - G)
    z0 = SZ - 0.04 - (t + 1 / 6) * (SZ - 0.04 - G)
    w = 0.05 + 0.04 * t
    x = SX - 0.17 - 0.05 * t
    loft(f'fall{k}', M['foam'], [[(x - 0.01, SY - w / 2, z0), (x + 0.01, SY - w / 2, z0), (x + 0.01, SY + w / 2, z0), (x - 0.01, SY + w / 2, z0)],
                                 [(x - 0.01, SY - w / 2, z1), (x + 0.01, SY - w / 2, z1), (x + 0.01, SY + w / 2, z1), (x - 0.01, SY + w / 2, z1)]],
         outline=0.006 if k == 0 else 0)
for k, (dy, r) in enumerate(((-0.04, 0.05), (0.04, 0.045), (0.0, 0.06))):
    ball(f'spray{k}', M['foam'], SX - 0.26, SY + dy, G + 0.03, r, outline=0.01)

# ---------- the red bridge across the river at the front ----------
BY = -1.0
arch = [(math.cos(t) * 0.24, 0.04 + math.sin(t) * 0.1) for t in (math.pi * k / 12 for k in range(13))]
for side in (-1, 1):
    y = BY + side * 0.05
    for k, ((x0, z0), (x1, z1)) in enumerate(zip(arch, arch[1:])):
        bar(f'archrib{side}{k}', M['red'], (x0, y, G + z0), (x1, y, G + z1), 0.025, outline=0.006)
box('bridgedeck', M['red'], 0, BY, G + 0.13, 0.62, 0.13, 0.025, outline=0.012, bevel=0)
for side in (-1, 1):
    box(f'bridgerail{side}', M['red'], 0, BY + side * 0.06, G + 0.155, 0.62, 0.012, 0.035, outline=0.006, bevel=0)
    for k, x in enumerate((-0.28, 0.28)):
        box(f'bridgeend{side}{k}', M['stoneLight'], x, BY + side * 0.06, G + 0.15, 0.04, 0.04, 0.06, outline=0.008, bevel=0)
for k, x in enumerate((-0.31, 0.31)):
    box(f'abutment{k}', M['stoneLight'], x, BY, G - 0.005, 0.1, 0.18, 0.14, outline=0.012, bevel=0)

turn(before, -32)   # looking straight up the gorge, so both walls' faces, the river and the shrine show
render(G)
