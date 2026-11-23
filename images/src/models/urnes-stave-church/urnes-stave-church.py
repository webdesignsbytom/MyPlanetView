# A cartoon Urnes Stave Church for the country maps, built in the set's shared look (../toon.py): the
# medieval wooden church on its slope above the Lustrafjord, its tarred dark walls and stacked steep
# shingled roofs, the small tower with its spire, dragon heads on the gables, the stone wall of the
# churchyard, and the fjord below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P urnes-stave-church.py -- urnes-stave-church-1024.png 1024 urnes-stave-church.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'fjord': toon('fjord', '#2a6a8a', lift=0.3),
    'tar': toon('tar', '#3a2c26', shadow_mul=(0.84, 0.82, 0.84), lift=0.1),
    'shingle': toon('shingle', '#4a3e36', shadow_mul=(0.84, 0.82, 0.84)),
    'dragon': toon('dragon', '#6a5040'),
    'stone': toon('stone', '#a8a49a', shadow_mul=(0.84, 0.84, 0.9)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'mountain': toon('mountain', '#5a7a58', shadow_mul=(0.74, 0.8, 0.78)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('fjord', M['fjord'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(200, 341, 4)], G + 0.004, outline=0.01)
for k, (x, r, h) in enumerate(((-0.8, 0.4, 0.5), (0.0, 0.45, 0.58), (0.8, 0.38, 0.48))):
    lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.6), (0.004, h)), G - 0.01, x, 1.0, segs=8, outline=0.014)


def gable_roof(name, x, y, z, w, d, h, mat):
    loft(name, M[mat], [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                        [(x - 0.004, y - d / 2, z + h), (x + 0.004, y - d / 2, z + h), (x + 0.004, y + d / 2, z + h), (x - 0.004, y + d / 2, z + h)]], outline=0.008)


# ---------- the church ----------
CX, CY = 0.0, 0.2
box('nave', M['tar'], CX, CY, G - 0.005, 0.26, 0.42, 0.16, outline=0.012, bevel=0)
box('ambulatory', M['tar'], CX, CY, G - 0.005, 0.34, 0.5, 0.07, outline=0.01, bevel=0)
gable_roof('lowroof', CX, CY, G + 0.06, 0.38, 0.54, 0.08, 'shingle')
gable_roof('naveroof', CX, CY, G + 0.155, 0.3, 0.46, 0.22, 'shingle')
box('chancel', M['tar'], CX, CY + 0.32, G - 0.005, 0.18, 0.2, 0.13, outline=0.01, bevel=0)
gable_roof('chancelroof', CX, CY + 0.32, G + 0.125, 0.22, 0.22, 0.14, 'shingle')
box('tower', M['tar'], CX, CY - 0.06, G + 0.3, 0.08, 0.08, 0.08, outline=0.006, bevel=0)
lathe('spire', M['shingle'], ((0.06, 0), (0.004, 0.2)), G + 0.375, CX, CY - 0.06, segs=4, outline=0.006, smooth=False)
for s in (-1, 1):
    bar(f'dragon{s}', M['dragon'], (CX, CY + s * 0.23, G + 0.37), (CX, CY + s * 0.29, G + 0.41), 0.018, outline=0.003)
    ball(f'dragonhead{s}', M['dragon'], CX, CY + s * 0.295, G + 0.415, 0.014, outline=0.002)

# ---------- the churchyard wall, trees ----------
for k in range(16):
    a = 2 * math.pi * k / 16
    x0, y0 = CX + 0.58 * math.cos(a), CY + 0.45 * math.sin(a)
    x1, y1 = CX + 0.58 * math.cos(a + math.pi / 8), CY + 0.45 * math.sin(a + math.pi / 8)
    box(f'wall{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.04, 0.045, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.004, bevel=0)
for k, (x, y) in enumerate(((-0.85, 0.15), (0.85, 0.3), (-0.75, 0.55), (0.7, -0.2))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.08, outline=0.011)

turn(before, -20)
render(G)
