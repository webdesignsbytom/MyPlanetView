# A cartoon Hampi for the country maps, built in the set's shared look (../toon.py): the Vittala
# temple's stone chariot on its carved wheels with elephants before it, the pillared hall behind,
# the great rounded granite boulders heaped all over the landscape, banana plants and palms, and the
# Tungabhadra with a round coracle. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hampi.py -- hampi-1024.png 1024 hampi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8a878', shadow_mul=(0.86, 0.8, 0.74), lift=0.2),
    'boulder': toon('boulder', '#b8906a', shadow_mul=(0.86, 0.78, 0.74)),
    'boulderDark': toon('boulderDark', '#9a7656', shadow_mul=(0.86, 0.78, 0.74)),
    'stone': toon('stone', '#a8987e', shadow_mul=(0.84, 0.82, 0.86)),
    'stoneLight': toon('stoneLight', '#c8b89c', shadow_mul=(0.84, 0.82, 0.86)),
    'river': toon('river', '#4a9aa0', lift=0.3),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'coracle': toon('coracle', '#6a4a36'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1613)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('river', M['river'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(30, 151, 4)], G + 0.004, outline=0.008)
lathe('coracle', M['coracle'], ((0.05, 0), (0.06, 0.025)), G, 0.3, 1.05, segs=14, outline=0.005)

# ---------- the boulder heaps ----------
for k, (x, y, r) in enumerate(((-0.95, 0.3, 0.2), (-0.8, 0.55, 0.16), (-0.75, 0.38, 0.12), (0.95, 0.25, 0.18), (0.8, 0.5, 0.14), (1.0, 0.0, 0.12), (-1.0, -0.2, 0.14),
                               (-0.65, 0.7, 0.1), (0.68, 0.72, 0.12), (0.85, -0.45, 0.1))):
    b = ball(f'boulder{k}', M['boulder' if k % 2 else 'boulderDark'], 0, 0, 0, r, outline=0.014)
    b.scale = (1.15, 1.0, 0.9)
    b.location = (x, y, G + r * 0.6)
for k, (x, y, r) in enumerate(((-0.85, 0.35, 0.09), (0.88, 0.32, 0.08), (-0.72, 0.55, 0.07))):
    ball(f'perch{k}', M['boulder'], x, y, G + 0.26 + r * 0.6, r, outline=0.01)

# ---------- the pillared hall behind ----------
HX, HY = 0.0, 0.35
box('hallplinth', M['stoneLight'], HX, HY, G - 0.005, 0.7, 0.36, 0.06, outline=0.01, bevel=0)
for i in range(3):
    for j in range(7):
        rod(f'pillar{i}{j}', M['stone'], (HX - 0.3 + j * 0.1, HY - 0.14 + i * 0.14, G + 0.055), (HX - 0.3 + j * 0.1, HY - 0.14 + i * 0.14, G + 0.2), 0.016, segs=8,
            outline=0.004)
box('hallroof', M['stone'], HX, HY, G + 0.2, 0.72, 0.38, 0.04, outline=0.01, bevel=0)

# ---------- the stone chariot ----------
CX, CY = 0.0, -0.2
box('chariotplinth', M['stoneLight'], CX, CY, G - 0.005, 0.24, 0.24, 0.05, outline=0.008, bevel=0)
box('chariot', M['stone'], CX, CY, G + 0.045, 0.16, 0.16, 0.14, outline=0.01, bevel=0)
for i in range(3):
    w = 0.12 - i * 0.025
    box(f'chariottier{i}', M['stoneLight'], CX, CY, G + 0.185 + i * 0.04, w, w, 0.04, outline=0.005, bevel=0)
lathe('chariottop', M['stone'], ((0.03, 0), (0.004, 0.06)), G + 0.305, CX, CY, segs=8, outline=0.004)
for s in (-1, 1):
    for u in (-0.05, 0.05):
        cyl(f'wheel{s}{u}', M['stoneLight'], 0.045, 0.02, segs=16, outline=0.005,
            matrix=Matrix.Translation((CX + s * 0.09, CY + u, G + 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
for s in (-1, 1):
    x = CX + s * 0.05
    b = ball(f'elephant{s}', M['stone'], 0, 0, 0, 0.035, outline=0.005)
    b.scale = (0.9, 1.4, 1.0)
    b.location = (x, CY - 0.16, G + 0.06)
    ball(f'elephanthead{s}', M['stone'], x, CY - 0.21, G + 0.075, 0.022, outline=0.004)
    rod(f'elephanttrunk{s}', M['stone'], (x, CY - 0.225, G + 0.07), (x, CY - 0.23, G + 0.02), 0.008, segs=6, outline=0.002)

# ---------- palms and banana plants ----------
for k, (x, y) in enumerate(((-0.55, -0.55), (0.55, -0.5), (-0.4, 0.75), (0.45, 0.8))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.3), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b2 = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.3), (x + 0.02 + 0.1 * math.cos(b2), y + 0.1 * math.sin(b2), G + 0.25), 0.019, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
