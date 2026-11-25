# Machu Picchu in the high-quality look (hq.py), made afresh: the narrow ridge between the peaks with
# its steep jungle slopes falling to the Urubamba's valley, the river at the foot; the agricultural
# terraces stepping down the front in long curving bands, their walls of fitted stone and their grass
# tops; the town on the ridge: rows of granite houses with gable walls, trapezoid doorways and
# windows, some with their thatch back, the great plaza's lawn, the curved Temple of the Sun, the
# Temple of the Three Windows, the Intihuatana on its stepped hill; Huayna Picchu's steep green
# sugarloaf behind with its cliffs, Machu Picchu mountain rising at the side; llamas and visitors.
# Run: blender -b --factory-startup -P machu-picchu.py -- machu-picchu-1024.png 1024 machu-picchu.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1450)
M['inca'] = masonry('incaWall', '#bcb5a5', '#7c766a', scale=48.0, rough=0.85, vary='#aaa394')
M['jungle'] = material('jungle', '#3c8a37', 0.85, vary='#2d6f2a', vary_scale=12, bump=0.8, bump_scale=55)
M['terraceGrass'] = material('terraceGrass', '#74c24a', 0.82, vary='#68b442', vary_scale=7, bump=0.12, bump_scale=420)
M['cliff'] = material('cliff', '#8c8679', 0.85, vary='#777166', vary_scale=4, bump=0.6, bump_scale=30)
M['thatch'] = material('thatch', '#c9a45c', 0.9, vary='#b38f4c', vary_scale=40, bump=0.6, bump_scale=300)
M['river'] = material('river', '#5f9db4', 0.2, vary='#6aa8bd', vary_scale=4, coat=0.7)
M['llama'] = material('llama', '#f2ece0', 0.9, vary='#e3d8c4', vary_scale=20)
M['llamaBrown'] = material('llamaBrown', '#9a6d45', 0.9)
PZ = 0.5          # the town's level on the ridge
RZ = 0.62
HX, HY = 0.55, 0.66   # Huayna Picchu


def H(x, y):
    r = math.hypot(x, y)
    taper = max(0.0, 1 - (r / 1.49) ** 6)
    ridge = min(PZ, RZ * math.exp(-((y - 0.02) / 0.42) ** 2))
    d = math.hypot(x - HX, y - HY)
    hp = 1.42 * max(0.0, 1 - (d / 0.36) ** 2) ** 0.6
    skirt = 0.8 * math.exp(-(d / 0.46) ** 2)
    mp = 1.05 * math.exp(-((x + 1.12) ** 2 / 0.1 + (y - 0.2) ** 2 / 0.22))
    side = 0.5 * math.exp(-((x - 1.15) ** 2 / 0.08 + (y + 0.35) ** 2 / 0.2))
    return max(ridge, hp, skirt, mp, side, 0.02) * taper


def pick(z, nz, x, y):
    if z > PZ + 0.04:
        a = math.atan2(y - HY, x - HX)
        return 2 if (nz < 0.22 and math.sin(5 * a + 1) > 0.2) else 0
    if abs(z - PZ) < 0.01 and nz > 0.95:
        return 1
    return 0


terrain('mountains', H, [M['jungle'], M['terraceGrass'], M['cliff']], pick, rings=120, segs=320)
river = [(-1.6, -1.02), (-0.8, -1.1), (0.0, -1.18), (0.8, -1.06), (1.6, -0.9), (1.6, -0.97), (0.8, -1.13), (0.0, -1.26), (-0.8, -1.18), (-1.6, -1.1)]
slab('urubamba', M['river'], river, G + 0.02, G + 0.028, margin=0.02)

# ------------------------------------------------------------------ the agricultural terraces stepping down the front
for k in range(9):
    zt = G + PZ - 0.03 - 0.045 * k
    yf = -0.2 - 0.062 * k
    x0, x1 = -1.0 + 0.03 * k, -0.18 - 0.02 * k
    pts = []
    for j in range(13):
        f = j / 12
        x = x0 + (x1 - x0) * f
        pts.append((x, yf - 0.025 * math.sin(math.pi * f)))
    pts += [(x1, yf + 0.13), (x0, yf + 0.13)]
    slab(f'terraceWall{k}', M['inca'], pts, zt - 0.32, zt - 0.006, margin=0.06)
    slab(f'terraceTop{k}', M['terraceGrass'], pts, zt - 0.007, zt, margin=0.06)
for k in range(4):
    zt = G + PZ - 0.03 - 0.045 * k
    yf = -0.21 - 0.062 * k
    pts = [(-0.14, yf), (0.5 - 0.03 * k, yf + 0.01), (0.5 - 0.03 * k, yf + 0.13), (-0.14, yf + 0.13)]
    slab(f'townTerraceWall{k}', M['inca'], pts, zt - 0.3, zt - 0.006, margin=0.06)
    slab(f'townTerraceTop{k}', M['terraceGrass'], pts, zt - 0.007, zt, margin=0.06)

# ------------------------------------------------------------------ the town on the ridge
Z = G + PZ
OPEN = []


def house(name, x, y, w, d, h, rot=0.0, roof=False):
    """A granite house: four walls of fitted stone with gable ends, trapezoid doorways and windows;
    some with their thatch put back."""
    m = Matrix.Translation((x, y, Z - 0.01)) @ Matrix.Rotation(rot, 4, 'Z')
    bm = bmesh.new()
    t = 0.016
    for (cx, cy, sx, sy) in ((0, -d / 2 + t / 2, w, t), (0, d / 2 - t / 2, w, t), (-w / 2 + t / 2, 0, t, d), (w / 2 - t / 2, 0, t, d)):
        bmesh.ops.create_cube(bm, size=1.0, matrix=m @ Matrix.Translation((cx, cy, h / 2)) @ Matrix.Diagonal((sx, sy, h, 1)))
    for sx in (-1, 1):
        tri = [(-d / 2, h), (d / 2, h), (0, h + d * 0.6)]
        add_prism(bm, [bm.verts.new(m @ Vector((sx * w / 2 - t, v, z))) for v, z in tri], [bm.verts.new(m @ Vector((sx * w / 2, v, z))) for v, z in tri])
    finish(name, bm, M['inca'], bevel=0.0025, smooth_sides=False)
    for u in ((0.0,) if w < 0.12 else (-w * 0.25, w * 0.25)):
        p = m @ Vector((u, -d / 2, 0.01))
        nrm = m.to_3x3() @ Vector((0, -1, 0))
        OPEN.append((p.x, p.y, Z, 0.032, h * 0.78, (nrm.x, nrm.y), 'trap'))
    for sx in (-1, 1):
        p = m @ Vector((sx * w / 2, 0, 0.01))
        nrm = m.to_3x3() @ Vector((sx, 0, 0))
        OPEN.append((p.x, p.y, Z + h * 0.45, 0.022, h * 0.32, (nrm.x, nrm.y), 'trap'))
    if roof:
        bm = bmesh.new()
        for sy in (-1, 1):
            quad = [(-w / 2 - 0.014, sy * (d / 2 + 0.016), h - 0.004), (w / 2 + 0.014, sy * (d / 2 + 0.016), h - 0.004), (w / 2 + 0.014, 0, h + d * 0.62), (-w / 2 - 0.014, 0, h + d * 0.62)]
            v0 = [bm.verts.new(m @ Vector(q)) for q in quad]
            v1 = [bm.verts.new(m @ Vector((q[0], q[1] * 0.82, q[2] + 0.018))) for q in quad]
            add_prism(bm, v0, v1)
        finish(name + 'Thatch', bm, M['thatch'], smooth_sides=False)


k = 0
for y, xs in ((-0.13, (-0.32, -0.18, 0.3, 0.44)), (0.1, (-0.34, -0.2, 0.2, 0.34, 0.48))):
    for x in xs:
        house(f'house{k}', x, y, 0.13, 0.1, 0.1, 0.0, roof=(k % 3 == 1))
        k += 1
for k2, (x, y, rot) in enumerate(((-0.46, -0.02, math.pi / 2), (0.58, -0.04, math.pi / 2))):
    house(f'endHouse{k2}', x, y, 0.15, 0.1, 0.1, rot, roof=(k2 == 0))
slab('plaza', M['lawn'], rect(0.05, -0.01, 0.2, 0.2), Z - 0.004, Z + 0.003, margin=0.3)
# the Temple of the Sun's curved wall, the Temple of the Three Windows, the Intihuatana
bm = bmesh.new()
outer = [(-0.05 + 0.075 * math.cos(a), -0.15 + 0.06 * math.sin(a)) for a in [math.radians(t) for t in range(200, 341, 10)]]
inner = [(-0.05 + 0.06 * math.cos(a), -0.15 + 0.045 * math.sin(a)) for a in [math.radians(t) for t in range(340, 199, -10)]]
add_prism(bm, [bm.verts.new((x, y, Z - 0.01)) for x, y in outer + inner], [bm.verts.new((x, y, Z + 0.12)) for x, y in outer + inner])
finish('templeSun', bm, M['inca'], bevel=0.002, smooth_sides=False)
OPEN += [(-0.05 + 0.075 * math.cos(a), -0.15 + 0.06 * math.sin(a), Z + 0.05, 0.022, 0.04, (math.cos(a), math.sin(a)), 'trap') for a in (math.radians(240), math.radians(300))]
box('threeWindows', M['inca'], (0.08, 0.16, Z + 0.06), (0.18, 0.02, 0.14), bevel=0.002)
OPEN += [(0.08 + u, 0.149, Z + 0.04, 0.035, 0.06, (0, -1), 'trap') for u in (-0.05, 0.0, 0.05)]
for j in range(4):
    box(f'intiStep{j}', M['inca'], (0.4, -0.12, Z + 0.02 + j * 0.03), (0.16 - j * 0.035, 0.12 - j * 0.025, 0.03), bevel=0.002)
box('intihuatana', M['inca'], (0.4, -0.12, Z + 0.15), (0.025, 0.02, 0.04), bevel=0.003)
windows('openings', M['shadow'], OPEN, depth=0.02)


# ------------------------------------------------------------------ llamas and visitors
def llama(name, x, y, z, rot, brown=False):
    m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rot, 4, 'Z')
    mat = M['llamaBrown' if brown else 'llama']
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=1.0, matrix=m @ Matrix.Translation((0, 0, 0.042)) @ Matrix.Diagonal((0.032, 0.016, 0.017, 1)))
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=1.0, matrix=m @ Matrix.Translation((0.032, 0, 0.082)) @ Matrix.Diagonal((0.011, 0.008, 0.01, 1)))
    finish(name, bm, mat, smooth_all=True)
    bar(name + 'Neck', mat, m @ Vector((0.025, 0, 0.045)), m @ Vector((0.03, 0, 0.08)), 0.01)
    for lx in (-0.022, 0.022):
        for ly in (-0.007, 0.007):
            bar(f'{name}Leg{lx}{ly}', mat, m @ Vector((lx, ly, 0.0)), m @ Vector((lx, ly, 0.035)), 0.006)
    for ly in (-0.004, 0.004):
        bar(f'{name}Ear{ly}', mat, m @ Vector((0.03, ly, 0.088)), m @ Vector((0.03, ly, 0.1)), 0.003)


for k, (tk, x) in enumerate(((1, -0.6), (3, -0.45), (5, -0.7), (2, 0.1))):
    zt = G + PZ - 0.03 - 0.045 * tk
    yf = (-0.2 if x < -0.15 else -0.21) - 0.062 * tk
    llama(f'llama{k}', x, yf + 0.06, zt, rng.random() * 6, brown=(k == 1))
for k, (x, y, shirt) in enumerate(((0.0, -0.05, 'red'), (0.1, 0.02, 'blue'), (0.12, -0.08, 'yellow'), (-0.1, 0.0, 'green'), (0.25, -0.02, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=Z, scale=0.85)

render('machu-picchu')
