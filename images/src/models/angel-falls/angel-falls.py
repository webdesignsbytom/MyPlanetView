# A cartoon Angel Falls for the country maps, built in the set's shared look (../toon.py): the
# flat-topped Auyán-tepui with its sheer, fluted sandstone cliffs and green top, the falls dropping
# in one long white ribbon from a cleft in its rim and turning to mist before the foot, a cloud
# drifting over the top, the jungle slopes below and the river running out to the front.
# Run: blender -b --factory-startup -P angel-falls.py -- angel-falls-1024.png 1024 angel-falls.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'cliff': toon('cliff', '#b56d45', shadow_mul=(0.8, 0.7, 0.74)),
    'streak': toon('streak', '#9a5838', shadow_mul=(0.8, 0.7, 0.74)),
    'rim': toon('rim', '#8f5236', shadow_mul=(0.8, 0.7, 0.74)),
    'top': toon('top', '#6aa452', shadow_mul=(0.7, 0.78, 0.8)),
    'slope': toon('slope', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'jungle': toon('jungle', '#3a7f43', shadow_mul=(0.7, 0.78, 0.8)),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'cloud': toon('cloud', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
    'trunk': toon('trunk', '#6b4a33'),
})

G = tile(M['slope'])
before = set(bpy.data.objects)
rng = random.Random(71)

CX, CY, RX, RY = 0.0, 0.4, 1.0, 0.6
FOOT, TOP = 0.28, 1.4
SIDES = 40
FALLS_AT = math.radians(-102)          # where the falls leave the rim, round from +X
ANGLES = [2 * math.pi * k / SIDES for k in range(SIDES)]
# the cliff's outline: buttresses and gullies, the same all the way up so the walls stay sheer
NOISE = [1 + 0.06 * math.sin(3 * a + 1.0) + 0.04 * math.sin(7 * a + 2.0) + rng.uniform(-0.025, 0.025) for a in ANGLES]
for k, a in enumerate(ANGLES):
    gap = abs(math.atan2(math.sin(a - FALLS_AT), math.cos(a - FALLS_AT)))
    if gap < 0.12:
        NOISE[k] -= 0.1       # the cleft the falls come from
    elif k % 9 == 4:
        NOISE[k] -= 0.07      # other gullies


def outline(z, scale, extra=0.0):
    return [(CX + (RX * scale * n + extra) * math.cos(a), CY + (RY * scale * n + extra) * math.sin(a), G + z) for a, n in zip(ANGLES, NOISE)]


SMOOTH = [1 + 0.06 * math.sin(3 * a + 1.0) + 0.04 * math.sin(7 * a + 2.0) for a in ANGLES]


def slope_outline(z, extra):
    return [(CX + (RX * n + extra) * math.cos(a), CY + (RY * n + extra) * math.sin(a), G + z) for a, n in zip(ANGLES, SMOOTH)]


def streaked(name, a, b, rings, dark):
    """A loft whose columns of faces take material b where dark(k) is true: the dark streaks down a tepui's walls."""
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
    for mat in (a, b, toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.035, 1.0, True, False, 2
    return ob


def point(scale, extra, a=FALLS_AT):
    """A point on the outline at angle a (the noise read from the nearest vertex)."""
    n = NOISE[round(a / (2 * math.pi) * SIDES) % SIDES]
    return CX + (RX * scale * n + extra) * math.cos(a), CY + (RY * scale * n + extra) * math.sin(a)


# ---------- the jungle slopes at the foot of the cliffs ----------
talus = loft('talus', M['slope'], [slope_outline(-0.01, 0.3), slope_outline(FOOT * 0.55, 0.13), slope_outline(FOOT + 0.02, -0.02)], outline=0.035)
talus.visible_shadow = False

# ---------- the tepui: sheer fluted cliffs, a dark rim, the green top ----------
STREAKS = {k for k in range(SIDES) if rng.random() < 0.3}
LEVELS = 6
cliff = streaked('cliff', M['cliff'], M['streak'],
                 [outline(FOOT + (TOP - 0.06 - FOOT) * j / LEVELS, 1.0 - 0.03 * j / LEVELS) for j in range(LEVELS + 1)],
                 lambda k, i: k in STREAKS and i >= (k * 7) % 3)
rim = loft('rim', M['rim'], [outline(TOP - 0.065, 0.97), outline(TOP, 0.965)], outline=0.03)
top = loft('top', M['top'], [outline(TOP - 0.005, 0.95), outline(TOP + 0.05, 0.9)], outline=0.025)
cliff.visible_shadow = rim.visible_shadow = top.visible_shadow = False
for k, (x, y, r) in enumerate(((-0.55, 0.55, 0.12), (-0.3, 0.75, 0.1), (0.35, 0.68, 0.13), (0.62, 0.42, 0.1), (0.1, 0.85, 0.11), (-0.1, 0.3, 0.09))):
    ball(f'topbush{k}', M['jungle'], x, y, G + TOP + 0.07, r, outline=0.02)

# ---------- the falls: one ribbon from the cleft, widening and swaying a little, into mist ----------
fx, fy = point(0.965, 0.0)
nx, ny = math.cos(FALLS_AT), math.sin(FALLS_AT)          # out from the cliff
tx, ty = -ny, nx                                            # along it
box('stream', M['water'], fx - nx * 0.05, fy - ny * 0.05, G + TOP + 0.01, 0.1, 0.16, 0.035, rot_z=FALLS_AT, outline=0.01, bevel=0)
rings = []
for k in range(9):
    t = k / 8
    z = TOP + 0.03 - (TOP - 0.5) * t
    w = 0.05 + 0.09 * t
    out = 0.03 + 0.05 * t
    sway = 0.015 * math.sin(t * 5)
    cx, cy = point(0.97 - 0.03 * t, out)
    cx, cy = cx + tx * sway, cy + ty * sway
    rings.append([(cx - tx * w / 2, cy - ty * w / 2, G + z), (cx - tx * w / 2 + nx * 0.02, cy - ty * w / 2 + ny * 0.02, G + z),
                  (cx + tx * w / 2 + nx * 0.02, cy + ty * w / 2 + ny * 0.02, G + z), (cx + tx * w / 2, cy + ty * w / 2, G + z)])
loft('falls', M['foam'], list(reversed(rings)), outline=0.01)
# the mist where it turns to spray, and at the foot
mx, my = point(1.0, 0.12)
for k, (d, dz, r) in enumerate(((-0.06, 0.52, 0.09), (0.07, 0.48, 0.08), (0.0, 0.42, 0.11), (-0.1, 0.34, 0.1), (0.1, 0.32, 0.1), (0.0, 0.27, 0.13))):
    ball(f'mist{k}', M['foam'], mx + tx * d, my + ty * d, G + dz, r, outline=0.018)

# ---------- the river from the foot of the falls out to the front, one ribbon ----------
sx, sy = point(1.0, 0.24)
KNOTS = [(sx, sy), (sx - 0.1, sy - 0.25), (sx + 0.08, sy - 0.52), (sx - 0.04, sy - 0.8), (sx + 0.04, -1.42)]
path = []
for (x0, y0), (x1, y1), (x2, y2) in zip(KNOTS, KNOTS[1:], KNOTS[2:]):
    for j in range(8):
        t = j / 8
        # a quadratic through the midpoints, so the bends are smooth
        ax, ay = (x0 + x1) / 2, (y0 + y1) / 2
        bx, by = (x1 + x2) / 2, (y1 + y2) / 2
        path.append(((1 - t) ** 2 * ax + 2 * (1 - t) * t * x1 + t * t * bx, (1 - t) ** 2 * ay + 2 * (1 - t) * t * y1 + t * t * by))
path = [KNOTS[0]] + path + [KNOTS[-1]]
bm = bmesh.new()
left, right = [], []
for k, (x, y) in enumerate(path):
    (xa, ya), (xb, yb) = path[max(0, k - 1)], path[min(len(path) - 1, k + 1)]
    d = math.hypot(xb - xa, yb - ya) or 1
    px, py = -(yb - ya) / d, (xb - xa) / d
    w = 0.06 + 0.03 * k / len(path)
    left.append(bm.verts.new((x + px * w, y + py * w, G + 0.006)))
    right.append(bm.verts.new((x - px * w, y - py * w, G + 0.006)))
for k in range(len(path) - 1):
    bm.faces.new((left[k], right[k], right[k + 1], left[k + 1]))
finish('river', bm, M['water'], outline=0.012)

# ---------- a cloud drifting over the top ----------
for k, (x, y, z, r) in enumerate(((0.55, 0.55, 0.2, 0.15), (0.75, 0.5, 0.22, 0.12), (0.4, 0.5, 0.16, 0.11), (0.62, 0.42, 0.13, 0.1))):
    ball(f'cloud{k}', M['cloud'], x, y, G + TOP + z, r, outline=0.02)

# ---------- jungle trees on the slopes and the plain ----------
for k, (x, y) in enumerate(((-0.85, -0.55), (-0.6, -0.85), (0.4, -0.7), (0.75, -0.45), (1.05, -0.05), (-1.15, -0.15), (0.35, -1.1),
                            (-0.75, -1.05), (0.95, -0.75))):
    r = rng.uniform(0.11, 0.15)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.02, segs=8, outline=0.01)
    ball(f'tree{k}', M['jungle'], x, y, G + 0.1 + r * 0.6, r, outline=0.02)

turn(before, -20)
render(G)
