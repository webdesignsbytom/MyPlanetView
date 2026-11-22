# A cartoon Bagan for the country maps, built in the set's shared look (../toon.py) on a tile of
# dry plain: a great red-brick temple of stepped terraces with corner stupas and a gilded spire,
# bell-shaped brick stupas scattered round it, a few trees, and hot-air balloons in striped
# colours floating above.
# Run: blender -b --factory-startup -P bagan.py -- bagan-1024.png 1024 bagan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'plain': toon('plain', '#a9b46a', lift=0.25),
    'brick': toon('brick', '#b8674a'),
    'brickDark': toon('brickDark', '#9a5440'),
    'window': flat('window', '#4a2f2a'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5238'),
    'red': toon('red', '#e0453a'), 'white': toon('white', '#f4f1ea', shadow_mul=(0.82, 0.82, 0.92)),
    'yellow': toon('yellow', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)), 'blue': toon('blue', '#4f86d8', shadow_mul=(0.72, 0.72, 0.82)),
    'basket': toon('basket', '#8a6a4a'),
})

G = tile(M['plain'])
BELL = ((0.06, 0), (0.07, 0.03), (0.068, 0.07), (0.05, 0.11), (0.024, 0.14), (0.01, 0.15))


def stupa(name, x, y, s, z0=G - 0.005):
    box(name + 'base', M['brickDark'], x, y, z0, 0.16 * s, 0.16 * s, 0.05 * s, outline=0.015, bevel=0.004)
    lathe(name, M['brick'], tuple((r * s, h * s) for r, h in BELL), z0 + 0.05 * s, x, y, segs=20, outline=0.018)
    rod(name + 'hti', M['gold'], (x, y, z0 + 0.19 * s), (x, y, z0 + 0.27 * s), 0.012 * s, r2=0.002, segs=8, outline=0.008)


# ---------- the great temple ----------
z = G - 0.005
for k, (side, h) in enumerate(((0.86, 0.16), (0.68, 0.14), (0.5, 0.12))):
    box(f'terrace{k}', M['brick'] if k % 2 == 0 else M['brickDark'], 0, 0.15, z, side, side, h, outline=0.028, bevel=0.006)
    for sx in (-1, 1):
        for sy in (-1, 1):
            stupa(f'corner{k}{sx}{sy}', sx * (side / 2 - 0.05), 0.15 + sy * (side / 2 - 0.05), 0.5, z + h)
    z += h


def doorways(i, a, at):
    x, y = at(0, -0.43 - 0.006)
    box(f'door{i}', M['window'], x, 0.15 + y, G + 0.02, 0.09, 0.02, 0.12, rot_z=a, outline=0, bevel=0)


each_side(doorways)
lathe('shikhara', M['brick'], ((0.17, 0), (0.15, 0.12), (0.12, 0.22), (0.08, 0.32), (0.04, 0.4), (0.012, 0.46)), z, 0, 0.15,
      segs=8, outline=0.025, smooth=False)
rod('spire', M['gold'], (0, 0.15, z + 0.44), (0, 0.15, z + 0.62), 0.022, r2=0.003, segs=10, outline=0.012)

# ---------- stupas and trees on the plain ----------
for k, (x, y, s) in enumerate(((-0.82, -0.32, 1.0), (0.78, -0.42, 0.9), (-0.6, -0.82, 0.8), (0.55, -0.92, 0.75),
                               (0.98, 0.25, 0.85), (-1.02, 0.4, 0.8))):
    stupa(f'stupa{k}', x, y, s)
for k, (x, y) in enumerate(((-0.25, -0.88), (0.12, -1.05), (1.08, -0.1))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.1), 0.02, segs=8, outline=0.012)
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.09, outline=0.02)


# ---------- hot-air balloons ----------
ENVELOPE = ((0.02, 0.0), (0.06, 0.03), (0.11, 0.09), (0.135, 0.16), (0.13, 0.23), (0.1, 0.29), (0.05, 0.325), (0.004, 0.335))


def balloon(name, a, b, x, y, z0, s):
    n = 24
    bm = bmesh.new()
    rings = [[bm.verts.new((x + r * s * math.cos(2 * math.pi * k / n), y + r * s * math.sin(2 * math.pi * k / n), z0 + h * s))
              for k in range(n)] for r, h in ENVELOPE]
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
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.025 * s, 1.0, True, False, 2
    box(name + 'basket', M['basket'], x, y, z0 - 0.1 * s, 0.05 * s, 0.05 * s, 0.04 * s, outline=0.01, bevel=0)
    for dx in (-0.02, 0.02):
        rod(name + f'rope{dx}', M['basket'], (x + dx * s, y, z0 - 0.06 * s), (x + dx * 1.6 * s, y, z0 + 0.01 * s), 0.003, segs=4,
            outline=0)


balloon('balloon0', M['red'], M['white'], -0.62, -0.05, G + 1.02, 1.0)
balloon('balloon1', M['yellow'], M['red'], 0.66, 0.32, G + 1.22, 0.9)
balloon('balloon2', M['blue'], M['yellow'], 0.12, 0.72, G + 1.42, 0.75)

render(G)
