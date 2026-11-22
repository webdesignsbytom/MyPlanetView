# A cartoon Colosseum for the country maps, built from primitives in the set's shared look
# (../toon.py: toon shading, outline, grass tile, camera, sun): the elliptical wall, bay by
# bay, with arches on three storeys and the attic above; its broken side towards the camera,
# stepping down so the tiers of seats, the arena and the walls under its floor show.
# Run: blender -b --factory-startup -P colosseum.py -- colosseum-1024.png 1024 colosseum.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'travertine': toon('travertine', '#efd7a5'),
    'seats': toon('seats', '#dcc08e'),
    'podium': toon('podium', '#d2b27a'),
    'sand': toon('sand', '#e9c584'),
    'under': toon('under', '#b98d58'),
    'opening': flat('opening', '#6a4a33'),
})

G = tile()
box('path', M['path'], 0, -1.2, G - 0.01, 0.46, 0.5, 0.02, outline=0.015, bevel=0.0)

# ---------- the ellipse ----------
A, B = 1.2, 0.97         # the outer wall's half-length and half-width
WALL = 0.13              # its thickness
BAYS = 36
STOREYS = (0.33, 0.33, 0.33, 0.28)   # three storeys of arches, then the attic
PZ = G + 0.05            # the podium's top


def point(t, s=1.0):
    return Vector((A * s * math.cos(t), B * s * math.sin(t), 0))


def normal(t):
    return Vector((B * math.cos(t), A * math.sin(t), 0)).normalized()


def tangent_angle(t):
    return math.atan2(B * math.cos(t), -A * math.sin(t))


def ring_solid(name, mat, s_out, s_in, z0, z1, segs=96, outline=0.03):
    """An elliptical ring between two scales of the ellipse, from z0 up to z1 (a height, or a
    function of the angle round the ellipse); s_in 0 makes a disc."""
    top = z1 if callable(z1) else (lambda t: z1)
    bm = bmesh.new()
    ts = [2 * math.pi * k / segs for k in range(segs)]
    ob, ot = [bm.verts.new((*point(t, s_out).xy, z0)) for t in ts], [bm.verts.new((*point(t, s_out).xy, top(t))) for t in ts]
    if s_in > 0:
        ib, it = [bm.verts.new((*point(t, s_in).xy, z0)) for t in ts], [bm.verts.new((*point(t, s_in).xy, top(t))) for t in ts]
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((ob[k], ob[j], ot[j], ot[k]))   # outer side
            bm.faces.new((it[k], it[j], ib[j], ib[k]))   # inner side
            bm.faces.new((ot[k], ot[j], it[j], it[k]))   # top
            bm.faces.new((ib[k], ib[j], ob[j], ob[k]))   # bottom
    else:
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((ob[k], ob[j], ot[j], ot[k]))
        bm.faces.new(ot)
        bm.faces.new(list(reversed(ob)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return finish(name, bm, mat, outline)


def opening(name, at, t, z0, width, height, side=1, arched=True):
    """A dark arch (or a window) on the wall's face at `at`, facing outwards (side 1) or in (-1)."""
    phi = tangent_angle(t)
    p = at + normal(t) * 0.006 * side
    rect = height - width / 2 if arched else height
    box(name, M['opening'], p.x, p.y, z0, width, 0.02, rect, rot_z=phi, outline=0, bevel=0)
    if arched:
        cyl(name + 'top', M['opening'], width / 2, 0.02, segs=16, outline=0,
            matrix=Matrix.Translation((p.x, p.y, z0 + rect)) @ Matrix.Rotation(phi, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))


# ---------- the podium, the arena and the walls under its floor ----------
ring_solid('podium', M['podium'], 1.07, 0, G - 0.01, PZ, outline=0.035)
ring_solid('arena', M['sand'], 0.58, 0, PZ - 0.01, PZ + 0.03, outline=0.025)
for k, (y, half) in enumerate(((0.0, 0.5), (0.12, 0.42), (-0.12, 0.42), (0.24, 0.3), (-0.24, 0.3))):
    box(f'under{k}', M['under'], 0, y, PZ + 0.03, A * half * 2 * 0.9, 0.035, 0.06, outline=0.015, bevel=0)

# ---------- the broken side, towards the camera ----------
def from_broken(t):
    """Degrees round the ellipse from the middle of the broken side."""
    return abs((math.degrees(t) - 255 + 180) % 360 - 180)


def storeys_at(t):
    # The outer wall: one storey in the middle of the broken side, stepping up to all four
    d = from_broken(t)
    return 1 if d < 30 else 2 if d < 50 else 3 if d < 68 else 4


def seats_at(t):
    # The seats fell with it: lower on the broken side (so the arena shows), whole elsewhere
    x = min(1.0, max(0.0, (from_broken(t) - 25) / 50))
    return 0.45 + 0.55 * x * x * (3 - 2 * x)


# ---------- the seats: tiers stepping down to the arena ----------
TIERS = 5
SEATS_TOP = 0.95
for k in range(TIERS):
    s_out, s_in = 0.88 - k * 0.06, 0.88 - (k + 1) * 0.06
    height = SEATS_TOP - k * 0.17
    ring_solid(f'tier{k}', M['seats'], s_out, s_in, PZ, lambda t, height=height: PZ + height * seats_at(t), outline=0.028)


# ---------- the outer wall, bay by bay ----------


for i in range(BAYS):
    t0, t1 = 2 * math.pi * i / BAYS, 2 * math.pi * (i + 1) / BAYS
    tm = (t0 + t1) / 2
    count = storeys_at(tm)
    z = PZ
    for level in range(count):
        h = STOREYS[level]
        o0, o1 = point(t0), point(t1)
        i0, i1 = o0 - normal(t0) * WALL, o1 - normal(t1) * WALL
        quad = [o0, o1, i1, i0]
        loft(f'wall{i}_{level}', M['travertine'], [[(*p.xy, z) for p in quad], [(*p.xy, z + h) for p in quad]],
             outline=0.03)
        outer, inner = point(tm), point(tm) - normal(tm) * WALL
        if level < 3:
            opening(f'arch{i}_{level}', outer, tm, z + 0.05, 0.11, 0.22)
            # the arch seen from inside, above the seats
            if z + 0.05 > PZ + 0.5:
                opening(f'archin{i}_{level}', inner, tm, z + 0.05, 0.11, 0.22, side=-1)
        elif i % 2 == 0:
            opening(f'window{i}', outer, tm, z + 0.1, 0.06, 0.07, arched=False)
            opening(f'windowin{i}', inner, tm, z + 0.1, 0.06, 0.07, side=-1, arched=False)
        z += h
    # Where the outer wall has fallen, the inner ring's arches show on the seats' outer face
    if count < 3:
        face = point(tm, 0.88)
        for level in range(count, 3):
            z_arch = PZ + sum(STOREYS[:level]) + 0.05
            if z_arch + 0.23 < PZ + SEATS_TOP * seats_at(tm):
                opening(f'inner{i}_{level}', face, tm, z_arch, 0.1, 0.21)

render(G)
