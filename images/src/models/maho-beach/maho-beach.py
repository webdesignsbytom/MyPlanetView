# A cartoon Maho Beach for the country maps, built in the set's shared look (../toon.py): the beach
# at the end of Princess Juliana Airport's runway on Sint Maarten, an airliner coming in to land low
# over it with its wheels down, the bathers on the sand looking up, the fence, the road and the
# runway beyond, the beach bar's surfboard sign, and the sea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P maho-beach.py -- maho-beach-1024.png 1024 maho-beach.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'surf': toon('surf', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'sand': toon('sand', '#f2e6c8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'tarmac': toon('tarmac', '#5a5e66', shadow_mul=(0.82, 0.82, 0.9), lift=0.15),
    'paint': toon('paint', '#f8f6f0', lift=0.2),
    'fence': toon('fence', '#9a9ea6'),
    'plane': toon('plane', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'tail': toon('tail', '#2a5aa8'),
    'engine': toon('engine', '#a8acb4', shadow_mul=(0.8, 0.8, 0.88)),
    'tyre': toon('tyre', '#2e2a30'),
    'window': flat('window', '#3a4a64'),
    'skin': toon('skin', '#e0a882'), 'skin2': toon('skin2', '#9a6a4a'),
    's0': toon('s0', '#e8402c'), 's1': toon('s1', '#f0c030'), 's2': toon('s2', '#3f9a4a'),
    'u0': toon('u0', '#e8402c'), 'u1': toon('u1', '#2f8ac0'),
    'pole': toon('pole', '#f8f6f0', lift=0.2),
    'board': toon('board', '#f0a030'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'grass': toon('grass2', '#8ac060', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1181)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the sea, the beach, the road and the runway, front to back ----------
flat_face('beach', M['sand'], [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in range(176, 365, 4)], G + 0.003, outline=0.008)
flat_face('sea', M['sea'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(196, 345, 4)], G + 0.006, outline=0.01)
for k in range(13):
    ball(f'surf{k}', M['surf'], -1.15 + k * 0.19, -0.4 + 0.02 * math.sin(k * 2.1), G + 0.006, rng.uniform(0.022, 0.03), outline=0.003)
box('road', M['tarmac'], 0.0, 0.18, G - 0.002, 2.8, 0.12, 0.008, outline=0.004, bevel=0)
RA = math.radians(70)
rc, rs = math.cos(RA), math.sin(RA)
box('runway', M['tarmac'], 0.25 + 0.5 * rc, 0.32 + 0.5 * rs, G - 0.002, 1.0, 0.36, 0.01, rot_z=RA, outline=0.006, bevel=0)
for k in range(5):
    d = 0.12 + k * 0.17
    box(f'centreline{k}', M['paint'], 0.25 + d * rc, 0.32 + d * rs, G + 0.008, 0.09, 0.018, 0.004, rot_z=RA, outline=0, bevel=0)
for k in range(6):
    d = (k - 2.5) * 0.05
    box(f'threshold{k}', M['paint'], 0.25 + 0.05 * rc - d * rs, 0.32 + 0.05 * rs + d * rc, G + 0.008, 0.06, 0.02, 0.004, rot_z=RA + math.pi / 2, outline=0, bevel=0)
for k in range(15):
    x = -1.3 + k * 0.186
    if math.hypot(x, 0.1) > 1.33:
        continue
    rod(f'fencepost{k}', M['fence'], (x, 0.1, G), (x, 0.1, G + 0.09), 0.005, segs=5, outline=0.002)
bar('fencetop', M['fence'], (-1.29, 0.1, G + 0.09), (1.29, 0.1, G + 0.09), 0.008, outline=0.002)

# ---------- the airliner, low, wheels down ----------
H = math.radians(62)
D = Vector((math.cos(H), math.sin(H), 0.0))
S = Vector((math.sin(H), -math.cos(H), 0.0))
U = Vector((0.0, 0.0, 1.0))
K = 1.3
P = Vector((-0.12, -0.32, G + 0.46)) - D * 0.25 * K


def at(u, v, w):
    return P + (D * u + S * v + U * w) * K


def tube(name, mat, stations, v=0.0, w=0.0, sides=14, outline=0.01):
    rings = []
    for u, r, dz in stations:
        rings.append([tuple(at(u, v + r * math.cos(2 * math.pi * j / sides), w + dz + r * math.sin(2 * math.pi * j / sides))) for j in range(sides)])
    return loft(name, mat, rings, outline=outline, smooth=True)


def slab(name, mat, pts, w, t=0.012, outline=0.006):
    return loft(name, mat, [[tuple(at(u, v, w)) for u, v in pts], [tuple(at(u, v, w + t)) for u, v in pts]], outline=outline)


tube('fuselage', M['plane'], ((-0.42, 0.012, 0.03), (-0.36, 0.04, 0.02), (-0.25, 0.062, 0.0), (0.3, 0.062, 0.0), (0.4, 0.05, -0.008), (0.45, 0.028, -0.014),
                              (0.47, 0.006, -0.018)))
for side in (-1, 1):
    slab(f'wing{side}', M['plane'], [(0.08, 0.0), (0.18, 0.0), (-0.02, side * 0.44), (-0.08, side * 0.44)] if side > 0 else
         [(0.08, 0.0), (-0.08, side * 0.44), (-0.02, side * 0.44), (0.18, 0.0)], -0.03)
    slab(f'tailplane{side}', M['plane'], [(-0.3, 0.0), (-0.24, 0.0), (-0.36, side * 0.16), (-0.39, side * 0.16)] if side > 0 else
         [(-0.3, 0.0), (-0.39, side * 0.16), (-0.36, side * 0.16), (-0.24, 0.0)], 0.02, t=0.01)
    tube(f'engine{side}', M['engine'], ((0.02, 0.028, 0.0), (0.06, 0.032, 0.0), (0.16, 0.032, 0.0), (0.18, 0.026, 0.0)), v=side * 0.2, w=-0.065, sides=12, outline=0.006)
    gu, gv = 0.02, side * 0.07
    bar(f'gearleg{side}', M['engine'], tuple(at(gu, gv, -0.03)), tuple(at(gu, gv, -0.1)), 0.012 * K, outline=0.002)
    ball(f'wheel{side}', M['tyre'], *tuple(at(gu, gv, -0.11)), 0.02 * K, outline=0.003)
loft('fin', M['tail'], [[tuple(at(u, -0.006, w)) for u, w in ((-0.38, 0.03), (-0.26, 0.04), (-0.38, 0.2), (-0.42, 0.2))],
                        [tuple(at(u, 0.006, w)) for u, w in ((-0.38, 0.03), (-0.26, 0.04), (-0.38, 0.2), (-0.42, 0.2))]], outline=0.006)
bar('nosegear', M['engine'], tuple(at(0.36, 0.0, -0.05)), tuple(at(0.36, 0.0, -0.11)), 0.01, outline=0.002)
ball('nosewheel', M['tyre'], *tuple(at(0.36, 0.0, -0.12)), 0.016 * K, outline=0.003)
for k in range(12):
    u = -0.2 + k * 0.042
    ball(f'window{k}', M['window'], *tuple(at(u, 0.06, 0.018)), 0.009 * K, outline=0)
bar('stripe', M['tail'], tuple(at(-0.3, 0.058, -0.016)), tuple(at(0.33, 0.058, -0.016)), 0.014 * K, outline=0)

# ---------- bathers, umbrellas, the surfboard sign and palms ----------
for k, (x, y, skin) in enumerate(((-0.55, -0.18, 'skin'), (-0.3, -0.25, 'skin2'), (0.35, -0.2, 'skin'), (0.6, -0.12, 'skin2'))):
    rod(f'bather{k}', M[f's{k % 3}'], (x, y, G), (x, y, G + 0.09), 0.022, r2=0.019, segs=10, outline=0.004)
    ball(f'batherhead{k}', M[skin], x, y, G + 0.115, 0.022, outline=0.004)
    rod(f'batherarm{k}', M[skin], (x + 0.02, y, G + 0.085), (x + 0.05, y + 0.02, G + 0.17), 0.007, segs=5, outline=0.002)
for k, (x, y) in enumerate(((-0.85, -0.05), (0.85, -0.05))):
    rod(f'umbrellapole{k}', M['pole'], (x, y, G), (x, y, G + 0.15), 0.005, segs=5, outline=0.002)
    lathe(f'umbrella{k}', M[f'u{k}'], ((0.09, 0), (0.06, 0.025), (0.004, 0.04)), G + 0.13, x, y, segs=12, outline=0.005)
box('signboard', M['board'], -0.95, 0.35, G + 0.08, 0.05, 0.02, 0.22, rot_z=0.2, outline=0.005, bevel=0)
rod('signpost', M['trunk'], (-0.95, 0.36, G), (-0.95, 0.36, G + 0.09), 0.01, segs=6, outline=0.003)
for k, (x, y) in enumerate(((-0.7, 0.45), (-1.05, 0.65), (-0.45, 0.95))):
    hgt = 0.28
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + hgt), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + hgt), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + hgt - 0.05), 0.019, outline=0.005)

turn(before, -20)
render(G)
