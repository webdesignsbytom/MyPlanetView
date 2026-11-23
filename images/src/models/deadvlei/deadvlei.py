# A cartoon Deadvlei for the country maps, built in the set's shared look (../toon.py): the white
# clay pan in the Namib, cracked dry, its dead black camel-thorn trees standing twisted where they
# died centuries ago, and the great red-orange dunes round it, Big Daddy towering behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P deadvlei.py -- deadvlei-1024.png 1024 deadvlei.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'dune': toon('dune', '#e0702e', shadow_mul=(0.86, 0.66, 0.6), lift=0.2),
    'duneShade': toon('duneShade', '#c0582a', shadow_mul=(0.86, 0.66, 0.6)),
    'pan': toon('pan', '#f2ebe0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'crack': flat('crack', '#c8bca8'),
    'tree': toon('deadTree', '#2e2622'),
})

G = tile(M['dune'])
before = set(bpy.data.objects)
rng = random.Random(1873)


def ring(cx, cy, rx, ry, z, k, sides=24, a=0.0):
    pts = []
    for j in range(sides):
        t = 2 * math.pi * j / sides
        u = rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k))
        v = ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k))
        pts.append((cx + u * math.cos(a) - v * math.sin(a), cy + u * math.sin(a) + v * math.cos(a), G + z))
    return pts


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the dunes round the pan ----------
for k, (x, y, rx, ry, h, a) in enumerate(((0.0, 0.95, 1.0, 0.4, 0.62, 0.0), (-0.95, 0.15, 0.4, 0.75, 0.42, 0.3), (0.95, 0.2, 0.38, 0.7, 0.38, -0.3), (-0.3, -0.95, 0.8, 0.3, 0.2, 0.0),
                                         (0.65, -0.85, 0.5, 0.28, 0.16, -0.2))):
    d = loft(f'dune{k}', M['dune' if k % 2 == 0 else 'duneShade'], [ring(x, y, rx, ry, -0.01, k, a=a), ring(x, y + 0.02, rx * 0.65, ry * 0.5, h * 0.7, k, a=a),
                                                                    ring(x, y + 0.04, rx * 0.35, ry * 0.12, h, k, a=a)], outline=0.016, smooth=True)
    d.visible_shadow = False

# ---------- the white clay pan and its cracks ----------
flat_face('pan', M['pan'], [(p[0], p[1]) for p in ring(0.0, 0.0, 0.72, 0.5, 0, 3)], G + 0.006, outline=0.006)
for k in range(14):
    x0, y0 = rng.uniform(-0.55, 0.55), rng.uniform(-0.35, 0.35)
    a = rng.uniform(0, math.pi)
    bar(f'crack{k}', M['crack'], (x0, y0, G + 0.009), (x0 + 0.15 * math.cos(a), y0 + 0.15 * math.sin(a), G + 0.009), 0.008, outline=0)


# ---------- the dead camel-thorn trees ----------
def dead_tree(name, x, y, s):
    rod(f'{name}trunk', M['tree'], (x, y, G), (x + 0.01, y, G + 0.12 * s), 0.016 * s, r2=0.011 * s, segs=6, outline=0.004)
    for j in range(5):
        a = 2 * math.pi * j / 5 + rng.uniform(-0.3, 0.3)
        p0 = (x + 0.01, y, G + 0.1 * s)
        p1 = (x + 0.08 * s * math.cos(a), y + 0.08 * s * math.sin(a), G + 0.17 * s + 0.03 * j * s)
        rod(f'{name}branch{j}', M['tree'], p0, p1, 0.009 * s, r2=0.005 * s, segs=5, outline=0.003)
        p2 = (p1[0] + 0.05 * s * math.cos(a + 0.6), p1[1] + 0.05 * s * math.sin(a + 0.6), p1[2] + 0.04 * s)
        rod(f'{name}twig{j}', M['tree'], p1, p2, 0.005 * s, r2=0.003 * s, segs=4, outline=0.002)


for k, (x, y, s) in enumerate(((-0.3, 0.05, 1.6), (0.1, -0.1, 1.4), (0.4, 0.15, 1.5), (-0.05, 0.25, 1.2), (-0.45, -0.25, 1.1), (0.35, -0.3, 1.0))):
    dead_tree(f'tree{k}', x, y, s)

turn(before, -20)
render(G)
