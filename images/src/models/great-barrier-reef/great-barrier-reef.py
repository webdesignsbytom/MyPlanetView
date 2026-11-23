# A cartoon Great Barrier Reef for the country maps, built in the set's shared look (../toon.py): a
# coral cay of white sand and green pisonia trees in the turquoise water of the reef, colourful
# corals in the shallows, Heart Reef, a green sea turtle, and a dive boat on the deep blue Coral Sea.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P great-barrier-reef.py -- great-barrier-reef-1024.png 1024 great-barrier-reef.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'deep': toon('deep', '#2a6ab0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'reef': toon('reef', '#4ccad0', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'sand': toon('sand', '#fbf5e8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'heart': toon('heart', '#8ad8b8', shadow_mul=(0.76, 0.86, 0.84), lift=0.3),
    'c0': toon('c0', '#f07a9a'), 'c1': toon('c1', '#f0a040'), 'c2': toon('c2', '#a86ad0'), 'c3': toon('c3', '#f0d850'), 'c4': toon('c4', '#e8504a'),
    'shell': toon('shell', '#7a6a3a', shadow_mul=(0.84, 0.8, 0.74)),
    'scute': toon('scute', '#a8944a'),
    'turtle': toon('turtle', '#8aa860', shadow_mul=(0.78, 0.82, 0.74)),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'stripe': toon('stripe', '#e8402c'),
    'cabin': toon('cabin', '#c8ccd2', shadow_mul=(0.8, 0.8, 0.88)),
    'eye': flat('eye', '#2e2a30'),
})

G = tile(M['deep'])
before = set(bpy.data.objects)
rng = random.Random(1279)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def ring(cx, cy, rx, ry, z, k, sides=26):
    return [(cx + rx * math.cos(t) * (1 + 0.07 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.07 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the reef: turquoise shallows round the cay ----------
flat_face('reef', M['reef'], [(p[0], p[1]) for p in ring(-0.05, 0.3, 1.05, 0.75, 0, 1)], G + 0.004, outline=0.006)

# ---------- the coral cay ----------
cay = loft('cay', M['sand'], [ring(-0.05, 0.45, 0.55, 0.32, -0.01, 2), ring(-0.05, 0.46, 0.5, 0.29, 0.04, 2)], outline=0.012, smooth=True)
cay.visible_shadow = False
for k in range(9):
    a = 2 * math.pi * k / 9
    ball(f'pisonia{k}', M['tree'], -0.05 + 0.28 * math.cos(a), 0.5 + 0.14 * math.sin(a), G + 0.1, rng.uniform(0.07, 0.09), outline=0.012)
ball('pisoniamiddle', M['tree'], -0.05, 0.5, G + 0.14, 0.1, outline=0.012)

# ---------- corals in the shallows ----------
for k in range(22):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.62, 0.95)
    x, y = -0.05 + r * 1.0 * math.cos(a), 0.3 + r * 0.7 * math.sin(a)
    if math.hypot(x, y) > 1.25:
        continue
    kind = k % 3
    mat = M[f'c{k % 5}']
    if kind == 0:
        squashed(f'brain{k}', mat, x, y, G + 0.01, 0.045, 1.2, 1.0, 0.6, outline=0.006)
    elif kind == 1:
        for j in range(4):
            b = 2 * math.pi * j / 4 + k
            rod(f'branch{k}{j}', mat, (x, y, G), (x + 0.03 * math.cos(b), y + 0.03 * math.sin(b), G + 0.06), 0.009, segs=6, outline=0.002)
    else:
        cyl(f'plate{k}', mat, 0.05, 0.012, segs=12, outline=0.004, matrix=Matrix.Translation((x, y, G + 0.02)))

# ---------- Heart Reef ----------
HX, HY, HS = 0.65, -0.35, 0.16
heart = []
for j in range(28):
    t = 2 * math.pi * j / 28
    heart.append((HX + HS * 0.06 * 16 * math.sin(t) ** 3, HY + HS * 0.06 * (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))))
flat_face('heartreef', M['heart'], heart, G + 0.008, outline=0.006)

# ---------- a green sea turtle ----------
TX, TY, TA, K = -0.6, -0.45, 0.6, 1.5
c, s = math.cos(TA), math.sin(TA)
for k, (u, v, a) in enumerate(((0.06, 0.09, 0.9), (0.06, -0.09, -0.9), (-0.08, 0.06, 2.4), (-0.08, -0.06, -2.4))):
    px, py = TX + (u * c - v * s) * K, TY + (u * s + v * c) * K
    L = (0.1 if k < 2 else 0.05) * K
    bar(f'flipper{k}', M['turtle'], (px, py, G + 0.012), (px + L * math.cos(TA + a), py + L * math.sin(TA + a), G + 0.008), (0.035 if k < 2 else 0.025) * K, outline=0.005)
sh = squashed('shell', M['shell'], TX, TY, G + 0.02, 0.11 * K, 1.3, 1.0, 0.4, outline=0.014)
sh.rotation_euler = (0, 0, TA)
for k, (u, v) in enumerate(((0.0, 0.0), (0.06, 0.0), (-0.06, 0.0), (0.0, 0.05), (0.0, -0.05))):
    squashed(f'scute{k}', M['scute'], TX + (u * c - v * s) * K, TY + (u * s + v * c) * K, G + 0.02 + 0.035 * K, 0.025 * K, 1.2, 1.0, 0.35, outline=0.003)
hx, hy = TX + 0.17 * K * c, TY + 0.17 * K * s
squashed('turtlehead', M['turtle'], hx, hy, G + 0.03, 0.035 * K, 1.3, 1.0, 0.8, outline=0.006)

# ---------- a dive boat on the deep water ----------
BX, BY = 0.2, -0.95
loft('hull', M['hull'], [[(BX - 0.2, BY, G - 0.002), (BX + 0.12, BY - 0.06, G - 0.002), (BX + 0.22, BY, G - 0.002), (BX + 0.12, BY + 0.06, G - 0.002)],
                         [(BX - 0.22, BY, G + 0.07), (BX + 0.12, BY - 0.08, G + 0.07), (BX + 0.3, BY, G + 0.08), (BX + 0.12, BY + 0.08, G + 0.07)]], outline=0.008)
box('stripe', M['stripe'], BX + 0.02, BY - 0.07, G + 0.03, 0.3, 0.008, 0.014, outline=0, bevel=0)
box('wheelhouse', M['cabin'], BX - 0.02, BY, G + 0.07, 0.14, 0.1, 0.07, outline=0.006, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
