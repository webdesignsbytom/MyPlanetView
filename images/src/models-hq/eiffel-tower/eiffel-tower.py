# The Eiffel Tower in the high-quality look (hq.py): wrought-iron lattice in its brown paint, the
# four legs curving in from their stone piers, each a square lattice column of four corner members
# braced on every face, the great arches between them, the first floor's frieze of arches, the
# second floor, the single shaft above narrowing to the top with its cabin, dome and antenna; on the
# Champ de Mars's gravel and lawns with rows of trees, and the Seine behind.
# Run: blender -b --factory-startup -P eiffel-tower.py -- eiffel-tower-1024.png 1024 eiffel-tower.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
M['eiffel'] = material('eiffel', '#7d6648', 0.55, vary='#6c5840', vary_scale=30, metallic=0.55)
M['frieze'] = material('frieze', '#8c7454', 0.5, metallic=0.5)

TX, TY = 0.12, 0.02
BAR = bmesh.new()      # every lattice member, as one object


def member(p0, p1, t):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(BAR, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t, t, d.length, 1)))


def lattice_column(centres, widths, chord=0.013, brace=0.0055, braces=True):
    """A square lattice column through centres (x, y, z) with the side widths given at each: four
    corner members, a horizontal strut and an X of braces on each face of every panel."""
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    rings = [[Vector((c[0] + sx * w / 2, c[1] + sy * w / 2, c[2])) for sx, sy in corners] for c, w in zip(centres, widths)]
    for a, b in zip(rings, rings[1:]):
        for k in range(4):
            member(a[k], b[k], chord)
            j = (k + 1) % 4
            member(a[k], a[j], brace * 1.3)
            if braces:
                member(a[k], b[j], brace)
                member(a[j], b[k], brace)
    for k in range(4):
        member(rings[-1][k], rings[-1][(k + 1) % 4], brace * 1.3)


def ease(t):
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------------ the four legs
H1, H2, HT = 0.56, 1.12, 2.42     # the first floor, the second, the top
for sx in (-1, 1):
    for sy in (-1, 1):
        centres, widths = [], []
        n = 9
        for i in range(n + 1):
            t = i / n
            # a curve: steep at the foot, leaning in more as it rises (Eiffel's profile)
            off = 0.6 - 0.27 * (t ** 1.35)
            centres.append((TX + sx * off, TY + sy * off, G + 0.05 + (H1 - 0.05) * t))
            widths.append(0.2 - 0.07 * t)
        for i in range(1, 7):
            t = i / 6
            off = 0.33 - 0.15 * t
            centres.append((TX + sx * off, TY + sy * off, G + H1 + (H2 - H1) * t))
            widths.append(0.13 - 0.04 * t)
        lattice_column(centres, widths)
        # the stone pier each leg stands on
        box(f'pier{sx}{sy}', M['granite'], (TX + sx * 0.6, TY + sy * 0.6, G + 0.03), (0.24, 0.24, 0.06), bevel=0.006)

# the great arches between the legs, under the first floor
for k, (ax, ay) in enumerate(((1, 0), (0, 1), (-1, 0), (0, -1))):
    pts = []
    for i in range(25):
        t = i / 24
        u = -0.42 + 0.84 * t
        z = G + 0.24 + 0.27 * math.sqrt(max(0.0, 1 - (u / 0.42) ** 2))
        if ax:
            pts.append((TX + ax * 0.47, TY + u, z))
        else:
            pts.append((TX + u, TY + ay * 0.47, z))
    tube(f'arch{k}', M['eiffel'], pts, 0.012)
    tube(f'archInner{k}', M['eiffel'], [(p[0], p[1], p[2] - 0.035) for p in pts[3:-3]], 0.007)
    for i in range(3, 22, 2):
        member(pts[i], (pts[i][0], pts[i][1], G + H1 - 0.01), 0.005)

# ------------------------------------------------------------------ the first and second floors
def floor_frame(name, half, hole, z, depth, frieze_h, n_arches):
    bm = bmesh.new()
    for (cx, cy, sx, sy) in ((0, -(half + hole) / 2, 2 * half, half - hole), (0, (half + hole) / 2, 2 * half, half - hole),
                             (-(half + hole) / 2, 0, half - hole, 2 * hole), ((half + hole) / 2, 0, half - hole, 2 * hole)):
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((TX + cx, TY + cy, z + depth / 2)) @ Matrix.Diagonal((sx, sy, depth, 1)))
    finish(name + 'Deck', bm, M['eiffel'], bevel=0.002, smooth_sides=False)
    # the frieze round the outside: arches in a band, and a railing above
    specs = []
    for side, (nx, ny) in enumerate(((0, -1), (1, 0), (0, 1), (-1, 0))):
        for i in range(n_arches):
            u = -half + (i + 0.5) * 2 * half / n_arches
            x, y = TX + nx * (half + 0.004) + (-ny) * u, TY + ny * (half + 0.004) + nx * u
            specs.append((x, y, z - frieze_h + 0.006, 2 * half / n_arches * 0.62, frieze_h - 0.014, (nx, ny), 'round'))
    bm = bmesh.new()
    for (cx, cy, sx, sy) in ((0, -half + 0.005, 2 * half, 0.01), (0, half - 0.005, 2 * half, 0.01), (-half + 0.005, 0, 0.01, 2 * half), (half - 0.005, 0, 0.01, 2 * half)):
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((TX + cx, TY + cy, z - frieze_h / 2)) @ Matrix.Diagonal((sx, sy, frieze_h, 1)))
    finish(name + 'Frieze', bm, M['frieze'], bevel=0.002, smooth_sides=False)
    windows(name + 'FriezeArches', M['shadow'], specs, depth=0.008)
    for side in range(4):
        for i in range(n_arches * 2 + 1):
            u = -half + i * half / n_arches
            nx, ny = ((0, -1), (1, 0), (0, 1), (-1, 0))[side]
            x, y = TX + nx * half + (-ny) * u, TY + ny * half + nx * u
            member((x, y, z + depth), (x, y, z + depth + 0.035), 0.004)
    for side, (nx, ny) in enumerate(((0, -1), (1, 0), (0, 1), (-1, 0))):
        a = (TX + nx * half + ny * half, TY + ny * half - nx * half, z + depth + 0.035)
        b = (TX + nx * half - ny * half, TY + ny * half + nx * half, z + depth + 0.035)
        member(a, b, 0.006)


floor_frame('first', 0.43, 0.22, G + H1, 0.035, 0.07, 9)
floor_frame('second', 0.22, 0.1, G + H2, 0.03, 0.045, 5)
box('secondPavilion', M['frieze'], (TX, TY, G + H2 + 0.06), (0.2, 0.2, 0.06), bevel=0.003)

# ------------------------------------------------------------------ the shaft to the top
centres, widths = [], []
n = 14
for i in range(n + 1):
    t = i / n
    centres.append((TX, TY, G + H2 + 0.03 + (HT - H2 - 0.03) * t))
    widths.append(0.24 * (1 - t) ** 1.6 + 0.06)
lattice_column(centres, widths, chord=0.011, brace=0.0045)
# a platform midway, and the top: the cabin, its dome and the antenna
box('midRing', M['eiffel'], (TX, TY, G + 1.72), (0.15, 0.15, 0.012), bevel=0.002)
box('topDeck', M['eiffel'], (TX, TY, G + HT + 0.006), (0.12, 0.12, 0.012), bevel=0.002)
box('topCabin', M['frieze'], (TX, TY, G + HT + 0.05), (0.08, 0.08, 0.075), bevel=0.003)
windows('topCabinWindows', M['glass'], [(TX + nx * 0.04, TY + ny * 0.04, G + HT + 0.025, 0.05, 0.035, (nx, ny), 'rect') for nx, ny in ((0, -1), (1, 0), (0, 1), (-1, 0))])
lathe('topDome', M['frieze'], [(0.03, 0), (0.025, 0.025), (0.012, 0.04), (0.0, 0.045)], (TX, TY, G + HT + 0.088), segs=16, smooth=True)
cylinder('antenna', M['steel'], 0.006, 0.28, (TX, TY, G + HT + 0.13), segs=8, r2=0.003)
cylinder('antennaRing', M['white'], 0.012, 0.03, (TX, TY, G + HT + 0.2), segs=12)

finish('lattice', BAR, M['eiffel'], smooth_sides=False)

# ------------------------------------------------------------------ the Champ de Mars and the Seine
bm = bmesh.new()
ring = [(PLINTH_R * 0.995 * math.cos(math.radians(a)), PLINTH_R * 0.995 * math.sin(math.radians(a))) for a in range(20, 161, 4)]
ring = [(x, y) for x, y in ring if y >= 0.95]
ring = [(ring[0][0], 0.95)] + ring + [(ring[-1][0], 0.95)]
add_prism(bm, [bm.verts.new((x, y, G - 0.012)) for x, y in ring], [bm.verts.new((x, y, G + 0.003)) for x, y in ring])
finish('seine', bm, M['water'], smooth_sides=False)
slab('quay', M['granite'], rect(0, 0.94, 3.0, 0.03), G - 0.01, G + 0.03, bevel=0.002, margin=0.006)
# the gravel square and the path out of its front, as one piece (two overlapping slabs left a dark seam)
x0, x1, y0, y1 = TX - 0.775, TX + 0.775, TY - 0.775, TY + 0.775
slab('gravel', M['gravel'], [(x0, y0), (TX - 0.18, y0), (TX - 0.18, -1.32), (TX + 0.18, -1.32), (TX + 0.18, y0), (x1, y0), (x1, y1), (x0, y1)], G - 0.004, G + 0.002)
for s in (-1, 1):
    for k in range(5):
        tree(f'treeRow{s}{k}', TX + s * (0.92 + 0.03 * (k % 2)), -0.75 + k * 0.33, h=0.22, r=0.085)
for k, (x, y, shirt) in enumerate(((TX - 0.05, -0.75, 'red'), (TX + 0.08, -0.82, 'blue'), (TX - 0.3, -0.5, 'yellow'), (TX + 0.35, -0.55, 'green'))):
    person(f'p{k}', x, y, 0.4 * k, shirt)

render('eiffel-tower')
