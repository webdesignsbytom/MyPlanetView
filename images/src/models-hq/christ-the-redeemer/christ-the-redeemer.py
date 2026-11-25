# Christ the Redeemer in the high-quality look (hq.py), on top of Corcovado: the steep peak with its
# granite cliffs and gullies, forest only on the gentler slopes below; on the summit the paved
# terrace with its white balustrades, the lower terrace and its stairs, the green lift tower and the
# visitors; the dark pedestal with its chamfered corners, and the statue in its soapstone mosaic as it
# is: the tunic falling to the feet in deep straight pleats, the mantle over the shoulders and down the
# front, its drapes hanging straight down from the arms beside the body, the heart on the chest, the
# arms spread level and slender with the open hands, the head bowed a little with the long hair and
# the beard. Turned to face the camera.
# Run: blender -b --factory-startup -P christ-the-redeemer.py -- christ-the-redeemer-1024.png 1024 christ-the-redeemer.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1931)
M['soapstone'] = masonry('soapstone', '#e2dfd6', '#c4bfb3', scale=150.0, rough=0.6, vary='#d6d2c8')
M['pedestalDark'] = material('pedestalDark', '#3a3b40', 0.3, vary='#2e2f33', vary_scale=20, coat=0.4)
M['forest'] = material('forest', '#3f8d38', 0.85, vary='#2a6a28', vary_scale=14, bump=0.9, bump_scale=60)
M['granite'] = material('corcovadoGranite', '#8c8478', 0.85, vary='#756e63', vary_scale=4, bump=0.7, bump_scale=25)
M['liftGreen'] = material('liftGreen', '#4f8a5e', 0.35, vary='#457a52', vary_scale=20, metallic=0.3, coat=0.4)
M['greenGlass'] = material('greenGlass', '#8fc4a8', 0.08, metallic=0.4, coat=0.8, transmission=0.3)
HS = 1.0                 # the summit's height
ZT = G + HS              # the terrace


def H(x, y):
    r = math.hypot(x, y)
    taper = max(0.0, 1 - (r / 1.49) ** 6)
    a = math.atan2(y, x)
    d = r * (1 + 0.07 * math.sin(5 * a + 1) + 0.05 * math.sin(9 * a) + 0.03 * math.sin(17 * a))
    h = HS * math.exp(-((max(0.0, d - 0.3)) / 0.45) ** 1.3)
    shelf = (HS - 0.14) * math.exp(-((x + 0.38) ** 2 + (y + 0.42) ** 2) / 0.012)
    return max(h, shelf) * taper


def pick(z, nz, x, y):
    a = math.atan2(y, x)
    line = HS * (0.66 + 0.1 * math.sin(6 * a + 0.5) + 0.06 * math.sin(11 * a))
    return 1 if (z > line or nz < 0.5) else 0


terrain('corcovado', H, [M['forest'], M['granite']], pick, rings=120, segs=320)


# ------------------------------------------------------------------ the summit's terraces, balustrades and stairs
def terrace(name, pts, z):
    slab(name, M['paving'], pts, z - 0.06, z, bevel=0.003, margin=0.05)
    loop = pts + [pts[0]]
    tube(name + 'Rail', M['white'], [(x, y, z + 0.032) for x, y in loop], 0.005)
    bm = bmesh.new()
    for (ax, ay), (bx, by) in zip(loop, loop[1:]):
        n = max(1, int(math.hypot(bx - ax, by - ay) / 0.03))
        for j in range(n):
            f = j / n
            bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((ax + (bx - ax) * f, ay + (by - ay) * f, z + 0.015)) @ Matrix.Diagonal((0.007, 0.007, 0.03, 1)))
    finish(name + 'Balusters', bm, M['white'], smooth_sides=False)


terrace('mainTerrace', [(-0.3, -0.18), (-0.08, -0.32), (0.24, -0.27), (0.36, -0.05), (0.33, 0.24), (0.04, 0.34), (-0.25, 0.26), (-0.34, 0.04)], ZT)
terrace('lowerTerrace', [(-0.52, -0.4), (-0.4, -0.55), (-0.24, -0.5), (-0.22, -0.33), (-0.36, -0.27), (-0.5, -0.3)], ZT - 0.14)
bm = bmesh.new()
for j in range(9):
    f = j / 9
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((-0.24 - 0.03 * f, -0.22 - 0.06 * f, ZT - 0.14 + 0.14 * (1 - f) / 2)) @ Matrix.Rotation(-0.6, 4, 'Z') @ Matrix.Diagonal((0.09, 0.03, 0.14 * (1 - f) + 0.005, 1)))
finish('stairs', bm, M['paving'], smooth_sides=False)
box('liftTower', M['liftGreen'], (0.38, 0.2, (ZT - 0.25 + ZT + 0.16) / 2), (0.09, 0.09, 0.41), bevel=0.004)
windows('liftWindows', M['greenGlass'], [(0.335, 0.2, ZT + 0.02, 0.05, 0.11, (-1, 0), 'rect'), (0.38, 0.155, ZT + 0.02, 0.05, 0.11, (0, -1), 'rect')], depth=0.006)
box('shelterRoof', M['greenGlass'], (0.24, 0.2, ZT + 0.09), (0.14, 0.12, 0.008), bevel=0.002)

# ------------------------------------------------------------------ the pedestal and the statue
before = set(bpy.data.objects)
PH = 0.22
lathe('pedestal', M['pedestalDark'], [(0.125 * 1.08, 0), (0.125 * 1.08, PH)], (0, 0, 0), segs=8, matrix=Matrix.Translation((0, 0, ZT)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('pedestalBase', M['pedestalDark'], [(0.15 * 1.08, 0), (0.15 * 1.08, 0.03), (0.13 * 1.08, 0.04)], (0, 0, 0), segs=8, matrix=Matrix.Translation((0, 0, ZT)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('pedestalCornice', M['pedestalDark'], [(0.13 * 1.08, 0), (0.14 * 1.08, 0.02), (0.14 * 1.08, 0.03)], (0, 0, 0), segs=8, matrix=Matrix.Translation((0, 0, ZT + PH - 0.03)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
windows('chapelDoor', M['shadow'], [(0, -0.125, ZT + 0.04, 0.05, 0.1, (0, -1), 'rect')], depth=0.008)
Z = ZT + PH
# the statue: the sculpted model in _sources/christ-the-redeemer/ (JuanG3D, CC BY 4.0) when it's
# there, cut free of its own pedestal, stood on ours and given the soapstone; else the figure in code
SOURCE_CUT = 0.298        # where the model's own pedestal ends, a share of its height
SOURCE_TURN = 0.0         # the turn (degrees) that makes it face -y
STATUE_H = 1.3            # its height on ours, feet to the top of the head
src = import_model('christ-the-redeemer', 'christStatue')
if src is not None:
    me = src.data
    zs = [v.co.z for v in me.vertices]
    zmin, zmax = min(zs), max(zs)
    xs = [v.co.x for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    print('SOURCE BOUNDS x', round(min(xs), 3), round(max(xs), 3), 'y', round(min(ys), 3), round(max(ys), 3), 'z', round(zmin, 3), round(zmax, 3))
    for k in range(20):
        z0 = zmin + (zmax - zmin) * k / 20
        z1 = zmin + (zmax - zmin) * (k + 1) / 20
        sl = [v.co for v in me.vertices if z0 <= v.co.z < z1]
        if sl:
            print('SLICE', k, 'x', round(min(c.x for c in sl), 3), round(max(c.x for c in sl), 3), 'y', round(min(c.y for c in sl), 3), round(max(c.y for c in sl), 3))
    cut = zmin + SOURCE_CUT * (zmax - zmin)
    bm = bmesh.new()
    bm.from_mesh(me)
    if SOURCE_CUT > 0:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, cut), plane_no=(0, 0, 1), clear_inner=True)
    low = [v.co for v in bm.verts if v.co.z < cut + (zmax - cut) * 0.05]
    cx = (min(c.x for c in low) + max(c.x for c in low)) / 2 if low else 0.0
    cy = (min(c.y for c in low) + max(c.y for c in low)) / 2 if low else 0.0
    bm.to_mesh(me)
    bm.free()
    k_ = STATUE_H / (zmax - cut)
    me.transform(Matrix.Translation((0, 0, Z)) @ Matrix.Rotation(math.radians(SOURCE_TURN), 4, 'Z') @ Matrix.Scale(k_, 4) @ Matrix.Translation((-cx, -cy, -cut)))
    me.materials.clear()
    me.materials.append(M['soapstone'])
    for poly in me.polygons:
        poly.material_index = 0
        poly.use_smooth = True
else:
    S = 1.25                  # the statue's height to the top of its head


    def ring(cx, cz, a, b, n, z_of=None, r_of=None):
        pts = []
        for k in range(n):
            t = 2 * math.pi * k / n
            dr = r_of(t) if r_of else 0.0
            pts.append(((cx + (a + dr) * math.cos(t)) * S, (b + dr) * math.sin(t) * S, Z + (z_of(t) if z_of else cz) * S))
        return pts


    # the tunic below the mantle: narrow, falling straight to the feet in deep regular pleats
    def pleats(t):
        front = 0.55 + 0.45 * max(0.0, -math.sin(t))
        return 0.011 * front * (abs(math.sin(9 * t)) ** 0.45 - 0.62)


    TUNIC = [(0.0, 0.082, 0.064), (0.02, 0.08, 0.062), (0.2, 0.077, 0.06), (0.4, 0.076, 0.06), (0.5, 0.08, 0.062)]
    loft('tunic', M['soapstone'], [ring(0, z, a, b, 144, r_of=pleats) for z, a, b in TUNIC])
    bm = bmesh.new()
    for s_ in (-1, 1):
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((s_ * 0.03 * S, -0.06 * S, Z + 0.008 * S)) @ Matrix.Diagonal((0.035 * S, 0.05 * S, 0.016 * S, 1)))
    subsurf(finish('feet', bm, M['soapstone'], smooth_all=True), 1)


    # the mantle over the shoulders and body, its hem dipping in a V at the front, falling in soft folds
    def hem(t):
        front = max(0.0, -math.sin(t))
        return 0.47 - 0.08 * front ** 2 + 0.02 * max(0.0, math.sin(t))


    def mantle_ring(level):
        top = 0.785
        a = 0.13 - 0.03 * level
        b = 0.072 + 0.006 * level
        return ring(0, 0, a, b, 120, z_of=lambda t: top + (hem(t) - top) * level, r_of=lambda t: 0.005 * level * math.sin(6 * t + 1.0) + 0.003 * math.sin(13 * t))


    loft('mantle', M['soapstone'], [mantle_ring(v) for v in (0.0, 0.08, 0.18, 0.3, 0.45, 0.6, 0.75, 0.88, 1.0)])
    loft('shoulders', M['soapstone'], [ring(0, z, a, b, 64) for z, a, b in ((0.78, 0.13, 0.072), (0.795, 0.1, 0.06), (0.805, 0.055, 0.045), (0.82, 0.036, 0.034), (0.84, 0.034, 0.033))])
    # the mantle's folds: two drawn from the shoulders to the heart, and the falls below
    for s_ in (-1, 1):
        tube(f'chestFold{s_}', M['soapstone'], [(s_ * 0.1 * S, -0.06 * S, Z + 0.775 * S), (s_ * 0.06 * S, -0.078 * S, Z + 0.7 * S), (s_ * 0.02 * S, -0.082 * S, Z + 0.6 * S)], 0.007 * S)
        for j, u in enumerate((0.03, 0.065, 0.095)):
            tube(f'mantleFall{s_}{j}', M['soapstone'], [(s_ * u * S, -0.08 * S, Z + 0.58 * S), (s_ * (u + 0.004) * S, -0.082 * S, Z + (hem(-math.pi / 2 + s_ * u * 4) + 0.01) * S)], 0.006 * S)
    bm = bmesh.new()
    for dx in (-0.007, 0.007):
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.009 * S, matrix=Matrix.Translation((dx * S, -0.083 * S, Z + 0.655 * S)))
    bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.013 * S, radius2=0.0, depth=0.017 * S, matrix=Matrix.Translation((0, -0.083 * S, Z + 0.641 * S)) @ Matrix.Rotation(math.pi, 4, 'X'))
    finish('heart', bm, M['soapstone'], smooth_all=True)


    # the arms level: the upper arm sleeved in the mantle, the forearm slimmer, the open hand growing out of the wrist
    def arm_rings(s_):
        rings = []
        for j in range(15):
            f = j / 14
            x = s_ * (0.09 + 0.35 * f)
            if f < 0.5:
                rz, ry = 0.052 - 0.02 * f, 0.042 - 0.016 * f
                zc = 0.748 - 0.008 * (1 - f)
            else:
                g = (f - 0.5) / 0.5
                rz, ry = 0.042 - 0.016 * g, 0.034 - 0.01 * g
                zc = 0.748 + 0.004 * g
            rings.append([(x * S, ry * math.sin(t) * S, Z + (zc + rz * math.cos(t)) * S) for t in [2 * math.pi * k / 20 for k in range(20)]])
        return rings


    for s_ in (-1, 1):
        loft(f'arm{s_}', M['soapstone'], arm_rings(s_))
        hm_ = Matrix.Translation((s_ * 0.462 * S, -0.004 * S, Z + 0.758 * S)) @ Matrix.Rotation(-s_ * 0.18, 4, 'Y')
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0, matrix=hm_ @ Matrix.Diagonal((0.075 * S, 0.02 * S, 0.046 * S, 1)))
        subsurf(finish(f'hand{s_}', bm, M['soapstone'], smooth_all=True), 2)
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((s_ * 0.44 * S, -0.012 * S, Z + 0.782 * S)) @ Matrix.Rotation(s_ * 0.35, 4, 'Y') @ Matrix.Diagonal((0.014 * S, 0.014 * S, 0.034 * S, 1)))
        subsurf(finish(f'thumb{s_}', bm, M['soapstone'], smooth_all=True), 2)
    # the head, bowed a little, the long hair falling behind to the shoulders, the beard
    hm = Matrix.Translation((0, -0.01 * S, Z + 0.892 * S)) @ Matrix.Rotation(0.22, 4, 'X')
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0, matrix=hm @ Matrix.Diagonal((0.042 * S, 0.048 * S, 0.06 * S, 1)))
    finish('head', bm, M['soapstone'], smooth_all=True)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0, matrix=hm @ Matrix.Translation((0, 0.012 * S, 0.012 * S)) @ Matrix.Diagonal((0.049 * S, 0.048 * S, 0.06 * S, 1)))
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=hm @ Matrix.Translation((0, 0.03 * S, -0.05 * S)) @ Matrix.Diagonal((0.05 * S, 0.025 * S, 0.06 * S, 1)))
    for s_ in (-1, 1):
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=hm @ Matrix.Translation((s_ * 0.038 * S, 0.002 * S, -0.035 * S)) @ Matrix.Diagonal((0.014 * S, 0.026 * S, 0.055 * S, 1)))
    finish('hair', bm, M['soapstone'], smooth_all=True)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=hm @ Matrix.Translation((0, -0.03 * S, -0.045 * S)) @ Matrix.Diagonal((0.027 * S, 0.02 * S, 0.028 * S, 1)))
    finish('beard', bm, M['soapstone'], smooth_all=True)
    box_m('nose', M['soapstone'], hm @ Matrix.Translation((0, -0.048 * S, -0.004 * S)), (0.011 * S, 0.012 * S, 0.024 * S), bevel=0.003)
    for s_ in (-1, 1):
        box_m(f'brow{s_}', M['soapstone'], hm @ Matrix.Translation((s_ * 0.015 * S, -0.044 * S, 0.013 * S)), (0.017 * S, 0.007 * S, 0.005 * S), bevel=0.002)
R = Matrix.Rotation(math.radians(-32), 4, 'Z')
for ob in bpy.data.objects:
    if ob not in before:
        ob.matrix_world = R @ ob.matrix_world

# ------------------------------------------------------------------ visitors
for k in range(12):
    a = rng.uniform(math.radians(190), math.radians(340))
    r = rng.uniform(0.18, 0.28)
    person(f'p{k}', r * math.cos(a), r * math.sin(a), a + math.pi, ('red', 'blue', 'yellow', 'green', 'white')[k % 5], z=ZT, scale=0.7)
for k, (x, y) in enumerate(((-0.38, -0.38), (-0.32, -0.44), (-0.44, -0.32))):
    person(f'lower{k}', x, y, rng.random() * 6, ('red', 'blue', 'yellow')[k], z=ZT - 0.14, scale=0.7)

render('christ-the-redeemer')
