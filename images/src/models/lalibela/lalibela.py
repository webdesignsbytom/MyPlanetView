# A cartoon Lalibela (the Church of St George, Bete Giyorgis) for the country maps, built in the
# set's shared look (../toon.py): the red rock plateau, and cut straight down into it a deep
# square pit with the church standing in it, carved from the one rock: a cross in plan, its
# roof level with the ground round it and marked with three crosses one inside another, its
# walls with rows of windows. A few trees on the plateau.
# Run: blender -b --factory-startup -P lalibela.py -- lalibela-1024.png 1024 lalibela.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#dcae80'),
    'tuff': toon('tuff', '#b07454', shadow_mul=(0.8, 0.7, 0.72)),
    'tuffLight': toon('tuffLight', '#c98a68', shadow_mul=(0.8, 0.7, 0.72)),
    'pitfloor': toon('pitfloor', '#8f5a42', shadow_mul=(0.8, 0.7, 0.72)),
    'window': flat('window', '#3a2420'),
    'tree': toon('tree', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5238'),
})

G = tile(M['pitfloor'])
before = set(bpy.data.objects)
DEPTH = 0.34      # the pit's depth: the church's height, its roof level with the plateau
PIT = 1.42        # the pit's side
EDGE = 0.1        # the ground's height at the tile's edge: it slopes up to the pit
R = 1.42


# ---------- the plateau round the pit: a ring from the tile's edge in to the pit's square ----------
def square_point(a, half):
    c, s = math.cos(a), math.sin(a)
    m = max(abs(c), abs(s))
    return (half * c / m, half * s / m)


N = 64
bm = bmesh.new()
angles = [2 * math.pi * k / N + math.pi / 4 for k in range(N)]
ob = [bm.verts.new((R * math.cos(a), R * math.sin(a), G - 0.01)) for a in angles]
ot = [bm.verts.new((R * math.cos(a), R * math.sin(a), G + EDGE)) for a in angles]
ib = [bm.verts.new((*square_point(a, PIT / 2), G - 0.01)) for a in angles]
it = [bm.verts.new((*square_point(a, PIT / 2), G + DEPTH)) for a in angles]
for k in range(N):
    j = (k + 1) % N
    bm.faces.new((ob[k], ob[j], ot[j], ot[k]))
    bm.faces.new((it[k], it[j], ib[j], ib[k]))
    bm.faces.new((ot[k], ot[j], it[j], it[k]))
    bm.faces.new((ib[k], ib[j], ob[j], ob[k]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
plateau = finish('plateau', bm, M['ground'], outline=0.035)
plateau.visible_shadow = False  # its long slope shadowing itself streaked

# ---------- the church: a cross in plan, carved from the rock ----------
ARM, HALF = 0.27, 0.58   # half an arm's width, half the cross's length


def cross(half, arm):
    return [(arm, -half), (arm, -arm), (half, -arm), (half, arm), (arm, arm), (arm, half),
            (-arm, half), (-arm, arm), (-half, arm), (-half, -arm), (-arm, -arm), (-arm, -half)]


plan = cross(HALF, ARM)
loft('church', M['tuff'], [[(x, y, G - 0.01) for x, y in plan], [(x, y, G + DEPTH - 0.01) for x, y in plan]], outline=0.03)
# the roof's three crosses, one inside another, each standing a little proud
for k, (half, arm) in enumerate(((0.5, 0.19), (0.37, 0.12), (0.24, 0.06))):
    z = G + DEPTH - 0.01 + 0.012 * k
    loft(f'roofcross{k}', M['tuffLight'] if k % 2 == 0 else M['tuff'],
         [[(x, y, z) for x, y in cross(half, arm)], [(x, y, z + 0.012) for x, y in cross(half, arm)]], outline=0.012)
# rows of windows on each arm's end and sides
for i, a in enumerate((0, math.pi / 2, math.pi, -math.pi / 2)):
    c, s = math.cos(a), math.sin(a)
    for row, z in enumerate((G + 0.05, G + 0.18)):
        for dx in (-0.12, 0.0, 0.12):
            # on the arm's end
            ex, ey = (dx * c - (-HALF - 0.006) * s, dx * s + (-HALF - 0.006) * c)
            box(f'endwin{i}{row}{dx}', M['window'], ex, ey, z, 0.04, 0.02, 0.07 if row else 0.09, rot_z=a, outline=0, bevel=0)

# ---------- a few trees on the plateau ----------
for k, (x, y) in enumerate(((-0.92, 0.82), (0.95, 0.8), (-1.12, -0.5), (1.1, -0.55))):
    z = G + EDGE + 0.06   # near the tile's edge, where the ground is low
    rod(f'trunk{k}', M['trunk'], (x, y, z), (x, y, z + 0.12), 0.022, segs=8, outline=0.012)
    ball(f'tree{k}', M['tree'], x, y, z + 0.18, 0.12, outline=0.02)

turn(before, -20)
render(G)
