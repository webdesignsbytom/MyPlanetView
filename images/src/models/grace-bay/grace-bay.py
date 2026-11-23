# A cartoon Grace Bay for the country maps, built in the set's shared look (../toon.py): the long
# white beach of Providenciales in the Turks and Caicos, its clear turquoise water over the reef, a
# big queen conch shell on the sand, palms, beach umbrellas and loungers, the low resorts behind, and
# a sailboat. Turned a little towards the camera.
# Run: blender -b --factory-startup -P grace-bay.py -- grace-bay-1024.png 1024 grace-bay.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#4ccad0', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'deep': toon('deep', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'sand': toon('sand', '#fbf5e8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'surf': toon('surf', '#ffffff', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'conch': toon('conch', '#f2d2b0', shadow_mul=(0.86, 0.76, 0.74), lift=0.25),
    'conchLip': toon('conchLip', '#f08a8a', shadow_mul=(0.86, 0.74, 0.78), lift=0.3),
    'conchDark': toon('conchDark', '#d8a880', shadow_mul=(0.86, 0.76, 0.74)),
    'resort': toon('resort', '#f8f2e6', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#e8d4b0'),
    'window': flat('window', '#5a7a9a'),
    'u0': toon('u0', '#2f8ac0'), 'u1': toon('u1', '#f8f6f0', lift=0.2), 'u2': toon('u2', '#f0c030'),
    'pole': toon('pole', '#f8f6f0', lift=0.2),
    'lounger': toon('lounger', '#f8f6f0', lift=0.2),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'mast': toon('mast', '#b7bcc4'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(1187)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the turquoise water at the front, a darker reef line far out ----------
flat_face('sea', M['sea'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(184, 357, 4)], G + 0.004, outline=0.01)
flat_face('deep', M['deep'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(222, 319, 4)], G + 0.006, outline=0.006)
for k in range(14):
    ball(f'surf{k}', M['surf'], -1.3 + k * 0.2, -0.12 + 0.02 * math.sin(k * 1.9), G + 0.005, rng.uniform(0.022, 0.03), outline=0.003)

# ---------- the queen conch on the sand ----------
CX, CY, CZ, K = -0.12, 0.1, G, 1.4
cs = squashed('conchbody', M['conch'], CX, CY, CZ + 0.1 * K, 0.15 * K, 1.25, 0.9, 0.75, outline=0.016)
cs.rotation_euler = (0, 0.35, 0.3)
SX, SY = CX + 0.12 * K, CY + 0.06 * K
lathe('conchspire', M['conch'], tuple((r * K, h * K) for r, h in ((0.11, 0), (0.08, 0.05), (0.05, 0.1), (0.025, 0.15), (0.004, 0.19))), CZ + 0.13 * K, SX, SY, segs=16,
      outline=0.012)
for k in range(3):
    lathe(f'conchwhorl{k}', M['conchDark'], (((0.105 - k * 0.028) * K, 0), ((0.1 - k * 0.028) * K, 0.012 * K)), CZ + (0.15 + k * 0.045) * K, SX, SY, segs=16, outline=0.002)
for k in range(7):
    a = 2 * math.pi * k / 7
    lathe(f'conchknob{k}', M['conch'], ((0.022 * K, 0), (0.004, 0.06 * K)), CZ + 0.16 * K, SX + 0.1 * K * math.cos(a), SY + 0.08 * K * math.sin(a), segs=8, outline=0.004)
lip = squashed('conchlip', M['conchLip'], CX - 0.06 * K, CY - 0.1 * K, CZ + 0.1 * K, 0.12 * K, 1.35, 0.4, 0.9, outline=0.014)
lip.rotation_euler = (0.2, 0, 0.3)

# ---------- loungers, umbrellas and palms ----------
for k, (x, y) in enumerate(((0.35, 0.05), (0.65, 0.12), (0.95, 0.2), (-0.65, 0.05), (-0.95, 0.15))):
    rod(f'umbrellapole{k}', M['pole'], (x, y + 0.08, G), (x, y + 0.08, G + 0.17), 0.005, segs=5, outline=0.002)
    lathe(f'umbrella{k}', M[f'u{k % 3}'], ((0.1, 0), (0.065, 0.028), (0.004, 0.045)), G + 0.15, x, y + 0.08, segs=12, outline=0.005)
    box(f'lounger{k}', M['lounger'], x, y - 0.02, G + 0.02, 0.06, 0.15, 0.012, outline=0.003, bevel=0)
    box(f'loungerback{k}', M['lounger'], x, y + 0.06, G + 0.02, 0.06, 0.012, 0.05, outline=0.003, bevel=0)
for k, (x, y) in enumerate(((-0.4, 0.55), (0.2, 0.6), (0.8, 0.55), (-1.0, 0.5), (0.5, 0.9))):
    hgt = rng.uniform(0.3, 0.36)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.04, y - 0.02, G + hgt), 0.014, r2=0.01, segs=8, outline=0.005)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.04, y - 0.02, G + hgt), (x + 0.04 + 0.11 * math.cos(b), y - 0.02 + 0.11 * math.sin(b), G + hgt - 0.055), 0.02, outline=0.005)

# ---------- the low resorts behind ----------
for k, (x, y, w, a) in enumerate(((-0.6, 0.95, 0.42, 0.25), (0.05, 1.12, 0.4, 0.0), (0.72, 0.92, 0.38, -0.3))):
    box(f'resort{k}', M['resort'], x, y, G - 0.005, w, 0.16, 0.14, rot_z=a, outline=0.01, bevel=0)
    box(f'resortroof{k}', M['roof'], x, y, G + 0.135, w + 0.03, 0.19, 0.02, rot_z=a, outline=0.005, bevel=0)
    for row in range(2):
        for j in range(5):
            u = -w / 2 + (j + 0.5) * w / 5
            box(f'resortwin{k}{row}{j}', M['window'], x + u * math.cos(a) + 0.081 * math.sin(a), y + u * math.sin(a) - 0.081 * math.cos(a), G + 0.025 + row * 0.06,
                0.04, 0.006, 0.03, rot_z=a, outline=0, bevel=0)

# ---------- a sailboat ----------
BX, BY = 0.45, -0.75
loft('boathull', M['hull'], [[(BX - 0.1, BY, G - 0.002), (BX + 0.06, BY - 0.028, G - 0.002), (BX + 0.12, BY, G - 0.002), (BX + 0.06, BY + 0.028, G - 0.002)],
                             [(BX - 0.11, BY, G + 0.035), (BX + 0.06, BY - 0.036, G + 0.035), (BX + 0.14, BY, G + 0.035), (BX + 0.06, BY + 0.036, G + 0.035)]], outline=0.007)
rod('boatmast', M['mast'], (BX, BY, G + 0.035), (BX, BY, G + 0.34), 0.005, segs=6, outline=0)
loft('boatsail', M['hull'], [[(BX + 0.005, BY - 0.004, G + 0.06), (BX + 0.005, BY + 0.004, G + 0.06), (BX - 0.13, BY + 0.004, G + 0.06)],
                             [(BX + 0.005, BY - 0.004, G + 0.32), (BX + 0.005, BY + 0.004, G + 0.32), (BX - 0.005, BY + 0.004, G + 0.32)]], outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
