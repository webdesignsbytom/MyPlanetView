# Mount Fuji in the high-quality look (hq.py), the postcard view: the blue-violet cone with its
# concave slopes, gullies down its sides and the crater on its flat top, its snowcap reaching down
# the gullies in fingers, the forest round its foot; in front, the five-storey Chureito Pagoda on
# its hillside among cherry trees in blossom, its red storeys, white panels and dark roofs with
# upturned eaves, its gold spire; Lake Kawaguchi with a red torii by the shore.
# Run: blender -b --factory-startup -P mount-fuji.py -- mount-fuji-1024.png 1024 mount-fuji.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(3776)
M['fuji'] = material('fuji', '#5a6b98', 0.8, vary='#4f5f8b', vary_scale=6, bump=0.25, bump_scale=60)
M['forestFoot'] = material('forestFoot', '#2f6e3a', 0.85, vary='#285f31', vary_scale=14, bump=0.5, bump_scale=120)
M['pagodaRed'] = material('pagodaRed', '#cf3f2e', 0.5, vary='#bd3527', vary_scale=20)
M['roofDark'] = material('roofDark', '#3e3f45', 0.5, vary='#35363b', vary_scale=14, bump=0.08, bump_scale=200, metallic=0.2)
M['plaster'] = material('plaster', '#f2ede2', 0.6)

# ------------------------------------------------------------------ the mountain
FX, FY = 0.14, 0.36
PROFILE = [(1.06, -0.012), (0.9, 0.14), (0.7, 0.36), (0.52, 0.6), (0.36, 0.86), (0.24, 1.08), (0.18, 1.18)]
TOP = PROFILE[-1][1]
prof = []
for (r0, z0), (r1, z1) in zip(PROFILE, PROFILE[1:]):
    for s in range(28):
        t = s / 28
        prof.append((r0 + (r1 - r0) * t, z0 + (z1 - z0) * t))
prof.append(PROFILE[-1])
SEG = 320
bm = bmesh.new()
rings = []


def gully(a):
    return 0.5 + 0.5 * math.sin(15 * a + 1.8 * math.sin(3 * a) + 0.6 * math.sin(7 * a))


for r, z in prof:
    ring = []
    for k in range(SEG):
        a = 2 * math.pi * k / SEG
        g = gully(a)
        rr = r * (1 - 0.04 * g * max(0.0, z / TOP) ** 0.8) if z > 0.02 else r
        ring.append(bm.verts.new((FX + rr * math.cos(a), FY + rr * math.sin(a), G + z)))
    rings.append(ring)
# the crater: a rim, and its floor sunk inside
rim = [bm.verts.new((FX + 0.15 * math.cos(2 * math.pi * k / SEG), FY + 0.15 * math.sin(2 * math.pi * k / SEG), G + TOP + 0.012)) for k in range(SEG)]
floor_ = [bm.verts.new((FX + 0.1 * math.cos(2 * math.pi * k / SEG), FY + 0.1 * math.sin(2 * math.pi * k / SEG), G + TOP - 0.03)) for k in range(SEG)]
rings += [rim, floor_]
for i in range(len(rings) - 1):
    for k in range(SEG):
        j = (k + 1) % SEG
        f = bm.faces.new((rings[i][k], rings[i][j], rings[i + 1][j], rings[i + 1][k]))
        zc = f.calc_center_median().z - G
        a = 2 * math.pi * (k + 0.5) / SEG
        g = gully(a)
        snowline = TOP * (0.6 - 0.2 * g ** 5) + 0.02 * math.sin(23 * a)
        forest = 0.13 + 0.04 * math.sin(11 * a) + 0.02 * math.sin(29 * a)
        f.material_index = 1 if zc > snowline else (2 if zc < forest else 0)
bm.faces.new(floor_).material_index = 1
multi('fuji', bm, [M['fuji'], M['snow'], M['forestFoot']], smooth=True)

# trees along the forest's top edge
for k in range(70):
    a = rng.uniform(0, 2 * math.pi)
    rr = 0.98 + rng.uniform(-0.05, 0.08)
    x, y = FX + rr * math.cos(a), FY + rr * math.sin(a)
    if math.hypot(x, y) > 1.42:
        continue
    fir(f'footFir{k}', x, y, h=0.11 + 0.05 * rng.random(), r=0.035, z=G + 0.01)


# ------------------------------------------------------------------ the hillside, the pagoda and the cherry trees
def pagoda_roof(name, cx, cy, z0, w, h, over=0.07, lift=0.035, n=10):
    """A pagoda roof: square in plan, a deep eave curving up to its corners, then a concave slope."""
    prof = [(w / 2 + over, 0.0, 1.0), (w / 2 + over, 0.012, 1.0), (w / 2 + over * 0.55, 0.028, 0.6), (w / 2, 0.045, 0.25), (w * 0.3, h, 0.0)]
    bm = bmesh.new()
    rings = []
    for a, z, up in prof:
        ring = []
        for side in range(4):
            for i in range(n):
                s = -1 + 2 * i / n
                corner = ((-1, -1), (1, -1), (1, 1), (-1, 1))
                p0, p1 = corner[side], corner[(side + 1) % 4]
                px = p0[0] + (p1[0] - p0[0]) * (i / n)
                py = p0[1] + (p1[1] - p0[1]) * (i / n)
                ring.append(bm.verts.new((cx + a * px, cy + a * py, z0 + z + lift * up * abs(s) ** 3)))
        rings.append(ring)
    m = len(rings[0])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(m):
            bm.faces.new((r0[k], r0[(k + 1) % m], r1[(k + 1) % m], r1[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    finish(name, bm, M['roofDark'], smooth_sides=False)


PX, PY = -0.62, -0.5
HX, HY, HR = PX + 0.03, PY + 0.02, 0.55     # the hillside under it
# the hillside it stands on
lathe('hill', M['grass'], [(HR, 0.0), (HR * 0.89, 0.035), (HR * 0.67, 0.075), (HR * 0.4, 0.1), (0.0, 0.108)], (HX, HY, G - 0.01), segs=64, smooth=True, sx=1.05, sy=0.92)
HZ = G + 0.098
box('pagodaPlatform', M['granite'], (PX, PY, HZ + 0.02), (0.32, 0.32, 0.04), bevel=0.004)
for k in range(5):
    box(f'stairs{k}', M['granite'], (PX, PY - 0.18 - 0.03 * k, HZ + 0.02 - 0.01 * k - 0.01), (0.08, 0.03, 0.04 - 0.02 * k + 0.0), bevel=0.002)
z = HZ + 0.04
for k in range(5):
    w = 0.2 - k * 0.022
    hs = 0.095 if k == 0 else 0.075
    box(f'storey{k}', M['pagodaRed'], (PX, PY, z + hs / 2), (w, w, hs), bevel=0.003)
    specs = []
    for nx, ny in ((0, -1), (-1, 0), (1, 0), (0, 1)):
        for u in (-0.3, 0.3):
            specs.append((PX + nx * w / 2 + (-ny) * u * w, PY + ny * w / 2 + nx * u * w, z + hs * 0.12, w * 0.24, hs * 0.66, (nx, ny), 'rect'))
        specs.append((PX + nx * w / 2, PY + ny * w / 2, z + hs * 0.12, w * 0.2, hs * 0.7, (nx, ny), 'rect'))
    windows(f'panels{k}', M['plaster'], specs, depth=0.006)
    windows(f'doors{k}', M['shadow'], [(PX + nx * (w / 2 + 0.002), PY + ny * (w / 2 + 0.002), z + hs * 0.12, w * 0.14, hs * 0.6, (nx, ny), 'rect') for nx, ny in ((0, -1), (-1, 0), (1, 0), (0, 1))], depth=0.006)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'post{k}{sx}{sy}', M['pagodaRed'], (PX + sx * w / 2, PY + sy * w / 2, z), (PX + sx * w / 2, PY + sy * w / 2, z + hs), 0.014)
    z += hs
    pagoda_roof(f'roof{k}', PX, PY, z, w, 0.06)
    z += 0.05
cylinder('sorin', M['gold'], 0.006, 0.2, (PX, PY, z - 0.02), segs=10)
for k in range(9):
    lathe(f'sorinRing{k}', M['gold'], [(0.018 - k * 0.0008, 0), (0.018 - k * 0.0008, 0.006)], (PX, PY, z + 0.01 + k * 0.014), segs=16)
lathe('sorinFlame', M['gold'], [(0.0, 0), (0.012, 0.01), (0.014, 0.025), (0.006, 0.04), (0.0, 0.05)], (PX, PY, z + 0.14), segs=12, smooth=True)


def cherry(name, x, y, z, s=1.0):
    """A cherry tree in blossom: a crooked trunk and branches under soft pink clouds."""
    lr = random.Random(hash(name) & 0xffff)
    tube(name + 'Trunk', M['trunk'], [(x, y, z), (x + 0.015 * s, y, z + 0.08 * s), (x - 0.01 * s, y + 0.01 * s, z + 0.16 * s)], 0.016 * s)
    bm = bmesh.new()
    for k in range(7):
        a = 2 * math.pi * k / 7 + lr.random()
        r = s * (0.06 + 0.035 * lr.random())
        off = Vector((math.cos(a) * 0.075 * s, math.sin(a) * 0.075 * s, s * (0.17 + 0.06 * lr.random())))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r, matrix=Matrix.Translation(Vector((x, y, z)) + off))
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.08 * s, matrix=Matrix.Translation((x, y, z + 0.24 * s)))
    finish(name, bm, M['blossom'], smooth_all=True)


# the cherry trees beside and behind the pagoda, never between it and the camera
for k, (x, y, s) in enumerate(((-1.04, -0.45, 1.0), (-1.07, -0.08, 1.05), (-0.37, -0.2, 0.95), (-0.2, -0.55, 0.9), (-0.2, -0.92, 1.0),
                               (-1.24, -0.35, 0.9), (0.7, -1.05, 0.9), (1.02, -0.78, 1.0))):
    d = math.hypot((x - HX) / 1.05, (y - HY) / 0.92)
    zz = G - 0.01 + 0.108 * (1 - (d / HR) ** 2) if d < HR else G
    cherry(f'cherry{k}', x, y, zz, s)

# ------------------------------------------------------------------ Lake Kawaguchi and a torii
bm = bmesh.new()
lake = [(0.42 + 0.4 * math.cos(2 * math.pi * k / 48) * (1 + 0.08 * math.sin(3 * 2 * math.pi * k / 48)), -0.92 + 0.22 * math.sin(2 * math.pi * k / 48)) for k in range(48)]
add_prism(bm, [bm.verts.new((x, y, G - 0.01)) for x, y in lake], [bm.verts.new((x, y, G + 0.003)) for x, y in lake])
finish('lake', bm, M['water'], smooth_sides=False)
TX, TY = 0.02, -0.98
for s in (-1, 1):
    cylinder(f'toriiPost{s}', M['pagodaRed'], 0.012, 0.18, (TX + s * 0.07, TY, G), segs=12)
box('toriiNuki', M['pagodaRed'], (TX, TY, G + 0.14), (0.17, 0.016, 0.014), bevel=0.002)
bm = bmesh.new()
pts = [(TX - 0.12, G + 0.192), (TX - 0.06, G + 0.18), (TX + 0.06, G + 0.18), (TX + 0.12, G + 0.192), (TX + 0.12, G + 0.205), (TX - 0.12, G + 0.205)]
add_prism(bm, [bm.verts.new((x, TY - 0.012, z)) for x, z in pts], [bm.verts.new((x, TY + 0.012, z)) for x, z in pts])
finish('toriiKasagi', bm, M['roofDark'], bevel=0.002, smooth_sides=False)
box('toriiShimaki', M['pagodaRed'], (TX, TY, G + 0.176), (0.2, 0.018, 0.012), bevel=0.002)
for k, (x, y, shirt) in enumerate(((-0.25, -0.98, 'red'), (-0.18, -1.05, 'blue'), (-0.55, -0.95, 'yellow'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt)

render('mount-fuji')
