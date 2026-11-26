# The Golden Gate Bridge in the high-quality look (hq.py), on a top of the bay's water: the
# International Orange suspension bridge across the strait, its two towers of stepped legs with
# their recessed panels, the portal struts above the deck and the X-bracing below, on concrete
# piers; the main cables swooping between the towers and down to the anchorages, the hangers, the
# deck on its stiffening truss with cars on it; the green headlands rising from cliffs at each
# end, the bank of fog rolling in behind the north tower, a container ship and a yacht.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P golden-gate-bridge.py -- golden-gate-bridge-1024.png 1024 golden-gate-bridge.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='water')
rng = random.Random(1937)
M['orange'] = material('intlOrange', '#d0432c', 0.45, vary='#c23a26', vary_scale=24, bump=0.04, bump_scale=200, metallic=0.15, coat=0.2)
M['orangeDark'] = material('orangeDark', '#8c2a1c', 0.55)
M['concrete'] = material('concrete', '#bdb8af', 0.75, vary='#aaa59c', vary_scale=20, bump=0.12, bump_scale=200)
M['asphalt'] = material('asphalt', '#4f4d4f', 0.8, vary='#454345', vary_scale=40, bump=0.1, bump_scale=300)
M['hill'] = material('hill', '#7fae4c', 0.85, vary='#6f9c41', vary_scale=5, bump=0.25, bump_scale=160)
M['cliff'] = material('cliff', '#b39a77', 0.85, vary='#9a8262', vary_scale=6, bump=0.5, bump_scale=40)
M['fog'] = material('fog', '#ffffff', 0.95, sss=0.25)
M['hullRed'] = material('hullRed', '#8e2f2a', 0.6)
before = set(bpy.data.objects)

ZD = G + 0.24           # the road deck
ZT = G + 1.12           # the towers' tops
TX = 0.62               # the towers, either side of the middle
AX = 1.0                # the anchorages
CY = 0.1                # the cables' and the tower legs' planes, either side


# ------------------------------------------------------------------ the headlands
def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def headland(name, side, X0, H, seed):
    R = PLINTH_R * 0.993
    nu, nv = 24, 44
    bm = bmesh.new()
    grid = []
    for i in range(nu + 1):
        xa = X0 + (R * 0.999 - X0) * i / nu
        ymax = math.sqrt(max(1e-6, R * R - xa * xa))
        row = []
        for j in range(nv + 1):
            v = -1 + 2 * j / nv
            d = xa - X0
            rise = smooth(0.0, 0.13, d)
            ridge = math.sqrt(max(0.0, 1 - v * v))
            taper = math.sqrt(max(0.0, 1 - ((xa - X0) / (R - X0)) ** 4))
            bumps = 1 + 0.18 * math.sin(5.3 * v + seed) * math.sin(9.0 * d + seed * 0.7)
            z = G - 0.008 + (H * ridge ** 0.6 * taper * bumps + 0.008) * rise
            row.append(bm.verts.new((side * xa, v * ymax, z)))
        grid.append(row)
    for i in range(nu):
        for j in range(nv):
            q = (grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]) if side > 0 else (grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1])
            f = bm.faces.new(q)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 1 if (abs(f.normal.z) < 0.55 or f.calc_center_median().z < G + 0.05) else 0
    tops = [(v.co.x, v.co.y, v.co.z) for row in grid[4::3] for v in row[6:-6:5]]
    multi(name, bm, [M['hill'], M['cliff']], smooth=True)
    return tops


north = headland('marin', -1, 0.9, 0.36, 1.3)
south = headland('presidio', 1, 0.92, 0.27, 4.1)
for k, (x, y, z) in enumerate(south):
    if abs(y) > 0.2 and math.hypot(x, y) < 1.36 and rng.random() < 0.5:
        (cypress if rng.random() < 0.5 else tree)(f'presidioTree{k}', x, y, h=0.16, r=0.06 if rng.random() < 0.5 else 0.035, z=z - 0.01)

# ------------------------------------------------------------------ the towers
BAR = bmesh.new()


def member(p0, p1, t):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(BAR, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t, t, d.length, 1)))


panels = []
for tx in (-TX, TX):
    # the pier and its fender
    lathe(f'pier{tx}', M['concrete'], [(0.12, 0), (0.12, 0.05), (0.11, 0.06)], (tx, 0, G - 0.01), segs=40, sx=1.0, sy=1.9)
    ZB = G + 0.05
    tiers = 5
    for s in (-1, 1):
        for k in range(tiers):
            z0 = ZB + (ZT - ZB) * k / tiers
            z1 = ZB + (ZT - ZB) * (k + 1) / tiers
            wx = 0.078 - 0.006 * k
            wy = 0.066 - 0.005 * k
            box(f'leg{tx}{s}{k}', M['orange'], (tx, s * CY, (z0 + z1) / 2), (wx, wy, z1 - z0 + 0.002), bevel=0.003)
            hgt = (z1 - z0) * 0.78
            for u in (-0.22, 0.22):
                panels.append((tx + u * wx, s * CY - wy / 2, z0 + (z1 - z0) * 0.11, wx * 0.18, hgt, (0, -1), 'rect'))
                panels.append((tx + u * wx, s * CY + wy / 2, z0 + (z1 - z0) * 0.11, wx * 0.18, hgt, (0, 1), 'rect'))
            for nx in (-1, 1):
                panels.append((tx + nx * wx / 2, s * CY, z0 + (z1 - z0) * 0.11, wy * 0.22, hgt, (nx, 0), 'rect'))
        box(f'cap{tx}{s}', M['orange'], (tx, s * CY, ZT + 0.012), (0.06, 0.052, 0.024), bevel=0.004)
        lathe(f'saddle{tx}{s}', M['orange'], [(0.018, 0), (0.018, 0.012), (0.0, 0.02)], (tx, s * CY, ZT + 0.024), segs=12)
    # the portal struts above the deck, with their slots
    for k, z in enumerate((ZD + 0.14, ZD + 0.34, ZD + 0.54, ZT - 0.05)):
        h = 0.07 if k == 3 else 0.05
        box(f'strut{tx}{k}', M['orange'], (tx, 0, z), (0.05, 2 * CY - 0.05, h), bevel=0.003)
        for v in (-0.05, -0.017, 0.017, 0.05):
            for nx in (-1, 1):
                panels.append((tx + nx * 0.025, v, z - h * 0.3, 0.012, h * 0.6, (nx, 0), 'rect'))
    # the X-bracing below the deck
    for z0, z1 in ((ZB + 0.01, ZD - 0.06),):
        member((tx, -CY, z0), (tx, CY, z1), 0.018)
        member((tx, CY, z0), (tx, -CY, z1), 0.018)
        member((tx - 0.01, -CY, z1), (tx - 0.01, CY, z1), 0.022)
windows('towerPanels', M['orangeDark'], panels, depth=0.004)


# ------------------------------------------------------------------ the cables and hangers
def cable_z(x):
    ax = abs(x)
    if ax <= TX:
        return ZD + 0.035 + (ZT + 0.03 - ZD - 0.035) * (ax / TX) ** 2
    f = (ax - TX) / (AX - TX)
    return (ZT + 0.03) + (ZD + 0.03 - ZT - 0.03) * f - 0.05 * math.sin(math.pi * f)


for s in (-1, 1):
    pts = [(x, s * CY, cable_z(x)) for x in [-AX + 2 * AX * i / 160 for i in range(161)]]
    tube(f'cable{s}', M['orange'], pts, 0.011, resolution=3)
    x = -AX + 0.035
    while x < AX - 0.03:
        if abs(abs(x) - TX) > 0.03:
            member((x, s * CY, ZD + 0.005), (x, s * CY, cable_z(x) - 0.006), 0.0032)
        x += 0.034

# ------------------------------------------------------------------ the deck, its truss, the anchorages
box('deck', M['asphalt'], (0, 0, ZD - 0.006), (2.5, 2 * CY - 0.03, 0.012), bevel=0.002)
for s in (-1, 1):
    box(f'kerb{s}', M['orange'], (0, s * (CY - 0.012), ZD + 0.005), (2.5, 0.008, 0.012), bevel=0.001)
    box(f'chordTop{s}', M['orange'], (0, s * (CY - 0.01), ZD - 0.016), (2.1, 0.012, 0.012))
    box(f'chordBottom{s}', M['orange'], (0, s * (CY - 0.01), ZD - 0.062), (2.1, 0.012, 0.01))
    x = -1.05
    k = 0
    while x < 1.05:
        member((x, s * (CY - 0.01), ZD - 0.062), (x, s * (CY - 0.01), ZD - 0.016), 0.006)
        member((x, s * (CY - 0.01), ZD - 0.062), (x + 0.045 * (1 if k % 2 else 1), s * (CY - 0.01), ZD - 0.016), 0.0045)
        x += 0.045
        k += 1
for ax in (-AX, AX):
    box(f'anchorage{ax}', M['concrete'], (ax, 0, (G + ZD) / 2 - 0.005), (0.16, 2 * CY + 0.08, ZD - G + 0.02), bevel=0.006)
    windows(f'anchorageArch{ax}', M['shadow'], [(ax, -CY - 0.041, G, 0.08, (ZD - G) * 0.65, (0, -1), 'round')], depth=0.006)
for px in (-1.2, 1.2):
    box(f'approachPier{px}', M['concrete'], (px, 0, ZD - 0.12), (0.05, 2 * CY - 0.02, 0.24), bevel=0.003)
finish('steelwork', BAR, M['orange'], smooth_sides=False)

# cars on the road
CARS = ['red', 'blue', 'yellow', 'white', 'green', 'denim', 'white', 'red']
for k in range(22):
    x = -1.15 + 2.3 * rng.random()
    lane = rng.choice((-0.052, -0.018, 0.018, 0.052))
    m = Matrix.Translation((x, lane, ZD + 0.009))
    box_m(f'car{k}', M[rng.choice(CARS)], m, (0.04, 0.02, 0.014), bevel=0.003)
    box_m(f'carTop{k}', M['glass'], m @ Matrix.Translation((-0.003, 0, 0.011)), (0.022, 0.017, 0.009), bevel=0.002)

# ------------------------------------------------------------------ fog, a ship and a yacht
fogm = bmesh.new()
for k in range(60):
    x = rng.uniform(-1.4, -0.35)
    y = rng.uniform(0.2, 1.05)
    r = rng.uniform(0.08, 0.15)
    if math.hypot(x, y) + r * 1.3 > 1.44:
        continue
    bmesh.ops.create_icosphere(fogm, subdivisions=3, radius=r, matrix=Matrix.Translation((x, y, G + 0.02 + rng.uniform(0, 0.16) * (1.4 - abs(x)))) @ Matrix.Diagonal((1.25, 1.0, 0.9, 1)))
finish('fog', fogm, M['fog'], smooth_all=True)

m = Matrix.Translation((0.25, -0.88, G)) @ Matrix.Rotation(math.radians(8), 4, 'Z')
bm = bmesh.new()
hull = [(-0.22, -0.04), (0.17, -0.04), (0.25, 0.0), (0.17, 0.04), (-0.22, 0.04)]
add_prism(bm, [bm.verts.new(m @ Vector((u, v, -0.006))) for u, v in hull], [bm.verts.new(m @ Vector((u, v, 0.03))) for u, v in hull])
finish('shipHull', bm, M['hullRed'], bevel=0.003, smooth_sides=False)
box_m('shipBridge', M['white'], m @ Matrix.Translation((-0.18, 0, 0.06)), (0.04, 0.07, 0.06), bevel=0.003)
for k in range(6):
    for j in range(2):
        box_m(f'container{k}{j}', M[('blue', 'red', 'yellow', 'green', 'denim')[(k + j) % 5]], m @ Matrix.Translation((-0.12 + k * 0.045, 0, 0.042 + j * 0.022)), (0.04, 0.066, 0.02), bevel=0.002)
m = Matrix.Translation((-0.55, -1.0, G)) @ Matrix.Rotation(math.radians(-25), 4, 'Z')
bm = bmesh.new()
hull = [(-0.06, -0.016), (0.04, -0.019), (0.08, 0.0), (0.04, 0.019), (-0.06, 0.016)]
add_prism(bm, [bm.verts.new(m @ Vector((u, v, -0.004))) for u, v in hull], [bm.verts.new(m @ Vector((u, v, 0.014))) for u, v in hull])
finish('yachtHull', bm, M['white'], bevel=0.002, smooth_sides=False)
cylinder('yachtMast', M['steel'], 0.0028, 0.2, (0, 0, 0), segs=8, matrix=m @ Matrix.Translation((0.01, 0, 0.014)))
for nm, tri in (('yachtJib', ((0.013, 0.026), (0.07, 0.026), (0.013, 0.2))), ('yachtMain', ((0.007, 0.026), (-0.06, 0.026), (0.007, 0.19)))):
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(m @ Vector((u, -0.001, z))) for u, z in tri], [bm.verts.new(m @ Vector((u, 0.001, z))) for u, z in tri])
    finish(nm, bm, M['white'], smooth_sides=False)

# turned a little towards the camera
R = Matrix.Rotation(math.radians(-26), 4, 'Z')
for ob in bpy.data.objects:
    if ob not in before:
        ob.matrix_world = R @ ob.matrix_world

render('golden-gate-bridge')
