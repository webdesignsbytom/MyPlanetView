# A cartoon Le Morne Brabant for the country maps, built in the set's shared look (../toon.py) on a
# tile of the Indian Ocean: the great basalt mountain on its peninsula, sheer cliffs above green
# slopes, the white beach and palms at its foot, the turquoise lagoon inside the line of surf on
# the reef, the "underwater waterfall" of sand pouring off the shelf beyond it, and a catamaran.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P le-morne.py -- le-morne-1024.png 1024 le-morne.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ocean': toon('ocean', '#1f6fb0', shadow_mul=(0.74, 0.78, 0.9), lift=0.35),
    'lagoon': toon('lagoon', '#3fd0c8', shadow_mul=(0.72, 0.86, 0.88), lift=0.35),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'sandFall': flat('sandFall', '#9adce0'),
    'deepFall': flat('deepFall', '#164f8a'),
    'beach': toon('beach', '#f4ecd6', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'slope': toon('slope', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'cliff': toon('cliff', '#7a7068', shadow_mul=(0.8, 0.78, 0.86)),
    'cliffTop': toon('cliffTop', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'sail': toon('sail', '#fbfbfd', shadow_mul=(0.82, 0.85, 0.95), lift=0.1),
})

G = tile(M['ocean'])
before = set(bpy.data.objects)
rng = random.Random(389)


def ring(cx, cy, rx, ry, z, jitter, sides=18):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the lagoon inside the reef, the surf on the reef ----------
LX, LY = 0.1, 0.3
lagoon = [(x, y) for x, y, _ in ring(LX, LY, 1.12, 0.85, 0, 0.04, 28)]
flat_face('lagoon', M['lagoon'], lagoon, G + 0.004, outline=0.01)
for k, ((x0, y0), (x1, y1)) in enumerate(zip(lagoon, lagoon[1:] + lagoon[:1])):
    if y0 < LY - 0.2 or y1 < LY - 0.2:
        bar(f'surf{k}', M['surf'], (x0, y0, G + 0.012), (x1, y1, G + 0.012), 0.025, outline=0.004)

# ---------- the underwater waterfall: sand pouring off the shelf beyond the reef, narrowing as it falls ----------
TOP_Y, TIP = -0.6, (-0.25, -1.33)
for k in range(9):
    x0 = -0.75 + k * 0.1
    x1 = x0 + 0.1
    mat = 'sandFall' if k % 2 == 0 else 'deepFall'
    flat_face(f'fall{k}', M[mat], [(x0, TOP_Y), (x1, TOP_Y), (TIP[0] + (x1 + x0) / 2 * 0.08, TIP[1])], G + 0.005)

# ---------- the peninsula: beach, then the mountain ----------
PX, PY = -0.05, 0.4
beach = ring(PX, PY, 0.95, 0.62, -0.01, 0.04)
loft('beach', M['beach'], [beach, [(x, y, G + 0.04) for x, y, _ in ring(PX, PY, 0.9, 0.58, 0, 0.04)]], outline=0.02)
# lopsided: the sheer side to the front and left, the summit pushed back and to the right
slope = loft('slopes', M['slope'], [ring(PX + 0.05, PY + 0.05, 0.78, 0.5, 0.035, 0.05), ring(PX + 0.08, PY + 0.1, 0.6, 0.38, 0.24, 0.07)], outline=0.03)
cliff = loft('cliffs', M['cliff'], [ring(PX + 0.08, PY + 0.1, 0.6, 0.38, 0.22, 0.06), ring(PX + 0.14, PY + 0.16, 0.5, 0.3, 0.62, 0.1),
                                    ring(PX + 0.2, PY + 0.2, 0.36, 0.22, 0.82, 0.12)], outline=0.034)
top = loft('top', M['cliffTop'], [ring(PX + 0.2, PY + 0.2, 0.36, 0.22, 0.815, 0.0), ring(PX + 0.24, PY + 0.24, 0.2, 0.12, 0.92, 0.12),
                                  ring(PX + 0.3, PY + 0.28, 0.03, 0.03, 0.98, 0.0)], outline=0.025)
slope.visible_shadow = cliff.visible_shadow = top.visible_shadow = False
# green clinging in the cliff's gullies
for k in range(6):
    a = math.radians(200 + k * 25)
    ball(f'gully{k}', M['cliffTop'], PX + 0.12 + 0.52 * math.cos(a), PY + 0.14 + 0.32 * math.sin(a), G + 0.42 + 0.06 * (k % 2), 0.05, outline=0.01)
for k in range(10):
    a = 2 * math.pi * k / 10 + rng.uniform(-0.2, 0.2)
    ball(f'scrub{k}', M['palm'], PX + 0.05 + 0.66 * math.cos(a), PY + 0.05 + 0.43 * math.sin(a), G + 0.14, 0.07, outline=0.014)

# ---------- palms along the beach ----------
for k, a in enumerate((200, 225, 250, 275, 300, 325)):
    x, y = PX + 0.84 * math.cos(math.radians(a)), PY + 0.55 * math.sin(math.radians(a))
    h = rng.uniform(0.2, 0.26)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.04), (x + 0.03, y - 0.02, G + 0.04 + h), 0.014, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y - 0.02, G + 0.04 + h), (x + 0.03 + 0.1 * math.cos(b), y - 0.02 + 0.1 * math.sin(b), G + h - 0.02), 0.02,
            outline=0.006)

# ---------- a catamaran in the lagoon ----------
CX, CY = 0.75, -0.25
for s in (-1, 1):
    box(f'cathull{s}', M['hull'], CX, CY + s * 0.05, G + 0.004, 0.24, 0.035, 0.03, outline=0.008, bevel=0.01)
box('catdeck', M['hull'], CX, CY, G + 0.03, 0.14, 0.13, 0.012, outline=0.006, bevel=0)
rod('catmast', M['trunk'], (CX, CY, G + 0.04), (CX, CY, G + 0.36), 0.005, segs=6, outline=0)
loft('catsail', M['sail'], [[(CX - 0.1, CY - 0.002, G + 0.06), (CX - 0.005, CY - 0.002, G + 0.06), (CX - 0.005, CY - 0.002, G + 0.35)],
                            [(CX - 0.1, CY + 0.002, G + 0.06), (CX - 0.005, CY + 0.002, G + 0.06), (CX - 0.005, CY + 0.002, G + 0.35)]], outline=0.008)

turn(before, -20)
render(G)
