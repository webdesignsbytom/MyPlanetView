# The Great Wall of China (Badaling) in the high-quality look (hq.py): forested hills rolling to the
# base's edge, and the wall winding over them along the ridges: its body of grey stone following the
# ground, the walkway on top, crenellations on the outer side and a low parapet on the inner,
# square watchtowers on the heights with their arched openings and battlements, a pavilion with red
# posts and a dark roof on the highest; trees in summer green with a few turning, and walkers.
# Run: blender -b --factory-startup -P great-wall.py -- great-wall-1024.png 1024 great-wall.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1505)
M['wallStone'] = material('wallStone', '#c4b9a3', 0.8, vary='#978c78', vary_scale=30, bump=0.35, bump_scale=150)
M['walkway'] = material('walkway', '#8d8473', 0.85, vary='#7c7465', vary_scale=40, bump=0.3, bump_scale=200)
M['forest'] = material('forestFloor', '#5aa53e', 0.85, vary='#4f9636', vary_scale=7, bump=0.25, bump_scale=200)
M['postRed'] = material('postRed', '#b8322a', 0.5)
M['tiles'] = material('tiles', '#3d4148', 0.5, vary='#353840', vary_scale=20, bump=0.12, bump_scale=300)
M['autumn'] = material('autumn', '#d9822e', 0.8, vary='#c86d24', vary_scale=14, bump=0.4, bump_scale=90)
M['autumnRed'] = material('autumnRed', '#c0482c', 0.8, vary='#a83e26', vary_scale=14, bump=0.4, bump_scale=90)


def H(x, y):
    r = math.hypot(x, y)
    taper = max(0.0, 1 - (r / 1.49) ** 6)
    h = (0.44 * math.exp(-((x + 0.55) ** 2 / 0.2 + (y + 0.12) ** 2 / 0.32))
         + 0.62 * math.exp(-((x - 0.52) ** 2 / 0.18 + (y - 0.36) ** 2 / 0.26))
         + 0.38 * math.exp(-((x - 0.05) ** 2 / 0.3 + (y - 0.95) ** 2 / 0.12))
         + 0.3 * math.exp(-((x + 0.75) ** 2 / 0.15 + (y - 0.75) ** 2 / 0.15))
         + 0.12 * math.exp(-((x - 0.0) ** 2 / 0.2 + (y + 0.95) ** 2 / 0.1))
         + 0.025 * math.sin(7 * x + 1) * math.cos(6 * y))
    return max(0.0, h) * taper


terrain('hills', H, [M['forest'], M['rock']], lambda z, nz, x, y: 1 if nz < 0.62 else 0, rings=64, segs=200)

# ------------------------------------------------------------------ the wall along the ridges
CTRL = [(-1.3, -0.46), (-0.92, -0.3), (-0.55, -0.14), (-0.22, -0.04), (0.06, 0.1), (0.3, 0.24), (0.53, 0.36), (0.84, 0.46), (1.22, 0.6)]


def catmull(pts, n):
    P = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = (Vector(P[j]) for j in (i - 1, i, i + 1, i + 2))
        for s in range(n):
            t = s / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(Vector(pts[-1]))
    return out


path = catmull(CTRL, 18)
W, WH = 0.13, 0.11
body, top, parapet = bmesh.new(), bmesh.new(), bmesh.new()
prev = None
samples = []
for i, p in enumerate(path):
    q = path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]
    q.normalize()
    n = Vector((-q.y, q.x))
    z = G + H(p.x, p.y)
    samples.append((p, q, n, z))
for i, (p, q, n, z) in enumerate(samples):
    L = p + n * (W / 2)
    R = p - n * (W / 2)
    zt = z + WH
    vb = [body.verts.new((L.x, L.y, z - 0.07)), body.verts.new((R.x, R.y, z - 0.07)), body.verts.new((R.x, R.y, zt)), body.verts.new((L.x, L.y, zt))]
    vt = [top.verts.new((L.x - n.x * 0.012, L.y - n.y * 0.012, zt + 0.001)), top.verts.new((R.x + n.x * 0.012, R.y + n.y * 0.012, zt + 0.001))]
    if prev is None:
        first_vb = vb
    if prev:
        pb, pt = prev
        body.faces.new((pb[0], pb[3], vb[3], vb[0]))
        body.faces.new((pb[1], vb[1], vb[2], pb[2]))
        top.faces.new((pt[0], vt[0], vt[1], pt[1]))
    prev = (vb, vt)
    # the outer side's crenellations, the inner side's low parapet
    if i % 2 == 0:
        c = L - n * 0.006
        bmesh.ops.create_cube(parapet, size=1.0, matrix=Matrix.Translation((c.x, c.y, zt + 0.018)) @ Matrix.Rotation(math.atan2(q.y, q.x), 4, 'Z') @ Matrix.Diagonal((0.024, 0.016, 0.046, 1)))
    if i < len(samples) - 1:
        p2, _, _, z2 = samples[i + 1]
        a = R + n * 0.006
        b = (p2 - samples[i + 1][2] * (W / 2)) + samples[i + 1][2] * 0.006
        mid = (a + b) / 2
        seg = (b - a)
        bmesh.ops.create_cube(parapet, size=1.0, matrix=Matrix.Translation((mid.x, mid.y, (zt + z2 + WH) / 2 + 0.01)) @ Matrix.Rotation(math.atan2(seg.y, seg.x), 4, 'Z') @ Matrix.Diagonal((seg.length + 0.004, 0.016, 0.026, 1)))
body.faces.new(first_vb)
body.faces.new(list(reversed(prev[0])))
finish('wallBody', body, M['wallStone'], smooth_sides=False)
finish('walkway', top, M['walkway'], smooth_sides=False)
finish('parapets', parapet, M['wallStone'], bevel=0.002, smooth_sides=False)


def watchtower(name, x, y, pavilion=False):
    z = G + H(x, y)
    h = 0.34
    box(name, M['wallStone'], (x, y, z + h / 2 - 0.04), (0.24, 0.24, h + 0.08), bevel=0.004)
    specs = []
    for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
        tx, ty = -ny, nx
        for u in (-0.045, 0.045):
            specs.append((x + nx * 0.12 + tx * u, y + ny * 0.12 + ty * u, z + 0.15, 0.045, 0.09, (nx, ny), 'round'))
    windows(name + 'Openings', M['shadow'], specs, depth=0.008)
    box(name + 'Cornice', M['wallStone'], (x, y, z + h - 0.035), (0.258, 0.258, 0.016), bevel=0.002)
    bm = bmesh.new()
    for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0)):
        tx, ty = -ny, nx
        for k in range(5):
            u = -0.105 + k * 0.0525
            bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x + nx * 0.12 + tx * u, y + ny * 0.12 + ty * u, z + h - 0.008)) @ Matrix.Diagonal((0.026 if ny else 0.018, 0.018 if ny else 0.026, 0.046, 1)))
    finish(name + 'Merlons', bm, M['wallStone'], bevel=0.002, smooth_sides=False)
    if pavilion:
        for sx in (-1, 1):
            for sy in (-1, 1):
                cylinder(f'{name}Post{sx}{sy}', M['postRed'], 0.01, 0.12, (x + sx * 0.07, y + sy * 0.07, z + h - 0.03), segs=8)
        hip_roof(name + 'Roof', M['tiles'], x, y, z + h + 0.09, 0.19, 0.19, 0.1, over=0.03)
    return z


for k, (x, y, pav) in enumerate(((-0.55, -0.14, False), (0.06, 0.1, False), (0.53, 0.36, True), (-1.0, -0.32, False), (0.95, 0.5, False))):
    watchtower(f'tower{k}', x, y, pav)

# ------------------------------------------------------------------ the forest, and walkers on the wall
def near_wall(x, y, d):
    return any((p.x - x) ** 2 + (p.y - y) ** 2 < d * d for p, _, _, _ in samples[::2])


placed = 0
for k in range(400):
    a = rng.uniform(0, 2 * math.pi)
    r = 1.38 * math.sqrt(rng.random())
    x, y = r * math.cos(a), r * math.sin(a)
    if near_wall(x, y, 0.17):
        continue
    mat = 'leaf' if rng.random() < 0.8 else rng.choice(('autumn', 'autumnRed', 'leafDark'))
    tree(f'tree{k}', x, y, h=0.1 + 0.04 * rng.random(), r=0.038 + 0.015 * rng.random(), mat=mat, z=G + H(x, y) - 0.01)
    placed += 1
    if placed > 95:
        break
for k, i in enumerate((14, 22, 30, 60, 75, 95, 120)):
    p, q, n, z = samples[i]
    person(f'walker{k}', p.x + n.x * 0.015 * (k % 2), p.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k % 4], z=z + WH)

render('great-wall')
