# The Temple of Heaven in the high-quality look (hq.py): Beijing's Hall of Prayer for Good Harvests,
# drawn to its real proportions (laid out in metres): the round hall of red lacquer and gilded lattice,
# the painted brackets under each eave, its three roofs of deep blue glazed tiles with their upturned
# eaves rising to the gilded finial; the three-tiered white marble altar it stands on, ringed with
# carved balustrades, its stairs on four sides, the carved slab up the middle of the south stairs; the
# grey brick courtyard, and people.
# Run: blender -b --factory-startup -P temple-of-heaven.py -- temple-of-heaven-1024.png 1024 temple-of-heaven.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1420)
M['qMarble'] = material('qMarble', '#f2eee6', 0.4, vary='#e6e0d4', vary_scale=18, bump=0.06, bump_scale=120, sss=0.03)
M['qMarbleShade'] = material('qMarbleShade', '#dfd9cd', 0.45, vary='#d2cbbd', vary_scale=18, bump=0.06, bump_scale=120)
M['lacquer'] = material('lacquer', '#a8232a', 0.35, vary='#952027', vary_scale=20, coat=0.4)
M['gilt'] = material('gilt', '#b48632', 0.4, metallic=0.5)
M['lattice'] = striped('lattice', ['#a3242a', '#a3242a', '#c99a35', '#a3242a', '#a3242a', '#8f1d23'], 'Z', 22.0, rough=0.4)
M['dougong'] = striped('dougong', ['#1e6f90', '#2f8a58', '#e2b33d', '#1e6f90', '#3a5fa8', '#2f8a58'], 'Z', 140.0, rough=0.45)
M['glazedBlue'] = banded(material('glazedBlue', '#1f4d9c', 0.22, vary='#2a5cad', vary_scale=10, coat=0.6), 'Z', 120.0, strength=0.5)
M['courtBrick'] = masonry('courtBrick', '#a39e96', '#7e7a74', scale=90, rough=0.85, vary='#97928a')
M['greenTrim'] = material('greenTrim', '#2f7d5a', 0.4, coat=0.3)

S = 0.0285              # metres to the tile's units
Z0 = G + 0.006          # the courtyard's top


def P(x, y, z):
    return (x * S, y * S, Z0 + z * S)


# ------------------------------------------------------------------ the courtyard
slab('courtyard', M['courtBrick'], [(-2, -2), (2, -2), (2, 2), (-2, 2)], G - 0.004, Z0, margin=0.04)

# ------------------------------------------------------------------ the three-tiered marble altar, its balustrades and stairs
TIERS = [(45.5, 0.0, 2.0), (39.0, 2.0, 4.0), (33.0, 4.0, 6.0)]          # radius, bottom, top (metres)
POSTS, PANELS = bmesh.new(), bmesh.new()
STAIR_W = 9.0
for i, (r, z0, z1) in enumerate(TIERS):
    cylinder(f'tier{i}', M['qMarble'], r * S, (z1 - z0 + 0.05) * S, P(0, 0, z0 - 0.05), segs=160)
    lathe(f'tierLip{i}', M['qMarbleShade'], [(r * S + 0.003, 0), (r * S + 0.003, 0.33 * S), (r * S - 0.001, 0.38 * S)], P(0, 0, z1 - 0.4), segs=160)   # its top a hair under the tier's: faces lying on each other render black
    # the balustrade along the tier's edge, broken by the four stairs
    rb = r - 0.5
    n = int(2 * math.pi * rb / 1.9)
    for k in range(n):
        a = 2 * math.pi * k / n
        if any(abs(((a - d + math.pi) % (2 * math.pi)) - math.pi) < (STAIR_W / 2 + 0.6) / rb for d in (0, math.pi / 2, math.pi, 1.5 * math.pi)):
            continue
        x, y = rb * math.cos(a), rb * math.sin(a)
        bmesh.ops.create_cube(POSTS, size=1.0, matrix=Matrix.Translation(P(x, y, z1 + 0.6)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Diagonal((0.32 * S, 0.32 * S, 1.2 * S, 1)))
        bmesh.ops.create_icosphere(POSTS, subdivisions=1, radius=0.24 * S, matrix=Matrix.Translation(P(x, y, z1 + 1.32)))
        a2 = 2 * math.pi * (k + 0.5) / n
        bmesh.ops.create_cube(PANELS, size=1.0, matrix=Matrix.Translation(P(rb * math.cos(a2), rb * math.sin(a2), z1 + 0.45)) @ Matrix.Rotation(a2, 4, 'Z') @ Matrix.Diagonal((0.18 * S, 1.6 * S, 0.8 * S, 1)))
    # the stairs down to the tier below (or the courtyard), on the four sides
    below = TIERS[i - 1][0] if i else r + 5.0
    for d in range(4):
        a = d * math.pi / 2
        steps = 9
        for j in range(steps):
            t0 = r + (below - r) * j / steps
            t1 = r + (below - r) * (j + 1) / steps
            ztop = z1 - (z1 - z0) * (j + 0.5) / steps
            c = (t0 + t1) / 2 - 0.3
            box(f'stair{i}{d}{j}', M['qMarble'], P(c * math.cos(a), c * math.sin(a), (ztop + z0 - 0.05) / 2),
                (abs(t1 - t0 + 0.6) * S if d % 2 == 0 else (STAIR_W - 0.06 * j) * S, (STAIR_W - 0.06 * j) * S if d % 2 == 0 else abs(t1 - t0 + 0.6) * S, (ztop - z0 + 0.05) * S), bevel=0)   # each a hair narrower: side faces lying on each other render black
        if d == 3:      # the south stairs' carved middle slab
            c0, c1 = r - 0.3, below
            m = Matrix.Translation(P(0, -(c0 + c1) / 2, (z0 + z1) / 2 + 0.25)) @ Matrix.Rotation(math.atan2(z1 - z0, c1 - c0), 4, 'X')
            box_m(f'dragonSlab{i}', M['qMarbleShade'], m, (2.6 * S, math.hypot(c1 - c0, z1 - z0) * S, 0.35 * S), bevel=0.001)
finish('balusterPosts', POSTS, M['qMarble'], smooth_sides=False)
finish('balusterPanels', PANELS, M['qMarbleShade'], smooth_sides=False)
ZT = TIERS[-1][2]         # the altar's top, where the hall stands

# ------------------------------------------------------------------ the hall: walls, columns, brackets, three roofs, the finial
cylinder('hallBase', M['qMarble'], 18.5 * S, 1.2 * S, P(0, 0, ZT - 0.05), segs=96)
H0 = ZT + 1.2


def drum(name, r, z0, z1, cols):
    """A ring of red columns, and between them red lacquer panels of gilded lattice."""
    cylinder(name + 'Wall', M['lacquer'], (r - 0.35) * S, (z1 - z0) * S, P(0, 0, z0), segs=96)
    bm, gold = bmesh.new(), bmesh.new()
    for k in range(cols):
        a = 2 * math.pi * k / cols
        bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.55 * S, radius2=0.5 * S, depth=(z1 - z0) * S, matrix=Matrix.Translation(P(r * math.cos(a), r * math.sin(a), (z0 + z1) / 2)))
        # the panel between this column and the next: a gilded frame round a lattice grid
        a2 = a + math.pi / cols
        w = 2 * (r - 0.35) * math.sin(math.pi / cols) - 1.4
        h = (z1 - z0) - 1.8
        base = Matrix.Translation(P((r - 0.3) * math.cos(a2), (r - 0.3) * math.sin(a2), z0 + 0.6)) @ Matrix.Rotation(a2, 4, 'Z')
        for u in (-w / 2, w / 2):
            bmesh.ops.create_cube(gold, size=1.0, matrix=base @ Matrix.Translation((0, u * S, h / 2 * S)) @ Matrix.Diagonal((0.2 * S, 0.25 * S, h * S, 1)))
        for zz in (0, h):
            bmesh.ops.create_cube(gold, size=1.0, matrix=base @ Matrix.Translation((0, 0, zz * S)) @ Matrix.Diagonal((0.2 * S, w * S, 0.25 * S, 1)))
        nv = max(3, int(w / 0.8))
        for j in range(1, nv):
            bmesh.ops.create_cube(gold, size=1.0, matrix=base @ Matrix.Translation((0, (-w / 2 + w * j / nv) * S, h / 2 * S)) @ Matrix.Diagonal((0.1 * S, 0.07 * S, h * S, 1)))
        nh = max(3, int(h / 0.8))
        for j in range(1, nh):
            bmesh.ops.create_cube(gold, size=1.0, matrix=base @ Matrix.Translation((0, 0, h * j / nh * S)) @ Matrix.Diagonal((0.1 * S, w * S, 0.07 * S, 1)))
    finish(name + 'Columns', bm, M['lacquer'], smooth_all=True)
    finish(name + 'Lattice', gold, M['gilt'], smooth_sides=False)
    lathe(name + 'Beam', M['dougong'], [(r * S + 0.002, 0), (r * S + 0.002, 0.9 * S)], P(0, 0, z1 - 0.9), segs=96)


def roof(name, r_eave, z_eave, r_top, z_top, kick=0.9):
    """A round roof of blue glazed tiles, its curve hollow, its eave turned up, the painted brackets under it."""
    lathe(name + 'Brackets', M['dougong'], [((r_eave - 2.2) * S, 0), ((r_eave - 0.8) * S, 1.4 * S), ((r_eave - 0.8) * S, 1.9 * S)], P(0, 0, z_eave - 1.9), segs=96)
    prof = []
    for j in range(15):
        t = j / 14
        r = r_eave + (r_top - r_eave) * t
        z = z_eave + (z_top - z_eave) * (t ** 1.6) + kick * (1 - t) ** 6
        prof.append((r * S, (z - z_eave) * S))
    prof = [((r_eave - 0.3) * S, kick * 0.6 * S)] + prof
    lathe(name, M['glazedBlue'], prof, P(0, 0, z_eave - 0.4), segs=128, smooth=True)
    annulus(name + 'Trim', M['greenTrim'], (r_eave + 0.15) * S, (r_eave - 0.6) * S, Z0 + (z_eave - 0.45 + kick) * S, Z0 + (z_eave - 0.1 + kick) * S, segs=128)
    # the rows of tile rolls running down the roof
    bm = bmesh.new()
    n = int(2 * math.pi * r_eave / 1.1)
    for k in range(n):
        a = 2 * math.pi * k / n
        for j in range(len(prof) - 2):
            (ra, za), (rb, zb) = prof[j + 1], prof[j + 2]
            if rb < 1.5 * S:
                break
            p0 = Vector((ra * math.cos(a), ra * math.sin(a), Z0 + (z_eave - 0.4) * S + za + 0.12 * S))
            p1 = Vector((rb * math.cos(a), rb * math.sin(a), Z0 + (z_eave - 0.4) * S + zb + 0.12 * S))
            d = p1 - p0
            rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.2 * S, radius2=0.2 * S, depth=d.length, matrix=Matrix.Translation((p0 + p1) / 2) @ rot)
    finish(name + 'TileRolls', bm, M['glazedBlue'], smooth_all=True)


drum('drum1', 16.5, H0, H0 + 9.0, 12)
roof('roof1', 19.5, H0 + 10.0, 12.0, H0 + 13.5)
drum('drum2', 12.0, H0 + 13.0, H0 + 17.5, 12)
roof('roof2', 15.0, H0 + 18.5, 8.6, H0 + 21.5)
drum('drum3', 8.6, H0 + 21.0, H0 + 25.0, 12)
roof('roof3', 11.8, H0 + 26.0, 0.9, H0 + 33.5, kick=1.0)
lathe('finial', M['gold'], [(r * S, z * S) for r, z in ((0.0, 0), (1.3, 0.3), (1.1, 1.2), (0.5, 1.5), (0.7, 1.9), (1.6, 2.9), (1.4, 3.9), (0.5, 4.4), (0.0, 4.6))], P(0, 0, H0 + 33.3), segs=32, smooth=True)

for k, (x, y, shirt) in enumerate(((-0.3, -1.36, 'red'), (0.25, -1.4, 'blue'), (0.45, -1.3, 'yellow'), (-0.6, -1.25, 'green'), (0.3, -1.05, 'red'), (-0.35, -1.0, 'blue'))):
    zz = Z0 if math.hypot(x, y) > TIERS[0][0] * S else Z0 + TIERS[0][2] * S
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=zz)

render('temple-of-heaven')
