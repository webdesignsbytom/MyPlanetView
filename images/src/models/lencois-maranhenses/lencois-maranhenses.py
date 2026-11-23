# A cartoon Lençóis Maranhenses for the country maps, built in the set's shared look (../toon.py):
# the white dunes of the Maranhão coast, ridge after ridge of sand with rainwater lagoons in blue
# and green between them, hikers crossing, and a four-by-four on the sand.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P lencois-maranhenses.py -- lencois-maranhenses-1024.png 1024 lencois-maranhenses.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#ecdcb8', shadow_mul=(0.86, 0.82, 0.86), lift=0.2),
    'dune': toon('dune', '#fdfbf6', shadow_mul=(0.78, 0.8, 0.92), lift=0.1),
    'lagoon': toon('lagoon', '#3ab0d8', shadow_mul=(0.74, 0.84, 0.9), lift=0.35),
    'lagoonGreen': toon('lagoonGreen', '#3ec4a8', shadow_mul=(0.74, 0.84, 0.86), lift=0.35),
    's0': toon('s0', '#e8402c'), 's1': toon('s1', '#f0c030'), 's2': toon('s2', '#2f6fc0'),
    'skin': toon('skin', '#c08a64'),
    'jeep': toon('jeep', '#4a7a4a'),
    'tyre': toon('tyre', '#2e2a30'),
    'window': flat('window', '#3a4a64'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(1303)


def ring(cx, cy, rx, ry, z, k, sides=26, a=0.0):
    pts = []
    for j in range(sides):
        t = 2 * math.pi * j / sides
        u = rx * math.cos(t) * (1 + 0.08 * math.sin(3 * t + k))
        v = ry * math.sin(t) * (1 + 0.08 * math.cos(2 * t + k))
        pts.append((cx + u * math.cos(a) - v * math.sin(a), cy + u * math.sin(a) + v * math.cos(a), G + z))
    return pts


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the lagoons, in the hollows ----------
for k, (x, y, rx, ry, a, mat) in enumerate(((-0.55, -0.35, 0.36, 0.16, 0.2, 'lagoon'), (0.3, -0.15, 0.4, 0.15, -0.15, 'lagoonGreen'), (-0.2, 0.25, 0.32, 0.13, 0.1, 'lagoon'),
                                            (0.6, 0.45, 0.3, 0.12, -0.25, 'lagoon'), (-0.75, 0.55, 0.25, 0.11, 0.3, 'lagoonGreen'), (0.25, -0.75, 0.3, 0.12, 0.05, 'lagoon'))):
    flat_face(f'lagoon{k}', M[mat], [(p[0], p[1]) for p in ring(x, y, rx * 1.1, ry * 1.35, 0, k, a=a)], G + 0.004, outline=0.008)

# ---------- the dunes: long ridges between them ----------
for k, (x, y, rx, ry, h, a) in enumerate(((-0.1, -0.55, 0.55, 0.14, 0.12, 0.15), (0.65, -0.45, 0.35, 0.13, 0.1, -0.2), (0.05, 0.02, 0.62, 0.15, 0.14, -0.05),
                                         (-0.85, -0.05, 0.3, 0.14, 0.1, 0.3), (0.3, 0.7, 0.5, 0.14, 0.15, -0.15), (-0.5, 0.88, 0.35, 0.12, 0.12, 0.2),
                                         (0.95, 0.1, 0.25, 0.13, 0.1, -0.5))):
    h *= 1.9
    d = loft(f'dune{k}', M['dune'], [ring(x, y, rx, ry, -0.01, k + 3, a=a), ring(x, y + 0.02, rx * 0.72, ry * 0.55, h * 0.6, k + 3, a=a),
                                     ring(x, y + 0.035, rx * 0.5, ry * 0.2, h * 0.92, k + 3, a=a), ring(x, y + 0.04, rx * 0.4, ry * 0.05, h, k + 3, a=a)], outline=0.014, smooth=True)
    d.visible_shadow = False

# ---------- hikers crossing ----------
for k, (x, y) in enumerate(((-0.35, -0.12), (-0.27, -0.14), (-0.19, -0.13))):
    rod(f'hiker{k}', M[f's{k}'], (x, y, G), (x, y, G + 0.08), 0.016, segs=8, outline=0.003)
    ball(f'hikerhead{k}', M['skin'], x, y, G + 0.098, 0.016, outline=0.003)

# ---------- a four-by-four on the sand ----------
JX, JY, JA = 0.75, -0.9, 0.35
c, s = math.cos(JA), math.sin(JA)
box('jeep', M['jeep'], JX, JY, G + 0.03, 0.2, 0.1, 0.07, rot_z=JA, outline=0.008, bevel=0)
box('jeepcab', M['jeep'], JX - 0.03 * c, JY - 0.03 * s, G + 0.1, 0.11, 0.09, 0.05, rot_z=JA, outline=0.006, bevel=0)
box('jeepglass', M['window'], JX + 0.025 * c, JY + 0.025 * s, G + 0.105, 0.006, 0.08, 0.035, rot_z=JA, outline=0, bevel=0)
for u in (-0.065, 0.065):
    for v in (-0.055, 0.055):
        cyl(f'wheel{u}{v}', M['tyre'], 0.03, 0.022, segs=14, outline=0.003,
            matrix=Matrix.Translation((JX + u * c - v * s, JY + u * s + v * c, G + 0.03)) @ Matrix.Rotation(JA, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))

turn(before, -20)
render(G)
