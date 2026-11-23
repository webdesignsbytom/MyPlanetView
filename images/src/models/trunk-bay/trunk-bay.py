# A cartoon Trunk Bay for the country maps, built in the set's shared look (../toon.py): the white
# crescent beach on St John in the US Virgin Islands, the green hills of the national park behind
# it, Trunk Cay in the turquoise bay with the line of floats marking the underwater snorkel trail
# out to it, snorkellers, and palms. Turned a little towards the camera.
# Run: blender -b --factory-startup -P trunk-bay.py -- trunk-bay-1024.png 1024 trunk-bay.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#3ec4cc', shadow_mul=(0.74, 0.84, 0.88), lift=0.35),
    'deep': toon('deep', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'sand': toon('sand', '#fbf5e8', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'hill': toon('hill', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'hillDark': toon('hillDark', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#7a7068', shadow_mul=(0.84, 0.84, 0.9)),
    'float': toon('float', '#f8f6f0', lift=0.2),
    'floatRed': toon('floatRed', '#e8402c'),
    'snorkel': toon('snorkel', '#f39a2a', lift=0.3),
    'skin': toon('skin', '#e0a882'),
    'mask': flat('mask', '#3a4a64'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1213)


def segment(c, r, z, n=24):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def ring(cx, cy, rx, ry, z, k, sides=20):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the deeper water further out ----------
flat_face('deep', M['deep'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(214, 327, 4)], G + 0.004, outline=0.006)

# ---------- the crescent beach and the hills behind it ----------
beach = loft('beach', M['sand'], [segment(0.15, 1.4, -0.01), segment(0.17, 1.39, 0.03)], outline=0.012)
beach.visible_shadow = False
hills = loft('hills', M['hill'], [segment(0.42, 1.36, 0.025), segment(0.6, 1.25, 0.32), segment(0.8, 1.08, 0.42)], outline=0.016, smooth=True)
hills.visible_shadow = False
for f, (c, z) in enumerate(((0.5, 0.16), (0.58, 0.28), (0.7, 0.36))):
    half = math.sqrt(1.3 ** 2 - c ** 2) - 0.12
    n = 10 - 2 * f
    for j in range(n):
        x = -half + (j + 0.5) * 2 * half / n + rng.uniform(-0.03, 0.03)
        ball(f'hilltree{f}_{j}', M['hillDark' if (j + f) % 2 else 'hill'], x, c, G + z + 0.02, rng.uniform(0.065, 0.085), outline=0.011)
for k, (x, y) in enumerate(((-0.95, 0.32), (-0.55, 0.3), (0.5, 0.3), (0.95, 0.32))):
    hgt = rng.uniform(0.28, 0.33)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + 0.03), (x + 0.03, y - 0.02, G + hgt), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y - 0.02, G + hgt), (x + 0.03 + 0.1 * math.cos(b), y - 0.02 + 0.1 * math.sin(b), G + hgt - 0.05), 0.019, outline=0.005)

# ---------- Trunk Cay in the bay ----------
KX, KY = -0.45, -0.48
cay = loft('cay', M['rock'], [ring(KX, KY, 0.36, 0.25, -0.01, 3), ring(KX + 0.02, KY + 0.02, 0.28, 0.2, 0.16, 3), ring(KX + 0.03, KY + 0.03, 0.17, 0.13, 0.22, 3)],
           outline=0.016, smooth=True)
cay.visible_shadow = False
for k, (dx, dy, r) in enumerate(((0.0, 0.04, 0.1), (0.11, 0.0, 0.09), (-0.11, 0.02, 0.085), (0.05, 0.1, 0.08), (-0.05, -0.04, 0.08))):
    ball(f'caybush{k}', M['hillDark'], KX + dx, KY + dy, G + 0.24, r, outline=0.012)

# ---------- the snorkel trail's floats, and snorkellers ----------
for k in range(9):
    f = k / 8
    x, y = -0.05 + (KX + 0.34 - -0.05) * f, 0.1 + (KY + 0.08 - 0.1) * f
    ball(f'float{k}', M['floatRed' if k % 3 == 0 else 'float'], x, y, G + 0.006, 0.022, outline=0.004)
for k, (x, y, a) in enumerate(((0.05, -0.25, 0.4), (0.3, -0.35, -0.3), (-0.05, -0.6, 0.9))):
    c, s = math.cos(a), math.sin(a)
    ball(f'snorkhead{k}', M['skin'], x, y, G + 0.012, 0.026, outline=0.004)
    box(f'snorkmask{k}', M['mask'], x + 0.02 * c, y + 0.02 * s, G + 0.01, 0.03, 0.03, 0.018, rot_z=a, outline=0, bevel=0)
    rod(f'snorkel{k}', M['snorkel'], (x - 0.015 * s, y + 0.015 * c, G + 0.02), (x - 0.015 * s, y + 0.015 * c, G + 0.08), 0.007, segs=6, outline=0.002)
    bar(f'snorkbody{k}', M['skin'], (x - 0.02 * c, y - 0.02 * s, G + 0.002), (x - 0.11 * c, y - 0.11 * s, G + 0.002), 0.035, outline=0.004)

turn(before, -20)
render(G)
