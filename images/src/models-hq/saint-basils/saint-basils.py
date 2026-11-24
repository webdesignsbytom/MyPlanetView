# Saint Basil's Cathedral in the high-quality look (hq.py), on Red Square's cobbles: the red brick
# church on its arcaded gallery, the central tower with tiers of white kokoshnik gables, its tall
# tent roof in a diamond pattern and little gold dome; round it four big and four small octagonal
# towers, each with white pilasters and bands, gables, a drum and an onion dome in its own pattern
# (spirals, zigzags, facets), every one with a gold Orthodox cross; the bell tower with its open
# belfry and green tent; Minin and Pozharsky's monument in front, people, and lawns behind.
# Run: blender -b --factory-startup -P saint-basils.py -- saint-basils-1024.png 1024 saint-basils.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1561)
M['basilBrick'] = banded(material('basilBrick', '#b4423a', 0.7, vary='#9e352e', vary_scale=24, bump=0.1, bump_scale=200), 'Z', 18.0, strength=0.12)
M['trim'] = material('trim', '#f3eee2', 0.5, vary='#e7e0cf', vary_scale=20, bump=0.05, bump_scale=120)
M['cobble'] = material('cobble', '#a29c93', 0.85, vary='#8c867d', vary_scale=40, bump=0.35, bump_scale=260)
M['dkGranite'] = material('dkGranite', '#77716b', 0.55, vary='#67625c', vary_scale=40, bump=0.08, bump_scale=200)
DOME = {
    'gold': material('domeGold', '#e8b84a', 0.24, metallic=1.0),
    'green': material('domeGreen', '#2f9a5c', 0.3, coat=0.5),
    'yellow': material('domeYellow', '#f0c545', 0.3, coat=0.5),
    'red': material('domeRed', '#cf3b30', 0.3, coat=0.5),
    'white': material('domeWhite', '#f5f2ea', 0.3, coat=0.5),
    'blue': material('domeBlue', '#2f63b6', 0.3, coat=0.5),
    'cream': material('domeCream', '#efe3c4', 0.4, coat=0.3),
}


def multi(name, bm, mats, smooth=True):
    """A mesh whose faces carry their own material index (domes in patterns)."""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = smooth
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for m in mats:
        me.materials.append(m)
    return ob


def smooth_profile(pts, sub=4):
    """Catmull-Rom through (r, z) points, `sub` samples between each pair."""
    out = []
    P = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = (Vector(P[j]) for j in (i - 1, i, i + 1, i + 2))
        for s in range(sub):
            t = s / sub
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(Vector(pts[-1]))
    return [(max(0.0, v.x), v.y) for v in out]


def patterned_lathe(name, mats, profile, base, segs, pattern, poly=0, smooth=True):
    """A solid of revolution whose faces take mats[pattern(i, k, rings, segs)]; `poly` > 0 makes its
    sections a polygon of that many straight sides instead of a circle (a tent roof)."""
    bm = bmesh.new()
    x0, y0, z0 = base

    def ring_pt(r, k):
        if poly:
            per = segs // poly
            j, f = k // per, (k % per) / per
            a0, a1 = 2 * math.pi * j / poly, 2 * math.pi * (j + 1) / poly
            c = Vector((math.cos(a0), math.sin(a0))).lerp(Vector((math.cos(a1), math.sin(a1))), f)
            return x0 + r * c.x, y0 + r * c.y
        a = 2 * math.pi * k / segs
        return x0 + r * math.cos(a), y0 + r * math.sin(a)
    rings = []
    for r, z in profile[:-1]:
        rings.append([bm.verts.new((*ring_pt(r, k), z0 + z)) for k in range(segs)])
    pole = bm.verts.new((x0, y0, z0 + profile[-1][1]))
    n = len(rings)
    for i in range(n - 1):
        for k in range(segs):
            f = bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
            f.material_index = pattern(i, k, n, segs)
    for k in range(segs):
        f = bm.faces.new((rings[-1][k], rings[-1][(k + 1) % segs], pole))
        f.material_index = pattern(n - 1, k, n, segs)
    bm.faces.new(list(reversed(rings[0])))
    return multi(name, bm, mats, smooth)


def spiral(stripes, twist):
    return lambda i, k, ni, nk: int(math.floor((k + 0.5) / nk * stripes + (i + 0.5) / ni * twist)) % 2


def zigzag(bands, teeth):
    return lambda i, k, ni, nk: int(math.floor((i + 0.5) / ni * bands + 0.6 * abs(((k + 0.5) / nk * teeth) % 1 * 2 - 1))) % 2


def facets(cols, rows):
    return lambda i, k, ni, nk: int(math.floor((k + 0.5) / nk * cols + 0.5 * (math.floor((i + 0.5) / ni * rows) % 2)) + math.floor((i + 0.5) / ni * rows)) % 2


ONION = smooth_profile([(0.11, 0.0), (0.15, 0.06), (0.172, 0.13), (0.157, 0.2), (0.118, 0.26), (0.068, 0.31), (0.028, 0.35), (0.006, 0.385), (0.0, 0.39)], 4)


def cross(name, x, y, z, s):
    """A gold Orthodox cross on an orb: the upright, the bar, the little top bar and the slanted foot."""
    lathe(name + 'Orb', M['gold'], [(0.0, 0.0), (0.014 * s, 0.006 * s), (0.018 * s, 0.018 * s), (0.012 * s, 0.03 * s), (0.0, 0.034 * s)], (x, y, z), segs=16, smooth=True)
    z += 0.03 * s
    bar(name + 'Up', M['gold'], (x, y, z), (x, y, z + 0.13 * s), 0.008 * s)
    bar(name + 'Bar', M['gold'], (x - 0.04 * s, y, z + 0.085 * s), (x + 0.04 * s, y, z + 0.085 * s), 0.007 * s)
    bar(name + 'Top', M['gold'], (x - 0.022 * s, y, z + 0.112 * s), (x + 0.022 * s, y, z + 0.112 * s), 0.006 * s)
    bar(name + 'Foot', M['gold'], (x - 0.026 * s, y, z + 0.03 * s), (x + 0.026 * s, y, z + 0.048 * s), 0.006 * s)


def onion(name, x, y, z, s, colours, pattern):
    patterned_lathe(name, [DOME[c] for c in colours], [(r * s, h * s) for r, h in ONION], (x, y, z), 96, pattern)
    cross(name + 'Cross', x, y, z + 0.385 * s, s * 1.2)


def octagon(name, mat, x, y, r, z0, h):
    return lathe(name, mat, [(r, 0), (r, h)], (x, y, z0), segs=8)


def faces8(x, y, r):
    """Each flat face of an octagon of corner radius r: (centre x, y, normal, width)."""
    d, w = r * math.cos(math.pi / 8), 2 * r * math.sin(math.pi / 8)
    for k in range(8):
        a = math.pi / 8 + k * math.pi / 4
        yield x + d * math.cos(a), y + d * math.sin(a), (math.cos(a), math.sin(a)), w


def gables(name, x, y, r, z0, scale=1.0):
    """A tier of kokoshniks round an octagon: white pointed gables with a brick infill."""
    outer, inner = [], []
    for fx, fy, nrm, w in faces8(x, y, r):
        outer.append((fx + nrm[0] * 0.004, fy + nrm[1] * 0.004, z0, w * 0.96, w * 1.05 * scale, nrm, 'pointed'))
        inner.append((fx + nrm[0] * 0.01, fy + nrm[1] * 0.01, z0 + w * 0.12, w * 0.68, w * 0.8 * scale, nrm, 'pointed'))
    windows(name + 'White', M['trim'], outer, depth=0.014)
    windows(name + 'Brick', M['basilBrick'], inner, depth=0.008)


def tower(name, x, y, r, h, z0, drum_h):
    """An octagonal brick tower: white base and bands, corner pilasters, windows, a tier of gables,
    then a narrower drum with its own windows; returns the drum's top."""
    octagon(name, M['basilBrick'], x, y, r, z0, h)
    for zz, hh in ((z0, 0.03), (z0 + h * 0.48, 0.018), (z0 + h - 0.02, 0.025)):
        lathe(f'{name}Band{zz:.3f}', M['trim'], [(r * 1.04, 0), (r * 1.04, hh)], (x, y, zz), segs=8)
    for k in range(8):
        a = 2 * math.pi * k / 8
        cx, cy = x + r * 1.01 * math.cos(a), y + r * 1.01 * math.sin(a)
        bar(f'{name}Pilaster{k}', M['trim'], (cx, cy, z0), (cx, cy, z0 + h), r * 0.12)
    specs = []
    for fx, fy, nrm, w in faces8(x, y, r):
        specs.append((fx + nrm[0] * 0.002, fy + nrm[1] * 0.002, z0 + h * 0.18, w * 0.34, h * 0.22, nrm, 'round'))
        specs.append((fx + nrm[0] * 0.002, fy + nrm[1] * 0.002, z0 + h * 0.56, w * 0.3, h * 0.2, nrm, 'round'))
    windows(name + 'Windows', M['shadow'], specs, depth=0.008)
    gables(name + 'Gables', x, y, r, z0 + h - 0.02)
    # the drum
    rd = r * 0.66
    top = z0 + h + r * 0.25
    lathe(name + 'Step', M['trim'], [(r * 0.92, 0), (r * 0.92, 0.012), (rd * 1.08, r * 0.25)], (x, y, z0 + h), segs=8)
    octagon(name + 'Drum', M['basilBrick'], x, y, rd, top, drum_h)
    lathe(name + 'DrumCornice', M['trim'], [(rd * 1.08, 0), (rd * 1.08, 0.016)], (x, y, top + drum_h - 0.016), segs=8)
    windows(name + 'DrumWindows', M['shadow'], [(fx, fy, top + drum_h * 0.25, w * 0.34, drum_h * 0.5, nrm, 'round') for fx, fy, nrm, w in faces8(x, y, rd)], depth=0.008)
    return top + drum_h


# ------------------------------------------------------------------ Red Square and the lawns
box('square', M['cobble'], (0, -0.05, G - 0.001), (2.1, 2.05, 0.006), bevel=0)
for k, (x, y, r) in enumerate(((-1.18, 0.62, 0.1), (-0.7, 1.22, 0.11), (0.25, 1.3, 0.1), (0.95, 1.02, 0.1), (-1.25, 0.2, 0.08))):
    tree(f'lawnTree{k}', x, y, h=0.22, r=r)

# ------------------------------------------------------------------ the arcaded gallery the church stands on
TX, TY = 0.0, 0.1
GW, GH = 1.5, 0.2
P = G + GH
box('gallery', M['basilBrick'], (TX, TY, G + GH / 2), (GW, GW, GH), bevel=0.004)
box('galleryCornice', M['trim'], (TX, TY, P - 0.01), (GW + 0.025, GW + 0.025, 0.02), bevel=0.002)
M['roofGreen'] = banded(material('roofGreen', '#3f7d5b', 0.45, vary='#376f50', vary_scale=12, metallic=0.2), 'X', 9.0, strength=0.2)
box('galleryRoof', M['roofGreen'], (TX, TY, P + 0.004), (GW - 0.03, GW - 0.03, 0.012), bevel=0.003)
box('galleryPlinth', M['trim'], (TX, TY, G + 0.012), (GW + 0.02, GW + 0.02, 0.024), bevel=0.002)
frames, holes = [], []
for nrm in ((0, -1), (1, 0), (0, 1), (-1, 0)):
    for i in range(9):
        u = -GW / 2 + (i + 0.5) * GW / 9
        x, y = TX + nrm[0] * GW / 2 + (-nrm[1]) * u, TY + nrm[1] * GW / 2 + nrm[0] * u
        frames.append((x, y, G + 0.035, 0.11, 0.135, nrm, 'round'))
        holes.append((x + nrm[0] * 0.004, y + nrm[1] * 0.004, G + 0.04, 0.08, 0.115, nrm, 'round'))
windows('galleryFrames', M['trim'], frames, depth=0.01)
windows('galleryArches', M['shadow'], holes, depth=0.01)
# the stairs up to it, with a tented porch
for k in range(6):
    box(f'stair{k}', M['trim'], (TX - 0.35, TY - GW / 2 - 0.13 + k * 0.022, G + (k + 1) * GH / 12), (0.2, 0.05, (k + 1) * GH / 6), bevel=0.002)
box('porch', M['basilBrick'], (TX + 0.38, TY - GW / 2 - 0.08, G + 0.15), (0.2, 0.16, 0.3), bevel=0.003)
windows('porchArch', M['shadow'], [(TX + 0.38, TY - GW / 2 - 0.16, G + 0.03, 0.1, 0.17, (0, -1), 'round')], depth=0.01)
patterned_lathe('porchTent', [M['basilBrick'], DOME['green']], [(0.15, 0.0), (0.02, 0.22), (0.0, 0.23)], (TX + 0.38, TY - GW / 2 - 0.08, G + 0.3), 32, lambda i, k, ni, nk: 1, poly=4)

# ------------------------------------------------------------------ the central tower and its tent
CR = 0.25
ctop = P + 0.6
octagon('central', M['basilBrick'], TX, TY, CR, P, 0.6)
for zz in (P + 0.29, ctop - 0.02):
    lathe(f'centralBand{zz:.3f}', M['trim'], [(CR * 1.03, 0), (CR * 1.03, 0.02)], (TX, TY, zz), segs=8)
for k in range(8):
    a = 2 * math.pi * k / 8
    bar(f'centralPilaster{k}', M['trim'], (TX + CR * 1.01 * math.cos(a), TY + CR * 1.01 * math.sin(a), P), (TX + CR * 1.01 * math.cos(a), TY + CR * 1.01 * math.sin(a), ctop), 0.026)
windows('centralWindows', M['shadow'], [(fx, fy, P + 0.36, w * 0.3, 0.16, nrm, 'round') for fx, fy, nrm, w in faces8(TX, TY, CR)], depth=0.008)
# three tiers of gables, stepping in
r = CR
z = ctop - 0.02
for t in range(3):
    gables(f'centralGables{t}', TX, TY, r, z, scale=1.0)
    lathe(f'centralTier{t}', M['basilBrick'], [(r * 0.98, 0), (r * 0.98, 0.06), (r * 0.86, 0.075)], (TX, TY, z), segs=8)
    z += 0.075
    r *= 0.86
# the tent: cream with a green diamond pattern, on its own corner pilasters
patterned_lathe('tent', [DOME['cream'], DOME['green']], [(r * 1.02, 0.0), (r * 0.18 + 0.03, 0.66), (0.0, 0.67)], (TX, TY, z), 64,
                lambda i, k, ni, nk: 1 if (k % 8 in (3, 4)) and (i % 3 == 1) else 0, poly=8)
for k in range(8):
    a = 2 * math.pi * k / 8
    bar(f'tentRib{k}', M['trim'], (TX + r * 1.03 * math.cos(a), TY + r * 1.03 * math.sin(a), z), (TX + (r * 0.18 + 0.03) * math.cos(a), TY + (r * 0.18 + 0.03) * math.sin(a), z + 0.66), 0.012)
z += 0.6
octagon('lantern', M['basilBrick'], TX, TY, 0.06, z, 0.09)
windows('lanternWindows', M['shadow'], [(fx, fy, z + 0.02, w * 0.4, 0.05, nrm, 'round') for fx, fy, nrm, w in faces8(TX, TY, 0.06)], depth=0.006)
onion('centralDome', TX, TY, z + 0.085, 0.5, ('gold', 'gold'), lambda *a: 0)

# ------------------------------------------------------------------ four big towers and four small ones
BIG = (((0.0, -0.52), ('green', 'yellow'), spiral(8, 1.3)), ((-0.52, 0.0), ('red', 'white'), zigzag(6, 8)),
       ((0.52, 0.0), ('blue', 'white'), spiral(10, -1.1)), ((0.0, 0.52), ('green', 'gold'), facets(14, 7)))
for k, ((dx, dy), cols, pat) in enumerate(BIG):
    x, y = TX + dx, TY + dy
    top = tower(f'big{k}', x, y, 0.15, 0.42, P, 0.1)
    onion(f'bigDome{k}', x, y, top - 0.008, 1.08, cols, pat)
SMALL = (((-0.4, -0.4), ('red', 'green'), spiral(8, 1.0)), ((0.4, -0.4), ('yellow', 'green'), facets(12, 6)),
         ((-0.4, 0.4), ('blue', 'yellow'), zigzag(5, 7)), ((0.4, 0.4), ('green', 'white'), spiral(9, -1.2)))
for k, ((dx, dy), cols, pat) in enumerate(SMALL):
    x, y = TX + dx, TY + dy
    top = tower(f'small{k}', x, y, 0.105, 0.3, P, 0.07)
    onion(f'smallDome{k}', x, y, top - 0.006, 0.74, cols, pat)

# ------------------------------------------------------------------ the bell tower
BX, BY = 0.98, 0.72
box('bellBase', M['basilBrick'], (BX, BY, G + 0.17), (0.24, 0.24, 0.34), bevel=0.003)
box('bellBaseBand', M['trim'], (BX, BY, G + 0.34), (0.26, 0.26, 0.02), bevel=0.002)
windows('bellBaseWindows', M['shadow'], [(BX + nx * 0.121, BY + ny * 0.121, G + 0.12, 0.05, 0.12, (nx, ny), 'round') for nx, ny in ((0, -1), (-1, 0), (1, 0), (0, 1))], depth=0.006)
arcade_ring('belfry', M['basilBrick'], 0.11, 0.02, G + 0.35, 0.16, 8, 0.032, phase=math.pi / 8, matrix=Matrix.Translation((BX, BY, 0)))
octagon('belfryCore', M['shadow'], BX, BY, 0.07, G + 0.35, 0.14)
for zz in (G + 0.35, G + 0.5):
    lathe(f'belfryBand{zz:.3f}', M['trim'], [(0.12, 0), (0.12, 0.018)], (BX, BY, zz), segs=8)
patterned_lathe('bellTent', [DOME['green'], DOME['cream']], [(0.12, 0.0), (0.03, 0.3), (0.0, 0.305)], (BX, BY, G + 0.518), 64,
                lambda i, k, ni, nk: 0, poly=8)
onion('bellDome', BX, BY, G + 0.8, 0.3, ('gold', 'gold'), lambda *a: 0)

# ------------------------------------------------------------------ Minin and Pozharsky, and people
MX, MY = -0.25, -1.08
box('monPlinth', M['dkGranite'], (MX, MY, G + 0.02), (0.26, 0.18, 0.04), bevel=0.003)
box('monPedestal', M['dkGranite'], (MX, MY, G + 0.12), (0.2, 0.12, 0.16), bevel=0.004)
box('monRelief', M['bronze'], (MX, MY - 0.061, G + 0.12), (0.14, 0.004, 0.08), bevel=0.001)
PZ = G + 0.2
cylinder('mininBody', M['bronze'], 0.022, 0.1, (MX - 0.03, MY, PZ), segs=12, r2=0.016)
lathe('mininHead', M['bronze'], [(0.0, 0), (0.013, 0.006), (0.012, 0.018), (0.0, 0.026)], (MX - 0.03, MY, PZ + 0.1), segs=12, smooth=True)
bar('mininArm', M['bronze'], (MX - 0.03, MY, PZ + 0.085), (MX - 0.06, MY - 0.02, PZ + 0.15), 0.01)
box('pozharskySeat', M['dkGranite'], (MX + 0.045, MY, PZ + 0.02), (0.05, 0.05, 0.04), bevel=0.002)
cylinder('pozharskyBody', M['bronze'], 0.02, 0.07, (MX + 0.045, MY, PZ + 0.03), segs=12, r2=0.015)
lathe('pozharskyHead', M['bronze'], [(0.0, 0), (0.012, 0.006), (0.011, 0.017), (0.0, 0.024)], (MX + 0.045, MY, PZ + 0.1), segs=12, smooth=True)
box_m('pozharskyShield', M['bronze'], Matrix.Translation((MX + 0.07, MY - 0.01, PZ + 0.04)) @ Matrix.Rotation(0.3, 4, 'Z'), (0.006, 0.035, 0.05), bevel=0.002)
for k, (x, y, shirt) in enumerate(((-0.6, -1.0, 'red'), (0.15, -0.98, 'blue'), (0.45, -1.1, 'yellow'), (-0.85, -0.7, 'green'), (0.75, -0.85, 'red'), (0.9, -0.3, 'blue'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt)

render('saint-basils')
