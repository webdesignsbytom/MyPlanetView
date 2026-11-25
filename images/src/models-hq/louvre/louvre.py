# The Louvre in the high-quality look (hq.py): the Cour Napoléon with I. M. Pei's glass pyramid in its
# rhomboid frame of steel, the three little pyramids and the triangular pools, and the palace's pale
# stone wings round the court: their rows of tall windows and dormers under steep slate roofs, the
# corner pavilions taller, the Pavillon de l'Horloge in the middle of the far wing with its square
# dome and lantern; visitors crossing the court. The court's open side faces the camera.
# Run: blender -b --factory-startup -P louvre.py -- louvre-1024.png 1024 louvre.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1793)
M['lutetian'] = material('lutetian', '#e3d9c3', 0.6, vary='#d4c8ae', vary_scale=24, bump=0.12, bump_scale=160)
M['pyramidGlass'] = material('pyramidGlass', '#9fc3d6', 0.04, metallic=0.6, coat=1.0, transmission=0.4)
M['frame'] = material('frame', '#5a5f66', 0.35, metallic=0.9)
OPEN, DORM = [], []
BARS = bmesh.new()


def member(p0, p1, t):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(BARS, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t, t, d.length, 1)))


def mansard(name, x0, x1, y0, y1, z0, rise, flat=0.35):
    """A mansard roof: steep slopes up to a narrower flat top."""
    bm = bmesh.new()
    inx, iny = (x1 - x0) * (1 - flat) / 2 * 0.5, (y1 - y0) * (1 - flat) / 2 * 0.5
    inset = min((x1 - x0), (y1 - y0)) * 0.28
    base = [(x0 - 0.008, y0 - 0.008), (x1 + 0.008, y0 - 0.008), (x1 + 0.008, y1 + 0.008), (x0 - 0.008, y1 + 0.008)]
    top = [(x0 + inset, y0 + inset), (x1 - inset, y0 + inset), (x1 - inset, y1 - inset), (x0 + inset, y1 - inset)]
    add_prism(bm, [bm.verts.new((x, y, z0)) for x, y in base], [bm.verts.new((x, y, z0 + rise)) for x, y in top])
    finish(name, bm, M['slate'], smooth_sides=False)


def wing(name, x0, x1, y0, y1, h, rise=0.1):
    box(name, M['lutetian'], ((x0 + x1) / 2, (y0 + y1) / 2, G + h / 2), (x1 - x0, y1 - y0, h), bevel=0.003)
    box(name + 'Cornice', M['lutetian'], ((x0 + x1) / 2, (y0 + y1) / 2, G + h - 0.006), (x1 - x0 + 0.014, y1 - y0 + 0.014, 0.012), bevel=0.002)
    box(name + 'Band', M['lutetian'], ((x0 + x1) / 2, (y0 + y1) / 2, G + h * 0.45), (x1 - x0 + 0.01, y1 - y0 + 0.01, 0.01), bevel=0.001)
    mansard(name + 'Roof', x0, x1, y0, y1, G + h, rise)
    for nrm, (ax, ay, bx, by) in (((0, -1), (x0, y0, x1, y0)), ((0, 1), (x1, y1, x0, y1)), ((1, 0), (x1, y0, x1, y1)), ((-1, 0), (x0, y1, x0, y0))):
        L = math.hypot(bx - ax, by - ay)
        n = max(1, int(L / 0.06))
        for j in range(n):
            f = (j + 0.5) / n
            px, py = ax + (bx - ax) * f, ay + (by - ay) * f
            OPEN.append((px, py, G + 0.035, 0.026, 0.075, nrm, 'round'))
            OPEN.append((px, py, G + h * 0.5 + 0.01, 0.026, 0.08, nrm, 'rect'))
            if j % 2 == 0:
                DORM.append((px + nrm[0] * 0.02, py + nrm[1] * 0.02, G + h + 0.02, 0.026, 0.04, nrm, 'round'))


def pavilion(name, x, y, w, d, h, rise=0.16, dome=False):
    box(name, M['lutetian'], (x, y, G + h / 2), (w, d, h), bevel=0.003)
    box(name + 'Cornice', M['lutetian'], (x, y, G + h - 0.006), (w + 0.016, d + 0.016, 0.014), bevel=0.002)
    if dome:
        lathe(name + 'Dome', M['slate'], [(w / 2 * math.sqrt(2), 0), (w / 2 * 0.9 * math.sqrt(2), 0.07), (w / 2 * 0.55 * math.sqrt(2), 0.15), (w / 2 * 0.2 * math.sqrt(2), 0.2), (0.0, 0.21)], (0, 0, 0), segs=4,
              matrix=Matrix.Translation((x, y, G + h)) @ Matrix.Rotation(math.pi / 4, 4, 'Z') @ Matrix.Diagonal((1.0, d / w, 1.0, 1)), smooth=True)
        lathe(name + 'Lantern', M['lutetian'], [(0.02, 0), (0.02, 0.04), (0.0, 0.07)], (x, y, G + h + 0.2), segs=8)
    else:
        mansard(name + 'Roof', x - w / 2, x + w / 2, y - d / 2, y + d / 2, G + h, rise)
    for nx, ny in ((0, -1), (1, 0), (-1, 0)):
        tx, ty = -ny, nx
        half = w / 2 if ny else d / 2
        for u in (-half * 0.5, 0.0, half * 0.5):
            OPEN.append((x + nx * w / 2 + tx * u, y + ny * d / 2 + ty * u, G + h * 0.55, 0.026, 0.09, (nx, ny), 'round'))
            OPEN.append((x + nx * w / 2 + tx * u, y + ny * d / 2 + ty * u, G + 0.035, 0.03, 0.09, (nx, ny), 'round'))


# ------------------------------------------------------------------ the court and the palace's wings
slab('court', M['paving'], rect(0.0, -0.18, 1.56, 1.3), G - 0.003, G + 0.006)
WH = 0.27
wing('sully', -0.72, 0.72, 0.45, 0.61, WH)
wing('richelieu', -0.93, -0.77, -0.82, 0.4, WH)
wing('denon', 0.77, 0.93, -0.82, 0.4, WH)
pavilion('horloge', 0.0, 0.53, 0.22, 0.22, 0.4, dome=True)
for k, (x, y) in enumerate(((-0.85, 0.53), (0.85, 0.53), (-0.85, -0.9), (0.85, -0.9))):
    pavilion(f'cornerPavilion{k}', x, y, 0.2, 0.2, 0.33)
for k, (x, y) in enumerate(((-0.85, -0.22), (0.85, -0.22))):
    pavilion(f'midPavilion{k}', x, y, 0.2, 0.18, 0.31)

# ------------------------------------------------------------------ the pyramid, the little pyramids and the pools
PX, PY, PB, PH = 0.0, -0.18, 0.5, 0.32
pyramid('pyramid', M['pyramidGlass'], PX, PY, G + 0.006, PB, PH)
apex = Vector((PX, PY, G + 0.006 + PH))
corners = [Vector((PX - PB / 2, PY - PB / 2, G + 0.006)), Vector((PX + PB / 2, PY - PB / 2, G + 0.006)), Vector((PX + PB / 2, PY + PB / 2, G + 0.006)), Vector((PX - PB / 2, PY + PB / 2, G + 0.006))]
for i in range(4):
    A, B = corners[i], corners[(i + 1) % 4]
    out = ((A + B) / 2 - Vector((PX, PY, A.z))).normalized() * 0.002
    member(A + out, apex, 0.006)
    member(A + out, B + out, 0.006)
    for j in range(1, 10):
        t = j / 10
        P = A + (B - A) * t + out
        member(P, B + (apex - B) * (1 - t) + out, 0.0025)
        member(P, A + (apex - A) * t + out, 0.0025)
for k, (x, y) in enumerate(((-0.42, -0.02), (0.42, -0.02), (0.0, 0.18))):
    pyramid(f'littlePyramid{k}', M['pyramidGlass'], x, y, G + 0.006, 0.12, 0.08)
for k, tri in enumerate((((-0.36, -0.45), (-0.06, -0.45), (-0.36, -0.75)), ((0.06, -0.45), (0.36, -0.45), (0.36, -0.75)),
                        ((-0.32, 0.1), (-0.32, -0.16), (-0.6, -0.16)), ((0.32, 0.1), (0.32, -0.16), (0.6, -0.16)))):
    slab(f'pool{k}', M['granite'], list(tri), G + 0.004, G + 0.02, margin=0.1)
    cx, cy = sum(p[0] for p in tri) / 3, sum(p[1] for p in tri) / 3
    slab(f'poolWater{k}', M['water'], [(cx + (x - cx) * 0.85, cy + (y - cy) * 0.85) for x, y in tri], G + 0.016, G + 0.022, margin=0.1)
for k, (x, y, shirt) in enumerate(((-0.15, -0.55, 'red'), (0.12, -0.6, 'blue'), (0.3, -0.35, 'yellow'), (-0.4, -0.3, 'green'), (0.0, -0.72, 'red'), (-0.55, 0.15, 'blue'), (0.55, 0.2, 'yellow'), (0.2, -0.85, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=G + 0.006)

windows('openings', M['shadow'], OPEN, depth=0.008)
windows('dormers', M['lutetian'], DORM, depth=0.03)
finish('pyramidFrame', BARS, M['frame'], smooth_sides=False)
render('louvre')
