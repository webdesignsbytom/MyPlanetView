# A cartoon Mount Pelée and the Pitons of Martinique for the country maps, built in the set's shared
# look (../toon.py): the volcano's green slopes rising into its cap of cloud, the stone ruins of old
# Saint-Pierre on the bay below, the new town's bright houses among them, palms, and fishing boats
# on the Caribbean. Turned a little towards the camera.
# Run: blender -b --factory-startup -P mount-pelee.py -- mount-pelee-1024.png 1024 mount-pelee.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'beach': toon('beach', '#5a5450', shadow_mul=(0.84, 0.84, 0.9)),
    'slope': toon('slope', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'upper': toon('upper', '#7a8a5a', shadow_mul=(0.74, 0.8, 0.78)),
    'top': toon('top', '#8a7a6a', shadow_mul=(0.82, 0.8, 0.86)),
    'cloud': toon('cloud', '#f4f6fa', shadow_mul=(0.84, 0.86, 0.94), lift=0.15),
    'stone': toon('stone', '#a8a090', shadow_mul=(0.8, 0.8, 0.88)),
    'h1': toon('h1', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)), 'h2': toon('h2', '#6ab8e0', shadow_mul=(0.74, 0.8, 0.88)),
    'h3': toon('h3', '#f08a8a', shadow_mul=(0.84, 0.74, 0.8)),
    'roof': toon('roof', '#b84a32'),
    'window': flat('window', '#3a3640'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'b1': toon('b1', '#e0453a'), 'b2': toon('b2', '#3f7fc0'),
})

G = tile(M['slope'])
before = set(bpy.data.objects)
rng = random.Random(829)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the bay and its black-sand beach ----------
R = 1.42
flat_face('beach', M['beach'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(194, 347, 6)], G + 0.002, outline=0.008)
flat_face('sea', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(206, 335, 6)], G + 0.005, outline=0.01)

# ---------- Mount Pelée in its cloud ----------
VX, VY = 0.1, 0.55
rings = [ring(VX, VY, 0.85, 0.55, -0.01, 1), ring(VX, VY, 0.55, 0.36, 0.3, 1), ring(VX, VY, 0.3, 0.2, 0.56, 1), ring(VX, VY, 0.12, 0.09, 0.72, 1)]
for name, mat, a, b in (('peleelow', 'slope', 0, 2), ('peleemid', 'upper', 1, 3), ('peleetop', 'top', 2, 4)):
    part = loft(name, M[mat], rings[a:b], outline=0.025, smooth=True)
    part.visible_shadow = False
for k in range(8):
    a = 2 * math.pi * k / 8
    ball(f'cloud{k}', M['cloud'], VX + 0.22 * math.cos(a), VY + 0.14 * math.sin(a), G + 0.66 + 0.03 * math.sin(3 * a), 0.08 + 0.02 * (k % 2), outline=0.01)

# ---------- the ruins of old Saint-Pierre ----------
for k, (x, y, w, d, h) in enumerate(((-0.65, -0.15, 0.3, 0.04, 0.14), (-0.65, 0.0, 0.3, 0.04, 0.09), (-0.8, -0.075, 0.04, 0.19, 0.12), (-0.5, -0.075, 0.04, 0.19, 0.06),
                                     (-0.25, -0.2, 0.18, 0.04, 0.1), (-0.25, -0.08, 0.04, 0.2, 0.08))):
    box(f'ruin{k}', M['stone'], x, y, G - 0.005, w, d, h, outline=0.008, bevel=0)
for k in range(3):
    box(f'ruinarch{k}', M['window'], -0.73 + k * 0.08, -0.172, G + 0.03, 0.03, 0.01, 0.06, outline=0, bevel=0)

# ---------- the new town's bright houses ----------
for k, (x, y, mat) in enumerate(((0.2, -0.2, 'h1'), (0.4, -0.15, 'h2'), (0.6, -0.22, 'h3'), (0.82, -0.1, 'h1'), (0.05, -0.05, 'h3'))):
    box(f'house{k}', M[mat], x, y, G - 0.005, 0.14, 0.11, 0.1, outline=0.01, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.095, 0.16, 0.06, outline=0.006)
    box(f'housedoor{k}', M['window'], x, y - 0.059, G, 0.028, 0.01, 0.05, outline=0, bevel=0)

# ---------- palms and boats ----------
for k, (x, y) in enumerate(((-1.0, -0.2), (-0.1, -0.3), (1.05, -0.25), (-0.4, 0.15))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.013, r2=0.01, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.019, outline=0.005)
for k, (x, y, mat) in enumerate(((-0.3, -0.8, 'b1'), (0.35, -0.9, 'b2'))):
    loft(f'boat{k}', M[mat], [[(x - 0.08, y, G + 0.002), (x + 0.04, y - 0.025, G + 0.002), (x + 0.09, y, G + 0.002), (x + 0.04, y + 0.025, G + 0.002)],
                              [(x - 0.09, y, G + 0.04), (x + 0.04, y - 0.033, G + 0.04), (x + 0.1, y, G + 0.04), (x + 0.04, y + 0.033, G + 0.04)]], outline=0.006)

turn(before, -20)
render(G)
