# A cartoon Bikini Atoll for the country maps, built in the set's shared look (../toon.py) on a tile of
# deep Pacific blue: the ring of low coral islets round the turquoise lagoon, white sand and coconut
# palms on each, the line of surf on the outer reef, a green sea turtle swimming in the lagoon, and a
# divers' boat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bikini-atoll.py -- bikini-atoll-1024.png 1024 bikini-atoll.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ocean': toon('ocean', '#1f5fa8', shadow_mul=(0.74, 0.78, 0.9), lift=0.35),
    'lagoon': toon('lagoon', '#3fd0c8', shadow_mul=(0.72, 0.86, 0.88), lift=0.35),
    'reef': toon('reef', '#8fe0d8', shadow_mul=(0.74, 0.86, 0.88), lift=0.35),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'sand': toon('sand', '#f6eed8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'scrub': toon('scrub', '#6aa452', shadow_mul=(0.7, 0.78, 0.8)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'turtle': toon('turtle', '#5a7a4a', shadow_mul=(0.74, 0.8, 0.78)),
    'shell': toon('shell', '#7a6a42', shadow_mul=(0.8, 0.78, 0.76)),
    'boat': toon('boat', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'stripe': flat('stripe', '#e0453a'),
})

G = tile(M['ocean'])
before = set(bpy.data.objects)
rng = random.Random(461)

CX, CY, A, B = 0.0, 0.05, 1.0, 0.78


def ellipse(rx, ry, n=48, start=0.0, end=2 * math.pi):
    return [(CX + rx * math.cos(start + (end - start) * k / n), CY + ry * math.sin(start + (end - start) * k / n)) for k in range(n + 1)]


def flat_face(name, mat, pts, z):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=0)


# ---------- the reef flat, the lagoon inside it, the surf outside ----------
flat_face('reef', M['reef'], ellipse(A + 0.12, B + 0.12)[:-1], G + 0.003)
flat_face('lagoon', M['lagoon'], ellipse(A - 0.1, B - 0.1)[:-1], G + 0.006)
surf = ellipse(A + 0.13, B + 0.13)
for k, ((x0, y0), (x1, y1)) in enumerate(zip(surf, surf[1:])):
    if k % 6 != 5:
        bar(f'surf{k}', M['surf'], (x0, y0, G + 0.01), (x1, y1, G + 0.01), 0.02, outline=0.003)

# ---------- the islets round the ring, with palms ----------
ISLETS = [(0.0, 0.9), (1.05, 1.55), (1.75, 2.35), (2.55, 3.05), (3.3, 3.95), (4.2, 4.6), (4.9, 5.7)]
for k, (a0, a1) in enumerate(ISLETS):
    outer = ellipse(A + 0.04, B + 0.04, n=12, start=a0, end=a1)
    inner = list(reversed(ellipse(A - 0.06, B - 0.06, n=12, start=a0, end=a1)))
    pts = outer + inner
    loft(f'islet{k}', M['sand'], [[(x, y, G - 0.005) for x, y in pts], [(x, y, G + 0.035) for x, y in pts]], outline=0.014)
    for j in range(int((a1 - a0) / 0.18)):
        t = a0 + (j + 0.5) * 0.18
        x, y = CX + A * 0.99 * math.cos(t), CY + B * 0.99 * math.sin(t)
        if j % 2:
            s = ball(f'scrub{k}{j}', M['scrub'], 0, 0, 0, 0.045, outline=0.008)
            s.scale = (1.2, 1.2, 0.7)
            s.location = (x, y, G + 0.05)
            continue
        h = rng.uniform(0.18, 0.24)
        lean = rng.uniform(-0.03, 0.03)
        rod(f'palmtrunk{k}{j}', M['trunk'], (x, y, G + 0.03), (x + lean, y, G + 0.03 + h), 0.012, r2=0.009, segs=6, outline=0.005)
        for f in range(6):
            b = 2 * math.pi * f / 6 + j
            bar(f'frond{k}{j}{f}', M['palm'], (x + lean, y, G + 0.03 + h), (x + lean + 0.08 * math.cos(b), y + 0.08 * math.sin(b), G + h - 0.01), 0.018, outline=0.005)

# ---------- a green sea turtle in the lagoon ----------
TX, TY = -0.15, 0.0
shell = ball('turtleshell', M['shell'], 0, 0, 0, 0.09, outline=0.012)
shell.scale = (1.2, 1.0, 0.35)
shell.location = (TX, TY, G + 0.02)
ball('turtlehead', M['turtle'], TX + 0.13, TY, G + 0.02, 0.035, outline=0.006)
for sx in (-1, 1):
    for sy in (-1, 1):
        f = ball(f'flipper{sx}{sy}', M['turtle'], 0, 0, 0, 0.04, outline=0.006)
        f.scale = (1.4 if sx > 0 else 1.0, 0.5, 0.2)
        f.rotation_euler = (0, 0, sy * (0.6 if sx > 0 else 2.4))
        f.location = (TX + sx * 0.07, TY + sy * 0.09, G + 0.012)

# ---------- a divers' boat ----------
BX, BY = 0.4, -0.3
loft('boat', M['boat'], [[(BX - 0.13, BY, G - 0.002), (BX + 0.08, BY - 0.035, G - 0.002), (BX + 0.14, BY, G - 0.002), (BX + 0.08, BY + 0.035, G - 0.002)],
                         [(BX - 0.14, BY, G + 0.04), (BX + 0.08, BY - 0.05, G + 0.04), (BX + 0.17, BY, G + 0.04), (BX + 0.08, BY + 0.05, G + 0.04)]], outline=0.01)
box('boatstripe', M['stripe'], BX, BY - 0.048, G + 0.025, 0.2, 0.006, 0.01, outline=0, bevel=0)
box('boatflag', M['stripe'], BX - 0.08, BY, G + 0.14, 0.05, 0.006, 0.035, outline=0, bevel=0)
rod('boatflagpole', M['boat'], (BX - 0.1, BY, G + 0.04), (BX - 0.1, BY, G + 0.18), 0.004, segs=6, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
