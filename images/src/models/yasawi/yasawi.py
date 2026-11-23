# A cartoon Mausoleum of Khoja Ahmed Yasawi (Turkistan) for the country maps, built in the set's
# shared look (../toon.py): the great brick building, its walls banded with blue tilework, round
# towers at its corners, the huge portal at the front left unfinished with its wooden beams still
# sticking out, and the giant turquoise ribbed dome on its drum behind, with a smaller dome beside.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P yasawi.py -- yasawi-1024.png 1024 yasawi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'paving': toon('paving', '#e3d3b0', lift=0.25),
    'brick': toon('brick', '#d2b07e', shadow_mul=(0.84, 0.74, 0.7)),
    'brickDark': toon('brickDark', '#b8935e', shadow_mul=(0.84, 0.74, 0.7)),
    'tile': toon('tile', '#2f6fb8', shadow_mul=(0.72, 0.74, 0.86)),
    'turq': toon('turq', '#3fbcc4', shadow_mul=(0.72, 0.84, 0.88), lift=0.3),
    'turqDark': toon('turqDark', '#2c9aa6', shadow_mul=(0.72, 0.84, 0.88), lift=0.3),
    'recess': flat('recess', '#3a2e28'),
    'beam': toon('beam', '#6b4a33'),
    'lawn': toon('lawn', '#7cc061', lift=0.25),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def ribbed(name, a, b, x, y, z0, profile, ribs=16):
    n = ribs * 2
    bm = bmesh.new()
    rings = [[bm.verts.new((x + r * math.cos(2 * math.pi * k / n), y + r * math.sin(2 * math.pi * k / n), z0 + h)) for k in range(n)] for r, h in profile]
    for i in range(len(rings) - 1):
        for k in range(n):
            f = bm.faces.new((rings[i][k], rings[i][(k + 1) % n], rings[i + 1][(k + 1) % n], rings[i + 1][k]))
            f.material_index = k % 2
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (a, b, toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.024, 1.0, True, False, 2


def pointed_arch(name, mat, a, h1, y0, y1, z0, x):
    left = [(x + a + 2 * a * math.cos(t), z0 + h1 + 2 * a * math.sin(t)) for t in (math.pi - (math.pi / 3) * k / 6 for k in range(7))]
    pts = [(x - a, z0), (x + a, z0)] + [(2 * x - px, pz) for px, pz in left] + list(reversed(left))[1:]
    loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=0)


# ---------- lawns and trees round the square ----------
for k, (x, y, w, d) in enumerate(((-0.92, -0.55, 0.36, 0.5), (0.92, -0.55, 0.36, 0.5))):
    box(f'lawn{k}', M['lawn'], x, y, G - 0.005, w, d, 0.015, outline=0.01, bevel=0)
    for j in range(2):
        ball(f'tree{k}{j}', M['tree'], x, y - 0.12 + j * 0.24, G + 0.14, 0.09, outline=0.016)

# ---------- the body of the mausoleum ----------
BX, BY, BW, BD, BH = 0.0, 0.25, 1.0, 0.7, 0.34
FY = BY - BD / 2
box('body', M['brick'], BX, BY, G - 0.005, BW, BD, BH, outline=0.026, bevel=0.003)
for k, z in enumerate((0.08, 0.2, 0.3)):
    box(f'tileband{k}', M['tile'], BX, FY - 0.004, G + z, BW, 0.01, 0.022, outline=0, bevel=0)
for side in (-1, 1):
    for k, z in enumerate((0.08, 0.2, 0.3)):
        box(f'sideband{side}{k}', M['tile'], BX + side * (BW / 2 + 0.004), BY, G + z, 0.01, BD, 0.022, outline=0, bevel=0)
for k in range(6):
    x = BX - BW / 2 + 0.08 + k * (BW - 0.16) / 5
    if abs(x - BX) < 0.2:
        continue
    pointed_arch(f'niche{k}', M['recess'], 0.03, 0.06, FY - 0.008, FY + 0.002, G + 0.11, x)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'cornertower{sx}{sy}', M['brickDark'], ((0.07, 0), (0.06, BH + 0.05)), G - 0.005, BX + sx * BW / 2, BY + sy * BD / 2, segs=16, outline=0.016)

# ---------- the great unfinished portal ----------
PW, PH = 0.5, 0.78
box('portal', M['brick'], BX, FY - 0.04, G - 0.005, PW, 0.14, PH, outline=0.026, bevel=0.003)
box('portalframe', M['tile'], BX, FY - 0.112, G + 0.04, PW - 0.06, 0.01, PH - 0.12, outline=0, bevel=0)
pointed_arch('portalarch', M['recess'], 0.14, PH * 0.38, FY - 0.125, FY - 0.115, G + 0.04, BX)
for side in (-1, 1):
    lathe(f'portaltower{side}', M['brickDark'], ((0.06, 0), (0.05, PH + 0.04)), G - 0.005, BX + side * (PW / 2), FY - 0.06, segs=14, outline=0.014)
# the wooden beams left sticking out of the unfinished portal's top
for k in range(7):
    x = BX - PW / 2 + 0.06 + k * (PW - 0.12) / 6
    for row, z in enumerate((PH - 0.08, PH - 0.2)):
        rod(f'beam{k}{row}', M['beam'], (x, FY - 0.1, G + z), (x, FY - 0.2, G + z), 0.009, segs=6, outline=0.003)

# ---------- the giant ribbed dome behind, and the smaller one ----------
DX, DY = BX + 0.05, BY + 0.12
lathe('drum', M['tile'], ((0.2, 0), (0.2, 0.14)), G + BH - 0.005, DX, DY, segs=32, outline=0.02)
lathe('drumband', M['brickDark'], ((0.205, 0), (0.205, 0.03)), G + BH + 0.05, DX, DY, segs=32, outline=0)
ribbed('dome', M['turq'], M['turqDark'], DX, DY, G + BH + 0.135,
       [(r * 1.0, h * 1.0) for r, h in ((0.2, 0), (0.24, 0.08), (0.24, 0.18), (0.2, 0.3), (0.12, 0.38), (0.005, 0.42))])
rod('finial', M['gold'], (DX, DY, G + BH + 0.55), (DX, DY, G + BH + 0.63), 0.008, segs=6, outline=0)
EX, EY = BX - 0.3, BY + 0.15
lathe('drum2', M['tile'], ((0.1, 0), (0.1, 0.08)), G + BH - 0.005, EX, EY, segs=24, outline=0.014)
ribbed('dome2', M['turq'], M['turqDark'], EX, EY, G + BH + 0.075, ((0.1, 0), (0.12, 0.05), (0.11, 0.1), (0.06, 0.16), (0.004, 0.18)), ribs=12)

turn(before, -20)
render(G)
