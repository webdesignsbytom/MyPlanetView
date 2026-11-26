# Amsterdam's canal ring in the high-quality look (hq.py), laid out in metres where a side canal meets a
# curve of the ring: the crescent of tall narrow canal houses along the far quay, in brick, black and
# white, their step, bell, neck and spout gables and cornices against the sky, white-framed windows,
# hoist beams and stoops; the canal sweeping round below the brick-paved quays, a glass-roofed tour
# boat on it; the side canal coming towards us under a humped brick bridge with bicycles along its
# railings, houseboats moored along it; elms on the quays, more bicycles, lamp posts and people.
# Run: blender -b --factory-startup -P amsterdam-canals.py -- amsterdam-canals-1024.png 1024 amsterdam-canals.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='brick')
rng = random.Random(1613)
M['klinker'] = masonry('klinker', '#8d5444', '#6a3d31', scale=200, rough=0.85, vary='#7e4a3b')
M['quayWall'] = masonry('quayWall', '#6e4234', '#4f2e25', scale=100, rough=0.9, vary='#633b2f')
bpy.data.objects['turf'].data.materials[0] = M['quayWall']     # the base's rim in the quays' brick
M['canal'] = material('canalWater', '#3f5f5c', 0.12, vary='#4a6b66', vary_scale=8, bump=0.05, bump_scale=30)
M['elm'] = material('elm', '#4f7a35', 0.85, vary='#5d8a3e', vary_scale=14, bump=0.3, bump_scale=90)
M['roofTile'] = banded(material('canalRoof', '#3e3a38', 0.6, vary='#36322f', vary_scale=14), 'Z', 300.0, strength=0.2)
BRICKS = [masonry(f'houseBrick{k}', c, m, scale=240, rough=0.85, vary=c) for k, (c, m) in enumerate((('#8e4a35', '#6e3829'), ('#6b3a2c', '#53291f'), ('#a35a3c', '#7c412b')))]
PAINTS = [material(f'housePaint{k}', c, 0.7, vary=c, vary_scale=30, bump=0.06, bump_scale=200) for k, c in enumerate(('#ece8df', '#2f2e2d', '#d9cfb8', '#8b8f8c', '#c9b48a'))]
HULLS = [material(f'hull{k}', c, 0.55) for k, c in enumerate(('#2f4f3a', '#29425e'))]

S = 0.026               # metres to the tile's units
Z0 = G + 0.06           # the quays' brick paving
ZW = -1.8               # the water, below the quays (metres)
C = Vector((0.0, -65.0))    # the middle of the ring's curve (metres, before the turn)
R_IN, R_OUT = 37.0, 55.0    # the canal's near and far banks
R_FRONT, DEEP = 62.0, 13.0  # the houses' fronts, and how deep they go
SIDE = 7.0              # the side canal's half width


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def on_ring(r, a):
    """The point at radius r from the curve's middle, a degrees round from straight ahead."""
    return C + r * Vector((math.sin(math.radians(a)), math.cos(math.radians(a))))


def block(name, mat, x0, x1, y0, y1, z0, z1, bevel=0.0006):
    return box(name, mat, P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) * S, (y1 - y0) * S, (z1 - z0) * S), bevel=bevel)


def prism(name, mat, outline, z0, z1):
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(x, y, z0)) for x, y in outline], [bm_.verts.new(P(x, y, z1)) for x, y in outline])
    return finish(name, bm_, mat, smooth_sides=False)


def wires(name, mat, lines, radius):
    """Many thin round rods as one curve: bicycles, railings, lamp posts."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 1
    for pts in lines:
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        for i, q in enumerate(pts):
            sp.points[i].co = (*q, 1)
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def placed(matrix, build):
    """Builds something in its own frame (front to -y) and puts it in place with `matrix`."""
    before = set(bpy.data.objects)
    build()
    for ob in set(bpy.data.objects) - before:
        ob.matrix_world = matrix @ ob.matrix_world


def frame_at(x, y, a):
    """The matrix that stands a thing built facing -y at (x, y) metres, facing the curve's middle from `a` degrees round."""
    return Matrix.Translation((x * S, y * S, 0.0)) @ Matrix.Rotation(-math.radians(a), 4, 'Z')


def spec(matrix, x, y, z, w, h, shape):
    """A window (as glazed() takes them) on a front facing -y in a placed frame."""
    p = matrix @ P(x, y, z)
    n = matrix.to_3x3() @ Vector((0.0, -1.0, 0.0))
    return (p.x, p.y, p.z, w * S, h * S, (n.x, n.y), shape)


BEFORE = set(bpy.data.objects)
# ------------------------------------------------------------------ the quays and the water: the ring's canal sweeping round, the side canal coming towards us
ARC = [a for a in range(-110, 111, 4)]
a_side = math.degrees(math.asin(SIDE / R_IN))
far = [tuple(on_ring(R_OUT, a)) for a in ARC] + [(150.0, -60.0), (150.0, 150.0), (-150.0, 150.0), (-150.0, -60.0)]
inner_left = [tuple(on_ring(R_IN, a)) for a in ARC if a < -a_side] + [tuple(on_ring(R_IN, -a_side)), (-SIDE, -150.0), (-150.0, -150.0)]
inner_right = [(SIDE, -150.0)] + [tuple(on_ring(R_IN, a_side))] + [tuple(on_ring(R_IN, a)) for a in ARC if a > a_side] + [(150.0, -150.0)]
water = ([tuple(on_ring(R_OUT, a)) for a in ARC] + [tuple(on_ring(R_IN, a)) for a in reversed(ARC) if a > a_side] + [tuple(on_ring(R_IN, a_side)), (SIDE, -150.0), (-SIDE, -150.0),
         tuple(on_ring(R_IN, -a_side))] + [tuple(on_ring(R_IN, a)) for a in reversed(ARC) if a < -a_side])
for j, poly in enumerate((far, inner_left, inner_right)):
    slab(f'quayWall{j}', M['quayWall'], [(x * S, y * S) for x, y in poly], G - 0.004, Z0 - 0.35 * S, margin=0.02)
    slab(f'quay{j}', M['klinker'], [(x * S, y * S) for x, y in poly], Z0 - 0.35 * S, Z0, margin=0.02)
slab('canal', M['canal'], [(x * S, y * S) for x, y in water], G - 0.003, Z0 + ZW * S, margin=0.02)


# ------------------------------------------------------------------ the canal houses round the far quay
def gable_outline(kind, w, g):
    if kind == 'step':
        half = [(-w / 2, 0.0), (-w / 2, g * 0.25), (-w * 0.38, g * 0.25), (-w * 0.38, g * 0.5), (-w * 0.26, g * 0.5), (-w * 0.26, g * 0.75), (-w * 0.14, g * 0.75), (-w * 0.14, g)]
    elif kind == 'bell':
        half = [(-w / 2, 0.0), (-w * 0.48, g * 0.12), (-w * 0.4, g * 0.25), (-w * 0.3, g * 0.4), (-w * 0.24, g * 0.6), (-w * 0.22, g * 0.8), (-w * 0.16, g * 0.92), (-w * 0.08, g * 0.99), (0.0, g)]
    elif kind == 'neck':
        half = [(-w / 2, 0.0), (-w / 2, g * 0.12), (-w * 0.4, g * 0.26), (-w * 0.34, g * 0.35), (-w * 0.2, g * 0.38), (-w * 0.2, g * 0.86), (-w * 0.25, g * 0.86), (0.0, g)]
    else:   # spout
        half = [(-w / 2, 0.0), (-w / 2, g * 0.08), (-w * 0.12, g * 0.9), (-w * 0.12, g)]
    other = [(-u, v) for u, v in reversed(half) if u < 0]
    return half + other


WIN, DOORS = [], []


def canal_house(name, a0, a1, h, kind, wall, trim):
    """A canal house whose front runs between a0 and a1 degrees round the far quay, built in its own
    frame (its front's middle at the origin, facing -y), its sides along the curve's radii."""
    f0, f1 = on_ring(R_FRONT, a0), on_ring(R_FRONT, a1)
    b0, b1 = on_ring(R_FRONT + DEEP, a0), on_ring(R_FRONT + DEEP, a1)
    mid = (f0 + f1) / 2
    w, wb = (f1 - f0).length, (b1 - b0).length
    d = ((b0 + b1) / 2 - mid).length
    mx = frame_at(mid.x, mid.y, (a0 + a1) / 2)
    foot = [(-w / 2, 0.0), (w / 2, 0.0), (wb / 2, d), (-wb / 2, d)]

    def roof(z0, rise, y0=0.0):
        """A pitched roof on the house's wedge-shaped plan, its ridge running back from the front."""
        bm_ = bmesh.new()
        e = [bm_.verts.new(P(x, max(y, y0), z0)) for x, y in foot]
        r0, r1 = bm_.verts.new(P(0.0, y0, z0 + rise)), bm_.verts.new(P(0.0, d, z0 + rise))
        for f in ((e[1], e[2], r1, r0), (e[3], e[0], r0, r1), (e[0], e[1], r0), (e[2], e[3], r1), (e[0], e[3], e[2], e[1])):
            bm_.faces.new(f)
        finish(name + 'Roof', bm_, M['roofTile'], smooth_sides=False)

    def build():
        prism(name, wall, foot, -0.3, h)
        block(name + 'Stoop', M['whiteStone'], -1.0, 1.0, -1.6, 0.0, -0.3, 0.9)
        block(name + 'Cornice', trim, -w / 2, w / 2, -0.25, 0.2, h - 0.35, h + 0.05, bevel=0)
        if kind == 'cornice':
            # an eighteenth-century front: a raised cornice with an attic and its hoist door, the roof behind
            block(name + 'Top', wall, -w / 2, w / 2, 0.0, 0.6, h, h + 1.6)
            block(name + 'TopCornice', trim, -w / 2, w / 2, -0.5, 0.6, h + 1.6, h + 2.1, bevel=0)
            block(name + 'Attic', wall, -1.6, 1.6, -0.1, 0.8, h + 2.1, h + 4.4)
            block(name + 'AtticCornice', trim, -1.8, 1.8, -0.35, 0.8, h + 4.4, h + 4.8, bevel=0)
            roof(h - 0.05, 4.2, y0=0.6)
            block(name + 'Hoist', M['wood'], -0.15, 0.15, -1.3, 0.3, h + 3.9, h + 4.2, bevel=0)
            return
        g = (5.5 if kind != 'spout' else 4.5) + w * 0.2
        roof(h - 0.05, g * 0.86)
        pts = gable_outline(kind, w, g)
        bm_ = bmesh.new()
        add_prism(bm_, [bm_.verts.new(P(u, 1.2, h - 0.05 + v)) for u, v in pts], [bm_.verts.new(P(u, -0.1, h - 0.05 + v)) for u, v in pts])
        finish(name + 'Gable', bm_, wall, smooth_sides=False)
        tube(name + 'Trim', trim, [P(u, -0.18, h - 0.05 + v) for u, v in pts[1:-1]], 0.16 * S)
        block(name + 'Hoist', M['wood'], -0.15, 0.15, -1.3, 0.2, h + g * 0.82, h + g * 0.82 + 0.3, bevel=0)

    placed(mx, build)
    DOORS.append(spec(mx, 0.0, -0.05, 0.9, 1.3, 2.6, 'round'))
    across = 3 if w >= 7.5 else 2
    for z in [3.9 + 3.2 * k for k in range(int((h - 6.5) / 3.2) + 1)]:
        for i in range(across):
            WIN.append(spec(mx, (i - (across - 1) / 2) * w / across, -0.05, z, w / across * 0.56, 2.3, 'rect'))
    for side in (-1, 1):
        WIN.append(spec(mx, side * w * 0.3, -0.05, 1.2, w * 0.18, 1.8, 'rect'))
    if kind == 'cornice':
        DOORS.append(spec(mx, 0.0, -0.15, h + 2.3, 1.2, 1.5, 'rect'))
    else:
        g = (5.5 if kind != 'spout' else 4.5) + w * 0.2
        WIN.append(spec(mx, 0.0, -0.15, h + 0.6, min(1.8, w * 0.22), 2.0, 'rect'))
        WIN.append(spec(mx, 0.0, -0.15, h + g * 0.55, 0.9, 1.2, 'round'))


KINDS = ['step', 'bell', 'cornice', 'neck', 'spout', 'bell', 'step', 'cornice', 'neck', 'bell', 'spout', 'step', 'neck', 'bell']
a = -42.0
for k, kind in enumerate(KINDS):
    w = rng.uniform(6.8, 9.0) if kind != 'cornice' else rng.uniform(8.8, 10.4)
    step = math.degrees(2 * math.asin(w / (2 * R_FRONT)))
    if a + step > 42.0:
        break
    if k % 3 == 1:
        paint = (k // 3) % len(PAINTS)
        wall, trim = PAINTS[paint], (PAINTS[1] if paint in (0, 2) else M['white'])
    else:
        wall, trim = BRICKS[k % len(BRICKS)], M['white']
    canal_house(f'house{k}', a, a + step, rng.uniform(13.5, 18.0), kind, wall, trim)
    a += step
glazed('windows', WIN, M['white'], depth=0.3 * S)
glazed('doors', DOORS, M['white'], glass=M['door'], depth=0.3 * S)


# ------------------------------------------------------------------ the humped bridge over the side canal, its railings and bicycles
BR0, BR1 = -36.5, -30.0
SPAN = 12.0             # the bridge's ends on the quays
CROWN = 2.2


def deck(x):
    return CROWN * (1.0 - (x / SPAN) ** 2) if abs(x) < SPAN else 0.0


outline = [(-SPAN, ZW - 0.3), (-SIDE + 0.6, ZW - 0.3)]
for j in range(1, 16):
    t = math.pi - math.pi * j / 16
    outline.append(((SIDE - 0.6) * math.cos(t), ZW + 0.2 + 2.6 * math.sin(t)))
outline += [(SIDE - 0.6, ZW - 0.3), (SPAN, ZW - 0.3)]
top = [(SPAN - 2 * SPAN * j / 20, deck(SPAN - 2 * SPAN * j / 20)) for j in range(21)]
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(u, BR0, v)) for u, v in outline + top], [bm.verts.new(P(u, BR1, v)) for u, v in outline + top])
finish('bridge', bm, M['quayWall'], smooth_sides=False)
bm = bmesh.new()
add_prism(bm, [bm.verts.new(P(u, BR0 + 0.4, v + 0.02)) for u, v in top] + [bm.verts.new(P(u, BR0 + 0.4, v - 0.3)) for u, v in reversed(top)],
          [bm.verts.new(P(u, BR1 - 0.4, v + 0.02)) for u, v in top] + [bm.verts.new(P(u, BR1 - 0.4, v - 0.3)) for u, v in reversed(top)])
finish('bridgeRoad', bm, M['klinker'], smooth_sides=False)
rails = []
for yy in (BR0 + 0.25, BR1 - 0.25):
    rails.append([P(u, yy, deck(u) + 1.0) for u in [SPAN - 0.6 - (2 * SPAN - 1.2) * j / 20 for j in range(21)]])
    for j in range(11):
        u = -SPAN + 0.6 + (2 * SPAN - 1.2) * j / 10
        rails.append([P(u, yy, deck(u)), P(u, yy, deck(u) + 1.0)])
wires('bridgeRailings', M['iron'], rails, 0.06 * S)

BIKES = {}


def bicycle(x, y, z, ang, colour):
    """A city bike, its frame and two wheels, standing at (x, y, z) metres, pointing along ang (radians)."""
    d = Vector((math.cos(ang), math.sin(ang), 0.0))
    o = Vector((x, y, z))

    def at(u, v):
        q = o + d * u
        return P(q.x, q.y, q.z + v)
    rw = 0.55
    lines = BIKES.setdefault(colour, [])
    for cu in (-0.85, 0.85):
        lines.append([at(cu + rw * math.cos(2 * math.pi * k / 14), rw + rw * math.sin(2 * math.pi * k / 14)) for k in range(15)])
    lines.append([at(-0.85, rw), at(-0.1, rw), at(0.55, 1.25), at(-0.25, 1.25), at(-0.1, rw)])
    lines.append([at(0.55, 1.25), at(0.85, rw)])
    lines.append([at(0.5, 1.25), at(0.62, 1.55), at(0.45, 1.62)])
    lines.append([at(-0.35, 1.45), at(-0.05, 1.45)])


COLOURS = ('black', 'red', 'black', 'blue', 'black', 'green', 'black', 'yellow')
for j, u in enumerate((-10.0, -8.4, 8.6, 10.2)):
    for yy in (BR0 + 0.75, BR1 - 0.75):
        bicycle(u, yy, deck(u), 0.0, COLOURS[(j * 2 + (yy > BR0 + 1)) % len(COLOURS)])
for j, a in enumerate((-40.0, -37.0, -22.0, -19.5, 17.0, 19.5, 22.0, 39.0)):
    p = on_ring(R_OUT + 1.3, a)
    bicycle(p.x, p.y, 0.0, -math.radians(a), COLOURS[j])
for j, a in enumerate((-46.0, -43.5, 24.0, 44.0, 46.5)):
    p = on_ring(R_IN - 1.3, a)
    bicycle(p.x, p.y, 0.0, -math.radians(a), COLOURS[j + 1])
for colour, lines in BIKES.items():
    wires('bikes' + colour.title(), M['iron'] if colour == 'black' else M[colour], lines, 0.05 * S)


# ------------------------------------------------------------------ boats: the tour boat on the ring's canal, houseboats along the side canal
def tour_boat():
    hull = [(-11.0, -2.2), (8.5, -2.2), (11.0, 0.0), (8.5, 2.2), (-11.0, 2.2)]
    prism('tourHull', M['blue'], hull, ZW - 0.5, ZW + 0.7)
    block('tourDeck', M['white'], -10.6, 9.0, -1.9, 1.9, ZW + 0.7, ZW + 1.0, bevel=0)
    block('tourBand', M['white'], -10.0, 7.0, -1.75, 1.75, ZW + 1.0, ZW + 1.55, bevel=0)
    prof = [(-1.7, 0.0), (-1.7, 0.7), (-1.5, 1.3), (-1.0, 1.75), (0.0, 1.95), (1.0, 1.75), (1.5, 1.3), (1.7, 0.7), (1.7, 0.0)]
    bm_ = bmesh.new()
    add_prism(bm_, [bm_.verts.new(P(-10.0, v, ZW + 1.0 + hh)) for v, hh in prof], [bm_.verts.new(P(7.0, v, ZW + 1.0 + hh)) for v, hh in prof])
    finish('tourGlass', bm_, M['window'], smooth_sides=False)


p = on_ring(46.0, 24.0)
placed(frame_at(p.x, p.y, 24.0), tour_boat)
BOATWIN = []
for j, (y0, y1, hull, cab) in enumerate(((-54.0, -40.0, HULLS[0], PAINTS[0]), (-53.0, -41.0, HULLS[1], PAINTS[2]))):
    side = -1 if j == 0 else 1
    x0, x1 = sorted((side * (SIDE - 0.4), side * (SIDE - 3.6)))
    prism(f'houseboatHull{j}', hull, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], ZW - 0.5, ZW + 0.6)
    block(f'houseboatCabin{j}', cab, x0 + 0.3, x1 - 0.3, y0 + 1.0, y1 - 2.5, ZW + 0.6, ZW + 3.0)
    block(f'houseboatRoof{j}', M['wood'], x0 + 0.1, x1 - 0.1, y0 + 0.8, y1 - 2.3, ZW + 3.0, ZW + 3.25, bevel=0)
    xf = x1 - 0.25 if side < 0 else x0 + 0.25
    for k in range(int((y1 - y0 - 3.5) / 2.6)):
        c = P(xf + (0.05 if side < 0 else -0.05), y0 + 2.2 + 2.6 * k, 0)
        BOATWIN.append((c.x, c.y, Z0 + (ZW + 1.4) * S, 1.4 * S, 1.1 * S, (-side, 0), 'rect'))
    c = P((x0 + x1) / 2, y0 + 0.95, 0)
    BOATWIN.append((c.x, c.y, Z0 + (ZW + 1.3) * S, 1.4 * S, 1.2 * S, (0, -1), 'rect'))
    for k in range(3):
        c = P((x0 + x1) / 2 + rng.uniform(-0.8, 0.8), y1 - 1.4 - 0.6 * k, ZW + 0.6)
        lathe(f'pot{j}{k}', M['terracotta'], [(0.35 * S, 0.0), (0.45 * S, 0.6 * S)], c, segs=10)
        blob_cloud(f'potPlant{j}{k}', M['blossom'] if k == 1 else M['elm'], [((c.x, c.y, c.z + 0.9 * S), 0.6 * S, 1.0)], subdivisions=1)
glazed('boatWindows', BOATWIN, M['white'], depth=0.25 * S)

# ------------------------------------------------------------------ elms and lamp posts on the quays, and people
CROWNS = []
for j, (r, a, h) in enumerate(((31.0, -38.0, 10.5), (31.0, 40.0, 10.0), (58.5, -49.0, 9.5), (58.5, 49.0, 9.5))):
    p = on_ring(r, a)
    cylinder(f'elmTrunk{j}', M['trunk'], 0.35 * S, (h * 0.6) * S, P(p.x, p.y, 0), segs=8)
    for k in range(6):
        t = 2 * math.pi * k / 6 + j
        CROWNS.append((P(p.x + 2.0 * math.cos(t), p.y + 2.0 * math.sin(t), h * 0.72 + rng.uniform(-0.6, 0.6)).to_tuple(), 2.6 * S, 0.9))
    CROWNS.append((P(p.x, p.y, h * 0.92).to_tuple(), 2.8 * S, 0.9))
blob_cloud('elmCrowns', M['elm'], CROWNS)
LAMPS = []
for j, (r, a) in enumerate(((R_OUT + 0.6, -30.0), (R_OUT + 0.6, -8.0), (R_OUT + 0.6, 12.0), (R_OUT + 0.6, 31.0), (R_IN - 0.6, -30.0), (R_IN - 0.6, 30.0))):
    p = on_ring(r, a)
    LAMPS.append([P(p.x, p.y, 0), P(p.x, p.y, 4.2)])
    lathe(f'lamp{j}', M['iron'], [(0.0, 0.0), (0.35 * S, 0.3 * S), (0.25 * S, 0.8 * S), (0.0, 1.0 * S)], P(p.x, p.y, 4.1), segs=8)
wires('lampPosts', M['iron'], LAMPS, 0.09 * S)
WALK = [(-3.0, -33.5, 'red'), (3.5, -32.5, 'yellow')] + [(*on_ring(r, a), shirt) for r, a, shirt in (
    (57.0, -14.0, 'blue'), (56.5, -2.0, 'green'), (57.5, 16.0, 'red'), (56.0, -33.0, 'yellow'), (32.0, -24.0, 'green'), (31.5, 22.0, 'blue'), (25.0, 33.0, 'red'), (20.0, -40.0, 'yellow'))]
for k, (x, y, shirt) in enumerate(WALK):
    c = P(x, y, deck(x) if BR0 < y < BR1 else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.7)

R = Matrix.Rotation(math.radians(-32.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('amsterdam-canals')
