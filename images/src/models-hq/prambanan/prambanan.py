# Prambanan in the high-quality look (hq.py), laid out in metres (the inner court drawn smaller, to
# fit): the three great temples in a row, Shiva's 47 m in the middle between Brahma's and Vishnu's,
# each a cella with a porch on every side on a stepped terrace, its roof rising in tiers ringed with
# little bell-shaped finials (ratnas) to a tall pointed crown, Shiva's terrace walled with a gallery
# of ratnas; facing them the three smaller temples of their mounts, the two side temples and the
# little shrines at the gates, all in grey volcanic stone in the walled inner court; outside it the
# fallen shrines of the outer court, lawns and coconut palms, and people.
# Run: blender -b --factory-startup -P prambanan.py -- prambanan-1024.png 1024 prambanan.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(856)
M['andesite'] = material('andesite', '#8a857b', 0.85, vary='#77736a', vary_scale=18, bump=0.3, bump_scale=220)
M['andesiteDark'] = material('andesiteDark', '#6f6b63', 0.85, vary='#615d56', vary_scale=18, bump=0.3, bump_scale=220)
M['courtGravel'] = material('pramGravel', '#cbbfa8', 0.9, vary='#bfb39b', vary_scale=60, bump=0.2, bump_scale=400)
M['lawnP'] = material('pramLawn', '#64ad3f', 0.85, vary='#70b84a', vary_scale=10)
M['palm'] = material('pramPalm', '#3f8a36', 0.8, vary='#4c9a3f', vary_scale=14)
M['doorway'] = material('pramDoorway', '#55524b', 0.9)

S = 0.0205              # metres to the tile's units
Z0 = G + 0.004
FY = 4.0                # the plan's middle on the tile's


ZOFF = 0.0              # raised by the court's top for what stands on it


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + (z + ZOFF) * S))


RATNA = [(0.55, 0.0), (0.6, 0.15), (0.5, 0.5), (0.32, 0.85), (0.2, 1.05), (0.24, 1.15), (0.08, 1.5), (0.0, 1.9)]


def add_lathe(bm, profile, centre, k, segs=8):
    """A solid of revolution (radius, height) pairs scaled by k, added into bm at centre."""
    cx, cy, cz = centre
    rings = []
    for r, z in profile:
        if r < 1e-6:
            rings.append([bm.verts.new((cx, cy, cz + z * k))])
            continue
        rings.append([bm.verts.new((cx + r * k * math.cos(2 * math.pi * j / segs), cy + r * k * math.sin(2 * math.pi * j / segs), cz + z * k)) for j in range(segs)])
    for a, b in zip(rings, rings[1:]):
        if len(b) == 1:
            for j in range(segs):
                bm.faces.new((a[j], a[(j + 1) % segs], b[0]))
        else:
            for j in range(segs):
                bm.faces.new((a[j], a[(j + 1) % segs], b[(j + 1) % segs], b[j]))
    bm.faces.new(list(reversed(rings[0])))


def ring_of_ratnas(bm, cx, cy, half, z, size, step):
    """Ratnas round a square's edge (its corners too), at height z."""
    n = max(1, int(2 * half / step))
    for e in range(4):
        for j in range(n):
            u = -half + 2 * half * j / n
            x, y = (u, -half) if e == 0 else ((half, u) if e == 1 else ((-u, half) if e == 2 else (-half, -u)))
            add_lathe(bm, RATNA, P(cx + x, cy + y, z), size * S)


def candi(name, cx, cy, base, height, terrace=0.0, porches=True, gallery=False):
    """A temple: its stepped terrace, the cella with a porch on each side, roof tiers ringed with ratnas, the crown."""
    stone, dark = M['andesite'], M['andesiteDark']
    z = 0.0
    if terrace:
        box(name + 'Terrace', stone, P(cx, cy, terrace / 2), ((base + 8.0) * S, (base + 8.0) * S, terrace * S), bevel=0.001)
        box(name + 'TerraceLip', dark, P(cx, cy, terrace - 0.32), ((base + 8.6) * S, (base + 8.6) * S, 0.5 * S), bevel=0)
        for e in range(4):
            a = math.pi / 2 * e
            sx, sy = round(math.cos(a)), round(math.sin(a))
            for j in range(6):
                d = (base + 8.0) / 2 + 0.5 + j * 1.0
                box(f'{name}Stair{e}{j}', stone, P(cx + sx * d, cy + sy * d, (terrace - j * terrace / 6) / 2), ((3.4 if sx == 0 else 1.1) * S, (1.1 if sx == 0 else 3.4) * S, (terrace - j * terrace / 6) * S), bevel=0)
        if gallery:
            for e in range(4):
                a = math.pi / 2 * e
                h = (base + 7.0) / 2
                L = base + 7.0
                for s in (-1, 1):
                    u0 = s * 2.4
                    u1 = s * L / 2
                    mx = (u0 + u1) / 2
                    if e % 2 == 0:
                        box(f'{name}Gallery{e}{s}', dark, P(cx + mx, cy + (-h if e == 0 else h), terrace + 1.0), (abs(u1 - u0) * S, 0.8 * S, 2.0 * S), bevel=0)
                    else:
                        box(f'{name}Gallery{e}{s}', dark, P(cx + (h if e == 1 else -h), cy + mx, terrace + 1.0), (0.8 * S, abs(u1 - u0) * S, 2.0 * S), bevel=0)
            gb = bmesh.new()
            ring_of_ratnas(gb, cx, cy, (base + 7.0) / 2, terrace + 2.0, 0.9, 2.2)
            finish(name + 'GalleryRatnas', gb, stone, smooth_sides=False)
        z = terrace
    # the cella's base and body, and a porch on each side
    box(name + 'Plinth', dark, P(cx, cy, z + 1.0), ((base + 1.0) * S, (base + 1.0) * S, 2.0 * S), bevel=0.001)
    body_h = height * 0.34
    box(name + 'Body', stone, P(cx, cy, z + 2.0 + body_h / 2), (base * S, base * S, body_h * S), bevel=0.001)
    box(name + 'Cornice', dark, P(cx, cy, z + 2.0 + body_h - 0.3), ((base + 1.2) * S, (base + 1.2) * S, 0.8 * S), bevel=0)
    pw = base * 0.36
    if porches:
        for e in range(4):
            a = math.pi / 2 * e
            sx, sy = round(math.cos(a)), round(math.sin(a))
            pc = (cx + sx * (base / 2 + pw * 0.35), cy + sy * (base / 2 + pw * 0.35))
            box(f'{name}Porch{e}', stone, P(pc[0], pc[1], z + 2.0 + body_h * 0.42), ((pw if sx == 0 else pw * 0.7) * S, (pw * 0.7 if sx == 0 else pw) * S, body_h * 0.84 * S), bevel=0.001)
            # the doorway
            dc = P(pc[0] + sx * pw * 0.35, pc[1] + sy * pw * 0.35, z + 2.0)
            DOORS.append((dc.x, dc.y, dc.z, pw * 0.4 * S, body_h * 0.55 * S, (sx, sy), 'rect'))
            pb = bmesh.new()
            pr = pw * 0.36
            for t in range(3):
                add_lathe(pb, [(1.0, 0.0), (1.0, 0.5), (0.0, 0.5)], P(pc[0], pc[1], z + 2.0 + body_h * 0.84 + t * pr * 0.5), pr * (1.0 - 0.25 * t) * S, segs=4)
            add_lathe(pb, RATNA, P(pc[0], pc[1], z + 2.0 + body_h * 0.84 + 1.5 * pr * 0.5), pr * 0.9 * S)
            finish(f'{name}PorchRoof{e}', pb, stone, smooth_sides=False)
    # the roof tiers, each smaller, ringed with ratnas; the crown
    rb = bmesh.new()
    tiers = 5
    zt = z + 2.0 + body_h
    roof_h = height - (zt - z) - height * 0.14
    half = base / 2 + 0.3
    for t in range(tiers):
        th = roof_h / tiers
        box(f'{name}Tier{t}', stone if t % 2 == 0 else dark, P(cx, cy, zt + th / 2), (2 * half * S, 2 * half * S, th * S), bevel=0)
        ring_of_ratnas(rb, cx, cy, half - 0.4, zt + th, th * 0.42, max(1.6, half / 4))
        zt += th
        half *= 0.72
    add_lathe(rb, RATNA, P(cx, cy, zt), height * 0.1 * S, segs=12)
    finish(name + 'Ratnas', rb, stone, smooth_sides=False)


DOORS = []
BEFORE = set(bpy.data.objects)
# ------------------------------------------------------------------ the ground: the lawn, the inner court and its wall, the fallen shrines outside
slab('lawn', M['lawnP'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
CH = 44.0               # the inner court's half side
box('court', M['courtGravel'], P(0.0, 0.0, 0.6), (2 * CH * S, 2 * CH * S, 1.2 * S), bevel=0)
for e in range(4):
    a = math.pi / 2 * e
    sx, sy = round(math.cos(a)), round(math.sin(a))
    for s in (-1, 1):
        u0, u1 = s * 5.0, s * CH
        mid = (u0 + u1) / 2
        L = abs(u1 - u0)
        if sx == 0:
            box(f'courtWall{e}{s}', M['andesiteDark'], P(mid, sy * CH, 2.2), (L * S, 1.2 * S, 2.0 * S), bevel=0)
        else:
            box(f'courtWall{e}{s}', M['andesiteDark'], P(sx * CH, mid, 2.2), (1.2 * S, L * S, 2.0 * S), bevel=0)
    # the little gate shrine either side of each gateway
    for s in (-1, 1):
        gx, gy = (s * 7.0, sy * (CH + 2.5)) if sx == 0 else (sx * (CH + 2.5), s * 7.0)
        if math.hypot(gx * S, (gy - FY) * S) < 1.36:
            candi(f'gate{e}{s}', gx, gy, 3.0, 7.0, porches=False)
RUBBLE = []
for k in range(500):
    x, y = rng.uniform(-70.0, 70.0), rng.uniform(-70.0, 70.0)
    if max(abs(x), abs(y)) < CH + 6.0 or math.hypot(x * S, (y - FY) * S) > 1.38:
        continue
    RUBBLE.append((P(x, y, 0.4).to_tuple(), rng.uniform(0.6, 1.4) * S, 0.6))
blob_cloud('rubble', M['andesiteDark'], RUBBLE)

# ------------------------------------------------------------------ the temples: the great three, their mounts' three facing them, the two side temples
ZC = 1.2                # the court's top
ZOFF = ZC
for name, x, base, h, terrace, gallery in (('shiva', 0.0, 26.0, 47.0, 2.6, True), ('brahma', -27.0, 15.0, 33.0, 1.8, False), ('vishnu', 27.0, 15.0, 33.0, 1.8, False)):
    candi(name, x, 14.0, base, h, terrace=terrace, gallery=gallery)
for name, x in (('nandi', 0.0), ('angsa', -22.0), ('garuda', 22.0)):
    candi(name, x, -22.0, 11.0, 25.0, terrace=1.4)
for name, x in (('apitN', -38.0), ('apitS', 38.0)):
    candi(name, x, -4.0, 6.0, 14.0, porches=False)
ZOFF = 0.0
glazed('doorways', DOORS, M['andesiteDark'], glass=M['doorway'], depth=0.4 * S, bars=False)

# ------------------------------------------------------------------ coconut palms on the lawn, people
for k, (x, y) in enumerate(((-56.0, -40.0), (56.0, -36.0), (-60.0, 20.0), (58.0, 24.0), (-30.0, -56.0), (34.0, -54.0))):
    if math.hypot(x * S, (y - FY) * S) > 1.34:
        continue
    h = rng.uniform(9.0, 12.0)
    tube(f'palm{k}Trunk', M['trunk'], [P(x, y, 0.0), P(x + 0.8, y + 0.4, h * 0.5), P(x + 1.2, y + 0.6, h)], 0.35 * S)
    for j in range(7):
        a = 2 * math.pi * j / 7 + rng.random() * 0.4
        tip = P(x + 1.2 + 4.0 * math.cos(a), y + 0.6 + 4.0 * math.sin(a), h - 1.6)
        mid = P(x + 1.2 + 2.2 * math.cos(a), y + 0.6 + 2.2 * math.sin(a), h + 0.4)
        tube(f'palm{k}Frond{j}', M['palm'], [P(x + 1.2, y + 0.6, h), mid, tip], 0.45 * S, resolution=1)
for k, (x, y, shirt) in enumerate(((-6.0, -6.0, 'red'), (5.0, -8.0, 'blue'), (-14.0, 2.0, 'yellow'), (12.0, -32.0, 'green'), (-4.0, -50.0, 'red'), (8.0, -52.0, 'blue'))):
    c = P(x, y, ZC if max(abs(x), abs(y)) < CH else 0.0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.1)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('prambanan')
