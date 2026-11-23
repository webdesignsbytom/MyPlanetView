# A cartoon Stingray City for the country maps, built in the set's shared look (../toon.py): the
# sandbar in Grand Cayman's North Sound, its shallow turquoise water over white sand, southern
# stingrays gliding round the people standing waist-deep among them, and the boats that bring them
# out, one a catamaran. Turned a little towards the camera.
# Run: blender -b --factory-startup -P stingray-city.py -- stingray-city-1024.png 1024 stingray-city.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'shallow': toon('shallow', '#8ee0d8', shadow_mul=(0.76, 0.86, 0.88), lift=0.35),
    'ray': toon('ray', '#8a8478', shadow_mul=(0.82, 0.82, 0.88)),
    'rayDark': toon('rayDark', '#6a645a'),
    'eye': flat('eye', '#2e2a30'),
    'skin': toon('skin', '#e0a882'), 'skin2': toon('skin2', '#9a6a4a'),
    's0': toon('s0', '#e8402c'), 's1': toon('s1', '#2f6fc0'), 's2': toon('s2', '#f0c030'), 's3': toon('s3', '#3f9a4a'),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'canopy': toon('canopy', '#2f8ac0'),
    'mast': toon('mast', '#b7bcc4'),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1151)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the sandbar: shallow, pale water ----------
flat_face('sandbar', M['shallow'], [(-0.05 + 0.95 * math.cos(t) * (1 + 0.05 * math.sin(3 * t)), 0.0 + 0.62 * math.sin(t)) for t in (2 * math.pi * j / 28 for j in range(28))],
          G + 0.004, outline=0.006)


# ---------- the stingrays ----------
def stingray(name, x, y, a, s=1.0, z=G + 0.006):
    c, sn = math.cos(a), math.sin(a)

    def p(u, v, h):
        return (x + (u * c - v * sn) * s, y + (u * sn + v * c) * s, z + h)

    outline = [(0.11, 0.0), (0.04, 0.1), (-0.02, 0.15), (-0.07, 0.1), (-0.1, 0.0), (-0.07, -0.1), (-0.02, -0.15), (0.04, -0.1)]
    loft(f'{name}', M['ray'], [[p(u, v, 0.0) for u, v in outline], [p(u * 0.7, v * 0.6, 0.02 * s) for u, v in outline], [p(u * 0.3, v * 0.25, 0.03 * s) for u, v in outline]],
         outline=0.007, smooth=True)
    bar(f'{name}tail', M['rayDark'], p(-0.09, 0.0, 0.004), p(-0.24, 0.0, 0.004), 0.012 * s, outline=0.002)
    for side in (-1, 1):
        ball(f'{name}eye{side}', M['eye'], *p(0.05, side * 0.025, 0.02 * s), 0.008 * s, outline=0)


for k, (x, y, a) in enumerate(((-0.55, -0.15, 0.4), (-0.15, -0.35, -0.3), (0.3, -0.25, 2.5), (0.15, 0.25, 1.2), (-0.45, 0.25, -2.4), (0.6, 0.1, -1.7))):
    stingray(f'ray{k}', x, y, a, s=rng.uniform(1.15, 1.35))

# ---------- people standing waist-deep among them ----------
for k, (x, y, skin) in enumerate(((-0.2, 0.0, 'skin'), (0.05, -0.05, 'skin2'), (0.42, 0.32, 'skin'), (-0.3, 0.45, 'skin2'))):
    rod(f'person{k}', M[f's{k}'], (x, y, G), (x, y, G + 0.1), 0.028, r2=0.024, segs=10, outline=0.005)
    ball(f'personhead{k}', M[skin], x, y, G + 0.13, 0.027, outline=0.005)
    for side in (-1, 1):
        rod(f'personarm{k}{side}', M[skin], (x + side * 0.03, y, G + 0.09), (x + side * 0.06, y - 0.02, G + 0.03), 0.009, segs=5, outline=0.002)
    for j in range(5):
        b = 2 * math.pi * j / 5
        ball(f'personfoam{k}{j}', M['foam'], x + 0.045 * math.cos(b), y + 0.035 * math.sin(b), G + 0.004, 0.014, outline=0.002)

# ---------- the boats: a catamaran and a dive boat ----------
CX, CY = 0.55, 0.75
for s in (-1, 1):
    loft(f'cathull{s}', M['hull'], [[(CX - 0.2, CY + s * 0.08, G - 0.002), (CX + 0.2, CY + s * 0.08, G - 0.002), (CX + 0.22, CY + s * 0.1, G - 0.002), (CX - 0.2, CY + s * 0.1, G - 0.002)],
                                    [(CX - 0.22, CY + s * 0.065, G + 0.05), (CX + 0.24, CY + s * 0.075, G + 0.05), (CX + 0.27, CY + s * 0.1, G + 0.05),
                                     (CX - 0.22, CY + s * 0.115, G + 0.05)]], outline=0.007)
box('catdeck', M['hull'], CX, CY + 0.01, G + 0.05, 0.4, 0.22, 0.02, outline=0.006, bevel=0)
rod('catmast', M['mast'], (CX, CY + 0.01, G + 0.07), (CX, CY + 0.01, G + 0.5), 0.007, segs=6, outline=0.002)
loft('catsail', M['hull'], [[(CX - 0.005, CY + 0.005, G + 0.09), (CX + 0.005, CY + 0.005, G + 0.09), (CX - 0.18, CY + 0.015, G + 0.09)],
                            [(CX - 0.005, CY + 0.005, G + 0.48), (CX + 0.005, CY + 0.005, G + 0.48), (CX - 0.01, CY + 0.015, G + 0.48)]], outline=0.005)
DX, DY = -0.8, 0.55
loft('divehull', M['hull'], [[(DX - 0.16, DY, G - 0.002), (DX + 0.1, DY - 0.05, G - 0.002), (DX + 0.18, DY, G - 0.002), (DX + 0.1, DY + 0.05, G - 0.002)],
                             [(DX - 0.18, DY, G + 0.06), (DX + 0.1, DY - 0.07, G + 0.06), (DX + 0.24, DY, G + 0.07), (DX + 0.1, DY + 0.07, G + 0.06)]], outline=0.008)
for sx in (-1, 1):
    for sy in (-1, 1):
        rod(f'canopypost{sx}{sy}', M['mast'], (DX + sx * 0.07, DY + sy * 0.04, G + 0.06), (DX + sx * 0.07, DY + sy * 0.04, G + 0.15), 0.004, segs=5, outline=0)
box('canopy', M['canopy'], DX, DY, G + 0.15, 0.18, 0.11, 0.012, outline=0.005, bevel=0)

turn(before, -20)
render(G)
