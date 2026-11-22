# A cartoon Great Wall of China (Badaling) for the country maps, built in the set's shared look
# (../toon.py): two grassy hills on the tile, the wall winding over them with battlements on
# both sides, a square watchtower on each hilltop, and a pavilion with red posts and a dark
# tiled roof on the higher one.
# Run: blender -b --factory-startup -P great-wall.py -- great-wall-1024.png 1024 great-wall.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'brick': toon('brick', '#cfc2a8', shadow_mul=(0.78, 0.74, 0.80)),
    'brickDark': toon('brickDark', '#b3a487'),
    'roofTile': toon('roofTile', '#4f5d6e', shadow_mul=(0.75, 0.75, 0.85), lift=0.25),
    'post': toon('post', '#c4382c'),
    'window': flat('window', '#4b3a55'),
})

G = tile()

# ---------- the hills ----------
HILLS = ((-0.5, 0.35, 0.55, 0.2), (0.55, -0.35, 0.4, 0.16))   # x, y, height, spread


def ground(x, y):
    return G + 0.004 + sum(h * math.exp(-((x - hx) ** 2 + (y - hy) ** 2) / s) for hx, hy, h, s in HILLS)


RINGS, AROUND, RADIUS = 18, 60, 1.42
bm = bmesh.new()
centre = bm.verts.new((0, 0, ground(0, 0)))
rings = [[bm.verts.new((r * math.cos(a), r * math.sin(a), ground(r * math.cos(a), r * math.sin(a))))
          for a in (2 * math.pi * k / AROUND for k in range(AROUND))]
         for r in (RADIUS * (i + 1) / RINGS for i in range(RINGS))]
for k in range(AROUND):
    bm.faces.new((centre, rings[0][k], rings[0][(k + 1) % AROUND]))
for i in range(RINGS - 1):
    for k in range(AROUND):
        j = (k + 1) % AROUND
        bm.faces.new((rings[i][k], rings[i + 1][k], rings[i + 1][j], rings[i][j]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
hills = finish('hills', bm, M['grass'], outline=0.03, smooth=True)
hills.visible_shadow = False  # rolling ground shadowing itself speckled the grass

# ---------- the wall's path: through both hilltops, across the tile ----------
CONTROL = [(-1.32, 0.42), (-0.9, 0.5), (-0.5, 0.35), (-0.12, 0.08), (0.22, -0.2), (0.55, -0.35), (0.92, -0.55), (1.2, -0.74)]
STEPS = 9
TOWERS = (2 * STEPS, 5 * STEPS)   # the samples on the two hilltops


def catmull(p0, p1, p2, p3, t):
    return tuple(0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3)
                 for a, b, c, d in zip(p0, p1, p2, p3))


pts = [CONTROL[0], *CONTROL, CONTROL[-1]]
path = []
for s in range(len(CONTROL) - 1):
    for k in range(STEPS):
        path.append(catmull(pts[s], pts[s + 1], pts[s + 2], pts[s + 3], k / STEPS))
path.append(CONTROL[-1])

WIDTH, HIGH = 0.2, 0.16
samples = []
for i, (x, y) in enumerate(path):
    a, b = path[max(0, i - 1)], path[min(len(path) - 1, i + 1)]
    t = Vector((b[0] - a[0], b[1] - a[1], 0)).normalized()
    n = Vector((-t.y, t.x, 0))
    z = ground(x, y)
    samples.append((Vector((x, y, 0)), t, n, z))

loft('wall', M['brick'],
     [[(*(p + n * WIDTH / 2).xy, z - 0.06), (*(p - n * WIDTH / 2).xy, z - 0.06),
       (*(p - n * WIDTH / 2).xy, z + HIGH), (*(p + n * WIDTH / 2).xy, z + HIGH)] for p, t, n, z in samples],
     outline=0.03)

# battlements along both sides, away from the towers
for i, (p, t, n, z) in enumerate(samples):
    if i % 2 or any(abs(i - k) < 3 for k in TOWERS):
        continue
    heading = math.atan2(t.y, t.x)
    for side in (-1, 1):
        q = p + n * side * (WIDTH / 2 - 0.02)
        box(f'merlon{i}{side}', M['brickDark'], q.x, q.y, z + HIGH, 0.05, 0.035, 0.05, rot_z=heading, outline=0.012, bevel=0)


# ---------- the watchtowers ----------
def face_angle(d):
    """The rot_z that turns a thin box's front (-Y) to face direction d."""
    return math.atan2(d.x, -d.y)


for k, i in enumerate(TOWERS):
    p, t, n, z = samples[i]
    heading = math.atan2(t.y, t.x)
    size, top = 0.34, z + HIGH + 0.2
    box(f'tower{k}', M['brick'], p.x, p.y, z - 0.06, size, size, top - (z - 0.06), rot_z=heading, outline=0.035, bevel=0.012)
    for d in (t, -t, n, -n):
        side = Vector((-d.y, d.x, 0))
        for off in (-0.07, 0.07):
            q = p + d * (size / 2 + 0.006) + side * off
            box(f'win{k}{d.x:.2f}{d.y:.2f}{off}', M['window'], q.x, q.y, top - 0.17, 0.05, 0.02, 0.07,
                rot_z=face_angle(d), outline=0, bevel=0)
            cyl(f'wintop{k}{d.x:.2f}{d.y:.2f}{off}', M['window'], 0.025, 0.02, segs=10, outline=0,
                matrix=Matrix.Translation((q.x, q.y, top - 0.1)) @ Matrix.Rotation(face_angle(d), 4, 'Z')
                @ Matrix.Rotation(math.pi / 2, 4, 'X'))
        for off in (-0.13, 0.0, 0.13):
            q = p + d * (size / 2 - 0.02) + side * off
            box(f'tmerlon{k}{d.x:.2f}{d.y:.2f}{off}', M['brickDark'], q.x, q.y, top, 0.05, 0.04, 0.05,
                rot_z=face_angle(d), outline=0.012, bevel=0)
    if k == 0:
        # the pavilion: red posts and a dark tiled roof, its eaves wide
        for sx in (-1, 1):
            for sy in (-1, 1):
                q = p + t * sx * 0.1 + n * sy * 0.1
                rod(f'post{sx}{sy}', M['post'], (q.x, q.y, top), (q.x, q.y, top + 0.15), 0.018, outline=0.012)
        box('eaves', M['roofTile'], p.x, p.y, top + 0.15, 0.4, 0.4, 0.03, rot_z=heading, outline=0.02, bevel=0)
        roof = pyramid('roof', M['roofTile'], 0, 0, 0, 0.34, 0.15, outline=0.025)
        roof.matrix_world = Matrix.Translation((p.x, p.y, top + 0.18)) @ Matrix.Rotation(heading, 4, 'Z')
        ball('rooftop', M['gold'], p.x, p.y, top + 0.34, 0.025, outline=0.012)

render(G)
